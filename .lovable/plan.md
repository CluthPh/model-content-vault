# Yakuza Mentor — Plataforma Privada de Mentoria

Área de mentoria privada com login, módulos e painel administrativo. Sem pagamentos, gamificação, comunidade ou progresso.

## Identidade Visual

Tema dark premium, sensual e misterioso, com paleta:
- Fundo `#0A0A0A`, carbono `#121212`, cards `#1A1A1A`
- Vermelho principal `#C00020`, escuro `#710014`
- Texto branco `#FFFFFF` e cinza `#A7A7A7`, bordas `#2A2A2A`
- Efeitos de brilho vermelho suave nos botões, sombras discretas, cantos levemente arredondados

Tipografia moderna e limpa (Inter/Poppins). Sem imagens explícitas na interface.

## Estrutura do Projeto

Rotas públicas:
- `/` — Confirmação de maioridade (uma única vez, salva localmente)
- `/login` — Login (sem cadastro público)
- `/recuperar-senha` — Recuperar senha
- `/termos`, `/privacidade`, `/aviso-adulto` — Páginas legais
- `*` — 404

Rotas privadas (usuário):
- `/app` — Página inicial com cards de módulos liberados
- `/app/modulos/:id` — Página do módulo com conteúdos
- `/app/perfil` — Perfil básico

Rotas privadas (admin):
- `/admin` — Dashboard
- `/admin/modulos` — CRUD de módulos + reordenar
- `/admin/modulos/:id/conteudos` — CRUD de conteúdos do módulo
- `/admin/usuarios` — CRUD de usuários e permissões
- `/admin/configuracoes` — Configurações gerais

## Banco de Dados (Lovable Cloud)

Tabelas:
- `profiles` — id (auth.users), nome, avatar_url, bloqueado
- `user_roles` — user_id, role (`admin` | `user`) — tabela separada por segurança
- `modules` — título, descrição, capa_url, ordem, ativo, bloqueado
- `module_contents` — module_id, tipo (`text`|`image`|`gallery`|`video`|`video_link`|`audio`|`pdf`|`file`|`link`|`button`), título, corpo, media_url, url_externo, ordem, publicado
- `module_access` — module_id, user_id (permissões por usuário)
- `platform_settings` — chave/valor (nome da plataforma, textos legais)

Storage bucket `mentor-media` para uploads (imagens, vídeos, áudios, PDFs).

RLS:
- Usuário vê módulos ativos aos quais tem `module_access`
- Usuário vê conteúdos publicados dos módulos que tem acesso
- Admin (via `has_role`) gerencia tudo
- Função `has_role(user_id, role)` SECURITY DEFINER para evitar recursão

## Player e Uploads

- Player de vídeo/áudio nativos HTML5 com controles padrão (play, volume, seek, fullscreen, velocidade)
- Vídeos incorporados: suporte a YouTube/Vimeo via iframe
- Upload com barra de progresso, preview e mensagens de erro/sucesso

## Painel Administrativo

- Módulos: criar, editar, excluir, duplicar, reordenar (drag & drop), publicar/ocultar, definir usuários com acesso
- Conteúdos: criar todos os tipos, reordenar, preview, publicar/ocultar
- Usuários: criar com senha temporária (via Edge Function admin), editar, bloquear, excluir, reset de senha, liberar módulos

## Dados de Demonstração

- 1 admin (`admin@yakuza.com`) + 2 usuários fictícios
- 4 módulos com capas placeholder e 2 conteúdos neutros cada (texto + link/imagem)

## Implementação Técnica

- Design tokens em `index.css` (HSL) + variants no `tailwind.config.ts` — nada hardcoded
- shadcn/ui customizado com variante `premium` (vermelho intenso com glow)
- React Router com `ProtectedRoute` e `AdminRoute`
- Zustand ou context para sessão/auth
- Edge Function `admin-create-user` (service role) para criação de usuários pelo admin
- Zod para validação de formulários
- `@dnd-kit` para reordenação de módulos e conteúdos

## Fora de Escopo (não será implementado)

Pagamentos, comunidade, comentários, ranking, progresso, aulas ao vivo, certificados, jornada, gamificação, notificações, relatórios.

## Perguntas antes de começar

1. Você quer que eu use o email `admin@yakuza.com` com senha temporária `Yakuza@2025` para o admin de demonstração? Você troca no primeiro login.
2. Confirmo apagar todo o site atual (Amanda/Privacy) e substituir pelo Yakuza Mentor?
