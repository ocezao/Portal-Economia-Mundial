import { useState, useEffect, useCallback, useRef } from 'react';

import { useAuth } from '@/hooks/useAuth';

interface UseReadingProgressReturn {
  progress: number;
  timeSpent: number;
  updateProgress: (newProgress: number) => void;
  markAsRead: () => void;
}

async function fetchReadingProgress(articleSlug: string) {
  const response = await fetch(`/api/user/reading-progress?articleSlug=${encodeURIComponent(articleSlug)}`, {
    credentials: 'same-origin',
  });
  const json = await response.json() as { progress?: { progress_pct?: number } | null };
  return response.ok ? json.progress ?? null : null;
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

      const data = await fetchReadingProgress(articleSlug);
      if (isMounted && data) {
        setProgress(data.progress_pct ?? 0);
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

        setProgress((prev) => Math.max(prev, newProgress));
        const spent = Math.floor((Date.now() - (startTimeRef.current || Date.now())) / 1000);
        setTimeSpent(spent);

        await fetch('/api/user/reading-progress', {
          method: 'PUT',
          credentials: 'same-origin',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            articleSlug,
            progress: Math.max(progress, newProgress),
            lastPosition: scrollTop,
          }),
        });

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
    void fetch('/api/user/reading-history', {
      method: 'POST',
      credentials: 'same-origin',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        articleSlug,
        timeSpent,
      }),
    });
  }, [updateProgress, user, articleSlug, timeSpent]);

  return { progress, timeSpent, updateProgress, markAsRead };
}
