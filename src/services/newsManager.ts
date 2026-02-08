/**
 * Serviço de Notícias - Supabase
 * CRUD + consultas e agendamento via banco de dados
 */

import { supabase, isSupabaseConfigured } from '@/lib/supabaseClient';
import { toWebpUrl } from '@/lib/image';
import { logger } from '@/lib/logger';
import type { NewsArticle } from '@/types';

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

// ==================== HELPERS ====================

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

const mapArticleRow = (row: any): NewsArticle => {
  const categorySlug =
    row?.news_article_categories?.[0]?.categories?.slug ?? 'economia';
  const tags =
    row?.news_article_tags?.map((t: any) => t?.tags?.name).filter(Boolean) ?? [];

  return {
    id: row.id,
    slug: row.slug,
    title: row.title,
    titleEn: row.title_en ?? undefined,
    excerpt: row.excerpt ?? '',
    excerptEn: row.excerpt_en ?? undefined,
    content: row.content ?? '',
    contentEn: row.content_en ?? undefined,
    category: categorySlug,
    author: row.author_name ?? 'Redação PEM',
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

const getArticleIdBySlug = async (slug: string): Promise<string | null> => {
  const { data, error } = await supabase
    .from('news_articles')
    .select('id')
    .eq('slug', slug)
    .single();

  if (error) return null;
  return data?.id ?? null;
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
    logger.warn('[newsManager] getAllArticles failed:', error);
    return [];
  }
  return (data ?? []).map(mapArticleRow);
}

export async function getArticleBySlug(
  slug: string,
  options?: { includeDrafts?: boolean }
): Promise<NewsArticle | null> {
  const includeDrafts = options?.includeDrafts ?? false;

  if (!isSupabaseConfigured) return null;

  let query = supabase
    .from('news_articles')
    .select(ARTICLE_SELECT)
    .eq('slug', slug);

  if (!includeDrafts) {
    query = query.eq('status', 'published');
  }

  const { data, error } = await query.single();
  if (error) return null;
  return data ? mapArticleRow(data) : null;
}

export async function getArticlesByCategory(category: string): Promise<NewsArticle[]> {
  if (!isSupabaseConfigured) return [];

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

  if (error) {
    logger.warn('[newsManager] getArticlesByCategory failed:', error);
    return [];
  }

  return (data ?? []).map(mapArticleRow);
}

export async function getFeaturedArticles(limit = 3): Promise<NewsArticle[]> {
  if (!isSupabaseConfigured) return [];

  const { data, error } = await supabase
    .from('news_articles')
    .select(ARTICLE_SELECT)
    .eq('status', 'published')
    .eq('is_featured', true)
    .order('published_at', { ascending: false, nullsFirst: false })
    .limit(limit);

  if (error) {
    logger.warn('[newsManager] getFeaturedArticles failed:', error);
    return [];
  }
  return (data ?? []).map(mapArticleRow);
}

export async function getBreakingNews(): Promise<NewsArticle[]> {
  if (!isSupabaseConfigured) return [];

  const { data, error } = await supabase
    .from('news_articles')
    .select(ARTICLE_SELECT)
    .eq('status', 'published')
    .eq('is_breaking', true)
    .order('published_at', { ascending: false, nullsFirst: false });

  if (error) {
    logger.warn('[newsManager] getBreakingNews failed:', error);
    return [];
  }
  return (data ?? []).map(mapArticleRow);
}

export async function getLatestArticles(limit = 10): Promise<NewsArticle[]> {
  if (!isSupabaseConfigured) return [];

  const { data, error } = await supabase
    .from('news_articles')
    .select(ARTICLE_SELECT)
    .eq('status', 'published')
    .order('published_at', { ascending: false, nullsFirst: false })
    .limit(limit);

  if (error) {
    logger.warn('[newsManager] getLatestArticles failed:', error);
    return [];
  }
  return (data ?? []).map(mapArticleRow);
}

export async function getRelatedArticles(
  currentSlug: string,
  category: string,
  limit = 4
): Promise<NewsArticle[]> {
  if (!isSupabaseConfigured) return [];

  const items = await getArticlesByCategory(category);
  return items.filter((a) => a.slug !== currentSlug).slice(0, limit);
}

export async function getTrendingArticles(limit = 5): Promise<NewsArticle[]> {
  if (!isSupabaseConfigured) return [];

  const { data, error } = await supabase
    .from('news_articles')
    .select(ARTICLE_SELECT)
    .eq('status', 'published')
    .order('views', { ascending: false })
    .limit(limit);

  if (error) {
    logger.warn('[newsManager] getTrendingArticles failed:', error);
    return [];
  }
  return (data ?? []).map(mapArticleRow);
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

    if (!rpcError && Array.isArray(ids) && ids.length > 0) {
      const orderedIds = ids.map((r: any) => r.id).filter(Boolean);

      const { data, error } = await supabase
        .from('news_articles')
        .select(ARTICLE_SELECT)
        .in('id', orderedIds)
        .eq('status', 'published');

      if (error) {
        logger.warn('[newsManager] searchArticles fetch-by-ids failed:', error);
        return [];
      }

      const mapped = (data ?? []).map(mapArticleRow);
      const byId = new Map(mapped.map((a) => [a.id, a]));
      return orderedIds.map((id: string) => byId.get(id)).filter(Boolean) as NewsArticle[];
    }
  } catch (err) {
    logger.warn('[newsManager] searchArticles rpc failed:', err);
  }

  const like = `%${q}%`;
  const { data, error } = await supabase
    .from('news_articles')
    .select(ARTICLE_SELECT)
    .eq('status', 'published')
    .or(`title.ilike.${like},excerpt.ilike.${like},slug.ilike.${like}`)
    .order('published_at', { ascending: false, nullsFirst: false })
    .limit(30);

  if (error) {
    logger.warn('[newsManager] searchArticles ilike failed:', error);
    return [];
  }

  return (data ?? []).map(mapArticleRow);
}

export async function getArticlesByAuthor(authorSlug: string, limit = 6): Promise<NewsArticle[]> {
  if (!isSupabaseConfigured) return [];

  // Busca por author_id (slug do autor) ou author_name contendo o nome
  const { data, error } = await supabase
    .from('news_articles')
    .select(ARTICLE_SELECT)
    .eq('status', 'published')
    .or(`author_id.eq.${authorSlug},author_name.ilike.%${authorSlug.replace('-', '%')}%`)
    .order('published_at', { ascending: false, nullsFirst: false })
    .limit(limit);

  if (error) {
    console.error('Error fetching articles by author:', error);
    return [];
  }

  return (data ?? []).map(mapArticleRow);
}

// ==================== CRUD ADMIN ====================

export async function createArticle(
  articleData: Omit<NewsArticle, 'id' | 'publishedAt' | 'updatedAt'>,
  customPublishedAt?: string,
  status: 'draft' | 'scheduled' | 'published' = 'published'
): Promise<NewsArticle> {
  const publishedAt = customPublishedAt ?? new Date().toISOString();

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
      author_id: articleData.authorId || null,
      author_name: articleData.author,
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

  // Categoria
  const categorySlug = articleData.category;
  const { data: category } = await supabase
    .from('categories')
    .select('id')
    .eq('slug', categorySlug)
    .single();

  if (category?.id) {
    await supabase.from('news_article_categories').insert({
      article_id: inserted.id,
      category_id: category.id,
    });
  }

  // Tags
  const tagNames = articleData.tags ?? [];
  for (const tag of tagNames) {
    const slug = slugify(tag);
    const { data: tagRow } = await supabase
      .from('tags')
      .upsert({ name: tag, slug }, { onConflict: 'slug' })
      .select('id')
      .single();

    if (tagRow?.id) {
      await supabase.from('news_article_tags').insert({
        article_id: inserted.id,
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
  const articleId = await getArticleIdBySlug(slug);
  if (!articleId) return null;

  const nextSlug = updates.slug ?? slug;

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
      author_id: updates.authorId || null,
      author_name: updates.author,
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
      logger.warn('[newsManager] redirect upsert failed:', err);
    }
  }

  if (updates.category) {
    const { data: category } = await supabase
      .from('categories')
      .select('id')
      .eq('slug', updates.category)
      .single();
    if (category?.id) {
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
      if (tagRow?.id) {
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
    const toSlug = (data as any)?.to_slug as string | undefined;
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
  timezone: string = 'America/Sao_Paulo'
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

  return (data ?? []).map(row => {
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
  const now = new Date().toISOString();
  const { data, error } = await supabase
    .from('news_articles')
    .update({ status: 'published' })
    .eq('status', 'scheduled')
    .lte('published_at', now)
    .select('id');

  if (error) throw error;
  return data?.length ?? 0;
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
  page: number = 1,
  perPage: number = 10,
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

  const { data, error, count } = await query.range(from, to);
  if (error) {
    logger.warn('[newsManager] getArticlesPaginated failed:', error);
    return { items: [], total: 0, page: safePage, perPage: safePerPage, totalPages: 0 };
  }

  const total = count ?? 0;
  const totalPages = Math.ceil(total / safePerPage);
  const items = (data ?? []).map(mapArticleRow);

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

  if (error && error.code !== 'PGRST116') return false;
  if (!data) return true;
  return data.slug === excludeSlug;
}

export async function resetToDefault(): Promise<void> {
  await supabase.from('news_articles').delete().neq('id', '');
}

export async function assignAllArticlesToAuthor(
  authorId: string,
  authorName: string
): Promise<number> {
  const { data, error } = await supabase
    .from('news_articles')
    .update({
      author_id: authorId || null,
      author_name: authorName,
    })
    .select('id');

  if (error) throw error;
  return data?.length ?? 0;
}
