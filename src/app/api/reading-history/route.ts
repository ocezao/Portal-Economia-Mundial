import { NextResponse } from 'next/server';

import { query, queryOne, queryRows } from '@/lib/db';
import { requireAuthenticatedUser } from '@/lib/server/localAuth';

type ReadingHistoryRow = {
  article_slug: string;
  title: string;
  category_slug: string | null;
  read_at: string;
  time_spent: number | null;
  progress: number | null;
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

    const rows = await queryRows<ReadingHistoryRow>(
      `select
         na.slug as article_slug,
         na.title,
         c.slug as category_slug,
         rh.read_at,
         rh.time_spent,
         coalesce(rp.progress_pct, 100) as progress
       from public.reading_history rh
       inner join public.news_articles na on na.id = rh.article_id
       left join public.news_article_categories nac on nac.article_id = na.id
       left join public.categories c on c.id = nac.category_id
       left join public.reading_progress rp
         on rp.article_id = rh.article_id
        and rp.user_id = rh.user_id
       where rh.user_id = $1
       order by rh.read_at desc`,
      [auth.session.authUser.id],
    );

    return NextResponse.json({
      history: rows.map((row) => ({
        articleSlug: row.article_slug,
        title: row.title,
        category: row.category_slug ?? 'economia',
        readAt: row.read_at,
        timeSpent: row.time_spent ?? 0,
        progress: row.progress ?? 100,
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

    const payload = (await req.json().catch(() => ({}))) as {
      articleSlug?: string;
      timeSpent?: number;
    };

    const articleSlug = payload.articleSlug?.trim();
    if (!articleSlug) {
      return NextResponse.json({ error: 'articleSlug e obrigatorio' }, { status: 400 });
    }

    const articleId = await resolveArticleId(articleSlug);
    if (!articleId) {
      return NextResponse.json({ error: 'Artigo nao encontrado' }, { status: 404 });
    }

    await query(
      `insert into public.reading_history (user_id, article_id, time_spent)
       values ($1, $2, $3)`,
      [auth.session.authUser.id, articleId, Math.max(0, Math.floor(payload.timeSpent ?? 0))],
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

    await query('delete from public.reading_history where user_id = $1', [auth.session.authUser.id]);
    return NextResponse.json({ ok: true, cleared: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Erro interno do servidor';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
