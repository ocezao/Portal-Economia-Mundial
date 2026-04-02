'use client';

import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react';
import { storage, secureStorage, STORAGE_KEYS } from '@/config/storage';
import { usePathname, useRouter } from 'next/navigation';
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
  logout: () => void;
  clearError: () => void;
  updateUser: (updates: Partial<User>) => void;
  updatePreferences: (prefs: Partial<UserPreferences>) => void;
  checkPermission: (requiredRole: UserRole) => boolean;
  getSessionTimeRemaining: () => number;
}

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

function normalizeUser(user: User): User {
  return {
    ...user,
    preferences: loadUserPreferences(user.id),
  };
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

async function fetchAuth<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(path, {
    credentials: 'same-origin',
    headers: {
      'Content-Type': 'application/json',
      ...(init?.headers ?? {}),
    },
    ...init,
  });

  const json = await response.json() as Record<string, unknown>;
  if (!response.ok) {
    throw new Error((json.error as string) || 'Erro de autenticacao');
  }

  return json as T;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<AuthError | null>(null);

  useEffect(() => {
    let isMounted = true;

    const initAuth = async () => {
      setIsLoading(true);
      try {
        const result = await fetchAuth<{ user: User | null }>('/api/auth/session', { method: 'GET' });
        if (!isMounted) return;
        setUser(result.user ? normalizeUser(result.user) : null);
      } catch {
        if (!isMounted) return;
        setUser(null);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };

    void initAuth();
    return () => {
      isMounted = false;
    };
  }, []);

  const login = useCallback(async (credentials: LoginCredentials) => {
    setIsLoading(true);
    setError(null);

    try {
      const result = await fetchAuth<{ ok: true; user: User }>('/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({
          email: credentials.email.toLowerCase().trim(),
          password: credentials.password,
        }),
      });
      setUser(normalizeUser(result.user));
      return { ok: true as const };
    } catch (err) {
      const authErr: AuthError = {
        code: 'AUTH_INVALID_CREDENTIALS',
        message: err instanceof Error ? err.message : 'Erro ao autenticar. Tente novamente.',
      };
      setError(authErr);
      return { ok: false as const, error: authErr };
    } finally {
      setIsLoading(false);
    }
  }, []);

  const register = useCallback(async (data: RegisterData) => {
    setIsLoading(true);
    setError(null);

    try {
      const result = await fetchAuth<{ ok: true; user: User; needsEmailConfirmation: boolean }>('/api/auth/register', {
        method: 'POST',
        body: JSON.stringify(data),
      });
      setUser(normalizeUser(result.user));
      return { ok: true as const, needsEmailConfirmation: result.needsEmailConfirmation };
    } catch (err) {
      const authErr: AuthError = {
        code: 'AUTH_REGISTER_ERROR',
        message: err instanceof Error ? err.message : 'Erro ao cadastrar. Tente novamente.',
      };
      setError(authErr);
      return { ok: false as const, error: authErr };
    } finally {
      setIsLoading(false);
    }
  }, []);

  const logout = useCallback(() => {
    setIsLoading(true);
    secureStorage.clear();
    fetch('/api/auth/logout', {
      method: 'POST',
      credentials: 'same-origin',
    }).finally(() => {
      setUser(null);
      setIsLoading(false);
    });
  }, []);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const updateUser = useCallback((updates: Partial<User>) => {
    setUser((current) => (current ? { ...current, ...updates } : current));
  }, []);

  const updatePreferences = useCallback((prefs: Partial<UserPreferences>) => {
    setUser((current) => {
      if (!current) return current;
      const updatedPreferences = { ...current.preferences, ...prefs };
      saveUserPreferences(current.id, updatedPreferences);
      return { ...current, preferences: updatedPreferences };
    });
  }, []);

  const checkPermission = useCallback((requiredRole: UserRole): boolean => {
    if (!user) return false;
    if (requiredRole === 'admin') return user.role === 'admin';
    return true;
  }, [user]);

  const getSessionTimeRemaining = useCallback((): number => 0, []);

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

  if (!isAuthenticated) return null;
  if (requiredRole === 'admin' && !isAdmin) return null;
  if (isAdmin && (pathname || '').startsWith('/app')) return null;

  return <>{children}</>;
}
