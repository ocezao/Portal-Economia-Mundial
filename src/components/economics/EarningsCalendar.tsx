/**
 * Earnings Calendar
 * Calendário de resultados trimestrais com explicações e tooltips
 */

import { useState, useMemo } from 'react';
import { 
  TrendingUp, 
  Calendar, 
  Clock, 
  DollarSign, 
  Building2, 
  Info,
  HelpCircle,
  ChevronRight,
  BarChart3,
  AlertCircle,
  ArrowUpRight,
  ArrowDownRight,

} from 'lucide-react';
import type { EarningsEvent } from '@/services/economics/finnhubService';
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

// Configuração de períodos de earnings
const earningsPeriodConfig = {
  bmo: {
    label: 'Antes da Abertura',
    shortLabel: 'Antes',
    color: '#3b82f6',
    bgColor: '#dbeafe',
    description: 'Resultado divulgado antes do mercado abrir (antes das 9:30 ET)',
    impact: 'Alta volatilidade no pre-market. Reação imediata no opening bell.',
    tradingHours: 'Mercado fechado - negociação no pre-market'
  },
  amc: {
    label: 'Depois do Fechamento',
    shortLabel: 'Depois',
    color: '#f59e0b',
    bgColor: '#fef3c7',
    description: 'Resultado divulgado após o fechamento do mercado (após as 16:00 ET)',
    impact: 'Volatilidade no after-hours. Preço pode gap na abertura do dia seguinte.',
    tradingHours: 'Mercado fechado - negociação no after-hours'
  },
  dmh: {
    label: 'Durante o Pregão',
    shortLabel: 'Durante',
    color: '#6b7280',
    bgColor: '#f3f4f6',
    description: 'Resultado divulgado durante o horário regular de negociação',
    impact: 'Reação imediata da ação durante o pregão. Alta volatilidade intraday.',
    tradingHours: 'Mercado aberto - reação em tempo real'
  }
};

// Configuração de métricas com explicações
const metricsConfig = {
  eps: {
    label: 'EPS (Lucro por Ação)',
    shortLabel: 'EPS',
    description: 'Lucro líquido da empresa dividido pelo número total de ações em circulação.',
    whatItMeans: 'Indica a rentabilidade da empresa por cada ação. Quanto maior, melhor.',
    howToRead: 'Compare o valor real (actual) com a expectativa (estimate):',
    beat: 'Acima da expectativa = positivo para a ação',
    miss: 'Abaixo da expectativa = negativo para a ação',
    icon: DollarSign
  },
  revenue: {
    label: 'Receita',
    shortLabel: 'Receita',
    description: 'Total de vendas/faturamento da empresa no período.',
    whatItMeans: 'Mostra o tamanho do negócio e capacidade de gerar vendas.',
    howToRead: 'Crescimento de receita indica expansão do negócio.',
    beat: 'Receita acima do esperado = demanda forte',
    miss: 'Receita abaixo do esperado = demanda fraca',
    icon: BarChart3
  }
};

// Função para determinar se bateu ou não a expectativa
function isFiniteNumber(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value);
}

function getEarningsResult(event: EarningsEvent): {
  eps: 'beat' | 'miss' | 'neutral' | 'unknown';
  revenue: 'beat' | 'miss' | 'neutral' | 'unknown';
  epsDiff: number;
  revenueDiff: number;
} {
  if (!isFiniteNumber(event.epsActual) || !isFiniteNumber(event.epsEstimate)) {
    return { eps: 'unknown', revenue: 'unknown', epsDiff: 0, revenueDiff: 0 };
  }
  
  const epsDiff = event.epsActual - event.epsEstimate;
  const revenueActual = isFiniteNumber(event.revenueActual) ? event.revenueActual : 0;
  const revenueEstimate = isFiniteNumber(event.revenueEstimate) ? event.revenueEstimate : 0;
  const revenueDiff = revenueActual - revenueEstimate;
  
  return {
    eps: epsDiff > 0 ? 'beat' : epsDiff < 0 ? 'miss' : 'neutral',
    revenue: revenueDiff > 0 ? 'beat' : revenueDiff < 0 ? 'miss' : 'neutral',
    epsDiff,
    revenueDiff
  };
}

// Formatar valor em milhões/bilhões
function formatCurrency(value: number | null | undefined): string {
  if (!isFiniteNumber(value)) return '-';
  if (value >= 1_000_000_000) {
    return `$${(value / 1_000_000_000).toFixed(1)}B`;
  }
  if (value >= 1_000_000) {
    return `$${(value / 1_000_000).toFixed(1)}M`;
  }
  return `$${value.toFixed(1)}M`;
}

interface EarningsCalendarProps {
  earnings: EarningsEvent[];
  title?: string;
  showViewAll?: boolean;
}

export function EarningsCalendar({ 
  earnings, 
  title = 'Earnings Esta Semana',

}: EarningsCalendarProps) {
  const [selectedEarning, setSelectedEarning] = useState<EarningsEvent | null>(null);

  // Agrupar earnings por data
  const groupedByDate = useMemo(() => {
    const groups: Record<string, EarningsEvent[]> = {};
    earnings.forEach(event => {
      if (!groups[event.date]) {
        groups[event.date] = [];
      }
      groups[event.date].push(event);
    });
    return groups;
  }, [earnings]);

  // Ordenar datas
  const sortedDates = useMemo(() => {
    return Object.keys(groupedByDate).sort();
  }, [groupedByDate]);

  if (earnings.length === 0) {
    return null;
  }

  return (
    <aside className="bg-white border border-[#e5e5e5] rounded-xl p-4 sm:p-6">
        {/* Header */}
        <header className="flex items-center gap-2 mb-4">
          <TrendingUp className="w-5 h-5 text-[#c40000]" />
          <h2 className="text-lg font-bold text-[#111111]">
            {title}
          </h2>
        </header>

        {/* Explicação rápida */}
        <section className="bg-[#f9fafb] rounded-lg p-3 mb-4">
          <div className="flex items-center gap-1 mb-2">
            <Info className="w-3 h-3 text-[#6b6b6b]" />
            <span className="text-xs font-medium text-[#6b6b6b]">Horários de divulgação</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {Object.entries(earningsPeriodConfig).map(([key, config]) => (
              <Tooltip key={key}>
                <TooltipTrigger asChild>
                  <span 
                    className="inline-flex items-center gap-1 px-2 py-1 rounded text-xs cursor-help"
                    style={{ 
                      backgroundColor: config.bgColor,
                      color: config.color
                    }}
                  >
                    <Clock className="w-3 h-3" />
                    {config.shortLabel}
                  </span>
                </TooltipTrigger>
                <TooltipContent side="top" className="max-w-[250px]">
                  <p className="font-semibold text-xs mb-1">{config.label}</p>
                  <p className="text-xs">{config.description}</p>
                </TooltipContent>
              </Tooltip>
            ))}
          </div>
        </section>

        {/* Lista de earnings agrupados por data */}
        <div className="space-y-4">
          {sortedDates.map(date => {
            const dateEvents = groupedByDate[date];
            const dateObj = new Date(date);
            const isToday = new Date().toDateString() === dateObj.toDateString();
            const isTomorrow = new Date(Date.now() + 86400000).toDateString() === dateObj.toDateString();
            
            return (
              <section key={date} className="space-y-2">
                {/* Data */}
                <header className="flex items-center gap-2 text-sm">
                  <Calendar className="w-4 h-4 text-[#c40000]" />
                  <span className="font-medium">
                    {isToday ? 'Hoje' : isTomorrow ? 'Amanhã' : dateObj.toLocaleDateString('pt-BR', { 
                      weekday: 'long', 
                      day: 'numeric',
                      month: 'short'
                    })}
                  </span>
                  {isToday && (
                    <span className="text-xs px-2 py-0.5 bg-[#c40000] text-white rounded-full">
                      Hoje
                    </span>
                  )}
                </header>

                {/* Empresas desta data */}
                <ul className="space-y-2">
                  {dateEvents.map((item) => {
                    const period = earningsPeriodConfig[item.hour as keyof typeof earningsPeriodConfig] || earningsPeriodConfig.dmh;
                    const result = getEarningsResult(item);
                    
                    return (
                      <li key={`${item.symbol}-${item.date}`}>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <article 
                              className="flex items-center justify-between p-2 bg-[#f6f3ef] rounded-lg hover:bg-[#ede9e3] transition-colors cursor-pointer"
                              onClick={() => setSelectedEarning(item)}
                            >
                              {/* Info da empresa */}
                              <div className="flex items-center gap-2">
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <span className="p-1.5 bg-white rounded cursor-help">
                                      <Building2 className="w-3.5 h-3.5 text-[#6b6b6b]" />
                                    </span>
                                  </TooltipTrigger>
                                  <TooltipContent side="left">
                                    <p className="text-xs">Empresa listada na bolsa</p>
                                  </TooltipContent>
                                </Tooltip>
                                
                                <div>
                                  <span className="font-bold text-[#111111] text-sm">{item.symbol}</span>
                                  
                                  {/* Indicadores de resultado (se disponível) */}
                                  {(item.epsActual !== undefined) && (
                                    <div className="flex items-center gap-1 mt-0.5">
                                      {result.eps === 'beat' && (
                                        <span className="inline-flex items-center gap-0.5 text-[10px] text-green-600">
                                          <ArrowUpRight className="w-3 h-3" />
                                          EPS
                                        </span>
                                      )}
                                      {result.eps === 'miss' && (
                                        <span className="inline-flex items-center gap-0.5 text-[10px] text-red-600">
                                          <ArrowDownRight className="w-3 h-3" />
                                          EPS
                                        </span>
                                      )}
                                      {result.revenue === 'beat' && (
                                        <span className="inline-flex items-center gap-0.5 text-[10px] text-green-600">
                                          <ArrowUpRight className="w-3 h-3" />
                                          Receita
                                        </span>
                                      )}
                                      {result.revenue === 'miss' && (
                                        <span className="inline-flex items-center gap-0.5 text-[10px] text-red-600">
                                          <ArrowDownRight className="w-3 h-3" />
                                          Receita
                                        </span>
                                      )}
                                    </div>
                                  )}
                                </div>
                              </div>

                              {/* Badge de horário */}
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <span 
                                    className="text-xs px-2 py-1 rounded cursor-help"
                                    style={{
                                      backgroundColor: period.bgColor,
                                      color: period.color
                                    }}
                                  >
                                    {period.shortLabel}
                                  </span>
                                </TooltipTrigger>
                                <TooltipContent side="top" className="max-w-[220px]">
                                  <p className="font-semibold text-xs mb-1">{period.label}</p>
                                  <p className="text-xs">{period.description}</p>
                                  <p className="text-xs mt-1 text-[#6b6b6b]">{period.impact}</p>
                                </TooltipContent>
                              </Tooltip>
                            </article>
                          </TooltipTrigger>

                          {/* Tooltip geral do item */}
                          <TooltipContent side="right" className="max-w-[280px] p-4">
                            <div className="space-y-3">
                              <h4 className="font-bold text-sm flex items-center gap-2">
                                <Building2 className="w-4 h-4" />
                                {item.symbol}
                              </h4>
                              
                              <div className="text-xs text-[#6b6b6b]">
                                <p><strong>Data:</strong> {new Date(item.date).toLocaleDateString('pt-BR', { 
                                  weekday: 'long',
                                  day: 'numeric',
                                  month: 'long'
                                })}</p>
                                <p><strong>Horário:</strong> {period.label}</p>
                              </div>

                              {/* Métricas se disponíveis */}
                              {(item.epsEstimate != null || item.epsActual != null) && (
                                <div className="pt-2 border-t border-[#e5e5e5]">
                                  <p className="text-xs font-medium mb-1">Resultados:</p>
                                  
                                  {isFiniteNumber(item.epsEstimate) && (
                                    <div className="flex items-center justify-between text-xs">
                                      <span className="text-[#6b6b6b]">EPS Esperado:</span>
                                      <span className="font-medium">${item.epsEstimate.toFixed(2)}</span>
                                    </div>
                                  )}
                                  
                                  {isFiniteNumber(item.epsActual) && (
                                    <div className="flex items-center justify-between text-xs">
                                      <span className="text-[#6b6b6b]">EPS Real:</span>
                                      <span className={`font-medium ${
                                        result.eps === 'beat' ? 'text-green-600' : 
                                        result.eps === 'miss' ? 'text-red-600' : ''
                                      }`}>
                                        ${item.epsActual.toFixed(2)}
                                        {result.eps === 'beat' && ' ↑'}
                                        {result.eps === 'miss' && ' ↓'}
                                      </span>
                                    </div>
                                  )}

                                  {isFiniteNumber(item.revenueEstimate) && (
                                    <div className="flex items-center justify-between text-xs mt-1">
                                      <span className="text-[#6b6b6b]">Receita Esperada:</span>
                                      <span className="font-medium">{formatCurrency(item.revenueEstimate)}</span>
                                    </div>
                                  )}
                                  
                                  {isFiniteNumber(item.revenueActual) && (
                                    <div className="flex items-center justify-between text-xs">
                                      <span className="text-[#6b6b6b]">Receita Real:</span>
                                      <span className={`font-medium ${
                                        result.revenue === 'beat' ? 'text-green-600' : 
                                        result.revenue === 'miss' ? 'text-red-600' : ''
                                      }`}>
                                        {formatCurrency(item.revenueActual)}
                                        {result.revenue === 'beat' && ' ↑'}
                                        {result.revenue === 'miss' && ' ↓'}
                                      </span>
                                    </div>
                                  )}
                                </div>
                              )}

                              {/* Mensagem se ainda não divulgou */}
                              {!item.epsActual && (
                                <div className="pt-2 border-t border-[#e5e5e5]">
                                  <p className="text-xs text-[#6b6b6b] flex items-center gap-1">
                                    <AlertCircle className="w-3 h-3" />
                                    Resultado ainda não divulgado
                                  </p>
                                  <p className="text-xs text-[#6b6b6b] mt-1">
                                    Clique para ver detalhes completos
                                  </p>
                                </div>
                              )}
                            </div>
                          </TooltipContent>
                        </Tooltip>
                      </li>
                    );
                  })}
                </ul>
              </section>
            );
          })}
        </div>

        {/* Footer com guia */}
        <footer className="mt-4 pt-4 border-t border-[#e5e5e5]">
          <div className="flex items-start gap-2 mb-3">
            <HelpCircle className="w-4 h-4 text-[#6b6b6b] mt-0.5 flex-shrink-0" />
            <p className="text-xs text-[#6b6b6b]">
              Earnings são relatórios trimestrais de resultados das empresas. 
              Passe o mouse para ver horários e clique para detalhes completos.
            </p>
          </div>

          <Dialog>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm" className="w-full text-xs">
                <Info className="w-3 h-3 mr-2" />
                Entenda o Calendário de Earnings
                <ChevronRight className="w-3 h-3 ml-auto" />
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-[550px] max-h-[80vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-[#c40000]" />
                  Guia do Calendário de Earnings
                </DialogTitle>
              </DialogHeader>
              
              <div className="space-y-6 text-sm">
                {/* O que é */}
                <section>
                  <h4 className="font-semibold mb-2 flex items-center gap-2">
                    <HelpCircle className="w-4 h-4" />
                    O que são Earnings?
                  </h4>
                  <p className="text-[#6b6b6b]">
                    Earnings são os relatórios trimestrais de resultados financeiros que 
                    empresas listadas em bolsa são obrigadas a divulgar. Eles mostram 
                    receita, lucros, projeções e outros dados financeiros importantes.
                  </p>
                </section>

                {/* Horários de divulgação */}
                <section>
                  <h4 className="font-semibold mb-3">Quando são divulgados?</h4>
                  <div className="space-y-3">
                    {Object.entries(earningsPeriodConfig).map(([key, config]) => (
                      <div 
                        key={key} 
                        className="p-3 rounded-lg border-l-4"
                        style={{ 
                          backgroundColor: config.bgColor,
                          borderLeftColor: config.color
                        }}
                      >
                        <div className="flex items-center gap-2 mb-1">
                          <Clock className="w-4 h-4" style={{ color: config.color }} />
                          <span className="font-medium">{config.label}</span>
                        </div>
                        <p className="text-xs text-[#6b6b6b] mb-2">{config.description}</p>
                        <p className="text-xs"><strong>Impacto:</strong> {config.impact}</p>
                      </div>
                    ))}
                  </div>
                </section>

                {/* Métricas principais */}
                <section>
                  <h4 className="font-semibold mb-3">Principais Métricas</h4>
                  <div className="space-y-4">
                    {Object.entries(metricsConfig).map(([key, config]) => (
                      <div key={key} className="border-l-2 border-[#e5e5e5] pl-3">
                        <h5 className="font-medium text-sm flex items-center gap-2">
                          <config.icon className="w-4 h-4 text-[#c40000]" />
                          {config.label}
                        </h5>
                        <p className="text-xs text-[#6b6b6b] mt-1">{config.description}</p>
                        <p className="text-xs text-[#6b6b6b] mt-1"><strong>O que significa:</strong> {config.whatItMeans}</p>
                        
                        <div className="mt-2 space-y-1">
                          <p className="text-xs font-medium">Como interpretar:</p>
                          <div className="flex items-center gap-2">
                            <ArrowUpRight className="w-3 h-3 text-green-600" />
                            <span className="text-xs text-[#6b6b6b]">{config.beat}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <ArrowDownRight className="w-3 h-3 text-red-600" />
                            <span className="text-xs text-[#6b6b6b]">{config.miss}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </section>

                {/* Por que importa */}
                <section className="bg-[#fef2f2] p-4 rounded-lg">
                  <h4 className="font-semibold mb-2 text-[#7f1d1d]">
                    💡 Por que os Earnings importam?
                  </h4>
                  <ul className="space-y-2 text-xs text-[#7f1d1d]">
                    <li className="flex items-start gap-2">
                      <span className="mt-0.5">•</span>
                      <span><strong>Movimentam o mercado:</strong> Resultados acima ou abaixo do esperado causam grandes variações no preço das ações</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="mt-0.5">•</span>
                      <span><strong>Indicam saúde da economia:</strong> Empresas grandes (Apple, Amazon, Google) refletem a economia como um todo</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="mt-0.5">•</span>
                      <span><strong>Projeções de CEOs:</strong> As orientações futuras ditam o sentimento do mercado por meses</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="mt-0.5">•</span>
                      <span><strong>Oportunidades de trading:</strong> Volatilidade aumentada pode criar oportunidades (e riscos) para investidores</span>
                    </li>
                  </ul>
                </section>

                {/* Temporada de earnings */}
                <section>
                  <h4 className="font-semibold mb-2">Temporada de Earnings</h4>
                  <p className="text-xs text-[#6b6b6b]">
                    Empresas divulgam resultados trimestralmente, geralmente nas seguintes janelas:
                  </p>
                  <ul className="mt-2 space-y-1 text-xs">
                    <li className="flex items-center gap-2">
                      <Calendar className="w-3 h-3 text-[#c40000]" />
                      <strong>Q1:</strong> Janeiro - Março (divulgado em Abril)
                    </li>
                    <li className="flex items-center gap-2">
                      <Calendar className="w-3 h-3 text-[#c40000]" />
                      <strong>Q2:</strong> Abril - Junho (divulgado em Julho)
                    </li>
                    <li className="flex items-center gap-2">
                      <Calendar className="w-3 h-3 text-[#c40000]" />
                      <strong>Q3:</strong> Julho - Setembro (divulgado em Outubro)
                    </li>
                    <li className="flex items-center gap-2">
                      <Calendar className="w-3 h-3 text-[#c40000]" />
                      <strong>Q4:</strong> Outubro - Dezembro (divulgado em Janeiro)
                    </li>
                  </ul>
                </section>
              </div>
            </DialogContent>
          </Dialog>
        </footer>

        {/* Modal de detalhes do earning selecionado */}
        {selectedEarning && (() => {
          const period = earningsPeriodConfig[selectedEarning.hour as keyof typeof earningsPeriodConfig] || earningsPeriodConfig.dmh;
          const result = getEarningsResult(selectedEarning);
          
          return (
            <Dialog open={!!selectedEarning} onOpenChange={() => setSelectedEarning(null)}>
              <DialogContent className="max-w-[500px] max-h-[80vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-2">
                    <Building2 className="w-5 h-5" />
                    {selectedEarning.symbol}
                  </DialogTitle>
                </DialogHeader>
                
                <div className="space-y-4">
                  {/* Header com data e horário */}
                  <div className="flex items-center gap-4 p-4 bg-[#f9fafb] rounded-lg">
                    <div>
                      <p className="text-2xl font-bold">{selectedEarning.symbol}</p>
                      <p className="text-sm text-[#6b6b6b]">
                        {new Date(selectedEarning.date).toLocaleDateString('pt-BR', { 
                          weekday: 'long',
                          day: 'numeric',
                          month: 'long',
                          year: 'numeric'
                        })}
                      </p>
                    </div>
                    <div 
                      className="ml-auto px-3 py-1.5 rounded-full text-sm font-medium"
                      style={{ 
                        backgroundColor: period.bgColor,
                        color: period.color
                      }}
                    >
                      {period.label}
                    </div>
                  </div>

                  {/* Descrição do período */}
                  <section>
                    <h4 className="font-semibold text-sm mb-2 flex items-center gap-2">
                      <Clock className="w-4 h-4" />
                      Horário de Divulgação
                    </h4>
                    <p className="text-sm text-[#6b6b6b]">{period.description}</p>
                    <div className="mt-2 p-2 bg-[#fef3c7] rounded text-xs">
                      <strong>Impacto no mercado:</strong> {period.impact}
                    </div>
                  </section>

                  {/* Resultados (se disponíveis) */}
                  {(selectedEarning.epsActual != null || selectedEarning.epsEstimate != null) ? (
                    <section>
                      <h4 className="font-semibold text-sm mb-3 flex items-center gap-2">
                        <BarChart3 className="w-4 h-4" />
                        Resultados do Trimestre
                      </h4>
                      
                      {/* EPS */}
                      <div className="space-y-2 mb-4">
                        <div className="flex items-center justify-between">
                          <span className="text-sm">EPS (Lucro por Ação)</span>
                          {result.eps !== 'unknown' && (
                            <span className={`text-xs px-2 py-0.5 rounded ${
                              result.eps === 'beat' ? 'bg-green-100 text-green-700' :
                              result.eps === 'miss' ? 'bg-red-100 text-red-700' :
                              'bg-gray-100 text-gray-700'
                            }`}>
                              {result.eps === 'beat' ? 'Acima' : result.eps === 'miss' ? 'Abaixo' : 'Conforme'}
                            </span>
                          )}
                        </div>
                        
                        {isFiniteNumber(selectedEarning.epsEstimate) && (
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-[#6b6b6b]">Esperado:</span>
                            <span className="font-medium">${selectedEarning.epsEstimate.toFixed(2)}</span>
                          </div>
                        )}
                        
                        {isFiniteNumber(selectedEarning.epsActual) && (
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-[#6b6b6b]">Real:</span>
                            <span className={`font-bold text-lg ${
                              result.eps === 'beat' ? 'text-green-600' : 
                              result.eps === 'miss' ? 'text-red-600' : ''
                            }`}>
                              ${selectedEarning.epsActual.toFixed(2)}
                            </span>
                          </div>
                        )}

                        {result.epsDiff !== 0 && (
                          <div className="flex items-center justify-between text-xs">
                            <span className="text-[#6b6b6b]">Diferença:</span>
                            <span className={result.epsDiff > 0 ? 'text-green-600' : 'text-red-600'}>
                              {result.epsDiff > 0 ? '+' : ''}${result.epsDiff.toFixed(2)}
                            </span>
                          </div>
                        )}
                      </div>

                      {/* Receita */}
                      {(selectedEarning.revenueEstimate != null || selectedEarning.revenueActual != null) && (
                        <div className="space-y-2 pt-3 border-t border-[#e5e5e5]">
                          <div className="flex items-center justify-between">
                            <span className="text-sm">Receita</span>
                            {result.revenue !== 'unknown' && (
                              <span className={`text-xs px-2 py-0.5 rounded ${
                                result.revenue === 'beat' ? 'bg-green-100 text-green-700' :
                                result.revenue === 'miss' ? 'bg-red-100 text-red-700' :
                                'bg-gray-100 text-gray-700'
                              }`}>
                                {result.revenue === 'beat' ? 'Acima' : result.revenue === 'miss' ? 'Abaixo' : 'Conforme'}
                              </span>
                            )}
                          </div>
                          
                          {selectedEarning.revenueEstimate !== undefined && (
                            <div className="flex items-center justify-between text-sm">
                              <span className="text-[#6b6b6b]">Esperada:</span>
                              <span className="font-medium">{formatCurrency(selectedEarning.revenueEstimate)}</span>
                            </div>
                          )}
                          
                          {selectedEarning.revenueActual !== undefined && (
                            <div className="flex items-center justify-between text-sm">
                              <span className="text-[#6b6b6b]">Real:</span>
                              <span className={`font-bold text-lg ${
                                result.revenue === 'beat' ? 'text-green-600' : 
                                result.revenue === 'miss' ? 'text-red-600' : ''
                              }`}>
                                {formatCurrency(selectedEarning.revenueActual)}
                              </span>
                            </div>
                          )}
                        </div>
                      )}
                    </section>
                  ) : (
                    <section className="p-4 bg-[#f9fafb] rounded-lg">
                      <p className="text-sm text-[#6b6b6b] flex items-center gap-2">
                        <AlertCircle className="w-4 h-4" />
                        Resultados ainda não divulgados
                      </p>
                      <p className="text-xs text-[#6b6b6b] mt-1">
                        Os dados serão atualizados após a divulgação oficial da empresa.
                      </p>
                    </section>
                  )}

                  {/* O que esperar */}
                  <section className="bg-[#fef2f2] p-3 rounded-lg">
                    <h4 className="font-semibold text-sm mb-2 text-[#7f1d1d]">
                      💡 O que esperar?
                    </h4>
                    <ul className="space-y-1 text-xs text-[#7f1d1d]">
                      <li>• Resultados acima do esperado geralmente levam alta da ação</li>
                      <li>• Resultados abaixo do esperado geralmente levam queda da ação</li>
                      <li>• A reação pode ser imediata (gap) ou gradual</li>
                      <li>• Preste atenção também nas projeções futuras (guidance)</li>
                    </ul>
                  </section>

                  {/* Footer */}
                  <footer className="pt-3 border-t border-[#e5e5e5]">
                    <p className="text-xs text-[#6b6b6b]">
                      Dados fornecidos por Finnhub API
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
