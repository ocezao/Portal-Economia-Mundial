/**
 * Configuração de Armazenamento Local
 * Keys e schemas para LocalStorage
 */

export const STORAGE_KEYS = {
  // Auth
  authToken: 'pem_auth_token',
  authSession: 'pem_auth_session',
  registeredUsers: 'pem_registered_users',
  allUsers: 'pem_all_users',
  
  // Usuário
  user: 'pem_user',
  userPreferences: 'pem_preferences',
  userProfile: 'pem_profile',
  
  // Leitura
  readingProgress: 'pem_reading_progress',
  readingHistory: 'pem_reading_history',
  unlockedArticles: 'pem_unlocked_articles',
  
  // Interações
  bookmarks: 'pem_bookmarks',
  likedArticles: 'pem_liked_articles',
  sharedArticles: 'pem_shared_articles',
  
  // Questionário
  surveyData: 'pem_survey_data',
  surveyCompleted: 'pem_survey_completed',
  
  // Notificações
  notifications: 'pem_notifications',
  notificationSettings: 'pem_notification_settings',
  
  // Cache
  marketData: 'pem_market_data',
  marketLastUpdate: 'pem_market_last_update',
  articlesCache: 'pem_articles_cache',
  
  // Configurações
  theme: 'pem_theme',
  language: 'pem_language',
  cookieConsent: 'pem_cookie_consent',
  
  // Analytics
  sessionStart: 'pem_session_start',
  pageViews: 'pem_page_views',
  dailyStats: 'pem_daily_stats',
  
  // Admin
  adminNews: 'pem_admin_news',
  adminMetrics: 'pem_admin_metrics',
} as const;

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

// Helper functions para LocalStorage
export const storage = {
  get: <T>(key: string): T | null => {
    if (typeof window === 'undefined') return null;
    try {
      const item = localStorage.getItem(key);
      return item ? JSON.parse(item) : null;
    } catch {
      return null;
    }
  },
  
  set: <T>(key: string, value: T): void => {
    if (typeof window === 'undefined') return;
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (error) {
      // Silently fail in production
      if (import.meta.env.DEV) {
        // eslint-disable-next-line no-console
        console.error('Error saving to localStorage:', error);
      }
    }
  },
  
  remove: (key: string): void => {
    if (typeof window === 'undefined') return;
    localStorage.removeItem(key);
  },
  
  clear: (): void => {
    if (typeof window === 'undefined') return;
    localStorage.clear();
  },
  
  // Métodos específicos
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
