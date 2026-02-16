# Documenta??o da API REST - Cenario Internacional

Este documento descreve as API Routes atualmente existentes no projeto Next.js.

## Base URL

- Desenvolvimento: `http://localhost:5173`
- Produ??o: dom?nio configurado em `NEXT_PUBLIC_SITE_URL`

As rotas ficam sob o prefixo `/api` (n?o existe vers?o `/v1` no app atual).

## Endpoints implementados

### `POST /api/admin-users`

Gerenciamento administrativo de usu?rios (proxy para Supabase Admin API).

- Auth: obrigat?ria via `Authorization: Bearer <token>`
- Permiss?o: usu?rio com `role=admin` em `profiles`
- Body: JSON com `action`

A??es suportadas:
- `list_users`
- `create_user`
- `update_user`
- `update_password`
- `delete_user`

Arquivo: `src/app/api/admin-users/route.ts`

### `POST /api/career-applications`

Registra candidatura em `career_applications` e dispara emails (ack + inbox interna) quando SMTP estiver configurado.

Campos principais:
- `name`, `email`, `role`, `coverLetter` (obrigat?rios)
- `phone`, `location`, `linkedinUrl`, `portfolioUrl`, `resumeUrl`, `userId` (opcionais)

Arquivo: `src/app/api/career-applications/route.ts`

### `POST /api/contact-messages`

Registra mensagem em `contact_messages` e dispara emails (ack + inbox interna) quando SMTP estiver configurado.

Campos principais:
- `name`, `email`, `subject`, `category`, `message` (obrigat?rios)
- `phone`, `userId` (opcionais)

Arquivo: `src/app/api/contact-messages/route.ts`

### `GET|HEAD /api/health`

Health check de aplica??o.

Verifica:
- uptime e mem?ria
- conectividade com Supabase

Arquivo: `src/app/api/health/route.ts`

### `POST /api/newsletter/subscribe`

Cria/atualiza inscri??o de newsletter com double opt-in.

Comportamento:
- cria lead `pending` em `leads`
- gera token de confirma??o (24h)
- envia email com link para `/api/newsletter/confirm`
- envia alerta interno para inbox configurada
- se `BUTTONDOWN_API_KEY` existir, faz tentativa adicional no Buttondown (opcional)

Arquivo: `src/app/api/newsletter/subscribe/route.ts`

### `GET /api/newsletter/confirm`

Confirma inscri??o por token.

Comportamento:
- valida token UUID
- valida expira??o
- ativa lead (`status=active`)
- limpa token
- envia email de boas-vindas + alerta interno (n?o bloqueante)

Arquivo: `src/app/api/newsletter/confirm/route.ts`

### `POST /api/telemetry/error`

Recebe erros de frontend para persist?ncia em `app_errors`.

Caracter?sticas:
- rate limit in-memory por IP
- limite de payload
- sanitiza??o/truncamento de campos

Arquivo: `src/app/api/telemetry/error/route.ts`

### `POST /api/upload`

Upload/processamento de imagem para Supabase Storage.

Caracter?sticas:
- auth obrigat?ria (admin)
- rate limit in-memory por IP
- valida??o de tipo e tamanho
- processamento com Sharp (webp, resize, metadata)

Arquivo: `src/app/api/upload/route.ts`

## Erros e status codes

Padr?o geral observado:
- `200` sucesso
- `400` payload inv?lido
- `401` n?o autenticado
- `403` sem permiss?o
- `429` rate limit
- `500` erro interno
- `503` depend?ncia/config indispon?vel

## Vari?veis de ambiente relevantes

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

- APIs do servi?o `collector/` (analytics separado)
- Endpoints de MCP (`mcp-server/`)
- Supabase Edge Functions (diret?rio `supabase/functions`)
