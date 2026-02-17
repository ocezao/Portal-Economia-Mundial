/**
 * Mercados Globais - Server Component
 * Usa snapshots para evitar custo por pageview e reduzir JS no cliente.
 */

import type { Metadata } from 'next';
import Link from 'next/link';
import { Activity, Globe, Package, Newspaper, Clock } from 'lucide-react';

import { JsonLd } from '@/components/seo/JsonLd';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { SEO_CONFIG, generateBreadcrumbJsonLd } from '@/config/seo';
import { getSiteUrl } from '@/lib/siteUrl';
import {
  getCommoditiesSnapshot,
  getGlobalIndicesSnapshot,
  getMarketNewsSnapshot,
  getSectorsSnapshot,
} from '@/services/economics/snapshots';

export const revalidate = 300; // 5 min

const withTrailingSlash = (path: string) => (path === '/' || path.endsWith('/') ? path : `${path}/`);
const canonicalUrl = (siteUrl: string, path: string) => `${siteUrl}${withTrailingSlash(path)}`;

export async function generateMetadata(): Promise<Metadata> {
  const siteUrl = getSiteUrl();
  const url = canonicalUrl(siteUrl, '/mercados');

  const title = 'Mercados Globais';
  const description = 'Indices, commodities, setores e manchetes de mercado, com atualizacao periodica.';

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

function fmtNum(value: number) {
  const v = Number.isFinite(value) ? value : 0;
  return v.toLocaleString('pt-BR', { maximumFractionDigits: 2 });
}

export default async function MercadosPage() {
  const siteUrl = getSiteUrl();
  const url = canonicalUrl(siteUrl, '/mercados');

  const [indices, commodities, news, sectors] = await Promise.all([
    getGlobalIndicesSnapshot(),
    getCommoditiesSnapshot(),
    getMarketNewsSnapshot('general'),
    getSectorsSnapshot(),
  ]);

  const americas = indices.filter((i) => ['EUA', 'Brasil', 'México'].includes(i.region ?? ''));
  const europe = indices.filter((i) => ['Reino Unido', 'Alemanha', 'França', 'Itália'].includes(i.region ?? ''));
  const asia = indices.filter((i) => ['Japão', 'Hong Kong', 'China', 'Austrália'].includes(i.region ?? ''));

  const breadcrumbJsonLd = generateBreadcrumbJsonLd([
    { name: 'Home', url: `${siteUrl}/` },
    { name: 'Mercados', url },
  ]);

  return (
    <>
      <JsonLd id="jsonld-breadcrumb-mercados" data={breadcrumbJsonLd} />

      <main className="min-h-screen bg-[#fafafa]">
        <section className="bg-[#111111] text-white py-12">
          <div className="max-w-7xl mx-auto px-4 sm:px-6">
            <header className="flex items-center justify-between flex-wrap gap-4">
              <div>
                <h1 className="text-3xl md:text-4xl font-bold mb-2">Mercados Globais</h1>
                <p className="text-[#9b9b9b] text-lg">
                  Indices, commodities, setores e manchetes de mercado.
                </p>
              </div>
              <div className="flex items-center gap-2 text-sm text-[#9b9b9b]">
                <Clock className="w-4 h-4" />
                <span>Atualiza a cada poucos minutos (cache).</span>
              </div>
            </header>
          </div>
        </section>

        <section className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
          {indices.length > 0 && (
            <section className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8" aria-label="Resumo por regiao">
              <Card>
                <CardHeader className="pb-2">
                  <div className="flex items-center gap-2">
                    <Globe className="w-5 h-5 text-[#c40000]" />
                    <span className="text-sm font-medium text-[#6b6b6b]">Américas</span>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {americas.slice(0, 3).map((idx) => (
                      <div key={idx.symbol} className="flex justify-between items-center">
                        <span className="text-sm text-[#111111]">{idx.name}</span>
                        <span className={idx.quote.dp >= 0 ? 'text-[#22c55e]' : 'text-[#ef4444]'}>
                          {fmtPct(idx.quote.dp)}
                        </span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <div className="flex items-center gap-2">
                    <Globe className="w-5 h-5 text-[#c40000]" />
                    <span className="text-sm font-medium text-[#6b6b6b]">Europa</span>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {europe.slice(0, 3).map((idx) => (
                      <div key={idx.symbol} className="flex justify-between items-center">
                        <span className="text-sm text-[#111111]">{idx.name}</span>
                        <span className={idx.quote.dp >= 0 ? 'text-[#22c55e]' : 'text-[#ef4444]'}>
                          {fmtPct(idx.quote.dp)}
                        </span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <div className="flex items-center gap-2">
                    <Globe className="w-5 h-5 text-[#c40000]" />
                    <span className="text-sm font-medium text-[#6b6b6b]">Asia-Pacífico</span>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {asia.slice(0, 3).map((idx) => (
                      <div key={idx.symbol} className="flex justify-between items-center">
                        <span className="text-sm text-[#111111]">{idx.name}</span>
                        <span className={idx.quote.dp >= 0 ? 'text-[#22c55e]' : 'text-[#ef4444]'}>
                          {fmtPct(idx.quote.dp)}
                        </span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </section>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-8">
              <section aria-label="Setores">
                <h2 className="text-xl font-bold text-[#111111] mb-4 flex items-center gap-2">
                  <Activity className="w-5 h-5 text-[#c40000]" />
                  Performance por Setor
                </h2>
                {sectors.length === 0 ? (
                  <p className="text-sm text-[#6b6b6b]">Sem dados de setores no momento.</p>
                ) : (
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {sectors.map((s) => (
                      <Card key={s.key}>
                        <CardContent className="p-3">
                          <p className="text-sm text-[#6b6b6b]">{s.name}</p>
                          <p className={s.quote.dp >= 0 ? 'text-[#22c55e] font-bold' : 'text-[#ef4444] font-bold'}>
                            {fmtPct(s.quote.dp)}
                          </p>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </section>

              <section aria-label="Indices globais">
                <h2 className="text-xl font-bold text-[#111111] mb-4 flex items-center gap-2">
                  <Globe className="w-5 h-5 text-[#c40000]" />
                  Indices em Destaque
                </h2>
                {indices.length === 0 ? (
                  <p className="text-sm text-[#6b6b6b]">Sem dados de indices no momento.</p>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {indices.slice(0, 8).map((idx) => (
                      <Card key={idx.symbol}>
                        <CardContent className="p-4">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="text-sm text-[#6b6b6b]">{idx.region ?? '-'}</p>
                              <p className="font-bold text-[#111111]">{idx.name}</p>
                            </div>
                            <div className="text-right">
                              <p className="text-lg font-bold text-[#111111]">{fmtNum(idx.quote.c)}</p>
                              <p className={idx.quote.dp >= 0 ? 'text-sm text-[#22c55e]' : 'text-sm text-[#ef4444]'}>
                                {fmtPct(idx.quote.dp)}
                              </p>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </section>
            </div>

            <aside className="space-y-6">
              <Card>
                <CardHeader>
                  <h3 className="text-lg font-bold text-[#111111] flex items-center gap-2">
                    <Newspaper className="w-5 h-5 text-[#c40000]" />
                    Noticias em Tempo Real
                  </h3>
                </CardHeader>
                <CardContent>
                  {news.length === 0 ? (
                    <p className="text-sm text-[#6b6b6b]">Sem noticias no momento.</p>
                  ) : (
                    <div className="space-y-4">
                      {news.slice(0, 8).map((item) => (
                        <article key={item.id} className="border-b border-[#e5e5e5] last:border-0 pb-3 last:pb-0">
                          <a
                            href={item.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="group"
                          >
                            <h4 className="text-sm font-medium text-[#111111] group-hover:text-[#c40000] line-clamp-2">
                              {item.headline}
                            </h4>
                            <div className="flex items-center gap-2 mt-1">
                              <Badge variant="secondary" className="text-xs">
                                {item.source}
                              </Badge>
                            </div>
                          </a>
                        </article>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <h3 className="text-lg font-bold text-[#111111] flex items-center gap-2">
                    <Package className="w-5 h-5 text-[#c40000]" />
                    Commodities
                  </h3>
                </CardHeader>
                <CardContent>
                  {commodities.length === 0 ? (
                    <p className="text-sm text-[#6b6b6b]">Sem dados de commodities no momento.</p>
                  ) : (
                    <div className="space-y-3">
                      {commodities.slice(0, 6).map((c) => (
                        <div key={c.symbol} className="flex justify-between items-center">
                          <div>
                            <p className="text-sm font-medium text-[#111111]">{c.name}</p>
                            <p className="text-xs text-[#6b6b6b]">{c.unit ?? 'USD'}</p>
                          </div>
                          <div className="text-right">
                            <p className="text-sm font-medium">{fmtNum(c.quote.c)}</p>
                            <p className={c.quote.dp >= 0 ? 'text-xs text-[#22c55e]' : 'text-xs text-[#ef4444]'}>
                              {fmtPct(c.quote.dp)}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              <p className="text-xs text-[#6b6b6b]">
                Dados via Finnhub e proxies (ETFs) quando necessario. Este painel usa cache para reduzir custo por visita.
              </p>

              <p className="text-xs text-[#6b6b6b]">
                Preferir leituras por tema? Veja <Link className="underline hover:text-[#c40000]" href="/categorias/">categorias</Link>.
              </p>
            </aside>
          </div>
        </section>
      </main>
    </>
  );
}

