# Changelog - Portal Econômico Mundial

Todas as mudanças notáveis neste projeto serão documentadas neste arquivo.

O formato é baseado em [Keep a Changelog](https://keepachangelog.com/pt-BR/1.0.0/), e este projeto adere ao [Versionamento Semântico](https://semver.org/lang/pt-BR/).

---

## [Unreleased]

### Added
- Finnhub free plan mode with ETF proxy symbols for indices and commodities.
- New info pages: `/termometro-de-risco` and `/mapa-de-tensoes`, plus footer links.
- Home briefing now shows live Finnhub highlights when available.
- Risk thermometer and tension map can render live data when available (fallback to mock data).
- New pages and forms: `/fale-conosco` and `/trabalhe-conosco` with database storage.

### Changed
- Login now auto-redirects authenticated users to `/admin` (admin) or `/app` (user).
- Economic calendar fetch is disabled on Finnhub free plan to avoid 403 errors.
- Finnhub client now coalesces in-flight requests and temporarily blocks rate-limited endpoints.

### Fixed
- Supabase Edge Function `admin-users` now supports CORS preflight (requires redeploy).
- Footer labels/accents were corrected.

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
