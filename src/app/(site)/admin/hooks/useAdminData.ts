/**
 * Hook para gerenciamento de dados do Admin
 */

import { useState, useEffect, useCallback } from 'react';
import { toast } from 'sonner';
import type { DashboardStats, SystemUser, AuthorFormState } from '../types';
import type { ScheduledArticle, ArticleFilters } from '@/services/newsManager';
import type { NewsArticle } from '@/types';
import type { Author } from '@/config/authors';
import type { AppSettings } from '@/hooks/useAppSettings';
import {
  getArticlesPaginated,
  getArticleStats,
  getScheduledArticles,
  checkAndPublishScheduled,
} from '@/services/newsManager';
import { getAppSettings } from '@/services/appSettings';
import { listAdminUsers } from '@/services/adminUsers';
import { listAdminAuthors } from '@/services/adminAuthors';

// Estado inicial dos stats
const initialStats: DashboardStats = {
  total: 0,
  published: 0,
  breaking: 0,
  featured: 0,
  scheduled: 0,
  totalViews: 0,
  totalLikes: 0,
  byCategory: { economia: 0, geopolitica: 0, tecnologia: 0 },
};

// Estado inicial das configurações
const initialSettings: AppSettings = {
  readingLimitEnabled: true,
  readingLimitPercentage: 0.2,
  maxFreeArticles: 3,
  readingLimitScope: 'anon',
};

export function useAdminData() {
  // Artigos
  const [articles, setArticles] = useState<NewsArticle[]>([]);
  const [scheduledArticles, setScheduledArticles] = useState<ScheduledArticle[]>([]);
  const [stats, setStats] = useState<DashboardStats>(initialStats);
  const [isLoading, setIsLoading] = useState(true);

  // Filtros de artigos
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<ArticleFilters['status']>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [perPage, setPerPage] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  const [selectedArticles, setSelectedArticles] = useState<string[]>([]);

  // Configurações
  const [appSettings, setAppSettings] = useState<AppSettings>(initialSettings);
  const [isSettingsLoading, setIsSettingsLoading] = useState(true);
  const [isSettingsSaving, setIsSettingsSaving] = useState(false);

  // Usuários
  const [users, setUsers] = useState<SystemUser[]>([]);

  // Autores
  const [authors, setAuthors] = useState<Author[]>([]);

  // Carregar dados de artigos
  const loadArticles = useCallback(async () => {
    setIsLoading(true);

    const filters: ArticleFilters = {
      search: searchTerm,
      category: categoryFilter,
      status: statusFilter,
    };

    const result = await getArticlesPaginated(filters, currentPage, perPage, { includeDrafts: true });
    setArticles(result.items);
    setTotalPages(result.totalPages);

    const articleStats = await getArticleStats();
    setStats({
      total: articleStats.total,
      published: articleStats.published,
      breaking: articleStats.breaking,
      featured: articleStats.featured,
      scheduled: articleStats.scheduled,
      totalViews: articleStats.totalViews,
      totalLikes: articleStats.totalLikes,
      byCategory: articleStats.byCategory,
    });

    const scheduled = await getScheduledArticles();
    setScheduledArticles(scheduled.filter((s) => s.status === 'pending'));

    setIsLoading(false);
  }, [searchTerm, categoryFilter, statusFilter, currentPage, perPage]);

  // Carregar usuários
  const loadUsers = useCallback(async () => {
    try {
      const data = await listAdminUsers();
      setUsers(data);
    } catch {
      toast.error('Erro ao carregar usuários');
    }
  }, []);

  // Carregar autores
  const loadAuthors = useCallback(async () => {
    try {
      const data = await listAdminAuthors();
      setAuthors(data);
    } catch {
      toast.error('Erro ao carregar autores');
    }
  }, []);

  // Carregar configurações
  const loadSettings = useCallback(async () => {
    setIsSettingsLoading(true);
    try {
      const data = await getAppSettings();
      setAppSettings(data);
    } catch {
      // Silenciar erro
    } finally {
      setIsSettingsLoading(false);
    }
  }, []);

  // Carregar todos os dados
  const loadData = useCallback(async () => {
    await Promise.all([loadArticles(), loadUsers(), loadAuthors()]);
  }, [loadArticles, loadUsers, loadAuthors]);

  // Verificar publicações agendadas
  const checkScheduled = useCallback(async () => {
    const published = await checkAndPublishScheduled();
    if (published > 0) {
      toast.success(`${published} artigo(s) agendado(s) publicado(s)!`);
      await loadData();
    }
    return published;
  }, [loadData]);

  // Toggle seleção de artigo
  const toggleArticleSelection = useCallback((slug: string) => {
    setSelectedArticles((prev) =>
      prev.includes(slug) ? prev.filter((s) => s !== slug) : [...prev, slug]
    );
  }, []);

  // Selecionar todos os artigos
  const selectAllArticles = useCallback(() => {
    if (selectedArticles.length === articles.length) {
      setSelectedArticles([]);
    } else {
      setSelectedArticles(articles.map((a) => a.slug));
    }
  }, [selectedArticles.length, articles]);

  // Resetar página quando filtros mudam
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, categoryFilter, statusFilter]);

  // Inicialização
  useEffect(() => {
    loadData();
    loadSettings();
  }, []);

  // Polling de verificação de agendamentos
  useEffect(() => {
    const interval = setInterval(() => {
      void checkScheduled();
    }, 60000);
    return () => clearInterval(interval);
  }, [checkScheduled]);

  return {
    // Artigos
    articles,
    scheduledArticles,
    stats,
    isLoading,

    // Filtros
    searchTerm,
    setSearchTerm,
    categoryFilter,
    setCategoryFilter,
    statusFilter,
    setStatusFilter,
    currentPage,
    setCurrentPage,
    perPage,
    setPerPage,
    totalPages,
    selectedArticles,
    toggleArticleSelection,
    selectAllArticles,

    // Configurações
    appSettings,
    setAppSettings,
    isSettingsLoading,
    isSettingsSaving,
    setIsSettingsSaving,

    // Usuários
    users,
    loadUsers,

    // Autores
    authors,
    loadAuthors,

    // Ações
    loadData,
    loadArticles,
    loadSettings,
    checkScheduled,
  };
}

// Estado inicial do formulário de autor
export function getInitialAuthorFormState(): AuthorFormState {
  return {
    slug: '',
    name: '',
    shortName: '',
    title: '',
    bio: '',
    longBio: '',
    photo: '',
    email: '',
    social: {},
    expertise: '',
    awards: '',
    languages: '',
    joinedAt: new Date().toISOString().split('T')[0],
    isActive: true,
    factChecker: false,
    editor: false,
    education: [],
  };
}
