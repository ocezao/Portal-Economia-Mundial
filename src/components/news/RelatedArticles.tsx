/**
 * Artigos Relacionados
 * Recomendações baseadas na categoria atual
 */

import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { ROUTES } from '@/config/routes';
import { getRelatedArticles } from '@/services/newsService';
import type { NewsArticle } from '@/types';

interface RelatedArticlesProps {
  currentArticle: NewsArticle;
  limit?: number;
}

export function RelatedArticles({ currentArticle, limit = 4 }: RelatedArticlesProps) {
  const related = getRelatedArticles(currentArticle.slug, currentArticle.category, limit);

  if (related.length === 0) return null;

  return (
    <aside className="mt-12 pt-8 border-t border-[#e5e5e5]">
      <header className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-[#111111]">Leia também</h2>
        <Link 
          to={ROUTES.categoria(currentArticle.category)}
          className="flex items-center gap-1 text-sm text-[#c40000] hover:underline"
        >
          Ver mais
          <ArrowRight className="w-4 h-4" />
        </Link>
      </header>

      <ul className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {related.map(article => (
          <li key={article.slug}>
            <article className="group">
              <Link to={ROUTES.noticia(article.slug)} className="flex gap-4">
                <figure className="w-20 h-20 flex-shrink-0 overflow-hidden rounded-md">
                  <img
                    src={article.coverImage}
                    alt={article.title}
                    loading="lazy"
                    className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
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
                    {new Date(article.publishedAt).toLocaleDateString('pt-BR', {
                      day: '2-digit',
                      month: 'short',
                    })}
                  </time>
                </section>
              </Link>
            </article>
          </li>
        ))}
      </ul>
    </aside>
  );
}
