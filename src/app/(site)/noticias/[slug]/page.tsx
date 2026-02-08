/**
 * Página de Artigo Individual (Server)
 * Carrega o artigo no servidor para melhorar SEO (title/description/OG + JSON-LD).
 * @date 2026-02-06
 */

import { cache } from 'react';
import type { Metadata } from 'next';
import { notFound, redirect } from 'next/navigation';

import { JsonLd } from '@/components/seo/JsonLd';
import { CONTENT_CONFIG } from '@/config/content';
import { SEO_CONFIG, generateArticleJsonLd, generateBreadcrumbJsonLd } from '@/config/seo';
import { ROUTES } from '@/config/routes';
import { getSiteUrl } from '@/lib/siteUrl';
import { getActiveAuthors, getPrimaryFactChecker } from '@/services/authors';
import { getArticleBySlug, getRedirectTargetSlug } from '@/services/newsManager';

import NoticiaPageClient from './NoticiaPageClient';

export const revalidate = 60; // 1 min

const withTrailingSlash = (path: string) => (path === '/' || path.endsWith('/') ? path : `${path}/`);

const canonicalUrl = (siteUrl: string, path: string) => `${siteUrl}${withTrailingSlash(path)}`;

const getArticle = cache(async (slug: string) => getArticleBySlug(slug));

export async function generateMetadata(
  { params }: { params: Promise<{ slug: string }> },
): Promise<Metadata> {
  const { slug } = await params;
  const article = await getArticle(slug);

  if (!article) {
    return {
      title: 'Artigo não encontrado',
      robots: { index: false, follow: false },
    };
  }

  const siteUrl = getSiteUrl();
  const url = canonicalUrl(siteUrl, ROUTES.noticia(article.slug));

  const imageUrl = article.coverImage.startsWith('http')
    ? article.coverImage
    : `${siteUrl}${article.coverImage}`;

  return {
    title: article.title,
    description: article.excerpt,
    alternates: { canonical: url },
    openGraph: {
      type: 'article',
      url,
      title: article.title,
      description: article.excerpt,
      siteName: SEO_CONFIG.og.siteName,
      locale: SEO_CONFIG.og.locale,
      images: [
        {
          url: imageUrl,
          width: SEO_CONFIG.og.imageWidth,
          height: SEO_CONFIG.og.imageHeight,
          alt: article.title,
        },
      ],
    },
    twitter: {
      card: SEO_CONFIG.og.twitterCard,
      site: SEO_CONFIG.og.twitterSite,
      title: article.title,
      description: article.excerpt,
      images: [imageUrl],
    },
  };
}

export default async function NoticiaPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const article = await getArticle(slug);
  if (!article) {
    const toSlug = await getRedirectTargetSlug(slug);
    if (toSlug) redirect(`/noticias/${toSlug}/`);
    notFound();
  }

  const siteUrl = getSiteUrl();
  const categoryName =
    CONTENT_CONFIG.categories[article.category as keyof typeof CONTENT_CONFIG.categories]?.name ??
    article.category;

  const articleUrl = canonicalUrl(siteUrl, ROUTES.noticia(article.slug));

  const breadcrumbJsonLd = generateBreadcrumbJsonLd([
    { name: 'Home', url: canonicalUrl(siteUrl, ROUTES.home) },
    { name: categoryName, url: canonicalUrl(siteUrl, ROUTES.categoria(article.category)) },
    { name: article.title, url: articleUrl },
  ]);

  const authors = await getActiveAuthors();

  // Buscar autor do artigo para o schema
  const authorSlug =
    (article.authorId && authors.find((a) => a.slug === article.authorId)?.slug) ??
    authors.find((a) => a.name === article.author || article.author.includes(a.name))?.slug;

  // Buscar fact-checker para reviewedBy
  const reviewedBy = await getPrimaryFactChecker();

  const articleJsonLd = generateArticleJsonLd(
    {
      title: article.title,
      slug: article.slug,
      excerpt: article.excerpt,
      coverImage: article.coverImage,
      publishedAt: article.publishedAt,
      updatedAt: article.updatedAt,
      author: article.author,
      authorSlug,
      category: categoryName,
      tags: article.tags,
    },
    {
      isAccessibleForFree: false,
      paywallSelector: '.paywall-content',
      reviewedBy: reviewedBy ?? undefined,
      speakable: true,
      citation: [
        { name: 'Fontes oficiais de mercado' },
        { name: 'Dados de agências reguladoras' },
      ],
    },
  );

  return (
    <>
      <JsonLd id="jsonld-breadcrumb" data={breadcrumbJsonLd} />
      <JsonLd id="jsonld-article" data={articleJsonLd} />
      <NoticiaPageClient article={article} reviewedBy={reviewedBy} />
    </>
  );
}
