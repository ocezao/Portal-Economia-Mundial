/**
 * Servico de comentarios via API local autenticada por cookie.
 */

import type {
  Comment,
  GetCommentsParams,
  CreateCommentParams,
  DeleteCommentParams,
} from './types';

function canDeleteComment(comment: Comment, userId: string): boolean {
  return comment.author?.id === userId || comment.authorId === userId;
}

async function parseJsonOrThrow(response: Response, fallback: string) {
  if (response.ok) {
    return response.json();
  }

  const payload = await response.json().catch(() => ({ error: fallback }));
  throw new Error(payload.error || fallback);
}

export const commentService = {
  canDeleteComment,

  async getComments({ articleSlug, sortBy = 'newest', limit = 50 }: GetCommentsParams): Promise<Comment[]> {
    const response = await fetch(
      `/api/comments?articleSlug=${encodeURIComponent(articleSlug)}&sortBy=${encodeURIComponent(sortBy)}&limit=${limit}`,
      { credentials: 'same-origin' },
    );

    if (!response.ok) {
      return [];
    }

    return (await response.json()) as Comment[];
  },

  async createComment(
    { articleSlug, content, parentId }: CreateCommentParams,
    author: Comment['author'],
  ): Promise<Comment> {
    const response = await fetch('/api/comments', {
      method: 'POST',
      credentials: 'same-origin',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ articleSlug, content, parentId, author }),
    });

    return (await parseJsonOrThrow(response, 'Erro ao criar comentario')) as Comment;
  },

  async deleteComment({ commentId, authorId }: DeleteCommentParams): Promise<void> {
    const response = await fetch(
      `/api/comments?commentId=${encodeURIComponent(commentId)}&authorId=${encodeURIComponent(authorId)}`,
      {
        method: 'DELETE',
        credentials: 'same-origin',
      },
    );

    await parseJsonOrThrow(response, 'Erro ao excluir comentario');
  },

  async updateComment(commentId: string, content: string): Promise<Comment> {
    const response = await fetch('/api/comments', {
      method: 'PATCH',
      credentials: 'same-origin',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ commentId, content }),
    });

    return (await parseJsonOrThrow(response, 'Erro ao atualizar comentario')) as Comment;
  },

  async likeComment(commentId: string, userId: string): Promise<void> {
    throw new Error(`Like de comentario ainda nao migrado para banco local (${commentId}/${userId})`);
  },
};
