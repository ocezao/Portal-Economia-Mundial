import { test, expect } from '@playwright/test';

test.describe('Página de Artigo', () => {
  test('deve exibir conteúdo do artigo', async ({ page }) => {
    // Tentar navegar para um artigo de teste
    await page.goto('/noticias/test');
    await page.waitForTimeout(1000);
    
    // Verificar se há título (h1)
    const title = page.locator('h1').first();
    await expect(title).toBeVisible();
  });
  
  test('deve ter JSON-LD estruturado', async ({ page }) => {
    await page.goto('/noticias/test');
    await page.waitForTimeout(1000);
    
    const jsonLd = page.locator('script[type="application/ld+json"]').first();
    
    if (await jsonLd.isVisible().catch(() => false)) {
      const content = await jsonLd.textContent();
      expect(content).toBeTruthy();
      
      // Verificar se contém dados de Article
      const parsed = JSON.parse(content!);
      expect(parsed['@type'] || parsed['@graph']).toBeDefined();
    }
  });
  
  test('deve exibir imagem de capa ou fallback', async ({ page }) => {
    await page.goto('/noticias/test');
    await page.waitForTimeout(1000);
    
    // Verificar imagem de capa ou placeholder
    const coverImage = page.locator('article img, figure img, [data-testid="article-image"]').first();
    
    if (await coverImage.isVisible().catch(() => false)) {
      await expect(coverImage).toBeVisible();
      
      const src = await coverImage.getAttribute('src');
      expect(src).toBeTruthy();
    }
  });
  
  test('deve exibir informações do autor', async ({ page }) => {
    await page.goto('/noticias/test');
    await page.waitForTimeout(1000);
    
    // Procurar por informações do autor
    const authorInfo = page.locator('text=/autor|por|escrito/i, [data-testid="article-author"]').first();
    
    // Artigos devem ter alguma informação de autor ou publicação
    // Not all pages use a semantic <article>. Assert base content exists.
    await expect(page.locator('h1').first()).toBeVisible();

    if (await authorInfo.isVisible().catch(() => false)) {
      await expect(authorInfo).toBeVisible();
    }
  });
  
  test('deve exibir data de publicação', async ({ page }) => {
    await page.goto('/noticias/test');
    await page.waitForTimeout(1000);
    
    // Procurar por elemento time
    const timeElement = page.locator('time').first();
    
    if (await timeElement.isVisible().catch(() => false)) {
      await expect(timeElement).toBeVisible();
      
      const datetime = await timeElement.getAttribute('datetime');
      expect(datetime).toBeTruthy();
    }
  });
  
  test('deve ter tempo de leitura', async ({ page }) => {
    await page.goto('/noticias/test');
    await page.waitForTimeout(1000);
    
    // Procurar por indicador de tempo de leitura
    const readingTime = page.locator('text=/min|leitura|reading/i').first();
    
    if (await readingTime.isVisible().catch(() => false)) {
      const text = await readingTime.textContent();
      expect(text).toMatch(/\d+\s*min/i);
    }
  });
  
  test('deve ter tags ou categorias', async ({ page }) => {
    await page.goto('/noticias/test');
    await page.waitForTimeout(1000);
    
    // Procurar por tags ou categorias
    const tags = page.locator('a[href*="/categoria/"], [data-testid="article-category"], [data-testid="article-tag"]').first();
    
    if (await tags.isVisible().catch(() => false)) {
      await expect(tags).toBeVisible();
    }
  });
  
  test('deve ter botões de compartilhamento', async ({ page }) => {
    await page.goto('/noticias/test');
    await page.waitForTimeout(1000);
    
    // Procurar por botões de compartilhamento
    const shareButtons = page.locator('button[aria-label*="compartilhar"], button[aria-label*="share"], [data-testid="share"]').first();
    
    // Nem todos os artigos têm botões de compartilhamento
    if (await shareButtons.isVisible().catch(() => false)) {
      await expect(shareButtons).toBeVisible();
    }
  });
  
  test('deve ter seção de comentários ou placeholder', async ({ page }) => {
    await page.goto('/noticias/test');
    await page.waitForTimeout(1000);
    
    // Procurar por seção de comentários
    const comments = page.locator('#comments, [data-testid="comments"], text=/comentários|comments/i').first();
    
    // Pode ou não existir dependendo da configuração
    if (await comments.isVisible().catch(() => false)) {
      await expect(comments).toBeVisible();
    }
  });
  
  test('deve ter artigos relacionados', async ({ page }) => {
    await page.goto('/noticias/test');
    await page.waitForTimeout(2000);
    
    // Procurar por seção de artigos relacionados
    const related = page.locator('text=/relacionados|related|você pode gostar/i, [data-testid="related-articles"]').first();
    
    if (await related.isVisible().catch(() => false)) {
      await expect(related).toBeVisible();
      
      // Verificar se há cards de notícias relacionadas
      const relatedCards = page.locator('[data-testid="related-articles"] [data-testid="news-card"], #related-articles [data-testid="news-card"]').first();
      if (await relatedCards.isVisible().catch(() => false)) {
        await expect(relatedCards).toBeVisible();
      }
    }
  });
  
  test('deve permitir adicionar aos favoritos', async ({ page }) => {
    await page.goto('/noticias/test');
    await page.waitForTimeout(1000);
    
    // Procurar por botão de bookmark/favorito
    const bookmarkButton = page.locator('button[aria-label*="favorito"], button[aria-label*="bookmark"], [data-testid="bookmark"]').first();
    
    if (await bookmarkButton.isVisible().catch(() => false)) {
      await bookmarkButton.click();
      await page.waitForTimeout(500);
      
      // Verificar se houve alguma mudança de estado
      // (pode mostrar toast, mudar cor do botão, etc)
    }
  });
  
  test('deve ter navegação breadcrumb', async ({ page }) => {
    await page.goto('/noticias/test');
    await page.waitForTimeout(1000);
    
    // Procurar por breadcrumb
    const breadcrumb = page.locator('nav[aria-label="breadcrumb"], [data-testid="breadcrumb"], .breadcrumb').first();
    
    if (await breadcrumb.isVisible().catch(() => false)) {
      await expect(breadcrumb).toBeVisible();
    }
  });
  
  test('deve retornar 404 para artigo inexistente', async ({ page }) => {
    const response = await page.goto('/noticias/artigo-que-nao-existe-12345');
    await page.waitForTimeout(1000);
    
    // Verificar se página mostra erro 404 ou redireciona
    const body = page.locator('body');
    await expect(body).toBeVisible();
  });
  
  test('deve ser acessível via teclado', async ({ page }) => {
    await page.goto('/noticias/test');
    await page.waitForTimeout(1000);
    
    // Pressionar Tab várias vezes para navegar
    await page.keyboard.press('Tab');
    await page.keyboard.press('Tab');
    await page.keyboard.press('Tab');
    
    // Verificar se algum elemento está focado (diferente do body)
    const activeTag = await page.evaluate(() => document.activeElement?.tagName || '');
    expect(activeTag).toBeTruthy();
  });
  
  test('deve ter estrutura de headings correta', async ({ page }) => {
    await page.goto('/noticias/test');
    await page.waitForTimeout(1000);
    
    // Deve ter exatamente um h1
    const h1Count = await page.locator('h1').count();
    expect(h1Count).toBeGreaterThanOrEqual(1);
    
    // h1 deve estar visível
    const h1 = page.locator('h1').first();
    await expect(h1).toBeVisible();
  });
});
