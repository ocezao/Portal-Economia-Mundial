# Documentacao da API REST - Cenario Internacional

Este documento descreve as API Routes atualmente existentes no projeto Next.js.

## Base URL

- Desenvolvimento: `http://localhost:3000`
- Producao: dominio configurado em `NEXT_PUBLIC_SITE_URL`

As rotas ficam sob os prefixos `/api` e `/api/v1/editorial`.

## Endpoints implementados

### `POST /api/admin-users`

Gerenciamento administrativo de usuarios do sistema local.

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

Listagem e exclusao de arquivos enviados localmente em `public/uploads` (admin-only).

- Auth: sessao admin local ou auth editorial
- Permissao: admin

`GET /api/admin-files`
- Retorna `{ ok, files[] }`
- `files[]` inclui `name`, `path`, `size`, `contentType`, `updatedAt`, `publicUrl`, `isVector`

`DELETE /api/admin-files`
- Body: JSON `{ "path": "yyyy/mm/arquivo.ext" }`
- Retorna `{ ok, path }`

Arquivo: `src/app/api/admin-files/route.ts`

### `POST /api/admin-posts`

Operacoes administrativas relacionadas a posts (admin-only).

- Auth: sessao admin local, bearer key editorial ou `x-api-key`
- Permissao: admin/editorial
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
- conectividade com PostgreSQL local

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

Upload/processamento de imagem para armazenamento local.

Caracteristicas:
- auth obrigatoria (admin)
- rate limit in-memory por IP
- validacao de tipo e tamanho
- processamento com Sharp para imagens raster (webp, resize, metadata)
- suporte a vetores (SVG): armazenado como `.svg` sem conversao via Sharp, com validacoes basicas de seguranca
- objeto salvo com path `yyyy/mm/<uuid>.(webp|svg)` em `public/uploads`

Arquivo: `src/app/api/upload/route.ts`

## Editorial API v1

Namespace voltado para automacao, integracoes programaticas e agentes LLM.

### `GET /api/v1/editorial`

Endpoint de descoberta com links principais e modelo de autenticacao.

### `GET /api/v1/editorial/auth`

Verifica se a credencial editorial recebida esta valida.

### `GET /api/v1/editorial/openapi`

Contrato OpenAPI JSON da API editorial.

### `GET /api/v1/editorial/meta`

Retorna:
- autores ativos
- categorias
- enums de `status` e `editorialStatus`

### `GET /api/v1/editorial/readiness`

Retorna readiness operacional da API editorial para agentes.

Inclui:
- status de banco
- status de uploads
- presenca de `EDITORIAL_API_KEY`
- presenca de `CRON_API_SECRET`
- presenca de `NEXT_PUBLIC_SITE_URL`
- contagem agregada de jobs editoriais

### `GET /api/v1/editorial/context/market`

Retorna contexto economico resumido para enriquecer artigos e posts.

Inclui:
- indices globais
- commodities
- setores
- noticias de mercado
- calendario economico
- earnings

### `GET /api/v1/editorial/slug`

Gera ou valida slug.

Query:
- `value`
- `title`
- `excludeSlug`

### `GET|POST /api/v1/editorial/articles`

`GET`
- lista artigos com filtros e paginacao
- filtros: `page`, `perPage`, `search`, `category`, `status`, `author`, `dateFrom`, `dateTo`, `sortBy`, `sortOrder`

`POST`
- cria artigo
- aceita payload editorial validado por `zod`
- o fluxo atual exige criacao inicial em `draft`

### `GET|PATCH /api/v1/editorial/articles/:id`

- `GET` busca artigo por id ou slug
- `PATCH` atualiza artigo
- query opcional: `lookup=slug`

### `GET /api/v1/editorial/articles/:id/validate`

Valida prontidao editorial e retorna checklist estruturado para publicacao.

Regras atuais:

- fontes ausentes bloqueiam prontidao
- erros estruturais retornam `readyToPublish=false`
- aprovacao ainda e etapa separada

### `POST /api/v1/editorial/articles/:id/approve`

Marca o artigo como aprovado editorialmente.

Regra atual:

- so aprova se `validate` estiver sem erros estruturais

### `POST /api/v1/editorial/articles/:id/enrich`

Enriquece dados editoriais persistidos, como `seo_title`, `meta_description`, `faq_items` e `editorial_status`.

### `GET /api/v1/editorial/articles/:id/seo-audit`

Audita SEO/AEO do artigo.

Retorna:
- `checks`
- `issues`
- sugestoes de `seoTitle`
- sugestoes de `metaDescription`
- FAQ sugerido
- links internos sugeridos

### `GET /api/v1/editorial/articles/:id/internal-links`

Sugere links internos relevantes para o artigo.

Query:
- `limit`

### `GET /api/v1/editorial/articles/:id/similar`

Lista artigos semanticamente parecidos para evitar duplicidade e canibalizacao editorial.

Query:
- `limit`

### `POST /api/v1/editorial/articles/:id/publish`

Publica imediatamente.

Regra atual:

- exige artigo aprovado
- exige artigo validado sem erros
- exige fontes persistidas

### `POST /api/v1/editorial/articles/:id/schedule`

Agenda publicacao. Requer `publishedAt`.

Regra atual:

- exige artigo aprovado
- exige artigo validado sem erros
- exige fontes persistidas

### `POST /api/v1/editorial/articles/:id/sources`

Adiciona fonte editorial persistida ao artigo.

### `DELETE /api/v1/editorial/articles/:id/sources/:sourceId`

Remove fonte editorial persistida.

### `GET /api/v1/editorial/jobs`

Lista jobs editoriais com filtros.

### `POST /api/v1/editorial/jobs/dispatch`

Executa jobs editoriais elegiveis.

Observacao:

- o cron publico recomendado para producao continua sendo `POST /api/cron?type=editorial-jobs`

### `POST /api/v1/editorial/uploads`

Upload editorial autenticado por API key ou sessao admin.

Auth aceita:
- `Authorization: Bearer <EDITORIAL_API_KEY>`
- `x-api-key: <EDITORIAL_API_KEY>`
- sessao admin same-origin

### `GET /api/v1/editorial/uploads/library`

Lista arquivos ja disponiveis no storage local editorial.

Query:
- `dir`
- `search`
- `limit`

Observacao:
- a API nao emite credenciais
- `EDITORIAL_API_KEY` precisa ser provisionada externamente

Documentacao operacional detalhada: `docs/api-editorial-llm.md`

## Erros e status codes

Padrao geral observado:
- `200` sucesso
- `400` payload invalido
- `401` nao autenticado
- `403` sem permissao
- `429` rate limit
- `500` erro interno
- `503` dependencia/config indisponivel

Codigos estaveis relevantes no fluxo editorial:

- `UNAUTHORIZED`
- `INVALID_PAYLOAD`
- `INVALID_QUERY`
- `NOT_FOUND`
- `WORKFLOW_CONFLICT`
- `VALIDATION_REQUIRED`

## Variaveis de ambiente relevantes

- Banco local
  - `DATABASE_URL`
- Newsletter/Email
  - `NEXT_PUBLIC_SITE_URL`
  - `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`, `SMTP_SECURITY`
  - `FROM_EMAIL`, `FROM_NAME`, `REPLY_TO`
  - `NEWSLETTER_INBOX_EMAIL`, `CONTACT_INBOX_EMAIL`, `CAREERS_INBOX_EMAIL`
  - `BUTTONDOWN_API_KEY` (opcional)
- Upload
  - `UPLOADS_DIR` (opcional)
- Editorial API
  - `EDITORIAL_API_KEY`
  - `CRON_API_SECRET`
  - `ALLOW_INTERNAL_EDITORIAL_IP_BYPASS`
  - `EDITORIAL_ALLOWED_IPS`
  - `EDITORIAL_ALLOWED_CIDRS`
  - `EDITORIAL_ALLOW_PRIVATE_NETWORKS`

## Fora de escopo deste documento

- APIs do servico `collector/` (analytics separado)
- Endpoints de MCP (`mcp-server/`)
- detalhes operacionais completos do cron editorial

Runbooks relacionados:

- `docs/api-editorial-llm.md`
- `docs/ops/RUNBOOK_EDITORIAL_LLM.md`
