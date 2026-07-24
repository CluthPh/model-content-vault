CREATE EXTENSION IF NOT EXISTS pgcrypto WITH SCHEMA extensions;

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS access_code_hash text,
  ADD COLUMN IF NOT EXISTS access_code_last4 text,
  ADD COLUMN IF NOT EXISTS access_code_updated_at timestamptz;

UPDATE public.profiles
SET
  access_code_hash = encode(
    extensions.digest(
      lower(regexp_replace(access_code, '[^a-zA-Z0-9]', '', 'g')),
      'sha256'
    ),
    'hex'
  ),
  access_code_last4 = right(access_code, 4),
  access_code_updated_at = now()
WHERE access_code IS NOT NULL
  AND access_code_hash IS NULL;

UPDATE auth.users
SET raw_user_meta_data = COALESCE(raw_user_meta_data, '{}'::jsonb) - 'access_code'
WHERE raw_user_meta_data ? 'access_code';

UPDATE public.profiles SET access_code = NULL WHERE access_code IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS profiles_access_code_hash_unique
  ON public.profiles (access_code_hash)
  WHERE access_code_hash IS NOT NULL;

-- Alunos só podem editar campos públicos do próprio perfil. Campos de segurança
-- são alterados exclusivamente pelas Edge Functions com service role.
REVOKE INSERT, UPDATE, DELETE ON public.profiles FROM authenticated;
GRANT UPDATE (full_name, avatar_url) ON public.profiles TO authenticated;

CREATE OR REPLACE FUNCTION public.is_active_user(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = _user_id AND blocked = false
  )
$$;

REVOKE EXECUTE ON FUNCTION public.is_active_user(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.is_active_user(uuid) TO authenticated, service_role;

DROP POLICY IF EXISTS "Modules: active visible by access" ON public.modules;
CREATE POLICY "Modules: active users see allowed"
ON public.modules FOR SELECT TO authenticated
USING (
  public.is_active_user(auth.uid())
  AND (
    public.has_role(auth.uid(), 'admin')
    OR (
      active = true
      AND (locked = false OR public.user_has_module_access(auth.uid(), id))
    )
  )
);

DROP POLICY IF EXISTS "Contents: active module visible by access" ON public.module_contents;
CREATE POLICY "Contents: active users see allowed"
ON public.module_contents FOR SELECT TO authenticated
USING (
  public.is_active_user(auth.uid())
  AND (
    public.has_role(auth.uid(), 'admin')
    OR (
      published = true
      AND EXISTS (
        SELECT 1
        FROM public.modules m
        WHERE m.id = module_contents.module_id
          AND m.active = true
          AND (m.locked = false OR public.user_has_module_access(auth.uid(), m.id))
      )
    )
  )
);

DROP POLICY IF EXISTS "Access: own read" ON public.module_access;
CREATE POLICY "Access: active own read"
ON public.module_access FOR SELECT TO authenticated
USING (
  public.is_active_user(auth.uid())
  AND (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'))
);

DROP POLICY IF EXISTS "mentor-media read auth" ON storage.objects;
DROP POLICY IF EXISTS "mentor-media admin insert" ON storage.objects;
DROP POLICY IF EXISTS "mentor-media admin update" ON storage.objects;
DROP POLICY IF EXISTS "mentor-media admin delete" ON storage.objects;

CREATE POLICY "mentor-media active admin insert"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'mentor-media'
  AND public.is_active_user(auth.uid())
  AND public.has_role(auth.uid(), 'admin')
);

CREATE POLICY "mentor-media active admin update"
ON storage.objects FOR UPDATE TO authenticated
USING (
  bucket_id = 'mentor-media'
  AND public.is_active_user(auth.uid())
  AND public.has_role(auth.uid(), 'admin')
)
WITH CHECK (
  bucket_id = 'mentor-media'
  AND public.is_active_user(auth.uid())
  AND public.has_role(auth.uid(), 'admin')
);

CREATE POLICY "mentor-media active admin delete"
ON storage.objects FOR DELETE TO authenticated
USING (
  bucket_id = 'mentor-media'
  AND public.is_active_user(auth.uid())
  AND public.has_role(auth.uid(), 'admin')
);

INSERT INTO storage.buckets (id, name, public, file_size_limit)
VALUES ('mentor-media', 'mentor-media', false, 262144000)
ON CONFLICT (id) DO UPDATE
SET public = false, file_size_limit = EXCLUDED.file_size_limit;

CREATE TABLE IF NOT EXISTS public.access_login_rate_limits (
  key_hash text PRIMARY KEY,
  attempt_count integer NOT NULL DEFAULT 0,
  window_started_at timestamptz NOT NULL DEFAULT now(),
  blocked_until timestamptz
);
ALTER TABLE public.access_login_rate_limits ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.access_login_rate_limits FROM PUBLIC, anon, authenticated;
GRANT ALL ON public.access_login_rate_limits TO service_role;

CREATE OR REPLACE FUNCTION public.consume_access_login_attempt(p_key_hash text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  current_row public.access_login_rate_limits%ROWTYPE;
BEGIN
  INSERT INTO public.access_login_rate_limits (key_hash, attempt_count)
  VALUES (p_key_hash, 0)
  ON CONFLICT (key_hash) DO NOTHING;

  SELECT * INTO current_row
  FROM public.access_login_rate_limits
  WHERE key_hash = p_key_hash
  FOR UPDATE;

  IF current_row.blocked_until IS NOT NULL AND current_row.blocked_until > now() THEN
    RETURN false;
  END IF;

  IF current_row.window_started_at < now() - interval '15 minutes' THEN
    UPDATE public.access_login_rate_limits
    SET attempt_count = 1, window_started_at = now(), blocked_until = NULL
    WHERE key_hash = p_key_hash;
    RETURN true;
  END IF;

  IF current_row.attempt_count >= 9 THEN
    UPDATE public.access_login_rate_limits
    SET attempt_count = attempt_count + 1, blocked_until = now() + interval '15 minutes'
    WHERE key_hash = p_key_hash;
    RETURN false;
  END IF;

  UPDATE public.access_login_rate_limits
  SET attempt_count = attempt_count + 1
  WHERE key_hash = p_key_hash;
  RETURN true;
END
$$;

REVOKE EXECUTE ON FUNCTION public.consume_access_login_attempt(text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.consume_access_login_attempt(text) TO service_role;
