import { NextResponse } from 'next/server';

import { query, queryOne, queryRows } from '@/lib/db';
import { requireAuthenticatedUser } from '@/lib/server/localAuth';

type BookmarkRow = {
  article_slug: string;
  title: string;
  excerpt: string | null;
  cover_image: string | null;
  category_slug: string | null;
  bookmarked_at: string;
};

async function resolveArticleId(slug: string) {
  const row = await queryOne<{ id: string }>(
    'select id from public.news_articles where slug = $1 limit 1',
    [slug],
  );

  return row?.id ?? null;
}

export async function GET(req: Request) {
  try {
    const auth = await requireAuthenticatedUser(req);
    if (!auth.ok) {
      return NextResponse.json({ error: auth.message }, { status: auth.status });
    }

    const rows = await queryRows<BookmarkRow>(
      `select
         na.slug as article_slug,
         na.title,
         na.excerpt,
         na.cover_image,
         c.slug as category_slug,
         b.created_at as bookmarked_at
       from public.bookmarks b
       inner join public.news_articles na on na.id = b.article_id
       left join public.news_article_categories nac on nac.article_id = na.id
       left join public.categories c on c.id = nac.category_id
       where b.user_id = $1
       order by b.created_at desc`,
      [auth.session.authUser.id],
    );

    return NextResponse.json({
      bookmarks: rows.map((row) => ({
        articleSlug: row.article_slug,
        title: row.title,
        category: row.category_slug ?? 'economia',
        excerpt: row.excerpt ?? '',
        coverImage: row.cover_image ?? '',
        bookmarkedAt: row.bookmarked_at,
      })),
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Erro interno do servidor';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const auth = await requireAuthenticatedUser(req);
    if (!auth.ok) {
      return NextResponse.json({ error: auth.message }, { status: auth.status });
    }

    const payload = (await req.json().catch(() => ({}))) as { articleSlug?: string };
    const articleSlug = payload.articleSlug?.trim();
    if (!articleSlug) {
      return NextResponse.json({ error: 'articleSlug e obrigatorio' }, { status: 400 });
    }

    const articleId = await resolveArticleId(articleSlug);
    if (!articleId) {
      return NextResponse.json({ error: 'Artigo nao encontrado' }, { status: 404 });
    }

    await query(
      `insert into public.bookmarks (user_id, article_id)
       values ($1, $2)
       on conflict (user_id, article_id) do nothing`,
      [auth.session.authUser.id, articleId],
    );

    return NextResponse.json({ ok: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Erro interno do servidor';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const auth = await requireAuthenticatedUser(req);
    if (!auth.ok) {
      return NextResponse.json({ error: auth.message }, { status: auth.status });
    }

    const url = new URL(req.url);
    const articleSlug = url.searchParams.get('articleSlug')?.trim();

    if (!articleSlug) {
      await query('delete from public.bookmarks where user_id = $1', [auth.session.authUser.id]);
      return NextResponse.json({ ok: true, cleared: true });
    }

    const articleId = await resolveArticleId(articleSlug);
    if (!articleId) {
      return NextResponse.json({ ok: true });
    }

    await query(
      `delete from public.bookmarks
       where user_id = $1
         and article_id = $2`,
      [auth.session.authUser.id, articleId],
    );

    return NextResponse.json({ ok: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Erro interno do servidor';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
