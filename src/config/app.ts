/**
 * Configuração Global da Aplicação
 * Cenario Internacional - CIN
 */

export const APP_CONFIG = {
  brand: {
    name: 'Cenario Internacional',
    short: 'CIN',
    tagline: 'Noticias que movem o mundo',
    founded: 2024,
    logo: '/favicon.ico',
    favicon: '/favicon.ico',
  },
  
  contact: {
    email: 'contato@cenariointernacional.com.br',
    phone: '+55 11 3000-0000',
    address: 'Sao Paulo, SP - Brasil',
    social: {
      twitter: '@cenariointernacional',
      facebook: 'cenario.internacional',
      instagram: 'cenario.internacional',
      linkedin: 'company/cenario-internacional',
      youtube: 'CenarioInternacional',
    },
  },

  features: {
    enableMarketTicker: true,
    enableBreakingNews: true,
    enableNewsletter: true,
    enableComments: true,
    enableAnalytics: true,
    enablePushNotifications: false,
  },

  limits: {
    maxUploadSize: 10 * 1024 * 1024, // 10MB
    maxArticlesPerPage: 50,
    maxTrendingArticles: 10,
  },

  cache: {
    revalidateSeconds: 60,
    maxAgeSeconds: 300,
  },
};

export default APP_CONFIG;
