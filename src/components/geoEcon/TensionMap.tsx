/**
 * Mapa de Tensões Geopolíticas
 * Lista de pontos de tensão global com tooltips explicativos
 */

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { AlertTriangle, MapPin, Clock, Info, TrendingUp, TrendingDown, Minus, Globe, Users, Scale } from 'lucide-react';
import { tensionPoints, tensionLevelConfig } from '@/config/geoecon';
import { useGeopoliticalNews } from '@/hooks/economics';
import { ROUTES } from '@/config/routes';
import {
  Tooltip,
  TooltipContent,

  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface ExpandedPoint {
  id: string;
  region: string;
  country: string;
  level: 'low' | 'medium' | 'high' | 'critical';
  title: string;
  description: string;
  url?: string;
  lastUpdate: string;
  impact?: string;
  actors?: string[];
  trend?: 'escalating' | 'stable' | 'deescalating';
  economicImpact?: string;
}

// Dados expandidos com informações adicionais
const expandedPointData: Record<string, Partial<ExpandedPoint>> = {
  't1': {
    impact: 'Alto impacto global em energia e commodities. Sanções econômicas afetam cadeias de suprimento mundiais.',
    actors: ['Rússia', 'Ucrânia', 'OTAN', 'UE', 'EUA'],
    trend: 'stable',
    economicImpact: 'Petróleo, gás natural, trigo e fertilizantes. Inflação global persistente.'
  },
  't2': {
    impact: 'Crise humanitária regional. Risco de escalada envolvendo atores regionais.',
    actors: ['Israel', 'Hamas', 'Palestina', 'Irã', 'Líbano', 'Egito'],
    trend: 'escalating',
    economicImpact: 'Petróleo do Oriente Médio. Rotas comerciais no Canal de Suez.'
  },
  't3': {
    impact: 'Tensão constante com potencial de afetar cadeias globais de semicondutores.',
    actors: ['China', 'Taiwan', 'EUA', 'Japão'],
    trend: 'stable',
    economicImpact: 'Semicondutores (90% da produção global). Tecnologia e eletrônicos.'
  },
  't4': {
    impact: 'Tensão diplomática contida. Risco de escalada militar limitado.',
    actors: ['Venezuela', 'Guiana', 'MERCOSUL', 'OEA'],
    trend: 'deescalating',
    economicImpact: 'Petróleo offshore na região do Essequibo.'
  },
  't5': {
    impact: 'Crise humanitária severa. Refugiados afetam países vizinhos.',
    actors: ['Exército Sudanês', 'RSF', 'Egito', 'Arábia Saudita', 'EAU'],
    trend: 'escalating',
    economicImpact: 'Desestabilização regional. Rotas comerciais no Chifre da África.'
  },
};

// Configuração de tendência
const trendConfig = {
  escalating: { label: 'Escalando', icon: TrendingUp, color: '#ef4444' },
  stable: { label: 'Estável', icon: Minus, color: '#f59e0b' },
  deescalating: { label: 'De-escalando', icon: TrendingDown, color: '#22c55e' },
};

export function TensionMap() {
  const { news, isLoading, error } = useGeopoliticalNews();
  const [selectedPoint, setSelectedPoint] = useState<ExpandedPoint | null>(null);

  const livePoints = useMemo(() => {
    return news.slice(0, 5).map((item, index) => {
      const headline = item.headline.toLowerCase();
      const summary = item.summary.toLowerCase();
      const level = [
        'war', 'guerra', 'conflito', 'crise', 'tens', 'ataque', 'attack', 'sanc'
      ].some((k) => headline.includes(k) || summary.includes(k))
        ? 'critical'
        : ['tension', 'risk', 'strike'].some((k) => headline.includes(k) || summary.includes(k))
          ? 'high'
          : 'medium';

      return {
        id: `news_${item.id ?? index}`,
        region: item.source || 'Global',
        country: item.related?.split(',')[0] || 'Global',
        lat: 0,
        lng: 0,
        level: level as 'low' | 'medium' | 'high' | 'critical',
        title: item.headline,
        description: item.summary,
        url: item.url,
        lastUpdate: new Date(item.datetime * 1000).toISOString(),
        isLive: true,
      };
    });
  }, [news]);

  const points = livePoints.length > 0 ? livePoints : tensionPoints;

  // Merge com dados expandidos
  const pointsWithDetails = points.map(point => ({
    ...point,
    ...expandedPointData[point.id],
  }));

  return (
    <aside className="bg-white border border-[#e5e5e5] rounded-lg p-4 sm:p-6">
        {/* Header com explicação */}
        <header className="flex items-center gap-2 mb-4">
          <AlertTriangle className="w-5 h-5 text-[#c40000]" />
          <h2 className="text-lg font-bold text-[#111111]">
            <Link href={ROUTES.mapaTensoes} className="hover:underline">
              Mapa de Tensões
            </Link>
          </h2>
          {livePoints.length > 0 && (
            <span className="ml-auto flex items-center gap-1 text-xs text-[#6b6b6b]">
              <span className="w-2 h-2 bg-[#22c55e] rounded-full animate-pulse" />
              Ao vivo
            </span>
          )}
        </header>

        {/* Legenda explicativa */}
        <section className="bg-[#f9fafb] rounded-lg p-3 mb-4">
          <div className="flex items-center gap-1 mb-2">
            <Info className="w-3 h-3 text-[#6b6b6b]" />
            <span className="text-xs font-medium text-[#6b6b6b]">Como interpretar</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {Object.entries(tensionLevelConfig).map(([key, config]) => (
              <Tooltip key={key}>
                <TooltipTrigger asChild>
                  <span 
                    className={`inline-flex items-center gap-1 px-2 py-1 rounded text-xs ${config.bg} cursor-help`}
                  >
                    <span 
                      className="w-2 h-2 rounded-full" 
                      style={{ backgroundColor: config.color }}
                    />
                    {config.label}
                  </span>
                </TooltipTrigger>
                <TooltipContent side="top" className="max-w-[200px]">
                  <p className="text-xs">
                    {key === 'critical' && 'Conflito armado em andamento ou crise severa com impacto global imediato.'}
                    {key === 'high' && 'Tensões significativas com risco real de escalada ou conflito limitado.'}
                    {key === 'medium' && 'Disputas diplomáticas ou tensões regionais sem confronto armado.'}
                    {key === 'low' && 'Situação estável com tensões mínimas ou resolvidas.'}
                  </p>
                </TooltipContent>
              </Tooltip>
            ))}
          </div>
        </section>

        {/* Lista de tensões */}
        <ul className="space-y-3">
          {pointsWithDetails.map((point) => {
            const config = tensionLevelConfig[point.level];
            const trendInfo = point.trend ? trendConfig[point.trend] : null;
            const TrendIcon = trendInfo?.icon;

            return (
              <li key={point.id}>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <article 
                      className={cn(
                        "p-3 rounded-lg border-l-4 cursor-pointer transition-all hover:shadow-md hover:translate-x-1",
                        config.bg
                      )} 
                      style={{ borderLeftColor: config.color }}
                      onClick={() => setSelectedPoint(point as ExpandedPoint)}
                    >
                      <header className="flex items-start justify-between gap-2">
                        <section className="flex-1 min-w-0">
                          <h3 className="font-semibold text-[#111111] text-sm sm:text-base truncate">
                            {point.url ? (
                              <a 
                                href={point.url} 
                                target="_blank" 
                                rel="noreferrer" 
                                className="hover:underline"
                                onClick={(e) => e.stopPropagation()}
                              >
                                {point.title}
                              </a>
                            ) : (
                              point.title
                            )}
                          </h3>
                          <p className="flex items-center gap-1 text-xs text-[#6b6b6b] mt-0.5">
                            <MapPin className="w-3 h-3" />
                            {point.region} • {point.country}
                            {'isLive' in point && (point as { isLive?: boolean }).isLive && (
                              <span className="ml-1 text-[#22c55e] font-medium">• Live</span>
                            )}
                          </p>
                        </section>
                        <div className="flex items-center gap-1">
                          {trendInfo && TrendIcon && (
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <span className="flex items-center">
                                  <TrendIcon 
                                    className="w-3 h-3" 
                                    style={{ color: trendInfo.color }}
                                  />
                                </span>
                              </TooltipTrigger>
                              <TooltipContent side="top">
                                <p className="text-xs">Tendência: {trendInfo.label}</p>
                              </TooltipContent>
                            </Tooltip>
                          )}
                          <span 
                            className="px-2 py-0.5 rounded text-xs font-medium text-white flex-shrink-0"
                            style={{ backgroundColor: config.color }}
                          >
                            {config.label}
                          </span>
                        </div>
                      </header>
                      <p className="text-xs sm:text-sm text-[#374151] mt-2 line-clamp-2">
                        {point.description}
                      </p>
                      <footer className="flex items-center justify-between mt-2">
                        <span className="flex items-center gap-1 text-xs text-[#6b6b6b]">
                          <Clock className="w-3 h-3" />
                          {new Date(point.lastUpdate).toLocaleDateString('pt-BR')}
                        </span>
                        <Info className="w-3 h-3 text-[#6b6b6b]" />
                      </footer>
                    </article>
                  </TooltipTrigger>
                  
                  {/* Tooltip com informações extras */}
                  <TooltipContent side="right" className="max-w-[300px] p-4">
                    <div className="space-y-3">
                      <h4 className="font-bold text-sm">{point.title}</h4>
                      
                      {point.impact && (
                        <div className="flex items-start gap-2">
                          <Globe className="w-4 h-4 text-[#6b6b6b] mt-0.5 flex-shrink-0" />
                          <div>
                            <span className="text-xs font-medium text-[#6b6b6b]">Impacto Geopolítico:</span>
                            <p className="text-xs text-[#374151]">{point.impact}</p>
                          </div>
                        </div>
                      )}

                      {point.economicImpact && (
                        <div className="flex items-start gap-2">
                          <TrendingUp className="w-4 h-4 text-[#6b6b6b] mt-0.5 flex-shrink-0" />
                          <div>
                            <span className="text-xs font-medium text-[#6b6b6b]">Impacto Econômico:</span>
                            <p className="text-xs text-[#374151]">{point.economicImpact}</p>
                          </div>
                        </div>
                      )}

                      {point.actors && point.actors.length > 0 && (
                        <div className="flex items-start gap-2">
                          <Users className="w-4 h-4 text-[#6b6b6b] mt-0.5 flex-shrink-0" />
                          <div>
                            <span className="text-xs font-medium text-[#6b6b6b]">Atores Principais:</span>
                            <p className="text-xs text-[#374151]">{point.actors.join(', ')}</p>
                          </div>
                        </div>
                      )}

                      {point.trend && (
                        <div className="flex items-center gap-2">
                          <Scale className="w-4 h-4 text-[#6b6b6b]" />
                          <span className="text-xs">
                            Tendência: <span style={{ color: trendInfo?.color }}>{trendInfo?.label}</span>
                          </span>
                        </div>
                      )}

                      <p className="text-xs text-[#6b6b6b] italic">
                        Clique para ver mais detalhes
                      </p>
                    </div>
                  </TooltipContent>
                </Tooltip>
              </li>
            );
          })}
        </ul>

        {/* Footer com info */}
        <footer className="mt-4 pt-3 border-t border-[#e5e5e5]">
          <div className="flex items-center justify-between">
            <p className="text-xs text-[#6b6b6b]">
              {isLoading && points.length === 0 ? (
                'Carregando dados em tempo real...'
              ) : error && livePoints.length === 0 ? (
                'Exibindo dados de referência.'
              ) : (
                <>
                  <Info className="w-3 h-3 inline mr-1" />
                  Passe o mouse para mais informações
                </>
              )}
            </p>
            <Dialog>
              <DialogTrigger asChild>
                <Button variant="ghost" size="sm" className="text-xs h-7">
                  Saiba mais
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-[500px]">
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-2">
                    <AlertTriangle className="w-5 h-5 text-[#c40000]" />
                    Sobre o Mapa de Tensões
                  </DialogTitle>
                </DialogHeader>
                <div className="space-y-4 text-sm">
                  <section>
                    <h4 className="font-semibold mb-2">O que é?</h4>
                    <p className="text-[#6b6b6b]">
                      O Mapa de Tensões exibe conflitos e crises geopolíticas em andamento 
                      ao redor do mundo, classificados por nível de gravidade e impacto global.
                    </p>
                  </section>
                  
                  <section>
                    <h4 className="font-semibold mb-2">Como interpretar os níveis?</h4>
                    <ul className="space-y-2">
                      <li className="flex items-center gap-2">
                        <span className="w-3 h-3 rounded-full bg-[#ef4444]" />
                        <span><strong>Crítico:</strong> Conflito armado ativo com impacto global</span>
                      </li>
                      <li className="flex items-center gap-2">
                        <span className="w-3 h-3 rounded-full bg-[#f97316]" />
                        <span><strong>Alto:</strong> Tensões elevadas, risco de escalada</span>
                      </li>
                      <li className="flex items-center gap-2">
                        <span className="w-3 h-3 rounded-full bg-[#f59e0b]" />
                        <span><strong>Médio:</strong> Disputas diplomáticas, sem conflito armado</span>
                      </li>
                      <li className="flex items-center gap-2">
                        <span className="w-3 h-3 rounded-full bg-[#22c55e]" />
                        <span><strong>Baixo:</strong> Situação estável ou tensões resolvidas</span>
                      </li>
                    </ul>
                  </section>

                  <section>
                    <h4 className="font-semibold mb-2">Tendências</h4>
                    <ul className="space-y-1 text-[#6b6b6b]">
                      <li className="flex items-center gap-2">
                        <TrendingUp className="w-4 h-4 text-[#ef4444]" />
                        <span>Escalando: Tensão aumentando</span>
                      </li>
                      <li className="flex items-center gap-2">
                        <Minus className="w-4 h-4 text-[#f59e0b]" />
                        <span>Estável: Sem mudanças significativas</span>
                      </li>
                      <li className="flex items-center gap-2">
                        <TrendingDown className="w-4 h-4 text-[#22c55e]" />
                        <span>De-escalando: Tensão diminuindo</span>
                      </li>
                    </ul>
                  </section>

                  <section>
                    <h4 className="font-semibold mb-2">Fonte de dados</h4>
                    <p className="text-[#6b6b6b]">
                      Combina dados de agências de notícias em tempo real (GNews API) 
                      com análise editorial especializada. Atualizado automaticamente 
                      quando disponível.
                    </p>
                  </section>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </footer>

        {/* Modal de detalhes do ponto */}
        {selectedPoint && (
          <Dialog open={!!selectedPoint} onOpenChange={() => setSelectedPoint(null)}>
            <DialogContent className="max-w-[600px]">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <AlertTriangle 
                    className="w-5 h-5" 
                    style={{ color: tensionLevelConfig[selectedPoint.level].color }}
                  />
                  {selectedPoint.title}
                </DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div className="flex items-center gap-2 flex-wrap">
                  <span 
                    className="px-2 py-1 rounded text-xs font-medium text-white"
                    style={{ backgroundColor: tensionLevelConfig[selectedPoint.level].color }}
                  >
                    {tensionLevelConfig[selectedPoint.level].label}
                  </span>
                  <span className="flex items-center gap-1 text-sm text-[#6b6b6b]">
                    <MapPin className="w-4 h-4" />
                    {selectedPoint.region} • {selectedPoint.country}
                  </span>
                  {selectedPoint.trend && (
                    <span 
                      className="flex items-center gap-1 px-2 py-1 rounded text-xs"
                      style={{ 
                        backgroundColor: trendConfig[selectedPoint.trend].color + '20',
                        color: trendConfig[selectedPoint.trend].color 
                      }}
                    >
                      {(() => {
                        const TrendIcon = trendConfig[selectedPoint.trend].icon;
                        return <TrendIcon className="w-3 h-3" />;
                      })()}
                      {trendConfig[selectedPoint.trend].label}
                    </span>
                  )}
                </div>

                <p className="text-sm text-[#374151]">{selectedPoint.description}</p>

                {selectedPoint.impact && (
                  <div className="bg-[#f9fafb] p-3 rounded-lg">
                    <h4 className="font-semibold text-sm flex items-center gap-2 mb-2">
                      <Globe className="w-4 h-4" />
                      Impacto Geopolítico
                    </h4>
                    <p className="text-sm text-[#6b6b6b]">{selectedPoint.impact}</p>
                  </div>
                )}

                {selectedPoint.economicImpact && (
                  <div className="bg-[#f9fafb] p-3 rounded-lg">
                    <h4 className="font-semibold text-sm flex items-center gap-2 mb-2">
                      <TrendingUp className="w-4 h-4" />
                      Impacto Econômico
                    </h4>
                    <p className="text-sm text-[#6b6b6b]">{selectedPoint.economicImpact}</p>
                  </div>
                )}

                {selectedPoint.actors && (
                  <div className="bg-[#f9fafb] p-3 rounded-lg">
                    <h4 className="font-semibold text-sm flex items-center gap-2 mb-2">
                      <Users className="w-4 h-4" />
                      Principais Atores
                    </h4>
                    <div className="flex flex-wrap gap-2">
                      {selectedPoint.actors.map((actor) => (
                        <span 
                          key={actor} 
                          className="px-2 py-1 bg-white border border-[#e5e5e5] rounded text-xs"
                        >
                          {actor}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                <div className="flex items-center justify-between pt-3 border-t border-[#e5e5e5]">
                  <span className="text-xs text-[#6b6b6b] flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    Atualizado em: {new Date(selectedPoint.lastUpdate).toLocaleDateString('pt-BR')}
                  </span>
                  {selectedPoint.url && (
                    <a 
                      href={selectedPoint.url}
                      target="_blank"
                      rel="noreferrer"
                      className="text-sm text-[#c40000] hover:underline"
                    >
                      Ler notícia completa →
                    </a>
                  )}
                </div>
              </div>
            </DialogContent>
          </Dialog>
        )}
      </aside>
  );
}
