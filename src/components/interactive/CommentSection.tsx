/**
 * Seção de Comentários
 * Apenas para usuários logados
 */

import { memo, useState, useMemo, useCallback } from 'react';
import Image from 'next/image';
import { Send, Trash2, User, AlertCircle, Clock } from 'lucide-react';
import { useComments } from '@/hooks/useComments';
import { useAuth } from '@/hooks/useAuth';
import { commentService } from '@/services/comments';
import type { Comment } from '@/services/comments';
import { Button } from '@/components/ui/button';
import { ROUTES } from '@/config/routes';
import Link from 'next/link';
import { sanitizeHtmlStrict } from '@/lib/sanitize';

interface CommentSectionProps {
  articleSlug: string;
}

const MAX_CHARS = 1000;
const MIN_CHARS = 10;

export const CommentSection = memo(function CommentSection({ articleSlug }: CommentSectionProps) {
  const { isAuthenticated, user } = useAuth();
  const {
    comments,
    isLoading,
    error,
    submitError,
    canSubmit,
    cooldownSeconds,
    addComment,
    deleteComment,
  } = useComments(articleSlug);
  
  const [newComment, setNewComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // useMemo para cálculos derivados
  const charCount = useMemo(() => newComment.length, [newComment]);

  const isValidComment = useMemo(() => 
    newComment.trim().length >= MIN_CHARS && charCount <= MAX_CHARS,
  [newComment, charCount]);

  const canSubmitForm = useMemo(() => 
    !isSubmitting && canSubmit && isValidComment,
  [isSubmitting, canSubmit, isValidComment]);

  // useCallback para handlers
  const handleTextChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value;
    if (value.length <= MAX_CHARS) {
      setNewComment(value);
    }
  }, []);

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAuthenticated || !user || !isValidComment) return;

    setIsSubmitting(true);
    const success = await addComment(newComment.trim(), {
      id: user.id,
      name: user.name,
    });
    
    if (success) {
      setNewComment('');
    }
    setIsSubmitting(false);
  }, [isAuthenticated, user, isValidComment, newComment, addComment]);

  const handleDelete = useCallback(async (commentId: string, authorId: string) => {
    if (!user) return;
    if (confirm('Tem certeza que deseja excluir este comentário?')) {
      await deleteComment(commentId, authorId);
    }
  }, [user, deleteComment]);

  const formatDate = useCallback((dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  }, []);

  // Não logado - mostrar call to action
  if (!isAuthenticated) {
    return (
      <aside className="mt-12 pt-8 border-t border-[#e5e5e5]">
        <h2 className="text-xl font-bold text-[#111111] mb-4">Comentários</h2>
        <section className="p-6 bg-[#f5f5f5] rounded-lg text-center">
          <User className="w-12 h-12 mx-auto mb-4 text-[#6b6b6b]" />
          <h3 className="text-lg font-medium text-[#111111] mb-2">
            Faça login para comentar
          </h3>
          <p className="text-sm text-[#6b6b6b] mb-4">
            Participe da discussão e compartilhe sua opinião com outros leitores.
          </p>
          <Button asChild className="bg-[#c40000] hover:bg-[#a00000]">
            <Link href={ROUTES.login}>Entrar</Link>
          </Button>
        </section>
      </aside>
    );
  }

  return (
    <aside className="mt-12 pt-8 border-t border-[#e5e5e5]">
      <header className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-[#111111]">
          Comentários ({comments.length})
        </h2>
      </header>

      {/* Formulário de comentário */}
      <section className="mb-8">
        <form onSubmit={handleSubmit}>
          <fieldset>
            <legend className="sr-only">Adicionar comentário</legend>
            <section className="relative">
              <textarea
                value={newComment}
                onChange={handleTextChange}
                placeholder="Compartilhe sua opinião..."
                disabled={isSubmitting || !canSubmit}
                className="w-full min-h-[120px] p-4 border border-[#e5e5e5] rounded-lg resize-y focus:outline-none focus:ring-2 focus:ring-[#c40000] focus:border-transparent disabled:bg-[#f5f5f5] disabled:cursor-not-allowed"
                aria-label="Seu comentário"
                aria-describedby="char-count submit-help"
              />
              <footer className="flex items-center justify-between mt-2">
                <span 
                  id="char-count"
                  className={`text-xs ${
                    charCount < MIN_CHARS ? 'text-[#6b6b6b]' : 'text-[#22c55e]'
                  }`}
                >
                  {charCount}/{MAX_CHARS} caracteres
                  {charCount > 0 && charCount < MIN_CHARS && (
                    <span className="ml-2 text-[#c40000]">
                      (mínimo {MIN_CHARS})
                    </span>
                  )}
                </span>
                {!canSubmit && cooldownSeconds > 0 && (
                  <span className="flex items-center gap-1 text-xs text-[#c40000]">
                    <Clock className="w-3 h-3" />
                    Aguarde {cooldownSeconds}s
                  </span>
                )}
              </footer>
            </section>

            {submitError && (
              <section 
                className="flex items-center gap-2 mt-3 p-3 bg-[#fef2f2] border border-[#fecaca] rounded-lg text-sm text-[#dc2626]"
                role="alert"
              >
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                {submitError}
              </section>
            )}

            <section className="mt-4 flex justify-end">
              <Button
                type="submit"
                disabled={!canSubmitForm}
                className="bg-[#c40000] hover:bg-[#a00000] disabled:opacity-50"
                aria-busy={isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <span className="w-4 h-4 mr-2 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Enviando...
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4 mr-2" />
                    Enviar comentário
                  </>
                )}
              </Button>
            </section>
          </fieldset>
        </form>
      </section>

      {/* Lista de comentários */}
      {isLoading ? (
        <section className="text-center py-8" role="status" aria-live="polite">
          <span className="inline-block w-8 h-8 border-2 border-[#e5e5e5] border-t-[#c40000] rounded-full animate-spin" />
          <p className="mt-2 text-sm text-[#6b6b6b]">Carregando comentários...</p>
        </section>
      ) : error ? (
        <section className="p-4 bg-[#fef2f2] border border-[#fecaca] rounded-lg text-sm text-[#dc2626]">
          {error}
        </section>
      ) : comments.length === 0 ? (
        <section className="text-center py-8 text-[#6b6b6b]">
          <p>Nenhum comentário ainda. Seja o primeiro a comentar!</p>
        </section>
      ) : (
        <ul className="space-y-4" role="list" aria-label="Lista de comentários">
          {comments.map((comment) => (
            <CommentItem
              key={comment.id}
              comment={comment}
              user={user}
              onDelete={handleDelete}
              formatDate={formatDate}
            />
          ))}
        </ul>
      )}
    </aside>
  );
});
CommentSection.displayName = 'CommentSection';

// Componente interno para item de comentário - otimizado com memo
interface CommentItemProps {
  comment: Comment;
  user: { id: string } | null;
  onDelete: (commentId: string, userId: string) => void;
  formatDate: (dateString: string) => string;
}

const CommentItem = memo(function CommentItem({ 
  comment, 
  user, 
  onDelete, 
  formatDate 
}: CommentItemProps) {
  const canDelete = user && commentService.canDeleteComment(comment, user.id);

  const handleDelete = useCallback(() => {
    onDelete(comment.id, user?.id || '');
  }, [onDelete, comment.id, user?.id]);

  return (
    <li>
      <article className="p-4 bg-[#f9fafb] rounded-lg">
        <header className="flex items-start justify-between mb-3">
          <section className="flex items-center gap-3">
            <figure className="w-10 h-10 rounded-full bg-[#e5e5e5] flex items-center justify-center flex-shrink-0 relative overflow-hidden">
              {comment.authorAvatar ? (
                <Image
                  src={comment.authorAvatar}
                  alt=""
                  fill
                  sizes="40px"
                  className="object-cover rounded-full"
                />
              ) : (
                <User className="w-5 h-5 text-[#6b6b6b]" />
              )}
            </figure>
            <section>
              <p className="font-medium text-[#111111]">{comment.authorName}</p>
              <time 
                dateTime={comment.createdAt}
                className="text-xs text-[#6b6b6b]"
              >
                {formatDate(comment.createdAt)}
                {comment.updatedAt && ' (editado)'}
              </time>
            </section>
          </section>
          
          {canDelete && (
            <button
              onClick={handleDelete}
              className="p-2 text-[#6b6b6b] hover:text-[#c40000] transition-colors"
              aria-label="Excluir comentário"
              title="Excluir comentário"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}
        </header>
        
        <p 
          className={`text-[#111111] whitespace-pre-wrap ${
            comment.isDeleted ? 'text-[#6b6b6b] italic' : ''
          }`}
          // SECURITY: Conteúdo sanitizado para prevenir XSS
          dangerouslySetInnerHTML={{
            __html: sanitizeHtmlStrict(comment.content)
          }}
        />
      </article>
    </li>
  );
});
CommentItem.displayName = 'CommentItem';
