'use client';

/**
 * Dashboard do Usuário - Versão Aprimorada
 * Visão geral completa com estatísticas, gráficos e personalização
 */

import { useState, useEffect, useMemo, startTransition } from 'react';
import Link from 'next/link';
import { 
  BookOpen, 
  Clock, 
  Bookmark, 
  MessageSquare, 
  Settings,
  ArrowRight,
  Calendar,
  TrendingUp,
  Award,
  Zap,
  Target,
  GripVertical,
  Bell,
  Sparkles,
  Flame,
  BarChart3,
  ChevronRight,
  LayoutGrid,
  List,
  CheckCircle2,
  Clock3,
  Archive
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { publicStorage, secureStorage, storage } from '@/lib/storage';
import { getAllArticles } from '@/services/newsManager';
import { useBookmarks } from '@/hooks/useBookmarks';
import { useReadingHistory } from '@/hooks/useReadingHistory';
import { CONTENT_CONFIG } from '@/config/content';
import { NewsCard } from '@/components/news/NewsCard';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Switch } from '@/components/ui/switch';
import type { NewsArticle } from '@/types';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

// Tipos
interface ReadingStreak {
  current: number;
  longest: number;
  lastReadDate: string;
  weeklyReads: number[];
}

interface Achievement {
  id: string;
  icon: typeof BookOpen;
  label: string;
  description: string;
  unlocked: boolean;
  progress?: number;
  maxProgress?: number;
}

interface DashboardWidget {
  id: string;
  title: string;
  enabled: boolean;
}

export default function UserDashboardPage() {
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [currentDate] = useState(new Date());
  
  // Widgets visíveis (persistido no localStorage)
  const [widgets, setWidgets] = useState<DashboardWidget[]>([
    { id: 'stats', title: 'Estatísticas', enabled: true },
    { id: 'streak', title: 'Sequência', enabled: true },
    { id: 'recommendations', title: 'Recomendações', enabled: true },
    { id: 'activity', title: 'Atividade Recente', enabled: true },
    { id: 'achievements', title: 'Conquistas', enabled: true },
    { id: 'readingList', title: 'Lista de Leitura', enabled: true },
    { id: 'calendar', title: 'Calendário', enabled: true },
  ]);
  
  const [showWidgetSettings, setShowWidgetSettings] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>(() => {
    if (typeof window !== 'undefined') {
      return publicStorage.get<'grid' | 'list'>('cin_dashboard_view') || 'grid';
    }
    return 'grid';
  });

  // Dados do usuário
  const { bookmarks } = useBookmarks();
  const { history: readingHistory } = useReadingHistory();
  const dailyStats = useMemo(() => storage.getDailyStats(), []);
  const [allArticles, setAllArticles] = useState<NewsArticle[]>([]);
  useEffect(() => {
    let isMounted = true;
    const load = async () => {
      try {
        const data = await getAllArticles();
        if (isMounted) setAllArticles(data);
      } catch {
        // Erro silenciado - não logamos intencionalmente
      }
    };
    load();
    return () => {
      isMounted = false;
    };
  }, []);
  
  // Sequência de leitura
  const [streak, setStreak] = useState<ReadingStreak>({
    current: 0,
    longest: 0,
    lastReadDate: '',
    weeklyReads: [0, 0, 0, 0, 0, 0, 0],
  });

  // Calcular sequência
  useEffect(() => {
    const calculateStreak = () => {
      if (readingHistory.length === 0) return;
      
      const sorted = [...readingHistory].sort((a, b) => 
        new Date(b.readAt).getTime() - new Date(a.readAt).getTime()
      );
      
      const lastRead = new Date(sorted[0].readAt);
      const today = new Date();
      const diffDays = Math.floor((today.getTime() - lastRead.getTime()) / (1000 * 60 * 60 * 24));
      
      let currentStreak = 0;
      if (diffDays <= 1) {
        currentStreak = 1;
        const dates = new Set(sorted.map(h => new Date(h.readAt).toDateString()));
        
        for (let i = 1; i <= 365; i++) {
          const checkDate = new Date(today);
          checkDate.setDate(checkDate.getDate() - i);
          if (dates.has(checkDate.toDateString())) {
            currentStreak++;
          } else {
            break;
          }
        }
      }
      
      // Calcular leituras por dia da semana
      const weeklyReads = [0, 0, 0, 0, 0, 0, 0];
      readingHistory.forEach(h => {
        const day = new Date(h.readAt).getDay();
        weeklyReads[day]++;
      });
      
      setStreak({
        current: currentStreak,
        longest: Math.max(currentStreak, secureStorage.get<number>('cin_longest_streak') || 0),
        lastReadDate: sorted[0]?.readAt || '',
        weeklyReads,
      });
      
      secureStorage.set('cin_longest_streak', Math.max(currentStreak, secureStorage.get<number>('cin_longest_streak') || 0));
    };
    
    calculateStreak();
    startTransition(() => {
      setIsLoading(false);
    });
  }, [readingHistory]);

  // Total de estatísticas
  const totalStats = useMemo(() => {
    const totalTime = readingHistory.reduce((sum, h) => sum + (h.timeSpent || 0), 0);
    const totalArticles = readingHistory.length;
    const uniqueArticles = new Set(readingHistory.map(h => h.articleSlug)).size;
    const comments = storage.get<{ articleSlug: string }[]>('cin_comments') || [];
    
    return {
      totalArticles,
      uniqueArticles,
      totalTime,
      totalBookmarks: bookmarks.length,
      totalComments: comments.length,
      avgTimePerArticle: totalArticles > 0 ? Math.round(totalTime / totalArticles) : 0,
    };
  }, [readingHistory, bookmarks]);

  // Artigos recomendados baseados nas preferências
  const recommendedArticles = useMemo(() => {
    const userPrefs = user?.preferences;
    if (!userPrefs?.categories?.length && !userPrefs?.tags?.length) {
      return allArticles.slice(0, 4);
    }
    
    const scored = allArticles.map(article => {
      let score = 0;
      
      // Pontuação por categoria
      if (userPrefs.categories?.includes(article.category)) {
        score += 10;
      }
      
      // Pontuação por tags
      article.tags.forEach(tag => {
        if (userPrefs.tags?.includes(tag)) {
          score += 5;
        }
      });
      
      // Penalizar artigos já lidos
      if (readingHistory.some(h => h.articleSlug === article.slug)) {
        score -= 20;
      }
      
      // Bonus para artigos em destaque
      if (article.featured) score += 2;
      if (article.breaking) score += 3;
      
      return { article, score };
    });
    
    return scored
      .sort((a, b) => b.score - a.score)
      .slice(0, 4)
      .map(s => s.article);
  }, [allArticles, user?.preferences, readingHistory]);

  // Lista de leitura (artigos salvos não lidos)
  const readingList = useMemo(() => {
    const readSlugs = new Set(readingHistory.map(h => h.articleSlug));
    return bookmarks
      .filter(b => !readSlugs.has(b.articleSlug))
      .slice(0, 5);
  }, [bookmarks, readingHistory]);

  // Conquistas
  const streakCurrent = streak.current;
  const achievements: Achievement[] = useMemo(() => [
    {
      id: 'first-read',
      icon: BookOpen,
      label: 'Primeira Leitura',
      description: 'Leia seu primeiro artigo',
      unlocked: totalStats.totalArticles >= 1,
      progress: Math.min(totalStats.totalArticles, 1),
      maxProgress: 1,
    },
    {
      id: 'avid-reader',
      icon: Target,
      label: 'Leitor Ávido',
      description: 'Leia 10 artigos',
      unlocked: totalStats.totalArticles >= 10,
      progress: totalStats.totalArticles,
      maxProgress: 10,
    },
    {
      id: 'expert',
      icon: Award,
      label: 'Especialista',
      description: 'Leia 50 artigos',
      unlocked: totalStats.totalArticles >= 50,
      progress: totalStats.totalArticles,
      maxProgress: 50,
    },
    {
      id: 'streak-3',
      icon: Flame,
      label: 'Em Sequência',
      description: 'Leia 3 dias seguidos',
      unlocked: streakCurrent >= 3,
      progress: streakCurrent,
      maxProgress: 3,
    },
    {
      id: 'streak-7',
      icon: Zap,
      label: 'Semana Perfeita',
      description: 'Leia 7 dias seguidos',
      unlocked: streakCurrent >= 7,
      progress: streakCurrent,
      maxProgress: 7,
    },
    {
      id: 'collector',
      icon: Bookmark,
      label: 'Colecionador',
      description: 'Salve 10 favoritos',
      unlocked: totalStats.totalBookmarks >= 10,
      progress: totalStats.totalBookmarks,
      maxProgress: 10,
    },
    {
      id: 'engaged',
      icon: MessageSquare,
      label: 'Engajado',
      description: 'Deixe 5 comentários',
      unlocked: totalStats.totalComments >= 5,
      progress: totalStats.totalComments,
      maxProgress: 5,
    },
    {
      id: 'time',
      icon: Clock,
      label: 'Tempo Investido',
      description: 'Leia por 5 horas',
      unlocked: totalStats.totalTime >= 300,
      progress: Math.floor(totalStats.totalTime / 60),
      maxProgress: 5,
    },
  ], [totalStats, streakCurrent]);

  const unlockedAchievements = achievements.filter(a => a.unlocked);

  // Calendário de leitura (últimos 30 dias)
  const readingCalendar = useMemo(() => {
    const days: { date: Date; count: number; hasRead: boolean }[] = [];
    const readDates = new Set(readingHistory.map(h => 
      new Date(h.readAt).toDateString()
    ));
    
    for (let i = 29; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateStr = date.toDateString();
      const count = readingHistory.filter(h => 
        new Date(h.readAt).toDateString() === dateStr
      ).length;
      
      days.push({
        date,
        count,
        hasRead: readDates.has(dateStr),
      });
    }
    
    return days;
  }, [readingHistory]);

  // Categorias mais lidas
  const topCategories = useMemo(() => {
    const counts: Record<string, number> = {};
    readingHistory.forEach(h => {
      counts[h.category] = (counts[h.category] || 0) + 1;
    });
    
    return Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([slug, count]) => ({
        slug,
        name: CONTENT_CONFIG.categories[slug as keyof typeof CONTENT_CONFIG.categories]?.name || slug,
        color: CONTENT_CONFIG.categories[slug as keyof typeof CONTENT_CONFIG.categories]?.color || '#6b6b6b',
        count,
      }));
  }, [readingHistory]);

  // Toggle widget
  const toggleWidget = (widgetId: string) => {
    setWidgets(prev => prev.map(w => 
      w.id === widgetId ? { ...w, enabled: !w.enabled } : w
    ));
  };

  // Salvar preferência de view mode
  const toggleViewMode = () => {
    const newMode = viewMode === 'grid' ? 'list' : 'grid';
    setViewMode(newMode);
    publicStorage.set('cin_dashboard_view', newMode);
  };

  const isWidgetEnabled = (id: string) => widgets.find(w => w.id === id)?.enabled ?? true;

  if (isLoading) {
    return (
      <main className="min-h-screen flex items-center justify-center">
        <section className="flex flex-col items-center gap-4">
          <span className="w-8 h-8 border-2 border-[#e5e5e5] border-t-[#c40000] rounded-full animate-spin" />
          <p className="text-sm text-[#6b6b6b]">Carregando dashboard...</p>
        </section>
      </main>
    );
  }

  return (
    <>
      <main className="max-w-[1400px] mx-auto px-4 py-6 sm:py-8">
        {/* Header */}
        <header className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6 sm:mb-8">
          <section>
            <section className="flex items-center gap-3">
              <h1 className="text-2xl sm:text-3xl font-bold text-[#111111]">
                Olá, {user?.name?.split(' ')[0]}! 👋
              </h1>
              {streak.current >= 3 && (
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger>
                      <span className="flex items-center gap-1 px-2 py-1 bg-orange-100 text-orange-600 rounded-full text-sm">
                        <Flame className="w-4 h-4" />
                        {streak.current}
                      </span>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Sequência de {streak.current} dias!</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              )}
            </section>
            <p className="text-sm sm:text-base text-[#6b6b6b] mt-1">
              {currentDate.toLocaleDateString('pt-BR', { 
                weekday: 'long', 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
              })}
            </p>
          </section>
          <section className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={toggleViewMode}
              className="gap-2"
            >
              {viewMode === 'grid' ? <LayoutGrid className="w-4 h-4" /> : <List className="w-4 h-4" />}
              {viewMode === 'grid' ? 'Grade' : 'Lista'}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowWidgetSettings(true)}
              className="gap-2"
            >
              <Settings className="w-4 h-4" />
              Personalizar
            </Button>
          </section>
        </header>

        {/* Estatísticas Principais */}
        {isWidgetEnabled('stats') && (
          <section className="mb-6 sm:mb-8">
            <ul className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-3 sm:gap-4">
              <li>
                <article className="p-4 bg-gradient-to-br from-green-50 to-green-100 rounded-xl border border-green-200">
                  <BookOpen className="w-8 h-8 text-green-600 mb-3" />
                  <p className="text-2xl font-bold text-[#111111]">{totalStats.totalArticles}</p>
                  <p className="text-sm text-[#6b6b6b]">Artigos Lidos</p>
                  <p className="text-xs text-green-600 mt-1">
                    +{dailyStats.articlesRead} hoje
                  </p>
                </article>
              </li>
              <li>
                <article className="p-4 bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl border border-blue-200">
                  <Clock className="w-8 h-8 text-blue-600 mb-3" />
                  <p className="text-2xl font-bold text-[#111111]">
                    {Math.floor(totalStats.totalTime / 60)}h
                  </p>
                  <p className="text-sm text-[#6b6b6b]">Tempo Total</p>
                  <p className="text-xs text-blue-600 mt-1">
                    {totalStats.avgTimePerArticle}min/média
                  </p>
                </article>
              </li>
              <li>
                <article className="p-4 bg-gradient-to-br from-amber-50 to-amber-100 rounded-xl border border-amber-200">
                  <Bookmark className="w-8 h-8 text-amber-600 mb-3" />
                  <p className="text-2xl font-bold text-[#111111]">{totalStats.totalBookmarks}</p>
                  <p className="text-sm text-[#6b6b6b]">Favoritos</p>
                  <p className="text-xs text-amber-600 mt-1">
                    {readingList.length} para ler
                  </p>
                </article>
              </li>
              <li>
                <article className="p-4 bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl border border-purple-200">
                  <MessageSquare className="w-8 h-8 text-purple-600 mb-3" />
                  <p className="text-2xl font-bold text-[#111111]">{totalStats.totalComments}</p>
                  <p className="text-sm text-[#6b6b6b]">Comentários</p>
                  <p className="text-xs text-purple-600 mt-1">
                    Engajamento ativo
                  </p>
                </article>
              </li>
              <li>
                <article className="p-4 bg-gradient-to-br from-red-50 to-red-100 rounded-xl border border-red-200">
                  <Zap className="w-8 h-8 text-red-600 mb-3" />
                  <p className="text-2xl font-bold text-[#111111]">{streak.current}</p>
                  <p className="text-sm text-[#6b6b6b]">Dias Seguidos</p>
                  <p className="text-xs text-red-600 mt-1">
                    Recorde: {streak.longest}
                  </p>
                </article>
              </li>
              <li>
                <article className="p-4 bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl border border-gray-200">
                  <Award className="w-8 h-8 text-gray-600 mb-3" />
                  <p className="text-2xl font-bold text-[#111111]">{unlockedAchievements.length}</p>
                  <p className="text-sm text-[#6b6b6b]">Conquistas</p>
                  <p className="text-xs text-gray-600 mt-1">
                    de {achievements.length} total
                  </p>
                </article>
              </li>
            </ul>
          </section>
        )}

        <section className="grid grid-cols-1 lg:grid-cols-3 gap-6 sm:gap-8">
          {/* Coluna Principal */}
          <section className="lg:col-span-2 space-y-6">
            {/* Sequência de Leitura */}
            {isWidgetEnabled('streak') && (
              <section className="bg-white border border-[#e5e5e5] rounded-xl p-4 sm:p-6">
                <header className="flex items-center justify-between mb-4">
                  <section className="flex items-center gap-3">
                    <section className="p-2 bg-orange-100 rounded-lg">
                      <Flame className="w-5 h-5 text-orange-600" />
                    </section>
                    <section>
                      <h2 className="text-lg font-bold text-[#111111]">Sequência de Leitura</h2>
                      <p className="text-xs text-[#6b6b6b]">
                        {streak.current >= 3 
                          ? `🔥 Você está com ${streak.current} dias de sequência!` 
                          : 'Leia todos os dias para manter a sequência'}
                      </p>
                    </section>
                  </section>
                  <section className="text-right">
                    <p className="text-3xl font-bold text-orange-600">{streak.current}</p>
                    <p className="text-xs text-[#6b6b6b]">dias</p>
                  </section>
                </header>
                
                {/* Barra de progresso semanal */}
                <section className="space-y-2">
                  <section className="flex justify-between text-xs text-[#6b6b6b]">
                    <span>Dom</span>
                    <span>Seg</span>
                    <span>Ter</span>
                    <span>Qua</span>
                    <span>Qui</span>
                    <span>Sex</span>
                    <span>Sáb</span>
                  </section>
                  <section className="flex gap-2">
                    {streak.weeklyReads.map((count, i) => (
                      <section
                        key={i}
                        className={`flex-1 h-8 rounded-md transition-colors ${
                          count > 0 
                            ? count >= 3 
                              ? 'bg-orange-500' 
                              : 'bg-orange-300'
                            : 'bg-gray-100'
                        }`}
                        title={`${count} artigos`}
                      />
                    ))}
                  </section>
                </section>
              </section>
            )}

            {/* Recomendações */}
            {isWidgetEnabled('recommendations') && (
              <section>
                <header className="flex items-center justify-between mb-4">
                  <section className="flex items-center gap-3">
                    <section className="p-2 bg-blue-100 rounded-lg">
                      <Sparkles className="w-5 h-5 text-blue-600" />
                    </section>
                    <h2 className="text-lg font-bold text-[#111111]">Recomendado para Você</h2>
                  </section>
                  <Link 
                    href="/"
                    className="text-sm text-[#c40000] hover:underline flex items-center gap-1"
                  >
                    Explorar <ArrowRight className="w-4 h-4" />
                  </Link>
                </header>
                
                {recommendedArticles.length > 0 ? (
                  <ul className={`grid gap-4 ${viewMode === 'grid' ? 'grid-cols-1 sm:grid-cols-2' : 'grid-cols-1'}`}>
                    {recommendedArticles.map(article => (
                      <li key={article.slug}>
                        <NewsCard article={article} variant="compact" />
                      </li>
                    ))}
                  </ul>
                ) : (
                  <section className="p-6 bg-[#f5f5f5] rounded-xl text-center">
                    <p className="text-[#6b6b6b]">
                      Configure suas preferências para receber recomendações personalizadas.
                    </p>
                    <Link href="/app/preferencias">
                      <Button className="mt-4 bg-[#c40000] hover:bg-[#a00000]">
                        Configurar preferências
                      </Button>
                    </Link>
                  </section>
                )}
              </section>
            )}

            {/* Atividade Recente */}
            {isWidgetEnabled('activity') && (
              <section className="bg-white border border-[#e5e5e5] rounded-xl p-4 sm:p-6">
                <header className="flex items-center justify-between mb-4">
                  <section className="flex items-center gap-3">
                    <section className="p-2 bg-green-100 rounded-lg">
                      <BarChart3 className="w-5 h-5 text-green-600" />
                    </section>
                    <h2 className="text-lg font-bold text-[#111111]">Atividade Recente</h2>
                  </section>
                  {readingHistory.length > 0 && (
                    <Link 
                      href="#"
                      className="text-sm text-[#6b6b6b] hover:text-[#c40000]"
                    >
                      Ver histórico completo
                    </Link>
                  )}
                </header>
                
                {readingHistory.length > 0 ? (
                  <ul className="space-y-3">
                    {readingHistory.slice(0, 5).map((entry, index) => (
                      <li key={index}>
                        <article className="flex items-center gap-4 p-3 bg-[#f8fafc] rounded-lg hover:bg-[#f0f9ff] transition-colors group">
                          <section className="w-10 h-10 bg-white rounded-lg flex items-center justify-center text-lg">
                            {index + 1}
                          </section>
                          <section className="flex-1 min-w-0">
                            <Link 
                              href={`/noticias/${entry.articleSlug}`}
                              className="font-medium text-[#111111] group-hover:text-[#c40000] transition-colors truncate block"
                            >
                              {entry.title}
                            </Link>
                            <p className="text-xs text-[#6b6b6b] flex items-center gap-2 mt-1">
                              <Calendar className="w-3 h-3" />
                              {new Date(entry.readAt).toLocaleDateString('pt-BR')}
                              <span className="capitalize">• {entry.category}</span>
                              {entry.timeSpent && (
                                <>
                                  <Clock className="w-3 h-3 ml-2" />
                                  {Math.ceil(entry.timeSpent / 60)}min
                                </>
                              )}
                            </p>
                          </section>
                          <ChevronRight className="w-5 h-5 text-[#6b6b6b] opacity-0 group-hover:opacity-100 transition-opacity" />
                        </article>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <section className="p-6 bg-[#f5f5f5] rounded-xl text-center">
                    <BookOpen className="w-12 h-12 text-[#e5e5e5] mx-auto mb-3" />
                    <p className="text-[#6b6b6b]">Você ainda não leu nenhum artigo.</p>
                    <Link href="/">
                      <Button className="mt-4 bg-[#c40000] hover:bg-[#a00000]">
                        Começar a ler
                      </Button>
                    </Link>
                  </section>
                )}
              </section>
            )}

            {/* Calendário de Leitura */}
            {isWidgetEnabled('calendar') && (
              <section className="bg-white border border-[#e5e5e5] rounded-xl p-4 sm:p-6">
                <header className="flex items-center gap-3 mb-4">
                  <section className="p-2 bg-purple-100 rounded-lg">
                    <Calendar className="w-5 h-5 text-purple-600" />
                  </section>
                  <h2 className="text-lg font-bold text-[#111111]">Calendário de Leitura</h2>
                </header>
                
                <section className="grid grid-cols-7 gap-1">
                  {['D', 'S', 'T', 'Q', 'Q', 'S', 'S'].map((day, i) => (
                    <section key={i} className="text-center text-xs text-[#6b6b6b] py-2">
                      {day}
                    </section>
                  ))}
                  {readingCalendar.map((day, i) => (
                    <TooltipProvider key={i}>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <section
                            className={`aspect-square rounded-md flex items-center justify-center text-xs cursor-pointer transition-all hover:scale-110 ${
                              day.hasRead
                                ? day.count >= 3
                                  ? 'bg-green-500 text-white'
                                  : 'bg-green-300 text-white'
                                : 'bg-gray-100 text-gray-400'
                            }`}
                          >
                            {day.date.getDate()}
                          </section>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>{day.date.toLocaleDateString('pt-BR')}</p>
                          <p>{day.count} artigo{day.count !== 1 ? 's' : ''} lido{day.count !== 1 ? 's' : ''}</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  ))}
                </section>
                
                <section className="flex items-center gap-4 mt-4 text-xs text-[#6b6b6b]">
                  <section className="flex items-center gap-1">
                    <section className="w-3 h-3 bg-green-500 rounded" />
                    <span>3+ artigos</span>
                  </section>
                  <section className="flex items-center gap-1">
                    <section className="w-3 h-3 bg-green-300 rounded" />
                    <span>1-2 artigos</span>
                  </section>
                  <section className="flex items-center gap-1">
                    <section className="w-3 h-3 bg-gray-100 rounded" />
                    <span>Sem leitura</span>
                  </section>
                </section>
              </section>
            )}
          </section>

          {/* Sidebar */}
          <aside className="space-y-6">
            {/* Progresso das Conquistas */}
            {isWidgetEnabled('achievements') && (
              <section className="bg-white border border-[#e5e5e5] rounded-xl p-4 sm:p-6">
                <header className="flex items-center justify-between mb-4">
                  <section className="flex items-center gap-3">
                    <section className="p-2 bg-yellow-100 rounded-lg">
                      <Award className="w-5 h-5 text-yellow-600" />
                    </section>
                    <h3 className="font-bold text-[#111111]">Conquistas</h3>
                  </section>
                  <span className="text-sm text-[#6b6b6b]">
                    {unlockedAchievements.length}/{achievements.length}
                  </span>
                </header>
                
                <section className="space-y-3">
                  {achievements.slice(0, 5).map((achievement) => (
                    <article 
                      key={achievement.id}
                      className={`p-3 rounded-lg border transition-colors ${
                        achievement.unlocked 
                          ? 'bg-yellow-50 border-yellow-200' 
                          : 'bg-gray-50 border-gray-200'
                      }`}
                    >
                      <section className="flex items-start gap-3">
                        <section className={`p-2 rounded-lg ${
                          achievement.unlocked ? 'bg-yellow-100' : 'bg-gray-200'
                        }`}>
                          <achievement.icon className={`w-4 h-4 ${
                            achievement.unlocked ? 'text-yellow-600' : 'text-gray-400'
                          }`} />
                        </section>
                        <section className="flex-1 min-w-0">
                          <p className={`text-sm font-medium ${
                            achievement.unlocked ? 'text-[#111111]' : 'text-[#6b6b6b]'
                          }`}>
                            {achievement.label}
                          </p>
                          <p className="text-xs text-[#6b6b6b]">{achievement.description}</p>
                          {achievement.maxProgress && achievement.maxProgress > 1 && (
                            <section className="mt-2">
                              <section className="flex justify-between text-xs text-[#6b6b6b] mb-1">
                                <span>Progresso</span>
                                <span>{achievement.progress}/{achievement.maxProgress}</span>
                              </section>
                              <Progress 
                                value={((achievement.progress ?? 0) / (achievement.maxProgress ?? 1)) * 100} 
                                className="h-1.5"
                              />
                            </section>
                          )}
                        </section>
                        {achievement.unlocked && (
                          <CheckCircle2 className="w-5 h-5 text-green-500 flex-shrink-0" />
                        )}
                      </section>
                    </article>
                  ))}
                </section>
                
                {unlockedAchievements.length > 0 && (
                  <section className="mt-4 p-3 bg-gradient-to-r from-yellow-50 to-orange-50 rounded-lg border border-yellow-200">
                    <p className="text-sm text-[#111111] font-medium">
                      🎉 Parabéns! Você desbloqueou {unlockedAchievements.length} conquista{unlockedAchievements.length !== 1 ? 's' : ''}!
                    </p>
                  </section>
                )}
              </section>
            )}

            {/* Lista de Leitura */}
            {isWidgetEnabled('readingList') && (
              <section className="bg-white border border-[#e5e5e5] rounded-xl p-4 sm:p-6">
                <header className="flex items-center justify-between mb-4">
                  <section className="flex items-center gap-3">
                    <section className="p-2 bg-blue-100 rounded-lg">
                      <Clock3 className="w-5 h-5 text-blue-600" />
                    </section>
                    <h3 className="font-bold text-[#111111]">Lista de Leitura</h3>
                  </section>
                  {readingList.length > 0 && (
                    <Badge variant="secondary">{readingList.length}</Badge>
                  )}
                </header>
                
                {readingList.length > 0 ? (
                  <ul className="space-y-3">
                    {readingList.map((item, index) => (
                      <li key={index}>
                        <Link 
                          href={`/noticias/${item.articleSlug}`}
                          className="block p-3 bg-[#f8fafc] rounded-lg hover:bg-[#f0f9ff] transition-colors group"
                        >
                          <p className="text-sm text-[#111111] line-clamp-2 group-hover:text-[#c40000] transition-colors">
                            {item.title}
                          </p>
                          <section className="flex items-center justify-between mt-2">
                            <Badge 
                              variant="secondary" 
                              className="text-xs capitalize"
                              style={{
                                backgroundColor: `${CONTENT_CONFIG.categories[item.category as keyof typeof CONTENT_CONFIG.categories]?.color}20`,
                                color: CONTENT_CONFIG.categories[item.category as keyof typeof CONTENT_CONFIG.categories]?.color
                              }}
                            >
                              {CONTENT_CONFIG.categories[item.category as keyof typeof CONTENT_CONFIG.categories]?.name || item.category}
                            </Badge>
                            <ArrowRight className="w-4 h-4 text-[#6b6b6b] opacity-0 group-hover:opacity-100 transition-opacity" />
                          </section>
                        </Link>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <section className="text-center py-4">
                    <Archive className="w-10 h-10 text-[#e5e5e5] mx-auto mb-2" />
                    <p className="text-sm text-[#6b6b6b]">Sua lista de leitura está vazia</p>
                  </section>
                )}
                
                <Link href="/">
                  <Button variant="outline" className="w-full mt-4 gap-2">
                    <BookOpen className="w-4 h-4" />
                    Adicionar mais artigos
                  </Button>
                </Link>
              </section>
            )}

            {/* Categorias Mais Lidas */}
            <section className="bg-white border border-[#e5e5e5] rounded-xl p-4 sm:p-6">
              <header className="flex items-center gap-3 mb-4">
                <section className="p-2 bg-green-100 rounded-lg">
                  <TrendingUp className="w-5 h-5 text-green-600" />
                </section>
                <h3 className="font-bold text-[#111111]">Categorias Populares</h3>
              </header>
              
              {topCategories.length > 0 ? (
                <ul className="space-y-3">
                  {topCategories.map((cat) => (
                    <li key={cat.slug}>
                      <Link href={`/categoria/${cat.slug}`}>
                        <article className="flex items-center gap-3 p-3 rounded-lg hover:bg-[#f8fafc] transition-colors">
                          <section 
                            className="w-3 h-3 rounded-full"
                            style={{ backgroundColor: cat.color }}
                          />
                          <section className="flex-1">
                            <p className="text-sm font-medium text-[#111111]">{cat.name}</p>
                          </section>
                          <Badge variant="secondary">{cat.count}</Badge>
                        </article>
                      </Link>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-[#6b6b6b] text-center py-4">
                  Comece a ler para ver suas categorias favoritas
                </p>
              )}
            </section>

            {/* Newsletter */}
            <section className="bg-gradient-to-br from-[#111111] to-[#333] text-white rounded-xl p-4 sm:p-6">
              <section className="flex items-center gap-3 mb-3">
                <section className="p-2 bg-white/10 rounded-lg">
                  <Bell className="w-5 h-5" />
                </section>
                <h3 className="font-bold">Newsletter CIN</h3>
              </section>
              <p className="text-sm text-gray-400 mb-4">
                Receba análises exclusivas e as principais notícias no seu e-mail.
              </p>
              <Link href="/app/configuracoes">
                <Button className="w-full bg-[#c40000] hover:bg-[#a00000]">
                  Gerenciar inscrição
                </Button>
              </Link>
            </section>
          </aside>
        </section>

        {/* Dialog de Configuração de Widgets */}
        <Dialog open={showWidgetSettings} onOpenChange={setShowWidgetSettings}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Personalizar Dashboard</DialogTitle>
              <DialogDescription>
                Escolha quais widgets deseja exibir na sua página inicial.
              </DialogDescription>
            </DialogHeader>
            
            <section className="space-y-4 py-4">
              {widgets.map((widget) => (
                <section 
                  key={widget.id}
                  className="flex items-center justify-between p-3 bg-[#f8fafc] rounded-lg"
                >
                  <section className="flex items-center gap-3">
                    <GripVertical className="w-4 h-4 text-[#6b6b6b]" />
                    <span className="text-sm font-medium text-[#111111]">{widget.title}</span>
                  </section>
                  <Switch
                    checked={widget.enabled}
                    onCheckedChange={() => toggleWidget(widget.id)}
                  />
                </section>
              ))}
            </section>
            
            <DialogFooter>
              <Button onClick={() => setShowWidgetSettings(false)}>
                Concluído
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </main>
    </>
  );
}
