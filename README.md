# Cenario Internacional (CIN)

> **Portal de notícias internacional** focado em geopolítica, economia global e tecnologia, pensado para combinar **jornalismo estruturado**, **SEO forte** e **operação enxuta**.

![Next.js](https://img.shields.io/badge/Next.js-16-black?logo=next.js)
![React](https://img.shields.io/badge/React-19-149ECA?logo=react&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-5.9-3178C6?logo=typescript&logoColor=white)
![Supabase](https://img.shields.io/badge/Supabase-Postgres-3ECF8E?logo=supabase&logoColor=white)
![Status](https://img.shields.io/badge/Status-Pronto%20Producao-22C55E)

---

## Visão do Projeto

O CIN foi desenhado para ser um portal de conteúdo com padrão profissional, mas com arquitetura pragmática e custos controlados.

A ideia central do produto é:

- transformar temas complexos (geopolítica/economia) em conteúdo claro e navegável;
- crescer organicamente com SEO técnico consistente;
- manter independência operacional com stack moderna e simples de manter;
- permitir evolução contínua sem reescrever a base inteira.

## Como o Projeto Foi Pensado

A construção foi guiada por 4 pilares:

1. **Conteúdo como ativo principal**
- Estrutura editorial com categorias, autores, páginas institucionais e área administrativa.

2. **Distribuição e retenção**
- Estratégia de newsletter com double opt-in e automações por email.

3. **Base técnica escalável**
- Next.js App Router + Supabase + APIs internas para evitar dependências desnecessárias.

4. **Governança e operação**
- Documentação extensa, checklists de deploy e trilha de auditorias técnicas.

---

## Funcionalidades Principais

### Público / Portal

- Home editorial com destaques e blocos temáticos
- Páginas de notícias, categorias, autor e busca
- Seções dedicadas (`/mercados`, `/dados-economicos`, `/calendario-economico`, etc.)
- Sitemap, RSS e robots para SEO técnico

### Relacionamento e Captação

- Formulário de contato (`/fale-conosco`)
- Formulário de carreiras (`/trabalhe-conosco`)
- Newsletter com confirmação por token (double opt-in)

### Administração

- Área admin para gestão operacional
- APIs de administração de usuários
- Página de arquivos enviados (`/admin/arquivos`) com upload/listagem/exclusão
- Upload/processamento de imagens com validações
- Publicação de posts agendados via API admin

### Observabilidade e Robustez

- Health check de aplicação (`/api/health`)
- Endpoint de telemetria de erros (`/api/telemetry/error`)
- Validações com Zod em fluxos críticos de entrada

---

## Arquitetura Atual

**Stack técnica**

- Framework: Next.js 16 (App Router)
- Frontend: React 19 + TypeScript
- UI: Tailwind CSS + shadcn/ui
- Dados e Auth: Supabase (Postgres + Auth)
- Email transacional: SMTP Hostinger (Nodemailer)
- Serviços auxiliares: `mcp-server/` e `collector/`

**Estrutura do repositório**

```text
/src
  /app           # Rotas e páginas (Next.js App Router)
    /(auth)      # Grupo de autenticação
    /api         # API Routes
  /components
  /config
  /hooks
  /lib
  /services
  /types
/collector       # Serviço de analytics separado
/mcp-server      # Servidor MCP
/supabase        # Migrations e functions
/docs            # Documentação funcional e operacional
/nginx           # Configuração Nginx para produção
/scripts         # Scripts de deploy, backup, etc.
```

---

## API Routes Reais do Projeto

Todas implementadas em `src/app/api`:

- `POST /api/admin-users`
- `GET|DELETE /api/admin-files`
- `POST /api/admin-posts`
- `POST /api/career-applications`
- `POST /api/contact-messages`
- `GET|HEAD /api/health`
- `POST /api/newsletter/subscribe`
- `GET /api/newsletter/confirm`
- `POST /api/telemetry/error`
- `POST /api/upload`

Documentação detalhada: `docs/16-api-rest.md`

---

## Newsletter (Fluxo Atual)

1. `POST /api/newsletter/subscribe` cria/atualiza lead pendente
2. sistema gera token com expiração
3. usuário recebe email com link de confirmação
4. `GET /api/newsletter/confirm?token=...` ativa inscrição
5. notificações internas são enviadas via SMTP

Dependências:

- tabela `leads` no Supabase
- variáveis SMTP configuradas

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

### Variáveis de ambiente mínimas

Use `.env.example` como base.

```bash
NEXT_PUBLIC_SITE_URL=
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
SUPABASE_UPLOAD_BUCKET=

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

- `BUTTONDOWN_API_KEY` é opcional
- não commitar `.env` com credenciais reais

---

## Deploy

Para manter funcionalidades dinâmicas (API Routes), usar runtime Node.js.

Com `output: 'export'`, APIs internas não funcionam.

### Infraestrutura de Produção

O projeto inclui infraestrutura completa para VPS:

| Componente | Arquivo | Descrição |
|------------|---------|-----------|
| Docker | `docker-compose.yml` | Orquestração de containers |
| Nginx | `nginx/pem.conf` | Reverse proxy com SSL, CSP e cache |
| Deploy | `scripts/deploy.sh` | Deploy com Docker Compose |
| Backup | `scripts/backup.sh` | Backup diário de DB e uploads |
| CI/CD | `.github/workflows/deploy.yml` | Deploy automático via GitHub Actions |

### Primeiro Deploy

```bash
# Na VPS
git clone https://github.com/ocezao/Portal-Economia-Mundial.git /var/www/portal
cd /var/www/portal
docker compose build web
docker compose up -d
sudo ./scripts/nginx-setup.sh
sudo certbot --nginx -d cenariointernacional.com.br
```

### Referências

- `docs/22-deploy-producao-checklist.md` - Checklist completo (95% pronto)
- `docs/RUNBOOK.md` - Manual de operações (atualizado para Docker)
- `docs/ops/DEPLOY_SEGURO.md` - Segurança em deploy

---

## Documentação do Projeto

- Índice geral: `docs/README.md`
- Índice rápido: `docs/_project/DOCUMENTATION_INDEX.md`
- Arquitetura: `docs/01-arquitetura.md`
- API: `docs/16-api-rest.md`
- Segurança: `docs/_security/GUIA_SEGURANCA_DESENVOLVEDORES.md`
- Auditoria de segurança: `docs/audits/AUDITORIA_SEGURANCA.md`

---

## Estado Atual

| Item | Status |
|------|--------|
| `npm run build` | ✅ Passando |
| `npm run test` | ✅ Passando |
| `npm run lint` | ⚠️ Pendências menores |
| Infraestrutura VPS | ✅ Completa |
| Deploy | ✅ 95% pronto |
| Banco Local PostgreSQL | 🟡 Em Progresso |

### Migração Banco Local PostgreSQL

O projeto está em processo de migração do Supabase (banco remoto) para PostgreSQL local na VPS.

**Status:**
- 19 tabelas criadas no PostgreSQL local
- Container `portal-database` em execução na VPS
- Função `auth.uid()` implementada
- Conexão híbrida: Supabase (Auth + Storage) + PostgreSQL local (CRUD)

**Documentação:** `docs/_migration/LOCAL_DB_STATUS.md`

O projeto está **pronto para produção**. Consulte `docs/RUNBOOK.md` para operações.
