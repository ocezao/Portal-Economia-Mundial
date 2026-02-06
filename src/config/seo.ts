/**
 * Configuração SEO Global
 * Meta tags, JSON-LD templates, Open Graph
 */

import { APP_CONFIG } from './app';

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
    image: '/og-image.webp',
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
      url: APP_CONFIG.urls.base,
      logo: `${APP_CONFIG.urls.base}${APP_CONFIG.brand.logo}`,
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
      url: APP_CONFIG.urls.base,
      potentialAction: {
        '@type': 'SearchAction',
        target: `${APP_CONFIG.urls.base}/busca?q={search_term_string}`,
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
  category: string;
  tags: string[];
  },
  options?: {
    isAccessibleForFree?: boolean;
    paywallSelector?: string;
  }
) => {
  const jsonLd: Record<string, any> = {
    '@context': 'https://schema.org',
    '@type': 'NewsArticle',
    headline: article.title,
    description: article.excerpt,
    image: `${APP_CONFIG.urls.base}${article.coverImage}`,
    datePublished: article.publishedAt,
    dateModified: article.updatedAt,
    author: {
      '@type': 'Person',
      name: article.author,
    },
    publisher: {
      '@type': 'Organization',
      name: APP_CONFIG.brand.name,
      logo: {
        '@type': 'ImageObject',
        url: `${APP_CONFIG.urls.base}${APP_CONFIG.brand.logo}`,
      },
    },
    articleSection: article.category,
    keywords: article.tags.join(', '),
    url: `${APP_CONFIG.urls.base}/noticias/${article.slug}`,
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': `${APP_CONFIG.urls.base}/noticias/${article.slug}`,
    },
  };

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
