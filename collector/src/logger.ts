/**
 * Minimal logger for the collector.
 * Console output is restricted to this file so the rest of the codebase can use a logger abstraction.
 */

const isDev = process.env.NODE_ENV !== 'production';

export const collectorLogger = {
  info: (msg: string): void => {
    if (!isDev) return;
    // eslint-disable-next-line no-console
    console.log(msg);
  },
  warn: (msg: string): void => {
    if (!isDev) return;
    // eslint-disable-next-line no-console
    console.warn(msg);
  },
  error: (msg: string, err?: unknown): void => {
    if (isDev) {
      // eslint-disable-next-line no-console
      console.error(msg, err);
      return;
    }
    // In production, avoid dumping objects/stacks.
    // eslint-disable-next-line no-console
    console.error(msg, err ? '[Error details sanitized]' : undefined);
  },
};

