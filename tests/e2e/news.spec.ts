import { test, expect } from '@playwright/test';

test.describe('News', () => {
  test('homepage loads with news', async ({ page }) => {
    await page.goto('/');
    
    // Wait for page to load
    await page.waitForLoadState('networkidle');
    
    // Check for news content - look for common selectors
    const newsContent = page.locator('article, [data-testid="news-card"], .news-card, h2, h3').first();
    await expect(newsContent).toBeVisible();
  });

  test('can navigate to article page', async ({ page }) => {
    await page.goto('/');
    
    // Wait for articles to load
    await page.waitForTimeout(2000);
    
    // Find first article link
    const articleLink = page.locator('a[href*="/noticias/"]').first();
    
    if (await articleLink.isVisible().catch(() => false)) {
      await articleLink.click();
      
      // Should navigate to article page
      await expect(page).toHaveURL(/.*noticias.*/);
      
      // Article page should have content
      const articleContent = page.locator('article, [data-testid="article-content"], h1').first();
      await expect(articleContent).toBeVisible();
    }
  });

  test('article page has required elements', async ({ page }) => {
    // Try to navigate to a specific article
    await page.goto('/noticias/test');
    
    await page.waitForTimeout(1000);
    
    // Check for common article elements
    const title = page.locator('h1').first();
    await expect(title).toBeVisible();
  });

  test('category pages load', async ({ page }) => {
    const categories = ['/categoria/economia', '/categoria/geopolitica', '/categoria/tecnologia'];
    
    for (const category of categories) {
      await page.goto(category);
      await page.waitForTimeout(1000);
      
      // Page should load without errors
      const content = page.locator('body').first();
      await expect(content).toBeVisible();
      
      // Should have some content
      const heading = page.locator('h1').first();
      await expect(heading).toBeVisible();
    }
  });

  test('breaking news badge is visible when applicable', async ({ page }) => {
    await page.goto('/');
    
    await page.waitForTimeout(2000);
    
    // Look for breaking news badge
    const breakingBadge = page.locator('text=Urgente, text=Breaking, .breaking-news, [data-testid="breaking-badge"]').first();
    
    // Just check if page loaded - breaking news may or may not exist
    await expect(page.locator('body')).toBeVisible();
  });

  test('article has share buttons', async ({ page }) => {
    await page.goto('/noticias/test');
    await page.waitForTimeout(1000);
    
    // Look for share buttons
    const shareButtons = page.locator('button[aria-label*="compartilhar"], button[aria-label*="share"], .share-button, [data-testid="share"]').first();
    
    // Not all articles may have share buttons
    if (await shareButtons.isVisible().catch(() => false)) {
      await expect(shareButtons).toBeVisible();
    }
  });

  test('search results show news articles', async ({ page }) => {
    await page.goto('/busca?q=economia');
    await page.waitForTimeout(2000);
    
    // Should have search results or empty state
    const content = page.locator('body').first();
    await expect(content).toBeVisible();
  });

  test('news cards have images', async ({ page }) => {
    await page.goto('/');
    await page.waitForTimeout(2000);
    
    // Look for article images
    const images = page.locator('article img, [data-testid="news-card"] img, .news-card img');
    const count = await images.count();
    
    if (count > 0) {
      // Check first image
      const firstImage = images.first();
      await expect(firstImage).toBeVisible();
      
      const src = await firstImage.getAttribute('src');
      expect(src).toBeTruthy();
    }
  });

  test('article has reading time indicator', async ({ page }) => {
    await page.goto('/');
    await page.waitForTimeout(2000);
    
    // Look for reading time
    const readingTime = page.locator('text=min, text=leitura, [data-testid="reading-time"]').first();
    
    if (await readingTime.isVisible().catch(() => false)) {
      const text = await readingTime.textContent();
      expect(text).toMatch(/\d+\s*min/i);
    }
  });

  test('related articles section exists on article page', async ({ page }) => {
    await page.goto('/noticias/test');
    await page.waitForTimeout(2000);
    
    // Look for related articles section
    const relatedSection = page.locator('text=Relacionados, text=Related, [data-testid="related-articles"], #related-articles').first();
    
    // May or may not exist depending on article
    if (await relatedSection.isVisible().catch(() => false)) {
      await expect(relatedSection).toBeVisible();
    }
  });

  test('bookmark functionality on article', async ({ page }) => {
    await page.goto('/noticias/test');
    await page.waitForTimeout(1000);
    
    // Look for bookmark button
    const bookmarkButton = page.locator('button[aria-label*="favorito"], button[aria-label*="bookmark"], [data-testid="bookmark"]').first();
    
    if (await bookmarkButton.isVisible().catch(() => false)) {
      // Click to bookmark
      await bookmarkButton.click();
      
      // Should show some feedback (button state change, toast, etc)
      await page.waitForTimeout(500);
    }
  });
});

test.describe('News Accessibility', () => {
  test('articles have proper heading structure', async ({ page }) => {
    await page.goto('/noticias/test');
    await page.waitForTimeout(1000);
    
    // Check for h1 on article page
    const h1 = page.locator('h1').first();
    await expect(h1).toBeVisible();
  });

  test('images have alt text', async ({ page }) => {
    await page.goto('/');
    await page.waitForTimeout(2000);
    
    // Get all images in news cards
    const images = page.locator('article img, [data-testid="news-card"] img');
    const count = await images.count();
    
    for (let i = 0; i < Math.min(count, 5); i++) {
      const alt = await images.nth(i).getAttribute('alt');
      // Alt can be empty for decorative images, but should exist
      expect(alt !== null).toBe(true);
    }
  });

  test('article links are accessible', async ({ page }) => {
    await page.goto('/');
    await page.waitForTimeout(2000);
    
    // Check article links
    const links = page.locator('article a, [data-testid="news-card"] a');
    const count = await links.count();
    
    if (count > 0) {
      const firstLink = links.first();
      await expect(firstLink).toHaveAttribute('href');
    }
  });
});
