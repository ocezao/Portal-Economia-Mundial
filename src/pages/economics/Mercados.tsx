/**
 * Página de Mercados
 * Cotações em tempo real de índices, commodities, forex e cripto
 * Usando Finnhub API
 */

import { Activity, Clock, Globe, Package, Newspaper } from 'lucide-react';
import { useGlobalIndices, useCommodities, useMarketNews, useSectors } from '@/hooks/economics';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export function Mercados() {
  const { indices, isLoading: loadingIndices, lastUpdate: lastUpdateIndices } = useGlobalIndices();
  const { commodities, isLoading: loadingCommodities } = useCommodities();
  const { news, isLoading: loadingNews } = useMarketNews('general');
  const { sectors, isLoading: loadingSectors } = useSectors();

  const lastUpdate = lastUpdateIndices;

  // Separar índices por região
  const americas = indices.filter(i => ['EUA', 'Brasil', 'México'].includes(i.region));
  const europe = indices.filter(i => ['Reino Unido', 'Alemanha', 'França', 'Itália'].includes(i.region));
  const asia = indices.filter(i => ['Japão', 'Hong Kong', 'China', 'Austrália'].includes(i.region));

  return (
    <main className="min-h-screen bg-[#fafafa]">
        <section className="bg-[#111111] text-white py-12">
          <div className="max-w-7xl mx-auto px-4 sm:px-6">
            <header className="flex items-center justify-between flex-wrap gap-4">
              <div>
                <h1 className="text-3xl md:text-4xl font-bold mb-2">
                  Mercados Globais
                </h1>
                <p className="text-[#9b9b9b] text-lg">
                  Cotações em tempo real de bolsas, commodities e notícias financeiras
                </p>
              </div>
              
              {lastUpdate && (
                <div className="flex items-center gap-2 text-sm text-[#9b9b9b]">
                  <Clock className="w-4 h-4" />
                  <span>
                    Atualizado {formatDistanceToNow(lastUpdate, { addSuffix: true, locale: ptBR })}
                  </span>
                </div>
              )}
            </header>
          </div>
        </section>

        <section className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
          {/* Cards de Resumo por Região */}
          {!loadingIndices && (
            <section className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
              <Card>
                <CardHeader className="pb-2">
                  <div className="flex items-center gap-2">
                    <Globe className="w-5 h-5 text-[#c40000]" />
                    <span className="text-sm font-medium text-[#6b6b6b]">Américas</span>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {americas.slice(0, 3).map(idx => (
                      <div key={idx.symbol} className="flex justify-between items-center">
                        <span className="text-sm text-[#111111]">{idx.name}</span>
                        <span className={idx.change >= 0 ? 'text-[#22c55e]' : 'text-[#ef4444]'}>
                          {idx.change >= 0 ? '+' : ''}{idx.changePercent.toFixed(2)}%
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
                    {europe.slice(0, 3).map(idx => (
                      <div key={idx.symbol} className="flex justify-between items-center">
                        <span className="text-sm text-[#111111]">{idx.name}</span>
                        <span className={idx.change >= 0 ? 'text-[#22c55e]' : 'text-[#ef4444]'}>
                          {idx.change >= 0 ? '+' : ''}{idx.changePercent.toFixed(2)}%
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
                    <span className="text-sm font-medium text-[#6b6b6b]">Ásia-Pacífico</span>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {asia.slice(0, 3).map(idx => (
                      <div key={idx.symbol} className="flex justify-between items-center">
                        <span className="text-sm text-[#111111]">{idx.name}</span>
                        <span className={idx.change >= 0 ? 'text-[#22c55e]' : 'text-[#ef4444]'}>
                          {idx.change >= 0 ? '+' : ''}{idx.changePercent.toFixed(2)}%
                        </span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </section>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Coluna Principal */}
            <div className="lg:col-span-2">
              {/* Setores */}
              <section className="mt-8">
                <h2 className="text-xl font-bold text-[#111111] mb-4 flex items-center gap-2">
                  <Activity className="w-5 h-5 text-[#c40000]" />
                  Performance por Setor
                </h2>
                
                {loadingSectors ? (
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-20" />)}
                  </div>
                ) : (
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {sectors.map(sector => (
                      <Card key={sector.key}>
                        <CardContent className="p-3">
                          <p className="text-sm text-[#6b6b6b]">{sector.name}</p>
                          <p className={sector.changePercent >= 0 ? 'text-[#22c55e] font-bold' : 'text-[#ef4444] font-bold'}>
                            {sector.changePercent >= 0 ? '+' : ''}{sector.changePercent.toFixed(2)}%
                          </p>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </section>
            </div>

            {/* Sidebar - Notícias */}
            <aside>
              <Card>
                <CardHeader>
                  <h3 className="text-lg font-bold text-[#111111] flex items-center gap-2">
                    <Newspaper className="w-5 h-5 text-[#c40000]" />
                    Notícias em Tempo Real
                  </h3>
                </CardHeader>
                <CardContent>
                  {loadingNews ? (
                    <div className="space-y-3">
                      {[1, 2, 3, 4, 5].map(i => <Skeleton key={i} className="h-16" />)}
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
                              <span className="text-xs text-[#9b9b9b]">
                                {formatDistanceToNow(item.datetime * 1000, { addSuffix: true, locale: ptBR })}
                              </span>
                            </div>
                          </a>
                        </article>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Commodities em Destaque */}
              <Card className="mt-6">
                <CardHeader>
                  <h3 className="text-lg font-bold text-[#111111] flex items-center gap-2">
                    <Package className="w-5 h-5 text-[#c40000]" />
                    Commodities
                  </h3>
                </CardHeader>
                <CardContent>
                  {loadingCommodities ? (
                    <div className="space-y-3">
                      {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-12" />)}
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {commodities.slice(0, 5).map(commodity => (
                        <div key={commodity.symbol} className="flex justify-between items-center">
                          <div>
                            <p className="text-sm font-medium text-[#111111]">{commodity.name}</p>
                            <p className="text-xs text-[#6b6b6b]">{commodity.unit}</p>
                          </div>
                          <div className="text-right">
                            <p className="text-sm font-medium">${commodity.price.toFixed(2)}</p>
                            <p className={commodity.changePercent >= 0 ? 'text-xs text-[#22c55e]' : 'text-xs text-[#ef4444]'}>
                              {commodity.changePercent >= 0 ? '+' : ''}{commodity.changePercent.toFixed(2)}%
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </aside>
          </div>

          {/* Legenda */}
          <footer className="mt-8 bg-white border border-[#e5e5e5] rounded-lg p-4">
            <h3 className="text-sm font-bold text-[#111111] mb-2">
              Sobre os Dados
            </h3>
            <p className="text-sm text-[#6b6b6b]">
              Os dados são fornecidos pela <strong>Finnhub</strong> em tempo real. 
              Índices atualizados a cada 30 segundos, commodities a cada 1 minuto. 
              As cotações podem ter atraso de 15 minutos em alguns mercados.
            </p>
          </footer>
        </section>
      </main>
  );
}
