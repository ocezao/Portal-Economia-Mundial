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

async function callBookmarksApi<T>(path = '/api/user/bookmarks', init?: RequestInit): Promise<T> {
  const response = await fetch(path, {
    credentials: 'same-origin',
    headers: {
      'Content-Type': 'application/json',
      ...(init?.headers ?? {}),
    },
    ...init,
  });

  const json = await response.json() as Record<string, unknown>;
  if (!response.ok) {
    throw new Error((json.error as string) || 'Erro ao processar favoritos');
  }

  return json as T;
}

export function useBookmarks(): UseBookmarksReturn {
  const { user } = useAuth();
  const [bookmarks, setBookmarks] = useState<Bookmark[]>([]);

  const loadBookmarks = useCallback(async () => {
    if (!user) {
      setBookmarks([]);
      return;
    }

    try {
      const result = await callBookmarksApi<{ bookmarks: Bookmark[] }>();
      setBookmarks(result.bookmarks ?? []);
    } catch (error) {
      logger.error('Erro ao carregar favoritos:', error);
    }
  }, [user]);

  useEffect(() => {
    queueMicrotask(() => {
      void loadBookmarks();
    });
  }, [loadBookmarks]);

  const isBookmarked = useCallback((slug: string): boolean => {
    return bookmarks.some((b) => b.articleSlug === slug);
  }, [bookmarks]);

  const addBookmark = useCallback(async (bookmark: Omit<Bookmark, 'bookmarkedAt'>) => {
    if (!user) return;

    try {
      await callBookmarksApi('/api/user/bookmarks', {
        method: 'POST',
        body: JSON.stringify({ articleSlug: bookmark.articleSlug }),
      });
      await loadBookmarks();
    } catch (error) {
      logger.error('Erro ao salvar favorito:', error);
    }
  }, [user, loadBookmarks]);

  const removeBookmark = useCallback(async (slug: string) => {
    if (!user) return;

    try {
      await callBookmarksApi(`/api/user/bookmarks?articleSlug=${encodeURIComponent(slug)}`, {
        method: 'DELETE',
      });
      await loadBookmarks();
    } catch (error) {
      logger.error('Erro ao remover favorito:', error);
    }
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
    try {
      await callBookmarksApi('/api/user/bookmarks?clearAll=true', {
        method: 'DELETE',
      });
      setBookmarks([]);
    } catch (error) {
      logger.error('Erro ao limpar favoritos:', error);
    }
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
