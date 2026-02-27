/**
 * Serviço de Notícias - Supabase + PostgreSQL Local
 * CRUD + consultas via banco de dados
 * 
 * NOTA: Migração em progresso - usando PostgreSQL local para leitura,
 * Supabase mantido para Auth e Storage
 */

import { supabase, isSupabaseConfigured } from '@/lib/supabaseClient';
import { query } from '@/lib/db';
import { toWebpUrl } from '@/lib/image';
import { logger } from '@/lib/logger';
import { escapeLikePattern } from '@/lib/security';
import type { NewsArticle } from '@/types';

// Flag para usar PostgreSQL local (se DATABASE_URL estiver configurada)
const useLocalDb = !!process.env.DATABASE_URL;

// ==================== TIPOS ====================

export interface ScheduledArticle {
  id: string;
  articleData: Omit<NewsArticle, 'id' | 'publishedAt' | 'updatedAt'>;
  scheduledDate: string;
  scheduledTime: string;
  timezone: string;
  status: 'pending' | 'published' | 'cancelled';
  createdAt: string;
}

export interface ArticleFilters {
  search?: string;
  category?: string;
  status?: 'all' | 'published' | 'breaking' | 'featured' | 'scheduled' | 'draft';
  author?: string;
  dateFrom?: string;
  dateTo?: string;
  sortBy?: 'date' | 'views' | 'likes';
  sortOrder?: 'asc' | 'desc';
}

export interface PaginatedResult<T> {
  items: T[];
  total: number;
  page: number;
  perPage: number;
  totalPages: number;
}

// ==================== TIPOS DO SUPABASE ====================

interface CategoryRow {
  categories?: { slug?: string } | null;
}

interface TagRow {
  tags?: { name?: string } | null;
}

interface ArticleRow {
  id: string;
  slug: string;
  title: string;
  title_en?: string | null;
  excerpt?: string | null;
  excerpt_en?: string | null;
  content?: string | null;
  content_en?: string | null;
  cover_image?: string | null;
  author_id?: string | null;
  author_name?: string | null;
  status?: string | null;
  published_at?: string | null;
  created_at?: string | null;
  updated_at?: string | null;
  reading_time?: number | null;
  is_featured?: boolean | null;
  is_breaking?: boolean | null;
  views?: number | null;
  likes?: number | null;
  shares?: number | null;
  comments_count?: number | null;
  news_article_categories?: CategoryRow[] | null;
  news_article_tags?: TagRow[] | null;
}

interface SearchResultRow {
  id?: string;
}

interface AuthorProfileRow {
  slug: string;
  name: string;
  is_active?: boolean | null;
}

// Type guard para verificar se um valor é um objeto
function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

// Type guard para verificar se um valor é um array
function isArray(value: unknown): value is unknown[] {
  return Array.isArray(value);
}

// Type guard para ArticleRow
function isArticleRow(value: unknown): value is ArticleRow {
  if (!isRecord(value)) return false;
  return typeof value.id === 'string' && typeof value.slug === 'string' && typeof value.title === 'string';
}

// Type guard para SearchResultRow
function isSearchResultRow(value: unknown): value is SearchResultRow {
  return isRecord(value) && (value.id === undefined || typeof value.id === 'string');
}

// ==================== HELPERS PARA POSTGRESQL LOCAL ====================

function mapDbRowToArticle(row: any): NewsArticle {
  return {
    id: row.id,
    slug: row.slug,
    title: row.title,
    titleEn: row.title_en || undefined,
    excerpt: row.excerpt || '',
    excerptEn: row.excerpt_en || undefined,
    content: row.content || '',
    contentEn: row.content_en || undefined,
    coverImage: row.cover_image ? toWebpUrl(row.cover_image) : '/images/news/default.webp',
    authorId: row.author_id || 'unknown',
    author: row.author_name || 'Desconhecido',
    category: (row.category as 'geopolitica' | 'economia' | 'tecnologia') || 'economia',
    tags: row.tags || [],
    publishedAt: row.published_at || row.created_at,
    updatedAt: row.updated_at,
    readingTime: row.reading_time || 4,
    featured: row.is_featured || false,
    breaking: row.is_breaking || false,
    views: row.views || 0,
    likes: row.likes || 0,
    shares: row.shares || 0,
    comments: row.comments_count || 0,
  };
}

// ==================== HELPERS ====================

const WARN_INTERVAL_MS = 60_000;
// OTIMIZAÇÃO: Cache de 60 segundos para reduzir chamadas ao banco
const QUERY_CACHE_TTL_MS = 60_000;

const queryCache = new Map<string, { expiresAt: number; promise: Promise<unknown> }>();

function withQueryCache<T>(key: string, ttlMs: number, fn: () => Promise<T>): Promise<T> {
  const now = Date.now();
  const cached = queryCache.get(key);
  if (cached && cached.expiresAt > now) {
    return cached.promise as Promise<T>;
  }
  const promise = fn();
  queryCache.set(key, { expiresAt: now + ttlMs, promise });
  return promise;
}

function summarizeError(err: unknown): unknown {
  if (err instanceof Error) return err.message;
  if (!isRecord(err)) return err;
  const message = typeof err.message === 'string' ? err.message : undefined;
  const code = typeof err.code === 'string' ? err.code : undefined;
  const status = typeof err.status === 'number' ? err.status : undefined;
  if (!message) return err;

  const short = message.length > 300 ? `${message.slice(0, 300)}...` : message;
  return { status, code, message: short };
}

const ARTICLE_SELECT = `
  id,
  slug,
  title,
  title_en,
  excerpt,
  excerpt_en,
  content,
  content_en,
  cover_image,
  author_id,
  author_name,
  status,
  published_at,
  created_at,
  updated_at,
  reading_time,
  is_featured,
  is_breaking,
  views,
  likes,
  shares,
  comments_count,
  news_article_categories (
    categories ( slug, name )
  ),
  news_article_tags (
    tags ( name, slug )
  )
`;

const slugify = (value: string): string => {
  return value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^\w\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .slice(0, 60);
};

const extractCategorySlug = (row: ArticleRow): string => {
  const categories = row.news_article_categories;
  if (!isArray(categories) || categories.length === 0) return 'economia';
  
  const firstCategory = categories[0];
  if (!isRecord(firstCategory)) return 'economia';
  
  const categoryData = firstCategory.categories;
  if (!isRecord(categoryData)) return 'economia';
  
  return typeof categoryData.slug === 'string' ? categoryData.slug : 'economia';
};

const extractTags = (row: ArticleRow): string[] => {
  const tags = row.news_article_tags;
  if (!isArray(tags)) return [];
  
  return tags
    .map((t: unknown) => {
      if (!isRecord(t)) return null;
      const tagData = t.tags;
      if (!isRecord(tagData)) return null;
      return typeof tagData.name === 'string' ? tagData.name : null;
    })
    .filter((name): name is string => name !== null);
};

const mapArticleRow = (row: unknown): NewsArticle => {
  if (!isArticleRow(row)) {
    throw new Error('Invalid article row structure');
  }

  const categorySlug = extractCategorySlug(row);
  const tags = extractTags(row);

  return {
    id: row.id,
    slug: row.slug,
    title: row.title,
    titleEn: row.title_en ?? undefined,
    excerpt: row.excerpt ?? '',
    excerptEn: row.excerpt_en ?? undefined,
    content: row.content ?? '',
    contentEn: row.content_en ?? undefined,
    category: categorySlug as NewsArticle['category'],
    author: row.author_name ?? 'Redação CIN',
    authorId: row.author_id ?? '',
    publishedAt: row.published_at ?? row.created_at ?? new Date().toISOString(),
    updatedAt: row.updated_at ?? row.created_at ?? new Date().toISOString(),
    readingTime: row.reading_time ?? 0,
    coverImage: toWebpUrl(row.cover_image ?? '/images/news/hero.webp'),
    tags,
    featured: Boolean(row.is_featured),
    breaking: Boolean(row.is_breaking),
    views: row.views ?? 0,
    likes: row.likes ?? 0,
    shares: row.shares ?? 0,
    comments: row.comments_count ?? 0,
  };
};

const getArticleMetaBySlug = async (
  slug: string,
): Promise<{ id: string; authorId: string | null } | null> => {
  const { data, error } = await supabase
    .from('news_articles')
    .select('id,author_id')
    .eq('slug', slug)
    .single();

  if (error) return null;
  if (!isRecord(data) || typeof data.id !== 'string') return null;

  const authorId = typeof data.author_id === 'string' ? data.author_id : null;
  return { id: data.id, authorId };
};

const requireActiveAuthor = async (authorId: string): Promise<AuthorProfileRow> => {
  const slug = authorId.trim();
  if (!slug) {
    throw new Error('Autor profissional obrigatorio');
  }

  const { data, error } = await supabase
    .from('authors')
    .select('slug,name,is_active')
    .eq('slug', slug)
    .maybeSingle();

  if (error || !data) {
    throw new Error('Autor profissional invalido');
  }

  const row = data as AuthorProfileRow;
  if (row.is_active === false || !row.slug || !row.name) {
    throw new Error('Autor profissional inativo');
  }

  return row;
};

// ==================== QUERIES ====================

export async function getAllArticles(options?: { includeDrafts?: boolean }): Promise<NewsArticle[]> {
  const includeDrafts = options?.includeDrafts ?? false;

  if (!isSupabaseConfigured) return [];

  let query = supabase
    .from('news_articles')
    .select(ARTICLE_SELECT)
    .order('published_at', { ascending: false, nullsFirst: false });

  if (!includeDrafts) {
    query = query.eq('status', 'published');
  }

  const { data, error } = await query;
  if (error) {
    logger.warnRateLimit('newsManager.getAllArticles', WARN_INTERVAL_MS, '[newsManager] getAllArticles failed:', summarizeError(error));
    return [];
  }
  
  if (!isArray(data)) return [];
  return data.map(mapArticleRow);
}

export async function getArticleBySlug(
  slug: string,
  options?: { includeDrafts?: boolean }
): Promise<NewsArticle | null> {
  const includeDrafts = options?.includeDrafts ?? false;

  // 1. Tentar PostgreSQL local primeiro
  if (useLocalDb) {
    try {
      const statusFilter = includeDrafts ? '' : "AND status = 'published'";
      const result = await query(
        `SELECT * FROM news_articles 
         WHERE slug = $1 ${statusFilter} 
         LIMIT 1`,
        [slug]
      );
      
      if (result.rows.length > 0) {
        return mapDbRowToArticle(result.rows[0]);
      }
    } catch (error) {
      logger.error('[newsManager] getArticleBySlug (local DB) failed:', error);
    }
  }

  // 2. Fallback para Supabase
  if (!isSupabaseConfigured) return null;

  let queryBuilder = supabase
    .from('news_articles')
    .select(ARTICLE_SELECT)
    .eq('slug', slug);

  if (!includeDrafts) {
    queryBuilder = queryBuilder.eq('status', 'published');
  }

  const { data, error } = await queryBuilder.single();
  if (error) return null;
  return data ? mapArticleRow(data) : null;
}

export async function getArticlesByCategory(category: string): Promise<NewsArticle[]> {
  // 1. Tentar Supabase (suporta filtragem por categoria via relationship table)
  if (isSupabaseConfigured) {
    try {
      // Filtra via relacionamento (categories.slug) para evitar "baixar tudo e filtrar em memória".
      // Obs: depende de join table news_article_categories -> categories.
      const selectWithInnerCategory = ARTICLE_SELECT
        .replace('news_article_categories (', 'news_article_categories!inner (')
        .replace('categories (', 'categories!inner (');

      const { data, error } = await supabase
        .from('news_articles')
        .select(selectWithInnerCategory)
        .eq('status', 'published')
        .eq('news_article_categories.categories.slug', category)
        .order('published_at', { ascending: false, nullsFirst: false })
        .limit(60);

      if (!error && isArray(data) && data.length > 0) {
        return data.map(mapArticleRow);
      }
    } catch (err) {
      logger.warnRateLimit('newsManager.getArticlesByCategory', WARN_INTERVAL_MS, '[newsManager] getArticlesByCategory (Supabase) failed:', summarizeError(err));
    }
  }

  // 2. Fallback: PostgreSQL local não tem suporte a categorias (relationship table vazia)
  // Retorna array vazio para forçar outras partes do site a funcionarem
  return [];
}

export async function getFeaturedArticles(limit = 3): Promise<NewsArticle[]> {
  // Usar PostgreSQL local se DATABASE_URL estiver configurada
  if (useLocalDb) {
    try {
      const result = await query(
        `SELECT * FROM news_articles 
         WHERE status = 'published' AND is_featured = true 
         ORDER BY published_at DESC NULLS LAST 
         LIMIT $1`,
        [limit]
      );
      return result.rows.map(mapDbRowToArticle);
    } catch (error) {
      logger.error('[newsManager] getFeaturedArticles (local DB) failed:', error);
      return [];
    }
  }

  // Fallback para Supabase
  if (!isSupabaseConfigured) return [];

  return withQueryCache(`newsManager:getFeaturedArticles:${limit}`, QUERY_CACHE_TTL_MS, async () => {
    const { data, error } = await supabase
      .from('news_articles')
      .select(ARTICLE_SELECT)
      .eq('status', 'published')
      .eq('is_featured', true)
      .order('published_at', { ascending: false, nullsFirst: false })
      .limit(limit);

    if (error) {
      logger.warnRateLimit(
        'newsManager.getFeaturedArticles',
        WARN_INTERVAL_MS,
        '[newsManager] getFeaturedArticles failed:',
        summarizeError(error),
      );
      return [];
    }

    if (!isArray(data)) return [];
    return data.map(mapArticleRow);
  });
}

export async function getBreakingNews(): Promise<NewsArticle[]> {
  // Usar PostgreSQL local se DATABASE_URL estiver configurada
  if (useLocalDb) {
    try {
      const result = await query(
        `SELECT * FROM news_articles 
         WHERE status = 'published' AND is_breaking = true 
         ORDER BY published_at DESC NULLS LAST`
      );
      return result.rows.map(mapDbRowToArticle);
    } catch (error) {
      logger.error('[newsManager] getBreakingNews (local DB) failed:', error);
      return [];
    }
  }

  // Fallback para Supabase
  if (!isSupabaseConfigured) return [];

  return withQueryCache('newsManager:getBreakingNews', QUERY_CACHE_TTL_MS, async () => {
    const { data, error } = await supabase
      .from('news_articles')
      .select(ARTICLE_SELECT)
      .eq('status', 'published')
      .eq('is_breaking', true)
      .order('published_at', { ascending: false, nullsFirst: false });

    if (error) {
      logger.warnRateLimit(
        'newsManager.getBreakingNews',
        WARN_INTERVAL_MS,
        '[newsManager] getBreakingNews failed:',
        summarizeError(error),
      );
      return [];
    }

    if (!isArray(data)) return [];
    return data.map(mapArticleRow);
  });
}

export async function getLatestArticles(limit = 10): Promise<NewsArticle[]> {
  // Usar PostgreSQL local se DATABASE_URL estiver configurada
  if (useLocalDb) {
    try {
      const result = await query(
        `SELECT * FROM news_articles 
         WHERE status = 'published' 
         ORDER BY published_at DESC NULLS LAST 
         LIMIT $1`,
        [limit]
      );
      return result.rows.map(mapDbRowToArticle);
    } catch (error) {
      logger.error('[newsManager] getLatestArticles (local DB) failed:', error);
      return [];
    }
  }

  // Fallback para Supabase
  if (!isSupabaseConfigured) return [];

  return withQueryCache(`newsManager:getLatestArticles:${limit}`, QUERY_CACHE_TTL_MS, async () => {
    const { data, error } = await supabase
      .from('news_articles')
      .select(ARTICLE_SELECT)
      .eq('status', 'published')
      .order('published_at', { ascending: false, nullsFirst: false })
      .limit(limit);

    if (error) {
      logger.warnRateLimit(
        'newsManager.getLatestArticles',
        WARN_INTERVAL_MS,
        '[newsManager] getLatestArticles failed:',
        summarizeError(error),
      );
      return [];
    }

    if (!isArray(data)) return [];
    return data.map(mapArticleRow);
  });
}

export async function getRelatedArticles(
  currentSlug: string,
  category: string,
  tags: string[] = [],
  limit = 4
): Promise<NewsArticle[]> {
  if (!isSupabaseConfigured) return [];

  const items = await getArticlesByCategory(category);
  const tagSet = new Set(tags.map((t) => t.toLowerCase().trim()).filter(Boolean));

  const scored = items
    .filter((a) => a.slug !== currentSlug)
    .map((a) => {
      const shared = (a.tags ?? []).reduce((acc, t) => {
        const key = t.toLowerCase().trim();
        return key && tagSet.has(key) ? acc + 1 : acc;
      }, 0);
      return { article: a, score: shared };
    })
    .sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score;
      return new Date(b.article.publishedAt).getTime() - new Date(a.article.publishedAt).getTime();
    })
    .map((x) => x.article);

  return scored.slice(0, limit);
}

export async function getTrendingArticles(limit = 5): Promise<NewsArticle[]> {
  // Usar PostgreSQL local se DATABASE_URL estiver configurada
  if (useLocalDb) {
    try {
      const result = await query(
        `SELECT * FROM news_articles 
         WHERE status = 'published' 
         ORDER BY views DESC 
         LIMIT $1`,
        [limit]
      );
      return result.rows.map(mapDbRowToArticle);
    } catch (error) {
      logger.error('[newsManager] getTrendingArticles (local DB) failed:', error);
      return [];
    }
  }

  // Fallback para Supabase
  if (!isSupabaseConfigured) return [];

  return withQueryCache(`newsManager:getTrendingArticles:${limit}`, QUERY_CACHE_TTL_MS, async () => {
    const { data, error } = await supabase
      .from('news_articles')
      .select(ARTICLE_SELECT)
      .eq('status', 'published')
      .order('views', { ascending: false })
      .limit(limit);

    if (error) {
      logger.warnRateLimit(
        'newsManager.getTrendingArticles',
        WARN_INTERVAL_MS,
        '[newsManager] getTrendingArticles failed:',
        summarizeError(error),
      );
      return [];
    }

    if (!isArray(data)) return [];
    return data.map(mapArticleRow);
  });
}

export async function searchArticles(query: string): Promise<NewsArticle[]> {
  if (!isSupabaseConfigured) return [];

  const q = query.trim();
  if (!q) return [];

  // Prefer FTS RPC (ranked). Fallback to ilike.
  try {
    const { data: ids, error: rpcError } = await supabase.rpc('search_news_articles_ids', {
      q,
      lim: 30,
    });

    if (!rpcError && isArray(ids) && ids.length > 0) {
      const orderedIds = ids
        .map((r: unknown) => isSearchResultRow(r) ? r.id : null)
        .filter((id): id is string => id !== null);

      const { data, error } = await supabase
        .from('news_articles')
        .select(ARTICLE_SELECT)
        .in('id', orderedIds)
        .eq('status', 'published');

      if (error) {
        logger.warnRateLimit('newsManager.searchArticles.fetchByIds', WARN_INTERVAL_MS, '[newsManager] searchArticles fetch-by-ids failed:', summarizeError(error));
        return [];
      }

      if (!isArray(data)) return [];
      const mapped = data.map(mapArticleRow);
      const byId = new Map(mapped.map((a) => [a.id, a]));
      return orderedIds.map((id: string) => byId.get(id)).filter((a): a is NewsArticle => a !== undefined);
    }
  } catch (err) {
    logger.warnRateLimit('newsManager.searchArticles.rpc', WARN_INTERVAL_MS, '[newsManager] searchArticles rpc failed:', summarizeError(err));
  }

  const safeQuery = escapeLikePattern(q);
  const like = `%${safeQuery}%`;
  const { data, error } = await supabase
    .from('news_articles')
    .select(ARTICLE_SELECT)
    .eq('status', 'published')
    .or(`title.ilike.${like},excerpt.ilike.${like},slug.ilike.${like}`)
    .order('published_at', { ascending: false, nullsFirst: false })
    .limit(30);

  if (error) {
    logger.warnRateLimit('newsManager.searchArticles.ilike', WARN_INTERVAL_MS, '[newsManager] searchArticles ilike failed:', summarizeError(error));
    return [];
  }

  if (!isArray(data)) return [];
  return data.map(mapArticleRow);
}

export async function getArticlesByAuthor(authorSlug: string, limit = 6): Promise<NewsArticle[]> {
  // 1. Tentar PostgreSQL local primeiro
  if (useLocalDb) {
    try {
      const result = await query(
        `SELECT * FROM news_articles 
         WHERE status = 'published' 
         AND (author_id = $1 OR author_name ILIKE $2)
         ORDER BY published_at DESC NULLS LAST 
         LIMIT $3`,
        [authorSlug, `%${authorSlug.replace('-', '%')}%`, limit]
      );
      
      if (result.rows.length > 0) {
        return result.rows.map(mapDbRowToArticle);
      }
    } catch (error) {
      logger.error('[newsManager] getArticlesByAuthor (local DB) failed:', error);
    }
  }

  // 2. Fallback para Supabase
  if (!isSupabaseConfigured) return [];

  // Busca por author_id (slug do autor) ou author_name contendo o nome
  const { data, error } = await supabase
    .from('news_articles')
    .select(ARTICLE_SELECT)
    .eq('status', 'published')
    .or(`author_id.eq.${authorSlug},author_name.ilike.%${escapeLikePattern(authorSlug.replace('-', '%'))}%`)
    .order('published_at', { ascending: false, nullsFirst: false })
    .limit(limit);

  if (error) {
    // Intencionalmente não logamos erros em produção
    return [];
  }

  if (!isArray(data)) return [];
  return data.map(mapArticleRow);
}

// ==================== CRUD ADMIN ====================

export async function createArticle(
  articleData: Omit<NewsArticle, 'id' | 'publishedAt' | 'updatedAt'>,
  customPublishedAt?: string,
  status: 'draft' | 'scheduled' | 'published' = 'published'
): Promise<NewsArticle> {
  const publishedAt = customPublishedAt ?? new Date().toISOString();
  const authorProfile = await requireActiveAuthor(articleData.authorId);

  const { data: inserted, error } = await supabase
    .from('news_articles')
    .insert({
      title: articleData.title,
      title_en: articleData.titleEn ?? null,
      excerpt: articleData.excerpt,
      excerpt_en: articleData.excerptEn ?? null,
      content: articleData.content,
      content_en: articleData.contentEn ?? null,
      slug: articleData.slug,
      cover_image: articleData.coverImage,
      author_id: authorProfile.slug,
      author_name: authorProfile.name,
      status,
      published_at: status === 'draft' ? null : publishedAt,
      reading_time: articleData.readingTime,
      is_featured: articleData.featured,
      is_breaking: articleData.breaking,
      views: articleData.views ?? 0,
      likes: articleData.likes ?? 0,
      shares: articleData.shares ?? 0,
      comments_count: articleData.comments ?? 0,
    })
    .select(ARTICLE_SELECT)
    .single();

  if (error) throw error;
  if (!inserted) throw new Error('Failed to create article');

  // Categoria
  const categorySlug = articleData.category;
  const { data: category } = await supabase
    .from('categories')
    .select('id')
    .eq('slug', categorySlug)
    .single();

  if (isRecord(category) && typeof category.id === 'string') {
    await supabase.from('news_article_categories').insert({
      article_id: isRecord(inserted) && typeof inserted.id === 'string' ? inserted.id : '',
      category_id: category.id,
    });
  }

  // Tags
  const tagNames = articleData.tags ?? [];
  for (const tag of tagNames) {
    const tagSlug = slugify(tag);
    const { data: tagRow } = await supabase
      .from('tags')
      .upsert({ name: tag, slug: tagSlug }, { onConflict: 'slug' })
      .select('id')
      .single();

    if (isRecord(tagRow) && typeof tagRow.id === 'string') {
      await supabase.from('news_article_tags').insert({
        article_id: isRecord(inserted) && typeof inserted.id === 'string' ? inserted.id : '',
        tag_id: tagRow.id,
      });
    }
  }

  return mapArticleRow(inserted);
}

export async function updateArticle(
  slug: string,
  updates: Partial<NewsArticle>
): Promise<NewsArticle | null> {
  const articleMeta = await getArticleMetaBySlug(slug);
  if (!articleMeta) return null;
  const articleId = articleMeta.id;

  const nextSlug = updates.slug ?? slug;
  const nextAuthorId = (updates.authorId ?? articleMeta.authorId ?? '').trim();
  const authorProfile = await requireActiveAuthor(nextAuthorId);

  const { data, error } = await supabase
    .from('news_articles')
    .update({
      title: updates.title,
      title_en: updates.titleEn ?? null,
      excerpt: updates.excerpt,
      excerpt_en: updates.excerptEn ?? null,
      content: updates.content,
      content_en: updates.contentEn ?? null,
      slug: nextSlug,
      cover_image: updates.coverImage,
      author_id: authorProfile.slug,
      author_name: authorProfile.name,
      published_at: updates.publishedAt,
      reading_time: updates.readingTime,
      is_featured: updates.featured,
      is_breaking: updates.breaking,
      views: updates.views,
      likes: updates.likes,
      shares: updates.shares,
      comments_count: updates.comments,
    })
    .eq('id', articleId)
    .select(ARTICLE_SELECT)
    .single();

  if (error) throw error;

  // Best-effort: persist 301 redirect when slug changes.
  // This is optional and should never block article updates.
  if (nextSlug !== slug) {
    try {
      await supabase
        .from('news_slug_redirects')
        .upsert(
          {
            from_slug: slug,
            to_slug: nextSlug,
            article_id: articleId,
          },
          { onConflict: 'from_slug' },
        );
    } catch (err) {
        logger.warnRateLimit('newsManager.redirect.upsert', WARN_INTERVAL_MS, '[newsManager] redirect upsert failed:', summarizeError(err));
    }
  }

  if (updates.category) {
    const { data: category } = await supabase
      .from('categories')
      .select('id')
      .eq('slug', updates.category)
      .single();
    if (isRecord(category) && typeof category.id === 'string') {
      await supabase.from('news_article_categories').delete().eq('article_id', articleId);
      await supabase.from('news_article_categories').insert({
        article_id: articleId,
        category_id: category.id,
      });
    }
  }

  if (updates.tags) {
    await supabase.from('news_article_tags').delete().eq('article_id', articleId);
    for (const tag of updates.tags) {
      const slugTag = slugify(tag);
      const { data: tagRow } = await supabase
        .from('tags')
        .upsert({ name: tag, slug: slugTag }, { onConflict: 'slug' })
        .select('id')
        .single();

      if (isRecord(tagRow) && typeof tagRow.id === 'string') {
        await supabase.from('news_article_tags').insert({
          article_id: articleId,
          tag_id: tagRow.id,
        });
      }
    }
  }

  return data ? mapArticleRow(data) : null;
}

export async function getRedirectTargetSlug(fromSlug: string): Promise<string | null> {
  if (!isSupabaseConfigured) return null;
  const slug = fromSlug.trim();
  if (!slug) return null;

  try {
    const { data, error } = await supabase
      .from('news_slug_redirects')
      .select('to_slug')
      .eq('from_slug', slug)
      .maybeSingle();

    if (error) return null;
    const toSlug = isRecord(data) && typeof data.to_slug === 'string' ? data.to_slug : null;
    if (!toSlug || toSlug === slug) return null;
    return toSlug;
  } catch {
    return null;
  }
}

export async function deleteArticle(slug: string): Promise<boolean> {
  const { error } = await supabase.from('news_articles').delete().eq('slug', slug);
  return !error;
}

export async function duplicateArticle(slug: string): Promise<NewsArticle | null> {
  const article = await getArticleBySlug(slug, { includeDrafts: true });
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

// ==================== AGENDAMENTO ====================

export async function scheduleArticle(
  articleData: Omit<NewsArticle, 'id' | 'publishedAt' | 'updatedAt'>,
  scheduledDate: string,
  scheduledTime: string,
  timezone = 'America/Sao_Paulo'
): Promise<ScheduledArticle> {
  const scheduledDateTime = new Date(`${scheduledDate}T${scheduledTime}`);
  const created = await createArticle(
    articleData,
    scheduledDateTime.toISOString(),
    'scheduled'
  );

  return {
    id: created.id,
    articleData,
    scheduledDate,
    scheduledTime,
    timezone,
    status: 'pending',
    createdAt: new Date().toISOString(),
  };
}

export async function getScheduledArticles(): Promise<ScheduledArticle[]> {
  const { data, error } = await supabase
    .from('news_articles')
    .select(ARTICLE_SELECT)
    .eq('status', 'scheduled')
    .order('published_at', { ascending: true, nullsFirst: false });

  if (error) throw error;
  if (!isArray(data)) return [];

  return data.map(row => {
    const article = mapArticleRow(row);
    const scheduledAt = new Date(article.publishedAt);
    return {
      id: article.id,
      articleData: {
        ...article,
        publishedAt: article.publishedAt,
        updatedAt: article.updatedAt,
      },
      scheduledDate: scheduledAt.toISOString().slice(0, 10),
      scheduledTime: scheduledAt.toISOString().slice(11, 16),
      timezone: 'America/Sao_Paulo',
      status: 'pending',
      createdAt: article.updatedAt,
    };
  });
}

export async function cancelScheduledArticle(id: string): Promise<boolean> {
  const { error } = await supabase
    .from('news_articles')
    .update({ status: 'draft', published_at: null })
    .eq('id', id);
  return !error;
}

export async function updateScheduledArticle(
  id: string,
  updates: { scheduledDate: string; scheduledTime: string }
): Promise<boolean> {
  const scheduledDateTime = new Date(`${updates.scheduledDate}T${updates.scheduledTime}`);
  const { error } = await supabase
    .from('news_articles')
    .update({ published_at: scheduledDateTime.toISOString() })
    .eq('id', id);
  return !error;
}

export async function checkAndPublishScheduled(): Promise<number> {
  const now = new Date();
  
  // 1. Tentar PostgreSQL local primeiro
  if (useLocalDb) {
    try {
      console.log('[checkAndPublishScheduled] Checking local PostgreSQL for scheduled articles...');
      
      const result = await query(
        `UPDATE news_articles 
         SET status = 'published', updated_at = NOW()
         WHERE id IN (
           SELECT id FROM news_articles 
           WHERE status = 'scheduled' 
           AND published_at <= $1
           LIMIT 50
         )
         RETURNING id`,
        [now.toISOString()]
      );
      
      if (result.rowCount && result.rowCount > 0) {
        console.log(`[checkAndPublishScheduled] ✓ Published ${result.rowCount} articles from local PostgreSQL`);
        
        // Also update the timestamp
        console.log(`[checkAndPublishScheduled] Published article IDs:`, result.rows.map(r => r.id));
        return result.rowCount;
      }
      
      console.log('[checkAndPublishScheduled] No scheduled articles found in local PostgreSQL');
    } catch (err) {
      console.error('[checkAndPublishScheduled] ✗ Local PostgreSQL error:', err);
    }
  }

  // 2. Fallback para Supabase
  if (isSupabaseConfigured) {
    try {
      console.log('[checkAndPublishScheduled] Checking Supabase for scheduled articles...');
      
      const { data, error } = await supabase
        .from('news_articles')
        .update({ status: 'published' })
        .eq('status', 'scheduled')
        .lte('published_at', now.toISOString())
        .select('id')
        .limit(50);

      if (error) {
        console.error('[checkAndPublishScheduled] ✗ Supabase error:', error);
        throw error;
      }

      const count = isArray(data) ? data.length : 0;
      if (count > 0) {
        console.log(`[checkAndPublishScheduled] ✓ Published ${count} articles from Supabase`);
      } else {
        console.log('[checkAndPublishScheduled] No scheduled articles found in Supabase');
      }
      return count;
    } catch (err) {
      console.error('[checkAndPublishScheduled] ✗ Supabase fallback error:', err);
    }
  }

  console.log('[checkAndPublishScheduled] No articles published (no database available)');
  return 0;
}

// ==================== ESTATÍSTICAS ====================

export async function getArticleStats() {
  const articles = await getAllArticles({ includeDrafts: true });
  const scheduled = await getScheduledArticles();

  return {
    total: articles.length,
    published: articles.filter(a => a.publishedAt).length,
    breaking: articles.filter(a => a.breaking).length,
    featured: articles.filter(a => a.featured).length,
    scheduled: scheduled.length,
    totalViews: articles.reduce((sum, a) => sum + a.views, 0),
    totalLikes: articles.reduce((sum, a) => sum + a.likes, 0),
    byCategory: {
      economia: articles.filter(a => a.category === 'economia').length,
      geopolitica: articles.filter(a => a.category === 'geopolitica').length,
      tecnologia: articles.filter(a => a.category === 'tecnologia').length,
    },
  };
}

// ==================== FILTROS + PAGINAÇÃO ====================

export async function filterArticles(filters: ArticleFilters): Promise<NewsArticle[]> {
  const result = await getArticlesPaginated(filters, 1, 200, { includeDrafts: true });
  return result.items;
}

export async function getArticlesPaginated(
  filters: ArticleFilters,
  page = 1,
  perPage = 10,
  options?: { includeDrafts?: boolean }
): Promise<PaginatedResult<NewsArticle>> {
  if (!isSupabaseConfigured) {
    return { items: [], total: 0, page, perPage, totalPages: 0 };
  }

  const includeDrafts = options?.includeDrafts ?? false;

  const safePage = Math.max(1, page);
  const safePerPage = Math.min(Math.max(1, perPage), 100);
  const from = (safePage - 1) * safePerPage;
  const to = from + safePerPage - 1;

  const hasCategory = Boolean(filters.category && filters.category !== 'all');
  const selectBase = hasCategory
    ? ARTICLE_SELECT
        .replace('news_article_categories (', 'news_article_categories!inner (')
        .replace('categories (', 'categories!inner (')
    : ARTICLE_SELECT;

  let query = supabase
    .from('news_articles')
    .select(selectBase, { count: 'exact' });

  if (!includeDrafts) {
    query = query.eq('status', 'published');
  }

  if (filters.search) {
    const q = filters.search.trim();
    if (q) {
      const like = `%${q}%`;
      query = query.or(`title.ilike.${like},excerpt.ilike.${like},slug.ilike.${like}`);
    }
  }

  if (hasCategory) {
    query = query.eq('news_article_categories.categories.slug', filters.category as string);
  }

  if (filters.status && filters.status !== 'all') {
    switch (filters.status) {
      case 'breaking':
        query = query.eq('status', 'published').eq('is_breaking', true);
        break;
      case 'featured':
        query = query.eq('status', 'published').eq('is_featured', true);
        break;
      case 'published':
        query = query.eq('status', 'published');
        break;
      case 'scheduled':
        query = query.eq('status', 'scheduled');
        break;
      case 'draft':
        query = query.eq('status', 'draft');
        break;
    }
  }

  if (filters.author) {
    query = query.eq('author_id', filters.author);
  }

  if (filters.dateFrom) {
    query = query.gte('published_at', filters.dateFrom);
  }

  if (filters.dateTo) {
    query = query.lte('published_at', filters.dateTo);
  }

  const sortBy = filters.sortBy || 'date';
  const sortOrder = filters.sortOrder || 'desc';
  const ascending = sortOrder === 'asc';

  if (sortBy === 'views') query = query.order('views', { ascending });
  else if (sortBy === 'likes') query = query.order('likes', { ascending });
  else query = query.order('published_at', { ascending, nullsFirst: false });

  const { data, error, count } = await query.range(from, to) as { data: unknown; error: Error | null; count: number | null };
  if (error) {
    logger.warnRateLimit('newsManager.getArticlesPaginated', WARN_INTERVAL_MS, '[newsManager] getArticlesPaginated failed:', summarizeError(error));
    return { items: [], total: 0, page: safePage, perPage: safePerPage, totalPages: 0 };
  }

  const total = count ?? 0;
  const totalPages = Math.ceil(total / safePerPage);
  const items = isArray(data) ? data.map(mapArticleRow) : [];

  return { items, total, page: safePage, perPage: safePerPage, totalPages };
}

// ==================== SLUG GENERATOR ====================

export function generateSlug(title: string): string {
  return slugify(title);
}

export async function isSlugAvailable(slug: string, excludeSlug?: string): Promise<boolean> {
  const { data, error } = await supabase
    .from('news_articles')
    .select('slug')
    .eq('slug', slug)
    .maybeSingle();

  if (error && 'code' in error && error.code !== 'PGRST116') return false;
  if (!data) return true;
  return isRecord(data) && typeof data.slug === 'string' && data.slug === excludeSlug;
}

export async function resetToDefault(): Promise<void> {
  await supabase.from('news_articles').delete().neq('id', '');
}

export async function assignAllArticlesToAuthor(
  authorId: string,
): Promise<number> {
  const authorProfile = await requireActiveAuthor(authorId);

  const { data, error } = await supabase
    .from('news_articles')
    .update({
      author_id: authorProfile.slug,
      author_name: authorProfile.name,
    })
    .select('id');

  if (error) throw error;
  return isArray(data) ? data.length : 0;
}

// Re-exporta tipos para facilitar imports
export type { NewsArticle } from '@/types';
