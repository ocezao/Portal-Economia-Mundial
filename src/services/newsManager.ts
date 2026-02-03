/**
 * Serviço de Gerenciamento de Notícias
 * Persistência em localStorage com operações CRUD completas e agendamento
 */

import type { NewsArticle } from '@/types';
import { mockArticles as initialArticles } from './newsService';
import { storage } from '@/config/storage';

const STORAGE_KEY = 'pem_admin_articles';
const SCHEDULED_KEY = 'pem_scheduled_articles';

// ==================== TIPOS ====================

export interface ScheduledArticle {
  id: string;
  articleData: Omit<NewsArticle, 'id' | 'publishedAt' | 'updatedAt' | 'views' | 'likes' | 'shares' | 'comments'>;
  scheduledDate: string;
  scheduledTime: string;
  timezone: string;
  status: 'pending' | 'published' | 'cancelled';
  createdAt: string;
}

// ==================== INICIALIZAÇÃO ====================

export function initializeArticles(): void {
  const stored = storage.get<NewsArticle[]>(STORAGE_KEY);
  if (!stored) {
    storage.set(STORAGE_KEY, initialArticles);
  }
}

// ==================== CRUD OPERATIONS ====================

export function getAllArticles(): NewsArticle[] {
  initializeArticles();
  const articles = storage.get<NewsArticle[]>(STORAGE_KEY) || [];
  return [...articles].sort((a, b) => 
    new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime()
  );
}

export function getArticleBySlug(slug: string): NewsArticle | undefined {
  const articles = getAllArticles();
  return articles.find(article => article.slug === slug);
}

export function createArticle(
  articleData: Omit<NewsArticle, 'id' | 'publishedAt' | 'updatedAt' | 'views' | 'likes' | 'shares' | 'comments'>,
  customPublishedAt?: string
): NewsArticle {
  const articles = getAllArticles();
  
  const newArticle: NewsArticle = {
    ...articleData,
    id: `article_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    publishedAt: customPublishedAt || new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    views: 0,
    likes: 0,
    shares: 0,
    comments: 0,
  };
  
  const updatedArticles = [newArticle, ...articles];
  storage.set(STORAGE_KEY, updatedArticles);
  
  return newArticle;
}

export function updateArticle(slug: string, updates: Partial<NewsArticle>): NewsArticle | null {
  const articles = getAllArticles();
  const index = articles.findIndex(a => a.slug === slug);
  
  if (index === -1) return null;
  
  const updatedArticle = {
    ...articles[index],
    ...updates,
    updatedAt: new Date().toISOString(),
  };
  
  articles[index] = updatedArticle;
  storage.set(STORAGE_KEY, articles);
  
  return updatedArticle;
}

export function deleteArticle(slug: string): boolean {
  const articles = getAllArticles();
  const filtered = articles.filter(a => a.slug !== slug);
  
  if (filtered.length === articles.length) return false;
  
  storage.set(STORAGE_KEY, filtered);
  return true;
}

export function duplicateArticle(slug: string): NewsArticle | null {
  const article = getArticleBySlug(slug);
  if (!article) return null;
  
  const newSlug = `${article.slug}-copia-${Date.now()}`;
  const newTitle = `${article.title} (Cópia)`;
  
  return createArticle({
    ...article,
    slug: newSlug,
    title: newTitle,
    featured: false,
    breaking: false,
  });
}

// ==================== SISTEMA DE AGENDAMENTO ====================

export function scheduleArticle(
  articleData: Omit<NewsArticle, 'id' | 'publishedAt' | 'updatedAt' | 'views' | 'likes' | 'shares' | 'comments'>,
  scheduledDate: string,
  scheduledTime: string,
  timezone: string = 'America/Sao_Paulo'
): ScheduledArticle {
  const scheduled: ScheduledArticle = {
    id: `scheduled_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    articleData,
    scheduledDate,
    scheduledTime,
    timezone,
    status: 'pending',
    createdAt: new Date().toISOString(),
  };
  
  const scheduledList = getScheduledArticles();
  scheduledList.push(scheduled);
  storage.set(SCHEDULED_KEY, scheduledList);
  
  return scheduled;
}

export function getScheduledArticles(): ScheduledArticle[] {
  return storage.get<ScheduledArticle[]>(SCHEDULED_KEY) || [];
}

export function getPendingScheduledArticles(): ScheduledArticle[] {
  const all = getScheduledArticles();
  return all.filter(s => s.status === 'pending');
}

export function cancelScheduledArticle(id: string): boolean {
  const scheduled = getScheduledArticles();
  const index = scheduled.findIndex(s => s.id === id);
  
  if (index === -1) return false;
  
  scheduled[index].status = 'cancelled';
  storage.set(SCHEDULED_KEY, scheduled);
  return true;
}

export function deleteScheduledArticle(id: string): boolean {
  const scheduled = getScheduledArticles();
  const filtered = scheduled.filter(s => s.id !== id);
  
  if (filtered.length === scheduled.length) return false;
  
  storage.set(SCHEDULED_KEY, filtered);
  return true;
}

export function updateScheduledArticle(
  id: string, 
  updates: Partial<ScheduledArticle>
): ScheduledArticle | null {
  const scheduled = getScheduledArticles();
  const index = scheduled.findIndex(s => s.id === id);
  
  if (index === -1) return null;
  
  scheduled[index] = { ...scheduled[index], ...updates };
  storage.set(SCHEDULED_KEY, scheduled);
  
  return scheduled[index];
}

// Verifica e publica artigos agendados
export function checkAndPublishScheduled(): number {
  const now = new Date();
  const scheduled = getScheduledArticles();
  let publishedCount = 0;
  
  scheduled.forEach(item => {
    if (item.status !== 'pending') return;
    
    const scheduledDateTime = new Date(`${item.scheduledDate}T${item.scheduledTime}`);
    
    if (scheduledDateTime <= now) {
      // Publicar o artigo com data agendada
      createArticle(item.articleData, scheduledDateTime.toISOString());
      
      // Marcar como publicado
      item.status = 'published';
      publishedCount++;
    }
  });
  
  if (publishedCount > 0) {
    storage.set(SCHEDULED_KEY, scheduled);
  }
  
  return publishedCount;
}

// ==================== ESTATÍSTICAS ====================

export function getArticleStats() {
  const articles = getAllArticles();
  const scheduled = getScheduledArticles();
  const pendingScheduled = scheduled.filter(s => s.status === 'pending');
  
  return {
    total: articles.length,
    published: articles.length,
    breaking: articles.filter(a => a.breaking).length,
    featured: articles.filter(a => a.featured).length,
    scheduled: pendingScheduled.length,
    totalViews: articles.reduce((sum, a) => sum + a.views, 0),
    totalLikes: articles.reduce((sum, a) => sum + a.likes, 0),
    byCategory: {
      economia: articles.filter(a => a.category === 'economia').length,
      geopolitica: articles.filter(a => a.category === 'geopolitica').length,
      tecnologia: articles.filter(a => a.category === 'tecnologia').length,
    },
  };
}

// ==================== FILTROS AVANÇADOS ====================

export interface ArticleFilters {
  search?: string;
  category?: string;
  status?: 'all' | 'published' | 'breaking' | 'featured' | 'scheduled';
  author?: string;
  dateFrom?: string;
  dateTo?: string;
  sortBy?: 'date' | 'views' | 'likes';
  sortOrder?: 'asc' | 'desc';
}

export function filterArticles(filters: ArticleFilters): NewsArticle[] {
  let articles = getAllArticles();
  
  if (filters.search) {
    const query = filters.search.toLowerCase();
    articles = articles.filter(a => 
      a.title.toLowerCase().includes(query) ||
      a.excerpt.toLowerCase().includes(query) ||
      a.slug.toLowerCase().includes(query) ||
      a.tags.some(t => t.toLowerCase().includes(query))
    );
  }
  
  if (filters.category && filters.category !== 'all') {
    articles = articles.filter(a => a.category === filters.category);
  }
  
  if (filters.status && filters.status !== 'all') {
    switch (filters.status) {
      case 'breaking':
        articles = articles.filter(a => a.breaking);
        break;
      case 'featured':
        articles = articles.filter(a => a.featured);
        break;
      case 'published':
        articles = articles.filter(a => !a.breaking);
        break;
    }
  }
  
  if (filters.author) {
    articles = articles.filter(a => a.author === filters.author);
  }
  
  if (filters.dateFrom) {
    articles = articles.filter(a => new Date(a.publishedAt) >= new Date(filters.dateFrom!));
  }
  
  if (filters.dateTo) {
    articles = articles.filter(a => new Date(a.publishedAt) <= new Date(filters.dateTo!));
  }
  
  // Sort
  const sortBy = filters.sortBy || 'date';
  const sortOrder = filters.sortOrder || 'desc';
  
  articles.sort((a, b) => {
    let comparison = 0;
    switch (sortBy) {
      case 'date':
        comparison = new Date(a.publishedAt).getTime() - new Date(b.publishedAt).getTime();
        break;
      case 'views':
        comparison = a.views - b.views;
        break;
      case 'likes':
        comparison = a.likes - b.likes;
        break;
    }
    return sortOrder === 'asc' ? comparison : -comparison;
  });
  
  return articles;
}

// ==================== PAGINAÇÃO ====================

export interface PaginatedResult<T> {
  items: T[];
  total: number;
  page: number;
  perPage: number;
  totalPages: number;
}

export function getArticlesPaginated(
  filters: ArticleFilters,
  page: number = 1,
  perPage: number = 10
): PaginatedResult<NewsArticle> {
  const allArticles = filterArticles(filters);
  const total = allArticles.length;
  const totalPages = Math.ceil(total / perPage);
  const start = (page - 1) * perPage;
  const items = allArticles.slice(start, start + perPage);
  
  return {
    items,
    total,
    page,
    perPage,
    totalPages,
  };
}

// ==================== SELETORES SIMPLES ====================

export function getArticlesByCategory(category: string): NewsArticle[] {
  return getAllArticles()
    .filter(article => article.category === category)
    .sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime());
}

export function getFeaturedArticles(limit = 3): NewsArticle[] {
  return getAllArticles()
    .filter(article => article.featured)
    .slice(0, limit);
}

export function getBreakingNews(): NewsArticle[] {
  return getAllArticles().filter(article => article.breaking);
}

export function getLatestArticles(limit = 10): NewsArticle[] {
  return getAllArticles().slice(0, limit);
}

export function getRelatedArticles(currentSlug: string, category: string, limit = 4): NewsArticle[] {
  return getAllArticles()
    .filter(article => article.slug !== currentSlug && article.category === category)
    .slice(0, limit);
}

export function getTrendingArticles(limit = 5): NewsArticle[] {
  return [...getAllArticles()]
    .sort((a, b) => b.views - a.views)
    .slice(0, limit);
}

export function searchArticles(query: string): NewsArticle[] {
  const lowerQuery = query.toLowerCase();
  return getAllArticles().filter(article =>
    article.title.toLowerCase().includes(lowerQuery) ||
    article.excerpt.toLowerCase().includes(lowerQuery) ||
    article.tags.some(tag => tag.toLowerCase().includes(lowerQuery))
  );
}

// ==================== SLUG GENERATOR ====================

export function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-')
    .slice(0, 60);
}

export function isSlugAvailable(slug: string, excludeSlug?: string): boolean {
  const articles = getAllArticles();
  return !articles.some(a => a.slug === slug && a.slug !== excludeSlug);
}

// ==================== RESET ====================

export function resetToDefault(): void {
  storage.set(STORAGE_KEY, initialArticles);
  storage.set(SCHEDULED_KEY, []);
}
