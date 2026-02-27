# Changelog - Cenario Internacional

Todas as mudanÃ§as notÃ¡veis neste projeto serÃ£o documentadas neste arquivo.

O formato Ã© baseado em [Keep a Changelog](https://keepachangelog.com/pt-BR/1.0.0/), e este projeto adere ao [Versionamento SemÃ¢ntico](https://semver.org/lang/pt-BR/).

---

## [Unreleased]

### Fixed
- **MarketTicker não exibia dados** - Corrigido problema onde o ticker de mercado não aparecia:
  - Problema: Componente cliente tentava chamar funções servidor diretamente (usavam PostgreSQL)
  - Solução: Criada API route `/api/ticker` que o frontend pode chamar
  - Arquivos: `src/app/api/ticker/route.ts` (novo), `src/hooks/economics/useFinnhub.ts` (modificado)
  - Fluxo: Cron Job → Finnhub API → PostgreSQL → API Route → Frontend

### Added
- **Sistema de Publicação Agendada** - Implementado sistema automático de publicação de posts:
  - Problema: Posts agendados não eram publicados automaticamente
  - Solução: Cron job a cada 1 minuto que verifica e publica artigos agendados
  - Arquivos: `src/services/newsManager.ts` (modificado), `src/app/api/cron/route.ts` (modificado), `scripts/cron-refresh.sh` (modificado)
  - Funcionamento: PostgreSQL local primeiro, fallback Supabase, batch de 50 por execução
  - Logs detalhados para debugging
- **SEO Improvements** - Melhorias para igualar os grandes portais:
  - Schema.org FAQPage (`generateFaqJsonLd`) para fragmentos ricos no Google
  - Página "Como Produzimos" (`/como-produzimos/`) com processo jornalístico completo
  - FAQ com 5 perguntas frequentes sobre metodologia editorial
  - Política de correções pública
  - Google Search Console configurado
- **OneSignal Push Notifications** - Script adicionado ao `<head>` de todas as páginas públicas:
  - Componente `OneSignalHeadScript.tsx` para carregamento no head
  - Integração via metadata no layout `(site)`
  - Mantido fallback `OneSignalInit.tsx` para redundância
  - App ID configurado: `NEXT_PUBLIC_ONESIGNAL_APP_ID`
- **MCP Server v1.1.0** - Servidor Model Context Protocol completo para integraÃ§Ã£o com Codex CLI:
  - **17 ferramentas** organizadas em 3 categorias:
    - **Analytics (6)**: `get_analytics_events`, `get_article_stats`, `get_top_articles`, `get_user_sessions`, `get_dashboard_metrics`, `get_traffic_sources`
    - **Gerenciamento de ConteÃºdo (7)**: `create_article` (completo), `update_article` (completo), `delete_article`, `search_articles`, `list_articles`, `get_article_by_slug`, `publish_article`
    - **Dados de Mercado (4)**: `get_market_quote`, `get_market_news`, `get_earnings_calendar`, `get_stock_recommendations`
  - **Campos completos de artigo**:
    - ConteÃºdo: tÃ­tulo, resumo, conteÃºdo (PT/EN)
    - SEO: meta description (160 chars), keywords
    - CategorizaÃ§Ã£o: categoria + tags (com relaÃ§Ãµes many-to-many)
    - MÃ­dia: imagem de capa
    - ConfiguraÃ§Ãµes: featured, breaking, status, agendamento
    - MÃ©tricas: views, likes, shares iniciais
  - Acesso completo a tracking/analytics via Supabase Service Role
  - CRUD de artigos via comandos de linguagem natural
  - IntegraÃ§Ã£o Finnhub para cotaÃ§Ãµes e calendÃ¡rio de earnings
  - DocumentaÃ§Ã£o completa em `docs/20-mcp-server.md`
  - Guia de instalaÃ§Ã£o em `mcp-server/INSTALL.md`
  - Script de setup automÃ¡tico `mcp-server/setup.sh`
- **E-E-A-T Signals** - Sinais de autoridade e credibilidade para SEO:
  - PÃ¡ginas de autores individuais (`/autor/[slug]`) com schema.org `Person` + `ProfilePage` (transparÃªncia editorial)
  - Campos de transparÃªncia no autor: `website`, `location`, `credentials` (migraÃ§Ã£o: `supabase/migrations/20260217_add_author_transparency_fields.sql`)
  - PÃ¡gina Editorial (`/editorial`) com policies (ethics, masthead, corrections)
  - Badges de verificaÃ§Ã£o (FactCheckBadge component)
  - Schema ReviewedBy nos artigos
  - 4 autores configurados com formaÃ§Ã£o, prÃªmios e expertise
- **Cookie Banner LGPD** - Sistema de consentimento granular:
  - 3 categorias: NecessÃ¡rios, Analytics, Publicidade
  - IntegraÃ§Ã£o com AdSense (sÃ³ carrega ads com consentimento)
  - Salva preferÃªncias em cookie seguro
- **OtimizaÃ§Ãµes de Performance**:
  - Preconnect e DNS Prefetch para domÃ­nios externos
  - Script AdSense com lazy loading
- Tabelas de analytics: `analytics_events` e `analytics_sessions` com RLS policies
- MigraÃ§Ã£o SQL para analytics em `supabase/migrations/`

### SEO (Portal-Grade)
- Canonical/OG/Twitter padronizados por rota (evita canonical errado herdado do root).
- `noindex` aplicado em rotas internas e rotas finas via `layout.tsx`/`generateMetadata`.
- `robots.ts` com higiene para bloquear rotas internas e reduzir crawl de tracking params (`utm_`, `gclid`, `fbclid`, etc).
- JSON-LD com coerÃªncia melhor (URLs/imagens absolutas; `ItemList` alinhado ao schema).

### Changed
- Login now auto-redirects authenticated users to `/admin` (admin) or `/app` (user).
- Economic calendar fetch is disabled on Finnhub free plan to avoid 403 errors.
- Finnhub client now coalesces in-flight requests and temporarily blocks rate-limited endpoints.
- `generateArticleJsonLd` atualizado com suporte a `reviewedBy`, `speakable`, `citation`
- Playwright E2E now runs against a production server (`npm run build && npm run start`) on `http://127.0.0.1:3000` for stability; locale is forced to `pt-BR` for deterministic assertions.

### Fixed
- Supabase Edge Function `admin-users` now supports CORS preflight (requires redeploy).
- Footer labels/accents were corrected.
- Eslint errors em novos componentes corrigidos
- Remocao de `<title>` solto em paginas client (admin) para evitar head inconsistente no App Router.
- Fixed a production crash in `MarketTicker` caused by calling React hooks after a conditional return.
- E2E smoke tests now validate `/rss.xml` and `/sitemap.xml` via `page.request.get()` (Firefox navigation could treat XML as download).
- E2E determinism: external market widgets/services are disabled during tests via `NEXT_PUBLIC_ENABLE_MARKET_TICKER=false` and `NEXT_PUBLIC_FINNHUB_ENABLED=false` (see `playwright.config.ts`).
- **Next.js 16 Turbopack build error** - Downgraded to Next.js 15 to resolve "Dependency tracking is disabled so invalidation is not allowed" panic
- **Collector Docker build error** - Changed from Node 18 to Node 20, removed `--only=production` flag to install TypeScript dependencies
- **OptimizeCss removed** - Removed `optimizeCss: true` from next.config.js (critters module not found during build)

---

## [1.1.0] - 2024-01-15

### ðŸš€ Novas Funcionalidades do Portal

#### 1. Sistema de ComentÃ¡rios
- **Arquivos criados:**
  - `/src/services/comments/types.ts` - Interfaces e tipos
  - `/src/services/comments/index.ts` - ExportaÃ§Ãµes
  - `/src/hooks/useComments.ts` - Hook de gerenciamento
  - `/src/components/interactive/CommentSection.tsx` - Componente UI

- **Funcionalidades:**
  - ComentÃ¡rios apenas para usuÃ¡rios logados
  - ValidaÃ§Ã£o de conteÃºdo (min/max caracteres)
  - Cooldown entre submissÃµes (30s)
  - ExclusÃ£o de prÃ³prios comentÃ¡rios
  - OrdenaÃ§Ã£o por data (mais recentes primeiro)

#### 2. Menu de NavegaÃ§Ã£o Expandido
- **Categorias adicionadas:**
  - mercados, energia, macroeconomia, moedas
  - comercio-global, defesa, analises

- **Melhorias:**
  - Menu dropdown com details/summary (semÃ¢ntico)
  - Highlight de pÃ¡gina ativa
  - Mobile menu com submenus expansÃ­veis
  - BotÃ£o de cadastro no header

#### 3. PÃ¡gina de Cadastro
- **Arquivo criado:** `/src/pages/Register.tsx`
- **Rota:** `/cadastro`
- **Funcionalidades:**
  - ValidaÃ§Ã£o completa de formulÃ¡rio
  - VerificaÃ§Ã£o de email Ãºnico
  - Senha com requisitos de seguranÃ§a
  - Login automÃ¡tico apÃ³s cadastro

#### 4. MÃ³dulos Geo/EconÃ´micos
- **Componentes criados:**
  - `/src/components/geoEcon/TensionMap.tsx` - Mapa de tensÃµes
  - `/src/components/geoEcon/EconomicAgenda.tsx` - Agenda econÃ´mica
  - `/src/components/geoEcon/RiskThermometer.tsx` - TermÃ´metro de risco

#### 5. IntegraÃ§Ã£o Finnhub API
- Dados de mercado em tempo real
- CalendÃ¡rio econÃ´mico
- NotÃ­cias financeiras
- WebSocket para streaming

### ðŸ“± Mobile Optimization
- Touch targets mÃ­nimos de 44px
- Tipografia responsiva
- Lazy loading de imagens

---

## [1.0.0] - 2024-01-15

### Analytics First-Party - ImplementaÃ§Ã£o Completa

#### Adicionado
- **Infraestrutura:**
  - `docker-compose.yml` - Stack completa (postgres, collector, metabase)
  - `scripts/verify.sh` - Script de validaÃ§Ã£o determinÃ­stico
  - `scripts/partition-manager.sh` - CriaÃ§Ã£o automÃ¡tica de partiÃ§Ãµes
  
- **Collector API (Node.js + Fastify):**
  - `collector/src/server.ts` - Servidor Fastify com plugins
  - `collector/src/routes/collect.ts` - Endpoint POST /collect
  - `collector/src/routes/health.ts` - Endpoint GET /health
  - `collector/src/db/insert.ts` - Batch insert com deduplicaÃ§Ã£o
  
- **Database:**
  - `collector/src/db/migrations/0001_init.sql` - Schema inicial
  - Particionamento mensal (events_raw_YYYY_MM)
  - UNIQUE INDEX(event_id) por partiÃ§Ã£o
  - Ãndices GIN para JSONB

#### CaracterÃ­sticas
- **DeduplicaÃ§Ã£o:** ON CONFLICT (event_id) DO NOTHING
- **Fail-Fast:** Collector nÃ£o inicia sem partiÃ§Ã£o do mÃªs atual
- **LGPD:** Hash de IP, flag anonymous, sem PII

#### DocumentaÃ§Ã£o
- `docs/04-analytics-first-party.md`
- `docs/05-lgpd-compliance.md`
- `docs/07-event-versioning.md`
- `docs/08-data-governance.md`
- `docs/09-event-schema.md`
- `docs/10-data-model-postgres.md`
- `docs/11-data-quality.md`

---

## [0.9.0] - 2024-01-10

### Portal Base

#### Funcionalidades
- Ticker de mercado em tempo real
- 10 notÃ­cias completas com imagens
- Favoritos e histÃ³rico (Supabase)
- Progresso de leitura
- SEO completo + JSON-LD

---

## ConvenÃ§Ãµes de Versionamento

- **MAJOR** (X.0.0): Breaking changes no schema de eventos
- **MINOR** (x.Y.0): Novos eventos ou campos opcionais
- **PATCH** (x.y.Z): CorreÃ§Ãµes de documentaÃ§Ã£o ou bugs

---

**Nota:** Este changelog foca na documentaÃ§Ã£o e especificaÃ§Ã£o tÃ©cnica. MudanÃ§as de cÃ³digo sÃ£o adicionadas Ã  medida que o sistema Ã© implementado.

## Atualizacao operacional - 2026-02-16

- Metabase: dashboard principal `Tracking Completo - Executivo` (ID `3`).
- URL de acesso: `https://metabase.cenariointernacional.com.br/dashboard/3-tracking-completo-executivo`.
- Filtro global de dias habilitado no dashboard (`periodo_global`).
- Cobertura de mapeamento do filtro: `20/20` cards.
- Script de automacao adicionado: `scripts/metabase/apply-dashboard-date-filter.py`.

## Atualizacao operacional - 2026-02-16 (Email Hostinger SMTP)

- Integracao de email transacional via SMTP da Hostinger.
- Rotas adicionadas: `/api/contact-messages` e `/api/career-applications`.
- Notificacoes automáticas em `/api/admin-users` para criacao/alteracao de email/senha.
- Templates centralizados em `src/lib/server/emailTemplates.ts`.
- Servico SMTP centralizado em `src/lib/server/email.ts`.
- Smoke test em 1 comando: `npm run test:smoke:email`.
- Resultado validado no ambiente local: contato/carreiras `200` em payload valido e `400` em payload invalido.

## Atualizacao operacional - 2026-02-20 (Migração Banco Local PostgreSQL)

### Infraestrutura
- Container PostgreSQL configurado no docker-compose.yml
- Deploy para VPS (IP: 187.77.37.175)
- Container `portal-database` em execução (saudável)

### Banco de Dados
- 19 tabelas criadas no PostgreSQL local:
  - news_articles, categories, authors, profiles
  - job_applications, contact_messages, leads
  - comments, post_actions, bookmarks, reading_history, reading_progress
  - news_article_categories, news_article_tags, tags
  - news_slug_redirects, analytics_events, analytics_sessions
  - app_errors, external_snapshots
- Schema `auth` criado com roles e funções
- Função `auth.uid()` implementada para RLS

### Correções Aplicadas
- Encoding corrigido em arquivos admin (mojibake → UTF-8)
- API route `/api/articles` criada com Service Role Key
- Nginx config atualizado: `client_max_body_size 10M`
- Variáveis de ambiente corrigidas em supabaseAdmin.ts

### Arquivos Criados
- `docs/_migration/LOCAL_DB_STATUS.md` - Status completo da migração
- `supabase/migrations/20260220_full_migration_local.sql` - SQL completo
- `scripts/create-auth-functions.sql` - Funções auth

---

## Atualizacao operacional - 2026-02-16 (Newsletter)

- Endpoint implementado: `/api/newsletter/subscribe`.
- Formulario da Home integrado ao endpoint (`src/app/HomePageClient.tsx`).
- Confirmacao por email e alerta interno via SMTP Hostinger.
- Deduplicacao validada por API (`alreadySubscribed: true` na segunda tentativa com mesmo email).
- Persistencia operacional com fallback em `contact_messages` quando `public.leads` nao estiver disponivel no schema API do ambiente.
- Pendencia mantida: migrar operacao para `public.leads` no ambiente e implementar double opt-in.

