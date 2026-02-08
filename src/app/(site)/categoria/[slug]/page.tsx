/**
 * Página de Categoria Dinâmica - Next.js App Router (Server)
 * Renderiza conteúdo no servidor para SEO (sem fetch no useEffect).
 * @date 2026-02-06
 */

import { cache } from 'react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';

import { JsonLd } from '@/components/seo/JsonLd';
import { NewsCard } from '@/components/news/NewsCard';
import { CONTENT_CONFIG } from '@/config/content';
import { SEO_CONFIG, generateBreadcrumbJsonLd, generateItemListJsonLd } from '@/config/seo';
import { ROUTES } from '@/config/routes';
import { getSiteUrl } from '@/lib/siteUrl';
import { getArticlesPaginated } from '@/services/newsManager';

const withTrailingSlash = (path: string) => (path === '/' || path.endsWith('/') ? path : `${path}/`);
const canonicalUrl = (siteUrl: string, path: string) => `${siteUrl}${withTrailingSlash(path)}`;

interface CategoryPageProps {
  params: Promise<{
    slug: string;
  }>;
  searchParams?: Record<string, string | string[] | undefined>;
}

function parsePage(value: unknown) {
  if (typeof value !== 'string') return 1;
  const n = Number.parseInt(value, 10);
  if (!Number.isFinite(n) || n < 1) return 1;
  return Math.min(n, 1000);
}

const getData = cache(async (categorySlug: string, page: number) => {
  return getArticlesPaginated({ category: categorySlug }, page, 24);
});

function canonicalCategoryUrl(siteUrl: string, categorySlug: string, page: number) {
  const base = canonicalUrl(siteUrl, ROUTES.categoria(categorySlug));
  if (page <= 1) return base;
  const u = new URL(base);
  u.searchParams.set('page', String(page));
  return u.toString();
}

export async function generateMetadata({ params, searchParams }: CategoryPageProps): Promise<Metadata> {
  const { slug } = await params;
  const sp = searchParams ?? {};
  const page = parsePage(Array.isArray(sp?.page) ? sp?.page[0] : sp?.page);

  const category = CONTENT_CONFIG.categories[slug as keyof typeof CONTENT_CONFIG.categories] ?? null;
  if (!category) {
    return {
      title: 'Categoria não encontrada',
      robots: { index: false, follow: false },
    };
  }

  const siteUrl = getSiteUrl();
  const url = canonicalCategoryUrl(siteUrl, category.slug, page);

  return {
    title: category.name,
    description: category.description,
    alternates: { canonical: url },
    openGraph: {
      type: 'website',
      url,
      title: category.name,
      description: category.description,
      siteName: SEO_CONFIG.og.siteName,
      locale: SEO_CONFIG.og.locale,
      images: [
        {
          url: SEO_CONFIG.og.image,
          width: SEO_CONFIG.og.imageWidth,
          height: SEO_CONFIG.og.imageHeight,
          alt: category.name,
        },
      ],
    },
    twitter: {
      card: SEO_CONFIG.og.twitterCard,
      site: SEO_CONFIG.og.twitterSite,
      title: category.name,
      description: category.description,
      images: [SEO_CONFIG.og.image],
    },
  };
}

export default async function CategoryPage({ params, searchParams }: CategoryPageProps) {
  const { slug } = await params;
  const sp = searchParams ?? {};
  const page = parsePage(Array.isArray(sp?.page) ? sp?.page[0] : sp?.page);

  const category = CONTENT_CONFIG.categories[slug as keyof typeof CONTENT_CONFIG.categories] ?? null;
  if (!category) notFound();

  const { items: articles, total, totalPages } = await getData(slug, page);
  const siteUrl = getSiteUrl();

  const breadcrumbJsonLd = generateBreadcrumbJsonLd([
    { name: 'Home', url: `${siteUrl}/` },
    { name: 'Categorias', url: `${siteUrl}/categorias/` },
    { name: category.name, url: `${siteUrl}${ROUTES.categoria(category.slug)}/` },
  ]);

  const listJsonLd = generateItemListJsonLd(
    articles.slice(0, 20).map((a) => ({
      name: a.title,
      url: `${siteUrl}/noticias/${a.slug}/`,
    })),
  );

  return (
    <>
      <JsonLd id="jsonld-breadcrumb-categoria" data={breadcrumbJsonLd} />
      <JsonLd id="jsonld-itemlist-categoria" data={listJsonLd} />

      {/* Hero da Categoria */}
      <header className="py-16 mb-8" style={{ backgroundColor: category.color }}>
        <section className="max-w-[1280px] mx-auto px-4">
          <h1 className="text-4xl md:text-5xl font-black text-white mb-4">{category.name}</h1>
          <p className="text-lg text-white/80 max-w-2xl">{category.description}</p>
          <p className="mt-3 text-sm text-white/80">
            {total > 0 ? (
              <>
                Página <strong className="text-white">{page}</strong> de{' '}
                <strong className="text-white">{Math.max(totalPages, 1)}</strong> ({total} itens)
              </>
            ) : (
              'Sem itens publicados no momento.'
            )}
          </p>
        </section>
      </header>

      {/* Lista de Artigos */}
      <section className="max-w-[1280px] mx-auto px-4 py-8">
        {articles.length > 0 ? (
          <>
            <p className="text-sm text-[#6b6b6b] mb-6">
              {articles.length} {articles.length === 1 ? 'artigo' : 'artigos'} encontrados
            </p>
            <ul className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {articles.map((article) => (
                <li key={article.slug}>
                  <NewsCard article={article} variant="default" />
                </li>
              ))}
            </ul>

            {totalPages > 1 && (
              <nav
                className="mt-10 flex items-center justify-between gap-4"
                aria-label={`Paginação da categoria ${category.name}`}
              >
                <Link
                  aria-disabled={page <= 1}
                  className={[
                    'text-sm px-3 py-2 rounded border transition-colors',
                    page <= 1
                      ? 'pointer-events-none opacity-50 border-[#e5e5e5] text-[#6b6b6b]'
                      : 'border-[#111111] text-[#111111] hover:bg-[#111111] hover:text-white',
                  ].join(' ')}
                  href={page <= 2 ? `${ROUTES.categoria(category.slug)}/` : `${ROUTES.categoria(category.slug)}/?page=${page - 1}`}
                >
                  Anterior
                </Link>

                <span className="text-sm text-[#6b6b6b]">
                  Página <strong className="text-[#111111]">{page}</strong> de{' '}
                  <strong className="text-[#111111]">{totalPages}</strong>
                </span>

                <Link
                  aria-disabled={page >= totalPages}
                  className={[
                    'text-sm px-3 py-2 rounded border transition-colors',
                    page >= totalPages
                      ? 'pointer-events-none opacity-50 border-[#e5e5e5] text-[#6b6b6b]'
                      : 'border-[#111111] text-[#111111] hover:bg-[#111111] hover:text-white',
                  ].join(' ')}
                  href={`${ROUTES.categoria(category.slug)}/?page=${page + 1}`}
                >
                  Próxima
                </Link>
              </nav>
            )}
          </>
        ) : (
          <section className="text-center py-16">
            <p className="text-[#6b6b6b]">Nenhum artigo encontrado nesta categoria.</p>
          </section>
        )}
      </section>
    </>
  );
}
