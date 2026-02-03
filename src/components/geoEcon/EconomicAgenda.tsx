/**
 * Agenda Econômica
 * Calendário de eventos econômicos importantes
 */

import { Calendar, Clock, TrendingUp, Landmark, Users, FileText } from 'lucide-react';
import { economicAgenda, impactConfig } from '@/config/geoecon';

const categoryIcons = {
  indicador: TrendingUp,
  politica: Landmark,
  reuniao: Users,
  resultado: FileText,
};

export function EconomicAgenda() {
  // Agrupar por data
  const grouped = economicAgenda.reduce((acc, event) => {
    if (!acc[event.date]) acc[event.date] = [];
    acc[event.date].push(event);
    return acc;
  }, {} as Record<string, typeof economicAgenda>);

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('pt-BR', {
      weekday: 'short',
      day: 'numeric',
      month: 'short',
    });
  };

  return (
    <aside className="bg-white border border-[#e5e5e5] rounded-lg p-4 sm:p-6">
      <header className="flex items-center gap-2 mb-4">
        <Calendar className="w-5 h-5 text-[#c40000]" />
        <h2 className="text-lg font-bold text-[#111111]">Agenda Econômica</h2>
      </header>

      <ul className="space-y-4">
        {Object.entries(grouped).map(([date, events]) => (
          <li key={date}>
            <section>
              <h3 className="text-sm font-semibold text-[#6b6b6b] mb-2 uppercase">
                {formatDate(date)}
              </h3>
              <ul className="space-y-2">
                {events.map((event) => {
                  const Icon = categoryIcons[event.category];
                  const impact = impactConfig[event.impact];
                  
                  return (
                    <li key={event.id}>
                      <article className="flex items-start gap-3 p-3 bg-[#f9fafb] rounded-lg">
                        <section 
                          className="w-8 h-8 rounded-full bg-white flex items-center justify-center flex-shrink-0"
                          aria-hidden="true"
                        >
                          <Icon className="w-4 h-4 text-[#6b6b6b]" />
                        </section>
                        <section className="flex-1 min-w-0">
                          <header className="flex items-start justify-between gap-2">
                            <h4 className="font-medium text-[#111111] text-sm">
                              {event.title}
                            </h4>
                            <span 
                              className="px-1.5 py-0.5 rounded text-xs font-medium flex-shrink-0"
                              style={{ 
                                backgroundColor: `${impact.color}20`,
                                color: impact.color 
                              }}
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
                            <span className="uppercase font-medium">
                              {event.country}
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
    </aside>
  );
}
