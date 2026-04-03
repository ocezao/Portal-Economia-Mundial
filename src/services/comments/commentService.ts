import { logger } from '@/lib/logger';
import type {
  Comment,
  GetCommentsParams,
  CreateCommentParams,
  DeleteCommentParams,
} from './types';

function canDeleteComment(comment: Comment, userId: string): boolean {
  return comment.author?.id === userId || comment.authorId === userId;
}

async function parseJson<T>(response: Response): Promise<T> {
  return response.json() as Promise<T>;
}

export const commentService = {
  canDeleteComment,

  async getComments({ articleSlug, sortBy = 'newest', limit = 50 }: GetCommentsParams): Promise<Comment[]> {
    const response = await fetch(
      `/api/comments?articleSlug=${encodeURIComponent(articleSlug)}&sortBy=${encodeURIComponent(sortBy)}&limit=${limit}`,
      {
        method: 'GET',
        credentials: 'same-origin',
      },
    );

    const json = await parseJson<{ comments?: Comment[]; error?: string }>(response);
    if (!response.ok) {
      logger.error('Erro ao buscar comentarios:', json.error);
      return [];
    }

    return json.comments ?? [];
  },

  async createComment({ articleSlug, content }: CreateCommentParams, author: Comment['author']): Promise<Comment> {
    const response = await fetch('/api/comments', {
      method: 'POST',
      credentials: 'same-origin',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ articleSlug, content, author }),
    });

    const json = await parseJson<{ comment?: Comment; error?: string }>(response);
    if (!response.ok || !json.comment) {
      throw new Error(json.error || 'Erro ao enviar comentario');
    }

    return json.comment;
  },

  async deleteComment({ commentId }: DeleteCommentParams): Promise<void> {
    const response = await fetch(`/api/comments/${encodeURIComponent(commentId)}`, {
      method: 'DELETE',
      credentials: 'same-origin',
    });

    const json = await parseJson<{ ok?: boolean; error?: string }>(response);
    if (!response.ok) {
      throw new Error(json.error || 'Erro ao excluir comentario');
    }
  },

  async updateComment(commentId: string, content: string): Promise<Comment> {
    const response = await fetch(`/api/comments/${encodeURIComponent(commentId)}`, {
      method: 'PATCH',
      credentials: 'same-origin',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ content }),
    });

    const json = await parseJson<{ comment?: Comment; error?: string }>(response);
    if (!response.ok || !json.comment) {
      throw new Error(json.error || 'Erro ao atualizar comentario');
    }

    return json.comment;
  },

  async likeComment(): Promise<void> {
    throw new Error('Curtir comentario ainda nao foi migrado para a camada local');
  },
};
