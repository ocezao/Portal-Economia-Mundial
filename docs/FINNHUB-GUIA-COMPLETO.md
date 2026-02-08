# 📈 Guia Completo - Finnhub API

**Última atualização:** 04/02/2026  
**Plano:** Free (60 calls/minuto)  
**Status:** ✅ Todas as 24 funções implementadas e funcionais

---

## 📑 Índice

1. [Setup e Configuração](#1-setup-e-configuração)
2. [Endpoints Implementados](#2-endpoints-implementados)
3. [Endpoints Disponíveis para Expansão](#3-endpoints-disponíveis-para-expansão)
4. [Limites do Plano](#4-limites-do-plano)
5. [Troubleshooting](#5-troubleshooting)

---

## 1. Setup e Configuração

### 1.1 Obtendo sua API Key

1. Acesse: **https://finnhub.io/**
2. Clique em **"Get free api key"**
3. Crie uma conta (nome, email, senha)
4. Verifique seu email
5. Faça login no dashboard
6. Copie sua **API Key** (formato: `c1234567890abcdefghij`)

### 1.2 Configuração do Projeto

No arquivo `.env` na raiz:

```env
# Finnhub API
NEXT_PUBLIC_FINNHUB_ENABLED=true
NEXT_PUBLIC_FINNHUB_FREE_PLAN=true
NEXT_PUBLIC_FINNHUB_API_KEY=sua_chave_aqui
NEXT_PUBLIC_FINNHUB_API_URL=https://finnhub.io/api/v1
```

### 1.3 Compatibilidade Free Plan (ETFs Proxy)

Alguns endpoints podem estar limitados no plano gratuito. O sistema usa ETFs como proxies:

**Índices (ETF → exibido como índice)**
- SPY → SPX (S&P 500)
- DIA → DJI (Dow Jones)
- QQQ → NDX (Nasdaq)
- EWZ → IBOV (Ibovespa)
- EWG → DAX
- EWU → FTSE

**Commodities (ETF → exibido como commodity)**
- BNO → BRENT
- USO → WTI
- GLD → OURO
- SLV → PRATA

Para desativar o modo free: `NEXT_PUBLIC_FINNHUB_FREE_PLAN=false`

---

## 2. Endpoints Implementados

### 2.1 Cotações e Mercado

#### `getQuote(symbol: string)`
Obtém cotação atual de um ativo.

```typescript
import { getQuote } from '@/services/economics/finnhubService';

const quote = await getQuote('AAPL');
// Retorna:
// {
//   c: 185.92,    // Preço atual
//   d: 2.15,      // Variação
//   dp: 1.17,     // Variação %
//   h: 186.50,    // Máxima do dia
//   l: 183.20,    // Mínima do dia
//   o: 184.00,    // Abertura
//   pc: 183.77,   // Fechamento anterior
//   t: 1707158400 // Timestamp
// }
```
**Usado em:** MarketTicker, páginas de detalhes

#### `getMultipleQuotes(symbols: string[])`
Cotações de múltiplos ativos simultaneamente.

```typescript
const quotes = await getMultipleQuotes(['AAPL', 'MSFT', 'GOOGL']);
```

---

### 2.2 Notícias

#### `getMarketNews(category?: string)`
Notícias gerais do mercado.

```typescript
const news = await getMarketNews('general');
// Categorias: general, forex, crypto, merger
```

#### `getCompanyNews(symbol, from, to)`
Notícias específicas de uma empresa.

```typescript
const news = await getCompanyNews('AAPL', '2026-01-01', '2026-02-04');
```

---

### 2.3 Calendários

#### `getEarningsCalendar(from, to, symbol?)` ⭐ IMPLEMENTADO NA HOME
Calendário de divulgação de resultados trimestrais.

```typescript
const earnings = await getEarningsCalendar('2026-02-04', '2026-02-11');
// Retorna:
// [
//   {
//     symbol: 'AAPL',
//     date: '2026-02-06',
//     hour: 'amc',        // 'bmo' (before market open), 'amc' (after market close)
//     epsEstimate: 1.50,
//     epsActual: null
//   }
// ]
```
**Usado em:** Widget "Earnings Esta Semana" na Home

#### `getIPOCalendar(from, to)`
Calendário de IPOs.

```typescript
const ipos = await getIPOCalendar('2026-02-01', '2026-02-28');
```

#### `getEconomicCalendar(from, to)`
Calendário de eventos econômicos.

```typescript
const events = await getEconomicCalendar('2026-02-01', '2026-02-28');
```
**Usado em:** Componente EconomicAgenda

---

### 2.4 Busca e Descoberta

#### `searchSymbols(query: string)`
Busca ações por nome ou símbolo.

```typescript
const results = await searchSymbols('Apple');
// Retorna: [{ symbol: 'AAPL', description: 'Apple Inc', ... }]
```

#### `getStockSymbols(exchange: string)`
Lista todos os símbolos de uma exchange.

```typescript
const symbols = await getStockSymbols('US');   // EUA
const symbols = await getStockSymbols('LSE');  // Londres
```

---

### 2.5 Análise e Dados Fundamentais

#### `getRecommendationTrends(symbol: string)`
Recomendações de analistas (Buy/Hold/Sell).

```typescript
const trends = await getRecommendationTrends('AAPL');
// Retorna:
// [
//   {
//     symbol: 'AAPL',
//     buy: 25,        // 25 analistas recomendam COMPRAR
//     hold: 10,
//     sell: 2,
//     strongBuy: 15,
//     strongSell: 1,
//     period: '2026-01'
//   }
// ]
```

#### `getPriceTarget(symbol: string)`
Preço alvo médio dos analistas.

```typescript
const target = await getPriceTarget('AAPL');
// {
//   targetHigh: 220.00,
//   targetLow: 160.00,
//   targetMean: 195.00,
//   numberOfAnalysts: 42
// }
```

#### `getCompanyProfile(symbol: string)`
Perfil completo da empresa.

```typescript
const profile = await getCompanyProfile('AAPL');
// {
//   country: 'US',
//   currency: 'USD',
//   exchange: 'NASDAQ',
//   marketCapitalization: 2800000000000,
//   name: 'Apple Inc',
//   weburl: 'https://www.apple.com',
//   logo: 'https://static.finnhub.io/logo/...',
//   finnhubIndustry: 'Technology'
// }
```

---

### 2.6 Relações e Cadeia de Suprimentos

#### `getStockPeers(symbol: string)`
Concorrentes diretos.

```typescript
const peers = await getStockPeers('AAPL');
// Retorna: ['MSFT', 'GOOGL', 'META', 'AMZN', 'NFLX']
```

#### `getSupplyChain(symbol: string)` ⭐ DADOS ÚNICOS
Cadeia de suprimentos.

```typescript
const chain = await getSupplyChain('AAPL');
// {
//   symbol: 'AAPL',
//   suppliers: [
//     { symbol: 'TSM', name: 'Taiwan Semiconductor', weight: 0.25 },
//     { symbol: 'QCOM', name: 'Qualcomm', weight: 0.15 }
//   ],
//   customers: [
//     { symbol: 'WMT', name: 'Walmart', weight: 0.08 }
//   ]
// }
```

---

### 2.7 Dados Alternativos (ESG, Política)

#### `getCongressionalTrading(symbol?, from?, to?)` ⭐ DADOS ÚNICOS
Trading do Congresso Americano.

```typescript
const trades = await getCongressionalTrading('TSLA');
// [
//   {
//     symbol: 'TSLA',
//     congressPerson: 'Nancy Pelosi',
//     chamber: 'House',
//     transactionDate: '2026-01-15',
//     transactionType: 'Purchase',
//     amount: '100001-250000'
//   }
// ]
```

#### `getInsiderTransactions(symbol, from, to)`
Transações de insiders.

```typescript
const insiders = await getInsiderTransactions('AAPL', '2026-01-01', '2026-02-01');
```

---

### 2.8 Documentos Regulatórios

#### `getSECFilings(symbol, from?, to?)`
Documentos da SEC (10-K, 10-Q, 8-K).

```typescript
const filings = await getSECFilings('AAPL');
// [
//   {
//     symbol: 'AAPL',
//     filingDate: '2026-02-01',
//     form: '10-Q',
//     link: 'https://www.sec.gov/...'
//   }
// ]
```

---

### 2.9 Status do Mercado

#### `getMarketStatus(exchange: string)`
Verifica se o mercado está aberto.

```typescript
const status = await getMarketStatus('US');
// { exchange: 'US', isOpen: true, session: 'regular' }
```

#### `getMarketHolidays(exchange: string)`
Feriados do mercado.

```typescript
const holidays = await getMarketHolidays('US');
```

---

### 2.10 Forex e Cripto

#### `getForexRates(base: string)`
Taxas de câmbio.

```typescript
const rates = await getForexRates('USD');
```

#### `getCryptoQuote(symbol: string)`
Cotação de criptomoedas.

```typescript
const crypto = await getCryptoQuote('BINANCE:BTCUSDT');
```

---

## 3. Endpoints Disponíveis para Expansão

### Prioridade 1 (Alta Utilidade)

| Endpoint | Descrição | Caso de Uso |
|----------|-----------|-------------|
| `/search` | Symbol Lookup | Autocomplete na busca |
| `/calendar/earnings` | Earnings | Já implementado na home |
| `/calendar/ipo` | IPOs | Página "IPO Watch" |
| `/stock/recommendation` | Recomendações | Indicador de sentimento |

### Prioridade 2 (Média Utilidade)

| Endpoint | Descrição | Caso de Uso |
|----------|-----------|-------------|
| `/stock/market-status` | Status do mercado | Indicador visual no ticker |
| `/stock/peers` | Concorrentes | Análise setorial |
| `/stock/supply-chain` | Cadeia de suprimentos | Análise geopolítica |
| `/stock/price-target` | Preço alvo | Consenso do mercado |

### Prioridade 3 (Específico)

| Endpoint | Descrição | Caso de Uso |
|----------|-----------|-------------|
| `/stock/congressional-trading` | Trading do Congresso | Nicho político |
| `/stock/filings` | Documentos SEC | Profundidade fundamentalista |

---

## 4. Limites do Plano

| Recurso | Limite Free |
|---------|-------------|
| Chamadas/minuto | 60 |
| WebSocket | 1 conexão |
| Dados históricos | 1-2 meses |
| Delay | 15 min (alguns mercados) |

### Dicas para evitar rate limit:

```typescript
// ✅ Use cache (implementado automaticamente)
const quote = await getQuote('AAPL'); // Cache de 1 minuto

// ✅ Faça chamadas em paralelo
const [quote, news, peers] = await Promise.all([
  getQuote('AAPL'),
  getCompanyNews('AAPL', from, to),
  getStockPeers('AAPL')
]);

// ❌ Evite chamadas sequenciais desnecessárias
```

---

## 5. Troubleshooting

### Erro: "API key inválida"
- Verifique se a chave está correta no `.env`
- Reinicie o servidor de desenvolvimento após alterar `.env`

### Erro: 403 Forbidden
- Pode indicar limite do plano gratuito atingido
- Verifique se `NEXT_PUBLIC_FINNHUB_FREE_PLAN=true` está configurado
- Aguarde 1 minuto para reset do rate limit

### Dados não atualizam
- Cache de 1 minuto está ativo (normal)
- Verifique conexão com internet
- Verifique console do navegador para erros

### CORS em desenvolvimento
- O serviço já configura headers CORS
- Se persistir, verifique extensões do navegador

---

## 📁 Arquivos do Sistema

| Arquivo | Descrição |
|---------|-----------|
| `src/services/economics/finnhubService.ts` | Serviço completo com 24 funções |
| `src/hooks/economics/useFinnhub.ts` | Hooks React otimizados |
| `src/components/layout/MarketTicker.tsx` | Ticker implementado |
| `src/pages/Home.tsx` | Widget de Earnings |
| `src/components/geoEcon/EconomicAgenda.tsx` | Calendário econômico |

---

## 🔗 Links Úteis

- **Documentação oficial:** https://finnhub.io/docs/api
- **Dashboard:** https://finnhub.io/dashboard
- **Status API:** https://status.finnhub.io/

---

**Todas as 24 funções da API Finnhub estão implementadas e prontas para uso! 🎉**
