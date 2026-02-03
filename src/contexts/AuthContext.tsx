/**
 * Auth Context - Sistema de Autenticação Robusto
 * Provider + Hook para gerenciamento global de autenticação
 */

import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react';
import { storage, STORAGE_KEYS } from '@/config/storage';

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

export interface AuthSession {
  user: User;
  token: string;
  expiresAt: number;
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

const SESSION_DURATION = 24 * 60 * 60 * 1000; // 24 horas
const TOKEN_KEY = STORAGE_KEYS.authToken;
const SESSION_KEY = STORAGE_KEYS.authSession;

// Hash simples para simulação (NÃO usar em produção)
const simpleHash = (str: string): string => {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return Math.abs(hash).toString(36);
};

// ==================== MOCK USERS ====================

const MOCK_USERS: Array<User & { passwordHash: string }> = [
  {
    id: 'admin-001',
    name: 'Administrador PEM',
    email: 'admin@pem.com',
    passwordHash: simpleHash('admin123'),
    role: 'admin',
    region: 'BR',
    avatar: '/images/avatars/admin.webp',
    createdAt: '2024-01-01T00:00:00Z',
    lastLogin: new Date().toISOString(),
    isActive: true,
    preferences: {
      categories: ['economia', 'geopolitica', 'tecnologia'],
      tags: ['Fed', 'BCB', 'Inflação'],
      language: 'pt-BR',
      reducedMotion: false,
      emailNotifications: true,
      pushNotifications: false,
    },
  },
  {
    id: 'user-001',
    name: 'Usuário Demo',
    email: 'usuario@exemplo.com',
    passwordHash: simpleHash('senha123'),
    role: 'user',
    region: 'BR',
    avatar: '/images/avatars/user.webp',
    createdAt: '2024-01-15T00:00:00Z',
    lastLogin: new Date().toISOString(),
    isActive: true,
    preferences: {
      categories: ['economia', 'mercados'],
      tags: ['Bitcoin', 'Dólar'],
      language: 'pt-BR',
      reducedMotion: false,
      emailNotifications: true,
      pushNotifications: false,
    },
  },
];

// ==================== CONTEXT ====================

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// ==================== PROVIDER ====================

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<AuthError | null>(null);

  // Inicializar - verificar sessão existente
  useEffect(() => {
    const initAuth = () => {
      try {
        const session = storage.get<AuthSession>(SESSION_KEY);
        
        if (session && session.expiresAt > Date.now()) {
          setUser(session.user);
        } else {
          // Sessão expirada, limpar
          storage.remove(SESSION_KEY);
          storage.remove(TOKEN_KEY);
        }
      } catch (err) {
        console.error('Erro ao inicializar auth:', err);
      } finally {
        setIsLoading(false);
      }
    };

    initAuth();
  }, []);

  // Gerar token de sessão
  const generateToken = (userId: string): string => {
    return `${userId}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  };

  // Criar sessão
  const createSession = (userData: User): AuthSession => {
    const session: AuthSession = {
      user: userData,
      token: generateToken(userData.id),
      expiresAt: Date.now() + SESSION_DURATION,
    };
    
    storage.set(SESSION_KEY, session);
    storage.set(TOKEN_KEY, session.token);
    
    return session;
  };

  // Login
  const login = useCallback(async (credentials: LoginCredentials): Promise<boolean> => {
    setIsLoading(true);
    setError(null);

    try {
      // Simular delay de API
      await new Promise(resolve => setTimeout(resolve, 800));

      // Buscar usuário
      const foundUser = MOCK_USERS.find(u => u.email === credentials.email.toLowerCase().trim());

      if (!foundUser) {
        setError({
          code: 'AUTH_INVALID_CREDENTIALS',
          message: 'E-mail ou senha incorretos',
        });
        return false;
      }

      if (!foundUser.isActive) {
        setError({
          code: 'AUTH_ACCOUNT_DISABLED',
          message: 'Conta desativada. Entre em contato com o suporte.',
        });
        return false;
      }

      // Verificar senha
      const passwordHash = simpleHash(credentials.password);
      if (passwordHash !== foundUser.passwordHash) {
        setError({
          code: 'AUTH_INVALID_CREDENTIALS',
          message: 'E-mail ou senha incorretos',
        });
        return false;
      }

      // Criar sessão
      const { passwordHash: _, ...userWithoutPassword } = foundUser;
      const updatedUser = {
        ...userWithoutPassword,
        lastLogin: new Date().toISOString(),
      };

      createSession(updatedUser);
      setUser(updatedUser);

      // Salvar usuário atualizado
      const registeredUsers = storage.get<Array<{ id: string; email: string }>>(STORAGE_KEYS.registeredUsers) || [];
      const userIndex = registeredUsers.findIndex(u => u.id === updatedUser.id);
      if (userIndex >= 0) {
        registeredUsers[userIndex] = { id: updatedUser.id, email: updatedUser.email };
        storage.set(STORAGE_KEYS.registeredUsers, registeredUsers);
      }

      return true;
    } catch (err) {
      setError({
        code: 'AUTH_UNKNOWN_ERROR',
        message: 'Erro inesperado. Tente novamente.',
      });
      return false;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Registro
  const register = useCallback(async (data: RegisterData): Promise<boolean> => {
    setIsLoading(true);
    setError(null);

    try {
      // Simular delay de API
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Verificar email existente
      const registeredUsers = storage.get<Array<{ id: string; email: string }>>(STORAGE_KEYS.registeredUsers) || [];
      const existingUser = [...MOCK_USERS, ...registeredUsers].find(
        u => u.email === data.email.toLowerCase().trim()
      );

      if (existingUser) {
        setError({
          code: 'AUTH_EMAIL_EXISTS',
          message: 'Este e-mail já está cadastrado',
          field: 'email',
        });
        return false;
      }

      // Criar novo usuário
      const newUser: User = {
        id: `user_${Date.now()}`,
        name: data.name.trim(),
        email: data.email.toLowerCase().trim(),
        role: 'user',
        region: data.region || 'BR',
        createdAt: new Date().toISOString(),
        lastLogin: new Date().toISOString(),
        isActive: true,
        preferences: {
          categories: [],
          tags: [],
          language: 'pt-BR',
          reducedMotion: false,
          emailNotifications: true,
          pushNotifications: false,
        },
      };

      // Salvar hash da senha (em produção: hash real + salt)
      const userWithPassword = {
        ...newUser,
        passwordHash: simpleHash(data.password),
      };

      // Adicionar à lista de usuários registrados
      registeredUsers.push({ id: newUser.id, email: newUser.email });
      storage.set(STORAGE_KEYS.registeredUsers, registeredUsers);
      
      // Salvar dados do usuário
      const allUsers = storage.get<Array<typeof userWithPassword>>(STORAGE_KEYS.allUsers) || [];
      allUsers.push(userWithPassword);
      storage.set(STORAGE_KEYS.allUsers, allUsers);

      // Criar sessão
      createSession(newUser);
      setUser(newUser);

      return true;
    } catch (err) {
      setError({
        code: 'AUTH_UNKNOWN_ERROR',
        message: 'Erro ao criar conta. Tente novamente.',
      });
      return false;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Logout
  const logout = useCallback(() => {
    storage.remove(SESSION_KEY);
    storage.remove(TOKEN_KEY);
    setUser(null);
    setError(null);
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

    // Atualizar sessão
    const session = storage.get<AuthSession>(SESSION_KEY);
    if (session) {
      session.user = updatedUser;
      storage.set(SESSION_KEY, session);
    }
  }, [user]);

  // Atualizar preferências
  const updatePreferences = useCallback((prefs: Partial<UserPreferences>) => {
    if (!user) return;

    const updatedPreferences = { ...user.preferences, ...prefs };
    updateUser({ preferences: updatedPreferences });
  }, [user, updateUser]);

  // Verificar permissão
  const checkPermission = useCallback((requiredRole: UserRole): boolean => {
    if (!user) return false;
    if (requiredRole === 'admin') return user.role === 'admin';
    return true; // 'user' role permite acesso
  }, [user]);

  // Tempo restante da sessão
  const getSessionTimeRemaining = useCallback((): number => {
    const session = storage.get<AuthSession>(SESSION_KEY);
    if (!session) return 0;
    return Math.max(0, session.expiresAt - Date.now());
  }, []);

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

import { Navigate, useLocation } from 'react-router-dom';

interface ProtectedRouteProps {
  children: ReactNode;
  requiredRole?: UserRole;
}

export function ProtectedRoute({ children, requiredRole }: ProtectedRouteProps) {
  const { isAuthenticated, isAdmin, isLoading } = useAuth();
  const location = useLocation();

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
    return <Navigate to={`/login?redirect=${encodeURIComponent(location.pathname)}`} replace />;
  }

  // Se requer admin e usuário não é admin, redireciona para área do usuário
  if (requiredRole === 'admin' && !isAdmin) {
    return <Navigate to="/app" replace />;
  }

  // Se o usuário é admin e está tentando acessar área de usuário comum, redireciona para admin
  if (isAdmin && location.pathname.startsWith('/app')) {
    return <Navigate to="/admin" replace />;
  }

  return <>{children}</>;
}
