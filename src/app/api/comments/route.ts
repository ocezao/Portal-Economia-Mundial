import { NextResponse } from 'next/server';

import { query, queryRows } from '@/lib/db';
import { requireAuthenticatedUser } from '@/lib/server/localAuth';

type CommentRow = {
  id: string;
  article_id: string;
  user_id: string;
  content: string;
  created_at: string;
  updated_at: string;
  status: string;
  name: string | null;
  avatar: string | null;
};

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const articleSlug = url.searchParams.get('articleSlug')?.trim();
    const limit = Number(url.searchParams.get('limit') ?? '50');
    const sortBy = url.searchParams.get('sortBy') === 'oldest' ? 'asc' : 'desc';

    if (!articleSlug) {
      return NextResponse.json({ error: 'articleSlug e obrigatorio' }, { status: 400 });
    }

    const rows = await queryRows<CommentRow>(
      `select
         c.id,
         c.article_id,
         c.user_id,
         c.content,
         c.created_at,
         c.updated_at,
         c.status,
         p.name,
         p.avatar
       from public.comments c
       left join public.profiles p on p.id = c.user_id
       where c.article_id = $1
         and c.status = 'active'
       order by c.created_at ${sortBy}
       limit $2`,
      [articleSlug, Math.max(1, Math.min(limit, 100))],
    );

    return NextResponse.json({
      comments: rows.map((row) => ({
        id: row.id,
        articleSlug: row.article_id,
        content: row.content,
        author: {
          id: row.user_id,
          name: row.name ?? 'Usuario',
          avatar: row.avatar ?? undefined,
        },
        authorId: row.user_id,
        authorName: row.name ?? 'Usuario',
        authorAvatar: row.avatar ?? undefined,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
        parentId: null,
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
      content?: string;
    };

    const articleSlug = payload.articleSlug?.trim();
    const content = payload.content?.trim();
    if (!articleSlug || !content) {
      return NextResponse.json({ error: 'articleSlug e content sao obrigatorios' }, { status: 400 });
    }

    const inserted = await queryRows<CommentRow>(
      `insert into public.comments (article_id, user_id, content, status)
       values ($1, $2, $3, 'active')
       returning id, article_id, user_id, content, created_at, updated_at, status,
         null::text as name,
         null::text as avatar`,
      [articleSlug, auth.session.authUser.id, content],
    );

    const row = inserted[0];
    return NextResponse.json({
      comment: {
        id: row.id,
        articleSlug: row.article_id,
        content: row.content,
        author: {
          id: auth.session.authUser.id,
          name: auth.session.authUser.name,
          avatar: auth.session.authUser.avatar,
        },
        authorId: auth.session.authUser.id,
        authorName: auth.session.authUser.name,
        authorAvatar: auth.session.authUser.avatar,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
        parentId: null,
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Erro interno do servidor';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
