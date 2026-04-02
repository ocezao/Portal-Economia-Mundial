import { query, queryOne } from '@/lib/db';
import { requireAuthenticatedUser } from '@/lib/server/localAuth';

export async function GET(req: Request) {
  const auth = await requireAuthenticatedUser(req);
  if (!auth.ok) return Response.json({ error: auth.message }, { status: auth.status });

  const rows = await query(
    `select
      rh.read_at,
      rh.time_spent,
      na.slug,
      na.title,
      coalesce(cat.slug, 'economia') as category
     from reading_history rh
     join news_articles na on na.id = rh.article_id
     left join news_article_categories nac on nac.article_id = na.id
     left join categories cat on cat.id = nac.category_id
     where rh.user_id = $1
     order by rh.read_at desc`,
    [auth.session.authUser.id],
  );

  return Response.json({
    history: rows.rows.map((row) => ({
      articleSlug: row.slug,
      title: row.title,
      category: row.category,
      readAt: row.read_at,
      timeSpent: row.time_spent ?? 0,
      progress: 100,
    })),
  });
}

export async function POST(req: Request) {
  const auth = await requireAuthenticatedUser(req);
  if (!auth.ok) return Response.json({ error: auth.message }, { status: auth.status });

  const body = await req.json() as { articleSlug?: string; timeSpent?: number };
  if (!body.articleSlug) return Response.json({ error: 'articleSlug e obrigatorio' }, { status: 400 });

  const article = await queryOne<{ id: string }>(
    'select id from news_articles where slug = $1 limit 1',
    [body.articleSlug],
  );
  if (!article) return Response.json({ error: 'Artigo nao encontrado' }, { status: 404 });

  await query(
    `insert into reading_history (user_id, article_id, time_spent)
     values ($1, $2, $3)`,
    [auth.session.authUser.id, article.id, body.timeSpent ?? 0],
  );

  return Response.json({ ok: true });
}

export async function DELETE(req: Request) {
  const auth = await requireAuthenticatedUser(req);
  if (!auth.ok) return Response.json({ error: auth.message }, { status: auth.status });

  await query('delete from reading_history where user_id = $1', [auth.session.authUser.id]);
  return Response.json({ ok: true });
}
