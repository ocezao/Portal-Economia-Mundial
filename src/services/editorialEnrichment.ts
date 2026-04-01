import type { ArticleFaqItem } from '@/types';

type ArticleEnrichmentInput = {
  title: string;
  excerpt: string;
  content: string;
  category: string;
  tags?: string[];
  seoTitle?: string;
  metaDescription?: string;
  faqItems?: ArticleFaqItem[];
};

type ArticleEnrichmentResult = {
  seoTitle: string;
  metaDescription: string;
  faqItems: ArticleFaqItem[];
  editorialStatus: 'enriched';
};

function truncateAtWordBoundary(value: string, maxLength: number): string {
  const normalized = value.replace(/\s+/g, ' ').trim();
  if (normalized.length <= maxLength) return normalized;

  const truncated = normalized.slice(0, maxLength + 1);
  const lastSpace = truncated.lastIndexOf(' ');
  return `${truncated.slice(0, lastSpace > 20 ? lastSpace : maxLength).trim()}...`;
}

function normalizeFaqItems(items?: ArticleFaqItem[]): ArticleFaqItem[] {
  return (items ?? [])
    .map((item) => ({
      question: item.question.trim(),
      answer: item.answer.trim(),
    }))
    .filter((item) => item.question && item.answer);
}

function buildBrazilAwareFaqs(input: ArticleEnrichmentInput): ArticleFaqItem[] {
  const categoryName = input.category === 'geopolitica'
    ? 'a geopolítica'
    : input.category === 'tecnologia'
      ? 'o setor de tecnologia'
      : 'a economia';

  const title = input.title.trim();
  const excerpt = truncateAtWordBoundary(input.excerpt || input.content, 180);
  const hasBrazilTag = (input.tags ?? []).some((tag) => /brasil|b3|real|dolar/i.test(tag));
  const impactLabel = hasBrazilTag ? 'no Brasil' : 'para o Brasil';

  return [
    {
      question: `O que aconteceu em ${title}?`,
      answer: excerpt || `O artigo explica os pontos centrais de ${title} e o que mudou no cenário atual.`,
    },
    {
      question: `Como isso pode impactar ${impactLabel}?`,
      answer: `O texto detalha os efeitos potenciais sobre ${categoryName}, empresas, mercado e decisões de curto prazo no Brasil.`,
    },
    {
      question: 'O que precisa ser monitorado agora?',
      answer: 'Acompanhe os próximos anúncios oficiais, reações de mercado, mudanças regulatórias e qualquer revisão de projeções ligadas ao tema.',
    },
  ];
}

export function enrichEditorialArticle(input: ArticleEnrichmentInput): ArticleEnrichmentResult {
  const normalizedFaqs = normalizeFaqItems(input.faqItems);
  const seoTitle = truncateAtWordBoundary(input.seoTitle || input.title, 60);
  const metaDescription = truncateAtWordBoundary(input.metaDescription || input.excerpt || input.content, 160);

  return {
    seoTitle,
    metaDescription,
    faqItems: normalizedFaqs.length > 0 ? normalizedFaqs : buildBrazilAwareFaqs(input),
    editorialStatus: 'enriched',
  };
}
