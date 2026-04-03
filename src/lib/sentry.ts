/**
 * Sentry Integration Stub
 * To enable Sentry error tracking:
 * 1. npm install @sentry/nextjs
 * 2. Set SENTRY_DSN in .env
 * 3. Replace this file with actual Sentry implementation
 */

import { logger } from '@/lib/logger';

export async function initSentry(): Promise<void> {
  // Stub - implement when @sentry/nextjs is installed
}

export async function captureException(error: Error, context?: Record<string, unknown>): Promise<void> {
  if (process.env.NODE_ENV === 'development') {
    logger.error('[Error]', error.message, context);
  }
}

export async function captureMessage(message: string, level: 'info' | 'warning' | 'error' = 'info'): Promise<void> {
  if (process.env.NODE_ENV === 'development') {
    logger.log(`[${level.toUpperCase()}]`, message);
  }
}

export async function setUserContext(_user: { id: string; email?: string; role?: string } | null): Promise<void> {
  // Stub - implement when @sentry/nextjs is installed
}
