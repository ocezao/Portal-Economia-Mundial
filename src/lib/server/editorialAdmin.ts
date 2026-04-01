import { query, queryOne, queryRows, type DbClient, withTransaction } from '@/lib/db';
import { enrichEditorialArticle } from '@/services/editorialEnrichment';
import { slugifyText } from '@/lib/server/adminApi';

export interface EditorialFaqInput {
  question: string;
  answer: string;
}

export interface EditorialSourceInput {
  sourceType?: string;
  sourceName: string;
  sourceUrl?: string;
  publisher?: string;
  country?: string;
  language?: string;
  accessedAt?: string;
}

export interface EditorialPayload {
  title?: string;
  slug?: string;
  seoTitle?: string;
  excerpt?: string;
  metaDescription?: string;
  content?: string;
  category?: string;
  authorId?: string;
  author?: string;
  tags?: string[];
  coverImage?: string;
  featured?: boolean;
  breaking?: boolean;
  readingTime?: number;
  views?: number;
  likes?: number;
  shares?: number;
  comments?: number;
  faqItems?: EditorialFaqInput[];
  editorialStatus?: string;
  sources?: EditorialSourceInput[];
  status?: 'draft' | 'scheduled' | 'published';
  publishedAt?: string | null;
}

type LookupMode = 'id' | 'slug';

interface EditorialArticleRecord {
  id: string;
  slug: string;
  title: string;
  seo_title: string | null;
  excerpt: string;
  meta_description: string | null;
  content: string;
  author_id: string;
  author_name: string;
  status: string;
  editorial_status: string;
  faq_items: EditorialFaqInput[] | null;
  published_at: string | null;
  created_at: string;
  updated_at: string;
  reading_time: number;
  is_featured: boolean;
  is_breaking: boolean;
  cover_image: string | null;
}

interface ArticleSourceRecord {
  id: string;
  source_type: string;
  source_name: string;
  source_url: string | null;
  publisher: string | null;
  country: string | null;
  language: string | null;
  accessed_at: string | null;
}

export interface EditorialValidationIssue {
  code: string;
  severity: 'error' | 'warning';
  message: string;
  field?: string;
}

export interface EditorialValidationResult {
  articleId: string;
  slug: string;
  status: string;
  editorialStatus: string;
  readyToPublish: boolean;
  issues: EditorialValidationIssue[];
  checks: {
    hasTitle: boolean;
    hasExcerpt: boolean;
    hasContent: boolean;
    hasCategory: boolean;
    hasAuthor: boolean;
    hasCoverImage: boolean;
    hasSeoTitle: boolean;
    hasMetaDescription: boolean;
    hasFaqItems: boolean;
    hasSources: boolean;
    scheduledWithDate: boolean;
    hasApprovedStatus: boolean;
  };
}

interface EditorialValidationOptions {
  requireApproval?: boolean;
}

export interface EditorialJobRecord {
  id: string;
  article_id: string | null;
  job_type: string;
  status: string;
  idempotency_key: string;
  priority: number | null;
  payload: unknown;
  result: unknown;
  attempts: number | null;
  run_after: string | null;
  locked_at: string | null;
  locked_by: string | null;
  last_error: string | null;
  created_at: string;
  updated_at: string;
}

function normalizeFaqItems(value?: EditorialFaqInput[]) {
  return (value ?? [])
    .map((item) => ({
      question: item.question.trim(),
      answer: item.answer.trim(),
    }))
    .filter((item) => item.question && item.answer);
}

function normalizeSources(value?: EditorialSourceInput[]) {
  return (value ?? [])
    .map((item) => ({
      sourceType: item.sourceType || 'reference',
      sourceName: item.sourceName.trim(),
      sourceUrl: item.sourceUrl?.trim() || null,
      publisher: item.publisher?.trim() || null,
      country: item.country?.trim() || null,
      language: item.language?.trim() || null,
      accessedAt: item.accessedAt || null,
    }))
    .filter((item) => item.sourceName);
}

async function syncCategory(client: DbClient, articleId: string, categorySlug?: string) {
  if (!categorySlug) return;

  await client.query('delete from news_article_categories where article_id = $1', [articleId]);

  const category = await client.query<{ id: string }>(
    'select id from categories where slug = $1 limit 1',
    [categorySlug],
  );

  if (category.rows[0]?.id) {
    await client.query(
      `insert into news_article_categories (article_id, category_id)
       values ($1, $2)
       on conflict do nothing`,
      [articleId, category.rows[0].id],
    );
  }
}

async function syncTags(client: DbClient, articleId: string, tags?: string[]) {
  if (tags === undefined) return;

  await client.query('delete from news_article_tags where article_id = $1', [articleId]);

  for (const tag of tags) {
    const trimmedTag = tag.trim();
    if (!trimmedTag) continue;

    const tagRow = await client.query<{ id: string }>(
      `insert into tags (name, slug)
       values ($1, $2)
       on conflict (slug) do update set name = excluded.name
       returning id`,
      [trimmedTag, slugifyText(trimmedTag)],
    );

    if (tagRow.rows[0]?.id) {
      await client.query(
        `insert into news_article_tags (article_id, tag_id)
         values ($1, $2)
         on conflict do nothing`,
        [articleId, tagRow.rows[0].id],
      );
    }
  }
}

export async function syncArticleSources(
  _admin: unknown,
  articleId: string,
  sources?: EditorialSourceInput[],
) {
  await withTransaction(async (client) => {
    await replaceArticleSources(client, articleId, sources);
  });
}

async function replaceArticleSources(client: DbClient, articleId: string, sources?: EditorialSourceInput[]) {
  await client.query('delete from article_sources where article_id = $1', [articleId]);

  const validSources = normalizeSources(sources);
  if (validSources.length === 0) return;

  for (const source of validSources) {
    await client.query(
      `insert into article_sources (
        article_id, source_type, source_name, source_url, publisher, country, language, accessed_at
      ) values ($1, $2, $3, $4, $5, $6, $7, $8)`,
      [
        articleId,
        source.sourceType,
        source.sourceName,
        source.sourceUrl,
        source.publisher,
        source.country,
        source.language,
        source.accessedAt,
      ],
    );
  }
}

export async function upsertPublishArticleJob(
  _admin: unknown,
  articleId: string,
  runAfter: string | null | undefined,
) {
  if (!runAfter) return;

  await query(
    `insert into article_jobs (
      article_id, job_type, status, idempotency_key, run_after, payload, last_error, updated_at
    ) values (
      $1, 'publish_article', 'queued', $2, $3, $4::jsonb, null, now()
    )
    on conflict (idempotency_key) do update
      set status = excluded.status,
          run_after = excluded.run_after,
          payload = excluded.payload,
          last_error = null,
          updated_at = now()`,
    [articleId, `publish_article:${articleId}`, runAfter, JSON.stringify({ articleId })],
  );
}

async function resolveArticle(identifier: string, lookup: LookupMode) {
  const filterColumn = lookup === 'id' ? 'id' : 'slug';
  const data = await queryOne<{ id: string; slug: string; status: string | null; published_at: string | null }>(
    `select id, slug, status, published_at
     from news_articles
     where ${filterColumn} = $1
     limit 1`,
    [identifier],
  );

  if (!data?.id) {
    throw new Error('Artigo nao encontrado');
  }

  return data;
}

export async function createEditorialArticle(_admin: unknown, payload: EditorialPayload) {
  const {
    title,
    slug,
    seoTitle,
    excerpt,
    metaDescription,
    content,
    category,
    authorId,
    author,
    tags = [],
    coverImage,
    featured = false,
    breaking = false,
    readingTime = 1,
    views = 0,
    likes = 0,
    shares = 0,
    comments = 0,
    faqItems = [],
    editorialStatus,
    sources = [],
    status = 'draft',
    publishedAt,
  } = payload;

  if (!title) throw new Error('Titulo e obrigatorio');
  if (!slug) throw new Error('Slug e obrigatorio');
  if (!excerpt) throw new Error('Resumo e obrigatorio');
  if (!content) throw new Error('Conteudo e obrigatorio');
  if (!category) throw new Error('Categoria e obrigatoria');
  if (!authorId) throw new Error('Autor e obrigatorio');
  if (!coverImage) throw new Error('Imagem de capa e obrigatoria');
  if (status !== 'draft') throw new Error('Fluxo editorial exige criacao inicial como draft');

  const nextPublishedAt = publishedAt ?? (status === 'draft' ? null : new Date().toISOString());
  const nextEditorialStatus = editorialStatus ?? (status === 'scheduled' ? 'scheduled' : status);

  return withTransaction(async (client) => {
    const inserted = await client.query<{
      id: string;
      slug: string;
      status: string;
      editorial_status: string;
      published_at: string | null;
    }>(
      `insert into news_articles (
        title, slug, seo_title, excerpt, meta_description, content, cover_image, author_id, author_name,
        status, editorial_status, faq_items, published_at, reading_time, is_featured, is_breaking,
        views, likes, shares, comments_count
      ) values (
        $1, $2, $3, $4, $5, $6, $7, $8, $9,
        $10, $11, $12::jsonb, $13, $14, $15, $16,
        $17, $18, $19, $20
      )
      returning id, slug, status, editorial_status, published_at`,
      [
        title,
        slug,
        seoTitle || null,
        excerpt,
        metaDescription || null,
        content,
        coverImage,
        authorId,
        author || authorId,
        status,
        nextEditorialStatus,
        JSON.stringify(normalizeFaqItems(faqItems)),
        nextPublishedAt,
        readingTime,
        featured,
        breaking,
        views,
        likes,
        shares,
        comments,
      ],
    );

    const article = inserted.rows[0];
    if (!article?.id) throw new Error('Falha ao criar artigo');

    await syncCategory(client, article.id, category);
    await syncTags(client, article.id, tags);
    await replaceArticleSources(client, article.id, sources);

    if (status === 'scheduled') {
      await client.query(
        `insert into article_jobs (
          article_id, job_type, status, idempotency_key, run_after, payload, last_error, updated_at
        ) values (
          $1, 'publish_article', 'queued', $2, $3, $4::jsonb, null, now()
        )
        on conflict (idempotency_key) do update
          set status = excluded.status,
              run_after = excluded.run_after,
              payload = excluded.payload,
              last_error = null,
              updated_at = now()`,
        [article.id, `publish_article:${article.id}`, nextPublishedAt, JSON.stringify({ articleId: article.id })],
      );
    }

    return article;
  });
}

export async function updateEditorialArticle(
  _admin: unknown,
  identifier: string,
  lookup: LookupMode,
  payload: EditorialPayload,
) {
  const existing = await resolveArticle(identifier, lookup);

  return withTransaction(async (client) => {
    const assignments: string[] = [];
    const values: unknown[] = [];
    let index = 1;

    const push = (column: string, value: unknown, cast?: string) => {
      assignments.push(`${column} = $${index}${cast ? `::${cast}` : ''}`);
      values.push(value);
      index += 1;
    };

    if (payload.title !== undefined) push('title', payload.title);
    if (payload.slug !== undefined) push('slug', payload.slug);
    if (payload.seoTitle !== undefined) push('seo_title', payload.seoTitle);
    if (payload.excerpt !== undefined) push('excerpt', payload.excerpt);
    if (payload.metaDescription !== undefined) push('meta_description', payload.metaDescription);
    if (payload.content !== undefined) push('content', payload.content);
    if (payload.coverImage !== undefined) push('cover_image', payload.coverImage);
    if (payload.authorId !== undefined) {
      push('author_id', payload.authorId);
      push('author_name', payload.author || payload.authorId);
    }
    if (payload.featured !== undefined) push('is_featured', payload.featured);
    if (payload.breaking !== undefined) push('is_breaking', payload.breaking);
    if (payload.readingTime !== undefined) push('reading_time', payload.readingTime);
    if (payload.views !== undefined) push('views', payload.views);
    if (payload.likes !== undefined) push('likes', payload.likes);
    if (payload.shares !== undefined) push('shares', payload.shares);
    if (payload.comments !== undefined) push('comments_count', payload.comments);
    if (payload.editorialStatus !== undefined) push('editorial_status', payload.editorialStatus);
    if (payload.faqItems !== undefined) push('faq_items', JSON.stringify(normalizeFaqItems(payload.faqItems)), 'jsonb');
    if (payload.status !== undefined) push('status', payload.status);
    if (payload.publishedAt !== undefined) push('published_at', payload.publishedAt);

    let data = {
      id: existing.id,
      slug: existing.slug,
      status: existing.status,
      editorial_status: null as string | null,
      published_at: existing.published_at,
    };

    if (assignments.length > 0) {
      values.push(existing.id);
      const updated = await client.query<{
        id: string;
        slug: string;
        status: string;
        editorial_status: string;
        published_at: string | null;
      }>(
        `update news_articles
         set ${assignments.join(', ')}
         where id = $${index}
         returning id, slug, status, editorial_status, published_at`,
        values,
      );
      data = updated.rows[0];
    }

    if (payload.category !== undefined) {
      await syncCategory(client, existing.id, payload.category);
    }

    if (payload.tags !== undefined) {
      await syncTags(client, existing.id, payload.tags);
    }

    if (payload.sources !== undefined) {
      await replaceArticleSources(client, existing.id, payload.sources);
    }

    if (payload.status === 'scheduled') {
      await client.query(
        `insert into article_jobs (
          article_id, job_type, status, idempotency_key, run_after, payload, last_error, updated_at
        ) values (
          $1, 'publish_article', 'queued', $2, $3, $4::jsonb, null, now()
        )
        on conflict (idempotency_key) do update
          set status = excluded.status,
              run_after = excluded.run_after,
              payload = excluded.payload,
              last_error = null,
              updated_at = now()`,
        [
          existing.id,
          `publish_article:${existing.id}`,
          payload.publishedAt ?? existing.published_at,
          JSON.stringify({ articleId: existing.id }),
        ],
      );
    }

    return data;
  });
}

export async function getEditorialArticle(_admin: unknown, identifier: string, lookup: LookupMode) {
  const filterColumn = lookup === 'slug' ? 'slug' : 'id';
  const article = await queryOne<EditorialArticleRecord>(
    `select
      id,
      slug,
      title,
      seo_title,
      excerpt,
      meta_description,
      content,
      author_id,
      author_name,
      status,
      editorial_status,
      faq_items,
      published_at,
      created_at,
      updated_at,
      reading_time,
      is_featured,
      is_breaking,
      cover_image
     from news_articles
     where ${filterColumn} = $1
     limit 1`,
    [identifier],
  );

  if (!article) throw new Error('Artigo nao encontrado');

  const categories = await queryRows<{ slug: string }>(
    `select c.slug
     from news_article_categories nac
     join categories c on c.id = nac.category_id
     where nac.article_id = $1
     order by c.priority asc, c.name asc`,
    [article.id],
  );

  const sources = await queryRows<ArticleSourceRecord>(
    `select
      id,
      source_type,
      source_name,
      source_url,
      publisher,
      country,
      language,
      accessed_at
     from article_sources
     where article_id = $1
     order by created_at asc`,
    [article.id],
  );

  return {
    ...article,
    news_article_categories: categories.map((category) => ({
      categories: { slug: category.slug },
    })),
    article_sources: sources,
  };
}

export async function enrichStoredEditorialArticle(
  _admin: unknown,
  identifier: string,
  lookup: LookupMode,
) {
  const article = await getEditorialArticle(null, identifier, lookup);
  const enriched = enrichEditorialArticle({
    title: String(article.title ?? ''),
    excerpt: String(article.excerpt ?? ''),
    content: String(article.content ?? ''),
    category: String(
      Array.isArray(article.news_article_categories) &&
      article.news_article_categories[0] &&
      typeof article.news_article_categories[0] === 'object' &&
      article.news_article_categories[0] !== null &&
      'categories' in article.news_article_categories[0] &&
      typeof article.news_article_categories[0].categories === 'object' &&
      article.news_article_categories[0].categories !== null &&
      'slug' in article.news_article_categories[0].categories &&
      typeof article.news_article_categories[0].categories.slug === 'string'
        ? article.news_article_categories[0].categories.slug
        : 'economia',
    ),
    seoTitle: typeof article.seo_title === 'string' ? article.seo_title : undefined,
    metaDescription: typeof article.meta_description === 'string' ? article.meta_description : undefined,
    faqItems: Array.isArray(article.faq_items) ? article.faq_items : [],
  });

  const data = await queryOne<{
    id: string;
    slug: string;
    seo_title: string | null;
    meta_description: string | null;
    faq_items: EditorialFaqInput[];
    editorial_status: string;
  }>(
    `update news_articles
     set seo_title = $1,
         meta_description = $2,
         faq_items = $3::jsonb,
         editorial_status = $4
     where id = $5
     returning id, slug, seo_title, meta_description, faq_items, editorial_status`,
    [
      enriched.seoTitle,
      enriched.metaDescription,
      JSON.stringify(enriched.faqItems),
      enriched.editorialStatus,
      String(article.id),
    ],
  );

  if (!data) throw new Error('Artigo nao encontrado');
  return data;
}

export async function publishEditorialArticle(
  _admin: unknown,
  identifier: string,
  lookup: LookupMode,
  publishedAt = new Date().toISOString(),
) {
  const existing = await resolveArticle(identifier, lookup);
  await assertEditorialPublishingEligibility(existing.id);

  return withTransaction(async (client) => {
    const updated = await client.query<{
      id: string;
      slug: string;
      status: string;
      editorial_status: string;
      published_at: string | null;
    }>(
      `update news_articles
       set status = 'published',
           editorial_status = 'published',
           published_at = $1
       where id = $2
       returning id, slug, status, editorial_status, published_at`,
      [publishedAt, existing.id],
    );

    await client.query(
      `update article_jobs
       set status = 'completed',
           result = $1::jsonb,
           updated_at = now()
       where idempotency_key = $2`,
      [JSON.stringify({ publishedAt }), `publish_article:${existing.id}`],
    );

    return updated.rows[0];
  });
}

export async function scheduleEditorialArticle(
  _admin: unknown,
  identifier: string,
  lookup: LookupMode,
  publishedAt: string,
) {
  const existing = await resolveArticle(identifier, lookup);
  await assertEditorialPublishingEligibility(existing.id);

  const updated = await updateEditorialArticle(null, identifier, lookup, {
    status: 'scheduled',
    editorialStatus: 'scheduled',
    publishedAt,
  });

  const articleId = lookup === 'id'
    ? identifier
    : String(updated?.id ?? existing.id);
  await upsertPublishArticleJob(null, articleId, publishedAt);
  return updated;
}

export async function approveEditorialArticle(
  _admin: unknown,
  identifier: string,
  lookup: LookupMode,
) {
  const existing = await resolveArticle(identifier, lookup);
  const validation = await validateEditorialArticle(null, existing.id, 'id');
  if (!validation.readyToPublish) {
    throw new Error('Artigo ainda nao pode ser aprovado; execute validate e corrija os erros pendentes');
  }

  const updated = await queryOne<{
    id: string;
    slug: string;
    status: string;
    editorial_status: string;
    published_at: string | null;
  }>(
    `update news_articles
     set editorial_status = 'approved',
         updated_at = now()
     where id = $1
     returning id, slug, status, editorial_status, published_at`,
    [existing.id],
  );

  if (!updated) throw new Error('Artigo nao encontrado');
  return updated;
}

export async function validateEditorialArticle(
  _admin: unknown,
  identifier: string,
  lookup: LookupMode,
  options: EditorialValidationOptions = {},
): Promise<EditorialValidationResult> {
  const article = await getEditorialArticle(null, identifier, lookup);
  const sources = Array.isArray(article.article_sources) ? article.article_sources : [];
  const categories = Array.isArray(article.news_article_categories) ? article.news_article_categories : [];
  const faqItems = Array.isArray(article.faq_items) ? article.faq_items : [];

  const checks = {
    hasTitle: Boolean(article.title?.trim()),
    hasExcerpt: Boolean(article.excerpt?.trim()),
    hasContent: Boolean(article.content?.trim()),
    hasCategory: categories.length > 0,
    hasAuthor: Boolean(article.author_id?.trim()),
    hasCoverImage: Boolean(article.cover_image?.trim()),
    hasSeoTitle: Boolean(article.seo_title?.trim()),
    hasMetaDescription: Boolean(article.meta_description?.trim()),
    hasFaqItems: faqItems.length > 0,
    hasSources: sources.length > 0,
    scheduledWithDate: article.status !== 'scheduled' || Boolean(article.published_at),
    hasApprovedStatus: article.editorial_status === 'approved' || article.editorial_status === 'published',
  };

  const issues: EditorialValidationIssue[] = [];

  if (!checks.hasTitle) issues.push({ code: 'missing_title', severity: 'error', message: 'Titulo obrigatorio ausente', field: 'title' });
  if (!checks.hasExcerpt) issues.push({ code: 'missing_excerpt', severity: 'error', message: 'Resumo obrigatorio ausente', field: 'excerpt' });
  if (!checks.hasContent) issues.push({ code: 'missing_content', severity: 'error', message: 'Conteudo obrigatorio ausente', field: 'content' });
  if (!checks.hasCategory) issues.push({ code: 'missing_category', severity: 'error', message: 'Categoria obrigatoria ausente', field: 'category' });
  if (!checks.hasAuthor) issues.push({ code: 'missing_author', severity: 'error', message: 'Autor obrigatorio ausente', field: 'authorId' });
  if (!checks.hasCoverImage) issues.push({ code: 'missing_cover_image', severity: 'error', message: 'Imagem de capa obrigatoria ausente', field: 'coverImage' });
  if (!checks.scheduledWithDate) issues.push({ code: 'missing_schedule_date', severity: 'error', message: 'Artigo agendado sem publishedAt', field: 'publishedAt' });
  if (options.requireApproval && !checks.hasApprovedStatus) {
    issues.push({ code: 'missing_approval', severity: 'error', message: 'Artigo precisa estar aprovado antes de publicar ou agendar', field: 'editorialStatus' });
  }

  const seoTitleLength = article.seo_title?.trim().length ?? 0;
  if (!checks.hasSeoTitle) {
    issues.push({ code: 'missing_seo_title', severity: 'warning', message: 'SEO title ausente', field: 'seoTitle' });
  } else if (seoTitleLength < 45 || seoTitleLength > 65) {
    issues.push({ code: 'seo_title_length', severity: 'warning', message: 'SEO title fora da faixa recomendada (45-65)', field: 'seoTitle' });
  }

  const metaDescriptionLength = article.meta_description?.trim().length ?? 0;
  if (!checks.hasMetaDescription) {
    issues.push({ code: 'missing_meta_description', severity: 'warning', message: 'Meta description ausente', field: 'metaDescription' });
  } else if (metaDescriptionLength < 140 || metaDescriptionLength > 170) {
    issues.push({ code: 'meta_description_length', severity: 'warning', message: 'Meta description fora da faixa recomendada (140-170)', field: 'metaDescription' });
  }

  if (!checks.hasFaqItems) {
    issues.push({ code: 'missing_faq', severity: 'warning', message: 'FAQ persistido ausente', field: 'faqItems' });
  }

  if (!checks.hasSources) {
    issues.push({ code: 'missing_sources', severity: 'error', message: 'Nenhuma fonte editorial persistida', field: 'sources' });
  }

  return {
    articleId: String(article.id),
    slug: String(article.slug),
    status: String(article.status),
    editorialStatus: String(article.editorial_status),
    readyToPublish: issues.every((issue) => issue.severity !== 'error'),
    issues,
    checks,
  };
}

async function assertEditorialPublishingEligibility(articleId: string) {
  const validation = await validateEditorialArticle(null, articleId, 'id', { requireApproval: true });
  if (!validation.readyToPublish) {
    throw new Error('Artigo nao esta apto para publicacao; execute validate e corrija os erros antes de publicar ou agendar');
  }
}

export async function addEditorialArticleSource(
  _admin: unknown,
  identifier: string,
  lookup: LookupMode,
  source: EditorialSourceInput,
) {
  const existing = await resolveArticle(identifier, lookup);
  const normalized = normalizeSources([source])[0];
  if (!normalized) throw new Error('Fonte invalida');

  const inserted = await queryOne<ArticleSourceRecord>(
    `insert into article_sources (
      article_id, source_type, source_name, source_url, publisher, country, language, accessed_at
    ) values ($1, $2, $3, $4, $5, $6, $7, $8)
    returning id, source_type, source_name, source_url, publisher, country, language, accessed_at`,
    [
      existing.id,
      normalized.sourceType,
      normalized.sourceName,
      normalized.sourceUrl,
      normalized.publisher,
      normalized.country,
      normalized.language,
      normalized.accessedAt,
    ],
  );

  if (!inserted) throw new Error('Falha ao criar fonte');
  return inserted;
}

export async function deleteEditorialArticleSource(
  _admin: unknown,
  identifier: string,
  lookup: LookupMode,
  sourceId: string,
) {
  const existing = await resolveArticle(identifier, lookup);
  const deleted = await queryOne<{ id: string }>(
    `delete from article_sources
     where id = $1
       and article_id = $2
     returning id`,
    [sourceId, existing.id],
  );

  if (!deleted) throw new Error('Fonte nao encontrada');
  return { id: deleted.id };
}

export async function listEditorialJobs(
  _admin: unknown,
  filters?: { status?: string; jobType?: string; articleId?: string; limit?: number },
) {
  const where: string[] = [];
  const values: unknown[] = [];
  let index = 1;

  const push = (condition: string, value: unknown) => {
    where.push(`${condition} $${index}`);
    values.push(value);
    index += 1;
  };

  if (filters?.status) push('status =', filters.status);
  if (filters?.jobType) push('job_type =', filters.jobType);
  if (filters?.articleId) push('article_id =', filters.articleId);

  const limit = Math.min(Math.max(filters?.limit ?? 50, 1), 200);
  values.push(limit);

  const rows = await queryRows<EditorialJobRecord>(
    `select
      id,
      article_id,
      job_type,
      status,
      idempotency_key,
      priority,
      payload,
      result,
      attempts,
      run_after,
      locked_at,
      locked_by,
      last_error,
      created_at,
      updated_at
     from article_jobs
     ${where.length > 0 ? `where ${where.join(' and ')}` : ''}
     order by created_at desc
     limit $${index}`,
    values,
  );

  return rows;
}
