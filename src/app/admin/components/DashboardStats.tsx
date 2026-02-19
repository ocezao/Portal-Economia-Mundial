/**
 * DashboardStats - Dashboard Moderno com Dados Reais
 * 100% Responsivo - Mobile First
 * Com Date Range Picker Customizado
 */

'use client';

import { useState, useMemo, useRef, useEffect } from 'react';
import {
  FileText,
  CheckCircle,
  Zap,
  Star,
  Clock,
  TrendingUp,
  Plus,
  ArrowRight,
  Eye,
  Heart,
  Bookmark,
  MessageCircle,
  Share2,
  Users,
  Activity,
  Timer,
  MousePointer,
  RefreshCw,
  BarChart3,
  PieChart,
  Monitor,
  Smartphone,
  Tablet,
  ChevronUp,
  ChevronDown,
  Calendar,
  ChevronDown as ChevronDownIcon,
  X,
  ExternalLink,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import type { 
  AnalyticsMetrics, 
  TopContentItem, 
  TrafficSource, 
  DeviceStat,
  RecentActivityItem,
  DateRangeFilter,
  DatePreset,
} from '../types';

// ==================== TIPOS ====================

interface DashboardStatsProps {
  metrics: AnalyticsMetrics;
  topContent: TopContentItem[];
  trafficSources: TrafficSource[];
  deviceStats: DeviceStat[];
  recentActivity: RecentActivityItem[];
  isLoading: boolean;
  onRefresh: () => void;
  onDateRangeChange: (range: DateRangeFilter) => void;
  currentDateRange: DateRangeFilter;
  onNewArticle: () => void;
  onViewArticles: () => void;
  onViewCalendar: () => void;
  onManageUsers: () => void;
}

// ==================== COMPONENTE DATE RANGE PICKER ====================

function DateRangePicker({
  value,
  onChange,
  onApply,
}: {
  value: DateRangeFilter;
  onChange: (range: DateRangeFilter) => void;
  onApply: () => void;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Fechar ao clicar fora
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Formatadores
  const formatDateForInput = (date: Date | null): string => {
    if (!date) return '';
    return date.toISOString().split('T')[0];
  };

  const formatDateDisplay = (date: Date | null): string => {
    if (!date) return '-';
    return date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: '2-digit' });
  };

  // Presets
  const applyPreset = (preset: DatePreset) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    let from: Date | null = null;
    let to: Date | null = new Date(today);
    to.setHours(23, 59, 59, 999);
    
    switch (preset) {
      case 'today':
        from = new Date(today);
        break;
      case 'yesterday':
        from = new Date(today);
        from.setDate(from.getDate() - 1);
        to = new Date(from);
        to.setHours(23, 59, 59, 999);
        break;
      case 'last7days':
        from = new Date(today);
        from.setDate(from.getDate() - 6);
        break;
      case 'last30days':
        from = new Date(today);
        from.setDate(from.getDate() - 29);
        break;
      case 'last90days':
        from = new Date(today);
        from.setDate(from.getDate() - 89);
        break;
      case 'custom':
        return; // Não faz nada, aguarda input do usuário
    }
    
    onChange({ from, to, label: getPresetLabel(preset) });
  };

  const getPresetLabel = (preset: DatePreset): string => {
    const labels: Record<DatePreset, string> = {
      today: 'Hoje',
      yesterday: 'Ontem',
      last7days: 'Últimos 7 dias',
      last30days: 'Últimos 30 dias',
      last90days: 'Últimos 90 dias',
      custom: 'Personalizado',
    };
    return labels[preset];
  };

  // Verificar se é um período válido
  const isValidRange = value.from && value.to && value.from <= value.to;
  
  // Calcular número de dias
  const daysDiff = value.from && value.to 
    ? Math.ceil((value.to.getTime() - value.from.getTime()) / (1000 * 60 * 60 * 24)) + 1
    : 0;

  return (
    <div className="relative" ref={dropdownRef}>
      <Button
        variant="outline"
        size="sm"
        onClick={() => setIsOpen(!isOpen)}
        className="gap-2 h-8 sm:h-9 text-xs sm:text-sm"
      >
        <Calendar className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
        <span className="hidden sm:inline">
          {value.label || (isValidRange ? `${formatDateDisplay(value.from)} - ${formatDateDisplay(value.to)}` : 'Selecionar datas')}
        </span>
        <span className="sm:hidden">
          {value.label || (isValidRange ? `${daysDiff}d` : 'Datas')}
        </span>
        <ChevronDownIcon className={`w-3 h-3 sm:w-4 sm:h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </Button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-72 sm:w-80 bg-white rounded-lg shadow-lg border z-50 p-4 space-y-4">
          {/* Presets */}
          <div className="space-y-2">
            <label className="text-xs font-medium text-muted-foreground">Períodos rápidos</label>
            <div className="grid grid-cols-2 gap-2">
              {(['today', 'yesterday', 'last7days', 'last30days', 'last90days'] as DatePreset[]).map((preset) => (
                <button
                  key={preset}
                  onClick={() => {
                    applyPreset(preset);
                    onApply();
                    setIsOpen(false);
                  }}
                  className="px-3 py-2 text-xs font-medium rounded-md bg-gray-50 hover:bg-[#c40000] hover:text-white transition-colors text-left"
                >
                  {getPresetLabel(preset)}
                </button>
              ))}
            </div>
          </div>

          {/* Separador */}
          <div className="border-t" />

          {/* Inputs de data personalizada */}
          <div className="space-y-3">
            <label className="text-xs font-medium text-muted-foreground">Período personalizado</label>
            
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <label className="text-xs w-12">De:</label>
                <input
                  type="date"
                  value={formatDateForInput(value.from)}
                  onChange={(e) => {
                    const date = e.target.value ? new Date(e.target.value) : null;
                    if (date) date.setHours(0, 0, 0, 0);
                    onChange({ ...value, from: date, label: undefined });
                  }}
                  className="flex-1 px-2 py-1.5 text-xs border rounded-md focus:outline-none focus:ring-2 focus:ring-[#c40000]"
                />
              </div>
              
              <div className="flex items-center gap-2">
                <label className="text-xs w-12">Até:</label>
                <input
                  type="date"
                  value={formatDateForInput(value.to)}
                  onChange={(e) => {
                    const date = e.target.value ? new Date(e.target.value) : null;
                    if (date) date.setHours(23, 59, 59, 999);
                    onChange({ ...value, to: date, label: undefined });
                  }}
                  className="flex-1 px-2 py-1.5 text-xs border rounded-md focus:outline-none focus:ring-2 focus:ring-[#c40000]"
                />
              </div>
            </div>

            {/* Resumo do período */}
            {isValidRange && (
              <div className="text-xs text-muted-foreground bg-gray-50 p-2 rounded">
                <span className="font-medium">{daysDiff} dias selecionados</span>
                <br />
                {formatDateDisplay(value.from)} até {formatDateDisplay(value.to)}
              </div>
            )}
          </div>

          {/* Botões de ação */}
          <div className="flex gap-2 pt-2 border-t">
            <Button
              variant="outline"
              size="sm"
              className="flex-1 text-xs"
              onClick={() => setIsOpen(false)}
            >
              Cancelar
            </Button>
            <Button
              size="sm"
              className="flex-1 text-xs bg-[#c40000] hover:bg-[#a00000]"
              onClick={() => {
                if (isValidRange) {
                  onApply();
                  setIsOpen(false);
                }
              }}
              disabled={!isValidRange}
            >
              Aplicar
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

// ==================== COMPONENTES AUXILIARES ====================

function StatCard({
  icon: Icon,
  label,
  value,
  subValue,
  trend,
  trendUp,
  color,
  bgColor,
  isLoading,
}: {
  icon: React.ElementType;
  label: string;
  value: string | number;
  subValue?: string;
  trend?: string;
  trendUp?: boolean;
  color: string;
  bgColor: string;
  isLoading?: boolean;
}) {
  if (isLoading) {
    return (
      <Card className="overflow-hidden">
        <CardContent className="p-4 sm:p-6">
          <div className="flex items-start justify-between">
            <div className="space-y-2 w-full">
              <Skeleton className="h-3 w-16 sm:h-4 sm:w-20" />
              <Skeleton className="h-6 w-20 sm:h-8 sm:w-24" />
            </div>
            <Skeleton className="h-8 w-8 sm:h-10 sm:w-10 rounded-lg flex-shrink-0" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="overflow-hidden hover:shadow-md transition-shadow duration-200">
      <CardContent className="p-4 sm:p-6">
        <div className="flex items-start justify-between gap-2">
          <div className="space-y-1 min-w-0">
            <p className="text-xs sm:text-sm font-medium text-muted-foreground truncate">{label}</p>
            <div className="flex items-baseline gap-1 sm:gap-2 flex-wrap">
              <h3 className="text-lg sm:text-xl lg:text-2xl font-bold tracking-tight">{value}</h3>
              {subValue && (
                <span className="text-xs text-muted-foreground">{subValue}</span>
              )}
            </div>
            {trend && (
              <div className={`flex items-center gap-1 text-xs font-medium ${
                trendUp ? 'text-green-600' : 'text-red-600'
              }`}>
                {trendUp ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                {trend}
              </div>
            )}
          </div>
          <div className={`p-2 sm:p-3 rounded-lg sm:rounded-xl flex-shrink-0 ${bgColor}`}>
            <Icon className={`w-4 h-4 sm:w-5 sm:h-5 ${color}`} />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function MiniChart({ data, color }: { data: { value: number; label: string }[]; color: string }) {
  const max = Math.max(...data.map(d => d.value), 1);
  const min = Math.min(...data.map(d => d.value), 0);
  const range = max - min || 1;

  return (
    <div className="flex items-end gap-0.5 sm:gap-1 h-8 sm:h-12">
      {data.map((item, i) => {
        const height = ((item.value - min) / range) * 100;
        return (
          <div
            key={i}
            className={`flex-1 rounded-t ${color} opacity-80 hover:opacity-100 transition-opacity min-w-[4px]`}
            style={{ height: `${Math.max(height, 5)}%` }}
            title={`${item.label}: ${item.value}`}
          />
        );
      })}
    </div>
  );
}

function ActivityIcon({ type }: { type: RecentActivityItem['type'] }) {
  const icons = {
    view: Eye,
    like: Heart,
    bookmark: Bookmark,
    share: Share2,
    comment: MessageCircle,
  };
  const colors = {
    view: 'text-blue-500 bg-blue-50',
    like: 'text-red-500 bg-red-50',
    bookmark: 'text-yellow-500 bg-yellow-50',
    share: 'text-green-500 bg-green-50',
    comment: 'text-purple-500 bg-purple-50',
  };
  const Icon = icons[type] || Eye;
  const colorClass = colors[type] || colors.view;
  return (
    <div className={`p-1.5 sm:p-2 rounded-lg ${colorClass}`}>
      <Icon className="w-3 h-3 sm:w-4 sm:h-4" />
    </div>
  );
}

function formatTimeAgo(timestamp: string): string {
  if (!timestamp) return '-';
  try {
    const date = new Date(timestamp);
    const now = new Date();
    const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);
    
    if (seconds < 60) return 'agora';
    if (seconds < 3600) return `${Math.floor(seconds / 60)}min`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h`;
    return `${Math.floor(seconds / 86400)}d`;
  } catch {
    return '-';
  }
}

// ==================== COMPONENTE PRINCIPAL ====================

export function DashboardStats({
  metrics,
  topContent,
  trafficSources,
  deviceStats,
  recentActivity,
  isLoading,
  onRefresh,
  onDateRangeChange,
  currentDateRange,
  onNewArticle,
  onViewArticles,
  onViewCalendar,
  onManageUsers,
}: DashboardStatsProps = {} as DashboardStatsProps) {
  const [activeTab, setActiveTab] = useState('overview');

  // Garantir que metrics nunca seja undefined/null/valor inválido em runtime.
  // Isso evita crash do segmento em caso de props inconsistentes (ex: durante HMR).
  type TrendPoint = { date: string; views: number } | { date: string; visitors: number };
  
  const emptyMetrics: AnalyticsMetrics & { viewsTrend: { date: string; views: number }[]; visitorsTrend: { date: string; visitors: number }[] } = {
    totalPageViews: 0,
    totalUniqueVisitors: 0,
    avgSessionDuration: '0min',
    bounceRate: 0,
    totalArticles: 0,
    publishedArticles: 0,
    breakingNews: 0,
    featuredArticles: 0,
    scheduledArticles: 0,
    totalLikes: 0,
    totalBookmarks: 0,
    totalComments: 0,
    totalShares: 0,
    totalUsers: 0,
    activeUsers: 0,
    newUsers: 0,
    viewsTrend: [] as { date: string; views: number }[],
    visitorsTrend: [] as { date: string; visitors: number }[],
  };

  const safeMetrics = metrics ?? emptyMetrics;

  // Calcular tendências para os cards
  const trends = useMemo(() => {
    if (!safeMetrics.viewsTrend || safeMetrics.viewsTrend.length < 2) return null;
    
    const currentViews = safeMetrics.viewsTrend[safeMetrics.viewsTrend.length - 1]?.views || 0;
    const previousViews = safeMetrics.viewsTrend[safeMetrics.viewsTrend.length - 2]?.views || 0;
    const viewsChange = previousViews > 0 
      ? Math.round(((currentViews - previousViews) / previousViews) * 100)
      : 0;

    return {
      views: { value: `${Math.abs(viewsChange)}%`, up: viewsChange >= 0 },
    };
  }, [safeMetrics.viewsTrend]);

  // Preparar dados para mini gráficos
  const viewsChartData = useMemo(() => 
    (safeMetrics.viewsTrend ?? []).map(d => ({ value: d.views || 0, label: d.date || '' })),
    [safeMetrics.viewsTrend]
  );

  // Safe arrays
  const safeTopContent = topContent ?? [];
  const safeTrafficSources = trafficSources ?? [];
  const safeDeviceStats = deviceStats ?? [];
  const safeRecentActivity = recentActivity ?? [];

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Botão do Metabase */}
      <div className="bg-gradient-to-r from-purple-600 to-indigo-600 rounded-xl p-4 sm:p-6 text-white">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h2 className="text-lg sm:text-xl font-bold flex items-center gap-2">
              Métricas Avançadas
            </h2>
            <p className="text-white/80 text-sm mt-1">
              Acesse o dashboard completo com métricas em tempo real, análises detalhadas e relatórios personalizados.
            </p>
          </div>
          <a
            href="https://metabase.cenariointernacional.com.br"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 bg-white text-purple-700 px-4 py-2 rounded-lg font-medium hover:bg-purple-50 transition-colors whitespace-nowrap"
          >
            <ExternalLink className="w-4 h-4" />
            <span>Abrir Metabase</span>
          </a>
        </div>
      </div>

      {/* Header com ações - Responsivo */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-[#111111]">Dashboard</h2>
          <p className="text-xs sm:text-sm text-[#6b6b6b]">
            Visão geral em tempo real do portal
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap justify-end">
          <DateRangePicker
            value={currentDateRange}
            onChange={onDateRangeChange}
            onApply={onRefresh}
          />
          <Button
            variant="outline"
            size="icon"
            onClick={onRefresh}
            disabled={isLoading}
            className={`h-8 w-8 sm:h-9 sm:w-9 ${isLoading ? 'animate-spin' : ''}`}
          >
            <RefreshCw className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
          </Button>
        </div>
      </div>

      {/* Tabs de navegação - Responsivo */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4 sm:space-y-6">
        <TabsList className="grid w-full grid-cols-3 h-auto">
          <TabsTrigger value="overview" className="gap-1 sm:gap-2 text-xs sm:text-sm py-2">
            <BarChart3 className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            <span className="hidden sm:inline">Visão Geral</span>
            <span className="sm:hidden">Geral</span>
          </TabsTrigger>
          <TabsTrigger value="content" className="gap-1 sm:gap-2 text-xs sm:text-sm py-2">
            <FileText className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            <span className="hidden sm:inline">Conteúdo</span>
            <span className="sm:hidden">Conteúdo</span>
          </TabsTrigger>
          <TabsTrigger value="engagement" className="gap-1 sm:gap-2 text-xs sm:text-sm py-2">
            <Activity className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            <span className="hidden sm:inline">Engajamento</span>
            <span className="sm:hidden">Engaj.</span>
          </TabsTrigger>
        </TabsList>

        {/* Tab: Visão Geral */}
        <TabsContent value="overview" className="space-y-4 sm:space-y-6">
          {/* Cards principais de Analytics - Grid responsivo */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            <StatCard
              icon={Eye}
              label="Page Views"
              value={(safeMetrics.totalPageViews || 0).toLocaleString('pt-BR')}
              subValue="no período"
              trend={trends?.views.value}
              trendUp={trends?.views.up}
              color="text-blue-600"
              bgColor="bg-blue-50"
              isLoading={isLoading}
            />
            <StatCard
              icon={Users}
              label="Visitantes"
              value={(safeMetrics.totalUniqueVisitors || 0).toLocaleString('pt-BR')}
              subValue="únicos"
              color="text-purple-600"
              bgColor="bg-purple-50"
              isLoading={isLoading}
            />
            <StatCard
              icon={Timer}
              label="Tempo Médio"
              value={safeMetrics.avgSessionDuration || '0min'}
              subValue="/sessão"
              color="text-orange-600"
              bgColor="bg-orange-50"
              isLoading={isLoading}
            />
            <StatCard
              icon={MousePointer}
              label="Rejeição"
              value={`${safeMetrics.bounceRate || 0}%`}
              subValue="bounce"
              color="text-red-600"
              bgColor="bg-red-50"
              isLoading={isLoading}
            />
          </div>

          {/* Cards de Artigos - Grid responsivo */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
            <StatCard
              icon={FileText}
              label="Total"
              value={safeMetrics.totalArticles || 0}
              color="text-blue-600"
              bgColor="bg-blue-50"
              isLoading={isLoading}
            />
            <StatCard
              icon={CheckCircle}
              label="Publicados"
              value={safeMetrics.publishedArticles || 0}
              color="text-green-600"
              bgColor="bg-green-50"
              isLoading={isLoading}
            />
            <StatCard
              icon={Zap}
              label="Urgentes"
              value={safeMetrics.breakingNews || 0}
              color="text-red-600"
              bgColor="bg-red-50"
              isLoading={isLoading}
            />
            <StatCard
              icon={Star}
              label="Destaques"
              value={safeMetrics.featuredArticles || 0}
              color="text-yellow-600"
              bgColor="bg-yellow-50"
              isLoading={isLoading}
            />
            <StatCard
              icon={Clock}
              label="Agendados"
              value={safeMetrics.scheduledArticles || 0}
              color="text-blue-600"
              bgColor="bg-blue-50"
              isLoading={isLoading}
            />
            <StatCard
              icon={TrendingUp}
              label="Views"
              value={`${((safeMetrics.totalPageViews || 0) / 1000).toFixed(1)}k`}
              color="text-gray-700"
              bgColor="bg-gray-100"
              isLoading={isLoading}
            />
          </div>

          {/* Grid principal - Responsivo */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
            {/* Ações Rápidas */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base sm:text-lg">Ações Rápidas</CardTitle>
                <CardDescription className="text-xs sm:text-sm">Gerencie o portal</CardDescription>
              </CardHeader>
              <CardContent className="space-y-2 pt-0">
                <Button 
                  className="w-full bg-[#c40000] hover:bg-[#a00000] gap-2 text-sm" 
                  onClick={onNewArticle}
                  size="sm"
                >
                  <Plus className="w-4 h-4" />
                  Nova Notícia
                </Button>
                <Button variant="outline" className="w-full gap-2 text-sm" onClick={onViewArticles} size="sm">
                  <FileText className="w-4 h-4" />
                  Lista
                </Button>
                <Button variant="outline" className="w-full gap-2 text-sm" onClick={onViewCalendar} size="sm">
                  <Calendar className="w-4 h-4" />
                  Calendário
                </Button>
                <Button variant="outline" className="w-full gap-2 text-sm" onClick={onManageUsers} size="sm">
                  <Users className="w-4 h-4" />
                  Usuários
                </Button>
              </CardContent>
            </Card>

            {/* Tendência de Views */}
            <Card className="lg:col-span-2">
              <CardHeader className="pb-3">
                <CardTitle className="text-base sm:text-lg flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 sm:w-5 sm:h-5 text-[#c40000]" />
                  Tendência de Page Views
                </CardTitle>
                <CardDescription className="text-xs sm:text-sm">
                  {currentDateRange.label || 'Período selecionado'}
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-0">
                {isLoading ? (
                  <Skeleton className="h-24 sm:h-32 w-full" />
                ) : viewsChartData.length > 0 ? (
                  <div className="space-y-3">
                    <MiniChart data={viewsChartData} color="bg-[#c40000]" />
                    <div className="flex justify-between text-xs text-muted-foreground overflow-x-auto">
                      {(safeMetrics.viewsTrend || []).slice(0, 7).map((d, i) => (
                        <span key={i} className="flex-shrink-0 px-1">{d.date}</span>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="h-24 sm:h-32 flex items-center justify-center text-muted-foreground text-sm">
                    Sem dados para o período selecionado
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Atividade Recente - Responsiva */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base sm:text-lg flex items-center gap-2">
                <Activity className="w-4 h-4 sm:w-5 sm:h-5 text-[#c40000]" />
                Atividade Recente
              </CardTitle>
              <CardDescription className="text-xs sm:text-sm">Últimas interações</CardDescription>
            </CardHeader>
            <CardContent className="pt-0">
              {isLoading ? (
                <div className="space-y-3">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <Skeleton key={i} className="h-10 sm:h-12 w-full" />
                  ))}
                </div>
              ) : safeRecentActivity.length > 0 ? (
                <div className="space-y-2 sm:space-y-3">
                  {safeRecentActivity.slice(0, 10).map((activity) => (
                    <div
                      key={activity.id}
                      className="flex items-center gap-2 sm:gap-3 p-2 sm:p-3 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      <ActivityIcon type={activity.type} />
                      <div className="flex-1 min-w-0">
                        <p className="text-xs sm:text-sm font-medium text-[#111111] truncate">
                          {activity.type === 'view' && 'Visualizou '}
                          {activity.type === 'like' && 'Curtiu '}
                          {activity.type === 'bookmark' && 'Salvou '}
                          {activity.type === 'share' && 'Compartilhou '}
                          {activity.type === 'comment' && 'Comentou em '}
                          <span className="text-[#c40000]">{activity.articleTitle || 'Artigo'}</span>
                        </p>
                      </div>
                      <span className="text-xs text-muted-foreground whitespace-nowrap">
                        {formatTimeAgo(activity.timestamp)}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="py-6 sm:py-8 text-center text-muted-foreground text-sm">
                  Nenhuma atividade recente
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab: Conteúdo */}
        <TabsContent value="content" className="space-y-4 sm:space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
            {/* Top Artigos Mais Lidos */}
            <Card className="lg:col-span-2">
              <CardHeader className="flex flex-row items-center justify-between pb-3">
                <div>
                  <CardTitle className="text-base sm:text-lg">Top Conteúdo</CardTitle>
                  <CardDescription className="text-xs sm:text-sm">Artigos mais populares</CardDescription>
                </div>
                <Button variant="ghost" size="sm" onClick={onViewArticles} className="text-xs h-8">
                  Ver todos <ArrowRight className="w-3 h-3 ml-1" />
                </Button>
              </CardHeader>
              <CardContent className="pt-0">
                {isLoading ? (
                  <div className="space-y-3">
                    {[1, 2, 3, 4, 5].map((i) => (
                      <Skeleton key={i} className="h-14 sm:h-16 w-full" />
                    ))}
                  </div>
                ) : safeTopContent.length > 0 ? (
                  <div className="space-y-2 sm:space-y-3">
                    {safeTopContent.slice(0, 5).map((article, index) => (
                      <div
                        key={article.slug || index}
                        className="flex items-center gap-2 sm:gap-3 p-2 sm:p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                      >
                        <span className="w-6 h-6 sm:w-8 sm:h-8 rounded-full bg-[#c40000] text-white flex items-center justify-center text-xs sm:text-sm font-bold flex-shrink-0">
                          {index + 1}
                        </span>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs sm:text-sm font-medium text-[#111111] truncate">
                            {article.title || 'Sem título'}
                          </p>
                          <div className="flex items-center gap-2 sm:gap-3 text-xs text-muted-foreground mt-1">
                            <span className="flex items-center gap-0.5 sm:gap-1">
                              <Eye className="w-3 h-3" />
                              {(article.views || 0).toLocaleString('pt-BR')}
                            </span>
                            <span className="flex items-center gap-0.5 sm:gap-1">
                              <Heart className="w-3 h-3" />
                              {article.likes || 0}
                            </span>
                            <span className="flex items-center gap-0.5 sm:gap-1">
                              <Bookmark className="w-3 h-3" />
                              {article.bookmarks || 0}
                            </span>
                          </div>
                        </div>
                        <Badge variant="secondary" className="text-xs flex-shrink-0">
                          {article.engagement || 0}%
                        </Badge>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="py-6 sm:py-8 text-center text-muted-foreground text-sm">
                    Nenhum artigo encontrado
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Métricas de Engajamento */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base sm:text-lg">Engajamento</CardTitle>
                <CardDescription className="text-xs sm:text-sm">Todas as interações</CardDescription>
              </CardHeader>
              <CardContent className="space-y-2 sm:space-y-3 pt-0">
                {isLoading ? (
                  <div className="space-y-3">
                    {[1, 2, 3, 4].map((i) => (
                      <Skeleton key={i} className="h-12 w-full" />
                    ))}
                  </div>
                ) : (
                  <>
                    <div className="flex items-center justify-between p-2 sm:p-3 bg-red-50 rounded-lg">
                      <div className="flex items-center gap-2 sm:gap-3">
                        <Heart className="w-4 h-4 sm:w-5 sm:h-5 text-red-600" />
                        <span className="text-xs sm:text-sm font-medium">Curtidas</span>
                      </div>
                      <span className="text-sm sm:text-lg font-bold">{(safeMetrics.totalLikes || 0).toLocaleString('pt-BR')}</span>
                    </div>
                    <div className="flex items-center justify-between p-2 sm:p-3 bg-yellow-50 rounded-lg">
                      <div className="flex items-center gap-2 sm:gap-3">
                        <Bookmark className="w-4 h-4 sm:w-5 sm:h-5 text-yellow-600" />
                        <span className="text-xs sm:text-sm font-medium">Favoritos</span>
                      </div>
                      <span className="text-sm sm:text-lg font-bold">{(safeMetrics.totalBookmarks || 0).toLocaleString('pt-BR')}</span>
                    </div>
                    <div className="flex items-center justify-between p-2 sm:p-3 bg-purple-50 rounded-lg">
                      <div className="flex items-center gap-2 sm:gap-3">
                        <MessageCircle className="w-4 h-4 sm:w-5 sm:h-5 text-purple-600" />
                        <span className="text-xs sm:text-sm font-medium">Comentários</span>
                      </div>
                      <span className="text-sm sm:text-lg font-bold">{(safeMetrics.totalComments || 0).toLocaleString('pt-BR')}</span>
                    </div>
                    <div className="flex items-center justify-between p-2 sm:p-3 bg-green-50 rounded-lg">
                      <div className="flex items-center gap-2 sm:gap-3">
                        <Share2 className="w-4 h-4 sm:w-5 sm:h-5 text-green-600" />
                        <span className="text-xs sm:text-sm font-medium">Compartilhamentos</span>
                      </div>
                      <span className="text-sm sm:text-lg font-bold">{(safeMetrics.totalShares || 0).toLocaleString('pt-BR')}</span>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Tab: Engajamento */}
        <TabsContent value="engagement" className="space-y-4 sm:space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
            {/* Fontes de Tráfego */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base sm:text-lg flex items-center gap-2">
                  <PieChart className="w-4 h-4 sm:w-5 sm:h-5 text-[#c40000]" />
                  Fontes de Tráfego
                </CardTitle>
                <CardDescription className="text-xs sm:text-sm">De onde vêm os visitantes</CardDescription>
              </CardHeader>
              <CardContent className="pt-0">
                {isLoading ? (
                  <Skeleton className="h-40 sm:h-48 w-full" />
                ) : safeTrafficSources.length > 0 ? (
                  <div className="space-y-3 sm:space-y-4">
                    {safeTrafficSources.map((source) => (
                      <div key={source.source} className="space-y-1.5 sm:space-y-2">
                        <div className="flex items-center justify-between text-xs sm:text-sm">
                          <span className="font-medium">{source.source || 'Desconhecido'}</span>
                          <span className="text-muted-foreground">
                            {(source.visitors || 0).toLocaleString('pt-BR')} ({source.percentage || 0}%)
                          </span>
                        </div>
                        <div className="h-1.5 sm:h-2 bg-gray-100 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-[#c40000] rounded-full transition-all duration-500"
                            style={{ width: `${Math.min(source.percentage || 0, 100)}%` }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="h-40 sm:h-48 flex items-center justify-center text-muted-foreground text-sm">
                    Sem dados disponíveis
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Dispositivos */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base sm:text-lg flex items-center gap-2">
                  <Monitor className="w-4 h-4 sm:w-5 sm:h-5 text-[#c40000]" />
                  Dispositivos
                </CardTitle>
                <CardDescription className="text-xs sm:text-sm">Como os usuários acessam</CardDescription>
              </CardHeader>
              <CardContent className="pt-0">
                {isLoading ? (
                  <Skeleton className="h-40 sm:h-48 w-full" />
                ) : safeDeviceStats.length > 0 ? (
                  <div className="space-y-3 sm:space-y-4">
                    {safeDeviceStats.map((device) => (
                      <div key={device.device} className="flex items-center gap-3 sm:gap-4">
                        <div className="p-2 sm:p-3 bg-gray-100 rounded-lg">
                          {(device.device || '').toLowerCase() === 'desktop' ? (
                            <Monitor className="w-4 h-4 sm:w-5 sm:h-5" />
                          ) : (device.device || '').toLowerCase() === 'mobile' ? (
                            <Smartphone className="w-4 h-4 sm:w-5 sm:h-5" />
                          ) : (
                            <Tablet className="w-4 h-4 sm:w-5 sm:h-5" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-xs sm:text-sm font-medium">{device.device || 'Desconhecido'}</span>
                            <span className="text-xs text-muted-foreground">
                              {device.percentage || 0}%
                            </span>
                          </div>
                          <div className="h-1.5 sm:h-2 bg-gray-100 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-[#c40000] rounded-full transition-all duration-500"
                              style={{ width: `${Math.min(device.percentage || 0, 100)}%` }}
                            />
                          </div>
                        </div>
                        <span className="text-xs sm:text-sm font-medium text-muted-foreground flex-shrink-0">
                          {(device.visitors || 0).toLocaleString('pt-BR')}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="h-40 sm:h-48 flex items-center justify-center text-muted-foreground text-sm">
                    Sem dados disponíveis
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Cards de Usuários - Grid responsivo */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-4">
            <StatCard
              icon={Users}
              label="Total Usuários"
              value={safeMetrics.totalUsers || 0}
              color="text-blue-600"
              bgColor="bg-blue-50"
              isLoading={isLoading}
            />
            <StatCard
              icon={Activity}
              label="Usuários Ativos"
              value={safeMetrics.activeUsers || 0}
              subValue="no período"
              color="text-green-600"
              bgColor="bg-green-50"
              isLoading={isLoading}
            />
            <StatCard
              icon={UserPlus}
              label="Novos Usuários"
              value={safeMetrics.newUsers || 0}
              subValue="no período"
              color="text-purple-600"
              bgColor="bg-purple-50"
              isLoading={isLoading}
            />
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}

// Ícone adicional
function UserPlus(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <line x1="19" x2="19" y1="8" y2="14" />
      <line x1="22" x2="16" y1="11" y2="11" />
    </svg>
  );
}
