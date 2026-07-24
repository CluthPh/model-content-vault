# Publicação segura — Yakuza Mentory

Este guia usa **Supabase** para banco, autenticação, funções e mídia privada, e
**Cloudflare Pages** para o frontend e domínio `yakuzamentory.online`.

> Não publique o frontend antes de concluir as etapas do Supabase e do Turnstile.

## 1. Aprovar o código no GitHub

1. Abra o pull request do projeto.
2. Confira a aba **Files changed**.
3. Clique em **Ready for review**.
4. Clique em **Merge pull request**.
5. Confirme que a branch `main` contém o merge.

## 2. Criar o Turnstile no Cloudflare

1. Entre no [painel do Cloudflare](https://dash.cloudflare.com/).
2. Abra **Turnstile** e selecione **Add widget**.
3. Nome: `Yakuza Mentory`.
4. Tipo: **Managed**.
5. Adicione os hostnames:
   - `yakuzamentory.online`
   - `www.yakuzamentory.online`
   - o endereço `seu-projeto.pages.dev` quando ele existir
6. Copie a **Site key** e a **Secret key**.

Referências oficiais:

- [Configurar Turnstile](https://developers.cloudflare.com/turnstile/get-started/)
- [Validação obrigatória no servidor](https://developers.cloudflare.com/turnstile/get-started/server-side-validation/)

## 3. Publicar banco e funções no Supabase

Abra o terminal na pasta do projeto e execute:

```bash
npx supabase@latest login
npx supabase@latest link --project-ref jzxaxnaytrjcctgnttfx
npx supabase@latest db push
```

Cadastre os segredos. Troque os valores entre `<...>`:

```bash
npx supabase@latest secrets set \
  TURNSTILE_SECRET_KEY="<SECRET_KEY_DO_TURNSTILE>" \
  ADMIN_EMAIL_ALLOWLIST="<EMAIL_ADMIN_1>,<EMAIL_ADMIN_2>"
```

Opcionalmente, acrescente outros provedores proibidos:

```bash
npx supabase@latest secrets set \
  BLOCKED_EMAIL_DOMAINS="dominio-temporario.com,outro-dominio.com"
```

Publique as funções:

```bash
npx supabase@latest functions deploy admin-create-user
npx supabase@latest functions deploy admin-manage-user
npx supabase@latest functions deploy media-url
npx supabase@latest functions deploy login-with-code --no-verify-jwt
npx supabase@latest functions deploy request-access --no-verify-jwt
```

Referências oficiais:

- [Supabase CLI](https://supabase.com/docs/guides/cli/getting-started)
- [Deploy de Edge Functions](https://supabase.com/docs/guides/functions/deploy)
- [Segredos das Edge Functions](https://supabase.com/docs/guides/functions/secrets)

## 4. Configurar URLs do Supabase

No [painel do projeto Supabase](https://supabase.com/dashboard/project/jzxaxnaytrjcctgnttfx),
abra **Authentication > URL Configuration**:

- **Site URL:** `https://yakuzamentory.online`
- **Redirect URLs:**
  - `https://yakuzamentory.online/**`
  - `https://www.yakuzamentory.online/**`
  - `https://SEU-PROJETO.pages.dev/**`

Referência: [Redirect URLs do Supabase](https://supabase.com/docs/guides/auth/redirect-urls).

## 5. Criar o Cloudflare Pages

1. No Cloudflare, abra **Workers & Pages**.
2. Selecione **Create application > Pages > Connect to Git**.
3. Conecte o GitHub e escolha `CluthPh/model-content-vault`.
4. Configure:

| Campo | Valor |
|---|---|
| Production branch | `main` |
| Framework preset | `Vite` |
| Build command | `npm run build` |
| Build output directory | `dist` |
| Node.js | `22` |

5. Em **Environment variables**, adicione:

| Variável | Valor |
|---|---|
| `VITE_SUPABASE_URL` | URL pública do projeto Supabase |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | chave publicável/anon do Supabase |
| `VITE_TURNSTILE_SITE_KEY` | Site key do Turnstile |

Nunca coloque `SUPABASE_SERVICE_ROLE_KEY`, `TURNSTILE_SECRET_KEY` ou
`ADMIN_EMAIL_ALLOWLIST` no Cloudflare Pages. Esses valores ficam somente nos
segredos das Edge Functions do Supabase.

Referências oficiais:

- [Conectar Cloudflare Pages ao Git](https://developers.cloudflare.com/pages/get-started/git-integration/)
- [Deploy de React no Pages](https://developers.cloudflare.com/pages/framework-guides/deploy-a-react-site/)

## 6. Conectar o domínio

1. Dentro do projeto Pages, abra **Custom domains**.
2. Adicione `yakuzamentory.online`.
3. Adicione `www.yakuzamentory.online`.
4. Use `yakuzamentory.online` como principal e redirecione `www` para ele.
5. Confirme que o SSL está ativo e que todas as URLs abrem com `https://`.

## 7. Criar os administradores permitidos

1. Cada administrador abre:
   `https://yakuzamentory.online/solicitar-acesso`
2. Cada um envia o Gmail que foi colocado em `ADMIN_EMAIL_ALLOWLIST`.
3. O administrador atual abre **Administração > Usuários > Pedidos de acesso**.
4. Clica em **Aprovar**.
5. O sistema reconhece o e-mail permitido, cria a função de administrador e
   mostra o código uma única vez.
6. Copie e entregue o código ao respectivo administrador por um canal seguro.

Outros e-mails aprovados viram alunos comuns. Gmail é aceito, mas aliases com
pontos e `+texto` são normalizados para impedir várias solicitações para a mesma
caixa. Proton e provedores temporários conhecidos são recusados.

## 8. Teste obrigatório antes de divulgar

- [ ] Login exige Turnstile.
- [ ] Código incorreto repetido recebe bloqueio temporário.
- [ ] Pedido repetido com o mesmo e-mail não cria novas linhas.
- [ ] E-mail temporário/Proton é recusado.
- [ ] Pedido aprovado cria somente uma conta e mostra o código uma vez.
- [ ] E-mail da allowlist vira administrador.
- [ ] Aluno comum não abre `/admin`.
- [ ] Bloquear aluno encerra o acesso a módulos e arquivos.
- [ ] Link de mídia copiado expira e não funciona permanentemente.
- [ ] Excluir conteúdo remove também o arquivo privado.
- [ ] Site funciona no celular e em janela anônima.
- [ ] Código administrativo antigo foi renovado.

## Como funcionam os limites

| Endpoint | Limite |
|---|---|
| Login | 10 tentativas por IP a cada 15 minutos |
| Mesmo código | 20 tentativas a cada 15 minutos |
| Pedido de conta | 5 pedidos por IP por hora |
| Mesmo e-mail | 2 tentativas por dia |
| URL de mídia | 120 solicitações por usuário por minuto |
| Ações administrativas | 60 ações por administrador por minuto |

Turnstile, honeypot, normalização de Gmail, limite de 500 pedidos pendentes,
índice único por e-mail e aprovação manual trabalham juntos para impedir que
requisições automatizadas criem contas ou lotem o Auth.
