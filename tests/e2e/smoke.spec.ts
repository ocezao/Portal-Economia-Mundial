import { test, expect } from '@playwright/test';

// Smoke tests: cheap checks that the most important routes render.
// Keep assertions resilient (no brittle selectors).

const logsByTestId = new Map<string, string[]>();

test.beforeEach(async ({ page }, testInfo) => {
  const logs: string[] = [];
  logsByTestId.set(testInfo.testId, logs);

  page.on('console', (msg) => {
    const type = msg.type();
    if (type === 'error' || type === 'warning') {
      logs.push(`[console.${type}] ${msg.text()}`);
    }
  });

  page.on('pageerror', (err) => {
    logs.push(`[pageerror] ${err?.message || String(err)}\n${(err as Error)?.stack || ''}`.trim());
  });
});

test.afterEach(async ({}, testInfo) => {
  const logs = logsByTestId.get(testInfo.testId) || [];
  logsByTestId.delete(testInfo.testId);

  // Only attach when failing to keep reports smaller.
  if (testInfo.status !== testInfo.expectedStatus) {
    // Also print to stdout so we can inspect in CI/terminal runs.
    // (Playwright may truncate attachment previews.)
    // eslint-disable-next-line no-console
    console.log('\n[browser-errors]\n' + (logs.join('\n\n') || '(no console/page errors captured)') + '\n');

    await testInfo.attach('browser-errors', {
      body: logs.join('\n\n') || '(no console/page errors captured)',
      contentType: 'text/plain',
    });
  }
});

test('home renders', async ({ page }) => {
  const res = await page.goto('/');
  expect(res?.ok()).toBeTruthy();

  // If app uses a global error boundary UI, avoid silently passing.
  await expect(page.getByText(/algo deu errado/i)).toHaveCount(0);
});

test('destaque renders', async ({ page }) => {
  const res = await page.goto('/destaque');
  expect(res?.ok()).toBeTruthy();
  await expect(page.getByText(/algo deu errado/i)).toHaveCount(0);
});

test('noticias list renders', async ({ page }) => {
  const res = await page.goto('/noticias');
  expect(res?.ok()).toBeTruthy();
  await expect(page.getByText(/algo deu errado/i)).toHaveCount(0);
});

test('categorias renders', async ({ page }) => {
  const res = await page.goto('/categorias');
  expect(res?.ok()).toBeTruthy();
  await expect(page.getByText(/algo deu errado/i)).toHaveCount(0);
});

test('em-alta renders', async ({ page }) => {
  const res = await page.goto('/em-alta');
  expect(res?.ok()).toBeTruthy();
  await expect(page.getByText(/algo deu errado/i)).toHaveCount(0);
});

test('mercados renders', async ({ page }) => {
  const res = await page.goto('/mercados');
  expect(res?.ok()).toBeTruthy();
  await expect(page.getByText(/algo deu errado/i)).toHaveCount(0);
});

test('dados-economicos renders', async ({ page }) => {
  const res = await page.goto('/dados-economicos');
  expect(res?.ok()).toBeTruthy();
  await expect(page.getByText(/algo deu errado/i)).toHaveCount(0);
});

test('calendario-economico renders', async ({ page }) => {
  const res = await page.goto('/calendario-economico');
  expect(res?.ok()).toBeTruthy();
  await expect(page.getByText(/algo deu errado/i)).toHaveCount(0);
});

test('rss.xml renders', async ({ page }) => {
  // Firefox may treat XML as a download when using page navigation.
  const res = await page.request.get('/rss.xml');
  expect(res.ok()).toBeTruthy();
});

test('sitemap.xml renders', async ({ page }) => {
  const res = await page.request.get('/sitemap.xml');
  expect(res.ok()).toBeTruthy();
});
