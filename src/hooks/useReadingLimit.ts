/**
 * Hook para controle de limite de leitura
 * Gerencia desbloqueio de artigos
 */

import { useState, useEffect, useCallback } from 'react';
import { storage } from '@/config/storage';
import { APP_CONFIG } from '@/config/app';

interface UseReadingLimitReturn {
  canReadFull: boolean;
  unlockedArticles: string[];
  remainingReads: number;
  unlockArticle: (slug: string) => void;
  isUnlocked: (slug: string) => boolean;
  hasReachedLimit: boolean;
}

export function useReadingLimit(isLoggedIn: boolean): UseReadingLimitReturn {
  const [unlockedArticles, setUnlockedArticles] = useState<string[]>([]);

  // Carregar artigos desbloqueados
  useEffect(() => {
    const saved = storage.getUnlockedArticles();
    setUnlockedArticles(saved);
  }, []);

  const unlockArticle = useCallback((slug: string) => {
    storage.unlockArticle(slug);
    setUnlockedArticles(prev => [...prev, slug]);
  }, []);

  const isUnlocked = useCallback((slug: string): boolean => {
    return unlockedArticles.includes(slug);
  }, [unlockedArticles]);

  // Se logado, pode ler tudo
  const canReadFull = isLoggedIn;
  
  // Artigos gratuitos restantes
  const remainingReads = Math.max(0, APP_CONFIG.features.maxFreeArticles - unlockedArticles.length);
  
  // Atingiu o limite?
  const hasReachedLimit = !isLoggedIn && unlockedArticles.length >= APP_CONFIG.features.maxFreeArticles;

  return {
    canReadFull,
    unlockedArticles,
    remainingReads,
    unlockArticle,
    isUnlocked,
    hasReachedLimit,
  };
}
