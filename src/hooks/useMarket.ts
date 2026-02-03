/**
 * Hook para dados de mercado em tempo real
 * Simula atualizações de preços
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import type { MarketData } from '@/config/market';
import { initialMarketData, simulateMarketUpdate } from '@/config/market';
import { APP_CONFIG } from '@/config/app';

interface UseMarketReturn {
  data: MarketData[];
  isLoading: boolean;
  error: Error | null;
  lastUpdate: Date | null;
  refresh: () => void;
}

export function useMarket(): UseMarketReturn {
  const [data, setData] = useState<MarketData[]>(initialMarketData);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const refresh = useCallback(() => {
    setIsLoading(true);
    try {
      // Simula delay de API
      setTimeout(() => {
        setData(prev => simulateMarketUpdate(prev));
        setLastUpdate(new Date());
        setIsLoading(false);
      }, 300);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Erro ao atualizar dados'));
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    // Atualização automática
    intervalRef.current = setInterval(() => {
      setData(prev => simulateMarketUpdate(prev));
      setLastUpdate(new Date());
    }, APP_CONFIG.timing.marketUpdateInterval);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  return { data, isLoading, error, lastUpdate, refresh };
}

// Hook para filtrar por tipo
export function useMarketByType(type: MarketData['type']) {
  const { data, ...rest } = useMarket();
  const filteredData = data.filter(item => item.type === type);
  return { data: filteredData, ...rest };
}

// Hook para um símbolo específico
export function useMarketSymbol(symbol: string) {
  const { data, ...rest } = useMarket();
  const item = data.find(item => item.symbol === symbol);
  return { data: item, ...rest };
}
