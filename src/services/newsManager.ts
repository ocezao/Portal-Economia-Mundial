import { query, queryOne, queryRows, type DbClient, withTransaction } from '@/lib/db';
import { toWebpUrl } from '@/lib/image';
import { escapeLikePattern } from '@/lib/security';
import type { NewsArticle } from '@/types';

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

type ArticleDbRow = {
  id: string;
  slug: string;
  title: string;
  title_en: string | null;
  excerpt: string | null;
  excerpt_en: string | null;
  content: string | null;
  content_en: string | null;
  cover_image: string | null;
  author_id: string | null;
  author_name: string | null;
  status: string | null;
  published_at: string | null;
  created_at: string | null;
  updated_at: string | null;
  reading_time: number | null;
  is_featured: boolean | null;
  is_breaking: boolean | null;
  views: number | null;
  likes: number | null;
  shares: number | null;
  comments_count: number | null;
  category: string | null;
  tags: string[] | null;
};

type AuthorProfileRow = {
  slug: string;
  name: string;
  is_active: boolean | null;
};

function isPublicReadFailure(error: unknown): boolean {
  if (error instanceof AggregateError) {
    return error.errors.some((nested) => isPublicReadFailure(nested));
  }

  if (!(error instanceof Error)) return false;

  const errorWithCode = error as Error & { code?: string; cause?: unknown };
  if (errorWithCode.code === 'ECONNREFUSED' || errorWithCode.code === 'ECONNRESET' || errorWithCode.code === 'ENOTFOUND') {
    return true;
  }

  if (errorWithCode.cause && isPublicReadFailure(errorWithCode.cause)) {
    return true;
  }

  return (
    error.message.includes('Database pool not available')
    || error.message.includes('connect ECONNREFUSED')
    || error.message.includes('getaddrinfo ENOTFOUND')
    || error.message.includes('ECONNRESET')
  );
}

async function withPublicReadFallback<T>(fallback: T, action: () => Promise<T>): Promise<T> {
  try {
    return await action();
  } catch (error) {
    if (isPublicReadFailure(error)) {
      return fallback;
    }

    throw error;
  }
}

const ARTICLE_SELECT = `
  select
    na.id,
    na.slug,
    na.title,
    na.title_en,
    na.excerpt,
    na.excerpt_en,
    na.content,
    na.content_en,
    na.cover_image,
    na.author_id,
    na.author_name,
    na.status,
    na.published_at,
    na.created_at,
    na.updated_at,
    na.reading_time,
    na.is_featured,
    na.is_breaking,
    na.views,
    na.likes,
    na.shares,
    na.comments_count,
    cat.slug as category,
    coalesce(tags.tags, array[]::text[]) as tags
  from public.news_articles na
  left join lateral (
    select c.slug
    from public.news_article_categories nac
    inner join public.categories c on c.id = nac.category_id
    where nac.article_id = na.id
    order by c.priority asc, c.name asc
    limit 1
  ) cat on true
  left join lateral (
    select array_agg(t.name order by t.name) as tags
    from public.news_article_tags nat
    inner join public.tags t on t.id = nat.tag_id
    where nat.article_id = na.id
  ) tags on true
`;

function mapDbRowToArticle(row: ArticleDbRow): NewsArticle {
  return {
    id: row.id,
    slug: row.slug,
    title: row.title,
    titleEn: row.title_en ?? undefined,
    excerpt: row.excerpt ?? '',
    excerptEn: row.excerpt_en ?? undefined,
    content: row.content ?? '',
    contentEn: row.content_en ?? undefined,
    coverImage: row.cover_image ? toWebpUrl(row.cover_image) : '/images/news/default.webp',
    authorId: row.author_id ?? 'unknown',
    author: row.author_name ?? 'Desconhecido',
    category: (row.category ?? 'economia') as NewsArticle['category'],
    tags: row.tags ?? [],
    publishedAt: row.published_at ?? row.created_at ?? new Date().toISOString(),
    updatedAt: row.updated_at ?? row.created_at ?? new Date().toISOString(),
    readingTime: row.reading_time ?? 4,
    featured: Boolean(row.is_featured),
    breaking: Boolean(row.is_breaking),
    views: row.views ?? 0,
    likes: row.likes ?? 0,
    shares: row.shares ?? 0,
    comments: row.comments_count ?? 0,
  };
}

function slugify(value: string): string {
  return value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^\w\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .slice(0, 60);
}

async function fetchArticles(
  whereSql = '',
  params: unknown[] = [],
  options?: { orderBy?: string; limit?: number; offset?: number },
): Promise<NewsArticle[]> {
  const values = [...params];
  let sql = ARTICLE_SELECT;
  if (whereSql) sql += ` where ${whereSql}`;
  sql += ` order by ${options?.orderBy ?? 'na.published_at desc nulls last'}`;
  if (typeof options?.limit === 'number') {
    values.push(options.limit);
    sql += ` limit $${values.length}`;
  }
  if (typeof options?.offset === 'number') {
    values.push(options.offset);
    sql += ` offset $${values.length}`;
  }

  const rows = await queryRows<ArticleDbRow>(sql, values);
  return rows.map(mapDbRowToArticle);
}

async function fetchArticleBySlug(slug: string, includeDrafts = false): Promise<NewsArticle | null> {
  const where = includeDrafts ? 'na.slug = $1' : `na.slug = $1 and na.status = 'published'`;
  const rows = await fetchArticles(where, [slug], { limit: 1 });
  return rows[0] ?? null;
}

async function fetchArticleById(id: string): Promise<NewsArticle | null> {
  const rows = await fetchArticles('na.id = $1', [id], { limit: 1 });
  return rows[0] ?? null;
}

async function getArticleMetaBySlug(slug: string) {
  return queryOne<{ id: string; author_id: string | null }>(
    `select id, author_id
     from public.news_articles
     where slug = $1
     limit 1`,
    [slug],
  );
}

async function requireActiveAuthor(authorId: string): Promise<AuthorProfileRow> {
  const slug = authorId.trim();
  if (!slug) {
    throw new Error('Autor profissional obrigatorio');
  }

  const row = await queryOne<AuthorProfileRow>(
    `select slug, name, is_active
     from public.authors
     where slug = $1
     limit 1`,
    [slug],
  );

  if (!row || row.is_active === false || !row.slug || !row.name) {
    throw new Error('Autor profissional invalido');
  }

  return row;
}

async function syncCategory(client: DbClient, articleId: string, categorySlug?: string) {
  if (!categorySlug) return;

  await client.query('delete from public.news_article_categories where article_id = $1', [articleId]);

  const category = await client.query<{ id: string }>(
    `select id
     from public.categories
     where slug = $1
     limit 1`,
    [categorySlug],
  );

  if (category.rows[0]?.id) {
    await client.query(
      `insert into public.news_article_categories (article_id, category_id)
       values ($1, $2)
       on conflict do nothing`,
      [articleId, category.rows[0].id],
    );
  }
}

async function syncTags(client: DbClient, articleId: string, tags?: string[]) {
  if (!tags) return;

  await client.query('delete from public.news_article_tags where article_id = $1', [articleId]);

  for (const tag of tags) {
    const trimmed = tag.trim();
    if (!trimmed) continue;

    const tagRow = await client.query<{ id: string }>(
      `insert into public.tags (name, slug)
       values ($1, $2)
       on conflict (slug) do update set name = excluded.name
       returning id`,
      [trimmed, slugify(trimmed)],
    );

    if (tagRow.rows[0]?.id) {
      await client.query(
        `insert into public.news_article_tags (article_id, tag_id)
         values ($1, $2)
         on conflict do nothing`,
        [articleId, tagRow.rows[0].id],
      );
    }
  }
}

export async function getAllArticles(options?: { includeDrafts?: boolean }): Promise<NewsArticle[]> {
  const includeDrafts = options?.includeDrafts ?? false;
  const where = includeDrafts ? '' : `na.status = 'published'`;
  return withPublicReadFallback([], () => fetchArticles(where));
}

export async function getArticleBySlug(
  slug: string,
  options?: { includeDrafts?: boolean },
): Promise<NewsArticle | null> {
  return withPublicReadFallback(null, () => fetchArticleBySlug(slug, options?.includeDrafts ?? false));
}

export async function getArticlesByCategory(category: string): Promise<NewsArticle[]> {
  return withPublicReadFallback([], () => fetchArticles(`na.status = 'published' and cat.slug = $1`, [category], { limit: 60 }));
}

export async function getFeaturedArticles(limit = 3): Promise<NewsArticle[]> {
  return withPublicReadFallback([], () => fetchArticles(`na.status = 'published' and na.is_featured = true`, [], { limit }));
}

export async function getBreakingNews(): Promise<NewsArticle[]> {
  return withPublicReadFallback([], () => fetchArticles(`na.status = 'published' and na.is_breaking = true`));
}

export async function getLatestArticles(limit = 10): Promise<NewsArticle[]> {
  return withPublicReadFallback([], () => fetchArticles(`na.status = 'published'`, [], { limit }));
}

export async function getRelatedArticles(
  currentSlug: string,
  category: string,
  tags: string[] = [],
  limit = 4,
): Promise<NewsArticle[]> {
  const items = await fetchArticles(
    `na.status = 'published' and na.slug <> $1 and cat.slug = $2`,
    [currentSlug, category],
    { limit: 20 },
  );

  const tagSet = new Set(tags.map((tag) => tag.toLowerCase().trim()).filter(Boolean));

  return items
    .map((article) => ({
      article,
      score: (article.tags ?? []).reduce((count, tag) => {
        return tagSet.has(tag.toLowerCase().trim()) ? count + 1 : count;
      }, 0),
    }))
    .sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score;
      return new Date(b.article.publishedAt).getTime() - new Date(a.article.publishedAt).getTime();
    })
    .slice(0, limit)
    .map((item) => item.article);
}

export async function getTrendingArticles(limit = 5): Promise<NewsArticle[]> {
  return withPublicReadFallback([], () => fetchArticles(`na.status = 'published'`, [], { limit, orderBy: 'na.views desc, na.published_at desc nulls last' }));
}

export async function searchArticles(searchQuery: string): Promise<NewsArticle[]> {
  const q = searchQuery.trim();
  if (!q) return [];

  const like = `%${escapeLikePattern(q)}%`;
  return withPublicReadFallback([], () => fetchArticles(
    `na.status = 'published'
     and (
       na.search_vector @@ plainto_tsquery('portuguese', $1)
       or na.title ilike $2
       or na.excerpt ilike $2
       or na.slug ilike $2
     )`,
    [q, like],
    { limit: 30 },
  ));
}

export async function getArticlesByAuthor(authorSlug: string, limit = 6): Promise<NewsArticle[]> {
  return withPublicReadFallback([], () => fetchArticles(
    `na.status = 'published'
     and (
       na.author_id = $1
       or na.author_name ilike $2
     )`,
    [authorSlug, `%${authorSlug.replace(/-/g, '%')}%`],
    { limit },
  ));
}

export async function createArticle(
  articleData: Omit<NewsArticle, 'id' | 'publishedAt' | 'updatedAt'>,
  customPublishedAt?: string,
  status: 'draft' | 'scheduled' | 'published' = 'published',
): Promise<NewsArticle> {
  const publishedAt = customPublishedAt ?? new Date().toISOString();
  const authorProfile = await requireActiveAuthor(articleData.authorId);

  const articleId = await withTransaction(async (client) => {
    const inserted = await client.query<{ id: string }>(
      `insert into public.news_articles (
        title, title_en, excerpt, excerpt_en, content, content_en, slug, cover_image,
        author_id, author_name, status, published_at, reading_time,
        is_featured, is_breaking, views, likes, shares, comments_count
      ) values (
        $1, $2, $3, $4, $5, $6, $7, $8,
        $9, $10, $11, $12, $13,
        $14, $15, $16, $17, $18, $19
      )
      returning id`,
      [
        articleData.title,
        articleData.titleEn ?? null,
        articleData.excerpt,
        articleData.excerptEn ?? null,
        articleData.content,
        articleData.contentEn ?? null,
        articleData.slug,
        articleData.coverImage,
        authorProfile.slug,
        authorProfile.name,
        status,
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

    const id = inserted.rows[0]?.id;
    if (!id) throw new Error('Falha ao criar artigo');

    await syncCategory(client, id, articleData.category);
    await syncTags(client, id, articleData.tags);
    return id;
  });

  const article = await fetchArticleById(articleId);
  if (!article) throw new Error('Falha ao carregar artigo criado');
  return article;
}

export async function updateArticle(
  slug: string,
  updates: Partial<NewsArticle>,
): Promise<NewsArticle | null> {
  const articleMeta = await getArticleMetaBySlug(slug);
  if (!articleMeta) return null;

  const nextAuthorId = (updates.authorId ?? articleMeta.author_id ?? '').trim();
  const authorProfile = await requireActiveAuthor(nextAuthorId);
  const nextSlug = updates.slug ?? slug;

  await withTransaction(async (client) => {
    const fields: string[] = [];
    const values: unknown[] = [];
    let index = 1;

    const push = (sql: string, value: unknown) => {
      fields.push(`${sql} = $${index}`);
      values.push(value);
      index += 1;
    };

    if (updates.title !== undefined) push('title', updates.title);
    if (updates.titleEn !== undefined) push('title_en', updates.titleEn ?? null);
    if (updates.excerpt !== undefined) push('excerpt', updates.excerpt);
    if (updates.excerptEn !== undefined) push('excerpt_en', updates.excerptEn ?? null);
    if (updates.content !== undefined) push('content', updates.content);
    if (updates.contentEn !== undefined) push('content_en', updates.contentEn ?? null);
    if (updates.slug !== undefined) push('slug', updates.slug);
    if (updates.coverImage !== undefined) push('cover_image', updates.coverImage);
    if (updates.publishedAt !== undefined) push('published_at', updates.publishedAt);
    if (updates.readingTime !== undefined) push('reading_time', updates.readingTime);
    if (updates.featured !== undefined) push('is_featured', updates.featured);
    if (updates.breaking !== undefined) push('is_breaking', updates.breaking);
    if (updates.views !== undefined) push('views', updates.views);
    if (updates.likes !== undefined) push('likes', updates.likes);
    if (updates.shares !== undefined) push('shares', updates.shares);
    if (updates.comments !== undefined) push('comments_count', updates.comments);

    push('author_id', authorProfile.slug);
    push('author_name', authorProfile.name);
    fields.push('updated_at = now()');

    values.push(articleMeta.id);
    await client.query(
      `update public.news_articles
       set ${fields.join(', ')}
       where id = $${values.length}`,
      values,
    );

    if (updates.category !== undefined) {
      await syncCategory(client, articleMeta.id, updates.category);
    }

    if (updates.tags !== undefined) {
      await syncTags(client, articleMeta.id, updates.tags);
    }

    if (nextSlug !== slug) {
      await client.query(
        `insert into public.news_slug_redirects (from_slug, to_slug, article_id)
         values ($1, $2, $3)
         on conflict (from_slug) do update set
           to_slug = excluded.to_slug,
           article_id = excluded.article_id`,
        [slug, nextSlug, articleMeta.id],
      );
    }
  });

  return fetchArticleBySlug(nextSlug, true);
}

export async function getRedirectTargetSlug(fromSlug: string): Promise<string | null> {
  const row = await queryOne<{ to_slug: string }>(
    `select to_slug
     from public.news_slug_redirects
     where from_slug = $1
     limit 1`,
    [fromSlug.trim()],
  );

  return row?.to_slug ?? null;
}

export async function deleteArticle(slug: string): Promise<boolean> {
  const result = await query('delete from public.news_articles where slug = $1', [slug]);
  return (result.rowCount ?? 0) > 0;
}

export async function duplicateArticle(slug: string): Promise<NewsArticle | null> {
  const article = await getArticleBySlug(slug, { includeDrafts: true });
  if (!article) return null;

  const newSlug = `${article.slug}-copia-${Date.now()}`;
  const newTitle = `${article.title} (Copia)`;

  return createArticle({
    ...article,
    slug: newSlug,
    title: newTitle,
    featured: false,
    breaking: false,
  });
}

export async function scheduleArticle(
  articleData: Omit<NewsArticle, 'id' | 'publishedAt' | 'updatedAt'>,
  scheduledDate: string,
  scheduledTime: string,
  timezone = 'America/Sao_Paulo',
): Promise<ScheduledArticle> {
  const scheduledDateTime = new Date(`${scheduledDate}T${scheduledTime}`);
  const created = await createArticle(articleData, scheduledDateTime.toISOString(), 'scheduled');

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
  const articles = await fetchArticles(`na.status = 'scheduled'`, [], {
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
  const result = await query(
    `update public.news_articles
     set status = 'draft',
         published_at = null,
         updated_at = now()
     where id = $1`,
    [id],
  );

  return (result.rowCount ?? 0) > 0;
}

export async function updateScheduledArticle(
  id: string,
  updates: { scheduledDate: string; scheduledTime: string },
): Promise<boolean> {
  const scheduledDateTime = new Date(`${updates.scheduledDate}T${updates.scheduledTime}`);
  const result = await query(
    `update public.news_articles
     set published_at = $2,
         updated_at = now()
     where id = $1`,
    [id, scheduledDateTime.toISOString()],
  );

  return (result.rowCount ?? 0) > 0;
}

export async function checkAndPublishScheduled(): Promise<number> {
  const now = new Date().toISOString();
  const result = await query(
    `update public.news_articles
     set status = 'published',
         updated_at = now()
     where id in (
       select id
       from public.news_articles
       where status = 'scheduled'
         and published_at <= $1
       limit 50
     )
     returning id`,
    [now],
  );

  return result.rowCount ?? 0;
}

export async function getArticleStats() {
  const [totalRow, publishedRow, breakingRow, featuredRow, scheduledRow, sums] = await Promise.all([
    queryOne<{ total: string }>('select count(*)::text as total from public.news_articles'),
    queryOne<{ total: string }>(`select count(*)::text as total from public.news_articles where status = 'published'`),
    queryOne<{ total: string }>(`select count(*)::text as total from public.news_articles where is_breaking = true`),
    queryOne<{ total: string }>(`select count(*)::text as total from public.news_articles where is_featured = true`),
    queryOne<{ total: string }>(`select count(*)::text as total from public.news_articles where status = 'scheduled'`),
    queryOne<{
      total_views: string | null;
      total_likes: string | null;
      economia: string;
      geopolitica: string;
      tecnologia: string;
    }>(
      `select
         coalesce(sum(views), 0)::text as total_views,
         coalesce(sum(likes), 0)::text as total_likes,
         count(*) filter (where exists (
           select 1
           from public.news_article_categories nac
           inner join public.categories c on c.id = nac.category_id
           where nac.article_id = news_articles.id and c.slug = 'economia'
         ))::text as economia,
         count(*) filter (where exists (
           select 1
           from public.news_article_categories nac
           inner join public.categories c on c.id = nac.category_id
           where nac.article_id = news_articles.id and c.slug = 'geopolitica'
         ))::text as geopolitica,
         count(*) filter (where exists (
           select 1
           from public.news_article_categories nac
           inner join public.categories c on c.id = nac.category_id
           where nac.article_id = news_articles.id and c.slug = 'tecnologia'
         ))::text as tecnologia
       from public.news_articles`,
    ),
  ]);

  return {
    total: Number.parseInt(totalRow?.total ?? '0', 10),
    published: Number.parseInt(publishedRow?.total ?? '0', 10),
    breaking: Number.parseInt(breakingRow?.total ?? '0', 10),
    featured: Number.parseInt(featuredRow?.total ?? '0', 10),
    scheduled: Number.parseInt(scheduledRow?.total ?? '0', 10),
    totalViews: Number.parseInt(sums?.total_views ?? '0', 10),
    totalLikes: Number.parseInt(sums?.total_likes ?? '0', 10),
    byCategory: {
      economia: Number.parseInt(sums?.economia ?? '0', 10),
      geopolitica: Number.parseInt(sums?.geopolitica ?? '0', 10),
      tecnologia: Number.parseInt(sums?.tecnologia ?? '0', 10),
    },
  };
}

export async function filterArticles(filters: ArticleFilters): Promise<NewsArticle[]> {
  const result = await getArticlesPaginated(filters, 1, 200, { includeDrafts: true });
  return result.items;
}

export async function getArticlesPaginated(
  filters: ArticleFilters,
  page = 1,
  perPage = 10,
  options?: { includeDrafts?: boolean },
): Promise<PaginatedResult<NewsArticle>> {
  return withPublicReadFallback(
    {
      items: [],
      total: 0,
      page: Math.max(1, page),
      perPage: Math.min(Math.max(1, perPage), 100),
      totalPages: 0,
    },
    async () => {
  const includeDrafts = options?.includeDrafts ?? false;
  const safePage = Math.max(1, page);
  const safePerPage = Math.min(Math.max(1, perPage), 100);

  const where: string[] = [];
  const values: unknown[] = [];
  let index = 1;

  const push = (condition: string, value: unknown) => {
    where.push(condition.replace('?', `$${index}`));
    values.push(value);
    index += 1;
  };

  if (!includeDrafts) where.push(`na.status = 'published'`);

  if (filters.search?.trim()) {
    const q = filters.search.trim();
    const like = `%${escapeLikePattern(q)}%`;
    where.push(`(
      na.search_vector @@ plainto_tsquery('portuguese', $${index})
      or na.title ilike $${index + 1}
      or na.excerpt ilike $${index + 1}
      or na.slug ilike $${index + 1}
    )`);
    values.push(q, like);
    index += 2;
  }

  if (filters.category && filters.category !== 'all') push('cat.slug = ?', filters.category);
  if (filters.author) push('na.author_id = ?', filters.author);
  if (filters.dateFrom) push('na.published_at >= ?', filters.dateFrom);
  if (filters.dateTo) push('na.published_at <= ?', filters.dateTo);

  if (filters.status && filters.status !== 'all') {
    switch (filters.status) {
      case 'breaking':
        where.push(`na.status = 'published' and na.is_breaking = true`);
        break;
      case 'featured':
        where.push(`na.status = 'published' and na.is_featured = true`);
        break;
      case 'published':
        where.push(`na.status = 'published'`);
        break;
      case 'scheduled':
        where.push(`na.status = 'scheduled'`);
        break;
      case 'draft':
        where.push(`na.status = 'draft'`);
        break;
    }
  }

  const whereSql = where.length > 0 ? ` where ${where.join(' and ')}` : '';
  const countRow = await queryOne<{ total: string }>(
    `select count(*)::text as total
     from (${ARTICLE_SELECT}${whereSql}) counted`,
    values,
  );

  const sortBy = filters.sortBy || 'date';
  const sortOrder = filters.sortOrder || 'desc';
  const ascending = sortOrder === 'asc' ? 'asc' : 'desc';
  const orderBy =
    sortBy === 'views'
      ? `na.views ${ascending}, na.published_at desc nulls last`
      : sortBy === 'likes'
        ? `na.likes ${ascending}, na.published_at desc nulls last`
        : `na.published_at ${ascending} nulls last`;

  const items = await fetchArticles(where.join(' and '), values, {
    orderBy,
    limit: safePerPage,
    offset: (safePage - 1) * safePerPage,
  });

  const total = Number.parseInt(countRow?.total ?? '0', 10) || 0;
  return {
    items,
    total,
    page: safePage,
    perPage: safePerPage,
    totalPages: Math.ceil(total / safePerPage),
  };
    },
  );
}

export function generateSlug(title: string): string {
  return slugify(title);
}

export async function isSlugAvailable(slug: string, excludeSlug?: string): Promise<boolean> {
  const row = await queryOne<{ slug: string }>(
    `select slug
     from public.news_articles
     where slug = $1
     limit 1`,
    [slug],
  );

  if (!row) return true;
  return row.slug === excludeSlug;
}

export async function resetToDefault(): Promise<void> {
  await query(`delete from public.news_articles where id is not null`);
}

export async function assignAllArticlesToAuthor(authorId: string): Promise<number> {
  const authorProfile = await requireActiveAuthor(authorId);
  const result = await query(
    `update public.news_articles
     set author_id = $1,
         author_name = $2,
         updated_at = now()
     returning id`,
    [authorProfile.slug, authorProfile.name],
  );

  return result.rowCount ?? 0;
}

export type { NewsArticle } from '@/types';
