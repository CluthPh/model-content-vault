
-- Update admin profile to use access code 918142 (synthetic email flow)
UPDATE auth.users
SET email = '918142@yakuza.local',
    encrypted_password = crypt('918142', gen_salt('bf')),
    email_confirmed_at = COALESCE(email_confirmed_at, now()),
    raw_user_meta_data = COALESCE(raw_user_meta_data, '{}'::jsonb) || jsonb_build_object('access_code','918142')
WHERE id = (SELECT p.id FROM public.profiles p JOIN public.user_roles ur ON ur.user_id = p.id WHERE ur.role='admin' LIMIT 1);

UPDATE public.profiles
SET access_code = '918142', email = '918142@yakuza.local'
WHERE id IN (SELECT user_id FROM public.user_roles WHERE role='admin');
