/**
 * Hook para tracking de progresso de leitura
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { storage, STORAGE_KEYS } from '@/config/storage';

interface UseReadingProgressReturn {
  progress: number;
  timeSpent: number;
  updateProgress: (newProgress: number) => void;
  markAsRead: () => void;
}

export function useReadingProgress(articleSlug: string): UseReadingProgressReturn {
  const [progress, setProgress] = useState(0);
  const [timeSpent, setTimeSpent] = useState(0);
  const startTimeRef = useRef(Date.now());
  const rafRef = useRef<number | null>(null);

  // Carregar progresso salvo
  useEffect(() => {
    const saved = storage.get<{ progress: number; timeSpent: number }>(
      `${STORAGE_KEYS.readingProgress}_${articleSlug}`
    );
    if (saved) {
      setProgress(saved.progress);
      setTimeSpent(saved.timeSpent);
    }
  }, [articleSlug]);

  // Tracking de scroll
  useEffect(() => {
    const handleScroll = () => {
      if (rafRef.current) return;
      
      rafRef.current = requestAnimationFrame(() => {
        const scrollTop = window.scrollY;
        const docHeight = document.documentElement.scrollHeight - window.innerHeight;
        const newProgress = docHeight > 0 ? Math.min(100, Math.round((scrollTop / docHeight) * 100)) : 0;
        
        setProgress(prev => {
          const updated = Math.max(prev, newProgress);
          // Salvar progresso
          storage.set(`${STORAGE_KEYS.readingProgress}_${articleSlug}`, {
            progress: updated,
            timeSpent: Math.floor((Date.now() - startTimeRef.current) / 1000),
          });
          return updated;
        });
        
        rafRef.current = null;
      });
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', handleScroll);
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [articleSlug]);

  // Timer de tempo gasto
  useEffect(() => {
    const interval = setInterval(() => {
      setTimeSpent(Math.floor((Date.now() - startTimeRef.current) / 1000));
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  const updateProgress = useCallback((newProgress: number) => {
    setProgress(newProgress);
    storage.set(`${STORAGE_KEYS.readingProgress}_${articleSlug}`, {
      progress: newProgress,
      timeSpent,
    });
  }, [articleSlug, timeSpent]);

  const markAsRead = useCallback(() => {
    updateProgress(100);
  }, [updateProgress]);

  return { progress, timeSpent, updateProgress, markAsRead };
}
