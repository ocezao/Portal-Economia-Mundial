/**
 * Página Destaque - Next.js App Router (Server)
 * Renderiza no servidor para SEO/performance e permite ISR.
 */

import type { Metadata } from 'next';
import { Star, Award } from 'lucide-react';

import { JsonLd } from '@/components/seo/JsonLd';
import { NewsCard } from '@/components/news/NewsCard';
import { getArticlesByCategory, getFeaturedArticles } from '@/services/newsManager';
import { SEO_CONFIG, generateBreadcrumbJsonLd, generateItemListJsonLd } from '@/config/seo';
import { getSiteUrl } from '@/lib/siteUrl';

export const revalidate = 300;

const withTrailingSlash = (path: string) => (path === '/' || path.endsWith('/') ? path : `${path}/`);
const canonicalUrl = (siteUrl: string, path: string) => `${siteUrl}${withTrailingSlash(path)}`;

export async function generateMetadata(): Promise<Metadata> {
  const siteUrl = getSiteUrl();
  const url = canonicalUrl(siteUrl, '/destaque');

  const title = 'Destaque';
  const description = 'Conteudos selecionados pela equipe editorial: analises, reportagens e destaques do dia.';

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

export default async function DestaquePage() {
  const siteUrl = getSiteUrl();
  const url = canonicalUrl(siteUrl, '/destaque');

  const [featured, editorial] = await Promise.all([
    getFeaturedArticles(6),
    getArticlesByCategory('analises').then((items) => items.slice(0, 8)),
  ]);

  const breadcrumbJsonLd = generateBreadcrumbJsonLd([
    { name: 'Home', url: `${siteUrl}/` },
    { name: 'Destaque', url },
  ]);

  const listJsonLd = generateItemListJsonLd(
    [...featured, ...editorial].slice(0, 20).map((a) => ({
      name: a.title,
      url: `${siteUrl}/noticias/${a.slug}/`,
    })),
  );

  return (
    <>
      <JsonLd id="jsonld-breadcrumb-destaque" data={breadcrumbJsonLd} />
      <JsonLd id="jsonld-itemlist-destaque" data={listJsonLd} />

      <section className="min-h-screen bg-white">
        <header className="border-b border-[#e6e1d8]">
          <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-full bg-[#c40000] flex items-center justify-center">
                <Star className="w-6 h-6 text-white" />
              </div>
              <h1 className="text-3xl sm:text-4xl font-black text-[#111111] font-headline">Destaque</h1>
            </div>
            <p className="text-lg text-[#6b6b6b] max-w-2xl">
              Conteúdos selecionados pela nossa equipe editorial. As análises e reportagens mais relevantes
              para você.
            </p>
          </div>
        </header>

        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {featured.length > 0 && (
            <section className="mb-16">
              <div className="flex items-center gap-2 mb-6">
                <Award className="w-5 h-5 text-[#c40000]" />
                <h2 className="text-xl font-bold text-[#111111]">Destaques do Dia</h2>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {featured.map((article) => (
                  <NewsCard key={article.id} article={article} variant="featured" />
                ))}
              </div>
            </section>
          )}

          {editorial.length > 0 && (
            <section>
              <div className="flex items-center gap-2 mb-6">
                <Star className="w-5 h-5 text-[#c40000]" />
                <h2 className="text-xl font-bold text-[#111111]">Análises Editoriais</h2>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {editorial.map((article) => (
                  <NewsCard key={article.id} article={article} variant="compact" />
                ))}
              </div>
            </section>
          )}

          {featured.length === 0 && editorial.length === 0 && (
            <div className="text-center py-20">
              <Star className="w-16 h-16 text-[#e6e1d8] mx-auto mb-4" />
              <h2 className="text-xl font-medium text-[#111111] mb-2">Nenhum destaque no momento</h2>
              <p className="text-[#6b6b6b]">Volte mais tarde para ver os destaques editoriais.</p>
            </div>
          )}
        </div>
      </section>
    </>
  );
}
