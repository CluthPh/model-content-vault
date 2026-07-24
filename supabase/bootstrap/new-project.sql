-- Bootstrap seguro para um projeto Supabase vazio.
-- Execute uma única vez no SQL Editor antes de publicar as Edge Functions.

BEGIN;

CREATE EXTENSION IF NOT EXISTS pgcrypto WITH SCHEMA extensions;

DO $$ BEGIN
  CREATE TYPE public.app_role AS ENUM ('admin', 'user');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE public.content_type AS ENUM ('photo', 'video', 'audio', 'text', 'file');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TABLE IF NOT EXISTS public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name text,
  avatar_url text,
  email text,
  contact_email text,
  access_code text,
  access_code_hash text,
  access_code_last4 text,
  access_code_updated_at timestamptz,
  blocked boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS profiles_access_code_hash_unique
  ON public.profiles (access_code_hash)
  WHERE access_code_hash IS NOT NULL;

CREATE TABLE IF NOT EXISTS public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);

CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

CREATE OR REPLACE FUNCTION public.is_active_user(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.profiles
    WHERE id = _user_id AND blocked = false
  )
$$;

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, email, contact_email)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'contact_email', NEW.email)
  )
  ON CONFLICT (id) DO NOTHING;

  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'user')
  ON CONFLICT (user_id, role) DO NOTHING;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

CREATE TABLE IF NOT EXISTS public.modules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text,
  cover_url text,
  order_index integer NOT NULL DEFAULT 0,
  active boolean NOT NULL DEFAULT true,
  locked boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.module_access (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  module_id uuid NOT NULL REFERENCES public.modules(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (module_id, user_id)
);

CREATE OR REPLACE FUNCTION public.user_has_module_access(_user_id uuid, _module_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.module_access
    WHERE user_id = _user_id AND module_id = _module_id
  )
$$;

CREATE TABLE IF NOT EXISTS public.module_contents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  module_id uuid NOT NULL REFERENCES public.modules(id) ON DELETE CASCADE,
  type public.content_type NOT NULL,
  title text,
  body text,
  media_url text,
  external_url text,
  order_index integer NOT NULL DEFAULT 0,
  published boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.platform_settings (
  key text PRIMARY KEY,
  value jsonb NOT NULL,
  updated_at timestamptz NOT NULL DEFAULT now()
);

INSERT INTO public.platform_settings (key, value)
VALUES
  ('platform_name', to_jsonb('Yakuza Mentory'::text)),
  ('tagline', to_jsonb('Mentoria exclusiva, acesso restrito.'::text)),
  ('terms', to_jsonb('Termos de uso da plataforma Yakuza Mentory.'::text)),
  ('privacy', to_jsonb('Política de privacidade da plataforma Yakuza Mentory.'::text)),
  ('adult_notice', to_jsonb('Conteúdo destinado exclusivamente a maiores de 18 anos.'::text))
ON CONFLICT (key) DO NOTHING;

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

CREATE TABLE IF NOT EXISTS public.api_rate_limits (
  namespace text NOT NULL,
  key_hash text NOT NULL,
  attempt_count integer NOT NULL DEFAULT 0,
  window_started_at timestamptz NOT NULL DEFAULT now(),
  blocked_until timestamptz,
  PRIMARY KEY (namespace, key_hash)
);

CREATE INDEX IF NOT EXISTS api_rate_limits_window_idx
  ON public.api_rate_limits (window_started_at);

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

  SELECT *
  INTO current_row
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
END;
$$;

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.modules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.module_access ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.module_contents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.platform_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.account_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.api_rate_limits ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON public.profiles FROM PUBLIC, anon, authenticated;
GRANT SELECT (
  id, full_name, avatar_url, blocked, created_at, updated_at,
  access_code_last4, access_code_updated_at
) ON public.profiles TO authenticated;
GRANT UPDATE (full_name, avatar_url) ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;

REVOKE ALL ON public.user_roles FROM PUBLIC, anon, authenticated;
GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;

REVOKE ALL ON public.modules FROM PUBLIC, anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.modules TO authenticated;
GRANT ALL ON public.modules TO service_role;

REVOKE ALL ON public.module_access FROM PUBLIC, anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.module_access TO authenticated;
GRANT ALL ON public.module_access TO service_role;

REVOKE ALL ON public.module_contents FROM PUBLIC, anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.module_contents TO authenticated;
GRANT ALL ON public.module_contents TO service_role;

REVOKE ALL ON public.platform_settings FROM PUBLIC, anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.platform_settings TO authenticated;
GRANT ALL ON public.platform_settings TO service_role;

REVOKE ALL ON public.account_requests FROM PUBLIC, anon, authenticated;
GRANT SELECT, UPDATE, DELETE ON public.account_requests TO authenticated;
GRANT ALL ON public.account_requests TO service_role;

REVOKE ALL ON public.api_rate_limits FROM PUBLIC, anon, authenticated;
GRANT ALL ON public.api_rate_limits TO service_role;

CREATE POLICY "Profiles: own or admin read"
ON public.profiles FOR SELECT TO authenticated
USING (auth.uid() = id OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Profiles: own public fields update"
ON public.profiles FOR UPDATE TO authenticated
USING (
  public.is_active_user(auth.uid())
  AND (auth.uid() = id OR public.has_role(auth.uid(), 'admin'))
)
WITH CHECK (
  public.is_active_user(auth.uid())
  AND (auth.uid() = id OR public.has_role(auth.uid(), 'admin'))
);

CREATE POLICY "Roles: own or admin read"
ON public.user_roles FOR SELECT TO authenticated
USING (
  public.is_active_user(auth.uid())
  AND (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'))
);

CREATE POLICY "Modules: active users see allowed"
ON public.modules FOR SELECT TO authenticated
USING (
  public.is_active_user(auth.uid())
  AND (
    public.has_role(auth.uid(), 'admin')
    OR (active = true AND (locked = false OR public.user_has_module_access(auth.uid(), id)))
  )
);

CREATE POLICY "Modules: admin manage"
ON public.modules FOR ALL TO authenticated
USING (public.is_active_user(auth.uid()) AND public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.is_active_user(auth.uid()) AND public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Access: active own read"
ON public.module_access FOR SELECT TO authenticated
USING (
  public.is_active_user(auth.uid())
  AND (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'))
);

CREATE POLICY "Access: admin manage"
ON public.module_access FOR ALL TO authenticated
USING (public.is_active_user(auth.uid()) AND public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.is_active_user(auth.uid()) AND public.has_role(auth.uid(), 'admin'));

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
        FROM public.modules AS module
        WHERE module.id = module_contents.module_id
          AND module.active = true
          AND (
            module.locked = false
            OR public.user_has_module_access(auth.uid(), module.id)
          )
      )
    )
  )
);

CREATE POLICY "Contents: admin manage"
ON public.module_contents FOR ALL TO authenticated
USING (public.is_active_user(auth.uid()) AND public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.is_active_user(auth.uid()) AND public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Settings: authenticated read"
ON public.platform_settings FOR SELECT TO authenticated
USING (public.is_active_user(auth.uid()));

CREATE POLICY "Settings: admin manage"
ON public.platform_settings FOR ALL TO authenticated
USING (public.is_active_user(auth.uid()) AND public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.is_active_user(auth.uid()) AND public.has_role(auth.uid(), 'admin'));

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

DROP TRIGGER IF EXISTS profiles_updated ON public.profiles;
CREATE TRIGGER profiles_updated
BEFORE UPDATE ON public.profiles
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS modules_updated ON public.modules;
CREATE TRIGGER modules_updated
BEFORE UPDATE ON public.modules
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS module_contents_updated ON public.module_contents;
CREATE TRIGGER module_contents_updated
BEFORE UPDATE ON public.module_contents
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS platform_settings_updated ON public.platform_settings;
CREATE TRIGGER platform_settings_updated
BEFORE UPDATE ON public.platform_settings
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS account_requests_updated ON public.account_requests;
CREATE TRIGGER account_requests_updated
BEFORE UPDATE ON public.account_requests
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

REVOKE EXECUTE ON FUNCTION public.update_updated_at_column() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.update_updated_at_column() TO service_role;

REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.handle_new_user() TO service_role;

REVOKE EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) TO authenticated, service_role;

REVOKE EXECUTE ON FUNCTION public.is_active_user(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.is_active_user(uuid) TO authenticated, service_role;

REVOKE EXECUTE ON FUNCTION public.user_has_module_access(uuid, uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.user_has_module_access(uuid, uuid) TO authenticated, service_role;

REVOKE EXECUTE ON FUNCTION public.consume_api_rate_limit(text, text, integer, integer, integer)
FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.consume_api_rate_limit(text, text, integer, integer, integer)
TO service_role;

INSERT INTO storage.buckets (id, name, public, file_size_limit)
VALUES ('mentor-media', 'mentor-media', false, 262144000)
ON CONFLICT (id) DO UPDATE
SET public = false, file_size_limit = EXCLUDED.file_size_limit;

DROP POLICY IF EXISTS "mentor-media active admin insert" ON storage.objects;
DROP POLICY IF EXISTS "mentor-media active admin update" ON storage.objects;
DROP POLICY IF EXISTS "mentor-media active admin delete" ON storage.objects;

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

COMMIT;
