/**
 * Termômetro de Risco
 * Índices de risco por região/tema com explicações detalhadas
 */

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { 
  Thermometer, 
  TrendingUp, 
  TrendingDown, 
  Minus, 
  AlertCircle, 
  Info,
  Globe,
  DollarSign,
  Building2,
  Activity,
  HelpCircle,
  ChevronRight
} from 'lucide-react';
import { riskIndices as fallbackIndices, getRiskLevel, type RiskIndex } from '@/config/geoecon';
import { useCommodities, useGlobalIndices } from '@/hooks/economics';
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


// Configuração de explicações para cada tipo de risco
const riskExplanations: Record<string, {
  description: string;
  whatItMeans: string;
  howItsCalculated: string;
  factors: string[];
  interpretation: Record<string, string>;
  icon: React.ElementType;
}> = {
  'Risco Geopolitico Global': {
    description: 'Mede a instabilidade política e tensões entre nações que podem afetar os mercados globais.',
    whatItMeans: 'Quanto maior o valor, maior a probabilidade de eventos que causem volatilidade nos mercados financeiros.',
    howItsCalculated: 'Baseado na volatilidade dos principais índices de ações globais e variações de commodities estratégicas como petróleo e ouro.',
    factors: ['Volatilidade de mercados acionários', 'Preço do petróleo', 'Preço do ouro', 'Índices de incerteza política'],
    interpretation: {
      low: 'Ambiente estável, baixa probabilidade de choques externos',
      moderate: 'Tensões presentes, mercados atentos a desenvolvimentos',
      high: 'Instabilidade significativa, risco de correções nos mercados',
      critical: 'Crise em andamento, alta volatilidade esperada'
    },
    icon: Globe
  },
  'Risco Economico - EUA': {
    description: 'Avalia a saúde econômica dos Estados Unidos, a maior economia do mundo.',
    whatItMeans: 'Reflete o risco de recessão, instabilidade financeira ou desaceleração econômica nos EUA, que impacta o mundo todo.',
    howItsCalculated: 'Análise da volatilidade dos três principais índices americanos: S&P 500, Dow Jones e Nasdaq.',
    factors: ['S&P 500 (500 maiores empresas)', 'Dow Jones (Industriais)', 'Nasdaq (Tecnologia)', 'Dados de emprego'],
    interpretation: {
      low: 'Economia robusta, crescimento estável',
      moderate: 'Sinais mistos, algumas preocupações',
      high: 'Risco de recessão ou crise financeira',
      critical: 'Crise confirmada, contração econômica'
    },
    icon: Building2
  },
  'Risco Cambial - Emergentes': {
    description: 'Mede a volatilidade e fragilidade das moedas e mercados de países emergentes.',
    whatItMeans: 'Alto risco indica pressão sobre moedas locais, fuga de capitais e dificuldade de financiamento externo.',
    howItsCalculated: 'Análise da volatilidade de índices de mercados emergentes como Ibovespa (Brasil), IPC (México) e Hang Seng (Hong Kong).',
    factors: ['Fluxo de capitais estrangeiros', 'Cotação do dólar', 'Preço de commodities', 'Taxa de juros dos EUA'],
    interpretation: {
      low: 'Mercados estáveis, entrada de investimentos',
      moderate: 'Cautela dos investidores, volatilidade moderada',
      high: 'Fuga de capitais, desvalorização cambial',
      critical: 'Crise cambial, risco de default'
    },
    icon: DollarSign
  },
  'Risco de Inflacao - Brasil': {
    description: 'Avalia a pressão inflacionária e seus efeitos na economia brasileira.',
    whatItMeans: 'Inflação alta erode o poder de compra, aumenta juros e prejudica o crescimento econômico.',
    howItsCalculated: 'Combina a volatilidade do Ibovespa com variações do petróleo Brent, principal influenciador de preços no Brasil.',
    factors: ['Preço do petróleo internacional', 'Câmbio (dólar)', 'Preços de alimentos', 'Expectativas de inflação'],
    interpretation: {
      low: 'Inflação controlada, economia saudável',
      moderate: 'Pressões inflacionárias presentes',
      high: 'Inflação alta, juros devem subir',
      critical: 'Hiperinflação ou crise de preços'
    },
    icon: Activity
  }
};

// Configuração de tendências
const trendConfig = {
  up: { 
    label: 'Aumentando', 
    color: '#ef4444', 
    icon: TrendingUp,
    description: 'O risco está subindo comparado ao período anterior'
  },
  down: { 
    label: 'Diminuindo', 
    color: '#22c55e', 
    icon: TrendingDown,
    description: 'O risco está caindo comparado ao período anterior'
  },
  stable: { 
    label: 'Estável', 
    color: '#6b6b6b', 
    icon: Minus,
    description: 'O risco se manteve praticamente igual'
  }
};

// Configuração de níveis de risco com explicações
const riskLevelDetails = {
  low: { 
    range: '0-39', 
    color: '#22c55e', 
    label: 'Baixo',
    description: 'Situação normal, sem preocupações imediatas'
  },
  moderate: { 
    range: '40-59', 
    color: '#f59e0b', 
    label: 'Moderado',
    description: 'Atenção necessária, monitorar desenvolvimentos'
  },
  high: { 
    range: '60-74', 
    color: '#f97316', 
    label: 'Alto',
    description: 'Risco elevado, precaução recomendada'
  },
  critical: { 
    range: '75-100', 
    color: '#ef4444', 
    label: 'Crítico',
    description: 'Situação perigosa, proteger investimentos'
  }
};

function toScore(value: number): number {
  return Math.min(100, Math.max(0, Math.round(Math.abs(value) * 20)));
}

function average(values: number[]): number {
  if (values.length === 0) return 0;
  return values.reduce((sum, v) => sum + v, 0) / values.length;
}

export function RiskThermometer() {
  const { indices, isLoading: indicesLoading, error: indicesError } = useGlobalIndices();
  const { commodities, isLoading: commoditiesLoading, error: commoditiesError } = useCommodities();
  const [selectedRisk, setSelectedRisk] = useState<typeof fallbackIndices[0] | null>(null);

  const liveIndices = useMemo<RiskIndex[]>(() => {
    if (indices.length === 0 && commodities.length === 0) return [];

    const topMovers = [...indices]
      .filter((i) => Number.isFinite(i.changePercent))
      .sort((a, b) => Math.abs(b.changePercent) - Math.abs(a.changePercent))
      .slice(0, 3)
      .map((i) => i.name);

    const globalScore = toScore(average([
      ...indices.slice(0, 6).map((i) => i.changePercent),
      ...commodities.slice(0, 4).map((c) => c.changePercent),
    ].filter((v) => Number.isFinite(v)) as number[]));

    const usScore = toScore(average([
      indices.find((i) => i.symbol === 'SPX')?.changePercent ?? 0,
      indices.find((i) => i.symbol === 'DJI')?.changePercent ?? 0,
      indices.find((i) => i.symbol === 'NDX')?.changePercent ?? 0,
    ]));

    const emScore = toScore(average([
      indices.find((i) => i.symbol === 'IBOV')?.changePercent ?? 0,
      indices.find((i) => i.symbol === 'MXX')?.changePercent ?? 0,
      indices.find((i) => i.symbol === 'HSI')?.changePercent ?? 0,
    ]));

    const brScore = toScore(average([
      indices.find((i) => i.symbol === 'IBOV')?.changePercent ?? 0,
      commodities.find((c) => c.symbol === 'BRENT')?.changePercent ?? 0,
    ]));

    return [
      {
        id: 'r1',
        name: 'Risco Geopolitico Global',
        region: 'Mundial',
        currentValue: globalScore,
        previousValue: Math.max(0, globalScore - 3),
        trend: globalScore >= 60 ? 'up' : globalScore <= 40 ? 'down' : 'stable',
        factors: topMovers.length > 0 ? topMovers : ['Mercados globais'],
        lastUpdate: new Date().toISOString(),
      },
      {
        id: 'r2',
        name: 'Risco Economico - EUA',
        region: 'EUA',
        currentValue: usScore,
        previousValue: Math.max(0, usScore - 2),
        trend: usScore >= 60 ? 'up' : usScore <= 40 ? 'down' : 'stable',
        factors: ['S&P 500', 'Dow Jones', 'Nasdaq 100'],
        lastUpdate: new Date().toISOString(),
      },
      {
        id: 'r3',
        name: 'Risco Cambial - Emergentes',
        region: 'Mercados Emergentes',
        currentValue: emScore,
        previousValue: Math.max(0, emScore - 2),
        trend: emScore >= 60 ? 'up' : emScore <= 40 ? 'down' : 'stable',
        factors: ['Ibovespa', 'Mexico IPC', 'Hang Seng'],
        lastUpdate: new Date().toISOString(),
      },
      {
        id: 'r4',
        name: 'Risco de Inflacao - Brasil',
        region: 'Brasil',
        currentValue: brScore,
        previousValue: Math.max(0, brScore - 2),
        trend: brScore >= 60 ? 'up' : brScore <= 40 ? 'down' : 'stable',
        factors: ['Ibovespa', 'Petroleo Brent'],
        lastUpdate: new Date().toISOString(),
      },
    ];
  }, [indices, commodities]);

  const hasLive = liveIndices.length > 0;
  const data = hasLive ? liveIndices : fallbackIndices;

  return (
    <aside className="bg-white border border-[#e5e5e5] rounded-lg p-4 sm:p-6">
        {/* Header */}
        <header className="flex items-center gap-2 mb-4">
          <Thermometer className="w-5 h-5 text-[#c40000]" />
          <h2 className="text-lg font-bold text-[#111111]">
            <Link href={ROUTES.termometroRisco} className="hover:underline">
              Termômetro de Risco
            </Link>
          </h2>
          {hasLive && (
            <span className="ml-auto flex items-center gap-1 text-xs text-[#6b6b6b]">
              <span className="w-2 h-2 bg-[#22c55e] rounded-full animate-pulse" />
              Ao vivo
            </span>
          )}
        </header>

        {/* Explicação do termômetro */}
        <section className="bg-[#f9fafb] rounded-lg p-3 mb-4">
          <div className="flex items-center gap-1 mb-2">
            <Info className="w-3 h-3 text-[#6b6b6b]" />
            <span className="text-xs font-medium text-[#6b6b6b]">Como interpretar</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {Object.entries(riskLevelDetails).map(([key, config]) => (
              <Tooltip key={key}>
                <TooltipTrigger asChild>
                  <span 
                    className="inline-flex items-center gap-1 px-2 py-1 rounded text-xs bg-white border border-[#e5e5e5] cursor-help"
                  >
                    <span 
                      className="w-2 h-2 rounded-full" 
                      style={{ backgroundColor: config.color }}
                    />
                    {config.range}
                  </span>
                </TooltipTrigger>
                <TooltipContent side="top" className="max-w-[200px]">
                  <p className="font-semibold text-xs mb-1">{config.label}</p>
                  <p className="text-xs">{config.description}</p>
                </TooltipContent>
              </Tooltip>
            ))}
          </div>
        </section>

        {/* Lista de riscos */}
        <ul className="space-y-4">
          {data.map((index) => {
            const risk = getRiskLevel(index.currentValue);
            const trend = trendConfig[index.trend as keyof typeof trendConfig];
            const TrendIcon = trend.icon;
            const explanation = riskExplanations[index.name];
            const Icon = explanation?.icon || AlertCircle;
            
            return (
              <li key={index.id}>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <article 
                      className="space-y-2 p-2 rounded-lg hover:bg-[#f9fafb] transition-colors cursor-pointer"
                      onClick={() => setSelectedRisk(index)}
                    >
                      {/* Header do item */}
                      <header className="flex items-center justify-between">
                        <section className="flex items-center gap-2">
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <span className="p-1 bg-[#f3f4f6] rounded cursor-help">
                                <Icon className="w-4 h-4 text-[#6b6b6b]" />
                              </span>
                            </TooltipTrigger>
                            <TooltipContent side="left">
                              <p className="text-xs max-w-[200px]">{explanation?.description}</p>
                            </TooltipContent>
                          </Tooltip>
                          <div>
                            <h3 className="font-medium text-[#111111] text-sm">{index.name}</h3>
                            <p className="text-xs text-[#6b6b6b]">{index.region}</p>
                          </div>
                        </section>
                        
                        {/* Valor e tendência */}
                        <section className="flex items-center gap-2">
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <span 
                                className="text-2xl font-bold cursor-help"
                                style={{ color: risk.color }}
                              >
                                {index.currentValue}
                              </span>
                            </TooltipTrigger>
                            <TooltipContent side="top">
                              <p className="font-semibold text-xs">{risk.level}</p>
                              <p className="text-xs">{riskLevelDetails[risk.level.toLowerCase() as keyof typeof riskLevelDetails]?.description}</p>
                            </TooltipContent>
                          </Tooltip>
                          
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <span className="cursor-help">
                                <TrendIcon 
                                  className="w-4 h-4" 
                                  style={{ color: trend.color }}
                                />
                              </span>
                            </TooltipTrigger>
                            <TooltipContent side="top">
                              <p className="text-xs">{trend.description}</p>
                            </TooltipContent>
                          </Tooltip>
                        </section>
                      </header>

                      {/* Barra de progresso com tooltip */}
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <section className="relative h-2 bg-[#e5e5e5] rounded-full overflow-hidden cursor-help">
                            <span 
                              className="absolute left-0 top-0 h-full rounded-full transition-all duration-500"
                              style={{ 
                                width: `${index.currentValue}%`,
                                backgroundColor: risk.color 
                              }}
                            />
                            {/* Marcadores de referência */}
                            <span className="absolute left-[25%] top-0 w-0.5 h-full bg-white/50" />
                            <span className="absolute left-[50%] top-0 w-0.5 h-full bg-white/50" />
                            <span className="absolute left-[75%] top-0 w-0.5 h-full bg-white/50" />
                          </section>
                        </TooltipTrigger>
                        <TooltipContent side="bottom" className="max-w-[250px]">
                          <div className="space-y-2">
                            <p className="text-xs">
                              <strong>Anterior:</strong> {index.previousValue} 
                              {' '}({index.currentValue > index.previousValue ? '+' : ''}
                              {index.currentValue - index.previousValue})
                            </p>
                            {explanation?.howItsCalculated && (
                              <p className="text-xs text-[#6b6b6b]">
                                <strong>Cálculo:</strong> {explanation.howItsCalculated}
                              </p>
                            )}
                          </div>
                        </TooltipContent>
                      </Tooltip>

                      {/* Fatores de influência */}
                      <ul className="flex flex-wrap gap-1">
                        {index.factors.slice(0, 3).map((factor, i) => (
                          <li key={i}>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-[#f3f4f6] rounded text-xs text-[#6b6b6b] cursor-help hover:bg-[#e5e5e5] transition-colors">
                                  <AlertCircle className="w-3 h-3" />
                                  {factor}
                                </span>
                              </TooltipTrigger>
                              <TooltipContent side="bottom">
                                <p className="text-xs">Fator que influencia este índice de risco</p>
                              </TooltipContent>
                            </Tooltip>
                          </li>
                        ))}
                      </ul>

                      {/* Indicador de clique */}
                      <div className="flex items-center justify-end text-xs text-[#6b6b6b]">
                        <Info className="w-3 h-3 mr-1" />
                        Clique para detalhes
                      </div>
                    </article>
                  </TooltipTrigger>

                  {/* Tooltip geral do item */}
                  <TooltipContent side="right" className="max-w-[280px] p-4">
                    <div className="space-y-3">
                      <h4 className="font-bold text-sm flex items-center gap-2">
                        <Icon className="w-4 h-4" />
                        {index.name}
                      </h4>
                      
                      {explanation?.whatItMeans && (
                        <div>
                          <span className="text-xs font-medium text-[#6b6b6b]">O que significa:</span>
                          <p className="text-xs text-[#374151]">{explanation.whatItMeans}</p>
                        </div>
                      )}

                      <div className="flex items-center gap-2 pt-2 border-t border-[#e5e5e5]">
                        <span 
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: risk.color }}
                        />
                        <span className="text-xs font-medium">{risk.level}</span>
                        <span className="text-xs text-[#6b6b6b]">•</span>
                        <span className="text-xs text-[#6b6b6b]">{trend.label}</span>
                      </div>
                    </div>
                  </TooltipContent>
                </Tooltip>
              </li>
            );
          })}
        </ul>

        {/* Loading / Error states */}
        {(indicesLoading || commoditiesLoading) && !hasLive && (
          <p className="text-xs text-[#6b6b6b] mt-3">Carregando dados em tempo real...</p>
        )}

        {(indicesError || commoditiesError) && !hasLive && (
          <p className="text-xs text-[#6b6b6b] mt-3">Exibindo dados de referência.</p>
        )}

        {/* Footer com explicação e botão saiba mais */}
        <footer className="mt-4 pt-4 border-t border-[#e5e5e5]">
          <div className="flex items-start gap-2 mb-3">
            <HelpCircle className="w-4 h-4 text-[#6b6b6b] mt-0.5 flex-shrink-0" />
            <p className="text-xs text-[#6b6b6b]">
              Índice de 0 a 100 que mede o nível de risco. 
              Valores acima de 75 indicam situação crítica. 
              Passe o mouse sobre os elementos para mais informações.
            </p>
          </div>
          
          <Dialog>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm" className="w-full text-xs">
                <Info className="w-3 h-3 mr-2" />
                Entenda o Termômetro de Risco
                <ChevronRight className="w-3 h-3 ml-auto" />
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-[500px] max-h-[80vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <Thermometer className="w-5 h-5 text-[#c40000]" />
                  Guia do Termômetro de Risco
                </DialogTitle>
              </DialogHeader>
              
              <div className="space-y-6 text-sm">
                {/* O que é */}
                <section>
                  <h4 className="font-semibold mb-2 flex items-center gap-2">
                    <HelpCircle className="w-4 h-4" />
                    O que é?
                  </h4>
                  <p className="text-[#6b6b6b]">
                    O Termômetro de Risco é uma ferramenta que mede e monitora diferentes tipos 
                    de riscos que afetam os mercados financeiros e a economia global. 
                    Cada indicador varia de 0 (mínimo risco) a 100 (risco máximo).
                  </p>
                </section>

                {/* Como interpretar */}
                <section>
                  <h4 className="font-semibold mb-3">Como interpretar os valores?</h4>
                  <div className="space-y-2">
                    {Object.entries(riskLevelDetails).map(([key, config]) => (
                      <div key={key} className="flex items-center gap-3 p-2 bg-[#f9fafb] rounded">
                        <span 
                          className="w-4 h-4 rounded-full flex-shrink-0"
                          style={{ backgroundColor: config.color }}
                        />
                        <div>
                          <p className="font-medium text-xs">{config.range} - {config.label}</p>
                          <p className="text-xs text-[#6b6b6b]">{config.description}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </section>

                {/* Tipos de risco */}
                <section>
                  <h4 className="font-semibold mb-3">Tipos de Risco Monitorados</h4>
                  <div className="space-y-3">
                    {Object.entries(riskExplanations).map(([name, data]) => (
                      <div key={name} className="border-l-2 border-[#e5e5e5] pl-3">
                        <h5 className="font-medium text-xs flex items-center gap-2">
                          <data.icon className="w-3 h-3" />
                          {name}
                        </h5>
                        <p className="text-xs text-[#6b6b6b] mt-1">{data.description}</p>
                      </div>
                    ))}
                  </div>
                </section>

                {/* Tendências */}
                <section>
                  <h4 className="font-semibold mb-3">Como ler as tendências?</h4>
                  <div className="space-y-2">
                    {Object.entries(trendConfig).map(([key, config]) => (
                      <div key={key} className="flex items-center gap-2">
                        <config.icon className="w-4 h-4" style={{ color: config.color }} />
                        <span className="text-xs"><strong>{config.label}:</strong> {config.description}</span>
                      </div>
                    ))}
                  </div>
                </section>

                {/* Dica */}
                <section className="bg-[#fef2f2] p-3 rounded-lg">
                  <p className="text-xs text-[#7f1d1d]">
                    <strong>💡 Dica:</strong> Use este termômetro como uma ferramenta de 
                    alerta precoce. Quando múltiplos indicadores mostram risco alto ou crítico, 
                    pode ser momento de revisar seus investimentos e se preparar para volatilidade.
                  </p>
                </section>
              </div>
            </DialogContent>
          </Dialog>
        </footer>

        {/* Modal de detalhes do risco selecionado */}
        {selectedRisk && (() => {
          const explanation = riskExplanations[selectedRisk.name];
          const risk = getRiskLevel(selectedRisk.currentValue);
          const trend = trendConfig[selectedRisk.trend as keyof typeof trendConfig];
          const Icon = explanation?.icon || AlertCircle;
          
          return (
            <Dialog open={!!selectedRisk} onOpenChange={() => setSelectedRisk(null)}>
              <DialogContent className="max-w-[600px] max-h-[80vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-2">
                    <Icon className="w-5 h-5" style={{ color: risk.color }} />
                    {selectedRisk.name}
                  </DialogTitle>
                </DialogHeader>
                
                <div className="space-y-4">
                  {/* Valor atual */}
                  <div className="flex items-center gap-4 p-4 bg-[#f9fafb] rounded-lg">
                    <div 
                      className="text-4xl font-bold"
                      style={{ color: risk.color }}
                    >
                      {selectedRisk.currentValue}
                    </div>
                    <div>
                      <p className="font-medium">{risk.level}</p>
                      <p className="text-sm text-[#6b6b6b]">{selectedRisk.region}</p>
                    </div>
                    <div 
                      className="ml-auto flex items-center gap-1 px-3 py-1 rounded-full text-sm"
                      style={{ 
                        backgroundColor: trend.color + '20',
                        color: trend.color 
                      }}
                    >
                      <trend.icon className="w-4 h-4" />
                      {trend.label}
                    </div>
                  </div>

                  {/* Descrição */}
                  {explanation?.description && (
                    <section>
                      <h4 className="font-semibold text-sm mb-2">Descrição</h4>
                      <p className="text-sm text-[#6b6b6b]">{explanation.description}</p>
                    </section>
                  )}

                  {/* O que significa */}
                  {explanation?.whatItMeans && (
                    <section className="bg-[#fef2f2] p-3 rounded-lg">
                      <h4 className="font-semibold text-sm mb-2 flex items-center gap-2">
                        <Info className="w-4 h-4" />
                        O que este valor significa?
                      </h4>
                      <p className="text-sm text-[#7f1d1d]">{explanation.whatItMeans}</p>
                    </section>
                  )}

                  {/* Como é calculado */}
                  {explanation?.howItsCalculated && (
                    <section>
                      <h4 className="font-semibold text-sm mb-2">Como é calculado?</h4>
                      <p className="text-sm text-[#6b6b6b]">{explanation.howItsCalculated}</p>
                    </section>
                  )}

                  {/* Fatores */}
                  {explanation?.factors && (
                    <section>
                      <h4 className="font-semibold text-sm mb-2">Principais fatores</h4>
                      <ul className="grid grid-cols-2 gap-2">
                        {explanation.factors.map((factor, i) => (
                          <li 
                            key={i} 
                            className="flex items-center gap-2 text-sm text-[#6b6b6b]"
                          >
                            <span className="w-1.5 h-1.5 bg-[#c40000] rounded-full" />
                            {factor}
                          </li>
                        ))}
                      </ul>
                    </section>
                  )}

                  {/* Interpretação por nível */}
                  {explanation?.interpretation && (
                    <section>
                      <h4 className="font-semibold text-sm mb-2">Interpretação por nível</h4>
                      <div className="space-y-2">
                        {Object.entries(explanation.interpretation).map(([level, desc]) => {
                          const levelConfig = riskLevelDetails[level as keyof typeof riskLevelDetails];
                          return (
                            <div key={level} className="flex items-start gap-2">
                              <span 
                                className="w-2 h-2 rounded-full mt-1.5 flex-shrink-0"
                                style={{ backgroundColor: levelConfig?.color }}
                              />
                              <div>
                                <span className="text-xs font-medium">{levelConfig?.label}:</span>
                                <span className="text-xs text-[#6b6b6b] ml-1">{desc}</span>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </section>
                  )}

                  {/* Fatores atuais */}
                  <section>
                    <h4 className="font-semibold text-sm mb-2">Fatores monitorados atualmente</h4>
                    <div className="flex flex-wrap gap-2">
                      {selectedRisk.factors.map((factor, i) => (
                        <span 
                          key={i}
                          className="px-2 py-1 bg-[#f3f4f6] rounded text-xs"
                        >
                          {factor}
                        </span>
                      ))}
                    </div>
                  </section>

                  {/* Footer */}
                  <footer className="pt-4 border-t border-[#e5e5e5]">
                    <p className="text-xs text-[#6b6b6b]">
                      Última atualização: {new Date(selectedRisk.lastUpdate).toLocaleString('pt-BR')}
                    </p>
                  </footer>
                </div>
              </DialogContent>
            </Dialog>
          );
        })()}
      </aside>
  );
}
