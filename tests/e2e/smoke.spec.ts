import { test, expect } from '@playwright/test';

// Smoke tests: cheap checks that the most important routes render.
// Keep assertions resilient (no brittle selectors).

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
  const res = await page.goto('/rss.xml');
  expect(res?.ok()).toBeTruthy();
});

test('sitemap.xml renders', async ({ page }) => {
  const res = await page.goto('/sitemap.xml');
  expect(res?.ok()).toBeTruthy();
});
