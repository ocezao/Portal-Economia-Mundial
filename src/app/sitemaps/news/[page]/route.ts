import { NextResponse } from 'next/server';

import { ROUTES } from '@/config/routes';
import { queryRows } from '@/lib/db';
import { getSiteUrl } from '@/lib/siteUrl';
import { absoluteUrl, escXml, resolveAbsoluteUrl } from '@/lib/sitemaps';

export const revalidate = 1800; // 30 min

const NEWS_PER_SITEMAP = 2000;

interface NewsSitemapRow {
  slug: string;
  updated_at: string | null;
  published_at: string | null;
  created_at: string | null;
  cover_image: string | null;
}

function parsePage(param: string | undefined) {
  const n = Number(param);
  if (!Number.isFinite(n)) return null;
  const i = Math.trunc(n);
  if (i < 1) return null;
  return i;
}

export async function GET(_req: Request, ctx: { params: Promise<{ page?: string }> }) {
  const { page: pageParam } = await ctx.params;
  const page = parsePage(pageParam);
  if (!page) {
    return new NextResponse('Invalid sitemap page', { status: 400 });
  }

  const siteUrl = getSiteUrl();
  const now = new Date().toISOString();

  let rows: NewsSitemapRow[] = [];
  try {
    rows = await queryRows<NewsSitemapRow>(
      `select slug, updated_at, published_at, created_at, cover_image
         from news_articles
        where status = $1
        order by published_at desc nulls last
        offset $2
        limit $3`,
      ['published', (page - 1) * NEWS_PER_SITEMAP, NEWS_PER_SITEMAP],
    );
  } catch {
    const xml =
      `<?xml version="1.0" encoding="UTF-8"?>` +
      `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">` +
      `</urlset>`;

    return new NextResponse(xml, {
      headers: {
        'content-type': 'application/xml; charset=utf-8',
        'cache-control': 'public, s-maxage=1800, stale-while-revalidate=86400',
      },
    });
  }

  const urlEntries = rows
    .map((row) => {
      const slug = row.slug ?? '';
      if (!slug) return '';

      const lastMod =
        row.updated_at ??
        row.published_at ??
        row.created_at ??
        now;

      const loc = absoluteUrl(siteUrl, ROUTES.noticia(slug));

      const cover = resolveAbsoluteUrl(siteUrl, row.cover_image ?? '');
      const imageXml = cover
        ? `<image:image><image:loc>${escXml(cover)}</image:loc></image:image>`
        : '';

      let lastModIso = now;
      try {
        lastModIso = new Date(lastMod).toISOString();
      } catch {
        lastModIso = now;
      }

      return (
        `<url>` +
        `<loc>${escXml(loc)}</loc>` +
        `<lastmod>${escXml(lastModIso)}</lastmod>` +
        `<changefreq>weekly</changefreq>` +
        `<priority>0.9</priority>` +
        imageXml +
        `</url>`
      );
    })
    .filter(Boolean)
    .join('');

  const xml =
    `<?xml version="1.0" encoding="UTF-8"?>` +
    `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">` +
    urlEntries +
    `</urlset>`;

  return new NextResponse(xml, {
    headers: {
      'content-type': 'application/xml; charset=utf-8',
      'cache-control': 'public, s-maxage=1800, stale-while-revalidate=86400',
    },
  });
}
