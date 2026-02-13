/**
 * Conteúdo do Artigo com limite de leitura
 */

import { memo, useState, useMemo, useCallback } from 'react';
import { sanitizeHtml } from '@/lib/sanitize';
import { Lock, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { SurveyForm } from '@/components/interactive/SurveyForm';
import { useReadingLimit } from '@/hooks/useReadingLimit';
import { useSurvey } from '@/hooks/useSurvey';
import { APP_CONFIG } from '@/config/app';
import type { NewsArticle } from '@/types';

interface ArticleContentProps {
  article: NewsArticle;
  isLoggedIn: boolean;
}

export const ArticleContent = memo(function ArticleContent({ article, isLoggedIn }: ArticleContentProps) {
  const [showSurvey, setShowSurvey] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const { canReadFull, isUnlocked, unlockArticle, hasReachedLimit, readingLimitPercentage, limitActive } = useReadingLimit(isLoggedIn);
  const { isCompleted } = useSurvey();

  // useMemo para cálculos derivados
  const isFullyUnlocked = useMemo(() => 
    !limitActive || canReadFull || isUnlocked(article.slug) || isCompleted,
  [limitActive, canReadFull, isUnlocked, article.slug, isCompleted]);

  const limitIndex = useMemo(() => 
    Math.floor(article.content.length * readingLimitPercentage),
  [article.content.length, readingLimitPercentage]);

  const previewContent = useMemo(() => 
    article.content.slice(0, limitIndex),
  [article.content, limitIndex]);

  const fullContent = article.content;

  // useMemo para sanitização do conteúdo
  const sanitizedContent = useMemo(() => 
    sanitizeHtml(isFullyUnlocked ? fullContent : previewContent),
  [isFullyUnlocked, fullContent, previewContent]);

  // useCallback para handlers
  const handleReadFull = useCallback(() => {
    if (isCompleted) {
      unlockArticle(article.slug);
    } else {
      setShowConfirm(true);
    }
  }, [isCompleted, unlockArticle, article.slug]);

  const handleConfirm = useCallback(() => {
    setShowConfirm(false);
    setShowSurvey(true);
  }, []);

  const handleSurveyComplete = useCallback(() => {
    setShowSurvey(false);
    unlockArticle(article.slug);
  }, [unlockArticle, article.slug]);

  const handleCloseConfirm = useCallback(() => {
    setShowConfirm(false);
  }, []);

  const handleCloseSurvey = useCallback((open: boolean) => {
    setShowSurvey(open);
  }, []);

  return (
    <>
      <article className="prose prose-lg max-w-none">
        {/* Conteúdo Preview ou Completo */}
        {/* SECURITY: Conteúdo sanitizado com DOMPurify para prevenir XSS */}
        <section 
          className="text-[#111111] leading-relaxed paywall-content"
          dangerouslySetInnerHTML={{ 
            __html: sanitizedContent
          }}
        />

        {/* Bloco de Bloqueio */}
        {!isFullyUnlocked && (
          <aside className="mt-8 p-6 bg-gradient-to-b from-[#f5f5f5] to-white border border-[#e5e5e5] rounded-lg text-center">
            <Lock className="w-12 h-12 mx-auto mb-4 text-[#c40000]" />
            <h3 className="text-xl font-bold text-[#111111] mb-2">
              Continue lendo
            </h3>
            <p className="text-[#6b6b6b] mb-6 max-w-md mx-auto">
              {hasReachedLimit 
                ? 'Você atingiu o limite de leitura gratuita. Faça login para continuar.'
                : 'Desbloqueie o conteúdo completo respondendo a um breve questionário.'
              }
            </p>
            <Button
              onClick={handleReadFull}
              disabled={hasReachedLimit}
              className="bg-[#c40000] hover:bg-[#a00000] text-white px-8"
            >
              {hasReachedLimit ? 'Limite Atingido' : 'Ler Tudo'}
            </Button>
          </aside>
        )}

        {/* Conteúdo Completo Desbloqueado */}
        {isFullyUnlocked && !isLoggedIn && (
          <aside className="mt-8 p-4 bg-[#f0fdf4] border border-[#22c55e] rounded-lg flex items-center gap-3">
            <CheckCircle className="w-5 h-5 text-[#22c55e]" />
            <p className="text-sm text-[#166534]">
              Conteúdo desbloqueado! <a href={APP_CONFIG.urls.base + '/login'} className="underline font-medium">Faça login</a> para salvar seu progresso.
            </p>
          </aside>
        )}
      </article>

      {/* Dialog de Confirmação */}
      <Dialog open={showConfirm} onOpenChange={handleCloseConfirm}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Desbloquear conteúdo completo?</DialogTitle>
            <DialogDescription>
              Para acessar o artigo completo, precisamos conhecer um pouco mais sobre você. 
              O questionário leva menos de 1 minuto.
            </DialogDescription>
          </DialogHeader>
          <footer className="flex gap-3 justify-end mt-4">
            <Button variant="outline" onClick={handleCloseConfirm}>
              Agora não
            </Button>
            <Button onClick={handleConfirm} className="bg-[#c40000] hover:bg-[#a00000]">
              Continuar
            </Button>
          </footer>
        </DialogContent>
      </Dialog>

      {/* Dialog do Questionário */}
      <Dialog open={showSurvey} onOpenChange={handleCloseSurvey}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Questionário Rápido</DialogTitle>
            <DialogDescription>
              Responda algumas perguntas para personalizar sua experiência.
            </DialogDescription>
          </DialogHeader>
          <SurveyForm onComplete={handleSurveyComplete} onCancel={() => setShowSurvey(false)} />
        </DialogContent>
      </Dialog>
    </>
  );
});
ArticleContent.displayName = 'ArticleContent';
