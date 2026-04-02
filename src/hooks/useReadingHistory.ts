import { useEffect, useState, useCallback } from 'react';

import { useAuth } from '@/hooks/useAuth';
import { logger } from '@/lib/logger';
import type { ReadingHistory } from '@/types';

async function callHistoryApi<T>(init?: RequestInit): Promise<T> {
  const response = await fetch('/api/user/reading-history', {
    credentials: 'same-origin',
    headers: {
      'Content-Type': 'application/json',
      ...(init?.headers ?? {}),
    },
    ...init,
  });

  const json = await response.json() as Record<string, unknown>;
  if (!response.ok) {
    throw new Error((json.error as string) || 'Erro ao carregar historico');
  }

  return json as T;
}

export function useReadingHistory() {
  const { user } = useAuth();
  const [history, setHistory] = useState<ReadingHistory[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadHistory = useCallback(async () => {
    if (!user) {
      setHistory([]);
      setIsLoading(false);
      return;
    }

    try {
      const result = await callHistoryApi<{ history: ReadingHistory[] }>();
      setHistory(result.history ?? []);
    } catch (error) {
      logger.error('Erro ao carregar historico:', error);
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  useEffect(() => {
    queueMicrotask(() => {
      void loadHistory();
    });
  }, [loadHistory]);

  return { history, isLoading, reload: loadHistory };
}
