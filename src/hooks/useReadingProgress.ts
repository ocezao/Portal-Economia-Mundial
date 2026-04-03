/**
 * Hook para tracking de progresso de leitura via API local
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { logger } from '@/lib/logger';

interface UseReadingProgressReturn {
  progress: number;
  timeSpent: number;
  updateProgress: (newProgress: number) => void;
  markAsRead: () => void;
}

export function useReadingProgress(articleSlug: string): UseReadingProgressReturn {
  const { user } = useAuth();
  const [progress, setProgress] = useState(0);
  const [timeSpent, setTimeSpent] = useState(0);
  const startTimeRef = useRef<number | null>(null);
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    startTimeRef.current = Date.now();
  }, [articleSlug]);

  useEffect(() => {
    let isMounted = true;

    const loadProgress = async () => {
      if (!user || !articleSlug) {
        if (isMounted) {
          setProgress(0);
          setTimeSpent(0);
        }
        return;
      }

      const response = await fetch(`/api/reading-progress?articleSlug=${encodeURIComponent(articleSlug)}`, {
        method: 'GET',
        credentials: 'same-origin',
      });

      if (!response.ok) {
        if (isMounted) {
          setProgress(0);
          setTimeSpent(0);
        }
        return;
      }

      const json = (await response.json().catch(() => ({}))) as {
        progress?: {
          progress?: number;
        } | null;
      };

      if (isMounted && json.progress) {
        setProgress(json.progress.progress ?? 0);
      }
    };

    void loadProgress();
    return () => {
      isMounted = false;
    };
  }, [user, articleSlug]);

  useEffect(() => {
    if (!user || !articleSlug) return;

    const handleScroll = () => {
      if (rafRef.current) return;

      rafRef.current = requestAnimationFrame(async () => {
        const scrollTop = window.scrollY;
        const docHeight = document.documentElement.scrollHeight - window.innerHeight;
        const newProgress = docHeight > 0 ? Math.min(100, Math.round((scrollTop / docHeight) * 100)) : 0;

        setProgress((previous) => Math.max(previous, newProgress));
        const spent = Math.floor((Date.now() - (startTimeRef.current || Date.now())) / 1000);
        setTimeSpent(spent);

        const response = await fetch('/api/reading-progress', {
          method: 'POST',
          credentials: 'same-origin',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            articleSlug,
            progress: Math.max(progress, newProgress),
            lastPosition: scrollTop,
          }),
        });

        if (!response.ok) {
          const json = (await response.json().catch(() => ({}))) as { error?: string };
          logger.error('Erro ao salvar progresso de leitura:', json.error);
        }

        rafRef.current = null;
      });
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', handleScroll);
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [user, articleSlug, progress]);

  useEffect(() => {
    const interval = setInterval(() => {
      setTimeSpent(Math.floor((Date.now() - (startTimeRef.current || Date.now())) / 1000));
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  const updateProgress = useCallback((newProgress: number) => {
    setProgress(newProgress);
  }, []);

  const markAsRead = useCallback(() => {
    updateProgress(100);
    if (!user || !articleSlug) return;

    void fetch('/api/reading-history', {
      method: 'POST',
      credentials: 'same-origin',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        articleSlug,
        timeSpent,
      }),
    });
  }, [updateProgress, user, articleSlug, timeSpent]);

  return { progress, timeSpent, updateProgress, markAsRead };
}
