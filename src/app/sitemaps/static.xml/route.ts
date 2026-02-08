import { NextResponse } from 'next/server';

import { ROUTES } from '@/config/routes';
import { getSiteUrl } from '@/lib/siteUrl';
import { absoluteUrl, escXml } from '@/lib/sitemaps';

export const revalidate = 3600; // 1 hour

export async function GET() {
  const siteUrl = getSiteUrl();
  const now = new Date().toISOString();

  const staticPaths = [
    ROUTES.home,
    '/noticias',
    '/categorias',
    '/destaque',
    '/em-alta',
    ROUTES.sobre,
    ROUTES.privacidade,
    ROUTES.termos,
    ROUTES.cookies,
    ROUTES.faleConosco,
    ROUTES.trabalheConosco,
    ROUTES.economia.mercados,
    ROUTES.economia.dados,
    ROUTES.economia.calendario,
    ROUTES.mapaTensoes,
    ROUTES.termometroRisco,
    '/editorial',
  ];

  const urlEntries = staticPaths
    .map((path) => {
      const loc = absoluteUrl(siteUrl, path);
      const changefreq = path === ROUTES.home ? 'daily' : 'weekly';
      const priority = path === ROUTES.home ? 1 : 0.7;
      return (
        `<url>` +
        `<loc>${escXml(loc)}</loc>` +
        `<lastmod>${escXml(now)}</lastmod>` +
        `<changefreq>${changefreq}</changefreq>` +
        `<priority>${priority.toFixed(1)}</priority>` +
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

