/**
 * Logger seguro para produção
 * Apenas loga em ambiente de desenvolvimento
 */

const isDev = process.env.NODE_ENV !== 'production';

const lastLogByKey = new Map<string, number>();

function shouldLog(key: string, intervalMs: number): boolean {
  const now = Date.now();
  const last = lastLogByKey.get(key) ?? 0;
  if (now - last < intervalMs) return false;
  lastLogByKey.set(key, now);
  return true;
}

export const logger = {
  log: (...args: unknown[]): void => {
    if (isDev) {
      // eslint-disable-next-line no-console
      console.log(...args);
    }
  },
  
  warn: (...args: unknown[]): void => {
    if (isDev) {
      // eslint-disable-next-line no-console
      console.warn(...args);
    }
  },

  // Avoid flooding dev server logs when a dependency is down (e.g. Supabase 502).
  warnRateLimit: (key: string, intervalMs: number, ...args: unknown[]): void => {
    if (!isDev) return;
    if (!shouldLog(`warn:${key}`, intervalMs)) return;
    // eslint-disable-next-line no-console
    console.warn(...args);
  },
  
  error: (...args: unknown[]): void => {
    // Erros sempre logam, mas sem dados sensíveis
    if (isDev) {
      // eslint-disable-next-line no-console
      console.error(...args);
    } else {
      // Em produção, enviar para serviço de monitoring (Sentry, etc)
      // ou logar apenas mensagens genéricas
      const sanitized = args.map(arg => {
        if (arg instanceof Error) {
          return arg.message;
        }
        if (typeof arg === 'object' && arg !== null) {
          // Sanitizar objetos para não expor dados sensíveis
          return '[Object]';
        }
        return arg;
      });
      // eslint-disable-next-line no-console
      console.error('[Error]', ...sanitized);
    }
  },

  errorRateLimit: (key: string, intervalMs: number, ...args: unknown[]): void => {
    if (isDev) {
      if (!shouldLog(`error:${key}`, intervalMs)) return;
      // eslint-disable-next-line no-console
      console.error(...args);
      return;
    }

    if (!shouldLog(`error:${key}`, intervalMs)) return;
    logger.error(...args);
  },
  
  // Método específico para debugging (desabilitado em prod)
  debug: (...args: unknown[]): void => {
    if (isDev) {
      // eslint-disable-next-line no-console
      console.debug(...args);
    }
  },
};

export default logger;
