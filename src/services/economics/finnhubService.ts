/**
 * Serviço de Integração com Finnhub API
 */

import { logger } from '@/lib/logger';

// ==================== CONFIGURAÇÃO ====================

const API_KEY = import.meta.env.VITE_FINNHUB_API_KEY || '';
const FINNHUB_ENABLED = import.meta.env.VITE_FINNHUB_ENABLED !== 'false' && API_KEY.length > 0;
const FINNHUB_FREE_PLAN = import.meta.env.VITE_FINNHUB_FREE_PLAN === 'true';
const BASE_URL = 'https://finnhub.io/api/v1';
const WS_URL = 'wss://ws.finnhub.io?token=';

const blockedKeys = new Map<string, number>();
const warnedKeys = new Set<string>();
const inflightRequests = new Map<string, Promise<unknown>>();

// ==================== TIPOS ====================

export interface StockQuote {
  c: number;  // Current price
  d: number;  // Change
  dp: number; // Percent change
  h: number;  // High price of the day
  l: number;  // Low price of the day
  o: number;  // Open price of the day
  pc: number; // Previous close price
  t: number;  // Timestamp
}

export interface MarketNews {
  category: string;
  datetime: number;
  headline: string;
  id: number;
  image: string;
  related: string;
  source: string;
  summary: string;
  url: string;
}

export interface EconomicCalendarEvent {
  actual: string;
  consensus: string;
  country: string;
  estimate: string;
  event: string;
  impact: string;
  prev: string;
  time: string;
  unit: string;
}

export interface ForexRate {
  base: string;
  quote: string;
  bid: number;
  ask: number;
  mid: number;
  timestamp: number;
}

export interface CryptoQuote {
  symbol: string;
  bid: number;
  ask: number;
  mid: number;
  timestamp: number;
}

export interface CompanyProfile {
  country: string;
  currency: string;
  exchange: string;
  ipo: string;
  marketCapitalization: number;
  name: string;
  phone: string;
  shareOutstanding: number;
  ticker: string;
  weburl: string;
  logo: string;
  finnhubIndustry: string;
}

export interface BasicFinancials {
  symbol: string;
  metricType: string;
  series: {
    annual: Record<string, Array<{ period: string; v: number }>>;
  };
  metric: Record<string, number | null>;
}

export interface CountryMetadata {
  countryCode: string;
  region: string;
}

export interface EconomicCode {
  code: string;
  country: string;
  countryCode: string;
  name: string;
  unit: string;
}

export interface SocialSentiment {
  symbol: string;
  mention: number;
  positiveMention: number;
  negativeMention: number;
  positiveScore: number;
  negativeScore: number;
  score: number;
  atTime: string;
}

export interface InsiderTransaction {
  symbol: string;
  change: number;
  filingDate: string;
  transactionDate: string;
  transactionCode: string;
  name: string;
}

// ==================== ATIVOS PRINCIPAIS ====================

// Índices Globais (símbolos Finnhub)
export const GLOBAL_INDICES = {
  // Américas
  SPX: { symbol: '^GSPC', name: 'S&P 500', region: 'EUA', currency: 'USD' },
  DJI: { symbol: '^DJI', name: 'Dow Jones', region: 'EUA', currency: 'USD' },
  IXIC: { symbol: '^IXIC', name: 'Nasdaq', region: 'EUA', currency: 'USD' },
  IBOV: { symbol: '^BVSP', name: 'Ibovespa', region: 'Brasil', currency: 'BRL' },
  MXX: { symbol: '^MXX', name: 'IPC México', region: 'México', currency: 'MXN' },
  
  // Europa
  UKX: { symbol: '^FTSE', name: 'FTSE 100', region: 'Reino Unido', currency: 'GBP' },
  DAX: { symbol: '^GDAXI', name: 'DAX', region: 'Alemanha', currency: 'EUR' },
  PX1: { symbol: '^FCHI', name: 'CAC 40', region: 'França', currency: 'EUR' },
  FTSEMIB: { symbol: '^FTSEMIB.MI', name: 'FTSE MIB', region: 'Itália', currency: 'EUR' },
  
  // Ásia
  N225: { symbol: '^N225', name: 'Nikkei 225', region: 'Japão', currency: 'JPY' },
  HSI: { symbol: '^HSI', name: 'Hang Seng', region: 'Hong Kong', currency: 'HKD' },
  SSE: { symbol: '000001.SS', name: 'Shanghai Composite', region: 'China', currency: 'CNY' },
  
  // Outros
  ASX: { symbol: '^AXJO', name: 'ASX 200', region: 'Austrália', currency: 'AUD' },
};

// Commodities Principais
export const COMMODITIES = {
  OIL_BRENT: { symbol: 'BZ=F', name: 'Petróleo Brent', unit: 'USD/barril' },
  OIL_WTI: { symbol: 'CL=F', name: 'Petróleo WTI', unit: 'USD/barril' },
  GOLD: { symbol: 'GC=F', name: 'Ouro', unit: 'USD/onça' },
  SILVER: { symbol: 'SI=F', name: 'Prata', unit: 'USD/onça' },
  COPPER: { symbol: 'HG=F', name: 'Cobre', unit: 'USD/libra' },
  NATURAL_GAS: { symbol: 'NG=F', name: 'Gás Natural', unit: 'USD/MMBtu' },
  WHEAT: { symbol: 'ZW=F', name: 'Trigo', unit: 'USD/bushel' },
  CORN: { symbol: 'ZC=F', name: 'Milho', unit: 'USD/bushel' },
  SOYBEAN: { symbol: 'ZS=F', name: 'Soja', unit: 'USD/bushel' },
  COFFEE: { symbol: 'KC=F', name: 'Café', unit: 'USD/libra' },
};

// Pares de Forex Principais
export const FOREX_PAIRS = {
  EURUSD: { symbol: 'OANDA:EUR_USD', name: 'EUR/USD', base: 'EUR', quote: 'USD' },
  GBPUSD: { symbol: 'OANDA:GBP_USD', name: 'GBP/USD', base: 'GBP', quote: 'USD' },
  USDJPY: { symbol: 'OANDA:USD_JPY', name: 'USD/JPY', base: 'USD', quote: 'JPY' },
  USDBRL: { symbol: 'OANDA:USD_BRL', name: 'USD/BRL', base: 'USD', quote: 'BRL' },
  USDCNY: { symbol: 'OANDA:USD_CNY', name: 'USD/CNY', base: 'USD', quote: 'CNY' },
  AUDUSD: { symbol: 'OANDA:AUD_USD', name: 'AUD/USD', base: 'AUD', quote: 'USD' },
  USDCAD: { symbol: 'OANDA:USD_CAD', name: 'USD/CAD', base: 'USD', quote: 'CAD' },
  USDCHF: { symbol: 'OANDA:USD_CHF', name: 'USD/CHF', base: 'USD', quote: 'CHF' },
};

// Criptomoedas
export const CRYPTOCURRENCIES = {
  BTC: { symbol: 'BINANCE:BTCUSDT', name: 'Bitcoin', unit: 'USDT' },
  ETH: { symbol: 'BINANCE:ETHUSDT', name: 'Ethereum', unit: 'USDT' },
  BNB: { symbol: 'BINANCE:BNBUSDT', name: 'Binance Coin', unit: 'USDT' },
  XRP: { symbol: 'BINANCE:XRPUSDT', name: 'Ripple', unit: 'USDT' },
  SOL: { symbol: 'BINANCE:SOLUSDT', name: 'Solana', unit: 'USDT' },
};

// Setores para análise
export const SECTORS = {
  ENERGY: { name: 'Energia', symbols: ['XLE', 'VDE', 'IYE'] },
  TECHNOLOGY: { name: 'Tecnologia', symbols: ['XLK', 'VGT', 'IYW'] },
  FINANCIAL: { name: 'Financeiro', symbols: ['XLF', 'VFH', 'IYF'] },
  HEALTHCARE: { name: 'Saúde', symbols: ['XLV', 'VHT', 'IYH'] },
  INDUSTRIAL: { name: 'Indústria', symbols: ['XLI', 'VIS', 'IYJ'] },
  MATERIALS: { name: 'Materiais', symbols: ['XLB', 'VAW', 'IYM'] },
  UTILITIES: { name: 'Utilidades', symbols: ['XLU', 'VPU', 'IDU'] },
  REAL_ESTATE: { name: 'Imobiliário', symbols: ['XLRE', 'VNQ', 'IYR'] },
  CONSUMER_DISC: { name: 'Consumo Discricionário', symbols: ['XLY', 'VCR', 'IYC'] },
  CONSUMER_STAPLES: { name: 'Consumo Básico', symbols: ['XLP', 'VDC', 'IYK'] },
  COMMUNICATION: { name: 'Comunicação', symbols: ['XLC', 'VOX', 'IYZ'] },
};

// Empresas relevantes para geopolítica
export const GEOPOLITICAL_STOCKS = {
  // Defesa
  DEFENSE: [
    { symbol: 'LMT', name: 'Lockheed Martin' },
    { symbol: 'RTX', name: 'Raytheon Technologies' },
    { symbol: 'NOC', name: 'Northrop Grumman' },
    { symbol: 'BA', name: 'Boeing' },
    { symbol: 'GD', name: 'General Dynamics' },
  ],
  // Energia
  ENERGY: [
    { symbol: 'XOM', name: 'Exxon Mobil' },
    { symbol: 'CVX', name: 'Chevron' },
    { symbol: 'SHEL', name: 'Shell' },
    { symbol: 'TTE', name: 'TotalEnergies' },
    { symbol: 'BP', name: 'BP' },
  ],
  // Commodities/Materiais
  MATERIALS: [
    { symbol: 'BHP', name: 'BHP Group' },
    { symbol: 'RIO', name: 'Rio Tinto' },
    { symbol: 'VALE', name: 'Vale' },
    { symbol: 'FCX', name: 'Freeport-McMoRan' },
  ],
  // Tecnologia/Infraestrutura
  TECH_INFRA: [
    { symbol: 'TSM', name: 'Taiwan Semiconductor' },
    { symbol: 'ASML', name: 'ASML Holding' },
    { symbol: 'NVDA', name: 'NVIDIA' },
    { symbol: 'INTC', name: 'Intel' },
  ],
};

// ==================== FUNÇÕES AUXILIARES ====================

const CACHE_DURATION = 60000; // 1 minuto para cotações
const CACHE_DURATION_NEWS = 300000; // 5 minutos para notícias

interface Cache<T> {
  data: T;
  timestamp: number;
}

const cache: Map<string, Cache<unknown>> = new Map();

function getCached<T>(key: string, duration: number): T | null {
  const cached = cache.get(key);
  if (cached && Date.now() - cached.timestamp < duration) {
    return cached.data as T;
  }
  return null;
}

function setCache<T>(key: string, data: T): void {
  cache.set(key, { data, timestamp: Date.now() });
}

function isValidQuote(quote: StockQuote): boolean {
  return Number.isFinite(quote.c) && (quote.c > 0 || quote.pc > 0);
}

function getBlockKey(endpoint: string, params?: Record<string, string>): string {
  if (!params || Object.keys(params).length === 0) return endpoint;
  const pairs = Object.entries(params)
    .filter(([, value]) => value)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, value]) => `${key}=${value}`);
  return `${endpoint}?${pairs.join('&')}`;
}

async function fetchFinnhub<T>(endpoint: string, params?: Record<string, string>): Promise<T> {
  if (!FINNHUB_ENABLED) {
    throw new Error('Finnhub desabilitado: defina VITE_FINNHUB_ENABLED=true e configure a chave.');
  }

  const blockKey = getBlockKey(endpoint, params);
  const blockedUntil = blockedKeys.get(blockKey);
  if (blockedUntil && blockedUntil > Date.now()) {
    throw new Error('Finnhub bloqueado: endpoint sem permissao.');
  }
  if (blockedUntil && blockedUntil <= Date.now()) {
    blockedKeys.delete(blockKey);
  }

  const inflight = inflightRequests.get(blockKey);
  if (inflight) {
    return inflight as Promise<T>;
  }

  const fetchPromise = (async () => {
    const url = new URL(`${BASE_URL}${endpoint}`);
    url.searchParams.append('token', API_KEY);

    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value) url.searchParams.append(key, value);
      });
    }

    try {
      const response = await fetch(url.toString());

      if (!response.ok) {
        if (response.status === 401 || response.status === 403) {
          blockedKeys.set(blockKey, Number.POSITIVE_INFINITY);
          if (!warnedKeys.has(blockKey)) {
            logger.warn('[Finnhub] Endpoint sem permissao. Bloqueando:', blockKey);
            warnedKeys.add(blockKey);
          }
          throw new Error('Finnhub bloqueado: chave invalida ou endpoint sem permissao.');
        }
        if (response.status === 429) {
          blockedKeys.set(blockKey, Date.now() + 60000);
          if (!warnedKeys.has(blockKey)) {
            logger.warn('[Finnhub] Rate limit. Pausando 60s:', blockKey);
            warnedKeys.add(blockKey);
          }
          throw new Error('Limite de requisicoes atingido. Aguarde um momento.');
        }
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      return await response.json() as T;
    } catch (error) {
      if (!(error instanceof Error && error.message.startsWith('Finnhub'))) {
        logger.error('[Finnhub] Erro:', error);
      }
      throw error;
    }
  })();

  inflightRequests.set(blockKey, fetchPromise);
  try {
    return await fetchPromise as T;
  } finally {
    inflightRequests.delete(blockKey);
  }
}

// ==================== SERVIÇOS ====================

/**
 * Obtém cotação de um ativo
 */
export async function getQuote(symbol: string): Promise<StockQuote> {
  const cacheKey = `quote_${symbol}`;
  const cached = getCached<StockQuote>(cacheKey, CACHE_DURATION);
  
  if (cached) return cached;
  
  const data = await fetchFinnhub<StockQuote>(`/quote`, { symbol });
  setCache(cacheKey, data);
  return data;
}

/**
 * Obtém cotações de múltiplos ativos
 */
export async function getMultipleQuotes(symbols: string[]): Promise<Array<{ symbol: string; quote: StockQuote }>> {
  const results = await Promise.all(
    symbols.map(async (symbol) => {
      try {
        const quote = await getQuote(symbol);
        if (!isValidQuote(quote)) return null;
        return { symbol, quote };
      } catch (error) {
        return null;
      }
    })
  );
  
  return results.filter((r): r is NonNullable<typeof r> => r !== null);
}

/**
 * Obtém notícias de mercado
 */
export async function getMarketNews(category: string = 'general', minId: number = 0): Promise<MarketNews[]> {
  const cacheKey = `news_${category}_${minId}`;
  const cached = getCached<MarketNews[]>(cacheKey, CACHE_DURATION_NEWS);
  
  if (cached) return cached;
  
  const data = await fetchFinnhub<MarketNews[]>(`/news`, { category, minId: minId.toString() });
  setCache(cacheKey, data);
  return data;
}

/**
 * Obtém notícias específicas de uma empresa
 */
export async function getCompanyNews(symbol: string, from: string, to: string): Promise<MarketNews[]> {
  const cacheKey = `company_news_${symbol}_${from}_${to}`;
  const cached = getCached<MarketNews[]>(cacheKey, CACHE_DURATION_NEWS);
  
  if (cached) return cached;
  
  const data = await fetchFinnhub<MarketNews[]>(`/company-news`, { symbol, from, to });
  setCache(cacheKey, data);
  return data;
}

/**
 * Obtém calendário econômico
 */
export async function getEconomicCalendar(from: string, to: string): Promise<EconomicCalendarEvent[]> {
  const cacheKey = `calendar_${from}_${to}`;
  const cached = getCached<EconomicCalendarEvent[]>(cacheKey, CACHE_DURATION_NEWS);
  
  if (cached) return cached;
  
  const data = await fetchFinnhub<EconomicCalendarEvent[]>(`/calendar/economic`, { from, to });
  setCache(cacheKey, data);
  return data;
}

/**
 * Obtém dados fundamentais de uma empresa
 */
export async function getCompanyProfile(symbol: string): Promise<CompanyProfile> {
  const cacheKey = `profile_${symbol}`;
  const cached = getCached<CompanyProfile>(cacheKey, 86400000); // 24 horas
  
  if (cached) return cached;
  
  const data = await fetchFinnhub<CompanyProfile>(`/stock/profile2`, { symbol });
  setCache(cacheKey, data);
  return data;
}

/**
 * Obtém métricas financeiras básicas
 */
export async function getBasicFinancials(symbol: string, metricType: 'all' | 'annual' | 'quarterly' = 'all'): Promise<BasicFinancials> {
  const cacheKey = `financials_${symbol}_${metricType}`;
  const cached = getCached<BasicFinancials>(cacheKey, 3600000); // 1 hora
  
  if (cached) return cached;
  
  const data = await fetchFinnhub<BasicFinancials>(`/stock/metric`, { symbol, metric: metricType });
  setCache(cacheKey, data);
  return data;
}

/**
 * Obtém cotações de forex
 */
export async function getForexRates(base: string): Promise<Record<string, number>> {
  const cacheKey = `forex_${base}`;
  const cached = getCached<Record<string, number>>(cacheKey, CACHE_DURATION);
  
  if (cached) return cached;
  
  const data = await fetchFinnhub<Record<string, number>>(`/forex/rates`, { base });
  setCache(cacheKey, data);
  return data;
}

/**
 * Obtém cotação de criptomoeda
 */
export async function getCryptoQuote(symbol: string): Promise<CryptoQuote> {
  const cacheKey = `crypto_${symbol}`;
  const cached = getCached<CryptoQuote>(cacheKey, CACHE_DURATION);
  
  if (cached) return cached;
  
  const data = await fetchFinnhub<CryptoQuote>(`/crypto/candle`, { symbol });
  setCache(cacheKey, data);
  return data;
}

/**
 * Obtém sentimento social
 */
export async function getSocialSentiment(symbol: string): Promise<SocialSentiment[]> {
  const cacheKey = `sentiment_${symbol}`;
  const cached = getCached<SocialSentiment[]>(cacheKey, 300000); // 5 minutos
  
  if (cached) return cached;
  
  const data = await fetchFinnhub<SocialSentiment[]>(`/stock/social-sentiment`, { symbol });
  setCache(cacheKey, data);
  return data;
}

/**
 * Obtém transações de insiders
 */
export async function getInsiderTransactions(symbol: string, from: string, to: string): Promise<InsiderTransaction[]> {
  const cacheKey = `insider_${symbol}_${from}_${to}`;
  const cached = getCached<InsiderTransaction[]>(cacheKey, 3600000); // 1 hora
  
  if (cached) return cached;
  
  const data = await fetchFinnhub<InsiderTransaction[]>(`/stock/insider-transactions`, { symbol, from, to });
  setCache(cacheKey, data);
  return data;
}

// ==================== FUNÇÕES AGREGADAS ====================

/**
 * Obtém dados de índices globais
 */
export async function getGlobalIndicesData() {
  const freePlanProxies = [
    { symbol: 'SPY', displaySymbol: 'SPX', name: 'S&P 500', region: 'EUA', currency: 'USD' },
    { symbol: 'DIA', displaySymbol: 'DJI', name: 'Dow Jones', region: 'EUA', currency: 'USD' },
    { symbol: 'QQQ', displaySymbol: 'NDX', name: 'Nasdaq 100', region: 'EUA', currency: 'USD' },
    { symbol: 'EWZ', displaySymbol: 'IBOV', name: 'Ibovespa', region: 'Brasil', currency: 'USD' },
    { symbol: 'EWG', displaySymbol: 'DAX', name: 'DAX', region: 'Alemanha', currency: 'USD' },
    { symbol: 'EWU', displaySymbol: 'FTSE', name: 'FTSE 100', region: 'Reino Unido', currency: 'USD' },
  ];

  const indicesList = FINNHUB_FREE_PLAN
    ? freePlanProxies
    : Object.values(GLOBAL_INDICES);

  const symbols = indicesList.map(i => i.symbol);
  let quotes = await getMultipleQuotes(symbols);

  if (quotes.length === 0 && !FINNHUB_FREE_PLAN) {
    const fallbackSymbols = freePlanProxies.map(i => i.symbol);
    quotes = await getMultipleQuotes(fallbackSymbols);
  }
  
  return quotes.map(({ symbol, quote }) => {
    const indexInfo = indicesList.find(i => i.symbol === symbol) 
      || freePlanProxies.find(i => i.symbol === symbol)
      || Object.values(GLOBAL_INDICES).find(i => i.symbol === symbol);
    return {
      symbol: (indexInfo as { displaySymbol?: string })?.displaySymbol || symbol.replace('^', ''),
      name: indexInfo?.name || symbol,
      region: indexInfo?.region || '-',
      currency: indexInfo?.currency || 'USD',
      price: quote.c,
      change: quote.d,
      changePercent: quote.dp,
      open: quote.o,
      high: quote.h,
      low: quote.l,
      previousClose: quote.pc,
      timestamp: quote.t,
    };
  });
}

/**
 * Obtém dados de commodities
 */
export async function getCommoditiesData() {
  const freePlanProxies = [
    { symbol: 'BNO', displaySymbol: 'BRENT', name: 'Petroleo Brent', unit: 'USD' },
    { symbol: 'USO', displaySymbol: 'WTI', name: 'Petroleo WTI', unit: 'USD' },
    { symbol: 'GLD', displaySymbol: 'OURO', name: 'Ouro', unit: 'USD' },
    { symbol: 'SLV', displaySymbol: 'PRATA', name: 'Prata', unit: 'USD' },
  ];

  const commoditiesList = FINNHUB_FREE_PLAN
    ? freePlanProxies
    : Object.values(COMMODITIES);

  const symbols = commoditiesList.map(c => c.symbol);
  let quotes = await getMultipleQuotes(symbols);

  if (quotes.length === 0 && !FINNHUB_FREE_PLAN) {
    const fallbackSymbols = freePlanProxies.map(i => i.symbol);
    quotes = await getMultipleQuotes(fallbackSymbols);
  }
  
  return quotes.map(({ symbol, quote }) => {
    const commodityInfo = commoditiesList.find(c => c.symbol === symbol) 
      || freePlanProxies.find(c => c.symbol === symbol) 
      || Object.values(COMMODITIES).find(c => c.symbol === symbol);
    return {
      symbol: (commodityInfo as { displaySymbol?: string })?.displaySymbol || symbol,
      name: commodityInfo?.name || symbol,
      unit: commodityInfo?.unit || 'USD',
      price: quote.c,
      change: quote.d,
      changePercent: quote.dp,
      open: quote.o,
      high: quote.h,
      low: quote.l,
      previousClose: quote.pc,
    };
  });
}

/**
 * Obtém dados de setores
 */
export async function getSectorsPerformance() {
  const results = await Promise.all(
    Object.entries(SECTORS).map(async ([key, sector]) => {
      try {
        // Usa o primeiro ETF do setor como proxy
        const quote = await getQuote(sector.symbols[0]);
        return {
          key,
          name: sector.name,
          symbol: sector.symbols[0],
          price: quote.c,
          change: quote.d,
          changePercent: quote.dp,
        };
      } catch (error) {
        return null;
      }
    })
  );
  
  return results.filter((r): r is NonNullable<typeof r> => r !== null);
}

/**
 * Obtém notícias geopolíticas relevantes
 */
export async function getGeopoliticalNews(): Promise<MarketNews[]> {
  // Combina notícias gerais com notícias de empresas de defesa e energia
  const [generalNews, ...companyNews] = await Promise.all([
    getMarketNews('general', 0),
    ...GEOPOLITICAL_STOCKS.DEFENSE.slice(0, 3).map(stock => 
      getCompanyNews(stock.symbol, getDateDaysAgo(7), getToday())
    ),
    ...GEOPOLITICAL_STOCKS.ENERGY.slice(0, 3).map(stock => 
      getCompanyNews(stock.symbol, getDateDaysAgo(7), getToday())
    ),
  ]);
  
  // Combina e remove duplicatas
  const allNews = [...generalNews, ...companyNews.flat()];
  const uniqueNews = Array.from(new Map(allNews.map(n => [n.id, n])).values());
  
  // Ordena por data (mais recente primeiro)
  return uniqueNews
    .sort((a, b) => b.datetime - a.datetime)
    .slice(0, 20);
}

// ==================== HELPERS ====================

function getToday(): string {
  return new Date().toISOString().split('T')[0];
}

function getDateDaysAgo(days: number): string {
  const date = new Date();
  date.setDate(date.getDate() - days);
  return date.toISOString().split('T')[0];
}

export function formatPrice(price: number, currency: string = 'USD'): string {
  if (currency === 'BRL') {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(price);
  }
  if (currency === 'EUR') {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'EUR',
    }).format(price);
  }
  if (currency === 'GBP') {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'GBP',
    }).format(price);
  }
  if (currency === 'JPY') {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'JPY',
      maximumFractionDigits: 0,
    }).format(price);
  }
  
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'USD',
  }).format(price);
}

export function formatChange(change: number, changePercent: number): string {
  const sign = change >= 0 ? '+' : '';
  return `${sign}${change.toFixed(2)} (${sign}${changePercent.toFixed(2)}%)`;
}

// ==================== ENDPOINTS GRATUITOS ADICIONAIS ====================

/**
 * Busca símbolos por nome da empresa (Symbol Lookup)
 */
export interface SymbolSearchResult {
  symbol: string;
  description: string;
  displaySymbol: string;
  type: string;
}

export async function searchSymbols(query: string): Promise<SymbolSearchResult[]> {
  if (!query.trim()) return [];
  
  const cacheKey = `search_${query.toLowerCase()}`;
  const cached = getCached<SymbolSearchResult[]>(cacheKey, 300000); // 5 minutos
  
  if (cached) return cached;
  
  const response = await fetchFinnhub<{ result: SymbolSearchResult[] }>('/search', { q: query.trim() });
  const data = response?.result || [];
  setCache(cacheKey, data);
  return data;
}

/**
 * Lista todos os símbolos de uma exchange
 */
export interface StockSymbol {
  symbol: string;
  description: string;
  displaySymbol: string;
  type: string;
  currency: string;
}

export async function getStockSymbols(exchange: string = 'US'): Promise<StockSymbol[]> {
  const cacheKey = `symbols_${exchange}`;
  const cached = getCached<StockSymbol[]>(cacheKey, 86400000); // 24 horas
  
  if (cached) return cached;
  
  const result = await fetchFinnhub<StockSymbol[]>('/stock/symbol', { exchange });
  setCache(cacheKey, result || []);
  return result || [];
}

/**
 * Calendário de earnings (resultados trimestrais)
 */
export interface EarningsEvent {
  symbol: string;
  date: string;
  hour: string; // bmo (before market open), amc (after market close), dmh (during market hour)
  epsEstimate?: number;
  epsActual?: number;
  revenueEstimate?: number;
  revenueActual?: number;
}

export async function getEarningsCalendar(from: string, to: string, symbol?: string): Promise<EarningsEvent[]> {
  const cacheKey = `earnings_${from}_${to}_${symbol || 'all'}`;
  const cached = getCached<EarningsEvent[]>(cacheKey, 3600000); // 1 hora
  
  if (cached) return cached;
  
  const params: Record<string, string> = { from, to };
  if (symbol) params.symbol = symbol;
  
  const data = await fetchFinnhub<{ earningsCalendar: EarningsEvent[] }>('/calendar/earnings', params);
  const result = data?.earningsCalendar || [];
  setCache(cacheKey, result);
  return result;
}

/**
 * Calendário de IPOs
 */
export interface IPOEvent {
  symbol: string;
  date: string;
  exchange: string;
  name: string;
  price?: string;
  numberOfShares?: number;
  totalSharesValue?: number;
  status: string;
}

export async function getIPOCalendar(from: string, to: string): Promise<IPOEvent[]> {
  const cacheKey = `ipo_${from}_${to}`;
  const cached = getCached<IPOEvent[]>(cacheKey, 3600000); // 1 hora
  
  if (cached) return cached;
  
  const data = await fetchFinnhub<{ ipoCalendar: IPOEvent[] }>('/calendar/ipo', { from, to });
  const result = data?.ipoCalendar || [];
  setCache(cacheKey, result);
  return result;
}

/**
 * Tendências de recomendação de analistas
 */
export interface RecommendationTrend {
  symbol: string;
  buy: number;
  hold: number;
  sell: number;
  strongBuy: number;
  strongSell: number;
  period: string;
}

export async function getRecommendationTrends(symbol: string): Promise<RecommendationTrend[]> {
  const cacheKey = `recommendation_${symbol}`;
  const cached = getCached<RecommendationTrend[]>(cacheKey, 3600000); // 1 hora
  
  if (cached) return cached;
  
  const result = await fetchFinnhub<RecommendationTrend[]>('/stock/recommendation', { symbol });
  const data = result || [];
  setCache(cacheKey, data);
  return data;
}

/**
 * Preço alvo dos analistas
 */
export interface PriceTarget {
  symbol: string;
  targetHigh: number;
  targetLow: number;
  targetMean: number;
  targetMedian: number;
  numberOfAnalysts: number;
  currentPrice: number;
  currency: string;
}

export async function getPriceTarget(symbol: string): Promise<PriceTarget | null> {
  const cacheKey = `price_target_${symbol}`;
  const cached = getCached<PriceTarget>(cacheKey, 3600000); // 1 hora
  
  if (cached) return cached;
  
  const result = await fetchFinnhub<PriceTarget>('/stock/price-target', { symbol });
  if (result) setCache(cacheKey, result);
  return result || null;
}

/**
 * Empresas concorrentes/peers
 */
export async function getStockPeers(symbol: string): Promise<string[]> {
  const cacheKey = `peers_${symbol}`;
  const cached = getCached<string[]>(cacheKey, 86400000); // 24 horas
  
  if (cached) return cached;
  
  const result = await fetchFinnhub<string[]>('/stock/peers', { symbol });
  const data = result || [];
  setCache(cacheKey, data);
  return data;
}

/**
 * Cadeia de suprimentos
 */
export interface SupplyChain {
  symbol: string;
  suppliers: Array<{ symbol: string; name: string; weight: number }>;
  customers: Array<{ symbol: string; name: string; weight: number }>;
}

export async function getSupplyChain(symbol: string): Promise<SupplyChain | null> {
  const cacheKey = `supply_chain_${symbol}`;
  const cached = getCached<SupplyChain>(cacheKey, 86400000); // 24 horas
  
  if (cached) return cached;
  
  const result = await fetchFinnhub<SupplyChain>('/stock/supply-chain', { symbol });
  if (result) setCache(cacheKey, result);
  return result || null;
}

/**
 * Status do mercado (aberto/fechado)
 */
export interface MarketStatus {
  exchange: string;
  isOpen: boolean;
  session?: string;
  timezone: string;
}

export async function getMarketStatus(exchange: string = 'US'): Promise<MarketStatus | null> {
  const cacheKey = `market_status_${exchange}`;
  const cached = getCached<MarketStatus>(cacheKey, 60000); // 1 minuto
  
  if (cached) return cached;
  
  const result = await fetchFinnhub<MarketStatus>('/stock/market-status', { exchange });
  if (result) setCache(cacheKey, result);
  return result || null;
}

/**
 * Feriados do mercado
 */
export interface MarketHoliday {
  date: string;
  name: string;
  status: string; // closed, early-close
  exchange: string;
}

export async function getMarketHolidays(exchange: string = 'US'): Promise<MarketHoliday[]> {
  const cacheKey = `market_holidays_${exchange}`;
  const cached = getCached<MarketHoliday[]>(cacheKey, 86400000); // 24 horas
  
  if (cached) return cached;
  
  const result = await fetchFinnhub<MarketHoliday[]>('/stock/market-holiday', { exchange });
  const data = result || [];
  setCache(cacheKey, data);
  return data;
}

/**
 * Documentos SEC (filings)
 */
export interface SECFiling {
  symbol: string;
  filingDate: string;
  acceptanceDateTime: string;
  act: string;
  form: string; // 10-K, 10-Q, 8-K, etc.
  fileNo: string;
  filmNo: string;
  items: string;
  size: number;
  link: string;
}

export async function getSECFilings(symbol: string, from?: string, to?: string): Promise<SECFiling[]> {
  const cacheKey = `sec_filings_${symbol}_${from}_${to}`;
  const cached = getCached<SECFiling[]>(cacheKey, 3600000); // 1 hora
  
  if (cached) return cached;
  
  const params: Record<string, string> = { symbol };
  if (from) params.from = from;
  if (to) params.to = to;
  
  const data = await fetchFinnhub<SECFiling[]>('/stock/filings', params);
  const result = data || [];
  setCache(cacheKey, result);
  return result;
}

/**
 * Transações do Congresso Americano
 */
export interface CongressionalTrade {
  symbol: string;
  congressPerson: string;
  chamber: string; // House, Senate
  state: string;
  party: string;
  transactionDate: string;
  filingDate: string;
  transactionType: string; // Purchase, Sale
  amount: string;
  description: string;
}

export async function getCongressionalTrading(symbol?: string, from?: string, to?: string): Promise<CongressionalTrade[]> {
  const cacheKey = `congress_${symbol}_${from}_${to}`;
  const cached = getCached<CongressionalTrade[]>(cacheKey, 3600000); // 1 hora
  
  if (cached) return cached;
  
  const params: Record<string, string> = {};
  if (symbol) params.symbol = symbol;
  if (from) params.from = from;
  if (to) params.to = to;
  
  const data = await fetchFinnhub<CongressionalTrade[]>('/stock/congressional-trading', params);
  const result = data || [];
  setCache(cacheKey, result);
  return result;
}

// ==================== WEBSOCKET (PARA DADOS EM TEMPO REAL) ====================

export function createFinnhubWebSocket(onMessage: (data: unknown) => void): WebSocket | null {
  if (!API_KEY) return null;
  
  const ws = new WebSocket(`${WS_URL}${API_KEY}`);
  
  ws.onopen = () => {
    logger.log('[Finnhub] WebSocket conectado');
  };
  
  ws.onmessage = (event) => {
    try {
      const data = JSON.parse(event.data);
      onMessage(data);
    } catch (error) {
      logger.error('[Finnhub] Erro ao parsear mensagem:', error);
    }
  };
  
  ws.onerror = (error) => {
    logger.error('[Finnhub] WebSocket erro:', error);
  };
  
  ws.onclose = () => {
    logger.log('[Finnhub] WebSocket desconectado');
  };
  
  return ws;
}

export function subscribeToSymbol(ws: WebSocket, symbol: string): void {
  if (ws.readyState === WebSocket.OPEN) {
    ws.send(JSON.stringify({ type: 'subscribe', symbol }));
  }
}

export function unsubscribeFromSymbol(ws: WebSocket, symbol: string): void {
  if (ws.readyState === WebSocket.OPEN) {
    ws.send(JSON.stringify({ type: 'unsubscribe', symbol }));
  }
}










