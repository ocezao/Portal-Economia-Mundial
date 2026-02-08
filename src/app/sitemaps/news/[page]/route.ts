import { NextResponse } from 'next/server';

import { ROUTES } from '@/config/routes';
import { getSiteUrl } from '@/lib/siteUrl';
import { supabase, isSupabaseConfigured } from '@/lib/supabaseClient';
import { absoluteUrl, escXml, resolveAbsoluteUrl } from '@/lib/sitemaps';

export const revalidate = 1800; // 30 min

const NEWS_PER_SITEMAP = 2000;

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

  if (!isSupabaseConfigured) {
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

  const from = (page - 1) * NEWS_PER_SITEMAP;
  const to = from + NEWS_PER_SITEMAP - 1;

  const { data, error } = await supabase
    .from('news_articles')
    .select('slug, updated_at, published_at, created_at, cover_image')
    .eq('status', 'published')
    .order('published_at', { ascending: false, nullsFirst: false })
    .range(from, to);

  const rows = !error && Array.isArray(data) ? (data as Record<string, unknown>[]) : [];

  const urlEntries = rows
    .map((row) => {
      const slug = (row?.slug as string | undefined) ?? '';
      if (!slug) return '';

      const lastMod =
        (row?.updated_at as string | undefined) ??
        (row?.published_at as string | undefined) ??
        (row?.created_at as string | undefined) ??
        now;

      const loc = absoluteUrl(siteUrl, ROUTES.noticia(slug));

      const cover = resolveAbsoluteUrl(siteUrl, String(row?.cover_image ?? ''));
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
