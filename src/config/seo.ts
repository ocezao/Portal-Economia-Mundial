/**
 * Configuração SEO Global
 * Meta tags, JSON-LD templates, Open Graph
 */

import { APP_CONFIG } from './app';
import { getSiteUrl } from '@/lib/siteUrl';

const siteUrl = getSiteUrl();

export const SEO_CONFIG = {
  default: {
    title: `${APP_CONFIG.brand.name} - ${APP_CONFIG.brand.tagline}`,
    description: 'Portal de notícias especializado em geopolítica, economia global e tecnologia. Análises aprofundadas e cobertura em tempo real dos eventos que moldam o mundo.',
    keywords: ['notícias', 'economia', 'geopolítica', 'tecnologia', 'finanças', 'mercado', 'brasil', 'mundo'],
    author: APP_CONFIG.brand.name,
    robots: 'index, follow',
    language: 'pt-BR',
    locale: 'pt_BR',
  },
  
  og: {
    type: 'website',
    siteName: APP_CONFIG.brand.name,
    locale: 'pt_BR',
    // Keep this pointing to a real, existing asset in `public/`.
    image: '/images/news/brasil-economia.webp',
    imageWidth: 1200,
    imageHeight: 630,
    twitterCard: 'summary_large_image',
    twitterSite: APP_CONFIG.contact.social.twitter,
  },
  
  jsonLd: {
    organization: {
      '@context': 'https://schema.org',
      '@type': 'NewsMediaOrganization',
      name: APP_CONFIG.brand.name,
      alternateName: APP_CONFIG.brand.short,
      url: siteUrl,
      logo: new URL(APP_CONFIG.brand.logo, siteUrl).toString(),
      sameAs: [
        `https://twitter.com/${APP_CONFIG.contact.social.twitter.replace('@', '')}`,
        `https://facebook.com/${APP_CONFIG.contact.social.facebook}`,
        `https://instagram.com/${APP_CONFIG.contact.social.instagram.replace('@', '')}`,
        `https://linkedin.com/company/${APP_CONFIG.contact.social.linkedin}`,
        `https://youtube.com/${APP_CONFIG.contact.social.youtube}`,
      ],
      contactPoint: {
        '@type': 'ContactPoint',
        telephone: APP_CONFIG.contact.phone,
        contactType: 'customer service',
        availableLanguage: ['Portuguese', 'English'],
      },
    },
    
    website: {
      '@context': 'https://schema.org',
      '@type': 'WebSite',
      name: APP_CONFIG.brand.name,
      url: siteUrl,
      potentialAction: {
        '@type': 'SearchAction',
        target: `${siteUrl}/busca/?q={search_term_string}`,
        'query-input': 'required name=search_term_string',
      },
    },
  },
} as const;

export const generateArticleJsonLd = (
  article: {
  title: string;
  slug: string;
  excerpt: string;
  coverImage: string;
  publishedAt: string;
  updatedAt: string;
  author: string;
  authorSlug?: string;
  category: string;
  tags: string[];
  },
  options?: {
    isAccessibleForFree?: boolean;
    paywallSelector?: string;
    reviewedBy?: {
      name: string;
      slug: string;
    };
    speakable?: boolean;
    citation?: Array<{ name: string; url?: string }>;
  }
) => {
  const imageUrl = article.coverImage
    ? new URL(article.coverImage, siteUrl).toString()
    : new URL(SEO_CONFIG.og.image, siteUrl).toString();

  const articleUrl = new URL(`/noticias/${article.slug}/`, siteUrl).toString();

  const jsonLd: Record<string, any> = {
    '@context': 'https://schema.org',
    '@type': 'NewsArticle',
    headline: article.title,
    description: article.excerpt,
    image: imageUrl,
    datePublished: article.publishedAt,
    dateModified: article.updatedAt,
    author: {
      '@type': 'Person',
      name: article.author,
      ...(article.authorSlug && {
        url: `${siteUrl}/autor/${article.authorSlug}/`,
      }),
    },
    publisher: {
      '@type': 'Organization',
      name: APP_CONFIG.brand.name,
      logo: {
        '@type': 'ImageObject',
        url: new URL(APP_CONFIG.brand.logo, siteUrl).toString(),
      },
    },
    articleSection: article.category,
    keywords: article.tags.join(', '),
    url: articleUrl,
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': articleUrl,
    },
  };

  // Paywall / Acesso
  if (typeof options?.isAccessibleForFree === 'boolean') {
    jsonLd.isAccessibleForFree = options.isAccessibleForFree;

    if (options.isAccessibleForFree === false) {
      jsonLd.hasPart = {
        '@type': 'WebPageElement',
        isAccessibleForFree: false,
        cssSelector: options.paywallSelector ?? '.paywall-content',
      };
    }
  }

  // ReviewedBy (E-E-A-T signal)
  if (options?.reviewedBy) {
    jsonLd.reviewedBy = {
      '@type': 'Person',
      name: options.reviewedBy.name,
      url: `${siteUrl}/autor/${options.reviewedBy.slug}/`,
      jobTitle: 'Editor de Fato',
      worksFor: {
        '@type': 'NewsMediaOrganization',
        name: APP_CONFIG.brand.name,
      },
    };
  }

  // Speakable (para Google Assistant)
  if (options?.speakable !== false) {
    jsonLd.speakable = {
      '@type': 'SpeakableSpecification',
      cssSelector: ['.article-headline', '.article-summary'],
    };
  }

  // Citações/Fontes
  if (options?.citation && options.citation.length > 0) {
    jsonLd.citation = options.citation.map(source => ({
      '@type': 'CreativeWork',
      name: source.name,
      ...(source.url && { url: source.url }),
    }));
  }

  return jsonLd;
};

export const generateBreadcrumbJsonLd = (items: { name: string; url: string }[]) => ({
  '@context': 'https://schema.org',
  '@type': 'BreadcrumbList',
  itemListElement: items.map((item, index) => ({
    '@type': 'ListItem',
    position: index + 1,
    name: item.name,
    item: item.url,
  })),
});

export const generateItemListJsonLd = (items: Array<{ name: string; url: string }>) => ({
  '@context': 'https://schema.org',
  '@type': 'ItemList',
  itemListElement: items.map((item, index) => ({
    '@type': 'ListItem',
    position: index + 1,
    name: item.name,
    item: item.url,
  })),
});
