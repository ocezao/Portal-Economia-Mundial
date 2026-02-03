/**
 * Hook para dados de mercado em tempo real
 * Simula atualizações de preços
 */

import { useState, useEffect, useCallback } from 'react';
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

interface MarketSnapshot {
  data: MarketData[];
  lastUpdate: Date | null;
}

let snapshot: MarketSnapshot = {
  data: initialMarketData,
  lastUpdate: null,
};

let intervalId: ReturnType<typeof setInterval> | null = null;
const subscribers = new Set<(state: MarketSnapshot) => void>();

const emit = () => {
  subscribers.forEach((listener) => listener(snapshot));
};

const startInterval = () => {
  if (intervalId) return;
  intervalId = setInterval(() => {
    snapshot = {
      data: simulateMarketUpdate(snapshot.data),
      lastUpdate: new Date(),
    };
    emit();
  }, APP_CONFIG.timing.marketUpdateInterval);
};

const stopInterval = () => {
  if (intervalId && subscribers.size === 0) {
    clearInterval(intervalId);
    intervalId = null;
  }
};

export function useMarket(): UseMarketReturn {
  const [data, setData] = useState<MarketData[]>(snapshot.data);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(snapshot.lastUpdate);

  const refresh = useCallback(() => {
    setIsLoading(true);
    try {
      // Simula delay de API
      setTimeout(() => {
        snapshot = {
          data: simulateMarketUpdate(snapshot.data),
          lastUpdate: new Date(),
        };
        emit();
        setIsLoading(false);
      }, 300);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Erro ao atualizar dados'));
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    const listener = (state: MarketSnapshot) => {
      setData(state.data);
      setLastUpdate(state.lastUpdate);
    };

    subscribers.add(listener);
    startInterval();
    listener(snapshot);

    return () => {
      subscribers.delete(listener);
      stopInterval();
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
