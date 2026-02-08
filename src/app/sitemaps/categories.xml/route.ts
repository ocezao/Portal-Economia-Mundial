import { NextResponse } from 'next/server';

import { CONTENT_CONFIG } from '@/config/content';
import { ROUTES } from '@/config/routes';
import { getSiteUrl } from '@/lib/siteUrl';
import { absoluteUrl, escXml } from '@/lib/sitemaps';

export const revalidate = 3600; // 1 hour

export async function GET() {
  const siteUrl = getSiteUrl();
  const now = new Date().toISOString();

  const categories = Object.values(CONTENT_CONFIG.categories);

  const urlEntries = categories
    .map((c) => {
      const loc = absoluteUrl(siteUrl, ROUTES.categoria(c.slug));
      return (
        `<url>` +
        `<loc>${escXml(loc)}</loc>` +
        `<lastmod>${escXml(now)}</lastmod>` +
        `<changefreq>daily</changefreq>` +
        `<priority>0.8</priority>` +
        `</url>`
      );
    })
    .join('');

  const xml =
    `<?xml version="1.0" encoding="UTF-8"?>` +
    `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">` +
    urlEntries +
    `</urlset>`;

  return new NextResponse(xml, {
    headers: {
      'content-type': 'application/xml; charset=utf-8',
      'cache-control': 'public, s-maxage=3600, stale-while-revalidate=86400',
    },
  });
}

