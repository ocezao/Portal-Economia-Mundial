/**
 * Hero Section - Destaque Principal Editorial
 * Layout impactante para portal de notícias - Totalmente Responsivo
 */

import Link from 'next/link';
import { Clock, TrendingUp, ArrowRight, Flame, ChevronRight } from 'lucide-react';
import { ROUTES } from '@/config/routes';
import { CONTENT_CONFIG } from '@/config/content';
import type { NewsArticle } from '@/types';

interface HeroSectionProps {
  mainArticle: NewsArticle;
  secondaryArticles?: NewsArticle[];
}

export function HeroSection({ mainArticle, secondaryArticles = [] }: HeroSectionProps) {
  const category = CONTENT_CONFIG.categories[mainArticle.category];
  const publishedDate = new Date(mainArticle.publishedAt).toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  });

  // Formato curto para mobile
  const publishedDateShort = new Date(mainArticle.publishedAt).toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: 'short',
  });

  return (
    <section className="mb-8 md:mb-12">
      {/* Grid Principal: Destaque + Secundários */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 md:gap-6">
        
        {/* Artigo Principal - Ocupa 8 colunas em desktop */}
        <article className="lg:col-span-8 group relative">
          <Link href={ROUTES.noticia(mainArticle.slug)} className="block relative">
            {/* Container da Imagem com Overlay */}
            <figure className="relative aspect-[4/3] sm:aspect-[16/10] lg:aspect-[16/9] overflow-hidden rounded-lg sm:rounded-xl">
              <img
                src={mainArticle.coverImage}
                alt={mainArticle.title}
                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
              />
              {/* Gradient Overlay - mais forte em mobile para legibilidade */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/50 to-transparent sm:from-black/90 sm:via-black/40" />
              
              {/* Badge Breaking News */}
              {mainArticle.breaking && (
                <span className="absolute top-2 left-2 sm:top-4 sm:left-4 flex items-center gap-1 sm:gap-2 px-2 py-1 sm:px-3 sm:py-1.5 bg-[#c40000] text-white text-xs font-bold uppercase tracking-wider rounded">
                  <Flame className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                  <span className="hidden sm:inline">Urgente</span>
                  <span className="sm:hidden">Urgente</span>
                </span>
              )}

              {/* Badge Trending */}
              {mainArticle.views > 1000 && !mainArticle.breaking && (
                <span className="absolute top-2 left-2 sm:top-4 sm:left-4 flex items-center gap-1 px-2 py-1 sm:px-3 sm:py-1.5 bg-white/90 backdrop-blur text-[#111111] text-xs font-bold uppercase tracking-wider rounded">
                  <TrendingUp className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-[#c40000]" />
                  <span className="hidden sm:inline">Em Alta</span>
                </span>
              )}

              {/* Conteúdo sobreposto na imagem */}
              <figcaption className="absolute bottom-0 left-0 right-0 p-3 sm:p-4 md:p-6 lg:p-8">
                {/* Categoria - menor em mobile */}
                <span 
                  className="inline-flex items-center gap-1 sm:gap-2 px-2 py-0.5 sm:px-3 sm:py-1 rounded-full text-xs font-bold uppercase tracking-wider mb-2 sm:mb-4 bg-white/10 backdrop-blur-sm text-white border border-white/20"
                  style={{ borderLeftColor: category.color, borderLeftWidth: '2px' }}
                >
                  {category.name}
                </span>

                {/* Título Principal - responsivo */}
                <h1 className="text-lg sm:text-xl md:text-2xl lg:text-3xl xl:text-4xl font-black text-white leading-tight mb-2 sm:mb-3 md:mb-4 drop-shadow-lg line-clamp-3 sm:line-clamp-none">
                  {mainArticle.title}
                </h1>

                {/* Excerpt - escondido em mobile pequeno */}
                <p className="hidden sm:block text-white/90 text-sm md:text-base lg:text-lg mb-3 md:mb-4 line-clamp-2 max-w-3xl drop-shadow">
                  {mainArticle.excerpt}
                </p>

                {/* Metadados - responsivos */}
                <footer className="flex flex-wrap items-center gap-2 sm:gap-4 text-xs sm:text-sm text-white/80">
                  <span className="font-semibold text-white truncate max-w-[100px] sm:max-w-none">{mainArticle.author}</span>
                  <span className="hidden sm:inline w-1 h-1 rounded-full bg-white/50" />
                  {/* Data completa em desktop, curta em mobile */}
                  <time dateTime={mainArticle.publishedAt} className="hidden sm:inline">
                    {publishedDate}
                  </time>
                  <time dateTime={mainArticle.publishedAt} className="sm:hidden">
                    {publishedDateShort}
                  </time>
                  <span className="w-1 h-1 rounded-full bg-white/50" />
                  <span className="flex items-center gap-1">
                    <Clock className="w-3 h-3 sm:w-4 sm:h-4" />
                    <span className="hidden sm:inline">{mainArticle.readingTime} min de leitura</span>
                    <span className="sm:hidden">{mainArticle.readingTime} min</span>
                  </span>
                </footer>
              </figcaption>
            </figure>
          </Link>

          {/* Barra de ação abaixo da imagem - responsiva */}
          <div className="mt-3 sm:mt-4 flex items-center justify-between px-1">
            <div className="flex items-center gap-2 sm:gap-4 text-xs sm:text-sm text-[#6b6b6b]">
              <span className="flex items-center gap-1 sm:gap-1.5">
                <TrendingUp className="w-3 h-3 sm:w-4 sm:h-4 text-[#c40000]" />
                <span className="hidden sm:inline">{mainArticle.views.toLocaleString('pt-BR')} visualizações</span>
                <span className="sm:hidden">{formatViews(mainArticle.views)}</span>
              </span>
            </div>
            <Link 
              href={ROUTES.noticia(mainArticle.slug)}
              className="inline-flex items-center gap-1 sm:gap-2 text-[#c40000] font-semibold text-sm sm:text-base hover:gap-2 sm:hover:gap-3 transition-all"
            >
              <span className="hidden sm:inline">Ler artigo completo</span>
              <span className="sm:hidden">Ler mais</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </article>

        {/* Artigos Secundários - Ocupa 4 colunas em desktop */}
        <aside className="lg:col-span-4 flex flex-col gap-3 sm:gap-4">
          {/* Header */}
          <header className="flex items-center justify-between pb-2 sm:pb-3 border-b border-[#e5e5e5]">
            <h2 className="text-base sm:text-lg font-bold text-[#111111]">Destaques</h2>
            <span className="text-xs text-[#6b6b6b]">Hoje</span>
          </header>

          {/* Lista de secundários */}
          <div className="flex flex-col gap-3 sm:gap-4">
            {secondaryArticles.slice(0, 3).map((article, index) => {
              const cat = CONTENT_CONFIG.categories[article.category];
              const timeAgo = getTimeAgo(article.publishedAt);

              return (
                <article key={article.slug} className="group relative">
                  <Link href={ROUTES.noticia(article.slug)} className="flex gap-2 sm:gap-4">
                    {/* Número do ranking */}
                    <span className="flex-shrink-0 w-6 h-6 sm:w-8 sm:h-8 flex items-center justify-center bg-[#f5f5f5] text-[#6b6b6b] font-bold text-xs sm:text-sm rounded group-hover:bg-[#c40000] group-hover:text-white transition-colors">
                      {String(index + 1).padStart(2, '0')}
                    </span>

                    <div className="flex-1 min-w-0">
                      {/* Categoria */}
                      <span 
                        className="text-xs font-bold uppercase tracking-wider"
                        style={{ color: cat.color }}
                      >
                        {cat.name}
                      </span>

                      {/* Título - ajustado para mobile */}
                      <h3 className="text-xs sm:text-sm font-bold text-[#111111] line-clamp-2 group-hover:text-[#c40000] transition-colors leading-snug">
                        {article.title}
                      </h3>

                      {/* Tempo */}
                      <time className="text-xs text-[#6b6b6b] mt-0.5 sm:mt-1 block">
                        {timeAgo}
                      </time>
                    </div>

                    {/* Thumbnail mini - mostrar em telas maiores que 400px */}
                    <figure className="hidden xs:block w-16 h-12 sm:w-20 sm:h-14 flex-shrink-0 overflow-hidden rounded">
                      <img
                        src={article.coverImage}
                        alt=""
                        loading="lazy"
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                      />
                    </figure>
                  </Link>
                </article>
              );
            })}
          </div>

          {/* CTA Newsletter mini - responsivo */}
          <div className="mt-auto p-3 sm:p-4 bg-[#111111] rounded-lg sm:rounded-xl text-white">
            <h4 className="font-bold text-xs sm:text-sm mb-0.5 sm:mb-1">Fique por dentro</h4>
            <p className="text-xs text-white/70 mb-2 sm:mb-3">
              Receba as principais notícias do dia
            </p>
            <Link 
              href="/app"
              className="inline-flex items-center gap-1 text-xs font-semibold text-[#c40000] hover:gap-2 transition-all"
            >
              Assinar newsletter <ChevronRight className="w-3 h-3" />
            </Link>
          </div>
        </aside>
      </div>
    </section>
  );
}

// Helper para calcular tempo relativo
function getTimeAgo(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));

  if (diffInMinutes < 1) {
    return 'Agora';
  }

  if (diffInMinutes < 60) {
    return `${diffInMinutes} min`;
  }

  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) {
    return `${diffInHours}h`;
  }

  const diffInDays = Math.floor(diffInHours / 24);
  if (diffInDays === 1) {
    return 'Ontem';
  }

  if (diffInDays < 7) {
    return `${diffInDays} dias`;
  }

  return date.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' });
}

// Helper para formatar views em mobile (ex: 1.2k, 2.5M)
function formatViews(views: number): string {
  if (views >= 1000000) {
    return (views / 1000000).toFixed(1).replace('.', ',') + 'M';
  }
  if (views >= 1000) {
    return (views / 1000).toFixed(1).replace('.', ',') + 'k';
  }
  return views.toString();
}
