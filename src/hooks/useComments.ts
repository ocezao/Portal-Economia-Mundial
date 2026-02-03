/**
 * Hook para gerenciamento de comentários
 * Abstração para futura substituição por API
 */

import { useState, useEffect, useCallback } from 'react';
import { commentService } from '@/services/comments';
import type { Comment } from '@/services/comments';

interface UseCommentsReturn {
  comments: Comment[];
  isLoading: boolean;
  error: string | null;
  submitError: string | null;
  canSubmit: boolean;
  cooldownSeconds: number;
  fetchComments: () => Promise<void>;
  addComment: (content: string, author: { id: string; name: string; avatar?: string }) => Promise<boolean>;
  deleteComment: (commentId: string, userId: string) => Promise<boolean>;
}

export function useComments(articleSlug: string): UseCommentsReturn {
  const [comments, setComments] = useState<Comment[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [canSubmit, setCanSubmit] = useState(true);
  const [cooldownSeconds, setCooldownSeconds] = useState(0);

  // Buscar comentários
  const fetchComments = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await commentService.getComments({ articleSlug, sortBy: 'newest' });
      setComments(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao carregar comentários');
    } finally {
      setIsLoading(false);
    }
  }, [articleSlug]);

  // Verificar cooldown inicial
  useEffect(() => {
    const checkCooldown = () => {
      const result = commentService.canSubmit();
      setCanSubmit(result.allowed);
      setCooldownSeconds(result.remainingSeconds);
    };
    checkCooldown();
    
    const interval = setInterval(checkCooldown, 1000);
    return () => clearInterval(interval);
  }, []);

  // Carregar comentários ao montar
  useEffect(() => {
    fetchComments();
  }, [fetchComments]);

  // Adicionar comentário
  const addComment = useCallback(async (
    content: string,
    author: { id: string; name: string; avatar?: string }
  ): Promise<boolean> => {
    setSubmitError(null);
    try {
      await commentService.createComment({ articleSlug, content }, author);
      await fetchComments();
      return true;
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : 'Erro ao enviar comentário');
      return false;
    }
  }, [articleSlug, fetchComments]);

  // Deletar comentário
  const deleteComment = useCallback(async (commentId: string, userId: string): Promise<boolean> => {
    try {
      await commentService.deleteComment({ commentId, authorId: userId });
      await fetchComments();
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao excluir comentário');
      return false;
    }
  }, [fetchComments]);

  return {
    comments,
    isLoading,
    error,
    submitError,
    canSubmit,
    cooldownSeconds,
    fetchComments,
    addComment,
    deleteComment,
  };
}
