/**
 * Hook para gerenciamento de dados do Admin
 * Agora com metricas reais de analytics
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { toast } from 'sonner';
import type { 
  DashboardStats, 
  SystemUser, 
  AuthorFormState, 
  AnalyticsMetrics,
  TopContentItem,
  TrafficSource,
  DeviceStat,
  RecentActivityItem,
  DateRangeFilter,
} from '../types';
import type { ScheduledArticle, ArticleFilters } from '@/services/newsManager';
import type { NewsArticle } from '@/types';
import type { Author } from '@/config/authors';
import {
  getArticlesPaginated,
  getArticleStats,
  getScheduledArticles,
} from '@/services/newsManager';
import { publishScheduledPostsNow } from '@/services/adminPosts';
import { listAdminUsers } from '@/services/adminUsers';
import { listAdminAuthors } from '@/services/adminAuthors';
import {
  getDashboardMetrics,
  getTopContent,
  getTrafficSources,
  getDeviceStats,
  getRecentActivity,
} from '@/services/analyticsService';

// Estado inicial dos stats (legado)
const initialStats: DashboardStats = {
  total: 0,
  published: 0,
  breaking: 0,
  featured: 0,
  scheduled: 0,
  totalViews: 0,
  totalLikes: 0,
  byCategory: { economia: 0, geopolitica: 0, tecnologia: 0 },
};

// Estado inicial das metricas de analytics
const initialAnalyticsMetrics: AnalyticsMetrics = {
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
  viewsTrend: [],
  visitorsTrend: [],
};

export function useAdminData() {
  // Ref para controle de mount
  const isMounted = useRef(true);
  const abortControllerRef = useRef<AbortController | null>(null);

  // Artigos
  const [articles, setArticles] = useState<NewsArticle[]>([]);
  const [scheduledArticles, setScheduledArticles] = useState<ScheduledArticle[]>([]);
  const [stats, setStats] = useState<DashboardStats>(initialStats);
  const [isLoading, setIsLoading] = useState(true);

  // Novas metricas de analytics
  const [analyticsMetrics, setAnalyticsMetrics] = useState<AnalyticsMetrics>(initialAnalyticsMetrics);
  const [topContent, setTopContent] = useState<TopContentItem[]>([]);
  const [trafficSources, setTrafficSources] = useState<TrafficSource[]>([]);
  const [deviceStats, setDeviceStats] = useState<DeviceStat[]>([]);
  const [recentActivity, setRecentActivity] = useState<RecentActivityItem[]>([]);
  const [isAnalyticsLoading, setIsAnalyticsLoading] = useState(true);

  // Date range para analytics
  const [dateRange, setDateRange] = useState<DateRangeFilter>(() => {
    const to = new Date();
    to.setHours(23, 59, 59, 999);
    const from = new Date();
    from.setDate(from.getDate() - 29);
    from.setHours(0, 0, 0, 0);
    return { from, to, label: 'Ultimos 30 dias' };
  });

  // Filtros de artigos
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<ArticleFilters['status']>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [perPage, setPerPage] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  const [selectedArticles, setSelectedArticles] = useState<string[]>([]);

  // Configuracoes

  // Usuarios
  const [users, setUsers] = useState<SystemUser[]>([]);

  // Autores
  const [authors, setAuthors] = useState<Author[]>([]);

  // Cleanup no unmount
  useEffect(() => {
    return () => {
      isMounted.current = false;
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  // Helper functions para atualizar estado de forma segura
  const setLoadingSafe = (value: boolean) => { if (isMounted.current) setIsLoading(value); };
  const setAnalyticsLoadingSafe = (value: boolean) => { if (isMounted.current) setIsAnalyticsLoading(value); };

  // Carregar dados de artigos
  const loadArticles = useCallback(async () => {
    setLoadingSafe(true);

    try {
      const filters: ArticleFilters = {
        search: searchTerm,
        category: categoryFilter,
        status: statusFilter,
      };

      const result = await getArticlesPaginated(filters, currentPage, perPage, { includeDrafts: true });
      
      if (isMounted.current) {
        setArticles(result.items ?? []);
        setTotalPages(result.totalPages ?? 1);
      }

      const articleStats = await getArticleStats();
      
      if (isMounted.current) {
        setStats({
          total: articleStats?.total ?? 0,
          published: articleStats?.published ?? 0,
          breaking: articleStats?.breaking ?? 0,
          featured: articleStats?.featured ?? 0,
          scheduled: articleStats?.scheduled ?? 0,
          totalViews: articleStats?.totalViews ?? 0,
          totalLikes: articleStats?.totalLikes ?? 0,
          byCategory: articleStats?.byCategory ?? { economia: 0, geopolitica: 0, tecnologia: 0 },
        });
      }

      const scheduled = await getScheduledArticles();
      
      if (isMounted.current) {
        setScheduledArticles((scheduled ?? []).filter((s) => s?.status === 'pending'));
      }
    } catch (error) {
      console.error('Error loading articles:', error);
      if (isMounted.current) {
        setArticles([]);
        setScheduledArticles([]);
        setStats(initialStats);
      }
    } finally {
      setLoadingSafe(false);
    }
  }, [searchTerm, categoryFilter, statusFilter, currentPage, perPage]);

  // Carregar metricas de analytics
  const loadAnalytics = useCallback(async () => {
    setAnalyticsLoadingSafe(true);
    
    try {
      // Construir o date range para a API
      const apiDateRange = dateRange.from && dateRange.to ? {
        from: dateRange.from,
        to: dateRange.to,
      } : undefined;

      const [
        metrics,
        top,
        traffic,
        devices,
        activity,
      ] = await Promise.all([
        getDashboardMetrics(apiDateRange).catch(() => initialAnalyticsMetrics),
        getTopContent(10).catch(() => []),
        getTrafficSources(apiDateRange).catch(() => []),
        getDeviceStats(apiDateRange).catch(() => []),
        getRecentActivity(20).catch(() => []),
      ]);

      if (isMounted.current) {
        setAnalyticsMetrics(metrics ?? initialAnalyticsMetrics);
        setTopContent(top ?? []);
        setTrafficSources(traffic ?? []);
        setDeviceStats(devices ?? []);
        setRecentActivity(activity ?? []);
      }
    } catch (error) {
      console.error('Error loading analytics:', error);
      if (isMounted.current) {
        setAnalyticsMetrics(initialAnalyticsMetrics);
        setTopContent([]);
        setTrafficSources([]);
        setDeviceStats([]);
        setRecentActivity([]);
      }
    } finally {
      setAnalyticsLoadingSafe(false);
    }
  }, [dateRange]);

  // Carregar usuÃ¡rios
  const loadUsers = useCallback(async () => {
    try {
      const data = await listAdminUsers();
      if (isMounted.current) {
        setUsers(data ?? []);
      }
    } catch (err) {
      if (isMounted.current) {
        setUsers([]);
        const message = err instanceof Error ? err.message : 'Erro desconhecido';
        toast.error(`Erro ao carregar usuários: ${message}`);
      }
    }
  }, []);

  // Carregar autores
  const loadAuthors = useCallback(async () => {
    try {
      const data = await listAdminAuthors();
      if (isMounted.current) {
        setAuthors(data ?? []);
      }
    } catch (err) {
      if (isMounted.current) {
        setAuthors([]);
        const message = err instanceof Error ? err.message : 'Erro desconhecido';
        toast.error(`Erro ao carregar perfis profissionais: ${message}`);
      }
    }
  }, []);

  // Carregar todos os dados
  const loadData = useCallback(async () => {
    await Promise.all([
      loadArticles(),
      loadUsers(),
      loadAuthors(),
      loadAnalytics(),
    ]);
  }, [loadArticles, loadUsers, loadAuthors, loadAnalytics]);

  // Verificar publicacoes agendadas
  const checkScheduled = useCallback(async () => {
    try {
      const published = await publishScheduledPostsNow();
      if (published > 0 && isMounted.current) {
        toast.success(`${published} artigo(s) agendado(s) publicado(s)!`);
        await loadData();
      }
      return published;
    } catch (error) {
      console.error('Error checking scheduled:', error);
      return 0;
    }
  }, [loadData]);

  // Toggle selecao de artigo
  const toggleArticleSelection = useCallback((slug: string) => {
    setSelectedArticles((prev) =>
      prev.includes(slug) ? prev.filter((s) => s !== slug) : [...prev, slug]
    );
  }, []);

  // Selecionar todos os artigos
  const selectAllArticles = useCallback(() => {
    setSelectedArticles((prev) => {
      if (prev.length === articles.length) {
        return [];
      } else {
        return articles.map((a) => a.slug).filter(Boolean);
      }
    });
  }, [articles]);

  // Resetar pagina quando filtros mudam
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, categoryFilter, statusFilter]);

  // Inicializacao - apenas uma vez
  useEffect(() => {
    let isCancelled = false;
    
    const init = async () => {
      if (!isCancelled) {
        await loadData();
      }
    };
    
    void init();
    
    return () => {
      isCancelled = true;
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Polling de verificacao de agendamentos
  useEffect(() => {
    const interval = setInterval(() => {
      void checkScheduled();
    }, 60000);
    return () => clearInterval(interval);
  }, [checkScheduled]);

  // Refresh periodico de analytics (a cada 5 minutos)
  useEffect(() => {
    const interval = setInterval(() => {
      if (isMounted.current) {
        void loadAnalytics();
      }
    }, 300000);
    return () => clearInterval(interval);
  }, [loadAnalytics]);

  return {
    // Artigos
    articles,
    scheduledArticles,
    stats,
    isLoading,

    // Analytics - garantir que nunca sejam undefined
    analyticsMetrics: analyticsMetrics ?? initialAnalyticsMetrics,
    topContent: topContent ?? [],
    trafficSources: trafficSources ?? [],
    deviceStats: deviceStats ?? [],
    recentActivity: recentActivity ?? [],
    isAnalyticsLoading,
    refreshAnalytics: loadAnalytics,
    dateRange,
    setDateRange,

    // Filtros
    searchTerm,
    setSearchTerm,
    categoryFilter,
    setCategoryFilter,
    statusFilter,
    setStatusFilter,
    currentPage,
    setCurrentPage,
    perPage,
    setPerPage,
    totalPages,
    selectedArticles,
    toggleArticleSelection,
    selectAllArticles,

    // Configuracoes

    // Usuarios
    users: users ?? [],
    loadUsers,

    // Autores
    authors: authors ?? [],
    loadAuthors,

    // Acoes
    loadData,
    loadArticles,
    checkScheduled,
  };
}

// Estado inicial do formulÃ¡rio de autor
export function getInitialAuthorFormState(): AuthorFormState {
  return {
    slug: '',
    name: '',
    shortName: '',
    title: '',
    bio: '',
    longBio: '',
    photo: '',
    email: '',
    website: '',
    location: '',
    social: {},
    expertise: '',
    credentials: '',
    awards: '',
    languages: '',
    joinedAt: new Date().toISOString().split('T')[0],
    isActive: true,
    factChecker: false,
    editor: false,
    education: [],
  };
}


