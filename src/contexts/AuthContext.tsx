'use client';

import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react';
import { usePathname, useRouter } from 'next/navigation';

import { storage, secureStorage, STORAGE_KEYS } from '@/lib/storage';
import { logger } from '@/lib/logger';
import type { User, UserRole, UserPreferences, LoginCredentials, RegisterData, AuthError } from '@/types/user';

export type { UserRole, UserPreferences, LoginCredentials, RegisterData, AuthError };

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  isAdmin: boolean;
  error: AuthError | null;
  login: (credentials: LoginCredentials) => Promise<{ ok: true } | { ok: false; error: AuthError }>;
  register: (data: RegisterData) => Promise<{ ok: true; needsEmailConfirmation: boolean } | { ok: false; error: AuthError }>;
  logout: () => Promise<void>;
  clearError: () => void;
  updateUser: (updates: Partial<User>) => Promise<void>;
  updatePreferences: (prefs: Partial<UserPreferences>) => void;
  checkPermission: (requiredRole: UserRole) => boolean;
  getSessionTimeRemaining: () => number;
}

type SessionResponse = {
  authenticated: boolean;
  user: User | null;
  expiresAt: string | null;
  error?: string;
};

type AuthMutationResponse = {
  ok: boolean;
  user?: User;
  expiresAt?: string | null;
  needsEmailConfirmation?: boolean;
  error?: string;
};

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

function mergeUserPreferences(user: User | null): User | null {
  if (!user) return null;
  return {
    ...user,
    preferences: {
      ...DEFAULT_PREFERENCES,
      ...(user.preferences ?? {}),
      ...loadUserPreferences(user.id),
    },
  };
}

async function readJson<T>(response: Response): Promise<T | null> {
  try {
    return (await response.json()) as T;
  } catch {
    return null;
  }
}

function mapApiAuthError(message?: string, fallback = 'Erro ao autenticar. Tente novamente.'): AuthError {
  const normalized = (message ?? '').toLowerCase();

  if (normalized.includes('incorret')) {
    return { code: 'AUTH_INVALID_CREDENTIALS', message: 'E-mail ou senha incorretos.' };
  }

  if (normalized.includes('ja cadastrado')) {
    return { code: 'AUTH_EMAIL_ALREADY_EXISTS', message: 'Este e-mail ja esta cadastrado.' };
  }

  if (normalized.includes('nao autenticado') || normalized.includes('sessao')) {
    return { code: 'AUTH_NO_SESSION', message: 'Sua sessao expirou. Entre novamente.' };
  }

  if (normalized.includes('desativada')) {
    return { code: 'AUTH_ACCOUNT_DISABLED', message: 'Sua conta esta desativada.' };
  }

  return {
    code: 'AUTH_UNKNOWN_ERROR',
    message: message || fallback,
  };
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<AuthError | null>(null);
  const [sessionExpiresAt, setSessionExpiresAt] = useState<number | null>(null);

  const refreshSession = useCallback(async () => {
    setIsLoading(true);

    try {
      const response = await fetch('/api/auth/session', {
        method: 'GET',
        cache: 'no-store',
        credentials: 'same-origin',
      });

      const payload = await readJson<SessionResponse>(response);
      if (!response.ok) {
        const authErr = mapApiAuthError(payload?.error, 'Erro ao carregar sessao. Tente novamente.');
        setError(authErr);
        setUser(null);
        setSessionExpiresAt(null);
        return;
      }

      const nextUser = mergeUserPreferences(payload?.authenticated ? payload.user ?? null : null);
      setUser(nextUser);
      setSessionExpiresAt(payload?.expiresAt ? new Date(payload.expiresAt).getTime() : null);
    } catch (err) {
      logger.error('Erro ao carregar sessao local:', err);
      setUser(null);
      setSessionExpiresAt(null);
      setError({
        code: 'AUTH_SESSION_ERROR',
        message: 'Erro ao carregar sessao. Tente novamente.',
      });
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void refreshSession();
  }, [refreshSession]);

  const login = useCallback(async (credentials: LoginCredentials): Promise<{ ok: true } | { ok: false; error: AuthError }> => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        credentials: 'same-origin',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: credentials.email.toLowerCase().trim(),
          password: credentials.password,
        }),
      });

      const payload = await readJson<AuthMutationResponse>(response);
      if (!response.ok || !payload?.user) {
        const authErr = mapApiAuthError(payload?.error);
        setError(authErr);
        return { ok: false, error: authErr };
      }

      setUser(mergeUserPreferences(payload.user));
      setSessionExpiresAt(payload.expiresAt ? new Date(payload.expiresAt).getTime() : null);
      return { ok: true };
    } catch (err) {
      logger.error('Erro no login local:', err);
      const authErr = mapApiAuthError(undefined);
      setError(authErr);
      return { ok: false, error: authErr };
    } finally {
      setIsLoading(false);
    }
  }, []);

  const register = useCallback(async (data: RegisterData): Promise<{ ok: true; needsEmailConfirmation: boolean } | { ok: false; error: AuthError }> => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        credentials: 'same-origin',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: data.name.trim(),
          email: data.email.toLowerCase().trim(),
          password: data.password,
          region: data.region,
        }),
      });

      const payload = await readJson<AuthMutationResponse>(response);
      if (!response.ok || !payload?.user) {
        const authErr = mapApiAuthError(payload?.error, 'Erro ao cadastrar. Tente novamente.');
        setError(authErr);
        return { ok: false, error: authErr };
      }

      setUser(mergeUserPreferences(payload.user));
      setSessionExpiresAt(payload.expiresAt ? new Date(payload.expiresAt).getTime() : null);
      return { ok: true, needsEmailConfirmation: false };
    } catch (err) {
      logger.error('Erro no cadastro local:', err);
      const authErr = mapApiAuthError(undefined, 'Erro ao cadastrar. Tente novamente.');
      setError(authErr);
      return { ok: false, error: authErr };
    } finally {
      setIsLoading(false);
    }
  }, []);

  const logout = useCallback(async () => {
    setIsLoading(true);
    secureStorage.clear();

    try {
      await fetch('/api/auth/logout', {
        method: 'POST',
        credentials: 'same-origin',
      });
    } catch (err) {
      logger.error('Erro ao encerrar sessao local:', err);
    } finally {
      setUser(null);
      setSessionExpiresAt(null);
      setIsLoading(false);
    }
  }, []);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const updateUser = useCallback(async (updates: Partial<User>) => {
    if (!user) return;

    const previousUser = user;
    setUser(mergeUserPreferences({ ...user, ...updates }));

    try {
      const response = await fetch('/api/auth/profile', {
        method: 'PATCH',
        credentials: 'same-origin',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: updates.name,
          region: updates.region,
          avatar: updates.avatar,
          bio: updates.bio,
          profession: updates.profession,
          company: updates.company,
          socialLinks: updates.socialLinks,
          twoFactorEnabled: updates.twoFactorEnabled,
        }),
      });

      const payload = await readJson<AuthMutationResponse>(response);
      if (!response.ok || !payload?.user) {
        throw new Error(payload?.error || 'Erro ao atualizar perfil');
      }

      setUser(mergeUserPreferences(payload.user));
      setSessionExpiresAt(payload.expiresAt ? new Date(payload.expiresAt).getTime() : null);
    } catch (err) {
      logger.error('Erro ao atualizar perfil local:', err);
      setUser(previousUser);
      const authErr = {
        code: 'AUTH_PROFILE_UPDATE_ERROR',
        message: err instanceof Error ? err.message : 'Erro ao atualizar perfil.',
      };
      setError(authErr);
      throw err;
    }
  }, [user]);

  const updatePreferences = useCallback((prefs: Partial<UserPreferences>) => {
    if (!user) return;

    const updatedPreferences = {
      ...user.preferences,
      ...prefs,
    };
    saveUserPreferences(user.id, updatedPreferences);
    setUser((current) => (current ? { ...current, preferences: updatedPreferences } : current));
  }, [user]);

  const checkPermission = useCallback((requiredRole: UserRole): boolean => {
    if (!user) return false;
    if (requiredRole === 'admin') return user.role === 'admin';
    return true;
  }, [user]);

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

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth deve ser usado dentro de um AuthProvider');
  }
  return context;
}

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
          <p className="text-sm text-[#6b6b6b]">Verificando sessao...</p>
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
