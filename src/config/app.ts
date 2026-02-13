/**
 * Configuração Global da Aplicação
 * Cenario Internacional - CIN
 */

export const APP_CONFIG = {
  brand: {
    name: 'Cenario Internacional',
    short: 'CIN',
    tagline: 'Notícias que movem o mundo',
    founded: 2024,
    // Keep this pointing to a real, existing asset in `public/`.
    logo: '/favicon.ico',
    favicon: '/favicon.ico',
  },
  
  contact: {
    email: 'contato@cenariointernacional.com.br',
    phone: '+55 11 3000-0000',
    address: 'São Paulo, SP - Brasil',
    social: {
      twitter: '@cenariointernacional',
      facebook: 'cenariointernacional',
      instagram: '@cenario.internacional',
      linkedin: 'cenario-internacional',
      youtube: 'CenarioInternacional',
    },
  },
  
  urls: {
    base: 'https://cenariointernacional.com.br',
    api: 'https://api.cenariointernacional.com.br',
    cdn: 'https://cdn.cenariointernacional.com.br',
  },
  
  features: {
    readingLimit: 0.2, // 20% para não-logados
    maxFreeArticles: 3,
    enableTranslation: true,
    // Allow disabling in E2E/preview environments to avoid flaky external dependencies.
    enableMarketTicker: process.env.NEXT_PUBLIC_ENABLE_MARKET_TICKER !== 'false',
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
