/**
 * Hook para gerenciamento de favoritos/bookmarks
 */

import { useState, useEffect, useCallback } from 'react';
import { storage } from '@/config/storage';
import type { Bookmark } from '@/types';

interface UseBookmarksReturn {
  bookmarks: Bookmark[];
  isBookmarked: (slug: string) => boolean;
  addBookmark: (bookmark: Omit<Bookmark, 'bookmarkedAt'>) => void;
  removeBookmark: (slug: string) => void;
  toggleBookmark: (bookmark: Omit<Bookmark, 'bookmarkedAt'>) => void;
  clearAll: () => void;
}

export function useBookmarks(): UseBookmarksReturn {
  const [bookmarks, setBookmarks] = useState<Bookmark[]>([]);

  // Carregar do localStorage
  useEffect(() => {
    const saved = storage.getBookmarks();
    setBookmarks(saved);
  }, []);

  const isBookmarked = useCallback((slug: string): boolean => {
    return bookmarks.some(b => b.articleSlug === slug);
  }, [bookmarks]);

  const addBookmark = useCallback((bookmark: Omit<Bookmark, 'bookmarkedAt'>) => {
    const newBookmark: Bookmark = {
      ...bookmark,
      bookmarkedAt: new Date().toISOString(),
    };
    
    setBookmarks(prev => {
      if (prev.some(b => b.articleSlug === bookmark.articleSlug)) {
        return prev;
      }
      const updated = [newBookmark, ...prev];
      storage.set('pem_bookmarks', updated);
      return updated;
    });
  }, []);

  const removeBookmark = useCallback((slug: string) => {
    setBookmarks(prev => {
      const updated = prev.filter(b => b.articleSlug !== slug);
      storage.set('pem_bookmarks', updated);
      return updated;
    });
  }, []);

  const toggleBookmark = useCallback((bookmark: Omit<Bookmark, 'bookmarkedAt'>) => {
    if (isBookmarked(bookmark.articleSlug)) {
      removeBookmark(bookmark.articleSlug);
    } else {
      addBookmark(bookmark);
    }
  }, [isBookmarked, addBookmark, removeBookmark]);

  const clearAll = useCallback(() => {
    setBookmarks([]);
    storage.set('pem_bookmarks', []);
  }, []);

  return {
    bookmarks,
    isBookmarked,
    addBookmark,
    removeBookmark,
    toggleBookmark,
    clearAll,
  };
}
