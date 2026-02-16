# Cenario Internacional (CIN)

Portal de notícias profissional especializado em geopolítica, economia internacional e tecnologia.

## 🚀 Tecnologias

- **Framework**: Next.js 14+ (App Router)
- **Frontend**: React 19 + TypeScript
- **Estilização**: Tailwind CSS + shadcn/ui
- **Roteamento**: Next.js App Router (File-based)
- **Estado**: React Hooks + LocalStorage/SessionStorage
- **Backend**: Supabase (Postgres + Auth + Edge Functions)
- **Ícones**: Lucide React

> **Nota:** Migração concluída para Next.js App Router (Vite/React Router removidos). Veja [MIGRATION_LOG.md](./docs/_migration/MIGRATION_LOG.md) para histórico.

## 📁 Estrutura

```
/src
  /app           # Next.js App Router (páginas)
    /(auth)      # Grupo de rotas de autenticação
    /(site)      # Grupo de rotas do site
  /components    # Componentes React
  /config        # Configurações globais
  /contexts      # React Contexts (Auth, etc)
  /hooks         # Custom hooks
  /lib           # Utilitários (logger, supabase)
  /services      # Serviços de API
  /types         # TypeScript types
/collector       # Analytics collector (Node.js)
/mcp-server      # Servidor MCP (Model Context Protocol)
/supabase        # Edge Functions
/sdk             # SDK de analytics
/docs            # Documentação completa
```

## 🛠️ Desenvolvimento

```bash
# Instalar dependências
npm install

# Servidor de desenvolvimento Next.js (porta 5173)
npm run dev

# Build de produção
npm run build

# Iniciar servidor de produção
npm start

# Lint
npm run lint
```

### 📍 Padrão de Portas

| Serviço | Porta | Descrição |
|---------|-------|-----------|
| **Frontend (Next.js)** | **5173** | Porta padrão do projeto |
| Analytics Collector | 3001 | Apenas se usando sistema de analytics |
| Metabase | 3002 | Dashboard de analytics (se habilitado) |
| PostgreSQL | 5432 | Banco de analytics (se habilitado) |

## 🔒 Segurança

Veja o **[Relatório de Auditoria de Segurança](./docs/audits/AUDITORIA_SEGURANCA.md)** para detalhes completos.

### Checklist Pré-Deploy

- [ ] Todas as variáveis de ambiente configuradas
- [ ] Senha hardcoded removida do collector
- [ ] Console.logs protegidos (apenas em DEV)
- [ ] HTTPS habilitado em todos os endpoints
- [ ] Headers de segurança configurados no servidor

### Variáveis de Ambiente

**Frontend (.env):**
```bash
NEXT_PUBLIC_SUPABASE_URL=https://seu-projeto.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=sua-anon-key
NEXT_PUBLIC_FINNHUB_API_KEY=sua-chave-finnhub
NEXT_PUBLIC_FINNHUB_ENABLED=true
NEXT_PUBLIC_SITE_URL=https://seu-dominio.com
```

**Collector (.env):**
```bash
POSTGRES_HOST=db.seu-projeto.supabase.co
POSTGRES_PORT=5432
POSTGRES_DB=pem_analytics
POSTGRES_USER=postgres
POSTGRES_PASSWORD=<SENHA_FORTE_OBRIGATORIA>
```

⚠️ **NUNCA** commite o arquivo `.env`! Use `.env.example` como template.

## 📦 Deploy

### Build Next.js
```bash
npm run build
```

Saída em `/.next` - otimizado para deploy em servidores Node.js ou Vercel.

### Deploy em Servidores Tradicionais (Hostinger, etc)
Para hospedagens compartilhadas sem Node.js, use a exportação estática:

1. Configure `next.config.js`:
```javascript
const nextConfig = {
  output: 'export',
  distDir: 'dist',
}
```

2. Execute o build:
```bash
npm run build
```

3. Faça upload da pasta `/dist` gerada.

> **Nota:** Com exportação estática, algumas funcionalidades dinâmicas (como API routes) podem não funcionar.

### Configurações de Segurança no Servidor

Adicione estes headers no seu servidor web (nginx/apache):

```nginx
add_header X-Frame-Options "SAMEORIGIN" always;
add_header X-Content-Type-Options "nosniff" always;
add_header X-XSS-Protection "1; mode=block" always;
add_header Referrer-Policy "strict-origin-when-cross-origin" always;
add_header Content-Security-Policy "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; connect-src 'self' https://*.supabase.co https://*.finnhub.io;" always;
```

## ✨ Funcionalidades

- ✅ Ticker de mercado em tempo real (Finnhub)
- ✅ **24 endpoints Finnhub** (cotações, earnings, IPOs, análises)
- ✅ Notícias completas com imagens
- ✅ Sistema de leitura limitada (regra no banco)
- ✅ Questionário para desbloqueio
- ✅ Favoritos e histórico (Supabase)
- ✅ Progresso de leitura
- ✅ Compartilhamento social
- ✅ **Tradução automática** (10 idiomas via Google Translate)
- ✅ SEO completo + JSON-LD
- ✅ Design responsivo
- ✅ Semântica HTML
- ✅ Analytics first-party (LGPD-compliant)
- ✅ **MCP Server** - Integração com Codex CLI para controle via IA

### 🚀 Roadmap para Competir com Grandes Portais (Gratuito)

Funcionalidades em desenvolvimento para igualar Infomoney, Valor, Estadão:

| Status | Funcionalidade | Impacto |
|--------|---------------|---------|
| 🔄 | **Push Notifications** (OneSignal - 10k grátis) | Retenção +40% |
| 🔄 | **Newsletter** (Buttondown - 1k subs grátis) | Leads recorrentes |
| 🔄 | **Comentários** (Giscus/GitHub - grátis) | Engajamento |
| 🔄 | **PWA** (Progressive Web App) | Instalação mobile |
| 🔄 | **AMP** (Accelerated Mobile Pages) | SEO Discover |
| 🔄 | **Cache Avançado** (ISR + unstable_cache) | Performance |

📊 **Nota atual:** 6.8/10 | 🎯 **Com roadmap:** 9.0+/10

👉 [Ver checklist completo de implementação](./docs/22-deploy-producao-checklist.md)

## 🤖 MCP Server (Model Context Protocol)

O portal possui um **servidor MCP completo** para integração com assistentes de IA.

### Funcionalidades do MCP

| Categoria | Ferramentas |
|-----------|-------------|
| **Analytics** | Leitura completa de tracking, estatísticas de artigos, sessões de usuários |
| **Conteúdo** | Criar, editar, publicar e excluir artigos via comandos de linguagem natural |
| **Mercado** | Cotações em tempo real, notícias Finnhub, calendário de earnings |

### Instalação Rápida

```bash
cd mcp-server
./setup.sh
```

### Configuração no Codex

```toml
[[servers]]
name = "cin"
type = "stdio"
command = "node"
args = ["/caminho/para/mcp-server/dist/index.js"]
```

📚 **[Documentação Completa do MCP](./docs/20-mcp-server.md)**

---

## 📈 Integração Finnhub API

O portal possui integração completa com a **Finnhub API** (plano gratuito - 60 calls/min):

### Funcionalidades Implementadas

| Categoria | Funções |
|-----------|---------|
| **Cotações** | `getQuote`, `getMultipleQuotes` |
| **Notícias** | `getMarketNews`, `getCompanyNews` |
| **Calendários** | `getEarningsCalendar` ✅, `getIPOCalendar`, `getEconomicCalendar` |
| **Busca** | `searchSymbols`, `getStockSymbols` |
| **Análise** | `getRecommendationTrends`, `getPriceTarget`, `getBasicFinancials` |
| **Peers** | `getStockPeers`, `getSupplyChain` |
| **Alternativos** | `getCongressionalTrading` 🏛️, `getInsiderTransactions` |
| **Documentos** | `getSECFilings` |
| **Status** | `getMarketStatus`, `getMarketHolidays` |
| **Forex/Crypto** | `getForexRates`, `getCryptoQuote` |
| **WebSocket** | `createFinnhubWebSocket` (dados em tempo real) |

### Exemplo de Uso

```typescript
import { getEarningsCalendar, getRecommendationTrends } from '@/services/economics/finnhubService';

// Calendário de earnings
const earnings = await getEarningsCalendar('2026-02-01', '2026-02-28');
// [{ symbol: 'AAPL', date: '2026-02-06', hour: 'amc', epsEstimate: 1.50 }]

// Recomendações de analistas
const trends = await getRecommendationTrends('AAPL');
// { buy: 25, hold: 10, sell: 2, strongBuy: 15 }
```

### Widgets Implementados

1. **MarketTicker** - Cotações em tempo real no header
2. **Earnings na Home** - Próximos resultados trimestrais
3. **EconomicAgenda** - Calendário econômico

📚 **[Documentação Completa da Integração](./docs/product/FINNHUB-GUIA-COMPLETO.md)**

---

## 🧱 Banco de Dados (Supabase)

### Tabelas principais
- `profiles` (usuários e papéis)
- `categories`
- `tags`
- `news_articles`
- `news_article_categories`
- `news_article_tags`
- `comments`
- `bookmarks`
- `likes`
- `reading_progress`
- `reading_history`
- `app_settings`
- `anon_readers` (leitores anônimos)
- `anon_article_unlocks`
- `contact_messages` (mensagens de contato)
- `career_applications` (candidaturas)

### Configurações no banco
As regras do limite de leitura ficam em `app_settings`:
- `reading_limit_enabled` (bool)
- `reading_limit_percentage` (0–1)
- `max_free_articles` (int)
- `reading_limit_scope` (`anon` ou `all`)

## 👤 Administração de Usuários (Supabase Edge Function)

Edge Function: `supabase/functions/admin-users/index.ts`

### Deploy da Function
```bash
supabase functions deploy admin-users
```

Permite ao painel admin:
- Criar usuário com senha
- Atualizar dados
- Redefinir senha
- Excluir usuário

## 🤖 Geração de Notícias (IA)

Edge Function: `supabase/functions/ai-news/index.ts` ⚠️ REMOVIDO

> **Nota**: A funcionalidade de geração de notícias com IA foi removida.
> Use a API GNews diretamente para busca de notícias.

Variáveis de ambiente necessárias:
- `GNEWS_API_KEY`

## 🖼️ Imagens em WebP

Por padrão, todas as imagens devem ser usadas em `.webp`:
- `public/logo.webp`
- `public/og-image.webp`
- `public/images/news/*.webp`

## 📊 Analytics First-Party v1.1.0

Sistema de analytics 100% first-party, gratuito e LGPD-compliant. **Sem Google Analytics, sem cookies de terceiros.**

Veja a documentação completa em:
- [`docs/04-analytics-first-party.md`](./docs/04-analytics-first-party.md)
- [`docs/05-lgpd-compliance.md`](./docs/05-lgpd-compliance.md)

### Eventos Rastreados

**Navegação:** page_view, session_start/end  
**Engajamento:** scroll_depth, engagement_pulse  
**Conteúdo:** article_read_start, article_read_progress, article_read_complete  
**Performance:** web_vital (LCP, CLS, INP, TTFB, FCP, FID)  
**Erros:** js_error, resource_error, promise_rejection

### Endpoints
- `POST /collect` - Recebe eventos
- `POST /forget` - Deleção de dados (LGPD)
- `GET /health` - Health check

## 📚 Documentação Completa

Veja a pasta [`/docs`](./docs):

| Documento | Descrição |
|-----------|-----------|
| [`AUDITORIA_SEGURANCA.md`](./docs/audits/AUDITORIA_SEGURANCA.md) | 🔒 **Relatório de segurança completo** |
| [`FINNHUB-GUIA-COMPLETO.md`](./docs/product/FINNHUB-GUIA-COMPLETO.md) | 📈 **Guia completo Finnhub API** |
| [`AUDITORIA_DATABASE.md`](./docs/AUDITORIA_DATABASE.md) | 📊 **Auditoria do banco de dados** |
| [`00-visao-geral.md`](./docs/00-visao-geral.md) | Visão geral do projeto |
| [`01-arquitetura.md`](./docs/01-arquitetura.md) | Arquitetura e padrões |
| [`02-seo-e-adsense.md`](./docs/02-seo-e-adsense.md) | SEO e monetização |
| [`03-design-system.md`](./docs/03-design-system.md) | Sistema de design |
| [`04-analytics-first-party.md`](./docs/04-analytics-first-party.md) | Analytics próprio |
| [`05-lgpd-compliance.md`](./docs/05-lgpd-compliance.md) | Conformidade LGPD |
| [`06-deploy-hostinger.md`](./docs/06-deploy-hostinger.md) | Guia de deploy |
| [`CONTRIBUTING.md`](./CONTRIBUTING.md) | Guia de contribuição |

📖 **Índice completo:** [`docs/README.md`](./docs/README.md)

## 🔮 Integração Backend (Futuro)

O projeto está preparado para integração com backend real:

1. Substituir mocks por chamadas API reais
2. Implementar autenticação JWT
3. Adicionar sistema de comentários
4. Integrar APIs de mercado financeiro

## 📄 Licença

© 2024 Cenario Internacional. Todos os direitos reservados.

---

**⚠️ IMPORTANTE:** Antes de fazer deploy em produção, leia o [Relatório de Auditoria de Segurança](./docs/audits/AUDITORIA_SEGURANCA.md) e execute o checklist de segurança.
