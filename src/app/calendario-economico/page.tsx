/**
 * Calendario Economico - Server Component
 * Renderiza eventos via snapshots (quando disponivel).
 */

import type { Metadata } from 'next';
import Link from 'next/link';
import { Calendar, AlertTriangle, Clock, TrendingUp } from 'lucide-react';

import { JsonLd } from '@/components/seo/JsonLd';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { SEO_CONFIG, generateBreadcrumbJsonLd } from '@/config/seo';
import { getSiteUrl } from '@/lib/siteUrl';
import { getEconomicCalendarNext7DaysSnapshot, getMarketNewsSnapshot } from '@/services/economics/snapshots';

export const revalidate = 3600; // 1 hour (economic calendar is slower-moving)

const withTrailingSlash = (path: string) => (path === '/' || path.endsWith('/') ? path : `${path}/`);
const canonicalUrl = (siteUrl: string, path: string) => `${siteUrl}${withTrailingSlash(path)}`;

export async function generateMetadata(): Promise<Metadata> {
  const siteUrl = getSiteUrl();
  const url = canonicalUrl(siteUrl, '/calendario-economico');

  const title = 'Calendario Economico';
  const description = 'Agenda de eventos e indicadores que movem os mercados globais.';

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

function impactLabel(impact: string) {
  const v = impact?.toLowerCase?.() ?? '';
  if (v === 'high') return 'Alto';
  if (v === 'medium') return 'Medio';
  if (v === 'low') return 'Baixo';
  return impact || 'N/D';
}

function impactClass(impact: string) {
  const v = impact?.toLowerCase?.() ?? '';
  if (v === 'high') return 'bg-[#fef2f2] text-[#c40000] border-[#fecaca]';
  if (v === 'medium') return 'bg-[#fef3c7] text-[#b45309] border-[#fde68a]';
  return 'bg-[#f5f5f5] text-[#6b6b6b] border-[#e5e5e5]';
}

export default async function CalendarioEconomicoPage() {
  const siteUrl = getSiteUrl();
  const url = canonicalUrl(siteUrl, '/calendario-economico');

  const [events, news] = await Promise.all([
    getEconomicCalendarNext7DaysSnapshot(),
    getMarketNewsSnapshot('economic'),
  ]);

  const highImpactCount = events.filter((e) => (e.impact ?? '').toLowerCase() === 'high').length;
  const mediumImpactCount = events.filter((e) => (e.impact ?? '').toLowerCase() === 'medium').length;
  const lowImpactCount = events.filter((e) => (e.impact ?? '').toLowerCase() === 'low').length;

  const breadcrumbJsonLd = generateBreadcrumbJsonLd([
    { name: 'Home', url: `${siteUrl}/` },
    { name: 'Calendario economico', url },
  ]);

  return (
    <>
      <JsonLd id="jsonld-breadcrumb-calendario" data={breadcrumbJsonLd} />

      <main className="min-h-screen bg-[#fafafa]">
        <section className="bg-[#111111] text-white py-12">
          <div className="max-w-7xl mx-auto px-4 sm:px-6">
            <header>
              <h1 className="text-3xl md:text-4xl font-bold mb-2">Calendario Economico</h1>
              <p className="text-[#9b9b9b] text-lg max-w-2xl">
                Agenda de eventos e indicadores que movem os mercados globais (cache).
              </p>
            </header>
          </div>
        </section>

        <section className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
            <Card>
              <CardContent className="p-4">
                <p className="text-sm text-[#6b6b6b]">Eventos (janela)</p>
                <p className="text-3xl font-bold text-[#111111]">{events.length}</p>
              </CardContent>
            </Card>
            <Card className="border-[#fecaca] bg-[#fef2f2]">
              <CardContent className="p-4">
                <p className="text-sm text-[#c40000]">Alto Impacto</p>
                <p className="text-3xl font-bold text-[#c40000]">{highImpactCount}</p>
              </CardContent>
            </Card>
            <Card className="border-[#fde68a] bg-[#fef3c7]">
              <CardContent className="p-4">
                <p className="text-sm text-[#b45309]">Medio Impacto</p>
                <p className="text-3xl font-bold text-[#b45309]">{mediumImpactCount}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <p className="text-sm text-[#6b6b6b]">Baixo Impacto</p>
                <p className="text-3xl font-bold text-[#6b6b6b]">{lowImpactCount}</p>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Calendar className="w-5 h-5 text-[#c40000]" />
                    Proximos Eventos
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {events.length === 0 ? (
                    <p className="text-center py-8 text-[#6b6b6b]">
                      Sem eventos no momento (ou indisponivel no plano atual).
                    </p>
                  ) : (
                    <div className="space-y-4">
                      {events.slice(0, 20).map((event, idx) => (
                        <div
                          key={`${event.time}_${event.event}_${idx}`}
                          className="flex items-start gap-4 p-4 border border-[#e5e5e5] rounded-lg hover:bg-[#f9fafb] transition-colors"
                        >
                          <div className="flex-shrink-0">
                            <div className={`w-12 h-12 rounded-full flex items-center justify-center text-sm border ${impactClass(event.impact)}`}>
                              {impactLabel(event.impact).slice(0, 1)}
                            </div>
                          </div>

                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-2">
                              <div>
                                <h3 className="font-medium text-[#111111]">{event.event}</h3>
                                <p className="text-sm text-[#6b6b6b] capitalize">{event.country || '-'}</p>
                              </div>
                              <Badge className={`text-xs border ${impactClass(event.impact)}`}>
                                {impactLabel(event.impact)}
                              </Badge>
                            </div>

                            <div className="flex flex-wrap items-center gap-4 mt-2 text-sm">
                              <span className="flex items-center gap-1 text-[#6b6b6b]">
                                <Clock className="w-4 h-4" />
                                {event.time || 'Horario n/d'}
                              </span>

                              {event.actual && (
                                <span className="text-[#22c55e] font-medium">Real: {event.actual}</span>
                              )}
                              {event.consensus && (
                                <span className="text-[#6b6b6b]">Consenso: {event.consensus}</span>
                              )}
                              {event.prev && (
                                <span className="text-[#9b9b9b]">Ant: {event.prev}</span>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              {highImpactCount > 0 && (
                <div className="mt-6 bg-[#fef2f2] border border-[#fecaca] rounded-lg p-4 flex items-start gap-3">
                  <AlertTriangle className="w-5 h-5 text-[#c40000] flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-[#c40000]">
                    <strong>Atencao:</strong> eventos de alto impacto podem causar volatilidade significativa.
                  </p>
                </div>
              )}
            </div>

            <aside className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="w-5 h-5 text-[#c40000]" />
                    Noticias Economicas
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {news.length === 0 ? (
                    <p className="text-sm text-[#6b6b6b]">Sem noticias no momento.</p>
                  ) : (
                    <div className="space-y-4">
                      {news.slice(0, 8).map((item) => (
                        <article key={item.id} className="border-b border-[#e5e5e5] last:border-0 pb-3 last:pb-0">
                          <a href={item.url} target="_blank" rel="noopener noreferrer" className="group">
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

              <p className="text-xs text-[#6b6b6b]">
                Para contexto geral de mercados, veja{' '}
                <Link className="underline hover:text-[#c40000]" href="/mercados/">
                  Mercados
                </Link>
                .
              </p>
            </aside>
          </div>
        </section>
      </main>
    </>
  );
}

