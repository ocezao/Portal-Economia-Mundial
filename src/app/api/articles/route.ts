import { createArticle, deleteArticle, updateArticle } from '@/services/newsManager';
import type { NewsArticle } from '@/types';
import { requireEditorialRequest } from '@/lib/server/adminApi';

type Payload = Record<string, unknown> & {
  action?: string;
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
  faqItems?: Array<{ question: string; answer: string }>;
  editorialStatus?: string;
  sources?: Array<{
    sourceType?: string;
    sourceName?: string;
    sourceUrl?: string;
    publisher?: string;
    country?: string;
    language?: string;
    accessedAt?: string;
  }>;
};

function json(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'content-type': 'application/json',
    },
  });
}

function normalizeFaqItems(value: Payload['faqItems']) {
  return (value ?? [])
    .filter((item) => item.question?.trim() && item.answer?.trim())
    .map((item) => ({
      question: item.question!.trim(),
      answer: item.answer!.trim(),
    }));
}

function normalizeSources(value: Payload['sources']) {
  return (value ?? [])
    .filter((item) => item.sourceName?.trim())
    .map((item) => ({
      sourceType: item.sourceType || 'reference',
      sourceName: item.sourceName!.trim(),
      sourceUrl: item.sourceUrl?.trim() || undefined,
      publisher: item.publisher?.trim() || undefined,
      country: item.country?.trim() || undefined,
      language: item.language?.trim() || undefined,
      accessedAt: item.accessedAt || undefined,
    }));
}

function mapPayloadToArticle(payload: Payload): Omit<NewsArticle, 'id' | 'publishedAt' | 'updatedAt'> {
  return {
    slug: payload.slug ?? '',
    title: payload.title ?? '',
    seoTitle: payload.seoTitle,
    excerpt: payload.excerpt ?? '',
    metaDescription: payload.metaDescription,
    content: payload.content ?? '',
    category: (payload.category ?? 'economia') as NewsArticle['category'],
    authorId: payload.authorId ?? '',
    author: payload.author ?? '',
    tags: payload.tags ?? [],
    coverImage: payload.coverImage ?? '',
    featured: payload.featured ?? false,
    breaking: payload.breaking ?? false,
    readingTime: payload.readingTime ?? 1,
    views: payload.views ?? 0,
    likes: payload.likes ?? 0,
    shares: payload.shares ?? 0,
    comments: payload.comments ?? 0,
    faqItems: normalizeFaqItems(payload.faqItems),
    editorialStatus: payload.editorialStatus as NewsArticle['editorialStatus'],
    sources: normalizeSources(payload.sources),
  };
}

function mapPayloadToArticleUpdates(payload: Payload): Partial<NewsArticle> {
  const updates: Partial<NewsArticle> = {};
  if (payload.slug !== undefined) updates.slug = payload.slug;
  if (payload.title !== undefined) updates.title = payload.title;
  if (payload.seoTitle !== undefined) updates.seoTitle = payload.seoTitle;
  if (payload.excerpt !== undefined) updates.excerpt = payload.excerpt;
  if (payload.metaDescription !== undefined) updates.metaDescription = payload.metaDescription;
  if (payload.content !== undefined) updates.content = payload.content;
  if (payload.category !== undefined) updates.category = payload.category as NewsArticle['category'];
  if (payload.authorId !== undefined) updates.authorId = payload.authorId;
  if (payload.author !== undefined) updates.author = payload.author;
  if (payload.tags !== undefined) updates.tags = payload.tags;
  if (payload.coverImage !== undefined) updates.coverImage = payload.coverImage;
  if (payload.featured !== undefined) updates.featured = payload.featured;
  if (payload.breaking !== undefined) updates.breaking = payload.breaking;
  if (payload.readingTime !== undefined) updates.readingTime = payload.readingTime;
  if (payload.views !== undefined) updates.views = payload.views;
  if (payload.likes !== undefined) updates.likes = payload.likes;
  if (payload.shares !== undefined) updates.shares = payload.shares;
  if (payload.comments !== undefined) updates.comments = payload.comments;
  if (payload.faqItems !== undefined) updates.faqItems = normalizeFaqItems(payload.faqItems);
  if (payload.editorialStatus !== undefined) updates.editorialStatus = payload.editorialStatus as NewsArticle['editorialStatus'];
  if (payload.sources !== undefined) updates.sources = normalizeSources(payload.sources);
  return updates;
}

export async function POST(req: Request) {
  try {
    const auth = await requireEditorialRequest(req);
    if (!auth.ok) return json({ error: auth.message }, auth.status);

    const payload = (await req.json()) as Payload;
    const action = payload.action;

    if (action === 'create') {
      const article = mapPayloadToArticle(payload);
      if (!article.title) return json({ error: 'Titulo e obrigatorio' }, 400);
      if (!article.slug) return json({ error: 'Slug e obrigatorio' }, 400);
      if (!article.excerpt) return json({ error: 'Resumo e obrigatorio' }, 400);
      if (!article.content) return json({ error: 'Conteudo e obrigatorio' }, 400);
      if (!article.category) return json({ error: 'Categoria e obrigatoria' }, 400);
      if (!article.authorId) return json({ error: 'Autor e obrigatorio' }, 400);
      if (!article.coverImage) return json({ error: 'Imagem de capa e obrigatoria' }, 400);

      const created = await createArticle(article);
      return json({ ok: true, id: created.id, slug: created.slug });
    }

    if (action === 'update') {
      const { slug, ...rest } = payload;
      if (!slug) return json({ error: 'Slug atual e obrigatorio' }, 400);

      const updated = await updateArticle(slug, mapPayloadToArticleUpdates(rest));
      if (!updated) return json({ error: 'Artigo nao encontrado' }, 404);
      return json({ ok: true, id: updated.id, slug: updated.slug });
    }

    if (action === 'delete') {
      const { slug } = payload;
      if (!slug) return json({ error: 'Slug e obrigatorio' }, 400);

      const ok = await deleteArticle(slug);
      if (!ok) return json({ error: 'Falha ao excluir artigo' }, 500);
      return json({ ok: true });
    }

    return json({ error: 'Acao invalida' }, 400);
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Erro interno do servidor';
    return json({ error: message }, 500);
  }
}
