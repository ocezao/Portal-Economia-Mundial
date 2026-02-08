import { NextResponse } from 'next/server';

import { getSiteUrl } from '@/lib/siteUrl';
import { absoluteUrl, escXml } from '@/lib/sitemaps';
import { getActiveAuthors } from '@/services/authors';

export const revalidate = 3600; // 1 hour

export async function GET() {
  const siteUrl = getSiteUrl();
  const now = new Date().toISOString();

  const authors = await getActiveAuthors();

  const urlEntries = authors
    .map((a) => {
      const loc = absoluteUrl(siteUrl, `/autor/${a.slug}`);
      return (
        `<url>` +
        `<loc>${escXml(loc)}</loc>` +
        `<lastmod>${escXml(now)}</lastmod>` +
        `<changefreq>monthly</changefreq>` +
        `<priority>0.5</priority>` +
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

