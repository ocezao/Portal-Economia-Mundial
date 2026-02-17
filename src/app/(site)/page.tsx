/**
 * Home (server)
 * Renderiza e revalida no servidor para reduzir custo por visita e melhorar SEO.
 */

import type { Metadata } from 'next';

import HomePageClient from './HomePageClient';
import { APP_CONFIG } from '@/config/app';
import { SEO_CONFIG } from '@/config/seo';
import { getSiteUrl } from '@/lib/siteUrl';
import { getFeaturedArticles, getLatestArticles, getTrendingArticles, getBreakingNews } from '@/services/newsManager';
import { getEarningsNext7DaysSnapshot, getMarketNewsSnapshot } from '@/services/economics/snapshots';

export const revalidate = 60;

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
  const [featured, latest, trending, breaking, articlesForCategoryHighlights, earnings, marketNews] =
    await Promise.all([
      getFeaturedArticles(3),
      getLatestArticles(12),
      getTrendingArticles(5),
      getBreakingNews(),
      // Para destaques por categoria e contagens do sidebar, nao precisamos de "todos".
      // Mantemos um volume controlado para reduzir custo por visita.
      getLatestArticles(120),
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
