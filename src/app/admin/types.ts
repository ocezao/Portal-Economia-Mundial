/**
 * Tipos do Admin Dashboard
 */

import type { NewsArticle } from '@/types';
import type { ScheduledArticle, ArticleFilters } from '@/services/newsManager';
import type { AdminUser } from '@/services/adminUsers';
import type { Author } from '@/config/authors';

// Interface para usuÃ¡rios do sistema
export type SystemUser = AdminUser;

// Tipos de abas
export type AdminTab = 'dashboard' | 'noticias' | 'agendamentos' | 'usuarios' | 'autores' | 'settings';

// Estado dos stats (legado - mantido para compatibilidade)
export interface DashboardStats {
  total: number;
  published: number;
  breaking: number;
  featured: number;
  scheduled: number;
  totalViews: number;
  totalLikes: number;
  byCategory: {
    economia: number;
    geopolitica: number;
    tecnologia: number;
  };
}

// Novas mÃ©tricas reais de analytics
export interface AnalyticsMetrics {
  // MÃ©tricas principais
  totalPageViews: number;
  totalUniqueVisitors: number;
  avgSessionDuration: string;
  bounceRate: number;
  
  // MÃ©tricas de conteÃºdo
  totalArticles: number;
  publishedArticles: number;
  breakingNews: number;
  featuredArticles: number;
  scheduledArticles: number;
  
  // MÃ©tricas de engajamento
  totalLikes: number;
  totalBookmarks: number;
  totalComments: number;
  totalShares: number;
  
  // MÃ©tricas de usuÃ¡rios
  totalUsers: number;
  activeUsers: number;
  newUsers: number;
  
  // TendÃªncias
  viewsTrend: { date: string; views: number }[];
  visitorsTrend: { date: string; visitors: number }[];
}

export interface TopContentItem {
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

export interface DeviceStat {
  device: string;
  visitors: number;
  percentage: number;
}

export interface RecentActivityItem {
  id: string;
  type: 'view' | 'like' | 'bookmark' | 'share' | 'comment';
  userId?: string;
  articleTitle: string;
  articleSlug: string;
  timestamp: string;
}

// Estado do formulÃ¡rio de autor
export interface AuthorEducationItem {
  institution: string;
  degree: string;
  year: string;
}

export interface AuthorFormState {
  slug: string;
  name: string;
  shortName: string;
  title: string;
  bio: string;
  longBio: string;
  photo: string;
  email: string;
  website: string;
  location: string;
  social: {
    twitter?: string;
    linkedin?: string;
    facebook?: string;
    instagram?: string;
  };
  expertise: string;
  credentials: string;
  awards: string;
  languages: string;
  joinedAt: string;
  isActive: boolean;
  factChecker: boolean;
  editor: boolean;
  education: AuthorEducationItem[];
}

// Props dos componentes
export interface DashboardStatsProps {
  stats: DashboardStats;
  topArticles: NewsArticle[];
  onNewArticle: () => void;
  onViewArticles: () => void;
  onViewCalendar: () => void;
  onManageUsers: () => void;
}

// Filtro de data
export interface DateRangeFilter {
  from: Date | null;
  to: Date | null;
  label?: string;
}

export type DatePreset = 'today' | 'yesterday' | 'last7days' | 'last30days' | 'last90days' | 'custom';

export interface ArticleTableProps {
  articles: NewsArticle[];
  isLoading: boolean;
  searchTerm: string;
  categoryFilter: string;
  statusFilter: ArticleFilters['status'];
  currentPage: number;
  perPage: number;
  totalPages: number;
  selectedArticles: string[];
  onSearchChange: (value: string) => void;
  onCategoryChange: (value: string) => void;
  onStatusChange: (value: ArticleFilters['status']) => void;
  onPageChange: (page: number) => void;
  onPerPageChange: (perPage: number) => void;
  onToggleSelection: (slug: string) => void;
  onSelectAll: () => void;
  onViewArticle: (slug: string) => void;
  onEditArticle: (slug: string) => void;
  onDuplicateArticle: (article: NewsArticle) => void;
  onDeleteArticle: (article: NewsArticle) => void;
  onNewArticle: () => void;
}

export interface UserManagementProps {
  users: SystemUser[];
  currentUserId: string | undefined;
  userSearch: string;
  onSearchChange: (value: string) => void;
  onAddUser: () => void;
  onEditUser: (user: SystemUser) => void;
  onDeleteUser: (user: SystemUser) => void;
  onExportCSV: () => void;
}

export interface AuthorManagementProps {
  authors: Author[];
  authorSearch: string;
  onSearchChange: (value: string) => void;
  onAddAuthor: () => void;
  onEditAuthor: (author: Author) => void;
  onDeleteAuthor: (author: Author) => void;
  onRestoreAuthor: (author: Author) => void;
}

export interface CalendarViewProps {
  currentMonth: Date;
  scheduledArticles: ScheduledArticle[];
  onPrevMonth: () => void;
  onNextMonth: () => void;
  onDateClick: (day: number) => void;
  onEditScheduled: (scheduled: ScheduledArticle) => void;
  onCancelScheduled: (id: string) => void;
  onNewScheduled: () => void;
}

export interface SettingsPanelProps {
  onReset: () => void;
  onAssignPosts: () => void;
  onExport: () => void;
  onCheckScheduled: () => void;
}

// Re-exportar tipos necessÃ¡rios
export type { NewsArticle, ScheduledArticle, ArticleFilters, AdminUser, Author };

