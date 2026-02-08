/**
 * Configuração Global da Aplicação
 * Portal Econômico Mundial - PEM
 */

export const APP_CONFIG = {
  brand: {
    name: 'Portal Econômico Mundial',
    short: 'PEM',
    tagline: 'Notícias que movem o mundo',
    founded: 2024,
    // Keep this pointing to a real, existing asset in `public/`.
    logo: '/favicon.ico',
    favicon: '/favicon.ico',
  },
  
  contact: {
    email: 'contato@portaleconomicomundial.com',
    phone: '+55 11 3000-0000',
    address: 'São Paulo, SP - Brasil',
    social: {
      twitter: '@portalpem',
      facebook: 'portaleconomicomundial',
      instagram: '@portal.pem',
      linkedin: 'portal-economico-mundial',
      youtube: 'PortalEconomicoMundial',
    },
  },
  
  urls: {
    base: 'https://portaleconomicomundial.com',
    api: 'https://api.portaleconomicomundial.com',
    cdn: 'https://cdn.portaleconomicomundial.com',
  },
  
  features: {
    readingLimit: 0.2, // 20% para não-logados
    maxFreeArticles: 3,
    enableTranslation: true,
    enableMarketTicker: true,
    enableNotifications: true,
    darkMode: false,
  },
  
  timing: {
    animationFast: 150,
    animationNormal: 300,
    animationSlow: 500,
    debounceDelay: 300,
    throttleDelay: 100,
    marketUpdateInterval: 5000,
    readingProgressUpdate: 1000,
  },
  
  limits: {
    excerptLength: 160,
    titleLength: 70,
    relatedArticlesCount: 4,
    trendingArticlesCount: 5,
    homepageArticlesCount: 10,
    searchResultsCount: 20,
  },
} as const;

export type AppConfig = typeof APP_CONFIG;
