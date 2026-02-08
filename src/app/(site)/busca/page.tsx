/**
 * Página de Busca
 * Server Component - Next.js App Router
 *
 * Observação SEO: páginas de resultados internos geralmente devem ser `noindex`.
 */

import type { Metadata } from 'next';
import Link from 'next/link';

import { NewsCard } from '@/components/news/NewsCard';
import { APP_CONFIG } from '@/config/app';
import { SEO_CONFIG } from '@/config/seo';
import { ROUTES } from '@/config/routes';
import { getSiteUrl } from '@/lib/siteUrl';
import { searchArticles } from '@/services/newsManager';

type SearchParams = Record<string, string | string[] | undefined>;

function getQuery(searchParams?: SearchParams) {
  const q = searchParams?.q;
  if (Array.isArray(q)) return (q[0] ?? '').trim();
  if (typeof q === 'string') return q.trim();
  return '';
}

export async function generateMetadata(
  { searchParams }: { searchParams?: SearchParams },
): Promise<Metadata> {
  const query = getQuery(searchParams);

  const siteUrl = getSiteUrl();
  const url = `${siteUrl}${ROUTES.busca}/`;

  const title = query ? `Busca: ${query}` : 'Busca';
  /*
  const _description = query
    ? `Resultados para "${query}" no ${APP_CONFIG.brand.name}.`
    : `Busque notícias no ${APP_CONFIG.brand.name}.`;

  */

  // For meta tags, avoid leaking escape sequences in the rendered HTML.
  /*
  const seoDescription = query
    ? `Resultados para "${query}" no ${APP_CONFIG.brand.name}.`
    : `Busque notícias no ${APP_CONFIG.brand.name}.`;

  */

  const seoDescriptionClean = query
    ? `Resultados para: ${query} no ${APP_CONFIG.brand.name}.`
    : `Busque notícias no ${APP_CONFIG.brand.name}.`;

  return {
    title,
    /*
    description: query
      ? `Resultados para "${query}" no ${APP_CONFIG.brand.name}.`
      : `Busque notícias no ${APP_CONFIG.brand.name}.`,
    */
    // Canonical/OG/Twitter for share previews (even though this page is noindex).
    // Also override the description to avoid rendering escape sequences.
    description: seoDescriptionClean,
    alternates: { canonical: url },
    openGraph: {
      type: 'website',
      url,
      title,
      description: seoDescriptionClean,
      siteName: SEO_CONFIG.og.siteName,
      locale: SEO_CONFIG.og.locale,
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
      title,
      description: seoDescriptionClean,
      images: [SEO_CONFIG.og.image],
    },
    robots: {
      index: false,
      follow: true,
    },
  };
}

export default async function BuscaPage({ searchParams }: { searchParams?: SearchParams }) {
  const query = getQuery(searchParams);

  let results = [] as Awaited<ReturnType<typeof searchArticles>>;
  if (query) {
    try {
      results = await searchArticles(query);
    } catch {
      results = [];
    }
  }

  return (
    <>
      <header className="bg-[#111111] text-white py-12">
        <section className="max-w-[1280px] mx-auto px-4">
          <nav className="text-sm text-white/70 mb-3" aria-label="Breadcrumb">
            <Link href={ROUTES.home} className="hover:underline">Home</Link>
            <span className="mx-2" aria-hidden="true">/</span>
            <span aria-current="page">Busca</span>
          </nav>

          <h1 className="text-2xl sm:text-3xl md:text-4xl font-black">
            {query ? (
              <>Resultados para: <span className="text-[#cbd5f5]">{query}</span></>
            ) : (
              'Buscar'
            )}
          </h1>
          <p className="mt-2 text-sm text-white/70">
            {query
              ? `${results.length} resultado(s) encontrado(s).`
              : 'Digite um termo no campo de busca (no topo do site).'}
          </p>
        </section>
      </header>

      <main className="max-w-[1280px] mx-auto px-4 py-10">
        {!query && (
          <section className="p-6 border rounded-xl bg-white">
            <h2 className="text-lg font-bold text-[#111111] mb-2">Dica</h2>
            <p className="text-sm text-[#6b6b6b]">
              Abra a busca no header e pesquise por tema, país, empresa ou palavra-chave.
            </p>
          </section>
        )}

        {query && results.length === 0 && (
          <section className="p-6 border rounded-xl bg-white">
            <h2 className="text-lg font-bold text-[#111111] mb-2">Sem resultados</h2>
            <p className="text-sm text-[#6b6b6b]">
              Tente termos diferentes ou mais curtos.
            </p>
          </section>
        )}

        {results.length > 0 && (
          <section aria-label="Resultados da busca">
            <ul className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {results.map((article) => (
                <li key={article.slug}>
                  <NewsCard article={article} />
                </li>
              ))}
            </ul>
          </section>
        )}
      </main>
    </>
  );
}
