import { NextResponse } from 'next/server';

import { APP_CONFIG } from '@/config/app';
import { getSiteUrl } from '@/lib/siteUrl';
import { getLatestArticles } from '@/services/newsManager';

export const revalidate = 600; // 10 min

function esc(value: string) {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/\"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

export async function GET() {
  const siteUrl = getSiteUrl();
  const now = new Date().toUTCString();

  const items = await getLatestArticles(50);

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

  const channelTitle = esc(APP_CONFIG.brand.name);
  const channelDesc = esc(APP_CONFIG.brand.tagline);

  const xml =
    `<?xml version="1.0" encoding="UTF-8"?>` +
    `<rss version="2.0">` +
    `<channel>` +
    `<title>${channelTitle}</title>` +
    `<link>${esc(siteUrl)}/</link>` +
    `<description>${channelDesc}</description>` +
    `<language>pt-BR</language>` +
    `<lastBuildDate>${now}</lastBuildDate>` +
    xmlItems +
    `</channel>` +
    `</rss>`;

  return new NextResponse(xml, {
    headers: {
      'content-type': 'application/rss+xml; charset=utf-8',
      // Allow caching at CDNs later; safe even now.
      'cache-control': 'public, s-maxage=600, stale-while-revalidate=3600',
    },
  });
}

