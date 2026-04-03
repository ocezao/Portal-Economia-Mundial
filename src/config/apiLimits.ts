/**
 * Configuracao de limites de APIs externas gratuitas.
 */

export const API_LIMITS = {
  FINNHUB: {
    callsPerDay: 500,
    callsPerMinute: 60,
    buffer: 0.8,
  },
  GNEWS: {
    callsPerDay: 80,
    buffer: 0.8,
  },
} as const;

export const CACHE_TTL = {
  MARKET_NEWS: 15 * 60 * 1000,
  EARNINGS: 60 * 60 * 1000,
  INDICES: 5 * 60 * 1000,
  COMMODITIES: 15 * 60 * 1000,
  SECTORS: 60 * 60 * 1000,
  ECONOMIC_CALENDAR: 60 * 60 * 1000,
  ARTICLES: 30 * 1000,
} as const;

export const JOB_SCHEDULE = {
  MARKET_NEWS: '*/15 * * * *',
  EARNINGS: '0 * * * *',
  INDICES: '*/15 * * * *',
  COMMODITIES: '*/15 * * * *',
  SECTORS: '0 * * * *',
  ECONOMIC_CALENDAR: '0 * * * *',
} as const;

export function calculateOptimalInterval(callsPerDay: number, callsNeeded: number): number {
  if (!Number.isFinite(callsPerDay) || callsNeeded <= 0) {
    return CACHE_TTL.ARTICLES;
  }

  const safeCallsPerDay = Math.max(1, Math.floor(callsPerDay / callsNeeded));
  const intervalMs = (24 * 60 * 60 * 1000) / safeCallsPerDay;
  return Math.max(intervalMs, 60 * 1000);
}

export function isWithinRateLimit(
  apiName: keyof typeof API_LIMITS,
  callsMade: number,
): boolean {
  const limit = API_LIMITS[apiName];
  const maxCalls = Math.floor(limit.callsPerDay * limit.buffer);
  return callsMade < maxCalls;
}
