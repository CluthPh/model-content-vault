# Refatoração e Otimização — Yakuza Mentory

Plano completo dividido em 6 etapas independentes. Cada etapa é entregável isoladamente e pode ser aprovada/executada em ordem.

---

## Etapa 1 — Fundação de dados e cache

Objetivo: eliminar chamadas duplicadas ao Supabase e centralizar acesso a dados.

- Introduzir React Query (`@tanstack/react-query` já instalado) como camada única de fetch.
- Criar `src/hooks/queries/` com hooks tipados:
  - `useModules`, `useModule(id)`, `useModuleContents(id)`
  - `useUsers`, `useUserAccess`, `useRoles`
  - `usePlatformSettings`
- Substituir todos os `useEffect + supabase.from(...)` das páginas por esses hooks.
- Invalidations centralizadas após mutações (criar/editar/excluir).
- Resultado: menos flicker, menos requisições, código de página ~40% menor.

## Etapa 2 — Camada de mídia unificada

Objetivo: URLs assinadas confiáveis e reaproveitadas.

- Expandir `src/lib/media.ts` com:
  - Cache em memória de URLs assinadas (TTL 50 min).
  - `useSignedUrl(path)` hook com Suspense-friendly loading.
  - Helpers `resolveModuleCover`, `resolveContentMedia` únicos.
- Remover lógica duplicada em `Dashboard`, `ModuleView`, `AdminModules`, `AdminModuleContents`.
- Fallbacks e estados de erro padronizados.

## Etapa 3 — Componentização e design system

Objetivo: reduzir duplicação visual.

- Extrair componentes reutilizáveis:
  - `PageHeader` (título + subtítulo + ações) usado em todas as páginas admin.
  - `EmptyState`, `LoadingState`, `ErrorState`.
  - `MediaThumb`, `ModuleCard`, `ContentBlock` (renderiza cada `content_type`).
  - `UserRow` para `AdminUsers`.
- Consolidar tokens: revisar `index.css` para remover cores/sombras não usadas e nomear semanticamente (`--surface-1`, `--surface-2`, `--accent`, `--accent-strong`).
- Garantir 100% dos componentes lendo tokens (nenhum `#hex` ou `text-white` hardcoded).

## Etapa 4 — Autenticação e roteamento

Objetivo: fluxo previsível e sem “travas” de loading.

- Refatorar `src/lib/auth.tsx`:
  - Separar `session`, `profile`, `role` em slices; loading independente por slice.
  - `onAuthStateChange` sem `setTimeout`; usar deferred query via React Query.
- Criar `<RequireAuth>` e `<RequireAdmin>` em vez do `Protected` inline em `App.tsx`.
- Layout de rotas com `Outlet` (`/app/*` e `/admin/*` como layouts pais) para carregar `AppLayout` uma vez.
- Rota `/` redireciona direto para `/login` ou `/app` conforme sessão + age-gate.

## Etapa 5 — Formulários, validação e feedback

Objetivo: robustez em admin.

- Adotar `react-hook-form` + `zod` (já no projeto) em:
  - `AdminUsers` (criar aluno)
  - `AdminModules` (CRUD módulo)
  - `AdminModuleContents` (CRUD conteúdo, validação por `content_type`)
  - `AdminSettings`
- Schemas em `src/lib/schemas/` compartilhados com a Edge Function quando possível.
- Toasts padronizados via wrapper `notify.success/error`.
- Botões de submit com estado `pending` e desabilitados durante requisição.

## Etapa 6 — Performance, segurança e qualidade

Objetivo: preparar para produção.

- Code-splitting por rota com `React.lazy` + `Suspense` (admin isolado do bundle público).
- Imagens: `loading="lazy"`, dimensões explícitas, `content-visibility: auto` em grades longas.
- Reduzir `MoneyBackground`: respeitar `prefers-reduced-motion`, pausar quando aba oculta, reduzir para ~8 notas em mobile.
- Rodar `supabase--linter` e corrigir avisos (search_path, policies redundantes, grants faltando).
- Revisar Edge Function `admin-create-user`: rate-limit simples, logs estruturados, validação Zod.
- ESLint estrito: proibir `any`, `console.log` em produção, imports não usados.
- Configurar testes mínimos com Vitest para `has_role`, `media.ts`, e guards de rota.

---

## Diagrama do fluxo alvo

```text
       ┌────────────┐
UI ──▶ │ React Query│──▶ supabase-js ──▶ Supabase
       └────────────┘
             │
             ▼
       Cache + Invalidations
             │
             ▼
       Media Layer (signed URLs, TTL)
```

## Detalhes técnicos

- Sem mudanças de schema no banco; apenas ajustes de policies/grants se o linter apontar.
- Nenhuma alteração de funcionalidade visível ao usuário final; apenas melhor UX (loading, erros, velocidade).
- Cada etapa é um PR mental independente — se você aprovar só as etapas 1–3, o app segue funcionando.

## Ordem recomendada de execução

1 → 2 → 4 → 3 → 5 → 6. As etapas 1, 2 e 4 destravam ganhos maiores; 3 e 5 melhoram DX; 6 é polimento final.

Aprove para eu começar pela **Etapa 1**, ou me diga se prefere outra ordem / recortar o escopo.
