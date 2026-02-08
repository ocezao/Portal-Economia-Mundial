/**
 * Card de Notícia
 * Exibe preview de artigo
 */

'use client';

import Link from 'next/link';
import { Clock, Bookmark, Gem } from 'lucide-react';
import { ROUTES } from '@/config/routes';
import { CONTENT_CONFIG } from '@/config/content';
import type { NewsArticle } from '@/types';

interface NewsCardProps {
  article: NewsArticle;
  variant?: 'default' | 'featured' | 'compact';
  showBookmark?: boolean;
  onBookmark?: (slug: string) => void;
  isBookmarked?: boolean;
}

export function NewsCard({ 
  article, 
  variant = 'default',
  showBookmark = false,
  onBookmark,
  isBookmarked = false,
}: NewsCardProps) {
  const category = CONTENT_CONFIG.categories[article.category];
  const publishedDate = new Date(article.publishedAt).toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });

  // Verifica se é publicação patrocinada
  const isSponsored = article.tags?.includes('Publicação Patrocinada');

  // Badge de Publicação Patrocinada
  const SponsoredBadge = () => isSponsored ? (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-gradient-to-r from-amber-100 to-yellow-100 text-amber-800 text-[10px] font-bold uppercase tracking-wider rounded-full border border-amber-200">
      <Gem className="w-3 h-3" />
      Patrocinado
    </span>
  ) : null;

  if (variant === 'featured') {
    return (
      <article className="group relative">
        <Link href={ROUTES.noticia(article.slug)} className="block">
          <figure className="relative aspect-[16/9] overflow-hidden rounded-lg mb-4">
            <img
              src={article.coverImage}
              alt={article.title}
              loading="lazy"
              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
            />
            {article.breaking && (
              <span className="absolute top-4 left-4 px-3 py-1 bg-[#c40000] text-white text-xs font-bold uppercase tracking-wider">
                Urgente
              </span>
            )}
            {isSponsored && (
              <span className="absolute top-4 right-4 px-3 py-1 bg-gradient-to-r from-amber-400 to-yellow-400 text-amber-900 text-xs font-bold uppercase tracking-wider rounded-full shadow-md">
                💎 Patrocinado
              </span>
            )}
          </figure>
          <header>
            <div className="flex items-center gap-2 mb-2">
              <span 
                className="text-xs font-semibold uppercase tracking-wider"
                style={{ color: category.color }}
              >
                {category.name}
              </span>
              <SponsoredBadge />
            </div>
            <h2 className="text-2xl md:text-3xl font-bold text-[#111111] leading-tight mb-3 group-hover:text-[#c40000] transition-colors">
              {article.title}
            </h2>
            <p className="text-[#6b6b6b] text-base mb-4 line-clamp-2">
              {article.excerpt}
            </p>
            <footer className="flex items-center gap-4 text-sm text-[#6b6b6b]">
              <span>{article.author}</span>
              <time dateTime={article.publishedAt}>{publishedDate}</time>
              <span className="flex items-center gap-1">
                <Clock className="w-4 h-4" />
                {article.readingTime} min
              </span>
            </footer>
          </header>
        </Link>
      </article>
    );
  }

  if (variant === 'compact') {
    return (
      <article className="group">
        <Link href={ROUTES.noticia(article.slug)} className="flex gap-4">
          <figure className="w-24 h-24 flex-shrink-0 overflow-hidden rounded-md relative">
            <img
              src={article.coverImage}
              alt={article.title}
              loading="lazy"
              className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
            />
            {isSponsored && (
              <span className="absolute top-1 right-1 w-5 h-5 bg-gradient-to-r from-amber-400 to-yellow-400 rounded-full flex items-center justify-center shadow-sm" title="Publicação Patrocinada">
                <Gem className="w-3 h-3 text-amber-900" />
              </span>
            )}
          </figure>
          <section className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <span 
                className="text-xs font-semibold uppercase tracking-wider"
                style={{ color: category.color }}
              >
                {category.name}
              </span>
              {isSponsored && <SponsoredBadge />}
            </div>
            <h3 className="text-sm font-semibold text-[#111111] line-clamp-2 group-hover:text-[#c40000] transition-colors">
              {article.title}
            </h3>
            <time className="text-xs text-[#6b6b6b]" dateTime={article.publishedAt}>
              {publishedDate}
            </time>
          </section>
        </Link>
      </article>
    );
  }

  // Default
  return (
    <article className={`group bg-white border rounded-lg overflow-hidden card-hover ${isSponsored ? 'border-amber-200 shadow-md' : 'border-[#e5e5e5]'}`}>
      <Link href={ROUTES.noticia(article.slug)} className="block">
        <figure className="relative aspect-[16/9] overflow-hidden">
          <img
            src={article.coverImage}
            alt={article.title}
            loading="lazy"
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
          {article.breaking && (
            <span className="absolute top-3 left-3 px-2 py-1 bg-[#c40000] text-white text-xs font-bold uppercase">
              Urgente
            </span>
          )}
          {isSponsored && (
            <span className="absolute top-3 right-3 px-2 py-1 bg-gradient-to-r from-amber-400 to-yellow-400 text-amber-900 text-[10px] font-bold uppercase rounded-full shadow-md">
              💎 Patrocinado
            </span>
          )}
        </figure>
        <section className="p-4">
          <header>
            <div className="flex items-center gap-2 mb-2">
              <span 
                className="text-xs font-semibold uppercase tracking-wider"
                style={{ color: category.color }}
              >
                {category.name}
              </span>
              {isSponsored && <SponsoredBadge />}
            </div>
            <h3 className="text-lg font-bold text-[#111111] leading-snug mb-2 group-hover:text-[#c40000] transition-colors line-clamp-2">
              {article.title}
            </h3>
            <p className="text-sm text-[#6b6b6b] line-clamp-2 mb-3">
              {article.excerpt}
            </p>
          </header>
          <footer className="flex items-center justify-between text-xs text-[#6b6b6b]">
            <section className="flex items-center gap-3">
              <time dateTime={article.publishedAt}>{publishedDate}</time>
              <span className="flex items-center gap-1">
                <Clock className="w-3 h-3" />
                {article.readingTime} min
              </span>
            </section>
            {showBookmark && (
              <button
                onClick={(e) => {
                  e.preventDefault();
                  onBookmark?.(article.slug);
                }}
                className={`p-1.5 rounded-full transition-colors ${
                  isBookmarked 
                    ? 'bg-[#c40000] text-white' 
                    : 'hover:bg-[#f5f5f5] text-[#6b6b6b]'
                }`}
                aria-label={isBookmarked ? 'Remover dos favoritos' : 'Adicionar aos favoritos'}
              >
                <Bookmark className={`w-4 h-4 ${isBookmarked ? 'fill-current' : ''}`} />
              </button>
            )}
          </footer>
        </section>
      </Link>
    </article>
  );
}
