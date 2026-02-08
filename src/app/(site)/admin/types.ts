/**
 * Tipos do Admin Dashboard
 */

import type { NewsArticle } from '@/types';
import type { ScheduledArticle, ArticleFilters } from '@/services/newsManager';
import type { AdminUser } from '@/services/adminUsers';
import type { Author } from '@/config/authors';
import type { AppSettings } from '@/hooks/useAppSettings';

// Interface para usuários do sistema
export type SystemUser = AdminUser;

// Tipos de abas
export type AdminTab = 'dashboard' | 'noticias' | 'agendamentos' | 'usuarios' | 'autores' | 'settings';

// Estado dos stats
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

// Estado do formulário de autor
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
  social: {
    twitter?: string;
    linkedin?: string;
    facebook?: string;
    instagram?: string;
  };
  expertise: string;
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
  appSettings: AppSettings;
  isLoading: boolean;
  isSaving: boolean;
  onSettingsChange: (settings: AppSettings) => void;
  onSave: () => void;
  onReset: () => void;
  onAssignPosts: () => void;
  onExport: () => void;
  onCheckScheduled: () => void;
}

// Re-exportar tipos necessários
export type { NewsArticle, ScheduledArticle, ArticleFilters, AdminUser, Author, AppSettings };
