import type { FaqItem } from '@/config/seo';

const economyFaqs = (title: string): FaqItem[] => [
  {
    question: `O que é "${title}"?`,
    answer: `Este artigo aborda os principais desenvolvimentos econômicos relacionados a "${title}", com análise de especialistas e dados de fontes oficiais.`,
  },
  {
    question: `Quais sao os impactos de "${title}" para o Brasil?`,
    answer: `Os efeitos para o Brasil dependem de cambio, inflacao, juros, comercio exterior e reacao dos mercados. Use este FAQ apenas como ponto de partida e revise com dados reais antes de publicar.`,
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
    answer: `O angulo Brasil deve explicar efeitos em diplomacia, comercio, commodities, cambio e empresas locais, sempre com base em fontes verificadas.`,
  },
  {
    question: `Quais países são afetados por "${title}"?`,
    answer: `Mapeie os principais paises e blocos afetados e complemente a resposta com dados confirmados antes de publicar.`,
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
    answer: `Explique efeitos em empresas, investimento, regulacao e adocao no Brasil com exemplos e fontes reais.`,
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
  tags: string[]
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
      answer: `Explique a transmissao para dolar, fluxo externo e precificacao de risco no Brasil com base em dados confirmados.`,
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
      answer: `Descreva os efeitos diplomaticos, comerciais e estrategicos com base em fatos verificados e fontes oficiais.`,
    });
  }
  
  return [...baseFaqs, ...contextualFaqs].slice(0, 5);
}
