import { NextResponse } from 'next/server';

import { query, queryOne } from '@/lib/db';
import { requireAuthenticatedUser } from '@/lib/server/localAuth';

type CommentOwnership = {
  id: string;
  article_id: string;
  user_id: string;
  content: string;
  created_at: string;
  updated_at: string;
};

export async function PATCH(req: Request, context: { params: Promise<{ commentId: string }> }) {
  try {
    const auth = await requireAuthenticatedUser(req);
    if (!auth.ok) {
      return NextResponse.json({ error: auth.message }, { status: auth.status });
    }

    const { commentId } = await context.params;
    const payload = (await req.json().catch(() => ({}))) as { content?: string };
    const content = payload.content?.trim();
    if (!content) {
      return NextResponse.json({ error: 'content e obrigatorio' }, { status: 400 });
    }

    const existing = await queryOne<CommentOwnership>(
      'select id, article_id, user_id, content, created_at, updated_at from public.comments where id = $1 limit 1',
      [commentId],
    );

    if (!existing) {
      return NextResponse.json({ error: 'Comentario nao encontrado' }, { status: 404 });
    }

    if (existing.user_id !== auth.session.authUser.id) {
      return NextResponse.json({ error: 'Nao autorizado' }, { status: 403 });
    }

    await query('update public.comments set content = $2, updated_at = now() where id = $1', [commentId, content]);

    return NextResponse.json({
      comment: {
        id: existing.id,
        articleSlug: existing.article_id,
        content,
        author: {
          id: auth.session.authUser.id,
          name: auth.session.authUser.name,
          avatar: auth.session.authUser.avatar,
        },
        authorId: auth.session.authUser.id,
        authorName: auth.session.authUser.name,
        authorAvatar: auth.session.authUser.avatar,
        createdAt: existing.created_at,
        updatedAt: new Date().toISOString(),
        parentId: null,
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Erro interno do servidor';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function DELETE(req: Request, context: { params: Promise<{ commentId: string }> }) {
  try {
    const auth = await requireAuthenticatedUser(req);
    if (!auth.ok) {
      return NextResponse.json({ error: auth.message }, { status: auth.status });
    }

    const { commentId } = await context.params;
    const existing = await queryOne<{ user_id: string }>(
      'select user_id from public.comments where id = $1 limit 1',
      [commentId],
    );

    if (!existing) {
      return NextResponse.json({ error: 'Comentario nao encontrado' }, { status: 404 });
    }

    const canDelete = existing.user_id === auth.session.authUser.id || auth.session.authUser.role === 'admin';
    if (!canDelete) {
      return NextResponse.json({ error: 'Nao autorizado' }, { status: 403 });
    }

    await query('delete from public.comments where id = $1', [commentId]);
    return NextResponse.json({ ok: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Erro interno do servidor';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
