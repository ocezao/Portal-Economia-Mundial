/**
 * Servico de noticias sobre PostgreSQL local.
 * CRUD + consultas via banco de dados.
 */

import { query, queryOne, withTransaction } from '@/lib/db';
import { toWebpUrl } from '@/lib/image';
import { logger } from '@/lib/logger';
import { escapeLikePattern } from '@/lib/security';
import type { ArticleFaqItem, ArticleSource, NewsArticle } from '@/types';

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

// ==================== HELPERS PARA POSTGRESQL LOCAL ====================

function mapDbRowToArticle(row: Record<string, unknown>): NewsArticle {
  return {
    id: typeof row.id === 'string' ? row.id : '',
    slug: typeof row.slug === 'string' ? row.slug : '',
    title: typeof row.title === 'string' ? row.title : '',
    titleEn: typeof row.title_en === 'string' ? row.title_en : undefined,
    seoTitle: typeof row.seo_title === 'string' ? row.seo_title : undefined,
    excerpt: typeof row.excerpt === 'string' ? row.excerpt : '',
    excerptEn: typeof row.excerpt_en === 'string' ? row.excerpt_en : undefined,
    metaDescription: typeof row.meta_description === 'string' ? row.meta_description : undefined,
    content: typeof row.content === 'string' ? row.content : '',
    contentEn: typeof row.content_en === 'string' ? row.content_en : undefined,
    coverImage: typeof row.cover_image === 'string' ? toWebpUrl(row.cover_image) : '/images/news/default.webp',
    authorId: typeof row.author_id === 'string' ? row.author_id : 'unknown',
    author: typeof row.author_name === 'string' ? row.author_name : 'Desconhecido',
    category: (typeof row.category === 'string' ? row.category : 'economia') as 'geopolitica' | 'economia' | 'tecnologia',
    tags: Array.isArray(row.tags) ? row.tags.filter((item): item is string => typeof item === 'string') : [],
    publishedAt: typeof row.published_at === 'string'
      ? row.published_at
      : typeof row.created_at === 'string'
        ? row.created_at
        : new Date().toISOString(),
    updatedAt: typeof row.updated_at === 'string' ? row.updated_at : new Date().toISOString(),
    readingTime: typeof row.reading_time === 'number' ? row.reading_time : 4,
    featured: Boolean(row.is_featured),
    breaking: Boolean(row.is_breaking),
    views: typeof row.views === 'number' ? row.views : 0,
    likes: typeof row.likes === 'number' ? row.likes : 0,
    shares: typeof row.shares === 'number' ? row.shares : 0,
    comments: typeof row.comments_count === 'number' ? row.comments_count : 0,
    faqItems: normalizeFaqItems(row.faq_items),
    sources: normalizeArticleSources(row.article_sources),
    editorialStatus: normalizeEditorialStatus(row.editorial_status),
  };
}

type LocalArticleQueryOptions = {
  where?: string[];
  params?: unknown[];
  orderBy?: string;
  limit?: number;
  offset?: number;
};

async function fetchArticlesFromLocalDb(options: LocalArticleQueryOptions = {}): Promise<NewsArticle[]> {
  const whereClause = (options.where ?? []).length > 0
    ? `where ${(options.where ?? []).join(' and ')}`
    : '';
  const params = [...(options.params ?? [])];
  let pagination = '';

  if (typeof options.limit === 'number') {
    params.push(options.limit);
    pagination += ` limit $${params.length}`;
  }

  if (typeof options.offset === 'number') {
    params.push(options.offset);
    pagination += ` offset $${params.length}`;
  }

  const result = await query(
    `select
      na.*,
      coalesce(cat.slug, 'economia') as category,
      coalesce(array_remove(array_agg(distinct t.name), null), '{}'::text[]) as tags,
      coalesce(
        jsonb_agg(
          distinct jsonb_build_object(
            'id', src.id,
            'source_type', src.source_type,
            'source_name', src.source_name,
            'source_url', src.source_url,
            'publisher', src.publisher,
            'country', src.country,
            'language', src.language,
            'accessed_at', src.accessed_at
          )
        ) filter (where src.id is not null),
        '[]'::jsonb
      ) as article_sources
     from news_articles na
     left join news_article_categories nac on nac.article_id = na.id
     left join categories cat on cat.id = nac.category_id
     left join news_article_tags nat on nat.article_id = na.id
     left join tags t on t.id = nat.tag_id
     left join article_sources src on src.article_id = na.id
     ${whereClause}
     group by na.id, cat.slug
     order by ${options.orderBy ?? 'na.published_at desc nulls last'}
     ${pagination}`,
    params,
  );

  return result.rows.map((row) => mapDbRowToArticle(row as Record<string, unknown>));
}

async function countArticlesFromLocalDb(where: string[] = [], params: unknown[] = []): Promise<number> {
  const whereClause = where.length > 0 ? `where ${where.join(' and ')}` : '';
  const result = await query(
    `select count(distinct na.id) as total
     from news_articles na
     left join news_article_categories nac on nac.article_id = na.id
     left join categories cat on cat.id = nac.category_id
     ${whereClause}`,
    params,
  );

  return Number(result.rows[0]?.total ?? 0);
}

// ==================== HELPERS ====================

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

const normalizeFaqItems = (value: unknown): ArticleFaqItem[] => {
  if (!Array.isArray(value)) return [];

  return value
    .map((item) => {
      if (!isRecord(item)) return null;
      const question = typeof item.question === 'string' ? item.question.trim() : '';
      const answer = typeof item.answer === 'string' ? item.answer.trim() : '';
      if (!question || !answer) return null;
      return { question, answer };
    })
    .filter((item): item is ArticleFaqItem => item !== null);
};

const normalizeArticleSources = (value: unknown): ArticleSource[] => {
  if (!Array.isArray(value)) return [];

  return value.flatMap((item): ArticleSource[] => {
      if (!isRecord(item)) return [];
      const sourceName = typeof item.source_name === 'string' ? item.source_name.trim() : '';
      if (!sourceName) return [];
      return [{
        id: typeof item.id === 'string' ? item.id : undefined,
        sourceType: typeof item.source_type === 'string' ? item.source_type : 'reference',
        sourceName,
        sourceUrl: typeof item.source_url === 'string' ? item.source_url : undefined,
        publisher: typeof item.publisher === 'string' ? item.publisher : undefined,
        country: typeof item.country === 'string' ? item.country : undefined,
        language: typeof item.language === 'string' ? item.language : undefined,
        accessedAt: typeof item.accessed_at === 'string' ? item.accessed_at : undefined,
      }];
    });
};

const normalizeEditorialStatus = (
  value: unknown,
): NewsArticle['editorialStatus'] => {
  const allowed: NonNullable<NewsArticle['editorialStatus']>[] = [
    'draft',
    'generated',
    'enriched',
    'review_pending',
    'approved',
    'scheduled',
    'published',
    'distribution_pending',
    'archived',
  ];

  return typeof value === 'string' && allowed.includes(value as NonNullable<NewsArticle['editorialStatus']>)
    ? (value as NonNullable<NewsArticle['editorialStatus']>)
    : 'draft';
};

async function syncArticleSources(articleId: string, sources?: ArticleSource[]) {
  await query('delete from article_sources where article_id = $1', [articleId]);

  const validSources = (sources ?? []).filter((source) => source.sourceName.trim());
  if (validSources.length === 0) return;

  for (const source of validSources) {
    await query(
      `insert into article_sources (
        article_id, source_type, source_name, source_url, publisher, country, language, accessed_at
      ) values ($1, $2, $3, $4, $5, $6, $7, $8)`,
      [
        articleId,
        source.sourceType || 'reference',
        source.sourceName.trim(),
        source.sourceUrl?.trim() || null,
        source.publisher?.trim() || null,
        source.country?.trim() || null,
        source.language?.trim() || null,
        source.accessedAt || null,
      ],
    );
  }
}

const getArticleMetaBySlug = async (
  slug: string,
): Promise<{ id: string; authorId: string | null } | null> => {
  const data = await queryOne<{ id: string; author_id: string | null }>(
    'select id, author_id from news_articles where slug = $1 limit 1',
    [slug],
  );

  if (!data?.id) return null;
  return { id: data.id, authorId: data.author_id };
};

const requireActiveAuthor = async (authorId: string): Promise<AuthorProfileRow> => {
  const slug = authorId.trim();
  if (!slug) {
    throw new Error('Autor profissional obrigatorio');
  }

  const data = await queryOne<AuthorProfileRow>(
    'select slug, name, is_active from authors where slug = $1 limit 1',
    [slug],
  );

  if (!data) {
    throw new Error('Autor profissional invalido');
  }

  if (data.is_active === false || !data.slug || !data.name) {
    throw new Error('Autor profissional inativo');
  }

  return data;
};

// ==================== QUERIES ====================

export async function getAllArticles(options?: { includeDrafts?: boolean }): Promise<NewsArticle[]> {
  const includeDrafts = options?.includeDrafts ?? false;

  try {
    return await fetchArticlesFromLocalDb({
      where: includeDrafts ? [] : [`na.status = 'published'`],
    });
  } catch (error) {
    logger.error('[newsManager] getAllArticles (local DB) failed:', error);
    return [];
  }
}

export async function getArticleBySlug(
  slug: string,
  options?: { includeDrafts?: boolean }
): Promise<NewsArticle | null> {
  const includeDrafts = options?.includeDrafts ?? false;

  try {
    const statusFilter = includeDrafts ? '' : "AND status = 'published'";
    const result = await query(
      `SELECT * FROM news_articles
       WHERE slug = $1 ${statusFilter}
       LIMIT 1`,
      [slug],
    );

    if (result.rows.length === 0) {
      return null;
    }

    const articleRow = result.rows[0];
    try {
      const sourceResult = await query(
        `SELECT id, source_type, source_name, source_url, publisher, country, language, accessed_at
         FROM article_sources
         WHERE article_id = $1
         ORDER BY created_at ASC`,
        [articleRow.id],
      );
      articleRow.article_sources = sourceResult.rows;
    } catch {
      articleRow.article_sources = [];
    }

    return mapDbRowToArticle(articleRow);
  } catch (error) {
    logger.error('[newsManager] getArticleBySlug (local DB) failed:', error);
    return null;
  }
}

export async function getArticlesByCategory(category: string): Promise<NewsArticle[]> {
  if (!useLocalDb) return [];

  try {
    return await fetchArticlesFromLocalDb({
      where: [`na.status = 'published'`, 'cat.slug = $1'],
      params: [category],
      limit: 60,
    });
  } catch (error) {
    logger.error('[newsManager] getArticlesByCategory (local DB) failed:', error);
    return [];
  }
}

export async function getFeaturedArticles(limit = 3): Promise<NewsArticle[]> {
  if (!useLocalDb) return [];

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

export async function getBreakingNews(): Promise<NewsArticle[]> {
  if (!useLocalDb) return [];

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

export async function getLatestArticles(limit = 10): Promise<NewsArticle[]> {
  if (!useLocalDb) return [];

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

export async function getRelatedArticles(
  currentSlug: string,
  category: string,
  tags: string[] = [],
  limit = 4
): Promise<NewsArticle[]> {
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
  if (!useLocalDb) return [];

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

export async function searchArticles(searchTerm: string): Promise<NewsArticle[]> {
  const q = searchTerm.trim();
  if (!q) return [];

  if (!useLocalDb) return [];

  try {
    const idsResult = await query(
      'select id from search_news_articles_ids($1, $2)',
      [q, 30],
    );
    const orderedIds = idsResult.rows
      .map((row: { id?: string }) => (typeof row.id === 'string' ? row.id : null))
      .filter((id): id is string => id !== null);

    if (orderedIds.length > 0) {
      const articles = await fetchArticlesFromLocalDb({
        where: [`na.status = 'published'`, 'na.id = any($1::uuid[])'],
        params: [orderedIds],
      });
      const byId = new Map(articles.map((article) => [article.id, article]));
      return orderedIds
        .map((id: string) => byId.get(id))
        .filter((article): article is NewsArticle => article !== undefined);
    }

    const safeQuery = `%${escapeLikePattern(q)}%`;
    return await fetchArticlesFromLocalDb({
      where: [`na.status = 'published'`, '(na.title ilike $1 or na.excerpt ilike $1 or na.slug ilike $1)'],
      params: [safeQuery],
      limit: 30,
    });
  } catch (error) {
    logger.error('[newsManager] searchArticles (local DB) failed:', error);
    return [];
  }
}

export async function getArticlesByAuthor(authorSlug: string, limit = 6): Promise<NewsArticle[]> {
  if (!useLocalDb) return [];

  try {
    const result = await query(
      `SELECT * FROM news_articles 
       WHERE status = 'published' 
       AND (author_id = $1 OR author_name ILIKE $2)
       ORDER BY published_at DESC NULLS LAST 
       LIMIT $3`,
      [authorSlug, `%${authorSlug.replace('-', '%')}%`, limit]
    );
    return result.rows.map(mapDbRowToArticle);
  } catch (error) {
    logger.error('[newsManager] getArticlesByAuthor (local DB) failed:', error);
    return [];
  }
}

// ==================== CRUD ADMIN ====================

export async function createArticle(
  articleData: Omit<NewsArticle, 'id' | 'publishedAt' | 'updatedAt'>,
  customPublishedAt?: string,
  status: 'draft' | 'scheduled' | 'published' = 'published'
): Promise<NewsArticle> {
  const publishedAt = customPublishedAt ?? new Date().toISOString();
  const authorProfile = await requireActiveAuthor(articleData.authorId);

  await withTransaction(async (client) => {
    const articleResult = await client.query<{ id: string }>(
      `insert into news_articles (
        title, title_en, seo_title, excerpt, excerpt_en, meta_description, content, content_en,
        slug, cover_image, author_id, author_name, status, editorial_status, faq_items,
        published_at, reading_time, is_featured, is_breaking, views, likes, shares, comments_count
      ) values (
        $1, $2, $3, $4, $5, $6, $7, $8,
        $9, $10, $11, $12, $13, $14, $15::jsonb,
        $16, $17, $18, $19, $20, $21, $22, $23
      )
      returning id`,
      [
        articleData.title,
        articleData.titleEn ?? null,
        articleData.seoTitle ?? null,
        articleData.excerpt,
        articleData.excerptEn ?? null,
        articleData.metaDescription ?? null,
        articleData.content,
        articleData.contentEn ?? null,
        articleData.slug,
        articleData.coverImage,
        authorProfile.slug,
        authorProfile.name,
        status,
        articleData.editorialStatus ?? status,
        JSON.stringify(articleData.faqItems ?? []),
        status === 'draft' ? null : publishedAt,
        articleData.readingTime,
        articleData.featured,
        articleData.breaking,
        articleData.views ?? 0,
        articleData.likes ?? 0,
        articleData.shares ?? 0,
        articleData.comments ?? 0,
      ],
    );

    const articleId = articleResult.rows[0]?.id;
    if (!articleId) throw new Error('Failed to create article');

    const categoryResult = await client.query<{ id: string }>(
      'select id from categories where slug = $1 limit 1',
      [articleData.category],
    );

    if (categoryResult.rows[0]?.id) {
      await client.query(
        `insert into news_article_categories (article_id, category_id)
         values ($1, $2)
         on conflict do nothing`,
        [articleId, categoryResult.rows[0].id],
      );
    }

    for (const tag of articleData.tags ?? []) {
      const tagResult = await client.query<{ id: string }>(
        `insert into tags (name, slug)
         values ($1, $2)
         on conflict (slug) do update set name = excluded.name
         returning id`,
        [tag, slugify(tag)],
      );

      if (tagResult.rows[0]?.id) {
        await client.query(
          `insert into news_article_tags (article_id, tag_id)
           values ($1, $2)
           on conflict do nothing`,
          [articleId, tagResult.rows[0].id],
        );
      }
    }

    for (const source of articleData.sources ?? []) {
      if (!source.sourceName.trim()) continue;
      await client.query(
        `insert into article_sources (
          article_id, source_type, source_name, source_url, publisher, country, language, accessed_at
        ) values ($1, $2, $3, $4, $5, $6, $7, $8)`,
        [
          articleId,
          source.sourceType || 'reference',
          source.sourceName.trim(),
          source.sourceUrl?.trim() || null,
          source.publisher?.trim() || null,
          source.country?.trim() || null,
          source.language?.trim() || null,
          source.accessedAt || null,
        ],
      );
    }
  });

  const article = await getArticleBySlug(articleData.slug, { includeDrafts: true });
  if (!article) throw new Error('Failed to load created article');
  return article;
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

  await withTransaction(async (client) => {
    const assignments: string[] = [];
    const values: unknown[] = [];
    let index = 1;

    const push = (column: string, value: unknown, cast?: string) => {
      assignments.push(`${column} = $${index}${cast ? `::${cast}` : ''}`);
      values.push(value);
      index += 1;
    };

    if (updates.title !== undefined) push('title', updates.title);
    if (updates.titleEn !== undefined) push('title_en', updates.titleEn);
    if (updates.seoTitle !== undefined) push('seo_title', updates.seoTitle);
    if (updates.excerpt !== undefined) push('excerpt', updates.excerpt);
    if (updates.excerptEn !== undefined) push('excerpt_en', updates.excerptEn);
    if (updates.metaDescription !== undefined) push('meta_description', updates.metaDescription);
    if (updates.content !== undefined) push('content', updates.content);
    if (updates.contentEn !== undefined) push('content_en', updates.contentEn);
    if (updates.slug !== undefined) push('slug', nextSlug);
    if (updates.coverImage !== undefined) push('cover_image', updates.coverImage);
    push('author_id', authorProfile.slug);
    push('author_name', authorProfile.name);
    if (updates.editorialStatus !== undefined) push('editorial_status', updates.editorialStatus);
    if (updates.faqItems !== undefined) push('faq_items', JSON.stringify(updates.faqItems), 'jsonb');
    if (updates.publishedAt !== undefined) push('published_at', updates.publishedAt);
    if (updates.readingTime !== undefined) push('reading_time', updates.readingTime);
    if (updates.featured !== undefined) push('is_featured', updates.featured);
    if (updates.breaking !== undefined) push('is_breaking', updates.breaking);
    if (updates.views !== undefined) push('views', updates.views);
    if (updates.likes !== undefined) push('likes', updates.likes);
    if (updates.shares !== undefined) push('shares', updates.shares);
    if (updates.comments !== undefined) push('comments_count', updates.comments);

    if (assignments.length > 0) {
      values.push(articleId);
      await client.query(
        `update news_articles
         set ${assignments.join(', ')}
         where id = $${index}`,
        values,
      );
    }

    if (nextSlug !== slug) {
      await client.query(
        `insert into news_slug_redirects (from_slug, to_slug, article_id)
         values ($1, $2, $3)
         on conflict (from_slug) do update
           set to_slug = excluded.to_slug,
               article_id = excluded.article_id`,
        [slug, nextSlug, articleId],
      );
    }

    if (updates.category) {
      await client.query('delete from news_article_categories where article_id = $1', [articleId]);
      const categoryResult = await client.query<{ id: string }>(
        'select id from categories where slug = $1 limit 1',
        [updates.category],
      );
      if (categoryResult.rows[0]?.id) {
        await client.query(
          `insert into news_article_categories (article_id, category_id)
           values ($1, $2)
           on conflict do nothing`,
          [articleId, categoryResult.rows[0].id],
        );
      }
    }

    if (updates.tags) {
      await client.query('delete from news_article_tags where article_id = $1', [articleId]);
      for (const tag of updates.tags) {
        const tagResult = await client.query<{ id: string }>(
          `insert into tags (name, slug)
           values ($1, $2)
           on conflict (slug) do update set name = excluded.name
           returning id`,
          [tag, slugify(tag)],
        );

        if (tagResult.rows[0]?.id) {
          await client.query(
            `insert into news_article_tags (article_id, tag_id)
             values ($1, $2)
             on conflict do nothing`,
            [articleId, tagResult.rows[0].id],
          );
        }
      }
    }

    if (updates.sources) {
      await client.query('delete from article_sources where article_id = $1', [articleId]);
      for (const source of updates.sources) {
        if (!source.sourceName.trim()) continue;
        await client.query(
          `insert into article_sources (
            article_id, source_type, source_name, source_url, publisher, country, language, accessed_at
          ) values ($1, $2, $3, $4, $5, $6, $7, $8)`,
          [
            articleId,
            source.sourceType || 'reference',
            source.sourceName.trim(),
            source.sourceUrl?.trim() || null,
            source.publisher?.trim() || null,
            source.country?.trim() || null,
            source.language?.trim() || null,
            source.accessedAt || null,
          ],
        );
      }
    }
  });

  return getArticleBySlug(nextSlug, { includeDrafts: true });
}

export async function getRedirectTargetSlug(fromSlug: string): Promise<string | null> {
  const slug = fromSlug.trim();
  if (!slug) return null;

  try {
    const data = await queryOne<{ to_slug: string | null }>(
      'select to_slug from news_slug_redirects where from_slug = $1 limit 1',
      [slug],
    );
    const toSlug = data?.to_slug ?? null;
    if (!toSlug || toSlug === slug) return null;
    return toSlug;
  } catch {
    return null;
  }
}

export async function deleteArticle(slug: string): Promise<boolean> {
  try {
    await query('delete from news_articles where slug = $1', [slug]);
    return true;
  } catch {
    return false;
  }
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
  const articles = await fetchArticlesFromLocalDb({
    where: [`na.status = 'scheduled'`],
    orderBy: 'na.published_at asc nulls last',
  });

  return articles.map((article) => {
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
  try {
    await query(
      `update news_articles
       set status = 'draft',
           published_at = null
       where id = $1`,
      [id],
    );
    return true;
  } catch {
    return false;
  }
}

export async function updateScheduledArticle(
  id: string,
  updates: { scheduledDate: string; scheduledTime: string }
): Promise<boolean> {
  const scheduledDateTime = new Date(`${updates.scheduledDate}T${updates.scheduledTime}`);
  try {
    await query(
      'update news_articles set published_at = $1 where id = $2',
      [scheduledDateTime.toISOString(), id],
    );
    return true;
  } catch {
    return false;
  }
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

  console.log('[checkAndPublishScheduled] No articles published (local PostgreSQL indisponivel)');
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
  const includeDrafts = options?.includeDrafts ?? false;

  const safePage = Math.max(1, page);
  const safePerPage = Math.min(Math.max(1, perPage), 100);
  const offset = (safePage - 1) * safePerPage;

  if (useLocalDb) {
    try {
      const where: string[] = [];
      const params: unknown[] = [];
      let index = 1;
      const push = (condition: string, value?: unknown) => {
        if (value === undefined) {
          where.push(condition);
          return;
        }

        where.push(`${condition} $${index}`);
        params.push(value);
        index += 1;
      };

      if (!includeDrafts) push(`na.status = 'published'`);
      if (filters.search?.trim()) {
        const like = `%${filters.search.trim()}%`;
        where.push(`(na.title ilike $${index} or na.excerpt ilike $${index + 1} or na.slug ilike $${index + 2})`);
        params.push(like, like, like);
        index += 3;
      }
      if (filters.category && filters.category !== 'all') push('cat.slug =', filters.category);
      if (filters.author) push('na.author_id =', filters.author);
      if (filters.dateFrom) push('na.published_at >=', filters.dateFrom);
      if (filters.dateTo) push('na.published_at <=', filters.dateTo);

      if (filters.status && filters.status !== 'all') {
        switch (filters.status) {
          case 'breaking':
            push(`na.status = 'published'`);
            push('na.is_breaking = true');
            break;
          case 'featured':
            push(`na.status = 'published'`);
            push('na.is_featured = true');
            break;
          case 'published':
            push(`na.status = 'published'`);
            break;
          case 'scheduled':
            push(`na.status = 'scheduled'`);
            break;
          case 'draft':
            push(`na.status = 'draft'`);
            break;
        }
      }

      const sortBy = filters.sortBy || 'date';
      const sortOrder = filters.sortOrder === 'asc' ? 'asc' : 'desc';
      const orderBy = sortBy === 'views'
        ? `na.views ${sortOrder}`
        : sortBy === 'likes'
          ? `na.likes ${sortOrder}`
          : `na.published_at ${sortOrder} nulls last`;

      const [items, total] = await Promise.all([
        fetchArticlesFromLocalDb({ where, params, orderBy, limit: safePerPage, offset }),
        countArticlesFromLocalDb(where, params),
      ]);

      return {
        items,
        total,
        page: safePage,
        perPage: safePerPage,
        totalPages: Math.ceil(total / safePerPage),
      };
    } catch (error) {
      logger.error('[newsManager] getArticlesPaginated (local DB) failed:', error);
    }
  }

  return { items: [], total: 0, page: safePage, perPage: safePerPage, totalPages: 0 };
}

// ==================== SLUG GENERATOR ====================

export function generateSlug(title: string): string {
  return slugify(title);
}

export async function isSlugAvailable(slug: string, excludeSlug?: string): Promise<boolean> {
  try {
    const data = await queryOne<{ slug: string }>(
      'select slug from news_articles where slug = $1 limit 1',
      [slug],
    );
    if (!data) return true;
    return data.slug === excludeSlug;
  } catch {
    return false;
  }
}

export async function resetToDefault(): Promise<void> {
  await query('delete from news_articles where id is not null');
}

export async function assignAllArticlesToAuthor(
  authorId: string,
): Promise<number> {
  const authorProfile = await requireActiveAuthor(authorId);
  const result = await query(
    `update news_articles
     set author_id = $1,
         author_name = $2
     where true`,
    [authorProfile.slug, authorProfile.name],
  );
  return result.rowCount ?? 0;
}

// Re-exporta tipos para facilitar imports
export type { NewsArticle } from '@/types';

