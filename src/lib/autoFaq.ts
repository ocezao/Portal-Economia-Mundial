import type { FaqItem } from '@/config/seo';

interface FaqTemplate {
  keywords: string[];
  questions: (title: string, category: string) => FaqItem[];
}

const economyFaqs = (title: string): FaqItem[] => [
  {
    question: `O que é "${title}"?`,
    answer: `Este artigo aborda os principais desenvolvimentos econômicos relacionados a "${title}", com análise de especialistas e dados de fontes oficiais.`,
  },
  {
    question: `Quais são as Implications de "${title}" para o Brasil?`,
    answer: `As Implications para o Brasil variam conforme o contexto específico. Monitoramos de perto os desenvolvimentos e publicamos análises detalhadas.`,
  },
  {
    question: `Onde encontrar mais informações sobre "${title}"?`,
    answer: `Para informações adicionais, recomenda-se consultar fontes oficiais como Banco Central, Ministério da Economia e organismos internacionais.`,
  },
];

const cryptoFaqs = (title: string): FaqItem[] => [
  {
    question: `O que aconteceu com ${title}?`,
    answer: `Este artigo detalha os principais acontecimentos relacionados a ${title} no mercado de criptomoedas, com análise de especialistas.`,
  },
  {
    question: `É seguro investir em criptomoedas após ${title}?`,
    answer: `O mercado de criptomoedas é volátil e apresenta riscos. Sempre faça sua própria pesquisa e considere consultar um asesor financeiro antes de investir.`,
  },
  {
    question: `Onde acompanhar atualizações sobre ${title}?`,
    answer: `Acompanhe nossas publicações diárias para ficar atualizado sobre os principais desenvolvimentos do mercado de criptomoedas.`,
  },
];

const geopoliticsFaqs = (title: string): FaqItem[] => [
  {
    question: `O que significa "${title}" para o Brasil?`,
    answer: `Este artigo analisa as Implications de "${title}" para a economia brasileira e as relações internacionais do país.`,
  },
  {
    question: `Quais países são afetados por "${title}"?`,
    answer: `${title} tem Implications globais. Monitoramos os principais impactos em diferentes regiões e publicamos análises detalhadas.`,
  },
  {
    question: `Onde encontrar informações oficiais sobre "${title}"?`,
    answer: `Recomendamos consultar fontes oficiais como Itamaraty, ONU, e organismos internacionais para informações verificadas.`,
  },
];

const technologyFaqs = (title: string): FaqItem[] => [
  {
    question: `O que é "${title}"?`,
    answer: `${title} representa uma evolução significativa no setor de tecnologia. Este artigo traz os principais detalhes e análises.`,
  },
  {
    question: `Como "${title}" afeta o mercado?`,
    answer: `As Implications de "${title}" para o mercado de tecnologia são analisadas por especialistas em nossa publicação.`,
  },
  {
    question: `Quais empresas estão envolvidas em "${title}"?`,
    answer: `Este artigo apresenta as principais empresas e organizações relacionadas a "${title}", com análise de mercado.`,
  },
];

const generalFaqs = (title: string): FaqItem[] => [
  {
    question: `O que significa "${title}"?`,
    answer: `Este artigo traz uma análise completa sobre "${title}", com informações de fontes confiáveis e especialistas do setor.`,
  },
  {
    question: `Onde posso saber mais sobre "${title}"?`,
    answer: `Para mais informações, recomendamos acompanhar nossas publicações e consultar fontes oficiais sobre o tema.`,
  },
  {
    question: `Este conteúdo é atualizado?`,
    answer: `Sim, publicamos análises atualizadas diariamente. Siga-nos para receber as últimas notícias sobre este e outros tópicos.`,
  },
];

const categoryFaqs: Record<string, (title: string) => FaqItem[]> = {
  economia: economyFaqs,
  cryptomoedas: cryptoFaqs,
  bitcoin: cryptoFaqs,
  geopolitica: geopoliticsFaqs,
  tecnologia: technologyFaqs,
};

export function generateAutoFaqs(title: string, category: string): FaqItem[] {
  const normalizedCategory = category.toLowerCase();
  
  const faqGenerator = categoryFaqs[normalizedCategory] || generalFaqs;
  
  return faqGenerator(title);
}

export function generateContextualFaqs(
  title: string,
  category: string,
  tags: string[],
  content: string
): FaqItem[] {
  const baseFaqs = generateAutoFaqs(title, category);
  
  const contextualFaqs: FaqItem[] = [];
  
  if (tags.some(t => t.toLowerCase().includes('inflação') || t.toLowerCase().includes('juros'))) {
    contextualFaqs.push({
      question: `Como "${title}" afeta a inflação no Brasil?`,
      answer: `A relação entre este tópico e a inflação é analisada considerando dados do Banco Central e projeções do mercado.`,
    });
  }
  
  if (tags.some(t => t.toLowerCase().includes('dólar') || t.toLowerCase().includes('moeda'))) {
    contextualFaqs.push({
      question: `Como "${title}" impacta o câmbio?`,
      answer: `Este artigo analisa as Implications deste cenário para o mercado de câmbio brasileiro.`,
    });
  }
  
  if (tags.some(t => t.toLowerCase().includes('bovespa') || t.toLowerCase().includes('bolsa'))) {
    contextualFaqs.push({
      question: `Como "${title}" afeta a bolsa de valores?`,
      answer: `Analisamos o impacto deste cenário nos principais índices da bolsa brasileira.`,
    });
  }
  
  if (tags.some(t => t.toLowerCase().includes('china') || t.toLowerCase().includes('eua') || t.toLowerCase().includes('estados unidos'))) {
    contextualFaqs.push({
      question: `Qual o impacto de "${title}" nas relações internacionais?`,
      answer: `Este artigo traz análise sobre as Implications geopolíticas deste cenário.`,
    });
  }
  
  return [...baseFaqs, ...contextualFaqs].slice(0, 5);
}
