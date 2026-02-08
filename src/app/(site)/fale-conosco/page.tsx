import type { Metadata } from 'next';

import { JsonLd } from '@/components/seo/JsonLd';
import { APP_CONFIG } from '@/config/app';
import { SEO_CONFIG, generateBreadcrumbJsonLd } from '@/config/seo';
import { getSiteUrl } from '@/lib/siteUrl';

import FaleConoscoPageClient from './FaleConoscoPageClient';

export const revalidate = 3600;

export async function generateMetadata(): Promise<Metadata> {
  const siteUrl = getSiteUrl();
  const url = `${siteUrl}/fale-conosco/`;

  const title = `Fale Conosco | ${APP_CONFIG.brand.name}`;
  const description = 'Envie duvidas, sugestoes ou parcerias. Nosso time responde o mais rapido possivel.';

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
          alt: 'Contato',
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
  };
}

export default function FaleConoscoPage() {
  const siteUrl = getSiteUrl();
  const breadcrumbJsonLd = generateBreadcrumbJsonLd([
    { name: 'Home', url: `${siteUrl}/` },
    { name: 'Fale Conosco', url: `${siteUrl}/fale-conosco/` },
  ]);

  return (
    <>
      <JsonLd id="jsonld-breadcrumb-fale-conosco" data={breadcrumbJsonLd} />
      <FaleConoscoPageClient />
    </>
  );
}

