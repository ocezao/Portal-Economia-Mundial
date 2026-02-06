/**
 * Hook para gerenciamento de favoritos/bookmarks (Supabase)
 */

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { useAuth } from '@/hooks/useAuth';
import { logger } from '@/lib/logger';
import type { Bookmark } from '@/types';

interface UseBookmarksReturn {
  bookmarks: Bookmark[];
  isBookmarked: (slug: string) => boolean;
  addBookmark: (bookmark: Omit<Bookmark, 'bookmarkedAt'>) => Promise<void>;
  removeBookmark: (slug: string) => Promise<void>;
  toggleBookmark: (bookmark: Omit<Bookmark, 'bookmarkedAt'>) => Promise<void>;
  clearAll: () => Promise<void>;
}

export function useBookmarks(): UseBookmarksReturn {
  const { user } = useAuth();
  const [bookmarks, setBookmarks] = useState<Bookmark[]>([]);

  const loadBookmarks = useCallback(async () => {
    if (!user) {
      setBookmarks([]);
      return;
    }

    const { data, error } = await supabase
      .from('bookmarks')
      .select(`
        created_at,
        news_articles (
          slug,
          title,
          excerpt,
          cover_image,
          news_article_categories (
            categories ( slug )
          )
        )
      `)
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (error) {
      logger.error('Erro ao carregar favoritos:', error);
      return;
    }

    const mapped = (data ?? []).map((row: any) => {
      const article = row.news_articles;
      const categorySlug =
        article?.news_article_categories?.[0]?.categories?.slug ?? 'economia';

      return {
        articleSlug: article?.slug ?? '',
        title: article?.title ?? '',
        category: categorySlug,
        excerpt: article?.excerpt ?? '',
        coverImage: article?.cover_image ?? '',
        bookmarkedAt: row.created_at ?? new Date().toISOString(),
      } as Bookmark;
    });

    setBookmarks(mapped.filter(b => b.articleSlug));
  }, [user]);

  useEffect(() => {
    void loadBookmarks();
  }, [loadBookmarks]);

  const isBookmarked = useCallback((slug: string): boolean => {
    return bookmarks.some(b => b.articleSlug === slug);
  }, [bookmarks]);

  const addBookmark = useCallback(async (bookmark: Omit<Bookmark, 'bookmarkedAt'>) => {
    if (!user) return;

    const { data: article } = await supabase
      .from('news_articles')
      .select('id')
      .eq('slug', bookmark.articleSlug)
      .single();

    if (!article?.id) return;

    const { error } = await supabase.from('bookmarks').insert({
      user_id: user.id,
      article_id: article.id,
    });

    if (error) {
      logger.error('Erro ao salvar favorito:', error);
      return;
    }

    await loadBookmarks();
  }, [user, loadBookmarks]);

  const removeBookmark = useCallback(async (slug: string) => {
    if (!user) return;

    const { data: article } = await supabase
      .from('news_articles')
      .select('id')
      .eq('slug', slug)
      .single();

    if (!article?.id) return;

    const { error } = await supabase
      .from('bookmarks')
      .delete()
      .eq('user_id', user.id)
      .eq('article_id', article.id);

    if (error) {
      logger.error('Erro ao remover favorito:', error);
      return;
    }

    await loadBookmarks();
  }, [user, loadBookmarks]);

  const toggleBookmark = useCallback(async (bookmark: Omit<Bookmark, 'bookmarkedAt'>) => {
    if (isBookmarked(bookmark.articleSlug)) {
      await removeBookmark(bookmark.articleSlug);
    } else {
      await addBookmark(bookmark);
    }
  }, [isBookmarked, addBookmark, removeBookmark]);

  const clearAll = useCallback(async () => {
    if (!user) return;
    const { error } = await supabase.from('bookmarks').delete().eq('user_id', user.id);
    if (error) {
      logger.error('Erro ao limpar favoritos:', error);
      return;
    }
    setBookmarks([]);
  }, [user]);

  return {
    bookmarks,
    isBookmarked,
    addBookmark,
    removeBookmark,
    toggleBookmark,
    clearAll,
  };
}
