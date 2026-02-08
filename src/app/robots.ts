import type { MetadataRoute } from 'next';

import { getSiteUrl } from '@/lib/siteUrl';

export default function robots(): MetadataRoute.Robots {
  const siteUrl = getSiteUrl();

  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        // Keep internal pages out of the index (thin/duplicate/private content).
        disallow: [
          '/admin/',
          '/app/',
          '/login/',
          '/cadastro/',
          '/busca',
          '/api/',
          '/_next/',
          // De-duplicate tracking params in crawl space (Google supports basic wildcard patterns here).
          '/*?*utm_',
          '/*?*gclid',
          '/*?*fbclid',
          '/*?*msclkid',
          '/*?*yclid',
        ],
      },
    ],
    sitemap: `${siteUrl}/sitemap.xml`,
    host: siteUrl,
  };
}
