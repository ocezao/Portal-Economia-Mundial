'use client';

import { FileText, CheckCircle, Zap, Star, Clock, TrendingUp, Plus, ArrowRight, Eye, Edit2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { DashboardStatsProps } from '../types';

export function DashboardStats({
  stats,
  topArticles,
  onNewArticle,
  onViewArticles,
  onViewCalendar,
  onManageUsers,
}: DashboardStatsProps) {
  const statItems = [
    { icon: FileText, label: 'Total', value: stats.total, color: 'text-[#3b82f6]', bg: 'bg-[#dbeafe]' },
    { icon: CheckCircle, label: 'Publicados', value: stats.published, color: 'text-[#22c55e]', bg: 'bg-[#dcfce7]' },
    { icon: Zap, label: 'Urgentes', value: stats.breaking, color: 'text-[#c40000]', bg: 'bg-[#fef2f2]' },
    { icon: Star, label: 'Destaques', value: stats.featured, color: 'text-[#a16207]', bg: 'bg-[#fef3c7]' },
    { icon: Clock, label: 'Agendados', value: stats.scheduled, color: 'text-blue-600', bg: 'bg-blue-50' },
    { icon: TrendingUp, label: 'Views', value: (stats.totalViews / 1000).toFixed(1) + 'k', color: 'text-[#111111]', bg: 'bg-gray-100' },
  ];

  return (
    <section className="space-y-4 sm:space-y-6">
      {/* Stats Grid - Responsivo */}
      <section className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 sm:gap-4">
        {statItems.map((stat, index) => (
          <article key={index} className={`p-3 sm:p-4 ${stat.bg} rounded-xl`}>
            <stat.icon className={`w-5 h-5 sm:w-6 sm:h-6 ${stat.color} mb-2`} />
            <p className="text-xl sm:text-2xl font-bold text-[#111111]">{stat.value}</p>
            <p className="text-xs text-[#6b6b6b]">{stat.label}</p>
          </article>
        ))}
      </section>

      {/* Grid Principal */}
      <section className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
        {/* Ações Rápidas */}
        <article className="bg-white border border-[#e5e5e5] rounded-xl p-4 sm:p-6">
          <h2 className="text-lg font-bold text-[#111111] mb-4">Ações Rápidas</h2>
          <ul className="space-y-2">
            <li>
              <Button className="w-full bg-[#c40000] hover:bg-[#a00000] gap-2" onClick={onNewArticle}>
                <Plus className="w-4 h-4" />
                Nova Notícia
              </Button>
            </li>
            <li>
              <Button variant="outline" className="w-full gap-2" onClick={onViewArticles}>
                <FileText className="w-4 h-4" />
                Lista de Notícias
              </Button>
            </li>
            <li>
              <Button variant="outline" className="w-full gap-2" onClick={onViewCalendar}>
                <Clock className="w-4 h-4" />
                Ver Calendário
              </Button>
            </li>
            <li>
              <Button variant="outline" className="w-full gap-2" onClick={onManageUsers}>
                <TrendingUp className="w-4 h-4" />
                Gerenciar Usuários
              </Button>
            </li>
          </ul>
        </article>

        {/* Artigos Mais Lidos */}
        <article className="lg:col-span-2 bg-white border border-[#e5e5e5] rounded-xl p-4 sm:p-6">
          <header className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-[#111111]">Artigos Mais Lidos</h2>
            <Button variant="ghost" size="sm" onClick={onViewArticles}>
              Ver todos <ArrowRight className="w-4 h-4 ml-1" />
            </Button>
          </header>

          {topArticles.length > 0 ? (
            <ul className="space-y-3">
              {topArticles.map((article, index) => (
                <li key={article.slug}>
                  <article className="flex items-center gap-3 p-3 bg-[#f8fafb] rounded-lg">
                    <span className="w-8 h-8 rounded-full bg-[#c40000] text-white flex items-center justify-center text-sm font-bold flex-shrink-0">
                      {index + 1}
                    </span>
                    <section className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-[#111111] truncate">{article.title}</p>
                      <p className="text-xs text-[#6b6b6b]">
                        {article.views.toLocaleString('pt-BR')} visualizações
                      </p>
                    </section>
                    <section className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0"
                        onClick={() => window.open(`/noticias/${article.slug}`, '_blank')}
                      >
                        <Eye className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0"
                        onClick={() => onNewArticle()}
                      >
                        <Edit2 className="w-4 h-4" />
                      </Button>
                    </section>
                  </article>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-center text-[#6b6b6b] py-8">Nenhum artigo encontrado</p>
          )}
        </article>
      </section>
    </section>
  );
}
