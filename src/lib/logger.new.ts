/**
 * Structured Logger
 * Production-ready logging
 */

const isDev = process.env.NODE_ENV !== 'production';

type LogContext = Record<string, unknown>;

const REDACT_KEYS = [
  'password',
  'token',
  'secret',
  'apiKey',
  'api_key',
  'authorization',
  'cookie',
  'session',
  'credential',
  'database_url',
  'db_password',
];

function sanitize(value: unknown, depth = 0): unknown {
  if (depth > 5) return '[Max Depth]';
  if (value === null || value === undefined) return value;
  
  if (typeof value === 'string') {
    return value;
  }
  
  if (typeof value === 'number' || typeof value === 'boolean') {
    return value;
  }
  
  if (Array.isArray(value)) {
    return value.map(v => sanitize(v, depth + 1));
  }
  
  if (typeof value === 'object') {
    const obj = value as Record<string, unknown>;
    const sanitized: Record<string, unknown> = {};
    
    for (const [key, val] of Object.entries(obj)) {
      const lowerKey = key.toLowerCase();
      const shouldRedact = REDACT_KEYS.some(k => lowerKey.includes(k.toLowerCase()));
      
      if (shouldRedact) {
        sanitized[key] = '[REDACTED]';
      } else {
        sanitized[key] = sanitize(val, depth + 1);
      }
    }
    
    return sanitized;
  }
  
  return String(value);
}

function formatTimestamp(): string {
  return new Date().toISOString();
}

function formatLogEntry(level: string, message: string, context?: LogContext): string {
  if (isDev) {
    const ctx = context ? ` ${JSON.stringify(sanitize(context))}` : '';
    return `[${formatTimestamp()}] [${level.toUpperCase()}] ${message}${ctx}`;
  }
  return JSON.stringify({
    timestamp: formatTimestamp(),
    level,
    message,
    ...sanitize(context) as LogContext,
  });
}

interface Logger {
  info: (message: string, context?: LogContext) => void;
  error: (message: string, error?: Error | unknown, context?: LogContext) => void;
  warn: (message: string, context?: LogContext) => void;
  debug: (message: string, context?: LogContext) => void;
  child: (context: LogContext) => Logger;
}

function createLogger(defaultContext: LogContext = {}): Logger {
  return {
    info: (message: string, ctx?: LogContext) => {
      const context = { ...defaultContext, ...ctx };
      // eslint-disable-next-line no-console
      console.log(formatLogEntry('info', message, context));
    },
    
    error: (message: string, error?: Error | unknown, ctx?: LogContext) => {
      const context = { ...defaultContext, ...ctx };
      const errorInfo = error instanceof Error 
        ? { errorName: error.name, errorMessage: error.message, stack: isDev ? error.stack : undefined }
        : error ? { error: sanitize(error) } : {};
      
      // eslint-disable-next-line no-console
      console.error(formatLogEntry('error', message, { ...context, ...errorInfo }));
    },
    
    warn: (message: string, ctx?: LogContext) => {
      const context = { ...defaultContext, ...ctx };
      // eslint-disable-next-line no-console
      console.warn(formatLogEntry('warn', message, context));
    },
    
    debug: (message: string, ctx?: LogContext) => {
      if (!isDev) return;
      const context = { ...defaultContext, ...ctx };
      // eslint-disable-next-line no-console
      console.debug(formatLogEntry('debug', message, context));
    },
    
    child: (additionalContext: LogContext) => {
      return createLogger({ ...defaultContext, ...additionalContext });
    },
  };
}

export const logger = createLogger();

export function createRequestLogger(requestId: string, path: string): Logger {
  return createLogger({ requestId, path, type: 'request' });
}

export function createComponentLogger(component: string): Logger {
  return createLogger({ component, type: 'component' });
}

export default logger;
