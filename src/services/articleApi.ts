/**
 * API Client for Article Management
 * Uses local auth cookie with same-origin routes.
 */

const LEGACY_API_BASE = '/api/articles/';
const EDITORIAL_ROOT = '/api/v1/editorial';

export interface ArticleFaqItem {
  question: string;
  answer: string;
}

export interface ArticleSource {
  id?: string;
  sourceType: string;
  sourceName: string;
  sourceUrl?: string;
  publisher?: string;
  country?: string;
  language?: string;
  accessedAt?: string;
}

export interface ArticlePayload {
  title: string;
  slug: string;
  seoTitle?: string;
  excerpt: string;
  metaDescription?: string;
  content: string;
  category: string;
  authorId: string;
  author: string;
  tags?: string[];
  coverImage: string;
  featured?: boolean;
  breaking?: boolean;
  readingTime?: number;
  views?: number;
  likes?: number;
  shares?: number;
  comments?: number;
  faqItems?: ArticleFaqItem[];
  editorialStatus?: string;
  sources?: ArticleSource[];
  status?: 'draft' | 'scheduled' | 'published';
  publishedAt?: string | null;
}

interface EditorialEnvelope<T> {
  ok: boolean;
  data?: T;
  error?: {
    message?: string;
  };
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
}

export interface EditorialArticleRecord extends Partial<ArticlePayload> {
  id: string;
  slug: string;
  status: 'draft' | 'scheduled' | 'published';
  editorial_status?: string;
  editorialStatus?: string;
  published_at?: string | null;
  publishedAt?: string | null;
  faq_items?: ArticleFaqItem[] | null;
  article_sources?: ArticleSource[] | null;
  news_article_categories?: { categories?: { slug?: string } }[] | null;
  author_id?: string;
  author_name?: string;
  cover_image?: string | null;
  seo_title?: string | null;
  meta_description?: string | null;
  is_featured?: boolean;
  is_breaking?: boolean;
  reading_time?: number;
  comments_count?: number;
  tags?: string[];
}

function mapEditorialArticleRecord(article: EditorialArticleRecord): EditorialArticleRecord {
  const primaryCategory = article.news_article_categories?.[0]?.categories?.slug;

  return {
    ...article,
    category: article.category ?? primaryCategory,
    authorId: article.authorId ?? article.author_id,
    author: article.author ?? article.author_name,
    coverImage: article.coverImage ?? article.cover_image ?? undefined,
    seoTitle: article.seoTitle ?? article.seo_title ?? undefined,
    metaDescription: article.metaDescription ?? article.meta_description ?? undefined,
    faqItems: article.faqItems ?? article.faq_items ?? undefined,
    sources: article.sources ?? article.article_sources ?? undefined,
    featured: article.featured ?? article.is_featured ?? false,
    breaking: article.breaking ?? article.is_breaking ?? false,
    readingTime: article.readingTime ?? article.reading_time ?? undefined,
    comments: article.comments ?? article.comments_count ?? undefined,
  };
}

async function callArticleApi(action: string, payload: Record<string, unknown> = {}) {
  const response = await fetch(LEGACY_API_BASE, {
    method: 'POST',
    credentials: 'same-origin',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ action, ...payload }),
  });

  const json = await response.json() as Record<string, unknown>;
  if (!response.ok) {
    throw new Error((json.error as string) || `Erro: ${response.status}`);
  }

  return json;
}

async function callEditorialApi(
  path: string,
  method: 'GET' | 'POST' | 'PATCH',
  payload?: unknown,
) {
  const response = await fetch(`${EDITORIAL_ROOT}${path}`, {
    method,
    credentials: 'same-origin',
    headers: {
      'Content-Type': 'application/json',
    },
    ...(payload ? { body: JSON.stringify(payload) } : {}),
  });

  const json = await response.json() as EditorialEnvelope<Record<string, unknown>>;
  if (!response.ok) {
    throw new Error(json.error?.message || 'Erro na API editorial');
  }

  return json.data ?? {};
}

export async function createArticleApi(articleData: ArticlePayload) {
  return callEditorialApi('/articles', 'POST', articleData);
}

export async function updateArticleApi(
  slug: string,
  updates: Partial<ArticlePayload>,
) {
  return callEditorialApi(`/articles/${encodeURIComponent(slug)}?lookup=slug`, 'PATCH', updates);
}

export async function getEditorialArticleApi(slug: string) {
  const article = await callEditorialApi(`/articles/${encodeURIComponent(slug)}?lookup=slug`, 'GET') as unknown as EditorialArticleRecord;
  return mapEditorialArticleRecord(article);
}

export async function deleteArticleApi(slug: string) {
  return callArticleApi('delete', { slug });
}

export async function enrichArticleApi(slug: string) {
  return callEditorialApi(`/articles/${encodeURIComponent(slug)}/enrich?lookup=slug`, 'POST', {});
}

export async function validateArticleApi(slug: string) {
  return callEditorialApi(`/articles/${encodeURIComponent(slug)}/validate?lookup=slug`, 'GET') as unknown as Promise<EditorialValidationResult>;
}

export async function approveArticleApi(slug: string) {
  return callEditorialApi(`/articles/${encodeURIComponent(slug)}/approve?lookup=slug`, 'POST', {});
}

export async function publishArticleNowApi(slug: string, publishedAt?: string) {
  return callEditorialApi(`/articles/${encodeURIComponent(slug)}/publish?lookup=slug`, 'POST', { publishedAt });
}

export async function scheduleExistingArticleApi(slug: string, publishedAt: string) {
  return callEditorialApi(`/articles/${encodeURIComponent(slug)}/schedule?lookup=slug`, 'POST', { publishedAt });
}

export async function listEditorialArticlesApi(query?: Record<string, string | number | undefined>) {
  const searchParams = new URLSearchParams();
  Object.entries(query ?? {}).forEach(([key, value]) => {
    if (value !== undefined && value !== '') {
      searchParams.set(key, String(value));
    }
  });

  const suffix = searchParams.toString() ? `/articles?${searchParams.toString()}` : '/articles';
  return callEditorialApi(suffix, 'GET');
}

export async function getEditorialMetaApi() {
  return callEditorialApi('/meta', 'GET');
}

export async function checkEditorialSlugApi(input: { value?: string; title?: string; excludeSlug?: string }) {
  const searchParams = new URLSearchParams();
  Object.entries(input).forEach(([key, value]) => {
    if (value) searchParams.set(key, value);
  });

  return callEditorialApi(`/slug?${searchParams.toString()}`, 'GET');
}

export async function uploadEditorialImageApi(formData: FormData) {
  const response = await fetch(`${EDITORIAL_ROOT}/uploads`, {
    method: 'POST',
    credentials: 'same-origin',
    body: formData,
  });

  const json = await response.json() as EditorialEnvelope<Record<string, unknown>>;
  if (!response.ok) {
    throw new Error(json.error?.message || 'Erro no upload editorial');
  }

  return json.data ?? {};
}

export async function addEditorialSourceApi(slug: string, source: ArticleSource) {
  return callEditorialApi(`/articles/${encodeURIComponent(slug)}/sources?lookup=slug`, 'POST', source as unknown as Record<string, unknown>);
}

export async function removeEditorialSourceApi(slug: string, sourceId: string) {
  const response = await fetch(`${EDITORIAL_ROOT}/articles/${encodeURIComponent(slug)}/sources/${encodeURIComponent(sourceId)}?lookup=slug`, {
    method: 'DELETE',
    credentials: 'same-origin',
  });

  const json = await response.json() as EditorialEnvelope<Record<string, unknown>>;
  if (!response.ok) {
    throw new Error(json.error?.message || 'Erro ao remover fonte');
  }

  return json.data ?? {};
}

export async function listEditorialJobsApi(query?: Record<string, string | number | undefined>) {
  const searchParams = new URLSearchParams();
  Object.entries(query ?? {}).forEach(([key, value]) => {
    if (value !== undefined && value !== '') {
      searchParams.set(key, String(value));
    }
  });

  const suffix = searchParams.toString() ? `/jobs?${searchParams.toString()}` : '/jobs';
  return callEditorialApi(suffix, 'GET');
}

export async function dispatchEditorialJobsApi(limit?: number) {
  return callEditorialApi('/jobs/dispatch', 'POST', limit ? { limit } : {});
}
