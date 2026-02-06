/**
 * Logger seguro para produção
 * Apenas loga em ambiente de desenvolvimento
 */

const isDev = import.meta.env.DEV;

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
  
  // Método específico para debugging (desabilitado em prod)
  debug: (...args: unknown[]): void => {
    if (isDev) {
      // eslint-disable-next-line no-console
      console.debug(...args);
    }
  },
};

export default logger;
