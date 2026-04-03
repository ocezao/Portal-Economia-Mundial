import { query } from '@/lib/db';
import { requireAdminRequest } from '@/lib/server/adminApi';
import { createEditorialArticle, updateEditorialArticle, type EditorialPayload } from '@/lib/server/editorialAdmin';

type Payload = Record<string, unknown> & EditorialPayload & { action?: string };

function json(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'content-type': 'application/json',
    },
  });
}

export async function POST(req: Request) {
  try {
    const auth = await requireAdminRequest(req);
    if (!auth.ok) return json({ error: auth.message }, auth.status);

    const payload = (await req.json()) as Payload;
    const action = payload.action;

    if (action === 'create') {
      const article = await createEditorialArticle(null, {
        ...payload,
        status: 'published',
        publishedAt: new Date().toISOString(),
      });
      return json({ ok: true, id: article.id, slug: article.slug });
    }

    if (action === 'update') {
      const currentSlug = String(payload.slug ?? '').trim();
      if (!currentSlug) return json({ error: 'Slug atual e obrigatorio' }, 400);

      await updateEditorialArticle(null, currentSlug, 'slug', payload);
      return json({ ok: true });
    }

    if (action === 'delete') {
      const slug = String(payload.slug ?? '').trim();
      if (!slug) return json({ error: 'Slug e obrigatorio' }, 400);

      await query('delete from public.news_articles where slug = $1', [slug]);
      return json({ ok: true });
    }

    return json({ error: 'Acao invalida' }, 400);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Erro interno do servidor';
    return json({ error: message }, 500);
  }
}
