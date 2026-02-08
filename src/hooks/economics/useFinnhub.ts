/**
 * Hooks para integração com Finnhub API
 * Dados financeiros em tempo real
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import {
  getQuote,
  getMultipleQuotes,
  getMarketNews,
  getEconomicCalendar,
  getGlobalIndicesData,
  getCommoditiesData,
  getSectorsPerformance,
  getGeopoliticalNews,
  getCompanyProfile,
  createFinnhubWebSocket,
  subscribeToSymbol,
  unsubscribeFromSymbol,
  formatPrice,
  formatChange,
  GLOBAL_INDICES,
  COMMODITIES,
  FOREX_PAIRS,
  CRYPTOCURRENCIES,
  SECTORS,
  GEOPOLITICAL_STOCKS,
  type StockQuote,
  type MarketNews,

  type CompanyProfile,
} from '@/services/economics/finnhubService';

const FINNHUB_FREE_PLAN = process.env.NEXT_PUBLIC_FINNHUB_FREE_PLAN === 'true';

// ==================== HOOK: COTAÇÃO EM TEMPO REAL ====================

interface UseQuoteReturn {
  quote: StockQuote | null;
  isLoading: boolean;
  error: Error | null;
  refresh: () => void;
}

export function useQuote(symbol: string): UseQuoteReturn {
  const [quote, setQuote] = useState<StockQuote | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const fetchQuote = useCallback(async () => {
    if (!symbol) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      const data = await getQuote(symbol);
      setQuote(data);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Erro ao carregar cotação'));
    } finally {
      setIsLoading(false);
    }
  }, [symbol]);

  useEffect(() => {
    fetchQuote();
    const interval = setInterval(fetchQuote, 30000); // Atualiza a cada 30 segundos
    return () => clearInterval(interval);
  }, [fetchQuote]);

  return { quote, isLoading, error, refresh: fetchQuote };
}

// ==================== HOOK: COTAÇÕES MÚLTIPLAS ====================

interface UseMultipleQuotesReturn {
  quotes: Array<{ symbol: string; quote: StockQuote }>;
  isLoading: boolean;
  error: Error | null;
  refresh: () => void;
}

export function useMultipleQuotes(symbols: string[]): UseMultipleQuotesReturn {
  const [quotes, setQuotes] = useState<Array<{ symbol: string; quote: StockQuote }>>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const fetchQuotes = useCallback(async () => {
    if (!symbols.length) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      const data = await getMultipleQuotes(symbols);
      setQuotes(data);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Erro ao carregar cotações'));
    } finally {
      setIsLoading(false);
    }
  }, [symbols.join(',')]);

  useEffect(() => {
    fetchQuotes();
    const interval = setInterval(fetchQuotes, 30000);
    return () => clearInterval(interval);
  }, [fetchQuotes]);

  return { quotes, isLoading, error, refresh: fetchQuotes };
}

// ==================== HOOK: ÍNDICES GLOBAIS ====================

interface IndexData {
  symbol: string;
  name: string;
  region: string;
  currency: string;
  price: number;
  change: number;
  changePercent: number;
  open: number;
  high: number;
  low: number;
  previousClose: number;
  timestamp: number;
}

interface useGlobalIndicesReturn {
  indices: IndexData[];
  isLoading: boolean;
  error: Error | null;
  lastUpdate: Date | null;
  refresh: () => void;
}

export function useGlobalIndices(): useGlobalIndicesReturn {
  const [indices, setIndices] = useState<IndexData[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const data = await getGlobalIndicesData();
      setIndices(data);
      setLastUpdate(new Date());
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Erro ao carregar índices'));
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 30000);
    return () => clearInterval(interval);
  }, [fetchData]);

  return { indices, isLoading, error, lastUpdate, refresh: fetchData };
}

// ==================== HOOK: COMMODITIES ====================

interface CommodityData {
  symbol: string;
  name: string;
  unit: string;
  price: number;
  change: number;
  changePercent: number;
  open: number;
  high: number;
  low: number;
  previousClose: number;
}

interface UseCommoditiesReturn {
  commodities: CommodityData[];
  isLoading: boolean;
  error: Error | null;
  lastUpdate: Date | null;
  refresh: () => void;
}

export function useCommodities(): UseCommoditiesReturn {
  const [commodities, setCommodities] = useState<CommodityData[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const data = await getCommoditiesData();
      setCommodities(data);
      setLastUpdate(new Date());
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Erro ao carregar commodities'));
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 60000); // Commodities atualizam a cada 1 minuto
    return () => clearInterval(interval);
  }, [fetchData]);

  return { commodities, isLoading, error, lastUpdate, refresh: fetchData };
}

// ==================== HOOK: TICKER DE MERCADO ====================

interface TickerItem {
  symbol: string;
  name: string;
  price: number;
  change: number;
  changePercent: number;
  currency: string;
  type: 'index' | 'commodity' | 'forex' | 'crypto';
  region?: string;
}

interface UseMarketTickerReturn {
  data: TickerItem[];
  isLoading: boolean;
  error: Error | null;
  lastUpdate: Date | null;
  refresh: () => void;
}

export function useMarketTicker(): UseMarketTickerReturn {
  const [data, setData] = useState<TickerItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const [indices, commodities] = await Promise.all([
        getGlobalIndicesData(),
        getCommoditiesData(),
      ]);
      
      const tickerData: TickerItem[] = [
        // Índices principais
        ...indices.slice(0, 6).map(idx => ({
          symbol: idx.symbol,
          name: idx.name,
          price: idx.price,
          change: idx.change,
          changePercent: idx.changePercent,
          currency: idx.currency,
          type: 'index' as const,
          region: idx.region,
        })),
        // Commodities principais
        ...commodities.slice(0, 4).map(com => ({
          symbol: com.symbol,
          name: com.name,
          price: com.price,
          change: com.change,
          changePercent: com.changePercent,
          currency: 'USD',
          type: 'commodity' as const,
        })),
      ];
      
      setData(tickerData);
      setLastUpdate(new Date());
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Erro ao carregar ticker'));
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 30000);
    return () => clearInterval(interval);
  }, [fetchData]);

  return { data, isLoading, error, lastUpdate, refresh: fetchData };
}

// ==================== HOOK: NOTÍCIAS DE MERCADO ====================

interface UseMarketNewsReturn {
  news: MarketNews[];
  isLoading: boolean;
  error: Error | null;
  refresh: () => void;
}

export function useMarketNews(category: string = 'general'): UseMarketNewsReturn {
  const [news, setNews] = useState<MarketNews[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const fetchNews = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const data = await getMarketNews(category);
      setNews(data);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Erro ao carregar notícias'));
    } finally {
      setIsLoading(false);
    }
  }, [category]);

  useEffect(() => {
    fetchNews();
    const interval = setInterval(fetchNews, 300000); // Atualiza a cada 5 minutos
    return () => clearInterval(interval);
  }, [fetchNews]);

  return { news, isLoading, error, refresh: fetchNews };
}

// ==================== HOOK: NOTÍCIAS GEOPOLÍTICAS ====================

interface UseGeopoliticalNewsReturn {
  news: MarketNews[];
  isLoading: boolean;
  error: Error | null;
  refresh: () => void;
}

export function useGeopoliticalNews(): UseGeopoliticalNewsReturn {
  const [news, setNews] = useState<MarketNews[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const fetchNews = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const data = await getGeopoliticalNews();
      setNews(data);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Erro ao carregar notícias'));
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchNews();
    const interval = setInterval(fetchNews, 300000);
    return () => clearInterval(interval);
  }, [fetchNews]);

  return { news, isLoading, error, refresh: fetchNews };
}

// ==================== HOOK: CALENDÁRIO ECONÔMICO ====================

export interface FormattedCalendarEvent {
  id: string;
  date: string;
  time: string;
  title: string;
  country: string;
  impact: 'low' | 'medium' | 'high';
  category: 'indicador' | 'politica' | 'reuniao' | 'resultado';
  description: string;
  actual?: string;
  forecast?: string;
  previous?: string;
}

interface UseEconomicCalendarReturn {
  events: FormattedCalendarEvent[];
  isLoading: boolean;
  error: Error | null;
  refresh: () => void;
}

export function useEconomicCalendar(countryFilter?: string, maxEvents: number = 10): UseEconomicCalendarReturn {
  const [events, setEvents] = useState<FormattedCalendarEvent[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const fetchCalendar = useCallback(async () => {
    if (FINNHUB_FREE_PLAN) {
      setEvents([]);
      setError(new Error('Calendário econômico indisponível no plano gratuito.'));
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);
    
    try {
      const today = new Date().toISOString().split('T')[0];
      const future = new Date();
      future.setDate(future.getDate() + 7);
      const endDate = future.toISOString().split('T')[0];
      
      const data = await getEconomicCalendar(today, endDate);
      
      // Mapear dados da Finnhub para o formato esperado
      const formattedEvents: FormattedCalendarEvent[] = data.map((event, index) => ({
        id: `finnhub_${index}_${event.time}`,
        date: today, // A Finnhub não retorna data separada, usamos a data da consulta
        time: event.time || '00:00',
        title: event.event,
        country: event.country || 'US',
        impact: (event.impact?.toLowerCase() === 'high' ? 'high' : 
                 event.impact?.toLowerCase() === 'medium' ? 'medium' : 'low') as 'low' | 'medium' | 'high',
        category: event.event.toLowerCase().includes('rate') || 
                  event.event.toLowerCase().includes('cpi') || 
                  event.event.toLowerCase().includes('gdp') ? 'indicador' : 
                  event.event.toLowerCase().includes('meeting') ? 'reuniao' : 'resultado',
        description: `${event.event} - ${event.country || 'US'}`,
        actual: event.actual,
        forecast: event.consensus || event.estimate,
        previous: event.prev,
      }));
      
      // Filtrar por país se necessário
      const filteredEvents = countryFilter && countryFilter !== 'all' 
        ? formattedEvents.filter(e => e.country.toLowerCase() === countryFilter.toLowerCase())
        : formattedEvents;
      
      setEvents(filteredEvents.slice(0, maxEvents));
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Erro ao carregar calendário'));
    } finally {
      setIsLoading(false);
    }
  }, [countryFilter, maxEvents]);

  useEffect(() => {
    fetchCalendar();
  }, [fetchCalendar]);

  return { events, isLoading, error, refresh: fetchCalendar };
}

// ==================== HOOK: PERFORMANCE DE SETORES ====================

interface SectorData {
  key: string;
  name: string;
  symbol: string;
  price: number;
  change: number;
  changePercent: number;
}

interface UseSectorsReturn {
  sectors: SectorData[];
  isLoading: boolean;
  error: Error | null;
  refresh: () => void;
}

export function useSectors(): UseSectorsReturn {
  const [sectors, setSectors] = useState<SectorData[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const fetchSectors = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const data = await getSectorsPerformance();
      setSectors(data);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Erro ao carregar setores'));
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSectors();
    const interval = setInterval(fetchSectors, 60000);
    return () => clearInterval(interval);
  }, [fetchSectors]);

  return { sectors, isLoading, error, refresh: fetchSectors };
}

// ==================== HOOK: PERFIL DA EMPRESA ====================

interface UseCompanyProfileReturn {
  profile: CompanyProfile | null;
  isLoading: boolean;
  error: Error | null;
}

export function useCompanyProfile(symbol: string): UseCompanyProfileReturn {
  const [profile, setProfile] = useState<CompanyProfile | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const fetchProfile = async () => {
      if (!symbol) return;
      
      setIsLoading(true);
      setError(null);
      
      try {
        const data = await getCompanyProfile(symbol);
        setProfile(data);
      } catch (err) {
        setError(err instanceof Error ? err : new Error('Erro ao carregar perfil'));
      } finally {
        setIsLoading(false);
      }
    };

    fetchProfile();
  }, [symbol]);

  return { profile, isLoading, error };
}

// ==================== HOOK: WEBSOCKET EM TEMPO REAL ====================

interface UseRealtimeQuotesReturn {
  quotes: Record<string, StockQuote>;
  isConnected: boolean;
  error: Error | null;
}

export function useRealtimeQuotes(symbols: string[]): UseRealtimeQuotesReturn {
  const [quotes, setQuotes] = useState<Record<string, StockQuote>>({});
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const wsRef = useRef<WebSocket | null>(null);

  useEffect(() => {
    const ws = createFinnhubWebSocket((msg: unknown) => {
      const message = msg as { type: string; data?: Array<{ s: string; p: number; t: number }> };
      if (message.type === 'trade') {
        const trade = message.data?.[0];
        if (trade) {
          setQuotes(prev => ({
            ...prev,
            [trade.s]: {
              c: trade.p,
              d: trade.p - (prev[trade.s]?.pc || trade.p),
              dp: ((trade.p - (prev[trade.s]?.pc || trade.p)) / (prev[trade.s]?.pc || trade.p)) * 100,
              h: trade.p,
              l: trade.p,
              o: prev[trade.s]?.o || trade.p,
              pc: prev[trade.s]?.pc || trade.p,
              t: trade.t,
            },
          }));
        }
      }
    });

    if (ws) {
      wsRef.current = ws;
      
      ws.onopen = () => {
        setIsConnected(true);
        symbols.forEach(symbol => subscribeToSymbol(ws, symbol));
      };
      
      ws.onclose = () => {
        setIsConnected(false);
      };
      
      ws.onerror = () => {
        setError(new Error('Erro na conexão WebSocket'));
      };
    }

    return () => {
      if (wsRef.current) {
        symbols.forEach(symbol => unsubscribeFromSymbol(wsRef.current!, symbol));
        wsRef.current.close();
      }
    };
  }, [symbols.join(',')]);

  return { quotes, isConnected, error };
}

// ==================== EXPORTAÇÕES ====================

export {
  GLOBAL_INDICES,
  COMMODITIES,
  FOREX_PAIRS,
  CRYPTOCURRENCIES,
  SECTORS,
  GEOPOLITICAL_STOCKS,
  formatPrice,
  formatChange,
};
