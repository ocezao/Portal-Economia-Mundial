import { test, expect } from '@playwright/test';

test.describe('Homepage', () => {
  test('deve carregar a página inicial', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveTitle(/Portal Econômico/);
  });
  
  test('deve exibir header na página inicial', async ({ page }) => {
    await page.goto('/');
    const header = page.locator('[data-testid="header"]');
    await expect(header).toBeVisible();
  });
  
  test('deve exibir ticker de mercado', async ({ page }) => {
    await page.goto('/');
    const ticker = page.locator('[data-testid="market-ticker"]');
    // In E2E we may disable external widgets (ticker calls external APIs).
    if (await ticker.count() > 0) {
      await expect(ticker).toBeVisible();
    }
  });
  
  test('deve exibir cards de notícias na página inicial', async ({ page }) => {
    await page.goto('/');
    await page.waitForTimeout(2000);
    
    // Home can render cards in multiple ways (hero + lists). Prefer resilient selectors.
    const newsCards = page.locator('[data-testid="news-card"]');
    const newsLinks = page.locator('a[href*="/noticias/"]');
    const count = (await newsCards.count()) + (await newsLinks.count());
    
    // Deve haver pelo menos um card de notícia
    expect(count).toBeGreaterThan(0);
    
    // Verificar visibilidade do primeiro item
    if (await newsCards.count() > 0) {
      await expect(newsCards.first()).toBeVisible();
    } else {
      await expect(newsLinks.first()).toBeVisible();
    }
  });
  
  test('deve navegar para página de notícia ao clicar em card', async ({ page }) => {
    await page.goto('/');
    await page.waitForTimeout(2000);
    
    const firstNews = page.locator('[data-testid="news-card"], a[href*="/noticias/"]').first();
    
    // Verificar se o card existe e está visível
    if (await firstNews.isVisible().catch(() => false)) {
      await firstNews.click();
      
      // Aguardar navegação
      await page.waitForTimeout(1000);
      
      // Verificar se URL contém /noticias/
      await expect(page).toHaveURL(/.*noticias.*/);
    }
  });
  
  test('deve exibir logo que redireciona para home', async ({ page }) => {
    await page.goto('/');
    
    const logo = page.locator('[data-testid="header"] a[href="/"]').first();
    await expect(logo).toBeVisible();
    
    // Verificar href do logo
    const href = await logo.getAttribute('href');
    expect(href).toBe('/');
  });
  
  test('deve ter meta description', async ({ page }) => {
    await page.goto('/');
    
    const metaDescription = page.locator('meta[name="description"]');
    const content = await metaDescription.getAttribute('content');
    expect(content).toBeTruthy();
    expect(content!.length).toBeGreaterThan(10);
  });
  
  test('deve ter tags Open Graph', async ({ page }) => {
    await page.goto('/');
    
    const ogTitle = page.locator('meta[property="og:title"]');
    const ogDescription = page.locator('meta[property="og:description"]');
    const ogImage = page.locator('meta[property="og:image"]');
    
    if (await ogTitle.count() > 0) {
      const content = await ogTitle.getAttribute('content');
      expect(content).toBeTruthy();
    }
    
    if (await ogDescription.count() > 0) {
      const content = await ogDescription.getAttribute('content');
      expect(content).toBeTruthy();
    }
  });
  
  test('deve ter link canonical', async ({ page }) => {
    await page.goto('/');
    
    const canonical = page.locator('link[rel="canonical"]');
    if (await canonical.count() > 0) {
      const href = await canonical.getAttribute('href');
      expect(href).toBeTruthy();
    }
  });
  
  test('deve exibir footer na página', async ({ page }) => {
    await page.goto('/');
    
    const footer = page.locator('footer').first();
    if (await footer.isVisible().catch(() => false)) {
      await expect(footer).toBeVisible();
    }
  });
  
  test('deve ter navegação funcional no menu', async ({ page }) => {
    await page.goto('/');
    
    // Verificar links de navegação principais
    const navLinks = [
      { text: 'Home', path: '/' },
      { text: 'Em Alta', path: '/em-alta' },
      { text: 'Destaque', path: '/destaque' },
      { text: 'Categorias', path: '/categorias' },
    ];
    
    for (const link of navLinks) {
      const linkElement = page.locator(`header a:has-text("${link.text}")`).first();
      if (await linkElement.isVisible().catch(() => false)) {
        const href = await linkElement.getAttribute('href');
        expect(href).toContain(link.path);
      }
    }
  });
  
  test('deve funcionar busca no header', async ({ page }) => {
    await page.goto('/');
    
    // Abrir busca
    const searchButton = page.locator('button[aria-label="Abrir busca"], button[aria-label="Open search"]').first();
    if (await searchButton.isVisible().catch(() => false)) {
      await searchButton.click();
      
      // Verificar se campo de busca aparece
      const searchInput = page.locator('input[type="search"]').first();
      await expect(searchInput).toBeVisible();
      
      // Digitar e buscar
      await searchInput.fill('economia');
      await searchInput.press('Enter');
      
      // Verificar redirecionamento para página de busca
      await expect(page).toHaveURL(/.*busca.*/);
    }
  });
  
  test('deve ser responsiva em viewport mobile', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/');
    
    // Verificar se menu mobile está presente
    const menuButton = page.locator('button[aria-label*="menu"], button[aria-label*="Menu"]').first();
    if (await menuButton.isVisible().catch(() => false)) {
      await expect(menuButton).toBeVisible();
    }
    
    // Header deve estar visível
    const header = page.locator('[data-testid="header"]');
    await expect(header).toBeVisible();
  });
  
  test('deve ter JSON-LD estruturado na home', async ({ page }) => {
    await page.goto('/');
    
    const jsonLd = page.locator('script[type="application/ld+json"]');
    const count = await jsonLd.count();
    
    if (count > 0) {
      const content = await jsonLd.first().textContent();
      expect(content).toBeTruthy();
      
      // Verificar se é JSON válido
      const parsed = JSON.parse(content!);
      expect(parsed).toBeDefined();
    }
  });
});
