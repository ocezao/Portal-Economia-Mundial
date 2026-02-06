/**
 * Serviço de comentários usando Supabase
 */

import { supabase } from '@/lib/supabaseClient';
import type {
  Comment,
  GetCommentsParams,
  CreateCommentParams,
  DeleteCommentParams,
} from './types';

// Função auxiliar para verificar se usuário pode deletar comentário
function canDeleteComment(comment: Comment, userId: string): boolean {
  return comment.author?.id === userId || comment.authorId === userId;
}

export const commentService = {
  canDeleteComment,
  async getComments({ articleSlug, sortBy = 'newest', limit = 50 }: GetCommentsParams): Promise<Comment[]> {
    const { data, error } = await supabase
      .from('comments')
      .select('*')
      .eq('article_slug', articleSlug)
      .order('created_at', { ascending: sortBy === 'oldest' })
      .limit(limit);

    if (error) {
      console.error('Erro ao buscar comentários:', error);
      return [];
    }

    return (data || []).map((item): Comment => ({
      id: item.id,
      articleSlug: item.article_slug,
      content: item.content,
      author: item.author,
      createdAt: item.created_at,
      updatedAt: item.updated_at,
      likes: item.likes || 0,
      parentId: item.parent_id,
    }));
  },

  async createComment(
    { articleSlug, content, parentId }: CreateCommentParams,
    author: Comment['author']
  ): Promise<Comment> {
    const { data, error } = await supabase
      .from('comments')
      .insert({
        article_slug: articleSlug,
        content,
        author,
        parent_id: parentId || null,
      })
      .select()
      .single();

    if (error) {
      throw new Error(error.message);
    }

    return {
      id: data.id,
      articleSlug: data.article_slug,
      content: data.content,
      author: data.author,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
      likes: data.likes || 0,
      parentId: data.parent_id,
    };
  },

  async deleteComment({ commentId, authorId }: DeleteCommentParams): Promise<void> {
    // Verificar se o usuário é o autor ou admin
    const { data: comment } = await supabase
      .from('comments')
      .select('author_id')
      .eq('id', commentId)
      .single();

    if (!comment || comment.author_id !== authorId) {
      throw new Error('Não autorizado');
    }

    const { error } = await supabase
      .from('comments')
      .delete()
      .eq('id', commentId);

    if (error) {
      throw new Error(error.message);
    }
  },

  async likeComment(commentId: string, userId: string): Promise<void> {
    const { error } = await supabase.rpc('like_comment', {
      comment_id: commentId,
      user_id: userId,
    });

    if (error) {
      throw new Error(error.message);
    }
  },
};
