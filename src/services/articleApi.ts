/**
 * API Client for Article Management
 * Uses local auth cookie with same-origin routes.
 */

const LEGACY_API_BASE = '/api/articles/';
const EDITORIAL_ROOT = '/api/v1/editorial';

interface ArticleFaqItem {
  question: string;
  answer: string;
}

interface ArticleSource {
  sourceType: string;
  sourceName: string;
  sourceUrl?: string;
  publisher?: string;
  country?: string;
  language?: string;
  accessedAt?: string;
}

interface ArticlePayload {
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
  payload?: Record<string, unknown>,
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

export async function deleteArticleApi(slug: string) {
  return callArticleApi('delete', { slug });
}

export async function enrichArticleApi(slug: string) {
  return callEditorialApi(`/articles/${encodeURIComponent(slug)}/enrich?lookup=slug`, 'POST', {});
}

export async function validateArticleApi(slug: string) {
  return callEditorialApi(`/articles/${encodeURIComponent(slug)}/validate?lookup=slug`, 'GET');
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
