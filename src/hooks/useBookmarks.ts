/**
 * Hook para gerenciamento de favoritos/bookmarks via API local
 */

import { useState, useEffect, useCallback } from 'react';
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

    const response = await fetch('/api/bookmarks', {
      method: 'GET',
      credentials: 'same-origin',
    });

    const json = (await response.json().catch(() => ({}))) as {
      bookmarks?: Bookmark[];
      error?: string;
    };

    if (!response.ok) {
      logger.error('Erro ao carregar favoritos:', json.error);
      return;
    }

    setBookmarks((json.bookmarks ?? []).filter((bookmark) => bookmark.articleSlug));
  }, [user]);

  useEffect(() => {
    queueMicrotask(() => {
      void loadBookmarks();
    });
  }, [loadBookmarks]);

  const isBookmarked = useCallback((slug: string): boolean => {
    return bookmarks.some((bookmark) => bookmark.articleSlug === slug);
  }, [bookmarks]);

  const addBookmark = useCallback(async (bookmark: Omit<Bookmark, 'bookmarkedAt'>) => {
    if (!user) return;

    const response = await fetch('/api/bookmarks', {
      method: 'POST',
      credentials: 'same-origin',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        articleSlug: bookmark.articleSlug,
      }),
    });

    if (!response.ok) {
      const json = (await response.json().catch(() => ({}))) as { error?: string };
      logger.error('Erro ao salvar favorito:', json.error);
      return;
    }

    await loadBookmarks();
  }, [user, loadBookmarks]);

  const removeBookmark = useCallback(async (slug: string) => {
    if (!user) return;

    const response = await fetch(`/api/bookmarks?articleSlug=${encodeURIComponent(slug)}`, {
      method: 'DELETE',
      credentials: 'same-origin',
    });

    if (!response.ok) {
      const json = (await response.json().catch(() => ({}))) as { error?: string };
      logger.error('Erro ao remover favorito:', json.error);
      return;
    }

    await loadBookmarks();
  }, [user, loadBookmarks]);

  const toggleBookmark = useCallback(async (bookmark: Omit<Bookmark, 'bookmarkedAt'>) => {
    if (isBookmarked(bookmark.articleSlug)) {
      await removeBookmark(bookmark.articleSlug);
      return;
    }

    await addBookmark(bookmark);
  }, [isBookmarked, addBookmark, removeBookmark]);

  const clearAll = useCallback(async () => {
    if (!user) return;

    const response = await fetch('/api/bookmarks', {
      method: 'DELETE',
      credentials: 'same-origin',
    });

    if (!response.ok) {
      const json = (await response.json().catch(() => ({}))) as { error?: string };
      logger.error('Erro ao limpar favoritos:', json.error);
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
