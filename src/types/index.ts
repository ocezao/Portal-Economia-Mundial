/**
 * Tipos Globais do Cenario Internacional
 */

// ==================== NEWS ====================

export interface NewsArticle {
  id: string;
  slug: string;
  title: string;
  titleEn?: string;
  excerpt: string;
  excerptEn?: string;
  content: string;
  contentEn?: string;
  category: 'geopolitica' | 'economia' | 'tecnologia';
  author: string;
  authorId: string;
  publishedAt: string;
  updatedAt: string;
  readingTime: number;
  coverImage: string;
  tags: string[];
  featured: boolean;
  breaking: boolean;
  views: number;
  likes: number;
  shares: number;
  comments: number;
}

export interface NewsCard {
  slug: string;
  title: string;
  excerpt: string;
  category: string;
  author: string;
  publishedAt: string;
  readingTime: number;
  coverImage: string;
  featured?: boolean;
  breaking?: boolean;
}

// ==================== USER ====================
// Re-exporta de user.ts para manter compatibilidade
export type { 
  User, 
  UserPreferences, 
  UserRole, 
  LoginCredentials, 
  RegisterData, 
  AuthError 
} from './user';

// ==================== MARKET ====================

export interface MarketQuote {
  symbol: string;
  name: string;
  price: number;
  change: number;
  changePercent: number;
  type: 'stock' | 'index' | 'currency' | 'commodity';
  currency: string;
  lastUpdate: string;
}

export interface MarketIndex {
  symbol: string;
  name: string;
  value: number;
  change: number;
  changePercent: number;
  chart?: number[];
}

// ==================== INTERACTIONS ====================

export interface Bookmark {
  articleSlug: string;
  title: string;
  category: string;
  excerpt: string;
  coverImage: string;
  bookmarkedAt: string;
}

export interface ReadingHistory {
  articleSlug: string;
  title: string;
  category: string;
  readAt: string;
  timeSpent: number;
  progress: number;
}

export interface ReadingProgress {
  articleSlug: string;
  progress: number;
  lastPosition: number;
  lastReadAt: string;
}

export interface Comment {
  id: string;
  articleSlug: string;
  author: string;
  authorId: string;
  avatar?: string;
  content: string;
  createdAt: string;
  likes: number;
  replies?: Comment[];
}

// ==================== SEO ====================

export interface SeoMeta {
  title: string;
  description: string;
  keywords?: string[];
  ogImage?: string;
  ogType?: 'website' | 'article';
  canonical?: string;
  noindex?: boolean;
  nofollow?: boolean;
}

export interface JsonLdData {
  '@context': string;
  '@type': string;
  [key: string]: unknown;
}

// ==================== UI ====================

export interface Toast {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  message?: string;
  duration?: number;
}

export interface Modal {
  id: string;
  title: string;
  content: React.ReactNode;
  onClose?: () => void;
}

// ==================== API (Future) ====================

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: ApiError;
  meta?: ApiMeta;
}

export interface ApiError {
  code: string;
  message: string;
  details?: Record<string, string[]>;
}

export interface ApiMeta {
  page: number;
  perPage: number;
  total: number;
  totalPages: number;
}

// ==================== NAVIGATION ====================

export interface NavItem {
  label: string;
  href: string;
  icon?: string;
  children?: NavItem[];
  external?: boolean;
}

export interface BreadcrumbItem {
  label: string;
  href?: string;
}

// ==================== STATS ====================

export interface DailyStats {
  date: string;
  articlesRead: number;
  timeSpent: number;
  bookmarksAdded: number;
  shares: number;
}

export interface ArticleStats {
  slug: string;
  views: number;
  uniqueViews: number;
  avgTimeSpent: number;
  bounceRate: number;
}

// ==================== THEME ====================

export type Theme = 'light' | 'dark' | 'system';

export type FontSize = 'small' | 'medium' | 'large';

// ==================== FORM ====================

export interface FormField {
  name: string;
  label: string;
  type: 'text' | 'email' | 'password' | 'number' | 'select' | 'textarea' | 'checkbox' | 'radio';
  required?: boolean;
  placeholder?: string;
  options?: { value: string; label: string }[];
  validation?: {
    min?: number;
    max?: number;
    pattern?: RegExp;
    message?: string;
  };
}
