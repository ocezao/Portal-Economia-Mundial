/**
 * Configuração de Conteúdo
 * Categorias, tags e metadados de conteúdo
 */

export const CONTENT_CONFIG = {
  categories: {
    geopolitica: {
      slug: 'geopolitica',
      name: 'Geopolítica',
      description: 'Análises de relações internacionais, conflitos, diplomacia e poder global',
      color: '#c40000',
      icon: 'globe',
      priority: 1,
    },
    economia: {
      slug: 'economia',
      name: 'Economia',
      description: 'Mercados financeiros, política monetária, comércio global e indicadores econômicos',
      color: '#111111',
      icon: 'trending-up',
      priority: 2,
    },
    tecnologia: {
      slug: 'tecnologia',
      name: 'Tecnologia',
      description: 'Inovação, inteligência artificial, cibersegurança e transformação digital',
      color: '#6b6b6b',
      icon: 'cpu',
      priority: 3,
    },
    // Novas subcategorias - Alto CPC/RPM para AdSense
    'relacoes-internacionais': {
      slug: 'relacoes-internacionais',
      name: 'Relações Internacionais',
      description: 'Diplomacia, tratados internacionais, summits globais e relações entre países',
      color: '#c40000',
      icon: 'globe',
      priority: 4,
    },
    conflitos: {
      slug: 'conflitos',
      name: 'Conflitos e Segurança',
      description: 'Guerras, terrorismo, defesa militar e conflitos regionais',
      color: '#8b0000',
      icon: 'shield',
      priority: 5,
    },
    'comercio-global': {
      slug: 'comercio-global',
      name: 'Comércio Global',
      description: 'Guerras comerciais, tarifas, acordos de livre comércio eOMC',
      color: '#dc143c',
      icon: 'truck',
      priority: 6,
    },
    'blocos-economicos': {
      slug: 'blocos-economicos',
      name: 'Blocos Econômicos',
      description: 'G20, BRICS, União Europeia, OPEC e outros blocos econômicos',
      color: '#b22222',
      icon: 'building',
      priority: 7,
    },
    criptomoedas: {
      slug: 'criptomoedas',
      name: 'Criptomoedas',
      description: 'Bitcoin, Ethereum, regulação de criptoativos e mercado de crypto',
      color: '#f7931a',
      icon: 'bitcoin',
      priority: 8,
    },
    investimentos: {
      slug: 'investimentos',
      name: 'Investimentos',
      description: 'Carteira de investimentos, renda fixa, переменных e wealth management',
      color: '#2e8b57',
      icon: 'trending-up',
      priority: 9,
    },
    startups: {
      slug: 'startups',
      name: 'Startups e Tech',
      description: 'Venture capital, IPOs, unicórnios e inovação empresarial',
      color: '#4169e1',
      icon: 'rocket',
      priority: 10,
    },
    energia: {
      slug: 'energia',
      name: 'Energia e Commodities',
      description: 'Petróleo, gás natural, energia renovável e commodities',
      color: '#228b22',
      icon: 'zap',
      priority: 11,
    },
    'politica-monetaria': {
      slug: 'politica-monetaria',
      name: 'Política Monetária',
      description: 'Fed, Banco Central, juros,Inflação e política monetária',
      color: '#191970',
      icon: 'bank',
      priority: 12,
    },
    'mercados-financeiros': {
      slug: 'mercados-financeiros',
      name: 'Mercados Financeiros',
      description: 'Ações, títulos, forex, índices bursáteis e análise de mercado',
      color: '#006400',
      icon: 'line-chart',
      priority: 13,
    },
  },
  
  regions: [
    { code: 'BR', name: 'Brasil', nameEn: 'Brazil' },
    { code: 'NA', name: 'América do Norte', nameEn: 'North America' },
    { code: 'EU', name: 'Europa', nameEn: 'Europe' },
    { code: 'AS', name: 'Ásia', nameEn: 'Asia' },
    { code: 'AF', name: 'África', nameEn: 'Africa' },
    { code: 'SA', name: 'América do Sul', nameEn: 'South America' },
    { code: 'ME', name: 'Oriente Médio', nameEn: 'Middle East' },
    { code: 'OC', name: 'Oceania', nameEn: 'Oceania' },
  ],
  
  interests: [
    { id: 'markets', name: 'Mercados Financeiros', nameEn: 'Financial Markets' },
    { id: 'crypto', name: 'Criptomoedas', nameEn: 'Cryptocurrencies' },
    { id: 'ai', name: 'Inteligência Artificial', nameEn: 'Artificial Intelligence' },
    { id: 'trade', name: 'Comércio Internacional', nameEn: 'International Trade' },
    { id: 'energy', name: 'Energia', nameEn: 'Energy' },
    { id: 'defense', name: 'Defesa e Segurança', nameEn: 'Defense & Security' },
    { id: 'climate', name: 'Meio Ambiente', nameEn: 'Environment' },
    { id: 'innovation', name: 'Inovação', nameEn: 'Innovation' },
    { id: 'policy', name: 'Política Econômica', nameEn: 'Economic Policy' },
    { id: 'startups', name: 'Startups', nameEn: 'Startups' },
  ],
  
  authors: {
    'ana-silva': {
      id: 'ana-silva',
      name: 'Ana Silva',
      role: 'Editora Chefe',
      bio: 'Jornalista com 15 anos de experiência em cobertura econômica internacional.',
      avatar: '/images/authors/ana-silva.webp',
      social: { twitter: '@anasilvajornal', linkedin: 'ana-silva' },
    },
    'carlos-mendes': {
      id: 'carlos-mendes',
      name: 'Carlos Mendes',
      role: 'Analista de Mercados',
      bio: 'Economista e especialista em mercados emergentes.',
      avatar: '/images/authors/carlos-mendes.webp',
      social: { twitter: '@cmendeseco', linkedin: 'carlos-mendes' },
    },
    'maria-oliveira': {
      id: 'maria-oliveira',
      name: 'Maria Oliveira',
      role: 'Correspondente Internacional',
      bio: 'Baseada em Bruxelas, cobre União Europeia e relações transatlânticas.',
      avatar: '/images/authors/maria-oliveira.webp',
      social: { twitter: '@mariaoliveirabr', linkedin: 'maria-oliveira' },
    },
    'pedro-santos': {
      id: 'pedro-santos',
      name: 'Pedro Santos',
      role: 'Editor de Tecnologia',
      bio: 'Especialista em IA, cibersegurança e transformação digital.',
      avatar: '/images/authors/pedro-santos.webp',
      social: { twitter: '@pedrosantostech', linkedin: 'pedro-santos' },
    },
    'julia-costa': {
      id: 'julia-costa',
      name: 'Julia Costa',
      role: 'Analista Política',
      bio: 'Doutora em Relações Internacionais pela Universidade de São Paulo.',
      avatar: '/images/authors/julia-costa.webp',
      social: { twitter: '@juliacostari', linkedin: 'julia-costa' },
    },
  },
  
  readingTime: {
    wordsPerMinute: 200,
    calculate: (content: string): number => {
      const words = content.trim().split(/\s+/).length;
      return Math.ceil(words / CONTENT_CONFIG.readingTime.wordsPerMinute);
    },
  },
  
  tags: {
    popular: [
      'Fed', 'BCB', 'Inflação', 'Juros', 'Dólar', 'Bitcoin', 'IA', 'China', 
      'EUA', 'UE', 'Guerra', 'Petróleo', 'COP', 'CPI', 'PIB'
    ],
    trending: [
      'Eleições 2024', 'Inteligência Artificial', 'Transição Energética', 
      'Criptomoedas', 'Nearshoring', 'Reshoring'
    ],
  },
} as const;

export type CategorySlug = keyof typeof CONTENT_CONFIG.categories;
export type AuthorId = keyof typeof CONTENT_CONFIG.authors;

// Helper para acessar categorias dinamicamente
export const getCategory = (slug: string) => {
  return CONTENT_CONFIG.categories[slug as CategorySlug];
};
