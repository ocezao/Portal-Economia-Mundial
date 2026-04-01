import { queryOne, queryRows } from '@/lib/db';
import { logger } from '@/lib/logger';

const logCache = new Map<string, number>();
const LOG_THROTTLE_MS = 30_000;

function shouldLog(key: string): boolean {
  const now = Date.now();
  const lastLog = logCache.get(key);
  if (!lastLog || now - lastLog > LOG_THROTTLE_MS) {
    logCache.set(key, now);
    return true;
  }
  return false;
}

export interface RealTimeStats {
  totalViews: number;
  uniqueVisitors: number;
  avgSessionDuration: string;
  bounceRate: number;
}

export interface DashboardMetrics {
  totalPageViews: number;
  totalUniqueVisitors: number;
  avgSessionDuration: string;
  bounceRate: number;
  totalArticles: number;
  publishedArticles: number;
  breakingNews: number;
  featuredArticles: number;
  scheduledArticles: number;
  totalLikes: number;
  totalBookmarks: number;
  totalComments: number;
  totalShares: number;
  totalUsers: number;
  activeUsers: number;
  newUsers: number;
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

export interface RecentActivity {
  id: string;
  type: 'view' | 'like' | 'bookmark' | 'share' | 'comment';
  userId?: string;
  articleTitle: string;
  articleSlug: string;
  timestamp: string;
}

interface DateRange {
  from: Date;
  to: Date;
}

type NumericValue = number | string | null | undefined;

function toNumber(value: NumericValue): number {
  if (typeof value === 'number') return value;
  if (typeof value === 'string') {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : 0;
  }
  return 0;
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

function getSettledValue<T>(result: PromiseSettledResult<T>, fallback: T): T {
  return result.status === 'fulfilled' ? result.value : fallback;
}

async function getCount(sql: string, params: unknown[] = []): Promise<number> {
  const row = await queryOne<{ total: NumericValue }>(sql, params);
  return toNumber(row?.total);
}

async function getArticlesStats() {
  const row = await queryOne<{
    total: NumericValue;
    published: NumericValue;
    breaking: NumericValue;
    featured: NumericValue;
    scheduled: NumericValue;
    total_views: NumericValue;
    total_likes: NumericValue;
    total_comments: NumericValue;
    total_shares: NumericValue;
  }>(
    `select
       count(*) as total,
       count(*) filter (where status = 'published') as published,
       count(*) filter (where is_breaking = true) as breaking,
       count(*) filter (where is_featured = true) as featured,
       count(*) filter (where status = 'scheduled') as scheduled,
       coalesce(sum(views), 0) as total_views,
       coalesce(sum(likes), 0) as total_likes,
       coalesce(sum(comments_count), 0) as total_comments,
       coalesce(sum(shares), 0) as total_shares
     from news_articles`,
  );

  return {
    total: toNumber(row?.total),
    published: toNumber(row?.published),
    breaking: toNumber(row?.breaking),
    featured: toNumber(row?.featured),
    scheduled: toNumber(row?.scheduled),
    totalViews: toNumber(row?.total_views),
    totalLikes: toNumber(row?.total_likes),
    totalComments: toNumber(row?.total_comments),
    totalShares: toNumber(row?.total_shares),
  };
}

async function buildTrendSeries(
  sql: string,
  params: unknown[],
  from: Date,
  to: Date,
  maxPoints: number,
  valueKey: 'views' | 'visitors',
): Promise<{ date: string; [key: string]: string | number }[]> {
  const rows = await queryRows<{ day: string; total: NumericValue }>(sql, params);
  const totalsByDay = new Map(rows.map((row) => [row.day, toNumber(row.total)]));
  const points: { date: string; [key: string]: string | number }[] = [];

  const cursor = new Date(from);
  while (cursor <= to) {
    const isoDay = cursor.toISOString().slice(0, 10);
    points.push({
      date: cursor.toLocaleDateString('pt-BR', { weekday: 'short', day: 'numeric' }),
      [valueKey]: totalsByDay.get(isoDay) ?? 0,
    });
    cursor.setDate(cursor.getDate() + 1);
  }

  if (points.length <= maxPoints) return points;

  const step = Math.ceil(points.length / maxPoints);
  return points.filter((_, index) => index % step === 0 || index === points.length - 1);
}

export async function getDashboardMetrics(dateRange?: DateRange): Promise<DashboardMetrics> {
  try {
    const range = dateRange || getDefaultDateRange(30);
    const fromDateStr = formatDateForDB(range.from);
    const toDateStr = formatDateForDB(range.to);
    const totalDays =
      Math.ceil((range.to.getTime() - range.from.getTime()) / (1000 * 60 * 60 * 24)) + 1;
    const trendDays = Math.min(Math.max(totalDays, 7), 30);

    const [
      pageViewsResult,
      uniqueVisitorsResult,
      sessionSummaryResult,
      bookmarksResult,
      usersResult,
      newUsersResult,
      articlesStatsResult,
      viewsTrendResult,
      visitorsTrendResult,
    ] = await Promise.allSettled([
      getCount(
        `select count(*) as total
         from analytics_events
         where event_type = 'page_view'
           and timestamp >= $1
           and timestamp <= $2`,
        [fromDateStr, toDateStr],
      ),
      getCount(
        `select count(*) as total
         from analytics_sessions
         where started_at >= $1
           and started_at <= $2`,
        [fromDateStr, toDateStr],
      ),
      queryOne<{
        avg_duration: NumericValue;
        total_sessions: NumericValue;
        bounce_sessions: NumericValue;
      }>(
        `select
           coalesce(avg(duration_seconds), 0) as avg_duration,
           count(*) as total_sessions,
           count(*) filter (where page_views = 1) as bounce_sessions
         from analytics_sessions
         where started_at >= $1
           and started_at <= $2`,
        [fromDateStr, toDateStr],
      ),
      getCount('select count(*) as total from bookmarks'),
      getCount('select count(*) as total from profiles'),
      getCount(
        `select count(*) as total
         from profiles
         where created_at >= $1
           and created_at <= $2`,
        [fromDateStr, toDateStr],
      ),
      getArticlesStats(),
      buildTrendSeries(
        `select to_char(date_trunc('day', timestamp), 'YYYY-MM-DD') as day, count(*) as total
         from analytics_events
         where event_type = 'page_view'
           and timestamp >= $1
           and timestamp <= $2
         group by 1
         order by 1`,
        [fromDateStr, toDateStr],
        range.from,
        range.to,
        trendDays,
        'views',
      ) as Promise<{ date: string; views: number }[]>,
      buildTrendSeries(
        `select to_char(date_trunc('day', started_at), 'YYYY-MM-DD') as day, count(*) as total
         from analytics_sessions
         where started_at >= $1
           and started_at <= $2
         group by 1
         order by 1`,
        [fromDateStr, toDateStr],
        range.from,
        range.to,
        trendDays,
        'visitors',
      ) as Promise<{ date: string; visitors: number }[]>,
    ]);

    const sessionSummary = getSettledValue(sessionSummaryResult, null);
    const totalSessions = toNumber(sessionSummary?.total_sessions);
    const bounceSessions = toNumber(sessionSummary?.bounce_sessions);
    const bounceRate = totalSessions > 0 ? Math.round((bounceSessions / totalSessions) * 100) : 0;
    const avgDuration = toNumber(sessionSummary?.avg_duration);
    const articleStats = getSettledValue(articlesStatsResult, {
      total: 0,
      published: 0,
      breaking: 0,
      featured: 0,
      scheduled: 0,
      totalViews: 0,
      totalLikes: 0,
      totalComments: 0,
      totalShares: 0,
    });

    return {
      totalPageViews: getSettledValue(pageViewsResult, 0),
      totalUniqueVisitors: getSettledValue(uniqueVisitorsResult, 0),
      avgSessionDuration: formatDuration(avgDuration),
      bounceRate,
      totalArticles: articleStats.total,
      publishedArticles: articleStats.published,
      breakingNews: articleStats.breaking,
      featuredArticles: articleStats.featured,
      scheduledArticles: articleStats.scheduled,
      totalLikes: articleStats.totalLikes,
      totalBookmarks: getSettledValue(bookmarksResult, 0),
      totalComments: articleStats.totalComments,
      totalShares: articleStats.totalShares,
      totalUsers: getSettledValue(usersResult, 0),
      activeUsers: getSettledValue(uniqueVisitorsResult, 0),
      newUsers: getSettledValue(newUsersResult, 0),
      viewsTrend: getSettledValue(viewsTrendResult, []),
      visitorsTrend: getSettledValue(visitorsTrendResult, []),
    };
  } catch (error) {
    if (shouldLog('dashboard-metrics-error')) {
      logger.error('Error fetching dashboard metrics:', error);
    }
    return getEmptyDashboardMetrics();
  }
}

export async function getTopContent(limit = 10): Promise<TopContent[]> {
  try {
    const rows = await queryRows<{
      slug: string;
      title: string;
      views: NumericValue;
      likes: NumericValue;
      comments_count: NumericValue;
      shares: NumericValue;
      bookmarks: NumericValue;
    }>(
      `select
         na.slug,
         na.title,
         na.views,
         na.likes,
         na.comments_count,
         na.shares,
         count(b.id) as bookmarks
       from news_articles na
       left join bookmarks b on b.article_id = na.id
       where na.status = 'published'
       group by na.id
       order by na.views desc, na.published_at desc nulls last
       limit $1`,
      [limit],
    );

    return rows.map((row) => {
      const views = toNumber(row.views);
      const likes = toNumber(row.likes);
      const comments = toNumber(row.comments_count);
      const shares = toNumber(row.shares);
      const bookmarks = toNumber(row.bookmarks);

      return {
        slug: row.slug,
        title: row.title,
        views,
        likes,
        bookmarks,
        comments,
        shares,
        engagement: calculateEngagement({ views, likes, bookmarks, comments, shares }),
      };
    });
  } catch (error) {
    if (shouldLog('top-content-error')) {
      logger.error('Error fetching top content:', error);
    }
    return [];
  }
}

export async function getTrafficSources(
  dateRange?: { from: Date; to: Date },
): Promise<TrafficSource[]> {
  try {
    const range = dateRange || getDefaultDateRange(30);
    const rows = await queryRows<{ referrer: string | null; total: NumericValue }>(
      `select referrer, count(*) as total
       from analytics_sessions
       where started_at >= $1
         and started_at <= $2
       group by referrer`,
      [formatDateForDB(range.from), formatDateForDB(range.to)],
    );

    const grouped = new Map<string, number>();
    let total = 0;

    for (const row of rows) {
      const visitors = toNumber(row.total);
      total += visitors;
      const key = categorizeReferrer(row.referrer);
      grouped.set(key, (grouped.get(key) ?? 0) + visitors);
    }

    return Array.from(grouped.entries())
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

export async function getDeviceStats(
  dateRange?: { from: Date; to: Date },
): Promise<DeviceStats[]> {
  try {
    const range = dateRange || getDefaultDateRange(30);
    const rows = await queryRows<{ device_type: string | null; total: NumericValue }>(
      `select device_type, count(*) as total
       from analytics_sessions
       where started_at >= $1
         and started_at <= $2
       group by device_type`,
      [formatDateForDB(range.from), formatDateForDB(range.to)],
    );

    const total = rows.reduce((sum, row) => sum + toNumber(row.total), 0);

    return rows
      .map((row) => ({
        device: capitalize(row.device_type || 'desktop'),
        visitors: toNumber(row.total),
        percentage: total > 0 ? Math.round((toNumber(row.total) / total) * 100) : 0,
      }))
      .sort((a, b) => b.visitors - a.visitors);
  } catch (error) {
    if (shouldLog('device-stats-error')) {
      logger.error('Error fetching device stats:', error);
    }
    return [];
  }
}

export async function getRecentActivity(limit = 20): Promise<RecentActivity[]> {
  try {
    const rows = await queryRows<{
      id: string;
      event_type: string;
      user_id: string | null;
      timestamp: string;
      properties: { article_title?: string; article_slug?: string } | null;
      article_title: string | null;
      article_slug: string | null;
    }>(
      `select
         ae.id,
         ae.event_type,
         ae.user_id::text,
         ae.timestamp,
         ae.properties,
         na.title as article_title,
         na.slug as article_slug
       from analytics_events ae
       left join news_articles na on na.id = ae.article_id
       where ae.event_type in ('page_view', 'like', 'bookmark', 'share', 'comment')
       order by ae.timestamp desc
       limit $1`,
      [limit],
    );

    return rows.map((row) => ({
      id: row.id,
      type: row.event_type === 'page_view' ? 'view' : (row.event_type as RecentActivity['type']),
      userId: row.user_id ?? undefined,
      articleTitle: row.article_title || row.properties?.article_title || 'Artigo desconhecido',
      articleSlug: row.article_slug || row.properties?.article_slug || '#',
      timestamp: row.timestamp,
    }));
  } catch (error) {
    if (shouldLog('recent-activity-error')) {
      logger.error('Error fetching recent activity:', error);
    }
    return [];
  }
}
