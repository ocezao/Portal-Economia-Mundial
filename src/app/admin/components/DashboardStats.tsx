'use client';

import { ExternalLink, BarChart3, FileText, Users, Calendar, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';

interface DashboardStatsProps {
  onNewArticle: () => void;
  onViewArticles: () => void;
  onViewCalendar: () => void;
  onManageUsers: () => void;
}

export function DashboardStats({
  onNewArticle,
  onViewArticles,
  onViewCalendar,
  onManageUsers,
}: DashboardStatsProps) {
  return (
    <div className="space-y-6">
      {/* Botão do Metabase */}
      <div className="bg-gradient-to-r from-purple-600 to-indigo-600 rounded-xl p-6 sm:p-8 text-white">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h2 className="text-xl sm:text-2xl font-bold flex items-center gap-2">
              <BarChart3 className="w-6 h-6" />
              Dashboard de Analytics
            </h2>
            <p className="text-white/80 text-sm mt-2 max-w-xl">
              Acesse o Metabase para ver métricas avançadas, relatórios personalizados e análises detalhadas do portal.
            </p>
          </div>
          <a
            href="https://metabase.cenariointernacional.com.br"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 bg-white text-purple-700 px-6 py-3 rounded-lg font-medium hover:bg-purple-50 transition-colors"
          >
            <ExternalLink className="w-5 h-5" />
            <span>Abrir Metabase</span>
          </a>
        </div>
      </div>

      {/* Ações Rápidas */}
      <Card>
        <CardHeader>
          <CardTitle>Ações Rápidas</CardTitle>
          <CardDescription>Gerencie o conteúdo do portal</CardDescription>
        </CardHeader>
        <CardContent className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <Button 
            className="bg-[#c40000] hover:bg-[#a00000] gap-2" 
            onClick={onNewArticle}
          >
            <Plus className="w-4 h-4" />
            Nova Notícia
          </Button>
          <Button variant="outline" className="gap-2" onClick={onViewArticles}>
            <FileText className="w-4 h-4" />
            Lista de Notícias
          </Button>
          <Button variant="outline" className="gap-2" onClick={onViewCalendar}>
            <Calendar className="w-4 h-4" />
            Calendário
          </Button>
          <Button variant="outline" className="gap-2" onClick={onManageUsers}>
            <Users className="w-4 h-4" />
            Usuários
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
