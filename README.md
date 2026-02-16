# Cenario Internacional (CIN)

Portal de not?cias focado em geopol?tica, economia internacional e tecnologia.

## Stack atual

- Framework: Next.js 16 (App Router)
- Frontend: React 19 + TypeScript
- Estiliza??o: Tailwind CSS + shadcn/ui
- Backend de dados e auth: Supabase (Postgres + Auth)
- Email transacional: SMTP Hostinger (Nodemailer)
- Ferramentas auxiliares: MCP Server (`mcp-server/`) e collector (`collector/`)

## Estrutura do reposit?rio

```text
/src
  /app           # Rotas e p?ginas (Next.js App Router)
    /(auth)      # Grupo de autentica??o
    /api         # API Routes do app
  /components
  /config
  /hooks
  /lib
  /services
  /types
/collector       # Analytics collector (servi?o separado)
/mcp-server      # Servidor MCP
/supabase        # Migrations e functions
/docs            # Documenta??o
```

## Desenvolvimento

```bash
npm install
npm run dev
npm run build
npm start
npm run lint
npm run test
```

## Vari?veis de ambiente

Use `.env.example` como base.

M?nimo para app web + APIs internas:

```bash
NEXT_PUBLIC_SITE_URL=
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

SMTP_HOST=
SMTP_PORT=
SMTP_USER=
SMTP_PASS=
SMTP_SECURITY=SSL
FROM_EMAIL=
FROM_NAME=
REPLY_TO=
CONTACT_INBOX_EMAIL=
CAREERS_INBOX_EMAIL=
NEWSLETTER_INBOX_EMAIL=
```

Observa??es:
- `BUTTONDOWN_API_KEY` ? opcional. Se vazio, o fluxo segue apenas com banco + SMTP.
- N?o commitar `.env` com credenciais reais.

## API Routes atuais

Todas expostas em `src/app/api`:

- `POST /api/admin-users`
- `POST /api/career-applications`
- `POST /api/contact-messages`
- `GET|HEAD /api/health`
- `POST /api/newsletter/subscribe`
- `GET /api/newsletter/confirm`
- `POST /api/telemetry/error`
- `POST /api/upload`

Refer?ncia detalhada: `docs/16-api-rest.md`.

## Newsletter (estado atual)

Fluxo implementado:

1. `POST /api/newsletter/subscribe` cria/atualiza lead pendente com token.
2. Envia email de confirma??o com link para `/api/newsletter/confirm?token=...`.
3. `GET /api/newsletter/confirm` ativa a inscri??o.
4. Envia notifica??es via SMTP (assinante + inbox interna).

Depend?ncias operacionais:
- Tabela `leads` no Supabase (com campos de confirma??o)
- SMTP configurado

## Deploy

Para deploy com funcionalidades din?micas (API routes), use runtime Node.js (VPS/host com Node).

Com `output: 'export'`, APIs internas n?o funcionam.

Guias:
- `docs/22-deploy-producao-checklist.md`
- `docs/24-deploy-vps-execucao-manual.md`
- `docs/ops/DEPLOY_SEGURO.md`

## Documenta??o

- ?ndice principal: `docs/README.md`
- ?ndice de navega??o r?pida: `docs/_project/DOCUMENTATION_INDEX.md`
- Arquitetura: `docs/01-arquitetura.md`
- Seguran?a: `docs/_security/GUIA_SEGURANCA_DESENVOLVEDORES.md`
- Auditoria de seguran?a: `docs/audits/AUDITORIA_SEGURANCA.md`

## Status real do projeto

- `npm run build`: passando
- `npm run lint`: possui pend?ncias

N?o considerar o projeto ?100% pronto? enquanto lint/testes obrigat?rios n?o estiverem verdes no pipeline.
