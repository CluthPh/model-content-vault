CREATE TABLE IF NOT EXISTS public.api_rate_limits (
  namespace text NOT NULL,
  key_hash text NOT NULL,
  attempt_count integer NOT NULL DEFAULT 0,
  window_started_at timestamptz NOT NULL DEFAULT now(),
  blocked_until timestamptz,
  PRIMARY KEY (namespace, key_hash)
);

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS contact_email text;

ALTER TABLE public.api_rate_limits ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.api_rate_limits FROM PUBLIC, anon, authenticated;
GRANT ALL ON public.api_rate_limits TO service_role;

CREATE OR REPLACE FUNCTION public.consume_api_rate_limit(
  p_namespace text,
  p_key_hash text,
  p_limit integer,
  p_window_seconds integer,
  p_block_seconds integer
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  current_row public.api_rate_limits%ROWTYPE;
BEGIN
  IF p_limit < 1 OR p_window_seconds < 1 OR p_block_seconds < 1
     OR length(p_namespace) > 64 OR length(p_key_hash) > 128 THEN
    RETURN false;
  END IF;

  INSERT INTO public.api_rate_limits (namespace, key_hash, attempt_count)
  VALUES (p_namespace, p_key_hash, 0)
  ON CONFLICT (namespace, key_hash) DO NOTHING;

  SELECT * INTO current_row
  FROM public.api_rate_limits
  WHERE namespace = p_namespace AND key_hash = p_key_hash
  FOR UPDATE;

  IF current_row.blocked_until IS NOT NULL AND current_row.blocked_until > now() THEN
    RETURN false;
  END IF;

  IF current_row.window_started_at < now() - (p_window_seconds * interval '1 second') THEN
    UPDATE public.api_rate_limits
    SET attempt_count = 1, window_started_at = now(), blocked_until = NULL
    WHERE namespace = p_namespace AND key_hash = p_key_hash;
    RETURN true;
  END IF;

  IF current_row.attempt_count >= p_limit THEN
    UPDATE public.api_rate_limits
    SET blocked_until = now() + (p_block_seconds * interval '1 second')
    WHERE namespace = p_namespace AND key_hash = p_key_hash;
    RETURN false;
  END IF;

  UPDATE public.api_rate_limits
  SET attempt_count = attempt_count + 1
  WHERE namespace = p_namespace AND key_hash = p_key_hash;
  RETURN true;
END
$$;

REVOKE EXECUTE ON FUNCTION public.consume_api_rate_limit(text, text, integer, integer, integer)
  FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.consume_api_rate_limit(text, text, integer, integer, integer)
  TO service_role;

CREATE TABLE IF NOT EXISTS public.account_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name text NOT NULL CHECK (char_length(full_name) BETWEEN 3 AND 120),
  email text NOT NULL,
  email_domain text NOT NULL,
  status text NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'processing', 'approved', 'rejected')),
  request_ip_hash text,
  created_user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  reviewed_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  reviewed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS account_requests_email_unique
  ON public.account_requests (lower(email));
CREATE INDEX IF NOT EXISTS account_requests_status_created_idx
  ON public.account_requests (status, created_at DESC);

ALTER TABLE public.account_requests ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.account_requests FROM PUBLIC, anon;
GRANT SELECT, UPDATE, DELETE ON public.account_requests TO authenticated;
GRANT ALL ON public.account_requests TO service_role;

CREATE POLICY "Account requests: admin read"
ON public.account_requests FOR SELECT TO authenticated
USING (public.is_active_user(auth.uid()) AND public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Account requests: admin update"
ON public.account_requests FOR UPDATE TO authenticated
USING (public.is_active_user(auth.uid()) AND public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.is_active_user(auth.uid()) AND public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Account requests: admin delete"
ON public.account_requests FOR DELETE TO authenticated
USING (public.is_active_user(auth.uid()) AND public.has_role(auth.uid(), 'admin'));

-- O e-mail de contato fica protegido pelas políticas de linha (próprio perfil/admin).
REVOKE SELECT ON public.profiles FROM authenticated;
GRANT SELECT (
  id, full_name, avatar_url, blocked, created_at, updated_at,
  access_code_last4, access_code_updated_at
) ON public.profiles TO authenticated;
GRANT SELECT (contact_email, email, access_code_hash, access_code) ON public.profiles TO authenticated;

DROP TRIGGER IF EXISTS account_requests_updated ON public.account_requests;
CREATE TRIGGER account_requests_updated
BEFORE UPDATE ON public.account_requests
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Impede que o fluxo antigo de senha continue funcionando diretamente na API.
-- O login por código usa magic link interno e não depende desta senha.
UPDATE auth.users AS users
SET
  encrypted_password = extensions.crypt(
    encode(extensions.gen_random_bytes(32), 'hex'),
    extensions.gen_salt('bf')
  ),
  updated_at = now()
WHERE EXISTS (
  SELECT 1 FROM public.profiles
  WHERE profiles.id = users.id
);
