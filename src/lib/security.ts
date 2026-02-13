/**
 * Utilitários de segurança
 * Funções para sanitização, escape e validação de dados
 */

/**
 * Escapa HTML para prevenir XSS
 * Converte caracteres especiais em entidades HTML
 */
export function escapeHtml(unsafe: string): string {
  if (!unsafe || typeof unsafe !== 'string') {
    return '';
  }
  
  return unsafe
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

/**
 * Sanitiza nome de arquivo
 * Remove caracteres perigosos e path traversal
 */
export function sanitizeFilename(filename: string): string {
  if (!filename || typeof filename !== 'string') {
    return 'unnamed';
  }
  
  // Remover path traversal (/../, \..\, etc)
  const basename = filename.replace(/^[\/\\]+/, '').replace(/[\/\\]+/g, '_');
  
  // Remover caracteres de controle
  const clean = basename.replace(/[\x00-\x1f\x7f-\x9f]/g, '');
  
  // Remover caracteres especiais perigosos
  const safe = clean.replace(/[<>:"|?*]/g, '_');
  
  // Limitar tamanho
  return safe.substring(0, 255) || 'unnamed';
}

/**
 * Escapa caracteres LIKE SQL (% _ \)
 * Previne wildcard injection em consultas SQL
 */
export function escapeLikePattern(pattern: string): string {
  if (!pattern || typeof pattern !== 'string') {
    return '';
  }
  
  // Escapar caracteres especiais SQL LIKE: % _ \
  return pattern.replace(/[\\%_]/g, '\\$&');
}

/**
 * Validação de email
 */
export function isValidEmail(email: string): boolean {
  if (!email || typeof email !== 'string') {
    return false;
  }
  
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Sanitização básica de input de texto
 * Remove tags HTML e caracteres de controle
 */
export function sanitizeText(input: string): string {
  if (!input || typeof input !== 'string') {
    return '';
  }
  
  // Remover tags HTML
  const noTags = input.replace(/<[^>]*>/g, '');
  
  // Remover caracteres de controle exceto whitespace comum
  const clean = noTags.replace(/[\x00-\x08\x0b\x0c\x0e-\x1f\x7f-\x9f]/g, '');
  
  // Trim e limitar tamanho
  return clean.trim().substring(0, 10000);
}
