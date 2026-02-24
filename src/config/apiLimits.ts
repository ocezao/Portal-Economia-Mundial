/**
 * Configuração de Limites de API - Plano Gratuito
 * 
 * Define os limites безопасные para cada API gratuita,
 * com base nos termos de uso de cada provedór.
 */

export const API_LIMITS = {
  /**
   * Finnhub - Plano Gratuito
   * Limite: 60 calls/min (aproximadamente 86.400/dia)
   * 
   * Estratégia: Usar no máximo 500 chamadas por dia
   * para manter uma margem de segurança.
   */
  FINNHUB: {
    callsPerDay: 500,
    callsPerMinute: 60,
    buffer: 0.8, // Usar apenas 80% do limite
  },

  /**
   * GNews - Plano Gratuito
   * Limite: 100 requests por dia
   * 
   * Estratégia: Usar no máximo 80 chamadas por dia
   * Atualizar a cada 15-30 minutos.
   */
  GNEWS: {
    callsPerDay: 80,
    buffer: 0.8,
  },

  /**
   * Supabase - Plano Gratuito
   * Limite: Unlimited API requests, 500MB DB, 5GB egress
   * 
   * Estratégia: Sem limitação necessária, mas evitar
   * queries excessivas.
   */
  SUPABASE: {
    callsPerDay: Infinity,
    maxDbSize: 500 * 1024 * 1024, // 500MB
    maxEgress: 5 * 1024 * 1024 * 1024, // 5GB
  },
} as const;

/**
 * Configuração de TTL (Time To Live) para cache
 * 
 * Define quanto tempo cada tipo de dado permanece
 * válido no cache antes de precisar ser atualizado.
 */
export const CACHE_TTL = {
  /** Notícias de mercado - 15 minutos */
  MARKET_NEWS: 15 * 60 * 1000,
  
  /** Calendário de earnings - 1 hora */
  EARNINGS: 60 * 60 * 1000,
  
  /** Índices globais - 5 minutos */
  INDICES: 5 * 60 * 1000,
  
  /** Commodities - 15 minutos */
  COMMODITIES: 15 * 60 * 1000,
  
  /** Setores - 1 hora */
  SECTORS: 60 * 60 * 1000,
  
  /** Calendário econômico - 1 hora */
  ECONOMIC_CALENDAR: 60 * 60 * 1000,
  
  /** Artigos de notícias - 30 segundos (ISR) */
  ARTICLES: 30 * 1000,
} as const;

/**
 * Configuração de agendamento de jobs
 * 
 * Define a frequência de atualização de cada tipo de dado.
 * Os valores devem ser calculados para manter as chamadas
 * dentro do limite gratuito.
 */
export const JOB_SCHEDULE = {
  /**
   * Atualizar notícias de mercado
   * GNews: 80 chamadas/dia = 1 a cada 18 minutos
   * Usar: a cada 15 minutos = 96 chamadas/dia (margem)
   */
  MARKET_NEWS: '*/15 * * * *',
  
  /**
   * Atualizar earnings
   * Finnhub: 500 chamadas/dia = ~20 por hora
   * Usar: a cada 1 hora = 24 chamadas/dia
   */
  EARNINGS: '0 * * * *',
  
  /**
   * Atualizar índices globais
   * Finnhub: 500 chamadas/dia = ~8 por hora
   * Usar: a cada 15 minutos = 96 chamadas/dia
   */
  INDICES: '*/15 * * * *',
  
  /**
   * Atualizar commodities
   * Finnhub: 500 chamadas/dia = ~20 por hora
   * Usar: a cada 15 minutos = 96 chamadas/dia
   */
  COMMODITIES: '*/15 * * * *',
  
  /**
   * Atualizar setores
   * Finnhub: 500 chamadas/dia = ~20 por hora
   * Usar: a cada 1 hora = 24 chamadas/dia
   */
  SECTORS: '0 * * * *',
  
  /**
   * Atualizar calendário econômico
   * Finnhub: 500 chamadas/dia = ~20 por hora
   * Usar: a cada 1 hora = 24 chamadas/dia
   */
  ECONOMIC_CALENDAR: '0 * * * *',
} as const;

/**
 * Calcula o intervalo ideal entre chamadas de API
 * para manter dentro do limite diário.
 */
export function calculateOptimalInterval(callsPerDay: number, callsNeeded: number): number {
  if (callsPerDay === Infinity || callsNeeded <= 0) {
    return CACHE_TTL.ARTICLES;
  }
  
  const intervalMs = (24 * 60 * 60 * 1000) / Math.floor(callsPerDay / callsNeeded);
  return Math.max(intervalMs, 60 * 1000); // Mínimo 1 minuto
}

/**
 * Verifica se uma chamada de API está dentro do limite.
 */
export function isWithinRateLimit(
  apiName: keyof typeof API_LIMITS,
  callsMade: number
): boolean {
  const limit = API_LIMITS[apiName];
  
  if (limit.callsPerDay === Infinity) {
    return true;
  }
  
  const maxCalls = Math.floor(limit.callsPerDay * limit.buffer);
  return callsMade < maxCalls;
}
