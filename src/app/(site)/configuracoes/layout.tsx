import type { Metadata } from 'next';

import { APP_CONFIG } from '@/config/app';
import { SEO_CONFIG } from '@/config/seo';
import { getSiteUrl } from '@/lib/siteUrl';

export function generateMetadata(): Metadata {
  const siteUrl = getSiteUrl();
  const url = `${siteUrl}/configuracoes/`;

  const title = `Configurações | ${APP_CONFIG.brand.name}`;
  const description = `Configurações do usuário em ${APP_CONFIG.brand.name}.`;

  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: {
      type: 'website',
      url,
      title,
      description,
      siteName: SEO_CONFIG.og.siteName,
      locale: SEO_CONFIG.og.locale,
      images: [
        {
          url: SEO_CONFIG.og.image,
          width: SEO_CONFIG.og.imageWidth,
          height: SEO_CONFIG.og.imageHeight,
          alt: title,
        },
      ],
    },
    twitter: {
      card: SEO_CONFIG.og.twitterCard,
      site: SEO_CONFIG.og.twitterSite,
      title,
      description,
      images: [SEO_CONFIG.og.image],
    },
    robots: { index: false, follow: false },
  };
}

export default function ConfiguracoesLayout({ children }: { children: React.ReactNode }) {
  return children;
}

