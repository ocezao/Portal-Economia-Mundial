import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests/e2e',
  timeout: 30_000,
  retries: process.env.CI ? 1 : 0,
  use: {
    // Use a production server for E2E stability on Windows.
    // Turbopack dev server can hang on first compilation in some environments.
    baseURL: 'http://127.0.0.1:3000',
    // Ensure middleware locale detection stays consistent with the test assertions.
    locale: 'pt-BR',
    extraHTTPHeaders: {
      'Accept-Language': 'pt-BR,pt;q=0.9,en;q=0.8',
    },
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
    { name: 'firefox', use: { ...devices['Desktop Firefox'] } },
  ],
  webServer: {
    command: 'npm run build && npm run start',
    url: 'http://127.0.0.1:3000',
    // Force a fresh server so env flags below are applied consistently.
    reuseExistingServer: false,
    timeout: 120_000,
    env: {
      // Keep E2E deterministic: avoid calling external services that can rate limit.
      NEXT_PUBLIC_ENABLE_MARKET_TICKER: 'false',
      EXTERNAL_SNAPSHOTS_REQUIRE: 'true',
      NEXT_PUBLIC_FINNHUB_ENABLED: 'false',
    },
  },
});
