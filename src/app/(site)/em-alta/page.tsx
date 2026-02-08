/**
 * Página Em Alta - Server Component
 * Renderiza no servidor para SEO/performance (sem fetch em useEffect).
 */

import type { Metadata } from 'next';
import Link from 'next/link';
import { Flame, TrendingUp, Eye } from 'lucide-react';

import { JsonLd } from '@/components/seo/JsonLd';
import { NewsCard } from '@/components/news/NewsCard';
import { SEO_CONFIG, generateBreadcrumbJsonLd, generateItemListJsonLd } from '@/config/seo';
import { getSiteUrl } from '@/lib/siteUrl';
import { getTrendingArticles } from '@/services/newsManager';

export const revalidate = 60; // 1 min

const withTrailingSlash = (path: string) => (path === '/' || path.endsWith('/') ? path : `${path}/`);
const canonicalUrl = (siteUrl: string, path: string) => `${siteUrl}${withTrailingSlash(path)}`;

export async function generateMetadata(): Promise<Metadata> {
  const siteUrl = getSiteUrl();
  const url = canonicalUrl(siteUrl, '/em-alta');

  const title = 'Em Alta';
  const description =
    'As noticias mais lidas e comentadas do momento. Acompanhe o que esta movendo o mundo da economia e geopolítica.';

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

export default async function EmAltaPage() {
  const siteUrl = getSiteUrl();
  const trending = await getTrendingArticles(20);

  const breadcrumbJsonLd = generateBreadcrumbJsonLd([
    { name: 'Home', url: `${siteUrl}/` },
    { name: 'Em alta', url: canonicalUrl(siteUrl, '/em-alta') },
  ]);

  const listJsonLd = generateItemListJsonLd(
    trending.slice(0, 20).map((a) => ({ name: a.title, url: `${siteUrl}/noticias/${a.slug}/` })),
  );

  return (
    <>
      <JsonLd id="jsonld-breadcrumb-em-alta" data={breadcrumbJsonLd} />
      <JsonLd id="jsonld-itemlist-em-alta" data={listJsonLd} />

      <section className="min-h-screen bg-white">
        <header className="border-b border-[#e6e1d8]">
          <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-full bg-[#c40000] flex items-center justify-center">
                <Flame className="w-6 h-6 text-white" />
              </div>
              <h1 className="text-3xl sm:text-4xl font-black text-[#111111] font-headline">Em Alta</h1>
            </div>
            <p className="text-lg text-[#6b6b6b] max-w-2xl">
              As noticias mais lidas e comentadas do momento.
            </p>
          </div>
        </header>

        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {trending.length === 0 ? (
            <div className="text-center py-20">
              <TrendingUp className="w-16 h-16 text-[#e6e1d8] mx-auto mb-4" />
              <h2 className="text-xl font-medium text-[#111111] mb-2">Nenhuma noticia em alta</h2>
              <p className="text-[#6b6b6b]">Volte mais tarde para ver as tendencias.</p>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {trending.map((article, index) => (
                  <div key={article.id} className="relative">
                    <NewsCard article={article} variant={index < 4 ? 'featured' : 'compact'} />
                    <div className="absolute top-2 right-2 flex items-center gap-1 px-2 py-1 bg-black/70 text-white text-xs rounded-full">
                      <Eye className="w-3 h-3" />
                      {article.views.toLocaleString('pt-BR')}
                    </div>
                  </div>
                ))}
              </div>

              <footer className="mt-10 text-sm text-[#6b6b6b]">
                <p>
                  Veja todas as noticias em{' '}
                  <Link className="underline hover:text-[#c40000]" href="/noticias/">
                    Noticias
                  </Link>
                  .
                </p>
              </footer>
            </>
          )}
        </div>
      </section>
    </>
  );
}

