/**
 * ⚠️ CLIENTE PARA GERAÇÃO DE NOTÍCIA - FUNCIONALIDADE REMOVIDA
 * 
 * A Edge Function `ai-news` foi removida do projeto.
 * A funcionalidade de geração de notícias com IA foi descontinuada.
 * 
 * Para busca de notícias, use diretamente a API GNews.
 * 
 * @deprecated Esta funcionalidade foi removida. Não usar.
 */

export type AiNewsResponse = {
  title: string;
  subtitle: string;
  seoTitle: string;
  seoDescription: string;
  tags: string[];
  excerpt: string;
  contentHtml: string;
  category: 'economia' | 'geopolitica' | 'tecnologia';
  author?: string;
  sources?: Array<{ title: string; url: string; source: string; publishedAt: string }>;
};

/**
 * @deprecated Funcionalidade removida. Sempre retorna erro.
 */
export async function generateAiNews(_input: {
  topic?: string;
  category?: 'economia' | 'geopolitica' | 'tecnologia';
  questions?: string;
}): Promise<AiNewsResponse> {
  throw new Error(
    'Funcionalidade de geração de notícias com IA foi removida. ' +
    'Use a API GNews diretamente para busca de notícias.'
  );
}
