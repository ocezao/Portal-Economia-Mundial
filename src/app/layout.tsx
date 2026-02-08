import type { Metadata, Viewport } from 'next';

import '../index.css';

import { Providers } from './providers';
import { AdSenseScript } from '@/components/ads/AdSenseScript';
import { CookieBanner } from '@/components/consent/CookieBanner';
import { APP_CONFIG } from '@/config/app';
import { SEO_CONFIG } from '@/config/seo';
import { JsonLd } from '@/components/seo/JsonLd';
import { getSiteUrl } from '@/lib/siteUrl';

const siteUrl = getSiteUrl();

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: APP_CONFIG.brand.name,
    template: `%s | ${APP_CONFIG.brand.name}`,
  },
  description: APP_CONFIG.brand.tagline,
  openGraph: {
    type: 'website',
    locale: 'pt_BR',
    siteName: APP_CONFIG.brand.name,
    title: APP_CONFIG.brand.name,
    description: APP_CONFIG.brand.tagline,
    images: [
      {
        url: SEO_CONFIG.og.image,
        width: SEO_CONFIG.og.imageWidth,
        height: SEO_CONFIG.og.imageHeight,
        alt: APP_CONFIG.brand.name,
      },
    ],
  },
  twitter: {
    card: SEO_CONFIG.og.twitterCard,
    site: SEO_CONFIG.og.twitterSite,
    title: APP_CONFIG.brand.name,
    description: APP_CONFIG.brand.tagline,
    images: [SEO_CONFIG.og.image],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-snippet': -1,
      'max-image-preview': 'large',
      'max-video-preview': -1,
    },
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#c40000',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <head>
        {/* Preconnect para domínios externos - melhora LCP */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />

        {/* Feeds (descoberta por crawlers/leitores) */}
        <link
          rel="alternate"
          type="application/rss+xml"
          href="/rss.xml"
          title={`${APP_CONFIG.brand.name} RSS`}
        />
        
        {/* JSON-LD Structured Data */}
        <JsonLd id="jsonld-organization" data={SEO_CONFIG.jsonLd.organization} />
        <JsonLd id="jsonld-website" data={SEO_CONFIG.jsonLd.website} />
      </head>
      <body className="min-h-screen bg-white text-[#111111] antialiased">
        <Providers>
          <AdSenseScript />
          {children}
          <CookieBanner />
        </Providers>
      </body>
    </html>
  );
}
