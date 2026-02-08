/**
 * Constantes Globais do Aplicativo
 */

// ==================== DATAS E CALENDÁRIO ====================

export const MONTH_NAMES = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
];

export const WEEK_DAYS_SHORT = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
export const WEEK_DAYS_SINGLE = ['D', 'S', 'T', 'Q', 'Q', 'S', 'S'];

// ==================== PAGINAÇÃO ====================

export const DEFAULT_PER_PAGE = 10;
export const PER_PAGE_OPTIONS = [5, 10, 25, 50];

// ==================== LIMITES ====================

export const MAX_ARTICLES_EXPORT = 1000;
export const MAX_USER_EXPORT = 10000;

// ==================== STATUS ====================

export const ARTICLE_STATUS = {
  PUBLISHED: 'published',
  DRAFT: 'draft',
  SCHEDULED: 'scheduled',
} as const;

export const USER_ROLES = {
  ADMIN: 'admin',
  USER: 'user',
} as const;

// ==================== CONFIGURAÇÕES DE CACHE ====================

export const CACHE_DURATION = {
  SHORT: 60 * 1000,      // 1 minuto
  MEDIUM: 5 * 60 * 1000, // 5 minutos
  LONG: 30 * 60 * 1000,  // 30 minutos
};

// ==================== INTERVALOS ====================

export const POLLING_INTERVAL = {
  SCHEDULED_CHECK: 60000, // 1 minuto
  MARKET_DATA: 30000,     // 30 segundos
  NOTIFICATIONS: 300000,  // 5 minutos
};
