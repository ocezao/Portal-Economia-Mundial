/**
 * Página "Destaque" - Notícias em destaque/editoriais
 */

import { useEffect, useState } from 'react';
import { Star, Award } from 'lucide-react';
import { NewsCard } from '@/components/news/NewsCard';
import { getFeaturedArticles, getArticlesByCategory } from '@/services/newsManager';
import type { NewsArticle } from '@/types';

export function Destaque() {
  const [featured, setFeatured] = useState<NewsArticle[]>([]);
  const [editorial, setEditorial] = useState<NewsArticle[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchFeatured = async () => {
      try {
        setLoading(true);
        
        // Busca notícias destacadas
        const featuredData = await getFeaturedArticles(6);
        
        // Busca notícias da categoria análises (editorial)
        const editorialData = await getArticlesByCategory('analises');
        
        setFeatured(featuredData);
        setEditorial(editorialData.slice(0, 8));
      } catch (error) {
        if (import.meta.env.DEV) console.error('Erro ao carregar destaques:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchFeatured();
  }, []);

  return (
    <section className="min-h-screen bg-white">
      {/* Header da página */}
      <header className="border-b border-[#e6e1d8]">
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 rounded-full bg-[#c40000] flex items-center justify-center">
              <Star className="w-6 h-6 text-white" />
            </div>
            <h1 className="text-3xl sm:text-4xl font-black text-[#111111] font-headline">
              Destaque
            </h1>
          </div>
          <p className="text-lg text-[#6b6b6b] max-w-2xl">
            Conteúdos selecionados pela nossa equipe editorial. As análises e reportagens mais relevantes para você.
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
        ) : (
          <>
            {/* Seção Destaques do Dia */}
            {featured.length > 0 && (
              <section className="mb-16">
                <div className="flex items-center gap-2 mb-6">
                  <Award className="w-5 h-5 text-[#c40000]" />
                  <h2 className="text-xl font-bold text-[#111111]">Destaques do Dia</h2>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {featured.map((article) => (
                    <NewsCard key={article.id} article={article} variant="featured" />
                  ))}
                </div>
              </section>
            )}

            {/* Seção Análises Editoriais */}
            {editorial.length > 0 && (
              <section>
                <div className="flex items-center gap-2 mb-6">
                  <Star className="w-5 h-5 text-[#c40000]" />
                  <h2 className="text-xl font-bold text-[#111111]">Análises Editoriais</h2>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                  {editorial.map((article) => (
                    <NewsCard key={article.id} article={article} variant="compact" />
                  ))}
                </div>
              </section>
            )}

            {featured.length === 0 && editorial.length === 0 && (
              <div className="text-center py-20">
                <Star className="w-16 h-16 text-[#e6e1d8] mx-auto mb-4" />
                <h2 className="text-xl font-medium text-[#111111] mb-2">Nenhum destaque no momento</h2>
                <p className="text-[#6b6b6b]">Volte mais tarde para ver os destaques editoriais.</p>
              </div>
            )}
          </>
        )}
      </div>
    </section>
  );
}
