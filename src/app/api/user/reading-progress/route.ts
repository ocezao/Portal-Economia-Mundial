import { query, queryOne } from '@/lib/db';
import { requireAuthenticatedUser } from '@/lib/server/localAuth';

export async function GET(req: Request) {
  const auth = await requireAuthenticatedUser(req);
  if (!auth.ok) return Response.json({ error: auth.message }, { status: auth.status });

  const url = new URL(req.url);
  const articleSlug = url.searchParams.get('articleSlug');
  if (!articleSlug) return Response.json({ error: 'articleSlug e obrigatorio' }, { status: 400 });

  const row = await queryOne<{ progress_pct: number; last_position: number; updated_at: string }>(
    `select rp.progress_pct, rp.last_position, rp.updated_at
     from reading_progress rp
     join news_articles na on na.id = rp.article_id
     where rp.user_id = $1
       and na.slug = $2
     limit 1`,
    [auth.session.authUser.id, articleSlug],
  );

  return Response.json({ progress: row ?? null });
}

export async function PUT(req: Request) {
  const auth = await requireAuthenticatedUser(req);
  if (!auth.ok) return Response.json({ error: auth.message }, { status: auth.status });

  const body = await req.json() as { articleSlug?: string; progress: number; lastPosition: number };
  if (!body.articleSlug) return Response.json({ error: 'articleSlug e obrigatorio' }, { status: 400 });

  const article = await queryOne<{ id: string }>(
    'select id from news_articles where slug = $1 limit 1',
    [body.articleSlug],
  );
  if (!article) return Response.json({ error: 'Artigo nao encontrado' }, { status: 404 });

  await query(
    `insert into reading_progress (user_id, article_id, progress_pct, last_position)
     values ($1, $2, $3, $4)
     on conflict (user_id, article_id) do update
       set progress_pct = excluded.progress_pct,
           last_position = excluded.last_position,
           updated_at = now()`,
    [auth.session.authUser.id, article.id, body.progress, body.lastPosition],
  );

  return Response.json({ ok: true });
}

export async function DELETE(req: Request) {
  const auth = await requireAuthenticatedUser(req);
  if (!auth.ok) return Response.json({ error: auth.message }, { status: auth.status });

  await query('delete from reading_progress where user_id = $1', [auth.session.authUser.id]);
  return Response.json({ ok: true });
}
