/**
 * Artigos Relacionados
 * RecomendaÃ§Ãµes baseadas na categoria atual
 */

'use client';

import { memo, useEffect, useState, useMemo } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { ROUTES } from '@/config/routes';
import { getRelatedArticles } from '@/services/newsManager';
import type { NewsArticle } from '@/types';

interface RelatedArticlesProps {
  currentArticle: NewsArticle;
  limit?: number;
}

// Componente interno para card de artigo relacionado - otimizado com memo
interface RelatedArticleCardProps {
  article: NewsArticle;
}

const RelatedArticleCard = memo(function RelatedArticleCard({ 
  article
}: RelatedArticleCardProps) {

  // useMemo para formataÃ§Ã£o da data
  const formattedDate = useMemo(() => 
    new Date(article.publishedAt).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: 'short',
    }),
  [article.publishedAt]);

  return (
    <li>
      <article className="group">
        <Link href={ROUTES.noticia(article.slug)} className="flex gap-4">
          <figure className="w-20 h-20 flex-shrink-0 overflow-hidden rounded-md relative">
            <Image
              src={article.coverImage}
              alt={article.title}
              fill
              sizes="80px"
              className="object-cover transition-transform duration-300 group-hover:scale-105"
            />
          </figure>
          <section className="flex-1 min-w-0">
            <h3 className="text-sm font-semibold text-[#111111] line-clamp-2 group-hover:text-[#c40000] transition-colors">
              {article.title}
            </h3>
            <time 
              className="text-xs text-[#6b6b6b]"
              dateTime={article.publishedAt}
            >
              {formattedDate}
            </time>
          </section>
        </Link>
      </article>
    </li>
  );
});
RelatedArticleCard.displayName = 'RelatedArticleCard';

export const RelatedArticles = memo(function RelatedArticles({ 
  currentArticle, 
  limit = 4 
}: RelatedArticlesProps) {
  const [related, setRelated] = useState<NewsArticle[]>([]);

  // useMemo para a categoria URL
  const categoryUrl = useMemo(() => 
    ROUTES.categoria(currentArticle.category),
  [currentArticle.category]);

  useEffect(() => {
    let isMounted = true;
    const load = async () => {
      try {
        const data = await getRelatedArticles(
          currentArticle.slug,
          currentArticle.category,
          currentArticle.tags ?? [],
          limit
        );
        if (isMounted) setRelated(data);
      } catch {
        // Erro silenciado em produÃ§Ã£o - nÃ£o logamos em dev intencionalmente
      }
    };

    load();
    return () => {
      isMounted = false;
    };
  }, [currentArticle.slug, currentArticle.category, limit]);

  if (related.length === 0) return null;

  return (
    <aside className="mt-12 pt-8 border-t border-[#e5e5e5]">
      <header className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-[#111111]">Leia tambem</h2>
        <Link 
          href={categoryUrl}
          className="flex items-center gap-1 text-sm text-[#c40000] hover:underline"
        >
          Ver mais
          <ArrowRight className="w-4 h-4" />
        </Link>
      </header>

      <ul className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {related.map((article) => (
          <RelatedArticleCard 
            key={article.slug} 
            article={article} 
          />
        ))}
      </ul>
    </aside>
  );
});
RelatedArticles.displayName = 'RelatedArticles';
