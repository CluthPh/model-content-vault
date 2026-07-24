# Yakuza Mentory

Plataforma privada de mentoria construída com React, Vite e Supabase.

## Publicação

Use o guia completo: [DEPLOY.md](./DEPLOY.md).

## Desenvolvimento

Requisitos: Node.js 20+ e npm.

```bash
cp .env.example .env
npm ci
npm run dev
```

Preencha no `.env` somente as variáveis públicas do projeto:

```dotenv
VITE_SUPABASE_URL=https://SEU_PROJECT_REF.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=SUA_CHAVE_PUBLICAVEL
VITE_TURNSTILE_SITE_KEY=SUA_SITE_KEY_DO_TURNSTILE
```

Nunca coloque `SUPABASE_SERVICE_ROLE_KEY` no frontend ou no Cloudflare Pages. Ela é
disponibilizada automaticamente apenas dentro das Edge Functions do Supabase.

## Publicar o backend no Supabase

Instale a Supabase CLI, autentique e execute:

```bash
supabase link --project-ref jzxaxnaytrjcctgnttfx
supabase db push
supabase functions deploy admin-create-user
supabase functions deploy admin-manage-user
supabase functions deploy login-with-code --no-verify-jwt
supabase functions deploy media-url
supabase functions deploy request-access --no-verify-jwt
```

No painel do Supabase, em **Authentication > URL Configuration**, defina:

- Site URL: `https://yakuzamentory.online`
- Redirect URLs: `https://yakuzamentory.online/**`,
  `https://www.yakuzamentory.online/**` e a URL temporária `https://*.pages.dev/**`

Depois do primeiro deploy, entre como administrador e use **Alunos > Renovar código**
na própria conta. Isso invalida a credencial antiga que esteve no histórico do Git.

## Publicar grátis no Cloudflare Pages

Crie um projeto Pages conectado ao repositório com:

| Campo | Valor |
|---|---|
| Framework preset | Vite |
| Build command | `npm run build` |
| Build output directory | `dist` |
| Node version | `20` |

Cadastre `VITE_SUPABASE_URL` e `VITE_SUPABASE_PUBLISHABLE_KEY` em
**Settings > Environment variables**. Em **Custom domains**, adicione
`yakuzamentory.online` e `www.yakuzamentory.online`; escolha um deles como principal
e redirecione o outro.

O arquivo `public/_headers` aplica CSP, HSTS e outras proteções no Pages. Vídeos e
arquivos privados permanecem no bucket privado do Supabase; não os coloque na pasta
`public`.

## Verificações

```bash
npm run lint
npm test
npm run build
npm audit --omit=dev
```
