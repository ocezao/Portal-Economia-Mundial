/**
 * Sentry Integration for Error Tracking (Optional)
 * Only activates when @sentry/nextjs is installed and SENTRY_DSN is set
 */

const SENTRY_DSN = process.env.SENTRY_DSN || process.env.NEXT_PUBLIC_SENTRY_DSN;
const isDev = process.env.NODE_ENV === 'development';

export async function initSentry(): Promise<void> {
  if (!SENTRY_DSN || isDev) {
    return;
  }
  
  try {
    const Sentry = await import('@sentry/nextjs');
    
    Sentry.init({
      dsn: SENTRY_DSN,
      environment: process.env.NODE_ENV,
      release: process.env.npm_package_version || '1.0.0',
      tracesSampleRate: 0.1,
      
      ignoreErrors: [
        'ResizeObserver loop limit exceeded',
        'ResizeObserver loop completed with undelivered notifications',
        'Network request failed',
        'NetworkError',
        'Failed to fetch',
        'Load failed',
        'cancelled',
        'Non-Error promise rejection captured',
        'Extension context invalidated',
      ],
      
      denyUrls: [
        /extensions\//i,
        /^chrome:\/\//i,
        /^chrome-extension:\/\//i,
        /moz-extension:\/\//i,
      ],
    });
  } catch {
    // Sentry not installed, skip initialization
  }
}

export async function captureException(error: Error, context?: Record<string, unknown>): Promise<void> {
  if (!SENTRY_DSN || isDev) {
    console.error('[Error]', error.message, context);
    return;
  }
  
  try {
    const Sentry = await import('@sentry/nextjs');
    Sentry.captureException(error, { extra: context });
  } catch {
    // Sentry not installed
  }
}

export async function captureMessage(message: string, level: 'info' | 'warning' | 'error' = 'info'): Promise<void> {
  if (!SENTRY_DSN || isDev) {
    console.log(`[${level.toUpperCase()}]`, message);
    return;
  }
  
  try {
    const Sentry = await import('@sentry/nextjs');
    Sentry.captureMessage(message, level);
  } catch {
    // Sentry not installed
  }
}

export async function setUserContext(user: { id: string; email?: string; role?: string } | null): Promise<void> {
  if (!SENTRY_DSN) return;
  
  try {
    const Sentry = await import('@sentry/nextjs');
    if (user) {
      Sentry.setUser({ id: user.id, email: user.email, username: user.role });
    } else {
      Sentry.setUser(null);
    }
  } catch {
    // Sentry not installed
  }
}
