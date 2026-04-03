import { query } from '@/lib/db';
import { requireAdminRequest } from '@/lib/server/adminApi';

type Payload = Record<string, unknown> & { action?: string };

function json(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'content-type': 'application/json' },
  });
}

async function publishScheduledNow() {
  const now = new Date().toISOString();
  const result = await query(
    `update public.news_articles
     set status = 'published',
         editorial_status = 'published',
         updated_at = now()
     where status = 'scheduled'
       and published_at <= $1
     returning id`,
    [now],
  );

  return result.rowCount ?? 0;
}

export async function POST(req: Request) {
  try {
    const auth = await requireAdminRequest(req);
    if (!auth.ok) return json({ error: auth.message }, auth.status);

    const payload = (await req.json()) as Payload;
    if (payload.action !== 'publish_scheduled') {
      return json({ error: 'Acao invalida' }, 400);
    }

    const count = await publishScheduledNow();
    return json({ ok: true, count });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Erro interno do servidor';
    return json({ error: message }, 500);
  }
}
