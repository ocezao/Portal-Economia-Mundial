/**
 * Minimal logger for the SDK.
 * Console output is restricted to this file so the rest of the codebase can use a logger abstraction.
 */

export const sdkLogger = {
  debug: (enabled: boolean, message: string): void => {
    if (!enabled) return;
    // eslint-disable-next-line no-console
    console.log(message);
  },
};

