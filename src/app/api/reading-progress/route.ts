import { NextResponse } from 'next/server';

import { query, queryOne } from '@/lib/db';
import { requireAuthenticatedUser } from '@/lib/server/localAuth';

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

    const url = new URL(req.url);
    const articleSlug = url.searchParams.get('articleSlug')?.trim();
    if (!articleSlug) {
      return NextResponse.json({ error: 'articleSlug e obrigatorio' }, { status: 400 });
    }

    const articleId = await resolveArticleId(articleSlug);
    if (!articleId) {
      return NextResponse.json({ progress: null });
    }

    const row = await queryOne<{
      progress_pct: number;
      last_position: number;
      updated_at: string;
    }>(
      `select progress_pct, last_position, updated_at
       from public.reading_progress
       where user_id = $1
         and article_id = $2
       limit 1`,
      [auth.session.authUser.id, articleId],
    );

    return NextResponse.json({
      progress: row
        ? {
            progress: row.progress_pct ?? 0,
            lastPosition: row.last_position ?? 0,
            lastReadAt: row.updated_at,
          }
        : null,
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
      progress?: number;
      lastPosition?: number;
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
      `insert into public.reading_progress (user_id, article_id, progress_pct, last_position)
       values ($1, $2, $3, $4)
       on conflict (user_id, article_id) do update
         set progress_pct = greatest(public.reading_progress.progress_pct, excluded.progress_pct),
             last_position = excluded.last_position,
             updated_at = now()`,
      [
        auth.session.authUser.id,
        articleId,
        Math.max(0, Math.min(100, Math.round(payload.progress ?? 0))),
        Math.max(0, Math.round(payload.lastPosition ?? 0)),
      ],
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

    await query('delete from public.reading_progress where user_id = $1', [auth.session.authUser.id]);
    return NextResponse.json({ ok: true, cleared: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Erro interno do servidor';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
