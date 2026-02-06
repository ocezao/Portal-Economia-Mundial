/**
 * Página de Dados Econômicos
 * Dashboard com indicadores de mercado, commodities e análises
 * Usando Finnhub API
 */

import { useState } from 'react';
import { TrendingUp, Globe, Building2, Package, BarChart3 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  useGlobalIndices, 
  useCommodities, 
  useSectors,
  GEOPOLITICAL_STOCKS 
} from '@/hooks/economics';
import { useQuote } from '@/hooks/economics';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

// Componente para card de cotação
function QuoteCard({ symbol, name, isLoading }: { symbol: string; name: string; isLoading?: boolean }) {
  const { quote, isLoading: loadingQuote } = useQuote(symbol);
  
  if (isLoading || loadingQuote) {
    return (
      <Card>
        <CardContent className="p-4">
          <Skeleton className="h-4 w-24 mb-2" />
          <Skeleton className="h-8 w-32" />
        </CardContent>
      </Card>
    );
  }

  if (!quote) return null;

  const isPositive = quote.d >= 0;

  return (
    <Card>
      <CardContent className="p-4">
        <p className="text-sm text-[#6b6b6b]">{name}</p>
        <p className="text-2xl font-bold text-[#111111]">${quote.c.toFixed(2)}</p>
        <p className={cn("text-sm", isPositive ? "text-[#22c55e]" : "text-[#ef4444]")}>
          {isPositive ? '+' : ''}{quote.d.toFixed(2)} ({isPositive ? '+' : ''}{quote.dp.toFixed(2)}%)
        </p>
      </CardContent>
    </Card>
  );
}

export function DadosEconomicos() {
  const [activeTab, setActiveTab] = useState('visao-geral');
  
  const { indices, isLoading: loadingIndices } = useGlobalIndices();
  const { commodities, isLoading: loadingCommodities } = useCommodities();
  const { sectors, isLoading: loadingSectors } = useSectors();

  // Encontrar maiores altas e baixas
  const topGainers = [...indices].sort((a, b) => b.changePercent - a.changePercent).slice(0, 3);
  const topLosers = [...indices].sort((a, b) => a.changePercent - b.changePercent).slice(0, 3);

  return (
    <main className="min-h-screen bg-[#fafafa]">
        <section className="bg-[#111111] text-white py-12">
          <div className="max-w-7xl mx-auto px-4 sm:px-6">
            <header>
              <h1 className="text-3xl md:text-4xl font-bold mb-2">
                Dados Econômicos Globais
              </h1>
              <p className="text-[#9b9b9b] text-lg max-w-2xl">
                Indicadores de mercado, commodities e análises em tempo real. 
                Dados fornecidos pela Finnhub.
              </p>
            </header>
          </div>
        </section>

        <section className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
            <TabsList className="grid w-full grid-cols-4 max-w-2xl">
              <TabsTrigger value="visao-geral" className="gap-2">
                <Globe className="w-4 h-4" />
                Visão Geral
              </TabsTrigger>
              <TabsTrigger value="setores" className="gap-2">
                <BarChart3 className="w-4 h-4" />
                Setores
              </TabsTrigger>
              <TabsTrigger value="geopolitica" className="gap-2">
                <Building2 className="w-4 h-4" />
                Geopolítica
              </TabsTrigger>
              <TabsTrigger value="commodities" className="gap-2">
                <Package className="w-4 h-4" />
                Commodities
              </TabsTrigger>
            </TabsList>

            {/* Visão Geral */}
            <TabsContent value="visao-geral" className="space-y-6">
              {/* Cards Principais */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-[#6b6b6b]">
                      S&P 500
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {loadingIndices ? (
                      <Skeleton className="h-8 w-32" />
                    ) : (
                      <>
                        {(() => {
                          const sp500 = indices.find(i => i.symbol === 'GSPC');
                          if (!sp500) return <p className="text-[#6b6b6b]">N/D</p>;
                          return (
                            <>
                              <p className="text-2xl font-bold">{sp500.price.toLocaleString('pt-BR')}</p>
                              <p className={sp500.change >= 0 ? "text-[#22c55e]" : "text-[#ef4444]"}>
                                {sp500.change >= 0 ? '+' : ''}{sp500.changePercent.toFixed(2)}%
                              </p>
                            </>
                          );
                        })()}
                      </>
                    )}
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-[#6b6b6b]">
                      Ibovespa
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {loadingIndices ? (
                      <Skeleton className="h-8 w-32" />
                    ) : (
                      <>
                        {(() => {
                          const ibov = indices.find(i => i.symbol === 'BVSP');
                          if (!ibov) return <p className="text-[#6b6b6b]">N/D</p>;
                          return (
                            <>
                              <p className="text-2xl font-bold">{ibov.price.toLocaleString('pt-BR')}</p>
                              <p className={ibov.change >= 0 ? "text-[#22c55e]" : "text-[#ef4444]"}>
                                {ibov.change >= 0 ? '+' : ''}{ibov.changePercent.toFixed(2)}%
                              </p>
                            </>
                          );
                        })()}
                      </>
                    )}
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-[#6b6b6b]">
                      Petróleo Brent
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {loadingCommodities ? (
                      <Skeleton className="h-8 w-32" />
                    ) : (
                      <>
                        {(() => {
                          const oil = commodities.find(c => c.symbol === 'BZ=F');
                          if (!oil) return <p className="text-[#6b6b6b]">N/D</p>;
                          return (
                            <>
                              <p className="text-2xl font-bold">${oil.price.toFixed(2)}</p>
                              <p className={oil.change >= 0 ? "text-[#22c55e]" : "text-[#ef4444]"}>
                                {oil.change >= 0 ? '+' : ''}{oil.changePercent.toFixed(2)}%
                              </p>
                            </>
                          );
                        })()}
                      </>
                    )}
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-[#6b6b6b]">
                      Ouro
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {loadingCommodities ? (
                      <Skeleton className="h-8 w-32" />
                    ) : (
                      <>
                        {(() => {
                          const gold = commodities.find(c => c.symbol === 'GC=F');
                          if (!gold) return <p className="text-[#6b6b6b]">N/D</p>;
                          return (
                            <>
                              <p className="text-2xl font-bold">${gold.price.toFixed(2)}</p>
                              <p className={gold.change >= 0 ? "text-[#22c55e]" : "text-[#ef4444]"}>
                                {gold.change >= 0 ? '+' : ''}{gold.changePercent.toFixed(2)}%
                              </p>
                            </>
                          );
                        })()}
                      </>
                    )}
                  </CardContent>
                </Card>
              </div>

              {/* Maiores Altas e Baixas */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-[#22c55e]">
                      <TrendingUp className="w-5 h-5" />
                      Maiores Altas
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {loadingIndices ? (
                      <div className="space-y-2">
                        {[1, 2, 3].map(i => <Skeleton key={i} className="h-12" />)}
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {topGainers.map(idx => (
                          <div key={idx.symbol} className="flex justify-between items-center p-2 bg-[#f0fdf4] rounded">
                            <div>
                              <p className="font-medium text-[#111111]">{idx.name}</p>
                              <p className="text-xs text-[#6b6b6b]">{idx.region}</p>
                            </div>
                            <p className="text-[#22c55e] font-bold">+{idx.changePercent.toFixed(2)}%</p>
                          </div>
                        ))}
                      </div>
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
                  <CardContent>
                    {loadingIndices ? (
                      <div className="space-y-2">
                        {[1, 2, 3].map(i => <Skeleton key={i} className="h-12" />)}
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {topLosers.map(idx => (
                          <div key={idx.symbol} className="flex justify-between items-center p-2 bg-[#fef2f2] rounded">
                            <div>
                              <p className="font-medium text-[#111111]">{idx.name}</p>
                              <p className="text-xs text-[#6b6b6b]">{idx.region}</p>
                            </div>
                            <p className="text-[#ef4444] font-bold">{idx.changePercent.toFixed(2)}%</p>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* Setores */}
            <TabsContent value="setores">
              <Card>
                <CardHeader>
                  <CardTitle>Performance por Setor</CardTitle>
                </CardHeader>
                <CardContent>
                  {loadingSectors ? (
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                      {[1, 2, 3, 4, 5, 6, 7, 8].map(i => <Skeleton key={i} className="h-24" />)}
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                      {sectors.map(sector => (
                        <Card key={sector.key} className="border-0 shadow-none bg-[#f9fafb]">
                          <CardContent className="p-4">
                            <p className="text-sm text-[#6b6b6b]">{sector.name}</p>
                            <p className={cn(
                              "text-2xl font-bold",
                              sector.changePercent >= 0 ? "text-[#22c55e]" : "text-[#ef4444]"
                            )}>
                              {sector.changePercent >= 0 ? '+' : ''}{sector.changePercent.toFixed(2)}%
                            </p>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Geopolítica */}
            <TabsContent value="geopolitica">
              <div className="space-y-6">
                <section>
                  <h3 className="text-lg font-bold text-[#111111] mb-4">Setor de Defesa</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {GEOPOLITICAL_STOCKS.DEFENSE.map(stock => (
                      <QuoteCard 
                        key={stock.symbol} 
                        symbol={stock.symbol} 
                        name={stock.name} 
                      />
                    ))}
                  </div>
                </section>

                <section>
                  <h3 className="text-lg font-bold text-[#111111] mb-4">Setor de Energia</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {GEOPOLITICAL_STOCKS.ENERGY.map(stock => (
                      <QuoteCard 
                        key={stock.symbol} 
                        symbol={stock.symbol} 
                        name={stock.name} 
                      />
                    ))}
                  </div>
                </section>

                <section>
                  <h3 className="text-lg font-bold text-[#111111] mb-4">Commodities / Materiais</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    {GEOPOLITICAL_STOCKS.MATERIALS.map(stock => (
                      <QuoteCard 
                        key={stock.symbol} 
                        symbol={stock.symbol} 
                        name={stock.name} 
                      />
                    ))}
                  </div>
                </section>
              </div>
            </TabsContent>

            {/* Commodities */}
            <TabsContent value="commodities">
              <Card>
                <CardHeader>
                  <CardTitle>Principais Commodities</CardTitle>
                </CardHeader>
                <CardContent>
                  {loadingCommodities ? (
                    <div className="space-y-3">
                      {[1, 2, 3, 4, 5, 6].map(i => <Skeleton key={i} className="h-16" />)}
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {commodities.map(commodity => (
                        <div 
                          key={commodity.symbol} 
                          className="flex justify-between items-center p-4 border border-[#e5e5e5] rounded-lg"
                        >
                          <div>
                            <p className="font-medium text-[#111111]">{commodity.name}</p>
                            <p className="text-sm text-[#6b6b6b]">{commodity.unit}</p>
                          </div>
                          <div className="text-right">
                            <p className="text-xl font-bold">${commodity.price.toFixed(2)}</p>
                            <p className={cn(
                              "text-sm",
                              commodity.changePercent >= 0 ? "text-[#22c55e]" : "text-[#ef4444]"
                            )}>
                              {commodity.changePercent >= 0 ? '+' : ''}{commodity.changePercent.toFixed(2)}%
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </section>
      </main>
  );
}
