/**
 * Storage seguro para dados sensÃ­veis
 * Dados sensÃ­veis usam sessionStorage (apenas durante a sessÃ£o)
 * PreferÃªncias pÃºblicas usam localStorage (persistem entre sessÃµes)
 */

// ============================================
// STORAGE SENSÃVEL - sessionStorage
// ============================================
export const secureStorage = {
  set: <T>(key: string, value: T): void => {
    if (typeof window === 'undefined') return;
    try {
      sessionStorage.setItem(key, JSON.stringify(value));
    } catch {
      // Fail silently in production
    }
  },
  
  get: <T>(key: string): T | null => {
    if (typeof window === 'undefined') return null;
    try {
      const item = sessionStorage.getItem(key);
      if (!item) return null;
      try {
        return JSON.parse(item) as T;
      } catch {
        // Backward-compat: older code may have stored plain strings.
        return item as unknown as T;
      }
    } catch {
      return null;
    }
  },
  
  remove: (key: string): void => {
    if (typeof window === 'undefined') return;
    try {
      sessionStorage.removeItem(key);
    } catch {
      // Fail silently
    }
  },
  
  clear: (): void => {
    if (typeof window === 'undefined') return;
    try {
      sessionStorage.clear();
    } catch {
      // Fail silently
    }
  },
};

// ============================================
// STORAGE PÃšBLICO - localStorage
// ============================================
export const publicStorage = {
  set: <T>(key: string, value: T): void => {
    if (typeof window === 'undefined') return;
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch {
      // Fail silently in production
    }
  },
  
  get: <T>(key: string): T | null => {
    if (typeof window === 'undefined') return null;
    try {
      const item = localStorage.getItem(key);
      if (!item) return null;
      try {
        return JSON.parse(item) as T;
      } catch {
        // Backward-compat: older code may have stored plain strings.
        return item as unknown as T;
      }
    } catch {
      return null;
    }
  },
  
  remove: (key: string): void => {
    if (typeof window === 'undefined') return;
    try {
      localStorage.removeItem(key);
    } catch {
      // Fail silently
    }
  },
};

// ============================================
// CHAVES DE STORAGE
// ============================================
export const STORAGE_KEYS = {
  // Auth - SENSÃVEL (sessionStorage)
  authToken: 'cin_auth_token',
  authSession: 'cin_auth_session',
  registeredUsers: 'cin_registered_users',
  allUsers: 'cin_all_users',
  
  // UsuÃ¡rio - SENSÃVEL (sessionStorage)
  user: 'cin_user',
  userProfile: 'cin_profile',
  
  // PreferÃªncias - PÃšBLICO (localStorage)
  userPreferences: 'cin_preferences',
  
  // Leitura - SENSÃVEL (sessionStorage)
  readingProgress: 'cin_reading_progress',
  readingHistory: 'cin_reading_history',
  unlockedArticles: 'cin_unlocked_articles',
  
  // InteraÃ§Ãµes - SENSÃVEL (sessionStorage)
  bookmarks: 'cin_bookmarks',
  likedArticles: 'cin_liked_articles',
  sharedArticles: 'cin_shared_articles',
  
  // QuestionÃ¡rio - SENSÃVEL (sessionStorage)
  surveyData: 'cin_survey_data',
  surveyCompleted: 'cin_survey_completed',
  
  // NotificaÃ§Ãµes - PÃšBLICO (localStorage)
  notifications: 'cin_notifications',
  notificationSettings: 'cin_notification_settings',
  
  // Cache - PÃšBLICO (localStorage)
  marketData: 'cin_market_data',
  marketLastUpdate: 'cin_market_last_update',
  articlesCache: 'cin_articles_cache',
  
  // ConfiguraÃ§Ãµes - PÃšBLICO (localStorage)
  theme: 'cin_theme',
  language: 'cin_language',
  cookieConsent: 'cin_cookie_consent',
  
  // Analytics - PÃšBLICO (localStorage)
  sessionStart: 'cin_session_start',
  pageViews: 'cin_page_views',
  dailyStats: 'cin_daily_stats',
  
  // Admin - SENSÃVEL (sessionStorage)
  adminNews: 'cin_admin_news',
  adminMetrics: 'cin_admin_metrics',
} as const;

// ============================================
// INTERFACES
// ============================================
export interface UserData {
  id: string;
  name: string;
  email: string;
  isLoggedIn: boolean;
  isAdmin: boolean;
  createdAt: string;
  lastLogin: string;
}

export interface UserPreferences {
  categories: string[];
  notifications: boolean;
  darkMode: boolean;
  fontSize: 'small' | 'medium' | 'large';
  language: 'pt-BR' | 'en';
}

export interface ReadingProgress {
  articleSlug: string;
  progress: number; // 0-100
  lastPosition: number;
  lastReadAt: string;
}

export interface ReadingHistory {
  articleSlug: string;
  title: string;
  category: string;
  readAt: string;
  timeSpent: number; // segundos
}

export interface Bookmark {
  articleSlug: string;
  title: string;
  category: string;
  excerpt: string;
  coverImage: string;
  bookmarkedAt: string;
}

export interface SurveyData {
  name: string;
  age: number;
  gender: 'M' | 'F' | 'O' | 'N';
  region: string;
  interests: string[];
  completedAt: string;
}

export interface DailyStats {
  date: string;
  articlesRead: number;
  timeSpent: number;
  bookmarksAdded: number;
  shares: number;
}

// ============================================
// STORAGE UNIFICADO (mantÃ©m compatibilidade)
// ============================================

// Chaves que devem usar sessionStorage (sensÃ­veis)
const SENSITIVE_KEYS: Set<string> = new Set([
  STORAGE_KEYS.authToken,
  STORAGE_KEYS.authSession,
  STORAGE_KEYS.registeredUsers,
  STORAGE_KEYS.allUsers,
  STORAGE_KEYS.user,
  STORAGE_KEYS.userProfile,
  STORAGE_KEYS.readingProgress,
  STORAGE_KEYS.readingHistory,
  STORAGE_KEYS.unlockedArticles,
  STORAGE_KEYS.bookmarks,
  STORAGE_KEYS.likedArticles,
  STORAGE_KEYS.sharedArticles,
  STORAGE_KEYS.surveyData,
  STORAGE_KEYS.surveyCompleted,
  STORAGE_KEYS.adminNews,
  STORAGE_KEYS.adminMetrics,
]);

/**
 * Determina se uma chave deve usar storage seguro (sessionStorage)
 */
const isSensitiveKey = (key: string): boolean => {
  // Verifica se a chave estÃ¡ na lista de chaves sensÃ­veis
  if (SENSITIVE_KEYS.has(key as unknown as typeof STORAGE_KEYS[keyof typeof STORAGE_KEYS])) {
    return true;
  }
  // Verifica padrÃµes de chaves dinÃ¢micas sensÃ­veis
  if (key.startsWith('cin_preferences_')) return false; // preferÃªncias sÃ£o pÃºblicas
  return false;
};

/**
 * Storage unificado - automaticamente escolhe sessionStorage ou localStorage
 * baseado na sensibilidade da chave
 */
export const storage = {
  get: <T>(key: string): T | null => {
    if (typeof window === 'undefined') return null;
    try {
      const storage = isSensitiveKey(key) ? sessionStorage : localStorage;
      const item = storage.getItem(key);
      return item ? JSON.parse(item) : null;
    } catch {
      return null;
    }
  },
  
  set: <T>(key: string, value: T): void => {
    if (typeof window === 'undefined') return;
    try {
      const storage = isSensitiveKey(key) ? sessionStorage : localStorage;
      storage.setItem(key, JSON.stringify(value));
    } catch {
      // Silently fail in production
    }
  },
  
  remove: (key: string): void => {
    if (typeof window === 'undefined') return;
    try {
      const storage = isSensitiveKey(key) ? sessionStorage : localStorage;
      storage.removeItem(key);
    } catch {
      // Silently fail
    }
  },
  
  clear: (): void => {
    if (typeof window === 'undefined') return;
    try {
      // Limpa ambos os storages
      sessionStorage.clear();
      localStorage.clear();
    } catch {
      // Silently fail
    }
  },
  
  // Limpa apenas dados sensÃ­veis (Ãºtil no logout)
  clearSensitive: (): void => {
    if (typeof window === 'undefined') return;
    try {
      sessionStorage.clear();
    } catch {
      // Silently fail
    }
  },
  
  // MÃ©todos especÃ­ficos (mantÃªm compatibilidade)
  getUser: (): UserData | null => storage.get(STORAGE_KEYS.user),
  setUser: (user: UserData) => storage.set(STORAGE_KEYS.user, user),
  removeUser: () => storage.remove(STORAGE_KEYS.user),
  
  getPreferences: (): UserPreferences | null => storage.get(STORAGE_KEYS.userPreferences),
  setPreferences: (prefs: UserPreferences) => storage.set(STORAGE_KEYS.userPreferences, prefs),
  
  getBookmarks: (): Bookmark[] => storage.get(STORAGE_KEYS.bookmarks) || [],
  addBookmark: (bookmark: Bookmark) => {
    const bookmarks = storage.getBookmarks();
    if (!bookmarks.find(b => b.articleSlug === bookmark.articleSlug)) {
      storage.set(STORAGE_KEYS.bookmarks, [...bookmarks, bookmark]);
    }
  },
  removeBookmark: (slug: string) => {
    const bookmarks = storage.getBookmarks();
    storage.set(STORAGE_KEYS.bookmarks, bookmarks.filter(b => b.articleSlug !== slug));
  },
  
  getReadingHistory: (): ReadingHistory[] => storage.get(STORAGE_KEYS.readingHistory) || [],
  addToHistory: (entry: ReadingHistory) => {
    const history = storage.getReadingHistory();
    const filtered = history.filter(h => h.articleSlug !== entry.articleSlug);
    storage.set(STORAGE_KEYS.readingHistory, [entry, ...filtered].slice(0, 50));
  },
  
  getUnlockedArticles: (): string[] => storage.get(STORAGE_KEYS.unlockedArticles) || [],
  unlockArticle: (slug: string) => {
    const unlocked = storage.getUnlockedArticles();
    if (!unlocked.includes(slug)) {
      storage.set(STORAGE_KEYS.unlockedArticles, [...unlocked, slug]);
    }
  },
  
  getSurveyData: (): SurveyData | null => storage.get(STORAGE_KEYS.surveyData),
  setSurveyData: (data: SurveyData) => {
    storage.set(STORAGE_KEYS.surveyData, data);
    storage.set(STORAGE_KEYS.surveyCompleted, true);
  },
  hasCompletedSurvey: (): boolean => storage.get(STORAGE_KEYS.surveyCompleted) || false,
  
  getDailyStats: (): DailyStats => {
    const today = new Date().toISOString().split('T')[0];
    const stats = storage.get<DailyStats>(STORAGE_KEYS.dailyStats);
    if (stats?.date === today) return stats;
    return { date: today, articlesRead: 0, timeSpent: 0, bookmarksAdded: 0, shares: 0 };
  },
  updateDailyStats: (update: Partial<DailyStats>) => {
    const stats = storage.getDailyStats();
    storage.set(STORAGE_KEYS.dailyStats, { ...stats, ...update });
  },
};
