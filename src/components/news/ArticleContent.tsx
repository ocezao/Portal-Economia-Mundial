/**
 * Conteudo do artigo
 */

import { memo, useMemo } from 'react';
import { sanitizeHtml } from '@/lib/sanitize';
import type { NewsArticle } from '@/types';

interface ArticleContentProps {
  article: NewsArticle;
}

export const ArticleContent = memo(function ArticleContent({ article }: ArticleContentProps) {
  const sanitizedContent = useMemo(() => sanitizeHtml(article.content), [article.content]);

  return (
    <article className="prose prose-lg max-w-none">
      {/* SECURITY: Conteudo sanitizado com DOMPurify para prevenir XSS */}
      <section
        className="text-[#111111] leading-relaxed"
        dangerouslySetInnerHTML={{
          __html: sanitizedContent,
        }}
      />
    </article>
  );
});

ArticleContent.displayName = 'ArticleContent';
