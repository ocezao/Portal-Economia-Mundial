/**
 * Converte URLs de imagem para .webp quando possível.
 * Mantém URLs já em webp ou sem extensão conhecida.
 */

const IMAGE_EXT_REGEX = /\.(png|jpe?g|gif|bmp|tiff|svg)(\?.*)?$/i;

export function toWebpUrl(url: string): string {
  if (!url) return url;
  if (url.toLowerCase().endsWith('.webp')) return url;
  if (!IMAGE_EXT_REGEX.test(url)) return url;

  return url.replace(IMAGE_EXT_REGEX, '.webp$2');
}
