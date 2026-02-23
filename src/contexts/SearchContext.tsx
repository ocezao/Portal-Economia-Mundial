'use client';

import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import Fuse from 'fuse.js';

interface SearchResult {
  item: SearchIndexItem;
  matches?: Fuse.FuseResultMatch[];
  score?: number;
}

interface SearchIndexItem {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  category: string;
  categoryName: string;
  author: string;
  authorName: string;
  publishedAt: string;
  tags: string[];
  coverImage: string;
}

interface SearchContextType {
  isOpen: boolean;
  openSearch: () => void;
  closeSearch: () => void;
  toggleSearch: () => void;
  query: string;
  setQuery: (query: string) => void;
  results: SearchResult[];
  isLoading: boolean;
  search: (query: string) => void;
  clearSearch: () => void;
  recentSearches: string[];
  addToRecentSearches: (query: string) => void;
}

const SearchContext = createContext<SearchContextType | undefined>(undefined);

const fuseOptions: Fuse.IFuseOptions<SearchIndexItem> = {
  keys: [
    { name: 'title', weight: 0.4 },
    { name: 'excerpt', weight: 0.25 },
    { name: 'content', weight: 0.15 },
    { name: 'tags', weight: 0.1 },
    { name: 'categoryName', weight: 0.05 },
    { name: 'authorName', weight: 0.05 },
  ],
  threshold: 0.3,
  includeScore: true,
  includeMatches: true,
  minMatchCharLength: 2,
  ignoreLocation: true,
  useExtendedSearch: true,
};

export function SearchProvider({ children }: { children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchIndex, setSearchIndex] = useState<SearchIndexItem[]>([]);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);

  useEffect(() => {
    const stored = localStorage.getItem('recentSearches');
    if (stored) {
      setRecentSearches(JSON.parse(stored));
    }
  }, []);

  useEffect(() => {
    if (searchIndex.length === 0) {
      fetch('/api/search')
        .then((res) => res.json())
        .then((data) => {
          if (Array.isArray(data)) {
            setSearchIndex(data);
          }
        })
        .catch(console.error);
    }
  }, [searchIndex.length]);

  const openSearch = useCallback(() => setIsOpen(true), []);
  const closeSearch = useCallback(() => {
    setIsOpen(false);
    setQuery('');
    setResults([]);
  }, []);
  const toggleSearch = useCallback(() => setIsOpen((prev) => !prev), []);

  const search = useCallback((searchQuery: string) => {
    setQuery(searchQuery);
    
    if (!searchQuery.trim() || searchIndex.length === 0) {
      setResults([]);
      return;
    }

    setIsLoading(true);
    
    const fuse = new Fuse(searchIndex, fuseOptions);
    const searchResults = fuse.search(searchQuery.trim());
    
    setResults(searchResults.slice(0, 10));
    setIsLoading(false);
  }, [searchIndex]);

  const clearSearch = useCallback(() => {
    setQuery('');
    setResults([]);
  }, []);

  const addToRecentSearches = useCallback((searchQuery: string) => {
    if (!searchQuery.trim()) return;
    
    const updated = [searchQuery, ...recentSearches.filter(s => s !== searchQuery)].slice(0, 5);
    setRecentSearches(updated);
    localStorage.setItem('recentSearches', JSON.stringify(updated));
  }, [recentSearches]);

  return (
    <SearchContext.Provider
      value={{
        isOpen,
        openSearch,
        closeSearch,
        toggleSearch,
        query,
        setQuery,
        results,
        isLoading,
        search,
        clearSearch,
        recentSearches,
        addToRecentSearches,
      }}
    >
      {children}
    </SearchContext.Provider>
  );
}

export function useSearch() {
  const context = useContext(SearchContext);
  if (!context) {
    throw new Error('useSearch must be used within a SearchProvider');
  }
  return context;
}
