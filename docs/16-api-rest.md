# Documentacao da API REST - Cenario Internacional

Este documento descreve as API Routes atualmente existentes no projeto Next.js.

## Base URL

- Desenvolvimento: `http://localhost:5173`
- Producao: dominio configurado em `NEXT_PUBLIC_SITE_URL`

As rotas ficam sob o prefixo `/api` (nao existe versao `/v1` no app atual).

## Endpoints implementados

### `POST /api/admin-users`

Gerenciamento administrativo de usuarios (proxy para Supabase Admin API).

- Auth: obrigatoria via `Authorization: Bearer <token>`
- Permissao: usuario com `role=admin` em `profiles`
- Body: JSON com `action`

Acoes suportadas:
- `list_users`
- `create_user`
- `update_user`
- `update_password`
- `delete_user`

Arquivo: `src/app/api/admin-users/route.ts`

### `GET|DELETE /api/admin-files`

Listagem e exclusao de arquivos enviados para o Supabase Storage (admin-only).

- Auth: obrigatoria via `Authorization: Bearer <access_token>` (token do Supabase)
- Permissao: usuario com `role=admin` em `profiles`
- Bucket: `SUPABASE_UPLOAD_BUCKET` (default: `uploads`)

`GET /api/admin-files`
- Retorna `{ ok, bucket, files[] }`
- `files[]` inclui `name`, `path`, `size`, `contentType`, `updatedAt`, `publicUrl`, `isVector`

`DELETE /api/admin-files`
- Body: JSON `{ "path": "yyyy/mm/arquivo.ext" }`
- Retorna `{ ok, path }`

Arquivo: `src/app/api/admin-files/route.ts`

### `POST /api/admin-posts`

Operacoes administrativas relacionadas a posts (admin-only).

- Auth: obrigatoria via `Authorization: Bearer <access_token>` (token do Supabase)
- Permissao: usuario com `role=admin` em `profiles`
- Body: JSON com `action`

Acoes suportadas:
- `publish_scheduled`: publica posts com `status=scheduled` e `published_at <= now`

Arquivo: `src/app/api/admin-posts/route.ts`

### `POST /api/career-applications`

Registra candidatura em `career_applications` e dispara emails (ack + inbox interna) quando SMTP estiver configurado.

Campos principais:
- `name`, `email`, `role`, `coverLetter` (obrigatorios)
- `phone`, `location`, `linkedinUrl`, `portfolioUrl`, `resumeUrl`, `userId` (opcionais)

Arquivo: `src/app/api/career-applications/route.ts`

### `POST /api/contact-messages`

Registra mensagem em `contact_messages` e dispara emails (ack + inbox interna) quando SMTP estiver configurado.

Campos principais:
- `name`, `email`, `subject`, `category`, `message` (obrigatorios)
- `phone`, `userId` (opcionais)

Arquivo: `src/app/api/contact-messages/route.ts`

### `GET|HEAD /api/health`

Health check de aplicacao.

Verifica:
- uptime e memoria
- conectividade com Supabase

Arquivo: `src/app/api/health/route.ts`

### `POST /api/newsletter/subscribe`

Cria/atualiza inscricao de newsletter com double opt-in.

Comportamento:
- cria lead `pending` em `leads`
- gera token de confirmacao (24h)
- envia email com link para `/api/newsletter/confirm`
- envia alerta interno para inbox configurada
- se `BUTTONDOWN_API_KEY` existir, faz tentativa adicional no Buttondown (opcional)

Arquivo: `src/app/api/newsletter/subscribe/route.ts`

### `GET /api/newsletter/confirm`

Confirma inscricao por token.

Comportamento:
- valida token UUID
- valida expiracao
- ativa lead (`status=active`)
- limpa token
- envia email de boas-vindas + alerta interno (nao bloqueante)

Arquivo: `src/app/api/newsletter/confirm/route.ts`

### `POST /api/telemetry/error`

Recebe erros de frontend para persistencia em `app_errors`.

Caracteristicas:
- rate limit in-memory por IP
- limite de payload
- sanitizacao/truncamento de campos

Arquivo: `src/app/api/telemetry/error/route.ts`

### `POST /api/upload`

Upload/processamento de imagem para Supabase Storage.

Caracteristicas:
- auth obrigatoria (admin)
- rate limit in-memory por IP
- validacao de tipo e tamanho
- processamento com Sharp para imagens raster (webp, resize, metadata)
- suporte a vetores (SVG): armazenado como `.svg` sem conversao via Sharp, com validacoes basicas de seguranca
- objeto salvo com path `yyyy/mm/<uuid>.(webp|svg)`

Arquivo: `src/app/api/upload/route.ts`

## Erros e status codes

Padrao geral observado:
- `200` sucesso
- `400` payload invalido
- `401` nao autenticado
- `403` sem permissao
- `429` rate limit
- `500` erro interno
- `503` dependencia/config indisponivel

## Variaveis de ambiente relevantes

- Supabase
  - `NEXT_PUBLIC_SUPABASE_URL`
  - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
  - `SUPABASE_SERVICE_ROLE_KEY`
- Newsletter/Email
  - `NEXT_PUBLIC_SITE_URL`
  - `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`, `SMTP_SECURITY`
  - `FROM_EMAIL`, `FROM_NAME`, `REPLY_TO`
  - `NEWSLETTER_INBOX_EMAIL`, `CONTACT_INBOX_EMAIL`, `CAREERS_INBOX_EMAIL`
  - `BUTTONDOWN_API_KEY` (opcional)
- Upload
  - `SUPABASE_UPLOAD_BUCKET`

## Fora de escopo deste documento

- APIs do servico `collector/` (analytics separado)
- Endpoints de MCP (`mcp-server/`)
- Supabase Edge Functions (diretorio `supabase/functions`)
