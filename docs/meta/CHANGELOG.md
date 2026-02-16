# Changelog - Cenario Internacional

Todas as mudanças notáveis neste projeto serão documentadas neste arquivo.

O formato é baseado em [Keep a Changelog](https://keepachangelog.com/pt-BR/1.0.0/), e este projeto adere ao [Versionamento Semântico](https://semver.org/lang/pt-BR/).

---

## [Unreleased]

### Added
- **MCP Server v1.1.0** - Servidor Model Context Protocol completo para integração com Codex CLI:
  - **17 ferramentas** organizadas em 3 categorias:
    - **Analytics (6)**: `get_analytics_events`, `get_article_stats`, `get_top_articles`, `get_user_sessions`, `get_dashboard_metrics`, `get_traffic_sources`
    - **Gerenciamento de Conteúdo (7)**: `create_article` (completo), `update_article` (completo), `delete_article`, `search_articles`, `list_articles`, `get_article_by_slug`, `publish_article`
    - **Dados de Mercado (4)**: `get_market_quote`, `get_market_news`, `get_earnings_calendar`, `get_stock_recommendations`
  - **Campos completos de artigo**:
    - Conteúdo: título, resumo, conteúdo (PT/EN)
    - SEO: meta description (160 chars), keywords
    - Categorização: categoria + tags (com relações many-to-many)
    - Mídia: imagem de capa
    - Configurações: featured, breaking, status, agendamento
    - Métricas: views, likes, shares iniciais
  - Acesso completo a tracking/analytics via Supabase Service Role
  - CRUD de artigos via comandos de linguagem natural
  - Integração Finnhub para cotações e calendário de earnings
  - Documentação completa em `docs/20-mcp-server.md`
  - Guia de instalação em `mcp-server/INSTALL.md`
  - Script de setup automático `mcp-server/setup.sh`
- **E-E-A-T Signals** - Sinais de autoridade e credibilidade para SEO:
  - Páginas de autores individuais (`/autor/[slug]`) com schema.org Person
  - Página Editorial (`/editorial`) com policies (ethics, masthead, corrections)
  - Badges de verificação (FactCheckBadge component)
  - Schema ReviewedBy nos artigos
  - 4 autores configurados com formação, prêmios e expertise
- **Cookie Banner LGPD** - Sistema de consentimento granular:
  - 3 categorias: Necessários, Analytics, Publicidade
  - Integração com AdSense (só carrega ads com consentimento)
  - Salva preferências em cookie seguro
- **Otimizações de Performance**:
  - Preconnect e DNS Prefetch para domínios externos
  - Script AdSense com lazy loading
- Tabelas de analytics: `analytics_events` e `analytics_sessions` com RLS policies
- Migração SQL para analytics em `supabase/migrations/`

### SEO (Portal-Grade)
- Canonical/OG/Twitter padronizados por rota (evita canonical errado herdado do root).
- `noindex` aplicado em rotas internas e rotas finas via `layout.tsx`/`generateMetadata`.
- `robots.ts` com higiene para bloquear rotas internas e reduzir crawl de tracking params (`utm_`, `gclid`, `fbclid`, etc).
- JSON-LD com coerência melhor (URLs/imagens absolutas; `ItemList` alinhado ao schema).

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

---

## [1.1.0] - 2024-01-15

### 🚀 Novas Funcionalidades do Portal

#### 1. Sistema de Comentários
- **Arquivos criados:**
  - `/src/services/comments/types.ts` - Interfaces e tipos
  - `/src/services/comments/index.ts` - Exportações
  - `/src/hooks/useComments.ts` - Hook de gerenciamento
  - `/src/components/interactive/CommentSection.tsx` - Componente UI

- **Funcionalidades:**
  - Comentários apenas para usuários logados
  - Validação de conteúdo (min/max caracteres)
  - Cooldown entre submissões (30s)
  - Exclusão de próprios comentários
  - Ordenação por data (mais recentes primeiro)

#### 2. Menu de Navegação Expandido
- **Categorias adicionadas:**
  - mercados, energia, macroeconomia, moedas
  - comercio-global, defesa, analises

- **Melhorias:**
  - Menu dropdown com details/summary (semântico)
  - Highlight de página ativa
  - Mobile menu com submenus expansíveis
  - Botão de cadastro no header

#### 3. Página de Cadastro
- **Arquivo criado:** `/src/pages/Register.tsx`
- **Rota:** `/cadastro`
- **Funcionalidades:**
  - Validação completa de formulário
  - Verificação de email único
  - Senha com requisitos de segurança
  - Login automático após cadastro

#### 4. Módulos Geo/Econômicos
- **Componentes criados:**
  - `/src/components/geoEcon/TensionMap.tsx` - Mapa de tensões
  - `/src/components/geoEcon/EconomicAgenda.tsx` - Agenda econômica
  - `/src/components/geoEcon/RiskThermometer.tsx` - Termômetro de risco

#### 5. Integração Finnhub API
- Dados de mercado em tempo real
- Calendário econômico
- Notícias financeiras
- WebSocket para streaming

### 📱 Mobile Optimization
- Touch targets mínimos de 44px
- Tipografia responsiva
- Lazy loading de imagens

---

## [1.0.0] - 2024-01-15

### Analytics First-Party - Implementação Completa

#### Adicionado
- **Infraestrutura:**
  - `docker-compose.yml` - Stack completa (postgres, collector, metabase)
  - `scripts/verify.sh` - Script de validação determinístico
  - `scripts/partition-manager.sh` - Criação automática de partições
  
- **Collector API (Node.js + Fastify):**
  - `collector/src/server.ts` - Servidor Fastify com plugins
  - `collector/src/routes/collect.ts` - Endpoint POST /collect
  - `collector/src/routes/health.ts` - Endpoint GET /health
  - `collector/src/db/insert.ts` - Batch insert com deduplicação
  
- **Database:**
  - `collector/src/db/migrations/0001_init.sql` - Schema inicial
  - Particionamento mensal (events_raw_YYYY_MM)
  - UNIQUE INDEX(event_id) por partição
  - Índices GIN para JSONB

#### Características
- **Deduplicação:** ON CONFLICT (event_id) DO NOTHING
- **Fail-Fast:** Collector não inicia sem partição do mês atual
- **LGPD:** Hash de IP, flag anonymous, sem PII

#### Documentação
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
- 10 notícias completas com imagens
- Sistema de leitura limitada
- Questionário para desbloqueio
- Favoritos e histórico (Supabase)
- Progresso de leitura
- SEO completo + JSON-LD

---

## Convenções de Versionamento

- **MAJOR** (X.0.0): Breaking changes no schema de eventos
- **MINOR** (x.Y.0): Novos eventos ou campos opcionais
- **PATCH** (x.y.Z): Correções de documentação ou bugs

---

**Nota:** Este changelog foca na documentação e especificação técnica. Mudanças de código são adicionadas à medida que o sistema é implementado.

## Atualizacao operacional - 2026-02-16

- Metabase: dashboard principal `Tracking Completo - Executivo` (ID `3`).
- URL de acesso: `https://metabase.cenariointernacional.com.br/dashboard/3-tracking-completo-executivo`.
- Filtro global de dias habilitado no dashboard (`periodo_global`).
- Cobertura de mapeamento do filtro: `20/20` cards.
- Script de automacao adicionado: `scripts/metabase/apply-dashboard-date-filter.py`.

## Atualizacao operacional - 2026-02-16 (Email Hostinger SMTP)

- Integracao de email transacional via SMTP da Hostinger.
- Rotas adicionadas: `/api/contact-messages` e `/api/career-applications`.
- Notificacoes autom�ticas em `/api/admin-users` para criacao/alteracao de email/senha.
- Templates centralizados em `src/lib/server/emailTemplates.ts`.
- Servico SMTP centralizado em `src/lib/server/email.ts`.
- Smoke test em 1 comando: `npm run test:smoke:email`.
- Resultado validado no ambiente local: contato/carreiras `200` em payload valido e `400` em payload invalido.
