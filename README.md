# Portal Econômico Mundial (PEM)

Portal de notícias profissional especializado em geopolítica, economia global e tecnologia.

## 🚀 Tecnologias

- **Frontend**: React 18 + TypeScript + Vite
- **Estilização**: Tailwind CSS + shadcn/ui
- **Roteamento**: React Router DOM
- **Estado**: React Hooks + LocalStorage/SessionStorage
- **Backend**: Supabase (Postgres + Auth + Edge Functions)
- **Ícones**: Lucide React

## 📁 Estrutura

```
/src
  /components    # Componentes React
  /config        # Configurações globais
  /contexts      # React Contexts (Auth, etc)
  /hooks         # Custom hooks
  /lib           # Utilitários (logger, supabase)
  /pages         # Páginas
  /services      # Serviços de API
  /types         # TypeScript types
/collector       # Analytics collector (Node.js)
/supabase        # Edge Functions
/sdk             # SDK de analytics
/docs            # Documentação completa
```

## 🛠️ Desenvolvimento

```bash
# Instalar dependências
npm install

# Servidor de desenvolvimento (porta 5173)
npm run dev

# Build de produção
npm run build

# Lint
npm run lint
```

### ⚠️ Nota sobre o Plugin kimi-plugin-inspect-react

**Atualização (2026-02-05):** O plugin `kimi-plugin-inspect-react` foi removido do `vite.config.ts` devido a incompatibilidade com Vite 7 + ES modules. O plugin causava o erro:
```
Error: Dynamic require of "...kimi-plugin-inspect-react..." is not supported
```

A remoção não afeta a funcionalidade do projeto. Veja `docs/19-convencoes-desenvolvimento.md` para mais detalhes.

### 📍 Padrão de Portas

| Serviço | Porta | Descrição |
|---------|-------|-----------|
| **Frontend** | **5173** | Porta obrigatória para desenvolvimento local |
| Analytics Collector | 3000 | Apenas se usando sistema de analytics |
| Metabase | 3001 | Dashboard de analytics (se habilitado) |
| PostgreSQL | 5432 | Banco de analytics (se habilitado) |

⚠️ **IMPORTANTE**: A porta **5173 é obrigatória** para o frontend. 
- Se a porta estiver ocupada, encerre o processo anterior antes de iniciar
- **NUNCA** use outra porta sem permissão explícita do usuário

## 🔒 Segurança

Veja o **[Relatório de Auditoria de Segurança](./docs/AUDITORIA_SEGURANCA.md)** para detalhes completos.

### Checklist Pré-Deploy

- [ ] Todas as variáveis de ambiente configuradas
- [ ] Senha hardcoded removida do collector
- [ ] Console.logs protegidos (apenas em DEV)
- [ ] HTTPS habilitado em todos os endpoints
- [ ] Headers de segurança configurados no servidor

### Variáveis de Ambiente

**Frontend (.env):**
```bash
VITE_SUPABASE_URL=https://seu-projeto.supabase.co
VITE_SUPABASE_ANON_KEY=sua-anon-key
VITE_FINNHUB_API_KEY=sua-chave-finnhub
VITE_FINNHUB_ENABLED=true
VITE_SITE_URL=https://seu-dominio.com
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

### Build estático
```bash
npm run build
```

Saída em `/dist` - pronto para upload no Hostinger ou outro serviço de hospedagem.

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

📚 **[Documentação Completa da Integração](./docs/FINNHUB-GUIA-COMPLETO.md)**

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

Edge Function: `supabase/functions/ai-news/index.ts`

Variáveis de ambiente necessárias:
- `GNEWS_API_KEY`
- `OPENROUTER_API_KEY`
- `OPENROUTER_TEXT_MODEL`

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
| [`AUDITORIA_SEGURANCA.md`](./docs/AUDITORIA_SEGURANCA.md) | 🔒 **Relatório de segurança completo** |
| [`FINNHUB-GUIA-COMPLETO.md`](./docs/FINNHUB-GUIA-COMPLETO.md) | 📈 **Guia completo Finnhub API** |
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

© 2024 Portal Econômico Mundial. Todos os direitos reservados.

---

**⚠️ IMPORTANTE:** Antes de fazer deploy em produção, leia o [Relatório de Auditoria de Segurança](./docs/AUDITORIA_SEGURANCA.md) e execute o checklist de segurança.
