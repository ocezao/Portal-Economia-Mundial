import { NextResponse } from 'next/server';

import { getSiteUrl } from '@/lib/siteUrl';
import { supabase, isSupabaseConfigured } from '@/lib/supabaseClient';
import { escXml } from '@/lib/sitemaps';

export const revalidate = 3600; // 1 hour

const NEWS_PER_SITEMAP = 2000;

async function getPublishedNewsCount(): Promise<number> {
  if (!isSupabaseConfigured) return 0;

  const { error, count } = await supabase
    .from('news_articles')
    .select('id', { count: 'exact', head: true })
    .eq('status', 'published') as { error: Error | null; count: number | null };

  if (error || typeof count !== 'number') return 0;
  return count;
}

export async function GET() {
  const siteUrl = getSiteUrl();
  const lastmod = new Date().toISOString();

  const sitemapUrls: string[] = [
    `${siteUrl}/sitemaps/static.xml`,
    `${siteUrl}/sitemaps/categories.xml`,
    `${siteUrl}/sitemaps/authors.xml`,
  ];

  const newsCount = await getPublishedNewsCount();
  const newsPages = Math.ceil(newsCount / NEWS_PER_SITEMAP);
  for (let page = 1; page <= newsPages; page += 1) {
    sitemapUrls.push(`${siteUrl}/sitemaps/news/${page}`);
  }

  const xml =
    `<?xml version="1.0" encoding="UTF-8"?>` +
    `<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">` +
    sitemapUrls
      .map(
        (loc) =>
          `<sitemap><loc>${escXml(loc)}</loc><lastmod>${escXml(lastmod)}</lastmod></sitemap>`,
      )
      .join('') +
    `</sitemapindex>`;

  return new NextResponse(xml, {
    headers: {
      'content-type': 'application/xml; charset=utf-8',
      'cache-control': 'public, s-maxage=3600, stale-while-revalidate=86400',
    },
  });
}

