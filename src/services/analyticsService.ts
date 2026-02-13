/**
 * Serviço de Analytics - Dados reais de tracking
 * Busca métricas de analytics_events, sessions e user activity
 * Com tratamento de erros robusto e fallback para dados vazios
 */

import { supabase, isSupabaseConfigured, safeQuery } from '@/lib/supabaseClient';
import { logger } from '@/lib/logger';

// Rate limiter para logs (evita spam)
const logCache = new Map<string, number>();
const LOG_THROTTLE_MS = 30000; // 30 segundos

function shouldLog(key: string): boolean {
  const now = Date.now();
  const lastLog = logCache.get(key);
  if (!lastLog || now - lastLog > LOG_THROTTLE_MS) {
    logCache.set(key, now);
    return true;
  }
  return false;
}

// ==================== TIPOS ====================

export interface RealTimeStats {
  totalViews: number;
  uniqueVisitors: number;
  avgSessionDuration: string;
  bounceRate: number;
}

export interface DashboardMetrics {
  // Métricas principais (cards)
  totalPageViews: number;
  totalUniqueVisitors: number;
  avgSessionDuration: string;
  bounceRate: number;
  
  // Métricas de artigos
  totalArticles: number;
  publishedArticles: number;
  breakingNews: number;
  featuredArticles: number;
  scheduledArticles: number;
  
  // Métricas de engajamento
  totalLikes: number;
  totalBookmarks: number;
  totalComments: number;
  totalShares: number;
  
  // Métricas de usuários
  totalUsers: number;
  activeUsers: number;
  newUsers: number;
  
  // Dados de tendência (últimos 7 dias)
  viewsTrend: { date: string; views: number }[];
  visitorsTrend: { date: string; visitors: number }[];
}

export interface TopContent {
  slug: string;
  title: string;
  views: number;
  likes: number;
  bookmarks: number;
  comments: number;
  shares: number;
  engagement: number;
}

export interface TrafficSource {
  source: string;
  visitors: number;
  percentage: number;
}

export interface DeviceStats {
  device: string;
  visitors: number;
  percentage: number;
}

// ==================== HELPERS DE DATA ====================

interface DateRange {
  from: Date;
  to: Date;
}

function getDefaultDateRange(days = 30): DateRange {
  const to = new Date();
  to.setHours(23, 59, 59, 999);
  const from = new Date();
  from.setDate(from.getDate() - days + 1);
  from.setHours(0, 0, 0, 0);
  return { from, to };
}

function formatDateForDB(date: Date): string {
  return date.toISOString();
}

// ==================== MÉTRICAS DO DASHBOARD ====================

export async function getDashboardMetrics(
  dateRange?: DateRange
): Promise<DashboardMetrics> {
  // Retornar dados vazios se Supabase não estiver configurado
  if (!isSupabaseConfigured) {
    return getEmptyDashboardMetrics();
  }

  try {
    const range = dateRange || getDefaultDateRange(30);
    const fromDateStr = formatDateForDB(range.from);
    const toDateStr = formatDateForDB(range.to);
    
    // Calcular dias do período para o trend
    const daysDiff = Math.ceil((range.to.getTime() - range.from.getTime()) / (1000 * 60 * 60 * 24)) + 1;
    const trendDays = Math.min(Math.max(daysDiff, 7), 30); // Entre 7 e 30 dias para o gráfico

    // Buscar métricas de analytics em paralelo usando safeQuery
    const [
      pageViewsResult,
      uniqueVisitorsResult,
      sessionsResult,
      bookmarksResult,
      usersResult,
      newUsersResult,
      articlesStatsResult,
      viewsTrendResult,
      visitorsTrendResult,
      bounceSessionsResult,
    ] = await Promise.allSettled([
      // Total de page views no período
      safeQuery(
        supabase
          .from('analytics_events')
          .select('*', { count: 'exact', head: true })
          .eq('event_type', 'page_view')
          .gte('timestamp', fromDateStr)
          .lte('timestamp', toDateStr),
        'pageViewsCount'
      ),
      
      // Visitantes únicos (sessões únicas)
      safeQuery(
        supabase
          .from('analytics_sessions')
          .select('*', { count: 'exact', head: true })
          .gte('started_at', fromDateStr)
          .lte('started_at', toDateStr),
        'uniqueVisitorsCount'
      ),
      
      // Duração média das sessões
      safeQuery(
        supabase
          .from('analytics_sessions')
          .select('duration_seconds')
          .gte('started_at', fromDateStr)
          .lte('started_at', toDateStr)
          .neq('duration_seconds', null),
        'sessionDuration'
      ),
      
      // Total de bookmarks
      safeQuery(
        supabase
          .from('bookmarks')
          .select('*', { count: 'exact', head: true }),
        'bookmarksCount'
      ),
      
      // Total de usuários
      safeQuery(
        supabase
          .from('profiles')
          .select('*', { count: 'exact', head: true }),
        'usersCount'
      ),
      
      // Novos usuários no período
      safeQuery(
        supabase
          .from('profiles')
          .select('*', { count: 'exact', head: true })
          .gte('created_at', fromDateStr)
          .lte('created_at', toDateStr),
        'newUsersCount'
      ),
      
      // Stats dos artigos
      getArticlesStats(),
      
      // Tendência de views no período
      getViewsTrendForRange(range.from, range.to, trendDays),
      
      // Tendência de visitantes no período
      getVisitorsTrendForRange(range.from, range.to, trendDays),

      // Bounce rate (sessões com apenas 1 page view)
      safeQuery(
        supabase
          .from('analytics_sessions')
          .select('id')
          .eq('page_views', 1)
          .gte('started_at', fromDateStr)
          .lte('started_at', toDateStr),
        'bounceSessions'
      ),
    ]);

    // Helper para extrair resultado ou usar valor padrão
    const getResult = <T,>(result: PromiseSettledResult<T>, defaultValue: T): T => {
      if (result.status === 'fulfilled') {
        return result.value;
      }
      return defaultValue;
    };

    // Helper para extrair resultado do safeQuery
    const extractResult = <T,>(result: PromiseSettledResult<{ data: T | null; error: Error | null }>, defaultValue: T): T => {
      if (result.status === 'fulfilled' && result.value.data !== null) {
        return result.value.data;
      }
      return defaultValue;
    };

    // Type for articles stats
    interface ArticlesStats {
      total: number;
      published: number;
      breaking: number;
      featured: number;
      scheduled: number;
      totalViews: number;
      totalLikes: number;
      totalComments: number;
      totalShares: number;
    }

    const defaultArticlesStats: ArticlesStats = {
      total: 0,
      published: 0,
      breaking: 0,
      featured: 0,
      scheduled: 0,
      totalViews: 0,
      totalLikes: 0,
      totalComments: 0,
      totalShares: 0,
    };

    // Extrair counts (os resultados de head: true retornam count no objeto, não em data)
    const extractCount = (result: PromiseSettledResult<{ data: unknown; error: Error | null } & Record<string, unknown>>): number => {
      if (result.status === 'fulfilled' && 'count' in result.value) {
        return (result.value.count as number) ?? 0;
      }
      return 0;
    };

    const pageViewsCount = extractCount(pageViewsResult as PromiseSettledResult<{ data: unknown; error: Error | null } & Record<string, unknown>>);
    const uniqueVisitorsCount = extractCount(uniqueVisitorsResult as PromiseSettledResult<{ data: unknown; error: Error | null } & Record<string, unknown>>);
    const sessionsData = extractResult(sessionsResult, [] as { duration_seconds: number }[]);
    const bookmarksCount = extractCount(bookmarksResult as PromiseSettledResult<{ data: unknown; error: Error | null } & Record<string, unknown>>);
    const usersCount = extractCount(usersResult as PromiseSettledResult<{ data: unknown; error: Error | null } & Record<string, unknown>>);
    const newUsersCount = extractCount(newUsersResult as PromiseSettledResult<{ data: unknown; error: Error | null } & Record<string, unknown>>);
    const bounceSessionsData = extractResult(bounceSessionsResult, [] as { id: string }[]);

    // Calcular bounce rate
    const totalSessions = sessionsData.length;
    const bounceSessionsCount = bounceSessionsData.length;
    const bounceRate = totalSessions > 0 ? (bounceSessionsCount / totalSessions) * 100 : 0;

    // Calcular duração média
    const avgDuration = sessionsData.length > 0
      ? sessionsData.reduce((sum: number, s: { duration_seconds?: number }) => sum + (s.duration_seconds || 0), 0) / sessionsData.length
      : 0;

    return {
      // Métricas principais
      totalPageViews: pageViewsCount,
      totalUniqueVisitors: uniqueVisitorsCount,
      avgSessionDuration: formatDuration(avgDuration),
      bounceRate: Math.round(bounceRate),
      
      // Métricas de artigos
      totalArticles: getResult(articlesStatsResult, defaultArticlesStats).total,
      publishedArticles: getResult(articlesStatsResult, defaultArticlesStats).published,
      breakingNews: getResult(articlesStatsResult, defaultArticlesStats).breaking,
      featuredArticles: getResult(articlesStatsResult, defaultArticlesStats).featured,
      scheduledArticles: getResult(articlesStatsResult, defaultArticlesStats).scheduled,
      
      // Métricas de engajamento
      totalLikes: getResult(articlesStatsResult, defaultArticlesStats).totalLikes,
      totalBookmarks: bookmarksCount,
      totalComments: getResult(articlesStatsResult, defaultArticlesStats).totalComments,
      totalShares: getResult(articlesStatsResult, defaultArticlesStats).totalShares,
      
      // Métricas de usuários
      totalUsers: usersCount,
      activeUsers: uniqueVisitorsCount,
      newUsers: newUsersCount,
      
      // Tendências
      viewsTrend: getResult(viewsTrendResult, []),
      visitorsTrend: getResult(visitorsTrendResult, []),
    };
  } catch (error) {
    if (shouldLog('dashboard-metrics-error')) {
      logger.error('Error fetching dashboard metrics:', error);
    }
    return getEmptyDashboardMetrics();
  }
}

// ==================== STATS DOS ARTIGOS ====================

async function getArticlesStats() {
  try {
    const { data: articles } = await supabase
      .from('news_articles')
      .select('status, is_breaking, is_featured, views, likes, shares, comments_count, scheduled_date');

    if (!articles) {
      return {
        total: 0,
        published: 0,
        breaking: 0,
        featured: 0,
        scheduled: 0,
        totalViews: 0,
        totalLikes: 0,
        totalComments: 0,
        totalShares: 0,
      };
    }

    const now = new Date().toISOString();

    return {
      total: articles.length,
      published: articles.filter(a => a.status === 'published').length,
      breaking: articles.filter(a => a.is_breaking).length,
      featured: articles.filter(a => a.is_featured).length,
      scheduled: articles.filter(a => a.scheduled_date && a.scheduled_date > now).length,
      totalViews: articles.reduce((sum, a) => sum + (a.views || 0), 0),
      totalLikes: articles.reduce((sum, a) => sum + (a.likes || 0), 0),
      totalComments: articles.reduce((sum, a) => sum + (a.comments_count || 0), 0),
      totalShares: articles.reduce((sum, a) => sum + (a.shares || 0), 0),
    };
  } catch (error) {
    logger.error('Error fetching articles stats:', error);
    return {
      total: 0,
      published: 0,
      breaking: 0,
      featured: 0,
      scheduled: 0,
      totalViews: 0,
      totalLikes: 0,
      totalComments: 0,
      totalShares: 0,
    };
  }
}

// ==================== TENDÊNCIAS ====================

async function getViewsTrend(days = 7): Promise<{ date: string; views: number }[]> {
  try {
    const trend: { date: string; views: number }[] = [];
    
    for (let i = days - 1; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      const startOfDay = `${dateStr}T00:00:00`;
      const endOfDay = `${dateStr}T23:59:59`;
      
      const { count, error } = await safeQuery(
        supabase
          .from('analytics_events')
          .select('*', { count: 'exact', head: true })
          .eq('event_type', 'page_view')
          .gte('timestamp', startOfDay)
          .lte('timestamp', endOfDay),
        `viewsTrend-${dateStr}`
      );
      
      trend.push({
        date: date.toLocaleDateString('pt-BR', { weekday: 'short', day: 'numeric' }),
        views: error ? 0 : (count ?? 0),
      });
    }
    
    return trend;
  } catch (error) {
    if (shouldLog('views-trend-error')) {
      logger.error('Error fetching views trend:', error);
    }
    return [];
  }
}

async function getVisitorsTrend(days = 7): Promise<{ date: string; visitors: number }[]> {
  try {
    const trend: { date: string; visitors: number }[] = [];
    
    for (let i = days - 1; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      const startOfDay = `${dateStr}T00:00:00`;
      const endOfDay = `${dateStr}T23:59:59`;
      
      const { count, error } = await safeQuery(
        supabase
          .from('analytics_sessions')
          .select('*', { count: 'exact', head: true })
          .gte('started_at', startOfDay)
          .lte('started_at', endOfDay),
        `visitorsTrend-${dateStr}`
      );
      
      trend.push({
        date: date.toLocaleDateString('pt-BR', { weekday: 'short', day: 'numeric' }),
        visitors: error ? 0 : (count ?? 0),
      });
    }
    
    return trend;
  } catch (error) {
    if (shouldLog('visitors-trend-error')) {
      logger.error('Error fetching visitors trend:', error);
    }
    return [];
  }
}

// ==================== TRENDS COM DATE RANGE ====================

async function getViewsTrendForRange(
  from: Date,
  to: Date,
  maxPoints = 30
): Promise<{ date: string; views: number }[]> {
  try {
    const trend: { date: string; views: number }[] = [];
    const totalDays = Math.ceil((to.getTime() - from.getTime()) / (1000 * 60 * 60 * 24)) + 1;
    
    // Limitar o número de pontos no gráfico para não ficar sobrecarregado
    const step = Math.ceil(totalDays / maxPoints);
    
    for (let i = 0; i < totalDays; i += step) {
      const date = new Date(from);
      date.setDate(date.getDate() + i);
      
      // Se for o último ponto e ainda não chegou em 'to', ajusta para 'to'
      if (i + step >= totalDays && date < to) {
        date.setTime(to.getTime());
      }
      
      const dateStr = date.toISOString().split('T')[0];
      const startOfDay = `${dateStr}T00:00:00`;
      const endOfDay = `${dateStr}T23:59:59`;
      
      const { count, error } = await safeQuery(
        supabase
          .from('analytics_events')
          .select('*', { count: 'exact', head: true })
          .eq('event_type', 'page_view')
          .gte('timestamp', startOfDay)
          .lte('timestamp', endOfDay),
        `viewsTrendRange-${dateStr}`
      );
      
      trend.push({
        date: date.toLocaleDateString('pt-BR', { weekday: 'short', day: 'numeric' }),
        views: error ? 0 : (count ?? 0),
      });
    }
    
    return trend;
  } catch (error) {
    if (shouldLog('views-trend-range-error')) {
      logger.error('Error fetching views trend for range:', error);
    }
    return [];
  }
}

async function getVisitorsTrendForRange(
  from: Date,
  to: Date,
  maxPoints = 30
): Promise<{ date: string; visitors: number }[]> {
  try {
    const trend: { date: string; visitors: number }[] = [];
    const totalDays = Math.ceil((to.getTime() - from.getTime()) / (1000 * 60 * 60 * 24)) + 1;
    
    const step = Math.ceil(totalDays / maxPoints);
    
    for (let i = 0; i < totalDays; i += step) {
      const date = new Date(from);
      date.setDate(date.getDate() + i);
      
      if (i + step >= totalDays && date < to) {
        date.setTime(to.getTime());
      }
      
      const dateStr = date.toISOString().split('T')[0];
      const startOfDay = `${dateStr}T00:00:00`;
      const endOfDay = `${dateStr}T23:59:59`;
      
      const { count, error } = await safeQuery(
        supabase
          .from('analytics_sessions')
          .select('*', { count: 'exact', head: true })
          .gte('started_at', startOfDay)
          .lte('started_at', endOfDay),
        `visitorsTrendRange-${dateStr}`
      );
      
      trend.push({
        date: date.toLocaleDateString('pt-BR', { weekday: 'short', day: 'numeric' }),
        visitors: error ? 0 : (count ?? 0),
      });
    }
    
    return trend;
  } catch (error) {
    if (shouldLog('visitors-trend-range-error')) {
      logger.error('Error fetching visitors trend for range:', error);
    }
    return [];
  }
}

// ==================== TOP CONTEÚDO ====================

export async function getTopContent(limit = 10): Promise<TopContent[]> {
  if (!isSupabaseConfigured) {
    return [];
  }

  try {
    const { data: articles, error: articlesError } = await safeQuery(
      supabase
        .from('news_articles')
        .select('slug, title, views, likes, shares, comments_count')
        .order('views', { ascending: false })
        .limit(limit),
      'topContent-articles'
    );

    if (articlesError || !articles) return [];

    // Buscar bookmarks por artigo
    const { data: bookmarksData } = await safeQuery(
      supabase
        .from('bookmarks')
        .select('article_id'),
      'topContent-bookmarks'
    );

    const bookmarksCount: Record<string, number> = {};
    bookmarksData?.forEach((b: { article_id: string }) => {
      bookmarksCount[b.article_id] = (bookmarksCount[b.article_id] || 0) + 1;
    });

    return articles.map((article: { 
      slug: string; 
      title: string; 
      views?: number; 
      likes?: number; 
      shares?: number; 
      comments_count?: number;
    }) => {
      const bookmarks = bookmarksCount[article.slug] || 0;
      const engagement = calculateEngagement({
        views: article.views || 0,
        likes: article.likes || 0,
        bookmarks,
        comments: article.comments_count || 0,
        shares: article.shares || 0,
      });

      return {
        slug: article.slug,
        title: article.title,
        views: article.views || 0,
        likes: article.likes || 0,
        bookmarks,
        comments: article.comments_count || 0,
        shares: article.shares || 0,
        engagement,
      };
    });
  } catch (error) {
    if (shouldLog('top-content-error')) {
      logger.error('Error fetching top content:', error);
    }
    return [];
  }
}

// ==================== FONTES DE TRÁFEGO ====================

export async function getTrafficSources(
  dateRange?: { from: Date; to: Date }
): Promise<TrafficSource[]> {
  if (!isSupabaseConfigured) {
    return [];
  }

  try {
    const range = dateRange || getDefaultDateRange(30);
    const fromDateStr = formatDateForDB(range.from);
    const toDateStr = formatDateForDB(range.to);

    const { data: sessions, error } = await safeQuery(
      supabase
        .from('analytics_sessions')
        .select('referrer')
        .gte('started_at', fromDateStr)
        .lte('started_at', toDateStr),
      'trafficSources'
    );

    if (error || !sessions) return [];

    const sources: Record<string, number> = {};
    sessions.forEach((session: { referrer?: string | null }) => {
      const source = categorizeReferrer(session.referrer ?? null);
      sources[source] = (sources[source] || 0) + 1;
    });

    const total = sessions.length;
    return Object.entries(sources)
      .map(([source, visitors]) => ({
        source,
        visitors,
        percentage: total > 0 ? Math.round((visitors / total) * 100) : 0,
      }))
      .sort((a, b) => b.visitors - a.visitors)
      .slice(0, 5);
  } catch (error) {
    if (shouldLog('traffic-sources-error')) {
      logger.error('Error fetching traffic sources:', error);
    }
    return [];
  }
}

// ==================== DISPOSITIVOS ====================

export async function getDeviceStats(
  dateRange?: { from: Date; to: Date }
): Promise<DeviceStats[]> {
  if (!isSupabaseConfigured) {
    return [];
  }

  try {
    const range = dateRange || getDefaultDateRange(30);
    const fromDateStr = formatDateForDB(range.from);
    const toDateStr = formatDateForDB(range.to);

    const { data: sessions, error } = await safeQuery(
      supabase
        .from('analytics_sessions')
        .select('device_type')
        .gte('started_at', fromDateStr)
        .lte('started_at', toDateStr),
      'deviceStats'
    );

    if (error || !sessions) return [];

    const devices: Record<string, number> = {};
    sessions.forEach((session: { device_type?: string }) => {
      const device = session.device_type || 'desktop';
      devices[device] = (devices[device] || 0) + 1;
    });

    const total = sessions.length;
    return Object.entries(devices)
      .map(([device, visitors]) => ({
        device: capitalize(device),
        visitors,
        percentage: total > 0 ? Math.round((visitors / total) * 100) : 0,
      }))
      .sort((a, b) => b.visitors - a.visitors);
  } catch (error) {
    if (shouldLog('device-stats-error')) {
      logger.error('Error fetching device stats:', error);
    }
    return [];
  }
}

// ==================== ATIVIDADE RECENTE ====================

export interface RecentActivity {
  id: string;
  type: 'view' | 'like' | 'bookmark' | 'share' | 'comment';
  userId?: string;
  articleTitle: string;
  articleSlug: string;
  timestamp: string;
}

export async function getRecentActivity(limit = 20): Promise<RecentActivity[]> {
  if (!isSupabaseConfigured) {
    return [];
  }

  try {
    // Buscar eventos recentes
    const { data: events, error: eventsError } = await safeQuery(
      supabase
        .from('analytics_events')
        .select('id, event_type, user_id, article_id, timestamp, properties')
        .in('event_type', ['page_view', 'like', 'bookmark', 'share', 'comment'])
        .order('timestamp', { ascending: false })
        .limit(limit),
      'recentActivity-events'
    );

    if (eventsError || !events || events.length === 0) return [];

    // Buscar títulos dos artigos
    const articleIds = events.map((e: { article_id?: string }) => e.article_id).filter(Boolean);
    const { data: articles } = await safeQuery(
      supabase
        .from('news_articles')
        .select('id, title, slug')
        .in('id', articleIds),
      'recentActivity-articles'
    );

    const articleMap = new Map<string, { title?: string; slug?: string }>(
      articles?.map((a: { id: string; title?: string; slug?: string }) => [a.id, a]) ?? []
    );

    return events.map((event: { 
      id: string; 
      event_type: string; 
      user_id?: string; 
      article_id?: string; 
      timestamp: string;
      properties?: { article_title?: string; article_slug?: string };
    }) => {
      const article = event.article_id ? articleMap.get(event.article_id) : undefined;
      return {
        id: event.id,
        type: event.event_type as RecentActivity['type'],
        userId: event.user_id,
        articleTitle: article?.title || event.properties?.article_title || 'Artigo desconhecido',
        articleSlug: article?.slug || event.properties?.article_slug || '#',
        timestamp: event.timestamp,
      };
    });
  } catch (error) {
    if (shouldLog('recent-activity-error')) {
      logger.error('Error fetching recent activity:', error);
    }
    return [];
  }
}

// ==================== HELPERS ====================

function formatDuration(seconds: number): string {
  if (seconds < 60) return `${Math.round(seconds)}s`;
  if (seconds < 3600) return `${Math.round(seconds / 60)}min`;
  const hours = Math.floor(seconds / 3600);
  const mins = Math.round((seconds % 3600) / 60);
  return `${hours}h ${mins}min`;
}

function calculateEngagement({
  views,
  likes,
  bookmarks,
  comments,
  shares,
}: {
  views: number;
  likes: number;
  bookmarks: number;
  comments: number;
  shares: number;
}): number {
  if (views === 0) return 0;
  const engagementScore = (likes * 2 + bookmarks * 3 + comments * 4 + shares * 5) / views;
  return Math.round(engagementScore * 100);
}

function categorizeReferrer(referrer: string | null): string {
  if (!referrer) return 'Direto';
  const lower = referrer.toLowerCase();
  
  if (lower.includes('google')) return 'Google';
  if (lower.includes('facebook') || lower.includes('fb')) return 'Facebook';
  if (lower.includes('twitter') || lower.includes('x.com')) return 'Twitter';
  if (lower.includes('linkedin')) return 'LinkedIn';
  if (lower.includes('instagram')) return 'Instagram';
  if (lower.includes('youtube')) return 'YouTube';
  if (lower.includes('whatsapp')) return 'WhatsApp';
  if (lower.includes('telegram')) return 'Telegram';
  
  return 'Outros';
}

function capitalize(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
}

function getEmptyDashboardMetrics(): DashboardMetrics {
  return {
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
}
