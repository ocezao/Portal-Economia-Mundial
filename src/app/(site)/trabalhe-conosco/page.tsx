import type { Metadata } from 'next';

import { JsonLd } from '@/components/seo/JsonLd';
import { APP_CONFIG } from '@/config/app';
import { SEO_CONFIG, generateBreadcrumbJsonLd } from '@/config/seo';
import { getSiteUrl } from '@/lib/siteUrl';

import TrabalheConoscoPageClient from './TrabalheConoscoPageClient';

export const revalidate = 3600;

export async function generateMetadata(): Promise<Metadata> {
  const siteUrl = getSiteUrl();
  const url = `${siteUrl}/trabalhe-conosco/`;

  const title = `Trabalhe Conosco | ${APP_CONFIG.brand.name}`;
  const description = 'Candidaturas abertas: conte sobre voce e envie links publicos para portfolio/curriculo.';

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
          alt: 'Trabalhe Conosco',
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

export default function TrabalheConoscoPage() {
  const siteUrl = getSiteUrl();
  const breadcrumbJsonLd = generateBreadcrumbJsonLd([
    { name: 'Home', url: `${siteUrl}/` },
    { name: 'Trabalhe Conosco', url: `${siteUrl}/trabalhe-conosco/` },
  ]);

  return (
    <>
      <JsonLd id="jsonld-breadcrumb-trabalhe" data={breadcrumbJsonLd} />
      <TrabalheConoscoPageClient />
    </>
  );
}

