/**
 * Dados Economicos - Server Component
 * Painel leve (SEO-friendly) com dados via snapshots.
 */

import type { Metadata } from 'next';
import Link from 'next/link';
import { TrendingUp, Globe, Package, BarChart3 } from 'lucide-react';

import { JsonLd } from '@/components/seo/JsonLd';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { SEO_CONFIG, generateBreadcrumbJsonLd } from '@/config/seo';
import { getSiteUrl } from '@/lib/siteUrl';
import { getCommoditiesSnapshot, getGlobalIndicesSnapshot, getSectorsSnapshot } from '@/services/economics/snapshots';

export const revalidate = 300; // 5 min

const withTrailingSlash = (path: string) => (path === '/' || path.endsWith('/') ? path : `${path}/`);
const canonicalUrl = (siteUrl: string, path: string) => `${siteUrl}${withTrailingSlash(path)}`;

export async function generateMetadata(): Promise<Metadata> {
  const siteUrl = getSiteUrl();
  const url = canonicalUrl(siteUrl, '/dados-economicos');

  const title = 'Dados Economicos Globais';
  const description = 'Indicadores de mercado, commodities e setores com atualizacao periodica (cache).';

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

function fmtPct(value: number) {
  const v = Number.isFinite(value) ? value : 0;
  return `${v >= 0 ? '+' : ''}${v.toFixed(2)}%`;
}

export default async function DadosEconomicosPage() {
  const siteUrl = getSiteUrl();
  const url = canonicalUrl(siteUrl, '/dados-economicos');

  const [indices, commodities, sectors] = await Promise.all([
    getGlobalIndicesSnapshot(),
    getCommoditiesSnapshot(),
    getSectorsSnapshot(),
  ]);

  const sorted = [...indices].sort((a, b) => (b.quote.dp ?? 0) - (a.quote.dp ?? 0));
  const topGainers = sorted.slice(0, 4);
  const topLosers = [...sorted].reverse().slice(0, 4);

  const breadcrumbJsonLd = generateBreadcrumbJsonLd([
    { name: 'Home', url: `${siteUrl}/` },
    { name: 'Dados economicos', url },
  ]);

  return (
    <>
      <JsonLd id="jsonld-breadcrumb-dados" data={breadcrumbJsonLd} />

      <main className="min-h-screen bg-[#fafafa]">
        <section className="bg-[#111111] text-white py-12">
          <div className="max-w-7xl mx-auto px-4 sm:px-6">
            <header>
              <h1 className="text-3xl md:text-4xl font-bold mb-2">Dados Economicos Globais</h1>
              <p className="text-[#9b9b9b] text-lg max-w-2xl">
                Indicadores de mercado, commodities e setores, com atualizacao periodica (cache).
              </p>
            </header>
          </div>
        </section>

        <section className="max-w-7xl mx-auto px-4 sm:px-6 py-8 space-y-8">
          <section aria-label="Resumo" className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-[#6b6b6b] flex items-center gap-2">
                  <Globe className="w-4 h-4 text-[#c40000]" />
                  Indices
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold text-[#111111]">{indices.length}</p>
                <p className="text-sm text-[#6b6b6b]">ativos monitorados</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-[#6b6b6b] flex items-center gap-2">
                  <Package className="w-4 h-4 text-[#c40000]" />
                  Commodities
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold text-[#111111]">{commodities.length}</p>
                <p className="text-sm text-[#6b6b6b]">itens em destaque</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-[#6b6b6b] flex items-center gap-2">
                  <BarChart3 className="w-4 h-4 text-[#c40000]" />
                  Setores
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold text-[#111111]">{sectors.length}</p>
                <p className="text-sm text-[#6b6b6b]">ETFs proxy</p>
              </CardContent>
            </Card>
          </section>

          <section className="grid grid-cols-1 lg:grid-cols-2 gap-6" aria-label="Altas e baixas">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-[#22c55e]">
                  <TrendingUp className="w-5 h-5" />
                  Maiores Altas
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {topGainers.length === 0 ? (
                  <p className="text-sm text-[#6b6b6b]">Sem dados.</p>
                ) : (
                  topGainers.map((idx) => (
                    <div
                      key={idx.symbol}
                      className="flex items-center justify-between p-3 bg-[#f0fdf4] rounded"
                    >
                      <div>
                        <p className="font-medium text-[#111111]">{idx.name}</p>
                        <p className="text-xs text-[#6b6b6b]">{idx.region ?? '-'}</p>
                      </div>
                      <p className="text-[#22c55e] font-bold">{fmtPct(idx.quote.dp)}</p>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-[#ef4444]">
                  <TrendingUp className="w-5 h-5 rotate-180" />
                  Maiores Baixas
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {topLosers.length === 0 ? (
                  <p className="text-sm text-[#6b6b6b]">Sem dados.</p>
                ) : (
                  topLosers.map((idx) => (
                    <div
                      key={idx.symbol}
                      className="flex items-center justify-between p-3 bg-[#fef2f2] rounded"
                    >
                      <div>
                        <p className="font-medium text-[#111111]">{idx.name}</p>
                        <p className="text-xs text-[#6b6b6b]">{idx.region ?? '-'}</p>
                      </div>
                      <p className="text-[#ef4444] font-bold">{fmtPct(idx.quote.dp)}</p>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>
          </section>

          <section aria-label="Links">
            <p className="text-sm text-[#6b6b6b]">
              Para painel completo com noticias e cards por regiao, veja{' '}
              <Link className="underline hover:text-[#c40000]" href="/mercados/">
                Mercados
              </Link>
              .
            </p>
          </section>
        </section>
      </main>
    </>
  );
}

