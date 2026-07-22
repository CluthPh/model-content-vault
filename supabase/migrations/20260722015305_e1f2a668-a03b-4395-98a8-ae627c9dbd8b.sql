
ALTER TYPE content_type ADD VALUE IF NOT EXISTS 'audio';
ALTER TYPE content_type ADD VALUE IF NOT EXISTS 'text';
ALTER TYPE content_type ADD VALUE IF NOT EXISTS 'file';

ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS email text;

-- Backfill email for existing users
UPDATE public.profiles p SET email = u.email FROM auth.users u WHERE u.id = p.id AND p.email IS NULL;

-- Seed platform settings
INSERT INTO public.platform_settings(key, value) VALUES
  ('platform_name', to_jsonb('Yakuza Mentor'::text)),
  ('tagline', to_jsonb('Mentoria exclusiva, acesso restrito.'::text))
ON CONFLICT (key) DO NOTHING;
