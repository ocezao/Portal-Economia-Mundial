import { query, queryOne } from '@/lib/db';
import { requireAuthenticatedUser } from '@/lib/server/localAuth';

export async function GET(req: Request) {
  const auth = await requireAuthenticatedUser(req);
  if (!auth.ok) return Response.json({ error: auth.message }, { status: auth.status });

  const rows = await query(
    `select
      b.created_at,
      na.slug,
      na.title,
      na.excerpt,
      na.cover_image,
      coalesce(cat.slug, 'economia') as category
     from bookmarks b
     join news_articles na on na.id = b.article_id
     left join news_article_categories nac on nac.article_id = na.id
     left join categories cat on cat.id = nac.category_id
     where b.user_id = $1
     order by b.created_at desc`,
    [auth.session.authUser.id],
  );

  return Response.json({
    bookmarks: rows.rows.map((row) => ({
      articleSlug: row.slug,
      title: row.title,
      category: row.category,
      excerpt: row.excerpt,
      coverImage: row.cover_image,
      bookmarkedAt: row.created_at,
    })),
  });
}

export async function POST(req: Request) {
  const auth = await requireAuthenticatedUser(req);
  if (!auth.ok) return Response.json({ error: auth.message }, { status: auth.status });

  const body = await req.json() as { articleSlug?: string };
  if (!body.articleSlug) return Response.json({ error: 'articleSlug e obrigatorio' }, { status: 400 });

  const article = await queryOne<{ id: string }>(
    'select id from news_articles where slug = $1 limit 1',
    [body.articleSlug],
  );
  if (!article) return Response.json({ error: 'Artigo nao encontrado' }, { status: 404 });

  await query(
    `insert into bookmarks (user_id, article_id)
     values ($1, $2)
     on conflict (user_id, article_id) do nothing`,
    [auth.session.authUser.id, article.id],
  );

  return Response.json({ ok: true });
}

export async function DELETE(req: Request) {
  const auth = await requireAuthenticatedUser(req);
  if (!auth.ok) return Response.json({ error: auth.message }, { status: auth.status });

  const url = new URL(req.url);
  const articleSlug = url.searchParams.get('articleSlug');
  const clearAll = url.searchParams.get('clearAll') === 'true';

  if (clearAll) {
    await query('delete from bookmarks where user_id = $1', [auth.session.authUser.id]);
    return Response.json({ ok: true });
  }

  if (!articleSlug) return Response.json({ error: 'articleSlug e obrigatorio' }, { status: 400 });

  await query(
    `delete from bookmarks
     where user_id = $1
       and article_id = (select id from news_articles where slug = $2 limit 1)`,
    [auth.session.authUser.id, articleSlug],
  );

  return Response.json({ ok: true });
}
