-- Corrigir nomes persistidos da plataforma
UPDATE public.platform_settings
SET value = to_jsonb('Yakuza Mentory'::text), updated_at = now()
WHERE key = 'platform_name';

UPDATE public.platform_settings
SET value = to_jsonb('Termos de uso da plataforma Yakuza Mentory.'::text), updated_at = now()
WHERE key = 'terms';

UPDATE public.platform_settings
SET value = to_jsonb('Política de privacidade da plataforma Yakuza Mentory.'::text), updated_at = now()
WHERE key = 'privacy';

-- Garantir papel padrão para perfis já existentes que foram criados sem trigger
INSERT INTO public.user_roles (user_id, role)
SELECT p.id, 'user'::public.app_role
FROM public.profiles p
WHERE NOT EXISTS (
  SELECT 1 FROM public.user_roles ur WHERE ur.user_id = p.id
)
ON CONFLICT (user_id, role) DO NOTHING;

-- Permitir módulos publicados/desbloqueados sem liberação manual e exigir liberação apenas nos bloqueados
DROP POLICY IF EXISTS "Modules: user sees allowed active" ON public.modules;
CREATE POLICY "Modules: active visible by access" ON public.modules
FOR SELECT TO authenticated
USING (
  public.has_role(auth.uid(), 'admin')
  OR (
    active = true
    AND (
      locked = false
      OR public.user_has_module_access(auth.uid(), id)
    )
  )
);

DROP POLICY IF EXISTS "Contents: allowed" ON public.module_contents;
CREATE POLICY "Contents: active module visible by access" ON public.module_contents
FOR SELECT TO authenticated
USING (
  public.has_role(auth.uid(), 'admin')
  OR (
    published = true
    AND EXISTS (
      SELECT 1
      FROM public.modules m
      WHERE m.id = module_contents.module_id
        AND m.active = true
        AND (
          m.locked = false
          OR public.user_has_module_access(auth.uid(), m.id)
        )
    )
  )
);

-- Recriar triggers de updated_at em tabelas públicas usadas pelo app
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

-- Reduzir execução pública direta de funções internas; manter o necessário para usuários autenticados e serviço
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) TO authenticated, service_role;

REVOKE EXECUTE ON FUNCTION public.user_has_module_access(uuid, uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.user_has_module_access(uuid, uuid) TO authenticated, service_role;

REVOKE EXECUTE ON FUNCTION public.is_admin(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.is_admin(uuid) TO authenticated, service_role;

REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.handle_new_user() TO service_role;

REVOKE EXECUTE ON FUNCTION public.update_updated_at_column() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.update_updated_at_column() TO service_role;

-- Remover leitura pública do bucket antigo do projeto anterior
DROP POLICY IF EXISTS "Anyone can view media" ON storage.objects;