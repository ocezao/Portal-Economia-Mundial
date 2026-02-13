/**
 * Configuração de Autores - E-E-A-T Signals
 * Informações completas para schema.org Person e credibility signals
 */

import { APP_CONFIG } from './app';

export interface Author {
  slug: string;
  name: string;
  shortName: string;
  title: string;
  bio: string;
  longBio: string;
  photo: string;
  email: string;
  social: {
    twitter?: string;
    linkedin?: string;
    facebook?: string;
    instagram?: string;
  };
  expertise: string[];
  education: {
    institution: string;
    degree: string;
    year: string;
  }[];
  awards: string[];
  languages: string[];
  joinedAt: string;
  isActive: boolean;
  factChecker?: boolean;
  editor?: boolean;
}

export const AUTHORS: Record<string, Author> = {
  'ana-silva': {
    slug: 'ana-silva',
    name: 'Ana Carolina Silva',
    shortName: 'Ana Silva',
    title: 'Editora Chefe',
    bio: 'Jornalista com 15 anos de experiência em cobertura econômica internacional. Especialista em mercados emergentes e geopolítica.',
    longBio: `Ana Carolina Silva é Editora Chefe do Cenario Internacional desde 2019. Com mais de 15 anos de experiência em jornalismo econômico, Ana liderou coberturas de eventos globais como a crise financeira de 2008, a pandemia de COVID-19 e as transições políticas em mercados emergentes.

Formada em Jornalismo pela USP e com MBA em Economia Internacional pela FGV, Ana construiu uma carreira marcada pela precisão analítica e rigor na checagem de fatos. Antes de integrar o CIN, trabalhou como correspondente internacional para importantes veículos brasileiros, com passagens por Londres, Nova York e Singapura.

Sua abordagem jornalística prioriza o contexto histórico e as implicações de longo prazo dos eventos econômicos, sempre com base em dados verificáveis e fontes oficiais.`,
    photo: '/images/authors/ana-silva.webp',
    email: 'ana.silva@cenariointernacional.com.br',
    social: {
      twitter: 'anacsilva_jorn',
      linkedin: 'anacarolinasilva',
    },
    expertise: [
      'Economia Internacional',
      'Mercados Emergentes',
      'Geopolítica',
      'Política Monetária',
      'Comércio Global',
    ],
    education: [
      {
        institution: 'Universidade de São Paulo (USP)',
        degree: 'Bacharelado em Jornalismo',
        year: '2008',
      },
      {
        institution: 'Fundação Getúlio Vargas (FGV)',
        degree: 'MBA em Economia Internacional',
        year: '2012',
      },
    ],
    awards: [
      'Prêmio Esso de Jornalismo Econômico (2019)',
      'Prêmio CNBC de Melhor Cobertura Internacional (2017)',
    ],
    languages: ['Português', 'Inglês', 'Espanhol'],
    joinedAt: '2019-03-15',
    isActive: true,
    editor: true,
  },

  'carlos-mendes': {
    slug: 'carlos-mendes',
    name: 'Carlos Eduardo Mendes',
    shortName: 'Carlos Mendes',
    title: 'Analista de Mercados Sênior',
    bio: 'Economista e especialista em análise técnica de mercados financeiros. Focado em commodities e criptomoedas.',
    longBio: `Carlos Eduardo Mendes é Analista de Mercados Sênior no Cenario Internacional desde 2020. Economista formado pela PUC-Rio com especialização em Finanças Quantitativas, Carlos desenvolveu modelos preditivos para análise de tendências de mercado que são referência no portal.

Sua expertise em análise técnica e fundamentalista o tornou uma voz autorizada no acompanhamento de commodities, especialmente petróleo, minério de ferro e agrícolas. Nos últimos anos, ampliou seu foco para incluir o ecossistema de criptomoedas e ativos digitais, sempre com uma abordagem cautelosa e baseada em dados.

Antes de se juntar ao CIN, Carlos trabalhou em mesas de operações de grandes instituições financeiras brasileiras, experiência que lhe proporcionou compreensão prática dos mecanismos de mercado.`,
    photo: '/images/authors/carlos-mendes.webp',
    email: 'carlos.mendes@cenariointernacional.com.br',
    social: {
      twitter: 'cmendes_econ',
      linkedin: 'carloseduardomendes',
    },
    expertise: [
      'Análise Técnica',
      'Commodities',
      'Criptomoedas',
      'Mercado de Capitais',
      'Econometria',
    ],
    education: [
      {
        institution: 'PUC-Rio',
        degree: 'Bacharelado em Economia',
        year: '2010',
      },
      {
        institution: 'INSPER',
        degree: 'Especialização em Finanças Quantitativas',
        year: '2014',
      },
    ],
    awards: ['Prêmio Anbima de Melhor Análise de Mercado (2021)'],
    languages: ['Português', 'Inglês'],
    joinedAt: '2020-06-01',
    isActive: true,
  },

  'maria-oliveira': {
    slug: 'maria-oliveira',
    name: 'Maria Fernanda Oliveira',
    shortName: 'Maria Oliveira',
    title: 'Correspondente Internacional',
    bio: 'Baseada em Bruxelas, cobre União Europeia, relações transatlânticas e política europeia.',
    longBio: `Maria Fernanda Oliveira é Correspondente Internacional do Cenario Internacional em Bruxelas desde 2021. Jornalista especializada em assuntos europeus, Maria oferece cobertura em primeira mão das decisões do Parlamento Europeu, Comissão Europeia e Conselho Europeu que impactam o comércio global.

Formada em Relações Internacionais pela UnB e com mestrado em Estudos Europeus pela Université libre de Bruxelles, Maria combina conhecimento acadêmico sólido com uma rede de contatos extensa no centro decisório europeu.

Sua cobertura privilegia as implicações das políticas europeias para o Brasil e América Latina, especialmente em áreas como acordos comerciais, regulação digital e políticas climáticas.`,
    photo: '/images/authors/maria-oliveira.webp',
    email: 'maria.oliveira@cenariointernacional.com.br',
    social: {
      twitter: 'mfoliveira_brux',
      linkedin: 'mariafernandaoliveira',
    },
    expertise: [
      'Política Europeia',
      'Relações Transatlânticas',
      'Acordos Comerciais',
      'Regulação Digital',
      'Política Climática',
    ],
    education: [
      {
        institution: 'Universidade de Brasília (UnB)',
        degree: 'Bacharelado em Relações Internacionais',
        year: '2015',
      },
      {
        institution: 'Université libre de Bruxelles',
        degree: 'Mestrado em Estudos Europeus',
        year: '2018',
      },
    ],
    awards: ['Prêmio Imprensa Europeia - Câmara de Comércio UE-Brasil (2022)'],
    languages: ['Português', 'Inglês', 'Francês', 'Espanhol'],
    joinedAt: '2021-01-15',
    isActive: true,
  },

  'roberto-santos': {
    slug: 'roberto-santos',
    name: 'Roberto Santos',
    shortName: 'Roberto Santos',
    title: 'Editor de Fato',
    bio: 'Responsável pela checagem de fatos e verificação de informações. Garante a precisão e credibilidade de todas as publicações.',
    longBio: `Roberto Santos atua como Editor de Fato (Fact-Checker) do Cenario Internacional desde 2020. Jornalista com formação em Ciência Política, Roberto é responsável pela verificação rigorosa de todas as informações publicadas no portal.

Especialista em checagem de fatos e combate à desinformação, Roberto desenvolveu protocolos internos de verificação que incluem análise de fontes primárias, cruzamento de dados oficiais e consulta a especialistas. Sua atuação garante que o CIN mantenha os mais altos padrões de precisão factual.

Roberto é membro da International Fact-Checking Network (IFCN) e participa ativamente de iniciativas globais de combate à desinformação econômica e financeira.`,
    photo: '/images/authors/roberto-santos.webp',
    email: 'roberto.santos@cenariointernacional.com.br',
    social: {
      twitter: 'rsantos_check',
      linkedin: 'robertosantos',
    },
    expertise: [
      'Checagem de Fatos',
      'Análise de Fontes',
      'Combate à Desinformação',
      'Jornalismo Investigativo',
    ],
    education: [
      {
        institution: 'Universidade Federal de Pernambuco (UFPE)',
        degree: 'Bacharelado em Jornalismo',
        year: '2012',
      },
      {
        institution: 'Universidade de São Paulo (USP)',
        degree: 'Mestrado em Ciência Política',
        year: '2016',
      },
    ],
    awards: [
      'Prêmio Comprova de Checagem (2021)',
      'Certificação IFCN - International Fact-Checking Network',
    ],
    languages: ['Português', 'Inglês'],
    joinedAt: '2020-08-01',
    isActive: true,
    factChecker: true,
  },
};

// Lista de autores ativos
export const ACTIVE_AUTHORS = Object.values(AUTHORS).filter((a) => a.isActive);

// Função para buscar autor por slug
export function getAuthorBySlug(slug: string): Author | undefined {
  return AUTHORS[slug];
}

// Função para gerar JSON-LD de autor
export function generateAuthorJsonLd(author: Author, siteUrl: string) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Person',
    name: author.name,
    alternateName: author.shortName,
    jobTitle: author.title,
    description: author.bio,
    url: `${siteUrl}/autor/${author.slug}/`,
    image: `${siteUrl}${author.photo}`,
    worksFor: {
      '@type': 'NewsMediaOrganization',
      name: APP_CONFIG.brand.name,
      url: siteUrl,
    },
    alumniOf: author.education.map((edu) => ({
      '@type': 'CollegeOrUniversity',
      name: edu.institution,
    })),
    knowsAbout: author.expertise,
    award: author.awards,
    sameAs: [
      author.social.twitter && `https://twitter.com/${author.social.twitter}`,
      author.social.linkedin && `https://linkedin.com/in/${author.social.linkedin}`,
      author.social.facebook && `https://facebook.com/${author.social.facebook}`,
      author.social.instagram && `https://instagram.com/${author.social.instagram}`,
    ].filter(Boolean),
  };
}

// Função para gerar ReviewedBy schema
export function generateReviewedByJsonLd(siteUrl: string) {
  const factCheckers = Object.values(AUTHORS).filter((a) => a.factChecker);
  if (factCheckers.length === 0) return null;

  const primaryFactChecker = factCheckers[0];

  return {
    '@type': 'Person',
    name: primaryFactChecker.name,
    url: `${siteUrl}/autor/${primaryFactChecker.slug}/`,
    jobTitle: 'Editor de Fato',
    worksFor: {
      '@type': 'NewsMediaOrganization',
      name: APP_CONFIG.brand.name,
    },
  };
}
