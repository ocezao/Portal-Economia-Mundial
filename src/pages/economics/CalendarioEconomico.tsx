/**
 * Página de Calendário Econômico
 * Eventos econômicos e indicadores
 * Usando Finnhub API
 */

import { Calendar, AlertTriangle, Clock, TrendingUp } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

import { Skeleton } from '@/components/ui/skeleton';
import { useEconomicCalendar, useMarketNews } from '@/hooks/economics/useFinnhub';
import { cn } from '@/lib/utils';



export function CalendarioEconomico() {
  const { events, isLoading: loadingEvents, refresh } = useEconomicCalendar(undefined, 15);
  const { news, isLoading: loadingNews } = useMarketNews('economic');

  // Contagem por impacto
  const highImpactCount = events.filter(e => e.impact === 'high').length;
  const mediumImpactCount = events.filter(e => e.impact === 'medium').length;
  const lowImpactCount = events.filter(e => e.impact === 'low').length;

  const getImpactColor = (impact: string) => {
    switch (impact) {
      case 'high': return 'bg-[#fef2f2] text-[#c40000] border-[#fecaca]';
      case 'medium': return 'bg-[#fef3c7] text-[#b45309] border-[#fde68a]';
      case 'low': return 'bg-[#f5f5f5] text-[#6b6b6b] border-[#e5e5e5]';
      default: return 'bg-[#f5f5f5] text-[#6b6b6b]';
    }
  };

  const getImpactLabel = (impact: string) => {
    switch (impact) {
      case 'high': return 'Alto';
      case 'medium': return 'Médio';
      case 'low': return 'Baixo';
      default: return impact;
    }
  };

  const getCountryFlag = (country: string) => {
    const flags: Record<string, string> = {
      'united states': '🇺🇸',
      'euro area': '🇪🇺',
      'china': '🇨🇳',
      'japan': '🇯🇵',
      'united kingdom': '🇬🇧',
      'germany': '🇩🇪',
      'france': '🇫🇷',
      'canada': '🇨🇦',
      'australia': '🇦🇺',
      'brazil': '🇧🇷',
      'india': '🇮🇳',
    };
    return flags[country.toLowerCase()] || '🌍';
  };

  return (
    <main className="min-h-screen bg-[#fafafa]">
        <section className="bg-[#111111] text-white py-12">
          <div className="max-w-7xl mx-auto px-4 sm:px-6">
            <header>
              <h1 className="text-3xl md:text-4xl font-bold mb-2">
                Calendário Econômico
              </h1>
              <p className="text-[#9b9b9b] text-lg max-w-2xl">
                Agenda de eventos econômicos importantes e indicadores que movem os mercados globais.
              </p>
            </header>
          </div>
        </section>

        <section className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
          {/* Cards de Resumo */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
            <Card>
              <CardContent className="p-4">
                <p className="text-sm text-[#6b6b6b]">Eventos esta semana</p>
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
                <p className="text-sm text-[#b45309]">Médio Impacto</p>
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
            {/* Lista de Eventos */}
            <div className="lg:col-span-2">
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2">
                      <Calendar className="w-5 h-5 text-[#c40000]" />
                      Próximos Eventos
                    </CardTitle>
                    <Button variant="outline" size="sm" onClick={refresh}>
                      Atualizar
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  {loadingEvents ? (
                    <div className="space-y-4">
                      {[1, 2, 3, 4, 5].map(i => (
                        <Skeleton key={i} className="h-20 w-full" />
                      ))}
                    </div>
                  ) : events.length === 0 ? (
                    <p className="text-center py-8 text-[#6b6b6b]">
                      Nenhum evento programado para os próximos dias.
                    </p>
                  ) : (
                    <div className="space-y-4">
                      {events.slice(0, 15).map((event, idx) => (
                        <div 
                          key={idx} 
                          className="flex items-start gap-4 p-4 border border-[#e5e5e5] rounded-lg hover:bg-[#f9fafb] transition-colors"
                        >
                          <div className="flex-shrink-0">
                            <div className={cn(
                              "w-12 h-12 rounded-full flex items-center justify-center text-lg",
                              getImpactColor(event.impact)
                            )}>
                              {getCountryFlag(event.country)}
                            </div>
                          </div>

                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-2">
                              <div>
                                <h3 className="font-medium text-[#111111]">{event.title}</h3>
                                <p className="text-sm text-[#6b6b6b] capitalize">{event.country}</p>
                              </div>
                              <Badge className={cn("text-xs", getImpactColor(event.impact))}>
                                {getImpactLabel(event.impact)}
                              </Badge>
                            </div>

                            <div className="flex items-center gap-4 mt-2 text-sm">
                              <span className="flex items-center gap-1 text-[#6b6b6b]">
                                <Clock className="w-4 h-4" />
                                {event.time || 'Horário não definido'}
                              </span>
                              
                              {event.actual && (
                                <span className="text-[#22c55e] font-medium">
                                  Real: {event.actual}
                                </span>
                              )}
                              
                              {event.forecast && (
                                <span className="text-[#6b6b6b]">
                                  Prev: {event.forecast}
                                </span>
                              )}
                              
                              {event.previous && (
                                <span className="text-[#9b9b9b]">
                                  Ant: {event.previous}
                                </span>
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
                    <strong>Atenção:</strong> Eventos de alto impacto podem causar volatilidade significativa 
                    nos mercados financeiros. Recomenda-se cautela nas operações.
                  </p>
                </div>
              )}
            </div>

            {/* Sidebar - Notícias Relacionadas */}
            <aside>
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="w-5 h-5 text-[#c40000]" />
                    Notícias Econômicas
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {loadingNews ? (
                    <div className="space-y-4">
                      {[1, 2, 3, 4, 5].map(i => (
                        <Skeleton key={i} className="h-16 w-full" />
                      ))}
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {news.slice(0, 8).map((item, idx) => (
                        <article key={idx} className="border-b border-[#e5e5e5] last:border-0 pb-3 last:pb-0">
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

              <Card className="mt-6">
                <CardHeader>
                  <CardTitle className="text-base">Como interpretar</CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-3 text-sm text-[#6b6b6b]">
                    <li className="flex items-start gap-2">
                      <span className="w-2 h-2 rounded-full bg-[#c40000] mt-1.5 flex-shrink-0" />
                      <span>
                        <strong className="text-[#111111]">Alto Impacto:</strong> Podem causar 
                        movimentos bruscos nos mercados (ex: decisões de juros, dados de emprego)
                      </span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="w-2 h-2 rounded-full bg-[#f59e0b] mt-1.5 flex-shrink-0" />
                      <span>
                        <strong className="text-[#111111]">Médio Impacto:</strong> Relevância 
                        moderada, podem afetar setores específicos
                      </span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="w-2 h-2 rounded-full bg-[#6b6b6b] mt-1.5 flex-shrink-0" />
                      <span>
                        <strong className="text-[#111111]">Baixo Impacto:</strong> Impacto 
                        limitado, mais relevante para análises de longo prazo
                      </span>
                    </li>
                  </ul>
                </CardContent>
              </Card>
            </aside>
          </div>
        </section>
      </main>
  );
}
