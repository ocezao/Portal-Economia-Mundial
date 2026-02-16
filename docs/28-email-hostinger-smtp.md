# Email Transacional - Hostinger SMTP

Data de referencia: **2026-02-16**.

## Objetivo

Padronizar envio de emails automaticos do portal usando SMTP da Hostinger.

## Variaveis de ambiente

Definir no `.env` (local e producao):

- `SMTP_HOST`
- `SMTP_PORT`
- `SMTP_USER`
- `SMTP_PASS`
- `SMTP_SECURITY` (`SSL` ou `TLS`)
- `FROM_EMAIL`
- `FROM_NAME`
- `REPLY_TO`
- `CONTACT_INBOX_EMAIL`
- `CAREERS_INBOX_EMAIL`

## Endpoints implementados

- `POST /api/contact-messages`
- `POST /api/career-applications`
- `POST /api/admin-users` (acao `create_user`, `update_user`, `update_password` com notificacoes)
- `POST /api/newsletter/subscribe`

## Fluxos automaticos

### Contato
- Salva em `contact_messages`
- Envia email interno para `CONTACT_INBOX_EMAIL`
- Envia confirmacao para o usuario

### Carreiras
- Salva em `career_applications`
- Envia email interno para `CAREERS_INBOX_EMAIL`
- Envia confirmacao para o candidato

### Admin usuarios
- Criacao de conta: email de conta criada
- Alteracao de email: email de email atualizado
- Alteracao de senha: email de senha alterada

### Newsletter
- Endpoint: `POST /api/newsletter/subscribe`
- Integracao do formulario da Home (`src/app/HomePageClient.tsx`)
- Envio de email de confirmacao para o assinante (SMTP Hostinger)
- Envio de notificacao interna para `NEWSLETTER_INBOX_EMAIL` (fallback para `CONTACT_INBOX_EMAIL`)
- Deduplicacao:
  - Prioridade: tabela `leads` (quando disponivel no projeto Supabase)
  - Fallback operacional: `contact_messages` com `subject = [Newsletter] newsletter_home`

## Smoke test

Script:

- `scripts/smoke-email-flows.mjs`

Comando:

```bash
npm run test:smoke:email
```

Pre-requisito:

1. `npm run build`
2. `npm run start`
3. Em outro terminal: `npm run test:smoke:email`

## Resultado validado nesta data

- `contact_valid`: PASS (`200`)
- `contact_invalid`: PASS (`400`)
- `career_valid`: PASS (`200`)
- `career_invalid`: PASS (`400`)
- `admin_update_user`: skipped sem token de admin (esperado)

Status: smoke test concluido com sucesso.

## Validacao newsletter (2026-02-16)

- Primeiro POST com email novo: `200` com `alreadySubscribed: false`
- Segundo POST com mesmo email: `200` com `alreadySubscribed: true`
- Persistencia confirmada no banco (fallback em `contact_messages` no ambiente atual)
