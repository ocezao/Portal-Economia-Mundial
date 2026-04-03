/**
 * API Client for Article Management
 * Uses local auth cookie with same-origin routes.
 */

const EDITORIAL_ROOT = '/api/v1/editorial';

interface ArticleFaqItem {
  question: string;
  answer: string;
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
