/**
 * Página de listagem de notícias (Server)
 * Útil para SEO e navegação: /noticias/
 * @date 2026-02-06
 */

import { cache } from 'react';
import type { Metadata } from 'next';
import Link from 'next/link';

import { JsonLd } from '@/components/seo/JsonLd';
import { NewsCard } from '@/components/news/NewsCard';
import { SEO_CONFIG, generateBreadcrumbJsonLd, generateItemListJsonLd } from '@/config/seo';
import { getSiteUrl } from '@/lib/siteUrl';
import { getArticlesPaginated } from '@/services/newsManager';

export const revalidate = 60; // 1 min

const withTrailingSlash = (path: string) => (path === '/' || path.endsWith('/') ? path : `${path}/`);
const canonicalUrl = (siteUrl: string, path: string) => `${siteUrl}${withTrailingSlash(path)}`;

function parsePage(value: unknown) {
  if (typeof value !== 'string') return 1;
  const n = Number.parseInt(value, 10);
  if (!Number.isFinite(n) || n < 1) return 1;
  return Math.min(n, 1000);
}

const getData = cache(async (page: number) => {
  return getArticlesPaginated({}, page, 24);
});

function canonicalNoticiasUrl(siteUrl: string, page: number) {
  const base = canonicalUrl(siteUrl, '/noticias');
  if (page <= 1) return base;
  const u = new URL(base);
  u.searchParams.set('page', String(page));
  return u.toString();
}

export async function generateMetadata({
  searchParams,
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}): Promise<Metadata> {
  const siteUrl = getSiteUrl();
  const params = await searchParams;
  const page = parsePage(Array.isArray(params?.page) ? params?.page[0] : params?.page);
  const url = canonicalNoticiasUrl(siteUrl, page);

  const title = 'Notícias';
  const description =
    'Últimas notícias de geopolítica, economia e tecnologia. Atualizações diárias e análises aprofundadas.';

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
  };
}

export default async function NoticiasPage({
  searchParams,
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const page = parsePage(Array.isArray(params?.page) ? params?.page[0] : params?.page);
  const { items, total, totalPages } = await getData(page);
  const siteUrl = getSiteUrl();

  const breadcrumbJsonLd = generateBreadcrumbJsonLd([
    { name: 'Home', url: `${siteUrl}/` },
    { name: 'Noticias', url: canonicalUrl(siteUrl, '/noticias') },
  ]);

  const listJsonLd = generateItemListJsonLd(
    items.slice(0, 20).map((a) => ({
      name: a.title,
      url: `${siteUrl}/noticias/${a.slug}/`,
    })),
  );

  return (
    <>
      <JsonLd id="jsonld-breadcrumb-noticias" data={breadcrumbJsonLd} />
      <JsonLd id="jsonld-itemlist-noticias" data={listJsonLd} />

      <section className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <header className="mb-8">
        <h1 className="text-3xl sm:text-4xl font-black text-[#111111] font-headline">Notícias</h1>
        <p className="mt-2 text-[#6b6b6b] max-w-2xl">
          Últimas publicações e atualizações.
        </p>
        <p className="mt-2 text-sm text-[#6b6b6b]">
          {total > 0 ? (
            <>
              Página <strong className="text-[#111111]">{page}</strong> de{' '}
              <strong className="text-[#111111]">{Math.max(totalPages, 1)}</strong> ({total} itens)
            </>
          ) : (
            'Sem itens publicados no momento.'
          )}
        </p>
        </header>

      {items.length > 0 ? (
        <ul className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {items.map((article) => (
            <li key={article.slug}>
              <NewsCard article={article} variant="default" />
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-[#6b6b6b]">Nenhuma notícia publicada no momento.</p>
      )}

      {totalPages > 1 && (
        <nav className="mt-10 flex items-center justify-between gap-4" aria-label="Paginação de notícias">
          <Link
            aria-disabled={page <= 1}
            className={[
              'text-sm px-3 py-2 rounded border transition-colors',
              page <= 1
                ? 'pointer-events-none opacity-50 border-[#e5e5e5] text-[#6b6b6b]'
                : 'border-[#111111] text-[#111111] hover:bg-[#111111] hover:text-white',
            ].join(' ')}
            href={page <= 2 ? '/noticias/' : `/noticias/?page=${page - 1}`}
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
            href={`/noticias/?page=${page + 1}`}
          >
            Próxima
          </Link>
        </nav>
      )}

      <footer className="mt-10 text-sm text-[#6b6b6b]">
        <p>
          Explore por tema em{' '}
          <Link className="underline hover:text-[#c40000]" href="/categorias/">
            Todas as Categorias
          </Link>
          .
        </p>
      </footer>
      </section>
    </>
  );
}
