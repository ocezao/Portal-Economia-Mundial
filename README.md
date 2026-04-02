# Cenario Internacional (CIN)

> **Portal de notÃ­cias internacional** focado em geopolÃ­tica, economia global e tecnologia, pensado para combinar **jornalismo estruturado**, **SEO forte** e **operaÃ§Ã£o enxuta**.

![Next.js](https://img.shields.io/badge/Next.js-16-black?logo=next.js)
![React](https://img.shields.io/badge/React-19-149ECA?logo=react&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-5.9-3178C6?logo=typescript&logoColor=white)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-Local%20DB-336791?logo=postgresql&logoColor=white)
![Status](https://img.shields.io/badge/Status-Pronto%20Producao-22C55E)

---

## VisÃ£o do Projeto

O CIN foi desenhado para ser um portal de conteÃºdo com padrÃ£o profissional, mas com arquitetura pragmÃ¡tica e custos controlados.

A ideia central do produto Ã©:

- transformar temas complexos (geopolÃ­tica/economia) em conteÃºdo claro e navegÃ¡vel;
- crescer organicamente com SEO tÃ©cnico consistente;
- manter independÃªncia operacional com stack moderna e simples de manter;
- permitir evoluÃ§Ã£o contÃ­nua sem reescrever a base inteira.

## Como o Projeto Foi Pensado

A construÃ§Ã£o foi guiada por 4 pilares:

1. **ConteÃºdo como ativo principal**
- Estrutura editorial com categorias, autores, pÃ¡ginas institucionais e Ã¡rea administrativa.

2. **DistribuiÃ§Ã£o e retenÃ§Ã£o**
- Estrategia de newsletter com double opt-in e automacoes por email.

3. **Base tÃ©cnica escalÃ¡vel**
- Next.js App Router + PostgreSQL local + APIs internas para concentrar a operacao no proprio projeto.

4. **GovernanÃ§a e operaÃ§Ã£o**
- DocumentaÃ§Ã£o extensa, checklists de deploy e trilha de auditorias tÃ©cnicas.

---

## Funcionalidades Principais

### PÃºblico / Portal

- Home editorial com destaques e blocos temÃ¡ticos
- PÃ¡ginas de notÃ­cias, categorias, autor e busca
- SeÃ§Ãµes dedicadas (`/mercados`, `/dados-economicos`, `/calendario-economico`, etc.)
- Sitemap, RSS e robots para SEO tÃ©cnico

### Relacionamento e CaptaÃ§Ã£o

- FormulÃ¡rio de contato (`/fale-conosco`)
- FormulÃ¡rio de carreiras (`/trabalhe-conosco`)
- Newsletter com confirmaÃ§Ã£o por token (double opt-in)

### AdministraÃ§Ã£o

- Ãrea admin para gestÃ£o operacional
- APIs de administraÃ§Ã£o de usuÃ¡rios
- PÃ¡gina de arquivos enviados (`/admin/arquivos`) com upload/listagem/exclusÃ£o
- Upload/processamento de imagens com validaÃ§Ãµes
- PublicaÃ§Ã£o de posts agendados via API admin

### Observabilidade e Robustez

- Health check de aplicaÃ§Ã£o (`/api/health`)
- Endpoint de telemetria de erros (`/api/telemetry/error`)
- ValidaÃ§Ãµes com Zod em fluxos crÃ­ticos de entrada

---

## Arquitetura Atual

**Stack tÃ©cnica**

- Framework: Next.js 15 (App Router)
- Frontend: React 19 + TypeScript
- UI: Tailwind CSS + shadcn/ui
- Dados: PostgreSQL local
- Auth: sessoes locais do app
- Email transacional: SMTP Hostinger (Nodemailer)
- ServiÃ§os auxiliares: `mcp-server/` e `collector/`

**Estrutura do repositÃ³rio**

```text
/src
  /app           # Rotas e pÃ¡ginas (Next.js App Router)
    /(auth)      # Grupo de autenticaÃ§Ã£o
    /api         # API Routes
  /components
  /config
  /hooks
  /lib
  /services
  /types
/collector       # ServiÃ§o de analytics separado
/mcp-server      # Servidor MCP
/supabase        # Migrations e functions
/docs            # DocumentaÃ§Ã£o funcional e operacional
/nginx           # ConfiguraÃ§Ã£o Nginx para produÃ§Ã£o
/scripts         # Scripts de deploy, backup, etc.
```

---

## API Routes Reais do Projeto

Todas implementadas em `src/app/api`:

- `POST /api/admin-users`
- `GET|DELETE /api/admin-files`
- `POST /api/admin-posts`
- `POST /api/articles`
- `POST /api/auth/login`
- `POST /api/auth/logout`
- `POST /api/auth/register`
- `GET /api/auth/session`
- `POST /api/career-applications`
- `GET|POST|PATCH|DELETE /api/comments`
- `POST /api/contact-messages`
- `GET|POST /api/cron`
- `GET|HEAD /api/health`
- `POST /api/newsletter/subscribe`
- `GET /api/newsletter/confirm`
- `GET /api/search`
- `POST /api/telemetry/error`
- `GET /api/ticker`
- `POST /api/upload`
- `GET|POST|DELETE /api/user/bookmarks`
- `GET|POST|DELETE /api/user/reading-history`
- `GET|DELETE /api/user/reading-progress`

Namespace editorial para automacao:

- `GET /api/v1/editorial`
- `GET /api/v1/editorial/openapi`
- `GET /api/v1/editorial/meta`
- `GET /api/v1/editorial/slug`
- `GET|POST /api/v1/editorial/articles`
- `GET|PATCH /api/v1/editorial/articles/[id]`
- `POST /api/v1/editorial/articles/[id]/enrich`
- `POST /api/v1/editorial/articles/[id]/publish`
- `POST /api/v1/editorial/articles/[id]/schedule`
- `POST /api/v1/editorial/articles/[id]/sources`
- `POST /api/v1/editorial/uploads`

DocumentaÃ§Ã£o detalhada: `docs/16-api-rest.md`
Runbook operacional do agente: `docs/ops/RUNBOOK_EDITORIAL_LLM.md`

---

## Newsletter (Fluxo Atual)

1. `POST /api/newsletter/subscribe` cria/atualiza lead pendente
2. sistema gera token com expiraÃ§Ã£o
3. usuÃ¡rio recebe email com link de confirmaÃ§Ã£o
4. `GET /api/newsletter/confirm?token=...` ativa inscriÃ§Ã£o
5. notificaÃ§Ãµes internas sÃ£o enviadas via SMTP

DependÃªncias:

- tabela `leads` no PostgreSQL local
- variaveis SMTP configuradas

---

## Desenvolvimento Local

```bash
npm install
npm run dev
npm run build
npm start
npm run lint
npm run test
```

### VariÃ¡veis de ambiente mÃ­nimas

Use `.env.example` como base.

```bash
NEXT_PUBLIC_SITE_URL=
NEXT_PUBLIC_API_BASE_URL=
DB_NAME=
DB_USER=
DB_PASSWORD=
METABASE_DB_PASSWORD=
LOCAL_AUTH_SECRET=
CRON_API_SECRET=
EDITORIAL_API_KEY=
GNEWS_API_KEY=
NEXT_PUBLIC_FINNHUB_API_KEY=
FINNHUB_API_KEY=
CORS_ALLOWED_ORIGINS=

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

Notas:

- `BUTTONDOWN_API_KEY` Ã© opcional
- nÃ£o commitar `.env` com credenciais reais
- `DATABASE_URL` e montada pelo `docker-compose.yml` a partir de `DB_NAME`, `DB_USER` e `DB_PASSWORD`

---

## Deploy

To keep dynamic functionality (API Routes), the runtime must stay on Node.js.

With `output: export`, internal APIs do not work.

### Production Stack

The official production flow uses Docker Compose with local PostgreSQL on the VPS:

| Component | File | Description |
|------------|------|-------------|
| Docker | `docker-compose.yml` | Official production stack with `database`, `web`, `api`, `collector`, and `metabase` |
| Nginx | `nginx/pem.conf` | Reverse proxy with SSL, CSP, and cache |
| Backup | `scripts/backup.sh` | Backup for local PostgreSQL and uploads |
| Deploy | `scripts/deploy.sh` | Official in-place Docker deploy on the VPS |
| Validation | `docs/22-deploy-producao-checklist.md` | Operational readiness checklist |

### First Deploy

```bash
# On the VPS
 git clone https://github.com/ocezao/Portal-Economia-Mundial.git /var/www/portal
 cd /var/www/portal
 cp .env.example .env
 # edit .env with DB_NAME, DB_USER, DB_PASSWORD and the remaining secrets
 docker compose -f docker-compose.yml up -d --build
 docker compose -f docker-compose.yml ps
 curl http://127.0.0.1:3000/api/health
```

### References

- `docs/22-deploy-producao-checklist.md` - Production readiness checklist
- `docs/RUNBOOK.md` - Operational manual for the Docker flow
- `docs/24-deploy-vps-execucao-manual.md` - Manual execution guide for the local DB flow
- `docs/ops/DEPLOY_SEGURO.md` - Deployment security guide

---

## Project Documentation

- Index: `docs/README.md`
- Quick index: `docs/_project/DOCUMENTATION_INDEX.md`
- Architecture: `docs/01-arquitetura.md`
- API: `docs/16-api-rest.md`
- Editorial API for LLMs: `docs/api-editorial-llm.md`
- Security: `docs/_security/GUIA_SEGURANCA_DESENVOLVEDORES.md`
- Security audit: `docs/audits/AUDITORIA_SEGURANCA.md`

---

## Current State

Review note as of 2026-04-02:

- `npm run build` passed in this round.
- `npm run lint` still has relevant legacy debt outside the scope of this documentation.
- `npm run test` still has legacy suites failing outside the editorial scope.
- the official production runtime uses Docker Compose with local PostgreSQL on the VPS.
- the editorial API v1 exists at `/api/v1/editorial`.
- the editorial workflow requires `draft -> validate -> approve -> publish|schedule`.
- the admin create/edit screens now use the editorial workflow and upload cover images through `/api/v1/editorial/uploads`.
- scheduled publication is processed through `article_jobs` from both `/api/admin-posts` and `/api/cron?type=publish-scheduled`.

| Item | Status |
|------|--------|
| `npm run build` | Passing |
| `npm run test` | Failing in legacy suites |
| `npm run lint` | Relevant debt |
| VPS infrastructure | Complete |
| Docker deploy with local DB | Official flow |
| Local PostgreSQL | In use on the VPS |

### Local PostgreSQL

The official runtime uses local PostgreSQL on the VPS through `DATABASE_URL` and the `portal-database` container.
The `supabase/migrations/` and `supabase/functions/` directories remain as schema history and utilities, not as evidence that Supabase is still the main runtime.

See `docs/RUNBOOK.md` for operations and `docs/22-deploy-producao-checklist.md` for the readiness criteria.

