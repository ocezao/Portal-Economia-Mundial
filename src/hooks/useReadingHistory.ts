/**
 * Hook para histórico de leitura (Supabase)
 */

import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/lib/supabaseClient';
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

    const { data, error } = await supabase
      .from('reading_history')
      .select(`
        read_at,
        time_spent,
        news_articles (
          slug,
          title,
          news_article_categories (
            categories ( slug )
          )
        )
      `)
      .eq('user_id', user.id)
      .order('read_at', { ascending: false });

    if (error) {
      logger.error('Erro ao carregar histórico:', error);
      setIsLoading(false);
      return;
    }

    const mapped = (data ?? []).map((row: unknown) => {
      const typedRow = row as {
        news_articles?: {
          slug?: string;
          title?: string;
          news_article_categories?: { categories?: { slug?: string } }[];
        };
        read_at?: string;
        time_spent?: number;
      };
      const article = typedRow.news_articles;
      const categorySlug =
        article?.news_article_categories?.[0]?.categories?.slug ?? 'economia';
      return {
        articleSlug: article?.slug ?? '',
        title: article?.title ?? '',
        category: categorySlug,
        readAt: typedRow.read_at ?? new Date().toISOString(),
        timeSpent: typedRow.time_spent ?? 0,
        progress: 100,
      } as ReadingHistory;
    }).filter((item: ReadingHistory) => item.articleSlug);

    setHistory(mapped);
    setIsLoading(false);
  }, [user]);

  useEffect(() => {
    queueMicrotask(() => {
      void loadHistory();
    });
  }, [loadHistory]);

  return { history, isLoading, reload: loadHistory };
}
