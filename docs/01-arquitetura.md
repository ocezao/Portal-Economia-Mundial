# Arquitetura do Cenario Internacional

## Resumo executivo

O projeto hoje e um monolito Next.js com App Router, banco PostgreSQL local e auth local do proprio app. A camada editorial principal roda dentro do namespace `/api/v1/editorial`, enquanto analytics continua separado no servico `collector/`.

Arquitetura atual:

1. aplicacao web e APIs no mesmo projeto Next.js
2. banco local PostgreSQL acessado por `DATABASE_URL`
3. uploads em filesystem local sob `public/uploads`
4. auth local com sessoes do app
5. cron HTTP para jobs editoriais e refresh de snapshots
6. collector de analytics isolado

## Componentes principais

### 1. Aplicacao principal

Local:

- `src/app`
- `src/components`
- `src/hooks`
- `src/services`
- `src/lib`

Responsabilidades:

- portal publico
- area admin
- API routes
- renderizacao SEO
- gestao editorial
- newsletter, contato, carreiras
- upload de imagens

### 2. Banco de dados local

Local:

- `src/lib/db.ts`
- `supabase/migrations/*.sql`

Estado atual:

- o app depende de `DATABASE_URL`
- operacoes editoriais, auth local, newsletter, comentarios e dados principais usam PostgreSQL local
- o diretorio `supabase/migrations` permanece como historico e mecanismo de schema, nao como indicacao de que o runtime principal ainda seja Supabase

### 3. Auth local

Local:

- `src/lib/server/localAuth.ts`
- `src/contexts/AuthContext.tsx`
- `src/app/api/auth/*`

Responsabilidades:

- login
- logout
- sessao atual
- registro
- autorizacao admin/editorial

### 4. API editorial para LLMs

Local:

- `src/app/api/v1/editorial/*`
- `src/lib/server/editorialAdmin.ts`
- `src/lib/server/editorialApi.ts`
- `src/lib/server/editorialHttp.ts`
- `src/services/editorialJobs.ts`

Capacidades atuais:

- discovery
- auth check
- OpenAPI
- meta
- readiness
- market context
- slug helper
- listagem e leitura de artigos
- create e update
- enrich
- seo audit
- internal links
- similar articles
- validate
- approve
- sources
- publish
- schedule
- jobs
- uploads
- upload library

Workflow enforced no backend:

1. artigo nasce em `draft`
2. fontes precisam existir para prontidao
3. `validate` identifica erros e warnings
4. `approve` exige validacao sem erros
5. `publish` e `schedule` exigem validacao + aprovacao

### 5. Uploads locais

Local:

- `src/app/api/upload/route.ts`
- `src/app/api/v1/editorial/uploads/route.ts`
- `src/lib/server/fileStorage.ts`

Comportamento:

- imagens raster passam por processamento e podem virar WebP
- SVG e outros vetores seguem fluxo controlado
- arquivos vao para `public/uploads`
- a URL publicada e local ao proprio app

### 6. Cron e jobs

Local:

- `src/app/api/cron/route.ts`
- `src/services/editorialJobs.ts`
- `src/services/newsManager.ts`

Tipos principais hoje:

- refresh de snapshots externos
- `publish-scheduled`
- `editorial-jobs`

Dependencia operacional:

- um scheduler externo precisa chamar `POST /api/cron?type=editorial-jobs`
- autenticacao do cron usa `x-cron-secret: <CRON_API_SECRET>`

### 7. Collector de analytics

Local:

- `collector/`

Caracteristica:

- servico separado do portal principal
- nao faz parte da API editorial
- pode ser operado isoladamente

## Fluxo de dados

### Portal e editorial

```text
Browser/Admin/Agent
  -> Next.js routes
  -> service layer
  -> db helpers
  -> PostgreSQL local
```

### Uploads

```text
Agent/Admin
  -> /api/upload ou /api/v1/editorial/uploads
  -> fileStorage
  -> public/uploads
  -> URL publica local
```

### Publicacao agendada

```text
Agent
  -> create draft
  -> add sources
  -> enrich
  -> validate
  -> approve
  -> schedule
  -> article_jobs
  -> cron /api/cron?type=editorial-jobs
  -> artigo publicado
```

## Fronteiras de autenticacao

### Auth do portal

- sessao local do usuario
- cookies same-origin

### Auth editorial

- `Authorization: Bearer <EDITORIAL_API_KEY>`
- `x-api-key: <EDITORIAL_API_KEY>`
- sessao admin local

Observacoes:

- a API editorial nao emite credenciais
- `CRON_API_SECRET` nao deve ser usado como credencial editorial

## Estrutura de pastas relevante

```text
src/
  app/
    (site)/
    admin/
    api/
      auth/
      upload/
      cron/
      v1/editorial/
  components/
  config/
  contexts/
  hooks/
  lib/
    server/
    db.ts
  services/
collector/
docs/
supabase/migrations/
```

## Decisoes arquiteturais importantes

### Banco local como runtime principal

Decisao:

- consolidar operacao principal no PostgreSQL local

Impacto:

- reduz dependencia operacional externa
- exige disciplina maior de backup, restore e observabilidade

### API editorial dedicada

Decisao:

- separar fluxo editorial profissional do endpoint legado `/api/articles`

Impacto:

- melhora descoberta para agentes
- facilita evolucao do workflow sem quebrar integracoes legadas

### Upload local

Decisao:

- manter storage simples e controlado em filesystem local

Impacto:

- simplifica deploy inicial
- exige estrategia clara de backup de uploads

### Cron HTTP

Decisao:

- expor cron por API route autenticada

Impacto:

- simples para VPS comum
- exige scheduler externo confiavel

## Riscos atuais

1. documentacao historica ainda possui referencias antigas a Supabase como runtime principal em alguns pontos do repositorio
2. a operacao editorial por LLM depende de scheduler externo para jobs
3. a suite global de testes ainda possui passivo legado fora do escopo editorial
4. a VPS ainda precisa de normalizacao operacional antes de considerar deploy totalmente comprovado

## Documentos relacionados

- `docs/16-api-rest.md`
- `docs/api-editorial-llm.md`
- `docs/21-image-processing.md`
- `docs/ops/RUNBOOK_EDITORIAL_LLM.md`
- `docs/RUNBOOK.md`
- `docs/22-deploy-producao-checklist.md`

## Estado desta documentacao

Data de revisao: 2026-04-01

Este documento descreve a arquitetura atual observada no codigo e substitui a visao antiga centrada em Supabase como backend principal do portal.
