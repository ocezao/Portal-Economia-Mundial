/**
 * Home (server)
 * Renderiza e revalida no servidor para reduzir custo por visita e melhorar SEO.
 * OTIMIZADO para velocidade instantânea com ISR agressivo
 */

import type { Metadata } from 'next';

import HomePageClient from './HomePageClient';
import { APP_CONFIG } from '@/config/app';
import { SEO_CONFIG } from '@/config/seo';
import { getSiteUrl } from '@/lib/siteUrl';
import { getFeaturedArticles, getLatestArticles, getTrendingArticles, getBreakingNews } from '@/services/newsManager';
import { getEarningsNext7DaysSnapshot, getMarketNewsSnapshot } from '@/services/economics/snapshots';

// OTIMIZAÇÃO: ISR com revalidação frequente para速度instantânea
// 30 segundos - balance entre freshness e performance
export const revalidate = 30;

// OTIMIZAÇÃO: Generate static params para build mais rápido
export const dynamicParams = true;

// OTIMIZAÇÃO: Force cache para builds estáticos
export const fetchCache = 'force-cache';

export async function generateMetadata(): Promise<Metadata> {
  const siteUrl = getSiteUrl();
  const url = `${siteUrl}/`;

  const title = APP_CONFIG.brand.name;
  const description = APP_CONFIG.brand.tagline;

  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: {
      type: 'website',
      url,
      title,
      description,
      siteName: SEO_CONFIG.og.siteName,
      locale: SEO_CONFIG.og.locale,
      images: [
        {
          url: SEO_CONFIG.og.image,
          width: SEO_CONFIG.og.imageWidth,
          height: SEO_CONFIG.og.imageHeight,
          alt: title,
        },
      ],
    },
    twitter: {
      card: SEO_CONFIG.og.twitterCard,
      site: SEO_CONFIG.og.twitterSite,
      title,
      description,
      images: [SEO_CONFIG.og.image],
    },
  };
}

export default async function HomePage() {
  // OTIMIZAÇÃO: Reduzido de 120 para 30 artigos
  // O valor alto (120) estava causando lentidão extrema no LCP
  const [featured, latest, trending, breaking, articlesForCategoryHighlights, earnings, marketNews] =
    await Promise.all([
      getFeaturedArticles(3),
      getLatestArticles(12),
      getTrendingArticles(5),
      getBreakingNews(),
      // Reduzido de 120 para 30 - ainda suficiente para destaques por categoria
      getLatestArticles(30),
      getEarningsNext7DaysSnapshot().then((data) => data.slice(0, 5)).catch(() => []),
      getMarketNewsSnapshot('general').catch(() => []),
    ]);

  return (
    <HomePageClient
      featured={featured}
      latest={latest}
      trending={trending}
      breaking={breaking}
      articlesForCategoryHighlights={articlesForCategoryHighlights}
      earnings={earnings}
      marketNews={marketNews}
    />
  );
}
