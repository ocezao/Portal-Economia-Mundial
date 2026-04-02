import { NextResponse } from 'next/server';

import { query, queryOne, queryRows } from '@/lib/db';
import { requireAuthenticatedUser } from '@/lib/server/localAuth';

type CommentRow = {
  id: string;
  article_slug: string;
  content: string;
  user_id: string;
  author_name: string | null;
  author_avatar: string | null;
  created_at: string;
  updated_at: string;
};

function mapComment(row: CommentRow) {
  return {
    id: row.id,
    articleSlug: row.article_slug,
    content: row.content,
    author: {
      id: row.user_id,
      name: row.author_name ?? 'Usuario',
      avatar: row.author_avatar ?? undefined,
    },
    authorId: row.user_id,
    authorName: row.author_name ?? 'Usuario',
    authorAvatar: row.author_avatar ?? undefined,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    likes: 0,
    parentId: null,
  };
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const articleSlug = searchParams.get('articleSlug')?.trim();
  const sortBy = searchParams.get('sortBy') === 'oldest' ? 'asc' : 'desc';
  const limit = Math.min(Math.max(Number(searchParams.get('limit') ?? '50'), 1), 100);

  if (!articleSlug) {
    return NextResponse.json({ error: 'articleSlug obrigatorio' }, { status: 400 });
  }

  const rows = await queryRows<CommentRow>(
    `select
      c.id,
      na.slug as article_slug,
      c.content,
      c.user_id,
      p.name as author_name,
      p.avatar as author_avatar,
      c.created_at,
      c.updated_at
     from comments c
     join news_articles na on na.id = c.article_id
     left join profiles p on p.id = c.user_id
     where na.slug = $1
       and c.status = 'active'
     order by c.created_at ${sortBy}
     limit $2`,
    [articleSlug, limit],
  );

  return NextResponse.json(rows.map(mapComment));
}

export async function POST(req: Request) {
  const auth = await requireAuthenticatedUser(req);
  if (!auth.ok) {
    return NextResponse.json({ error: auth.message }, { status: auth.status });
  }

  const body = (await req.json()) as {
    articleSlug?: string;
    content?: string;
  };
  const articleSlug = body.articleSlug?.trim();
  const content = body.content?.trim();

  if (!articleSlug || !content) {
    return NextResponse.json({ error: 'articleSlug e content obrigatorios' }, { status: 400 });
  }

  const article = await queryOne<{ id: string }>(
    'select id from news_articles where slug = $1 limit 1',
    [articleSlug],
  );
  if (!article?.id) {
    return NextResponse.json({ error: 'Artigo nao encontrado' }, { status: 404 });
  }

  const inserted = await queryRows<CommentRow>(
    `insert into comments (article_id, user_id, content)
     values ($1, $2, $3)
     returning
       id,
       $4::text as article_slug,
       content,
       user_id,
       null::text as author_name,
       null::text as author_avatar,
       created_at,
       updated_at`,
    [article.id, auth.session.authUser.id, content, articleSlug],
  );

  const comment = inserted[0];
  if (!comment) {
    return NextResponse.json({ error: 'Falha ao criar comentario' }, { status: 500 });
  }

  return NextResponse.json(
    {
      ...mapComment(comment),
      author: {
        id: auth.session.authUser.id,
        name: auth.session.authUser.name,
        avatar: auth.session.authUser.avatar,
      },
      authorName: auth.session.authUser.name,
      authorAvatar: auth.session.authUser.avatar,
    },
    { status: 201 },
  );
}

export async function PATCH(req: Request) {
  const auth = await requireAuthenticatedUser(req);
  if (!auth.ok) {
    return NextResponse.json({ error: auth.message }, { status: auth.status });
  }

  const body = (await req.json()) as { commentId?: string; content?: string };
  const commentId = body.commentId?.trim();
  const content = body.content?.trim();
  if (!commentId || !content) {
    return NextResponse.json({ error: 'commentId e content obrigatorios' }, { status: 400 });
  }

  const isAdmin = auth.session.authUser.role === 'admin';
  const result = await queryRows<CommentRow>(
    `update comments c
        set content = $1,
            updated_at = now()
       from news_articles na
      where c.id = $2
        and na.id = c.article_id
        and ($3::boolean = true or c.user_id = $4::uuid)
      returning
        c.id,
        na.slug as article_slug,
        c.content,
        c.user_id,
        null::text as author_name,
        null::text as author_avatar,
        c.created_at,
        c.updated_at`,
    [content, commentId, isAdmin, auth.session.authUser.id],
  );

  if (!result[0]) {
    return NextResponse.json({ error: 'Comentario nao encontrado ou sem permissao' }, { status: 404 });
  }

  return NextResponse.json({
    ...mapComment(result[0]),
    author: {
      id: result[0].user_id,
      name: auth.session.authUser.name,
      avatar: auth.session.authUser.avatar,
    },
    authorName: auth.session.authUser.name,
    authorAvatar: auth.session.authUser.avatar,
  });
}

export async function DELETE(req: Request) {
  const auth = await requireAuthenticatedUser(req);
  if (!auth.ok) {
    return NextResponse.json({ error: auth.message }, { status: auth.status });
  }

  const { searchParams } = new URL(req.url);
  const commentId = searchParams.get('commentId')?.trim();
  if (!commentId) {
    return NextResponse.json({ error: 'commentId obrigatorio' }, { status: 400 });
  }

  const isAdmin = auth.session.authUser.role === 'admin';
  const result = await query(
    `delete from comments
      where id = $1
        and ($2::boolean = true or user_id = $3::uuid)`,
    [commentId, isAdmin, auth.session.authUser.id],
  );

  if ((result.rowCount ?? 0) === 0) {
    return NextResponse.json({ error: 'Comentario nao encontrado ou sem permissao' }, { status: 404 });
  }

  return NextResponse.json({ ok: true });
}
