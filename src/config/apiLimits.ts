/**
 * Configuracao de limites de API.
 *
 * Define referencias operacionais para provedores externos e
 * para a infraestrutura local.
 */
export const API_LIMITS = {
  /**
   * Finnhub - plano gratuito
   * Limite: 60 chamadas/min.
   *
   * Estrategia: usar no maximo 500 chamadas por dia
   * para manter margem de seguranca.
   */
  FINNHUB: {
    callsPerDay: 500,
    callsPerMinute: 60,
    buffer: 0.8,
  },

  /**
   * GNews - plano gratuito
   * Limite: 100 requests por dia.
   *
   * Estrategia: usar no maximo 80 chamadas por dia.
   */
  GNEWS: {
    callsPerDay: 80,
    buffer: 0.8,
  },

  /**
   * PostgreSQL local
   * Limite operacional definido pela VPS e pelo pool de conexoes.
   */
  POSTGRES_LOCAL: {
    callsPerDay: Infinity,
    maxDbSize: 500 * 1024 * 1024,
    maxEgress: 100 * 1024 * 1024 * 1024,
  },
} as const;

/**
 * Configuracao de TTL para cache.
 */
export const CACHE_TTL = {
  MARKET_NEWS: 15 * 60 * 1000,
  EARNINGS: 60 * 60 * 1000,
  INDICES: 5 * 60 * 1000,
  COMMODITIES: 15 * 60 * 1000,
  SECTORS: 60 * 60 * 1000,
  ECONOMIC_CALENDAR: 60 * 60 * 1000,
  ARTICLES: 30 * 1000,
} as const;

/**
 * Configuracao de agendamento de jobs.
 */
export const JOB_SCHEDULE = {
  MARKET_NEWS: '*/15 * * * *',
  EARNINGS: '0 * * * *',
  INDICES: '*/15 * * * *',
  COMMODITIES: '*/15 * * * *',
  SECTORS: '0 * * * *',
  ECONOMIC_CALENDAR: '0 * * * *',
} as const;

/**
 * Calcula o intervalo ideal entre chamadas de API.
 */
export function calculateOptimalInterval(callsPerDay: number, callsNeeded: number): number {
  if (callsPerDay === Infinity || callsNeeded <= 0) {
    return CACHE_TTL.ARTICLES;
  }

  const intervalMs = (24 * 60 * 60 * 1000) / Math.floor(callsPerDay / callsNeeded);
  return Math.max(intervalMs, 60 * 1000);
}

/**
 * Verifica se uma chamada de API esta dentro do limite.
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
