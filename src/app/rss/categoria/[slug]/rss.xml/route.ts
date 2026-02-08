import { NextResponse } from 'next/server';

import { CONTENT_CONFIG } from '@/config/content';
import { getSiteUrl } from '@/lib/siteUrl';
import { getArticlesPaginated } from '@/services/newsManager';

export const revalidate = 600; // 10 min

function esc(value: string) {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ slug: string }> },
) {
  const { slug } = await params;

  const category =
    CONTENT_CONFIG.categories[slug as keyof typeof CONTENT_CONFIG.categories];

  if (!category) {
    return new NextResponse('Not Found', { status: 404 });
  }

  const siteUrl = getSiteUrl();
  const now = new Date().toUTCString();

  const { items } = await getArticlesPaginated({ category: slug }, 1, 50);

  const xmlItems = items
    .map((a) => {
      const url = `${siteUrl}/noticias/${a.slug}/`;
      const title = esc(a.title);
      const description = esc(a.excerpt || '');
      const pubDate = new Date(a.publishedAt).toUTCString();

      return [
        '<item>',
        `<title>${title}</title>`,
        `<link>${esc(url)}</link>`,
        `<guid isPermaLink="true">${esc(url)}</guid>`,
        `<pubDate>${pubDate}</pubDate>`,
        `<description>${description}</description>`,
        '</item>',
      ].join('');
    })
    .join('');

  const channelTitle = esc(`${category.name} | RSS`);
  const channelDesc = esc(category.description);
  const channelLink = `${siteUrl}/categoria/${category.slug}/`;

  const xml =
    `<?xml version="1.0" encoding="UTF-8"?>` +
    `<rss version="2.0">` +
    `<channel>` +
    `<title>${channelTitle}</title>` +
    `<link>${esc(channelLink)}</link>` +
    `<description>${channelDesc}</description>` +
    `<language>pt-BR</language>` +
    `<lastBuildDate>${now}</lastBuildDate>` +
    xmlItems +
    `</channel>` +
    `</rss>`;

  return new NextResponse(xml, {
    headers: {
      'content-type': 'application/rss+xml; charset=utf-8',
      'cache-control': 'public, s-maxage=600, stale-while-revalidate=3600',
    },
  });
}

