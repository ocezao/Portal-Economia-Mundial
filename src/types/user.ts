/**
 * Tipos de Usuário - Unificados
 * Centraliza todas as definições de tipos relacionados a usuários
 */

// ==================== USER ROLE ====================

export type UserRole = 'user' | 'admin';

// ==================== USER PREFERENCES ====================

export interface UserPreferences {
  // Categorias e tags
  categories: string[];
  tags: string[];
  customTags?: string[];

  // Idioma e acessibilidade
  language: 'pt-BR' | 'en';
  theme?: 'light' | 'dark' | 'system';
  fontSize?: 'small' | 'medium' | 'large';
  layoutDensity?: 'compact' | 'comfortable' | 'spacious';
  reducedMotion: boolean;

  // Notificações
  emailNotifications: boolean;
  pushNotifications: boolean;
  newsletterWeekly?: boolean;
  newsletterDaily?: boolean;
  breakingNewsAlerts?: boolean;
  marketAlerts?: boolean;
  notificationSchedule?: {
    morning: boolean;
    afternoon: boolean;
    evening: boolean;
  };
  quietHoursStart?: string;
  quietHoursEnd?: string;

  // Privacidade
  shareReadingHistory?: boolean;
  allowPersonalization?: boolean;
  analyticsConsent?: boolean;
  marketingConsent?: boolean;
  cookieConsent?: boolean;

  // Feed
  feedLayout?: 'grid' | 'list' | 'compact';
  feedSort?: 'relevance' | 'date' | 'popular';
  contentDensity?: 'minimal' | 'balanced' | 'detailed';
  articlesPerPage?: number;
  hideReadArticles?: boolean;
  showOnlyPreferred?: boolean;
  highlightBreaking?: boolean;

  // Conteúdo
  autoPlayVideos?: boolean;
  loadImages?: boolean;
  infiniteScroll?: boolean;
  showReadingTime?: boolean;
  showRelatedArticles?: boolean;
  contentLanguages?: string[];

  // Interações
  autoBookmarkOnLike?: boolean;
  shareToSocial?: boolean;
  commentNotifications?: boolean;

  // Modo Foco
  focusMode?: boolean;
  focusModeSettings?: {
    hideSidebar: boolean;
    hideComments: boolean;
    hideRelated: boolean;
    readerView: boolean;
  };
}

// ==================== USER (Base) ====================

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  region?: string;
  avatar?: string;
  bio?: string;
  profession?: string;
  company?: string;
  socialLinks?: {
    website?: string;
    twitter?: string;
    linkedin?: string;
    github?: string;
  };
  twoFactorEnabled?: boolean;
  createdAt: string;
  lastLogin: string;
  isActive: boolean;
  preferences: UserPreferences;
}

// ==================== USER (Legacy/Storage) ====================

export interface UserStorage {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  isLoggedIn: boolean;
  isAdmin: boolean;
  createdAt: string;
  lastLogin: string;
  preferences: UserPreferencesLegacy;
}

export interface UserPreferencesLegacy {
  categories: string[];
  notifications: boolean;
  darkMode: boolean;
  fontSize: 'small' | 'medium' | 'large';
  language: 'pt-BR' | 'en';
  emailDigest: boolean;
  pushNotifications: boolean;
}

// ==================== AUTH ====================

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  name: string;
  email: string;
  password: string;
  region?: string;
}

export interface AuthError {
  code: string;
  message: string;
  field?: string;
}
