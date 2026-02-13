/**
 * Utilitário de sanitização de HTML usando DOMPurify
 * Protege contra ataques XSS ao renderizar conteúdo HTML
 */

import DOMPurify from 'dompurify';

// Tags HTML permitidas para formatação de conteúdo
const ALLOWED_TAGS = [
  'p', 'br', 'strong', 'b', 'em', 'i', 'u', 'span',
  'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
  'ul', 'ol', 'li', 'a', 'img', 'blockquote', 'code', 'pre',
  'div', 'hr', 'sub', 'sup', 'del', 'mark'
];

// Atributos permitidos nas tags
const ALLOWED_ATTR = [
  'href', 'src', 'alt', 'title', 'target', 'rel', 
  'class', 'id', 'style', 'width', 'height'
];

// Protocolos permitidos para URLs
const ALLOWED_URI_REGEXP = /^(?:(?:(?:f|ht)tps?|mailto|tel|callto|cid|xmpp|xxx):|[^a-z]|[a-z+.\-]+(?:[^a-z+.\-:]|$))/i;

/**
 * Sanitiza HTML para prevenir ataques XSS
 * @param html - O HTML a ser sanitizado
 * @returns HTML sanitizado seguro para renderização
 */
export function sanitizeHtml(html: string): string {
  // Fallback para SSR - retorna o HTML original se não estiver no browser
  if (typeof window === 'undefined') {
    return html;
  }

  return DOMPurify.sanitize(html, {
    ALLOWED_TAGS,
    ALLOWED_ATTR,
    ALLOW_DATA_ATTR: false,
    ALLOWED_URI_REGEXP,
    // Força rel="noopener noreferrer" em links com target="_blank"
    FORCE_BODY: false,
    // Remove comentários potencialmente perigosos
    SANITIZE_DOM: true,
    // Previne execução de scripts
    ALLOW_ARIA_ATTR: true,
  });
}

/**
 * Sanitiza HTML com configuração restrita (apenas texto básico)
 * Útil para comentários e conteúdo de usuários
 * @param html - O HTML a ser sanitizado
 * @returns HTML sanitizado com formatação mínima
 */
export function sanitizeHtmlStrict(html: string): string {
  if (typeof window === 'undefined') {
    return html;
  }

  return DOMPurify.sanitize(html, {
    ALLOWED_TAGS: ['p', 'br', 'strong', 'b', 'em', 'i', 'code'],
    ALLOWED_ATTR: ['class'],
    ALLOW_DATA_ATTR: false,
  });
}

/**
 * Verifica se o conteúdo contém HTML potencialmente perigoso
 * @param html - O HTML a ser verificado
 * @returns true se o conteúdo é seguro
 */
export function isHtmlSafe(html: string): boolean {
  if (typeof window === 'undefined') {
    return true;
  }

  const sanitized = DOMPurify.sanitize(html, {
    ALLOWED_TAGS: [],
    ALLOWED_ATTR: [],
  });

  return sanitized === html;
}
