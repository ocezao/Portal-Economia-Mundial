import type { Metadata, Viewport } from 'next';
import Script from 'next/script';

import '../index.css';

import { Providers } from './providers';
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
    <html lang="pt" suppressHydrationWarning>
      <head>
        {/* Preconnect para domínios externos - melhora LCP */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        
        {/* Preconnect para recursos de publicidade */}
        <link rel="preconnect" href="https://pagead2.googlesyndication.com" />
        <link rel="preconnect" href="https://googleads.g.doubleclick.net" />
        
        {/* DNS Prefetch para domínios de terceiros */}
        <link rel="dns-prefetch" href="https://fonts.googleapis.com" />
        <link rel="dns-prefetch" href="https://pagead2.googlesyndication.com" />
        
        {/* PWA Manifest */}
        <link rel="manifest" href="/manifest.json" />
        
        {/* Ícones PWA */}
        <link rel="apple-touch-icon" href="/icons/icon-192x192.png" />
        <link rel="apple-touch-icon" sizes="152x152" href="/icons/icon-152x152.png" />
        <link rel="apple-touch-icon" sizes="180x180" href="/icons/icon-192x192.png" />
        <link rel="apple-touch-icon" sizes="167x167" href="/icons/icon-152x152.png" />
        
        {/* Preload de fontes críticas */}
        <link 
          rel="preload" 
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap" 
          as="style"
        />
        
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
        
        {/* Google AdSense - OTIMIZADO: carregamento tardio */}
        <Script
          async
          defer
          src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-6096980902806551"
          crossOrigin="anonymous"
          strategy="lazyOnload"
        />
        
        {/* Google tag (gtag.js) - OTIMIZADO: lazyOnload para não bloquear LCP */}
        <Script async src="https://www.googletagmanager.com/gtag/js?id=G-842VLRHHXQ" strategy="lazyOnload" />
        <Script id="gtag-init" dangerouslySetInnerHTML={{
          __html: `
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', 'G-842VLRHHXQ');
          `
        }} />
        
        {/* Microsoft Clarity - OTIMIZADO: lazyOnload */}
        <Script id="clarity-init" dangerouslySetInnerHTML={{
          __html: `
            (function(c,l,a,r,i,t,y){
                c[a]=c[a]||function(){(c[a].q=c[a].q||[]).push(arguments)};
                t=l.createElement(r);t.async=1;t.src="https://www.clarity.ms/tag/"+i;
                y=l.getElementsByTagName(r)[0];y.parentNode.insertBefore(t,y);
            })(window, document, "clarity", "script", "vjzgusrh04");
          `
        }} strategy="lazyOnload" />
        
        {/* Google Tag Manager - OTIMIZADO: lazyOnload */}
        <Script id="gtm-init" dangerouslySetInnerHTML={{
          __html: `
            (function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
            new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
            j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
            'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
            })(window,document,'script','dataLayer','GTM-PBXFKLFR');
          `
        }} strategy="lazyOnload" />
      </head>
      <body className="min-h-screen bg-white text-[#111111] antialiased">
        {/* Google Tag Manager (noscript) */}
        <noscript>
          <iframe 
            src="https://www.googletagmanager.com/ns.html?id=GTM-PBXFKLFR"
            height="0" 
            width="0" 
            style={{ display: 'none', visibility: 'hidden' }}
          />
        </noscript>
        {/* End Google Tag Manager (noscript) */}
        
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  );
}
