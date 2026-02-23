'use client';

import { Search } from 'lucide-react';
import { useSearch } from '@/contexts/SearchContext';

export function SearchButton() {
  const { openSearch } = useSearch();

  return (
    <button
      onClick={openSearch}
      className="flex items-center gap-2 px-4 py-2 text-sm text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-full transition-colors"
    >
      <Search className="w-4 h-4" />
      <span className="hidden sm:inline">Buscar</span>
      <kbd className="hidden md:inline-flex items-center px-1.5 py-0.5 text-xs bg-white border rounded">
        ⌘K
      </kbd>
    </button>
  );
}
