/**
 * Configuração de Rotas
 * Todas as rotas da aplicação centralizadas
 */

export const ROUTES = {
  // Públicas
  home: '/',
  categoria: (slug: string) => `/categoria/${slug}`,
  noticia: (slug: string) => `/noticias/${slug}`,
  sobre: '/sobre',
  privacidade: '/privacidade',
  termos: '/termos',
  cookies: '/cookies',
  login: '/login',
  register: '/cadastro',
  
  // Área do usuário
  app: {
    root: '/app',
    perfil: '/app/perfil',
    preferencias: '/app/preferencias',
    configuracoes: '/app/configuracoes',
  },
  
  // Admin
  admin: {
    root: '/admin',
    noticias: '/admin/noticias',
    novaNoticia: '/admin/noticias/nova',
    editarNoticia: (slug: string) => `/admin/noticias/editar/${slug}`,
    usuarios: '/admin/usuarios',
  },
} as const;

// Categorias principais (menu principal)
export const CATEGORIES = [
  { slug: 'geopolitica', name: 'Geopolítica', color: '#c40000', description: 'Relações internacionais e conflitos' },
  { slug: 'economia', name: 'Economia', color: '#111111', description: 'Mercados e indicadores globais' },
  { slug: 'tecnologia', name: 'Tecnologia', color: '#6b6b6b', description: 'Inovação e transformação digital' },
  { slug: 'mercados', name: 'Mercados', color: '#059669', description: 'Bolsa, ações e análises' },
  { slug: 'energia', name: 'Energia', color: '#d97706', description: 'Petróleo, renováveis e transição' },
] as const;

// Subcategorias para menu expandido
export const SUBCATEGORIES = {
  economia: [
    { slug: 'macroeconomia', name: 'Macroeconomia' },
    { slug: 'moedas', name: 'Moedas' },
    { slug: 'comercio-global', name: 'Comércio Global' },
  ],
  geopolitica: [
    { slug: 'defesa', name: 'Defesa' },
    { slug: 'analises', name: 'Análises' },
  ],
} as const;

// Todas as categorias para roteamento
export const ALL_CATEGORIES = [
  ...CATEGORIES,
  { slug: 'macroeconomia', name: 'Macroeconomia', color: '#7c3aed', description: 'Política monetária e fiscal' },
  { slug: 'moedas', name: 'Moedas', color: '#0891b2', description: 'Forex e criptomoedas' },
  { slug: 'comercio-global', name: 'Comércio Global', color: '#be123c', description: 'Trade internacional' },
  { slug: 'defesa', name: 'Defesa', color: '#4338ca', description: 'Segurança e militar' },
  { slug: 'analises', name: 'Análises', color: '#0f766e', description: 'Opinião e análise' },
] as const;

export type CategorySlug = typeof CATEGORIES[number]['slug'] | typeof ALL_CATEGORIES[number]['slug'];
