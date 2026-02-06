/**
 * Página "Em Alta" - Notícias em tendência
 */

import { useEffect, useState } from 'react';
import { Flame, TrendingUp, Eye } from 'lucide-react';
import { NewsCard } from '@/components/news/NewsCard';
import { getTrendingArticles } from '@/services/newsManager';
import type { NewsArticle } from '@/types';


export function EmAlta() {
  const [news, setNews] = useState<NewsArticle[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTrending = async () => {
      try {
        setLoading(true);
        const trending = await getTrendingArticles(20);
        setNews(trending);
      } catch (error) {
        if (import.meta.env.DEV) console.error('Erro ao carregar notícias em alta:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchTrending();
  }, []);

  return (
    <section className="min-h-screen bg-white">
      {/* Header da página */}
      <header className="border-b border-[#e6e1d8]">
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 rounded-full bg-[#c40000] flex items-center justify-center">
              <Flame className="w-6 h-6 text-white" />
            </div>
            <h1 className="text-3xl sm:text-4xl font-black text-[#111111] font-headline">
              Em Alta
            </h1>
          </div>
          <p className="text-lg text-[#6b6b6b] max-w-2xl">
            As notícias mais lidas e comentadas do momento. Acompanhe o que está movendo o mundo da economia e geopolítica.
          </p>
        </div>
      </header>

      {/* Conteúdo */}
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {loading ? (
          <div className="flex justify-center py-20">
            <div className="flex flex-col items-center gap-4">
              <div className="w-12 h-12 border-4 border-[#e6e1d8] border-t-[#c40000] rounded-full animate-spin" />
              <p className="text-[#6b6b6b]">Carregando...</p>
            </div>
          </div>
        ) : news.length === 0 ? (
          <div className="text-center py-20">
            <TrendingUp className="w-16 h-16 text-[#e6e1d8] mx-auto mb-4" />
            <h2 className="text-xl font-medium text-[#111111] mb-2">Nenhuma notícia em alta</h2>
            <p className="text-[#6b6b6b]">Volte mais tarde para ver as tendências.</p>
          </div>
        ) : (
          <>
            {/* Grid de notícias */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {news.map((article, index) => (
                <div key={article.id} className="relative">
                  <NewsCard
                    article={article}
                    variant={index < 4 ? 'featured' : 'compact'}
                  />
                  {/* Badge de visualizações */}
                  <div className="absolute top-2 right-2 flex items-center gap-1 px-2 py-1 bg-black/70 text-white text-xs rounded-full">
                    <Eye className="w-3 h-3" />
                    {article.views.toLocaleString()}
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </section>
  );
}
