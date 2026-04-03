/**
 * Hook para historico de leitura via API local
 */

import { useEffect, useState, useCallback } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { logger } from '@/lib/logger';
import type { ReadingHistory } from '@/types';

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

    const response = await fetch('/api/reading-history', {
      method: 'GET',
      credentials: 'same-origin',
    });

    const json = (await response.json().catch(() => ({}))) as {
      history?: ReadingHistory[];
      error?: string;
    };

    if (!response.ok) {
      logger.error('Erro ao carregar historico:', json.error);
      setIsLoading(false);
      return;
    }

    setHistory((json.history ?? []).filter((item) => item.articleSlug));
    setIsLoading(false);
  }, [user]);

  useEffect(() => {
    queueMicrotask(() => {
      void loadHistory();
    });
  }, [loadHistory]);

  return { history, isLoading, reload: loadHistory };
}
