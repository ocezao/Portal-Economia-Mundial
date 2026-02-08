/**
 * Hook para controle de limite de leitura
 * Gerencia desbloqueio de artigos
 */

import { useState, useEffect, useCallback } from 'react';
import { storage } from '@/config/storage';
import { useAppSettings } from '@/hooks/useAppSettings';
import { supabase } from '@/lib/supabaseClient';
import { logger } from '@/lib/logger';

interface UseReadingLimitReturn {
  canReadFull: boolean;
  unlockedArticles: string[];
  remainingReads: number;
  unlockArticle: (slug: string) => void;
  isUnlocked: (slug: string) => boolean;
  hasReachedLimit: boolean;
  readingLimitPercentage: number;
  limitActive: boolean;
}

export function useReadingLimit(isLoggedIn: boolean): UseReadingLimitReturn {
  const [unlockedArticles, setUnlockedArticles] = useState<string[]>([]);
  const { settings } = useAppSettings();

  const getAnonId = useCallback((): string => {
    const storageKey = 'pem_anon_id';
    const existing = localStorage.getItem(storageKey);
    if (existing) return existing;

    const generated =
      typeof crypto !== 'undefined' && 'randomUUID' in crypto
        ? crypto.randomUUID()
        : `${Date.now()}-${Math.random().toString(16).slice(2)}`;

    localStorage.setItem(storageKey, generated);
    return generated;
  }, []);

  // Carregar artigos desbloqueados
  useEffect(() => {
    let isMounted = true;

    const load = async () => {
      if (isLoggedIn) {
        const saved = storage.getUnlockedArticles();
        if (isMounted) setUnlockedArticles(saved);
        return;
      }

      try {
        const anonId = getAnonId();

        await supabase
          .from('anon_readers')
          .upsert({ anon_id: anonId }, { onConflict: 'anon_id' });

        const { data, error } = await supabase
          .from('anon_article_unlocks')
          .select('news_articles ( slug )')
          .eq('anon_id', anonId);

        if (error) {
          logger.error('Erro ao carregar limite anon:', error);
          return;
        }

        const slugs =
          (data ?? [])
            .map((row: unknown) => (row as { news_articles?: { slug?: string } })?.news_articles?.slug)
            .filter((slug): slug is string => Boolean(slug));

        if (isMounted) setUnlockedArticles(slugs);
      } catch (error) {
        console.error('Erro ao carregar limite anon:', error);
      }
    };

    void load();
    return () => {
      isMounted = false;
    };
  }, [getAnonId, isLoggedIn]);

  const unlockArticle = useCallback((slug: string) => {
    if (isLoggedIn) {
      storage.unlockArticle(slug);
      setUnlockedArticles(prev => [...prev, slug]);
      return;
    }

    void (async () => {
      try {
        const anonId = getAnonId();
        const { data: article } = await supabase
          .from('news_articles')
          .select('id')
          .eq('slug', slug)
          .single();

        if (!article?.id) return;

        await supabase.from('anon_article_unlocks').upsert({
          anon_id: anonId,
          article_id: article.id,
        });

        setUnlockedArticles(prev => (prev.includes(slug) ? prev : [...prev, slug]));
      } catch (error) {
        logger.error('Erro ao desbloquear artigo:', error);
      }
    })();
  }, [getAnonId, isLoggedIn]);

  const isUnlocked = useCallback((slug: string): boolean => {
    return unlockedArticles.includes(slug);
  }, [unlockedArticles]);

  const limitActive =
    settings.readingLimitEnabled &&
    (settings.readingLimitScope === 'all' ? true : !isLoggedIn);

  // Se logado (ou limite desligado), pode ler tudo
  const canReadFull = isLoggedIn || !limitActive;
  
  // Artigos gratuitos restantes
  const remainingReads = Math.max(0, settings.maxFreeArticles - unlockedArticles.length);
  
  // Atingiu o limite?
  const hasReachedLimit = limitActive && unlockedArticles.length >= settings.maxFreeArticles;

  return {
    canReadFull,
    unlockedArticles,
    remainingReads,
    unlockArticle,
    isUnlocked,
    hasReachedLimit,
    readingLimitPercentage: settings.readingLimitPercentage,
    limitActive,
  };
}
