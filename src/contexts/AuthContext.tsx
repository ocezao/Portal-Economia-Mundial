'use client';

/**
 * Auth Context - Sistema de Autenticação com Supabase
 * Provider + Hook para gerenciamento global de autenticação
 */

import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react';
import { storage, STORAGE_KEYS } from '@/config/storage';
import { supabase, isSupabaseConfigured } from '@/lib/supabaseClient';
import { logger } from '@/lib/logger';
import type { User as SupabaseUser } from '@supabase/supabase-js';
import { usePathname, useRouter } from 'next/navigation';

// ==================== TIPOS ====================

export type UserRole = 'user' | 'admin';

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

interface AuthContextType {
  // Estado
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  isAdmin: boolean;
  error: AuthError | null;

  // Ações
  login: (credentials: LoginCredentials) => Promise<boolean>;
  register: (data: RegisterData) => Promise<boolean>;
  logout: () => void;
  clearError: () => void;
  updateUser: (updates: Partial<User>) => void;
  updatePreferences: (prefs: Partial<UserPreferences>) => void;

  // Helpers
  checkPermission: (requiredRole: UserRole) => boolean;
  getSessionTimeRemaining: () => number;
}

// ==================== CONFIGURAÇÃO ====================

const DEFAULT_PREFERENCES: UserPreferences = {
  categories: [],
  tags: [],
  language: 'pt-BR',
  reducedMotion: false,
  emailNotifications: true,
  pushNotifications: false,
};

const getPreferencesKey = (userId: string) => `${STORAGE_KEYS.userPreferences}_${userId}`;

const loadUserPreferences = (userId: string): UserPreferences => {
  return storage.get<UserPreferences>(getPreferencesKey(userId)) ?? DEFAULT_PREFERENCES;
};

const saveUserPreferences = (userId: string, preferences: UserPreferences) => {
  storage.set(getPreferencesKey(userId), preferences);
};

const mapSupabaseUser = (supabaseUser: SupabaseUser): User => {
  const metadata = supabaseUser.user_metadata ?? {};
  const preferences = loadUserPreferences(supabaseUser.id);

  return {
    id: supabaseUser.id,
    name: metadata.name ?? supabaseUser.email ?? 'Usuário',
    email: supabaseUser.email ?? '',
    role: (metadata.role as UserRole) ?? 'user',
    region: metadata.region ?? 'BR',
    avatar: metadata.avatar ?? metadata.avatar_url,
    bio: metadata.bio,
    profession: metadata.profession,
    company: metadata.company,
    socialLinks: metadata.socialLinks,
    twoFactorEnabled: metadata.twoFactorEnabled,
    createdAt: supabaseUser.created_at ?? new Date().toISOString(),
    lastLogin: metadata.lastLogin ?? new Date().toISOString(),
    isActive: true,
    preferences,
  };
};

const updateSupabaseMetadata = async (updates: Partial<User>) => {
  if (!isSupabaseConfigured) return;
  const metadataUpdates: Record<string, unknown> = {};

  if (updates.name !== undefined) metadataUpdates.name = updates.name;
  if (updates.region !== undefined) metadataUpdates.region = updates.region;
  if (updates.avatar !== undefined) metadataUpdates.avatar = updates.avatar;
  if (updates.bio !== undefined) metadataUpdates.bio = updates.bio;
  if (updates.profession !== undefined) metadataUpdates.profession = updates.profession;
  if (updates.company !== undefined) metadataUpdates.company = updates.company;
  if (updates.socialLinks !== undefined) metadataUpdates.socialLinks = updates.socialLinks;
  if (updates.twoFactorEnabled !== undefined) metadataUpdates.twoFactorEnabled = updates.twoFactorEnabled;
  if (updates.role !== undefined) metadataUpdates.role = updates.role;
  if (updates.lastLogin !== undefined) metadataUpdates.lastLogin = updates.lastLogin;

  if (Object.keys(metadataUpdates).length === 0) return;

  const { error } = await supabase.auth.updateUser({ data: metadataUpdates });
  if (error) {
    logger.error('Erro ao atualizar metadata do usuário:', error.message);
  }
};

// ==================== CONTEXT ====================

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// ==================== PROVIDER ====================

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<AuthError | null>(null);
  const [sessionExpiresAt, setSessionExpiresAt] = useState<number | null>(null);

  useEffect(() => {
    let isMounted = true;

    if (!isSupabaseConfigured || !supabase) {
      setUser(null);
      setSessionExpiresAt(null);
      setIsLoading(false);
      return () => {
        isMounted = false;
      };
    }

    const initAuth = async () => {
      setIsLoading(true);
      const { data, error: sessionError } = await supabase.auth.getSession();

      if (!isMounted) return;

      if (sessionError) {
        setError({
          code: 'AUTH_SESSION_ERROR',
          message: 'Erro ao carregar sessão. Tente novamente.',
        });
      }

      if (data.session?.user) {
        const mappedUser = mapSupabaseUser(data.session.user);
        setUser(mappedUser);
        setSessionExpiresAt(data.session.expires_at ? data.session.expires_at * 1000 : null);
      } else {
        setUser(null);
        setSessionExpiresAt(null);
      }

      setIsLoading(false);
    };

    initAuth();

    const { data: listener } = supabase.auth.onAuthStateChange((event, session) => {
      if (!isMounted) return;

      if (session?.user) {
        const mappedUser = mapSupabaseUser(session.user);
        setUser(mappedUser);
        setSessionExpiresAt(session.expires_at ? session.expires_at * 1000 : null);

        if (event === 'SIGNED_IN') {
          const lastLogin = new Date().toISOString();
          updateSupabaseMetadata({ lastLogin });
          setUser({ ...mappedUser, lastLogin });
        }
      } else {
        setUser(null);
        setSessionExpiresAt(null);
      }
    });

    return () => {
      isMounted = false;
      listener.subscription.unsubscribe();
    };
  }, []);

  // Login
  const login = useCallback(async (credentials: LoginCredentials): Promise<boolean> => {
    setIsLoading(true);
    setError(null);

    if (!isSupabaseConfigured) {
      setError({
        code: 'AUTH_SUPABASE_NOT_CONFIGURED',
        message: 'Supabase nÃ£o configurado. Defina NEXT_PUBLIC_SUPABASE_URL e NEXT_PUBLIC_SUPABASE_ANON_KEY no .env.',
      });
      setIsLoading(false);
      return false;
    }

    const { data, error: signInError } = await supabase.auth.signInWithPassword({
      email: credentials.email.toLowerCase().trim(),
      password: credentials.password,
    });

    if (signInError) {
      setError({
        code: signInError.status === 400 ? 'AUTH_INVALID_CREDENTIALS' : 'AUTH_UNKNOWN_ERROR',
        message: signInError.message || 'E-mail ou senha incorretos',
      });
      setIsLoading(false);
      return false;
    }

    if (!data.session?.user) {
      setError({
        code: 'AUTH_NO_SESSION',
        message: 'Sessão não encontrada. Tente novamente.',
      });
      setIsLoading(false);
      return false;
    }

    const mappedUser = mapSupabaseUser(data.session.user);
    const lastLogin = new Date().toISOString();
    setUser({ ...mappedUser, lastLogin });
    setSessionExpiresAt(data.session.expires_at ? data.session.expires_at * 1000 : null);
    updateSupabaseMetadata({ lastLogin });

    setIsLoading(false);
    return true;
  }, []);

  // Registro
  const register = useCallback(async (data: RegisterData): Promise<boolean> => {
    setIsLoading(true);
    setError(null);

    if (!isSupabaseConfigured) {
      setError({
        code: 'AUTH_SUPABASE_NOT_CONFIGURED',
        message: 'Supabase nÃ£o configurado. Defina NEXT_PUBLIC_SUPABASE_URL e NEXT_PUBLIC_SUPABASE_ANON_KEY no .env.',
      });
      setIsLoading(false);
      return false;
    }

    const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
      email: data.email.toLowerCase().trim(),
      password: data.password,
      options: {
        data: {
          name: data.name.trim(),
          region: data.region || 'BR',
          role: 'user',
        },
      },
    });

    if (signUpError) {
      setError({
        code: signUpError.status === 400 ? 'AUTH_INVALID_CREDENTIALS' : 'AUTH_UNKNOWN_ERROR',
        message: signUpError.message || 'Erro ao criar conta. Tente novamente.',
      });
      setIsLoading(false);
      return false;
    }

    if (signUpData.session?.user) {
      const mappedUser = mapSupabaseUser(signUpData.session.user);
      setUser(mappedUser);
      setSessionExpiresAt(signUpData.session.expires_at ? signUpData.session.expires_at * 1000 : null);
    }

    setIsLoading(false);
    return true;
  }, []);

  // Logout
  const logout = useCallback(() => {
    setIsLoading(true);
    if (!isSupabaseConfigured) {
      setUser(null);
      setSessionExpiresAt(null);
      setIsLoading(false);
      return;
    }
    supabase.auth.signOut().finally(() => {
      setUser(null);
      setSessionExpiresAt(null);
      setIsLoading(false);
    });
  }, []);

  // Limpar erro
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  // Atualizar usuário
  const updateUser = useCallback((updates: Partial<User>) => {
    if (!user) return;

    const updatedUser = { ...user, ...updates };
    setUser(updatedUser);
    updateSupabaseMetadata(updates);
  }, [user]);

  // Atualizar preferências
  const updatePreferences = useCallback((prefs: Partial<UserPreferences>) => {
    if (!user) return;

    const updatedPreferences = { ...user.preferences, ...prefs };
    saveUserPreferences(user.id, updatedPreferences);
    updateUser({ preferences: updatedPreferences });
  }, [user, updateUser]);

  // Verificar permissão
  const checkPermission = useCallback((requiredRole: UserRole): boolean => {
    if (!user) return false;
    if (requiredRole === 'admin') return user.role === 'admin';
    return true;
  }, [user]);

  // Tempo restante da sessão
  const getSessionTimeRemaining = useCallback((): number => {
    if (!sessionExpiresAt) return 0;
    return Math.max(0, sessionExpiresAt - Date.now());
  }, [sessionExpiresAt]);

  const value: AuthContextType = {
    user,
    isLoading,
    isAuthenticated: !!user,
    isAdmin: user?.role === 'admin',
    error,
    login,
    register,
    logout,
    clearError,
    updateUser,
    updatePreferences,
    checkPermission,
    getSessionTimeRemaining,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

// ==================== HOOK ====================

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth deve ser usado dentro de um AuthProvider');
  }
  return context;
}

// ==================== HOC PARA PROTEÇÃO DE ROTAS ====================

interface ProtectedRouteProps {
  children: ReactNode;
  requiredRole?: UserRole;
}

export function ProtectedRoute({ children, requiredRole }: ProtectedRouteProps) {
  const { isAuthenticated, isAdmin, isLoading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (isLoading) return;

    if (!isAuthenticated) {
      const next = pathname || '/';
      router.replace(`/login?redirect=${encodeURIComponent(next)}`);
      return;
    }

    if (requiredRole === 'admin' && !isAdmin) {
      router.replace('/app');
      return;
    }

    if (isAdmin && (pathname || '').startsWith('/app')) {
      router.replace('/admin');
    }
  }, [isLoading, isAuthenticated, isAdmin, requiredRole, pathname, router]);

  if (isLoading) {
    return (
      <main className="min-h-screen flex items-center justify-center">
        <section className="flex flex-col items-center gap-4" role="status">
          <span className="w-8 h-8 border-2 border-[#e5e5e5] border-t-[#c40000] rounded-full animate-spin" />
          <p className="text-sm text-[#6b6b6b]">Verificando sessão...</p>
        </section>
      </main>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  if (requiredRole === 'admin' && !isAdmin) {
    return null;
  }

  if (isAdmin && (pathname || '').startsWith('/app')) {
    return null;
  }

  return <>{children}</>;
}
