'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Search, X, Clock, ArrowRight, Loader2 } from 'lucide-react';
import { useSearch } from '@/contexts/SearchContext';

function highlightMatch(text: string, query: string): string {
  if (!query.trim()) return text;
  const regex = new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
  return text.replace(regex, '<mark class="bg-yellow-200 text-gray-900">$1</mark>');
}

export function SearchModal() {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const { 
    isOpen, 
    openSearch,
    closeSearch, 
    query, 
    setQuery, 
    results, 
    isLoading, 
    search,
    recentSearches,
    addToRecentSearches 
  } = useSearch();
  const [selectedIndex, setSelectedIndex] = useState(-1);

  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        if (isOpen) {
          closeSearch();
        } else {
          openSearch();
        }
      }
      if (!isOpen) return;
      
      if (e.key === 'Escape') {
        closeSearch();
      }
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex(prev => Math.min(prev + 1, results.length - 1));
      }
      if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex(prev => Math.max(prev - 1, -1));
      }
      if (e.key === 'Enter' && selectedIndex >= 0 && results[selectedIndex]) {
        e.preventDefault();
        const article = results[selectedIndex].item;
        addToRecentSearches(query);
        router.push(`/noticias/${article.slug}/`);
        closeSearch();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, closeSearch, openSearch, query, results, selectedIndex, router, addToRecentSearches]);

  useEffect(() => {
    setSelectedIndex(-1);
  }, [query]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      addToRecentSearches(query);
      router.push(`/busca/?q=${encodeURIComponent(query)}`);
      closeSearch();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-[10vh]">
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" onClick={closeSearch} />
      
      <div className="relative w-full max-w-2xl mx-4 bg-white rounded-xl shadow-2xl overflow-hidden">
        <form onSubmit={handleSubmit} className="flex items-center border-b border-gray-200">
          <Search className="w-5 h-5 text-gray-400 ml-4" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => search(e.target.value)}
            placeholder="Buscar notícias, temas, autores..."
            className="flex-1 px-4 py-4 text-lg outline-none placeholder:text-gray-400"
          />
          {isLoading && <Loader2 className="w-5 h-5 text-gray-400 mr-4 animate-spin" />}
          <button type="button" onClick={closeSearch} className="mr-2 p-2 hover:bg-gray-100 rounded-lg">
            <X className="w-5 h-5 text-gray-400" />
          </button>
        </form>

        <div className="max-h-[60vh] overflow-y-auto">
          {!query && recentSearches.length > 0 && (
            <div className="p-4">
              <h3 className="text-xs font-semibold text-gray-500 uppercase mb-3 flex items-center gap-2">
                <Clock className="w-4 h-4" />
                Buscas recentes
              </h3>
              <div className="space-y-1">
                {recentSearches.map((term, index) => (
                  <button
                    key={index}
                    onClick={() => search(term)}
                    className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-lg"
                  >
                    {term}
                  </button>
                ))}
              </div>
            </div>
          )}

          {query && results.length > 0 && (
            <div className="p-2">
              {results.map((result, index) => (
                <Link
                  key={result.item.id}
                  href={`/noticias/${result.item.slug}/`}
                  onClick={() => {
                    addToRecentSearches(query);
                    closeSearch();
                  }}
                  className={`flex items-start gap-4 p-3 rounded-lg hover:bg-gray-50 ${index === selectedIndex ? 'bg-gray-100' : ''}`}
                >
                  {result.item.coverImage && (
                    <img src={result.item.coverImage} alt="" className="w-16 h-12 object-cover rounded" />
                  )}
                  <div className="flex-1 min-w-0">
                    <h4 
                      className="font-medium text-gray-900 line-clamp-1"
                      dangerouslySetInnerHTML={{ __html: highlightMatch(result.item.title, query) }}
                    />
                    <p 
                      className="text-sm text-gray-500 line-clamp-1"
                      dangerouslySetInnerHTML={{ __html: highlightMatch(result.item.excerpt, query) }}
                    />
                    <span className="text-xs text-gray-400">{result.item.category}</span>
                  </div>
                  <ArrowRight className="w-4 h-4 text-gray-400 flex-shrink-0 mt-2" />
                </Link>
              ))}
            </div>
          )}

          {query && results.length === 0 && !isLoading && (
            <div className="p-8 text-center">
              <p className="text-gray-500">Nenhum resultado encontrado para "{query}"</p>
              <p className="text-sm text-gray-400 mt-1">Tente usar outras palavras-chave</p>
            </div>
          )}
        </div>

        <div className="p-3 bg-gray-50 border-t border-gray-200 flex items-center justify-between text-xs text-gray-500">
          <div className="flex items-center gap-4">
            <span><kbd className="px-1.5 py-0.5 bg-white border rounded">↑↓</kbd> navegar</span>
            <span><kbd className="px-1.5 py-0.5 bg-white border rounded">Enter</kbd> selecionar</span>
            <span><kbd className="px-1.5 py-0.5 bg-white border rounded">Esc</kbd> fechar</span>
          </div>
          <span>Pressione <kbd className="px-1.5 py-0.5 bg-white border rounded">Ctrl+K</kbd> para abrir</span>
        </div>
      </div>
    </div>
  );
}
