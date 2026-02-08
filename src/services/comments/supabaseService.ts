/**
 * Serviço de comentários usando Supabase
 * 
 * NOTA DE SEGURANÇA: A autorização é feita via RLS (Row Level Security)
 * no banco de dados, não no cliente. As políticas RLS garantem que:
 * - Usuários só podem deletar seus próprios comentários
 * - Admins podem deletar qualquer comentário
 * 
 * As verificações removidas abaixo eram inseguras pois dependiam de
 * dados do cliente que poderiam ser manipulados.
 */

import { supabase } from '@/lib/supabaseClient';
import type {
  Comment,
  GetCommentsParams,
  CreateCommentParams,
  DeleteCommentParams,
} from './types';

// Função auxiliar para verificar se usuário pode deletar comentário
// NOTA: Esta função é apenas para UI/UX, a verificação real é feita via RLS
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
      authorId: item.user_id,
      authorName: item.author?.name,
      authorAvatar: item.author?.avatar,
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
    // Obter usuário autenticado
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      throw new Error('Usuário não autenticado');
    }

    const { data, error } = await supabase
      .from('comments')
      .insert({
        article_slug: articleSlug,
        content,
        author,
        user_id: user.id,
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
      authorId: data.user_id,
      authorName: data.author?.name,
      authorAvatar: data.author?.avatar,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
      likes: data.likes || 0,
      parentId: data.parent_id,
    };
  },

  async deleteComment({ commentId, authorId }: DeleteCommentParams): Promise<void> {
    // NOTA: A verificação de autorização é feita via RLS no banco de dados
    // A política "Users can delete own comments" garante que:
    // - auth.uid() = user_id (próprio comentário)
    // - OU o usuário é admin (verificado via profiles.role)
    
    // Não precisamos mais buscar o comentário e verificar no cliente
    // Isso era INSEGURO pois os dados poderiam ser manipulados
    
    const { error } = await supabase
      .from('comments')
      .delete()
      .eq('id', commentId);

    if (error) {
      // Erro 403 da RLS vem como erro normal
      if (error.message?.includes('permission') || ('code' in error && error.code === '42501')) {
        throw new Error('Não autorizado: você só pode deletar seus próprios comentários');
      }
      throw new Error(error.message);
    }
  },

  async updateComment(commentId: string, content: string): Promise<Comment> {
    // NOTA: A verificação de autorização é feita via RLS
    // Apenas o dono do comentário pode atualizá-lo
    
    const { data, error } = await supabase
      .from('comments')
      .update({ content, updated_at: new Date().toISOString() })
      .eq('id', commentId)
      .select()
      .single();

    if (error) {
      if (error.message?.includes('permission') || ('code' in error && error.code === '42501')) {
        throw new Error('Não autorizado: você só pode editar seus próprios comentários');
      }
      throw new Error(error.message);
    }

    return {
      id: data.id,
      articleSlug: data.article_slug,
      content: data.content,
      author: data.author,
      authorId: data.user_id,
      authorName: data.author?.name,
      authorAvatar: data.author?.avatar,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
      likes: data.likes || 0,
      parentId: data.parent_id,
    };
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
