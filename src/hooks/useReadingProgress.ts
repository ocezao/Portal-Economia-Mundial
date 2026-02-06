/**
 * Hook para tracking de progresso de leitura (Supabase)
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { useAuth } from '@/hooks/useAuth';

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
  const [articleId, setArticleId] = useState<string | null>(null);
  const startTimeRef = useRef(Date.now());
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    let isMounted = true;
    const loadArticleId = async () => {
      if (!articleSlug) return;
      const { data } = await supabase
        .from('news_articles')
        .select('id')
        .eq('slug', articleSlug)
        .single();
      if (isMounted) setArticleId(data?.id ?? null);
    };

    loadArticleId();
    return () => {
      isMounted = false;
    };
  }, [articleSlug]);

  // Carregar progresso salvo
  useEffect(() => {
    let isMounted = true;
    const loadProgress = async () => {
      if (!user || !articleId) {
        if (isMounted) {
          setProgress(0);
          setTimeSpent(0);
        }
        return;
      }

      const { data, error } = await supabase
        .from('reading_progress')
        .select('progress_pct, last_position, updated_at')
        .eq('user_id', user.id)
        .eq('article_id', articleId)
        .single();

      if (error) {
        if (isMounted) {
          setProgress(0);
          setTimeSpent(0);
        }
        return;
      }

      if (isMounted && data) {
        setProgress(data.progress_pct ?? 0);
      }
    };

    loadProgress();
    return () => {
      isMounted = false;
    };
  }, [user, articleId]);

  // Tracking de scroll
  useEffect(() => {
    if (!user || !articleId) return;

    const handleScroll = () => {
      if (rafRef.current) return;

      rafRef.current = requestAnimationFrame(async () => {
        const scrollTop = window.scrollY;
        const docHeight = document.documentElement.scrollHeight - window.innerHeight;
        const newProgress = docHeight > 0 ? Math.min(100, Math.round((scrollTop / docHeight) * 100)) : 0;

        setProgress(prev => Math.max(prev, newProgress));
        const spent = Math.floor((Date.now() - startTimeRef.current) / 1000);
        setTimeSpent(spent);

        await supabase
          .from('reading_progress')
          .upsert({
            user_id: user.id,
            article_id: articleId,
            progress_pct: Math.max(progress, newProgress),
            last_position: scrollTop,
          }, { onConflict: 'article_id,user_id' });

        rafRef.current = null;
      });
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', handleScroll);
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [user, articleId, progress]);

  // Timer de tempo gasto
  useEffect(() => {
    const interval = setInterval(() => {
      setTimeSpent(Math.floor((Date.now() - startTimeRef.current) / 1000));
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  const updateProgress = useCallback((newProgress: number) => {
    setProgress(newProgress);
  }, []);

  const markAsRead = useCallback(() => {
    updateProgress(100);
    if (!user || !articleId) return;
    void supabase.from('reading_history').insert({
      user_id: user.id,
      article_id: articleId,
      time_spent: timeSpent,
    });
  }, [updateProgress, user, articleId, timeSpent]);

  return { progress, timeSpent, updateProgress, markAsRead };
}
