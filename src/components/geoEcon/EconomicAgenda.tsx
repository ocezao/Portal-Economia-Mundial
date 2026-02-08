/**
 * Agenda Econômica
 * Calendário de eventos econômicos importantes - Dados reais da Finnhub API
 */

import { Calendar, Clock, AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useEconomicCalendar } from '@/hooks/economics';
import { Skeleton } from '@/components/ui/skeleton';

export function EconomicAgenda() {
  const { events, isLoading, error } = useEconomicCalendar(undefined, 5);

  if (error && events.length === 0) {
    return (
      <aside className="bg-white border border-[#e5e5e5] rounded-lg p-4">
        <header className="flex items-center gap-2 mb-4">
          <Calendar className="w-5 h-5 text-[#c40000]" />
          <h2 className="text-lg font-bold text-[#111111]">Agenda Econômica</h2>
        </header>
        <p className="text-sm text-[#6b6b6b] text-center py-4">
          Dados temporariamente indisponíveis
        </p>
      </aside>
    );
  }

  // Agrupar por data
  const grouped = events.slice(0, 5).reduce((acc: Record<string, typeof events>, event) => {
    if (!acc[event.date]) acc[event.date] = [];
    acc[event.date].push(event);
    return acc;
  }, {} as Record<string, typeof events>);

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    if (date.toDateString() === today.toDateString()) {
      return 'Hoje';
    }
    if (date.toDateString() === tomorrow.toDateString()) {
      return 'Amanhã';
    }
    
    return date.toLocaleDateString('pt-BR', {
      weekday: 'short',
      day: 'numeric',
      month: 'short',
    });
  };

  const impactConfig = {
    low: { color: '#6b6b6b', label: 'Baixo' },
    medium: { color: '#f59e0b', label: 'Médio' },
    high: { color: '#c40000', label: 'Alto' },
  };

  const categoryIcons: Record<string, string> = {
    indicador: '📊',
    politica: '🏛️',
    reuniao: '👥',
    resultado: '📄',
  };

  const countryFlags: Record<string, string> = {
    US: '🇺🇸',
    BR: '🇧🇷',
    EU: '🇪🇺',
    CN: '🇨🇳',
    JP: '🇯🇵',
    UK: '🇬🇧',
    DE: '🇩🇪',
    FR: '🇫🇷',
    CA: '🇨🇦',
    AU: '🇦🇺',
  };

  return (
    <aside className="bg-white border border-[#e5e5e5] rounded-lg p-4">
      <header className="flex items-center gap-2 mb-4">
        <Calendar className="w-5 h-5 text-[#c40000]" />
        <h2 className="text-lg font-bold text-[#111111]">Agenda Econômica</h2>
        {events.length > 5 && (
          <span className="ml-auto text-xs text-[#6b6b6b]">
            +{events.length - 5} eventos
          </span>
        )}
      </header>

      {isLoading ? (
        <ul className="space-y-3">
          {[1, 2, 3].map((i) => (
            <li key={i}>
              <Skeleton className="h-20 w-full" />
            </li>
          ))}
        </ul>
      ) : (
        <ul className="space-y-4">
          {Object.entries(grouped).map(([date, dateEvents]) => (
            <li key={date}>
              <section>
                <h3 className="text-sm font-semibold text-[#6b6b6b] mb-2 uppercase">
                  {formatDate(date)}
                </h3>
                <ul className="space-y-2">
                  {(dateEvents as typeof events).map((event) => {
                    const impact = impactConfig[event.impact as keyof typeof impactConfig] || impactConfig.low;
                    
                    return (
                      <li key={event.id}>
                        <article className="flex items-start gap-3 p-3 bg-[#f9fafb] rounded-lg">
                          <section 
                            className={cn(
                              "w-8 h-8 rounded-full bg-white flex items-center justify-center flex-shrink-0",
                              event.impact === 'high' && "bg-[#fef2f2]",
                              event.impact === 'medium' && "bg-[#fef3c7]",
                              event.impact === 'low' && "bg-[#f5f5f5]"
                            )}
                            aria-hidden="true"
                          >
                            <span className="text-sm">{categoryIcons[event.category] || '📊'}</span>
                          </section>
                          <section className="flex-1 min-w-0">
                            <header className="flex items-start justify-between gap-2">
                              <h4 className="font-medium text-[#111111] text-sm">
                                {event.title}
                              </h4>
                              <span 
                                className={cn(
                                  "px-1.5 py-0.5 rounded text-xs font-medium flex-shrink-0",
                                  event.impact === 'high' && "bg-[#fef2f2] text-[#c40000]",
                                  event.impact === 'medium' && "bg-[#fef3c7] text-[#b45309]",
                                  event.impact === 'low' && "bg-[#f5f5f5] text-[#6b6b6b]"
                                )}
                              >
                                {impact.label}
                              </span>
                            </header>
                            <p className="text-xs text-[#6b6b6b] mt-0.5">
                              {event.description}
                            </p>
                            <footer className="flex items-center gap-3 mt-2 text-xs text-[#6b6b6b]">
                              <span className="flex items-center gap-1">
                                <Clock className="w-3 h-3" />
                                {event.time}
                              </span>
                              <span className="text-lg" title={event.country}>
                                {countryFlags[event.country] || event.country}
                              </span>
                            </footer>
                          </section>
                        </article>
                      </li>
                    );
                  })}
                </ul>
              </section>
            </li>
          ))}
        </ul>
      )}

      {(events as {impact: string}[]).some((e: {impact: string}) => e.impact === 'high') && (
        <footer className="mt-4 pt-4 border-t border-[#e5e5e5]">
          <p className="flex items-center gap-1.5 text-xs text-[#c40000]">
            <AlertTriangle className="w-3.5 h-3.5" />
            Eventos de alto impacto podem causar volatilidade
          </p>
        </footer>
      )}
    </aside>
  );
}
