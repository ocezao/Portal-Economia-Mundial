'use client';

import { ChevronLeft, ChevronRight, Clock, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { MONTH_NAMES, WEEK_DAYS_SHORT } from '@/config/constants';
import type { CalendarViewProps } from '../types';

export function CalendarView({
  currentMonth,
  scheduledArticles,
  onPrevMonth,
  onNextMonth,
  onDateClick,
  onEditScheduled,
  onCancelScheduled,
  onNewScheduled,
}: CalendarViewProps) {
  const getDaysInMonth = (date: Date): (number | null)[] => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDay = firstDay.getDay();

    const days: (number | null)[] = [];

    for (let i = 0; i < startingDay; i++) {
      days.push(null);
    }

    for (let i = 1; i <= daysInMonth; i++) {
      days.push(i);
    }

    return days;
  };

  const getScheduledForDate = (day: number) => {
    const dateStr = `${currentMonth.getFullYear()}-${String(currentMonth.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    return scheduledArticles.filter((s) => s.scheduledDate === dateStr);
  };

  const calendarDays = getDaysInMonth(currentMonth);

  return (
    <section className="space-y-4">
      <section className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
        {/* Calendário */}
        <article className="lg:col-span-2 bg-white border rounded-xl p-4 sm:p-6">
          <header className="flex items-center justify-between mb-4 sm:mb-6">
            <h2 className="text-lg font-bold text-[#111111]">
              {MONTH_NAMES[currentMonth.getMonth()]} {currentMonth.getFullYear()}
            </h2>
            <section className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={onPrevMonth}>
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <Button variant="outline" size="sm" onClick={onNextMonth}>
                <ChevronRight className="w-4 h-4" />
              </Button>
            </section>
          </header>

          {/* Dias da semana */}
          <section className="grid grid-cols-7 gap-1 mb-2">
            {WEEK_DAYS_SHORT.map((day) => (
              <section key={day} className="text-center text-xs sm:text-sm font-medium text-[#6b6b6b] py-2">
                {day}
              </section>
            ))}
          </section>

          {/* Dias do mês */}
          <section className="grid grid-cols-7 gap-1">
            {calendarDays.map((day, index) => {
              if (day === null) {
                return <section key={`empty-${index}`} className="aspect-square" />;
              }

              const scheduledForDay = getScheduledForDate(day);
              const hasScheduled = scheduledForDay.length > 0;

              return (
                <button
                  key={day}
                  onClick={() => hasScheduled && onDateClick(day)}
                  className={`aspect-square p-1 sm:p-2 rounded-lg border transition-all relative ${
                    hasScheduled
                      ? 'bg-blue-50 border-blue-300 hover:bg-blue-100 cursor-pointer'
                      : 'bg-white border-gray-100 hover:bg-gray-50'
                  }`}
                >
                  <span className="text-xs sm:text-sm font-medium">{day}</span>
                  {hasScheduled && (
                    <section className="absolute bottom-0.5 right-0.5 left-0.5">
                      <Badge className="w-full justify-center text-xs sm:text-xs bg-blue-600 text-white px-0.5">
                        {scheduledForDay.length}
                      </Badge>
                    </section>
                  )}
                </button>
              );
            })}
          </section>

          {/* Legenda */}
          <section className="flex items-center gap-4 mt-4 text-xs sm:text-sm text-[#6b6b6b]">
            <section className="flex items-center gap-2">
              <section className="w-4 h-4 bg-blue-50 border border-blue-300 rounded" />
              <span>Com agendamentos</span>
            </section>
          </section>
        </article>

        {/* Lista de Agendados */}
        <article className="bg-white border rounded-xl p-4 sm:p-6">
          <header className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-[#111111]">Agendamentos</h2>
            <Badge variant="secondary">{scheduledArticles.length}</Badge>
          </header>

          <section className="space-y-3 max-h-[400px] sm:max-h-[500px] overflow-y-auto">
            {scheduledArticles.length > 0 ? (
              scheduledArticles.map((scheduled) => (
                <article key={scheduled.id} className="p-3 bg-[#f8fafb] rounded-lg border">
                  <p className="font-medium text-sm line-clamp-1">{scheduled.articleData.title}</p>
                  <p className="text-xs text-[#6b6b6b] mt-1">
                    <Clock className="w-3 h-3 inline mr-1" />
                    {new Date(`${scheduled.scheduledDate}T${scheduled.scheduledTime}`).toLocaleString('pt-BR')}
                  </p>
                  <section className="flex flex-wrap gap-2 mt-2">
                    <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => onEditScheduled(scheduled)}>
                      Editar
                    </Button>
                    <Button size="sm" variant="outline" className="h-7 text-xs text-orange-600" onClick={() => onCancelScheduled(scheduled.id)}>
                      Cancelar
                    </Button>
                  </section>
                </article>
              ))
            ) : (
              <p className="text-center text-[#6b6b6b] py-8">Nenhum agendamento</p>
            )}
          </section>

          <Button className="w-full bg-blue-600 hover:bg-blue-700 gap-2 mt-4" onClick={onNewScheduled}>
            <Plus className="w-4 h-4" /> Agendar Novo
          </Button>
        </article>
      </section>
    </section>
  );
}
