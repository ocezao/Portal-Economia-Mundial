import { describe, it, expect, beforeEach, vi } from 'vitest';

// Simple tests that verify the storage module exports exist and are functions
// Full integration testing would require a real browser environment

describe('storage exports', () => {
  it('should export secureStorage with required methods', async () => {
    const { secureStorage } = await import('@/lib/storage');
    
    expect(secureStorage).toBeDefined();
    expect(typeof secureStorage.set).toBe('function');
    expect(typeof secureStorage.get).toBe('function');
    expect(typeof secureStorage.remove).toBe('function');
    expect(typeof secureStorage.clear).toBe('function');
  });

  it('should export publicStorage with required methods', async () => {
    const { publicStorage } = await import('@/lib/storage');
    
    expect(publicStorage).toBeDefined();
    expect(typeof publicStorage.set).toBe('function');
    expect(typeof publicStorage.get).toBe('function');
    expect(typeof publicStorage.remove).toBe('function');
  });

  it('should export unified storage with required methods', async () => {
    const { storage } = await import('@/lib/storage');
    
    expect(storage).toBeDefined();
    expect(typeof storage.set).toBe('function');
    expect(typeof storage.get).toBe('function');
    expect(typeof storage.remove).toBe('function');
    expect(typeof storage.clear).toBe('function');
    expect(typeof storage.clearSensitive).toBe('function');
    expect(typeof storage.getUser).toBe('function');
    expect(typeof storage.setUser).toBe('function');
    expect(typeof storage.getBookmarks).toBe('function');
    expect(typeof storage.addBookmark).toBe('function');
    expect(typeof storage.removeBookmark).toBe('function');
    expect(typeof storage.getReadingHistory).toBe('function');
    expect(typeof storage.addToHistory).toBe('function');
    expect(typeof storage.getUnlockedArticles).toBe('function');
    expect(typeof storage.unlockArticle).toBe('function');
    expect(typeof storage.getDailyStats).toBe('function');
    expect(typeof storage.updateDailyStats).toBe('function');
  });

  it('should export STORAGE_KEYS', async () => {
    const { STORAGE_KEYS } = await import('@/lib/storage');
    
    expect(STORAGE_KEYS).toBeDefined();
    expect(STORAGE_KEYS.authToken).toBeDefined();
    expect(STORAGE_KEYS.user).toBeDefined();
    expect(STORAGE_KEYS.bookmarks).toBeDefined();
    expect(STORAGE_KEYS.theme).toBeDefined();
  });

  it('should export TypeScript interfaces', async () => {
    // TypeScript interfaces are compile-time only, but we can verify the module loads
    const storageModule = await import('@/lib/storage');
    expect(storageModule).toBeDefined();
  });
});

describe('storage with jsdom environment', () => {
  beforeEach(() => {
    // Clear storage before each test
    localStorage.clear();
    sessionStorage.clear();
    vi.clearAllMocks();
  });

  it('should handle get when no data exists', async () => {
    const { secureStorage, publicStorage, storage } = await import('@/lib/storage');
    
    // Should return null for non-existent keys
    expect(secureStorage.get('non-existent')).toBeNull();
    expect(publicStorage.get('non-existent')).toBeNull();
    expect(storage.get('non-existent')).toBeNull();
  });

  it('should store and retrieve from localStorage', async () => {
    const { publicStorage } = await import('@/lib/storage');
    
    const testData = { test: 'value', number: 123 };
    publicStorage.set('test-key', testData);
    
    const retrieved = publicStorage.get('test-key');
    expect(retrieved).toEqual(testData);
  });

  it('should store and retrieve from sessionStorage', async () => {
    const { secureStorage } = await import('@/lib/storage');
    
    const testData = { sensitive: 'data' };
    secureStorage.set('test-key', testData);
    
    const retrieved = secureStorage.get('test-key');
    expect(retrieved).toEqual(testData);
  });

  it('should remove items from storage', async () => {
    const { publicStorage } = await import('@/lib/storage');
    
    publicStorage.set('key-to-remove', 'value');
    expect(publicStorage.get('key-to-remove')).toBe('value');
    
    publicStorage.remove('key-to-remove');
    expect(publicStorage.get('key-to-remove')).toBeNull();
  });

  it('should clear all items from sessionStorage', async () => {
    const { secureStorage } = await import('@/lib/storage');
    
    secureStorage.set('key1', 'value1');
    secureStorage.set('key2', 'value2');
    
    secureStorage.clear();
    
    expect(secureStorage.get('key1')).toBeNull();
    expect(secureStorage.get('key2')).toBeNull();
  });

  it('should manage bookmarks', async () => {
    const { storage, STORAGE_KEYS } = await import('@/lib/storage');
    
    const bookmark = {
      articleSlug: 'test-article',
      title: 'Test Article',
      category: 'economia',
      excerpt: 'Test excerpt',
      coverImage: '/test.jpg',
      bookmarkedAt: new Date().toISOString(),
    };
    
    storage.addBookmark(bookmark);
    
    const bookmarks = storage.getBookmarks();
    expect(bookmarks).toHaveLength(1);
    expect(bookmarks[0].articleSlug).toBe('test-article');
  });

  it('should not add duplicate bookmarks', async () => {
    const { storage } = await import('@/lib/storage');
    
    const bookmark = {
      articleSlug: 'test-article',
      title: 'Test Article',
      category: 'economia',
      excerpt: 'Test excerpt',
      coverImage: '/test.jpg',
      bookmarkedAt: new Date().toISOString(),
    };
    
    storage.addBookmark(bookmark);
    storage.addBookmark(bookmark);
    
    const bookmarks = storage.getBookmarks();
    expect(bookmarks).toHaveLength(1);
  });

  it('should remove bookmarks', async () => {
    const { storage } = await import('@/lib/storage');
    
    const bookmark = {
      articleSlug: 'test-article',
      title: 'Test Article',
      category: 'economia',
      excerpt: 'Test excerpt',
      coverImage: '/test.jpg',
      bookmarkedAt: new Date().toISOString(),
    };
    
    storage.addBookmark(bookmark);
    expect(storage.getBookmarks()).toHaveLength(1);
    
    storage.removeBookmark('test-article');
    expect(storage.getBookmarks()).toHaveLength(0);
  });

  it('should manage reading history with limit', async () => {
    const { storage } = await import('@/lib/storage');
    
    // Add 55 items
    for (let i = 0; i < 55; i++) {
      storage.addToHistory({
        articleSlug: `article-${i}`,
        title: `Article ${i}`,
        category: 'economia',
        readAt: new Date().toISOString(),
        timeSpent: 60,
      });
    }
    
    const history = storage.getReadingHistory();
    expect(history.length).toBeLessThanOrEqual(50);
  });

  it('should manage unlocked articles without duplicates', async () => {
    const { storage } = await import('@/lib/storage');
    
    storage.unlockArticle('article-1');
    storage.unlockArticle('article-2');
    storage.unlockArticle('article-1'); // duplicate
    
    const unlocked = storage.getUnlockedArticles();
    expect(unlocked).toHaveLength(2);
    expect(unlocked).toContain('article-1');
    expect(unlocked).toContain('article-2');
  });

  it('should get daily stats for today', async () => {
    const { storage } = await import('@/lib/storage');
    
    const stats = storage.getDailyStats();
    const today = new Date().toISOString().split('T')[0];
    
    expect(stats.date).toBe(today);
    expect(stats.articlesRead).toBe(0);
    expect(stats.timeSpent).toBe(0);
  });

  it('should update daily stats', async () => {
    const { storage } = await import('@/lib/storage');
    
    storage.updateDailyStats({ articlesRead: 5 });
    
    const stats = storage.getDailyStats();
    expect(stats.articlesRead).toBe(5);
  });

  it('should use sessionStorage for sensitive keys', async () => {
    const { storage, STORAGE_KEYS } = await import('@/lib/storage');
    
    // Clear both storages first
    sessionStorage.clear();
    localStorage.clear();
    
    storage.set(STORAGE_KEYS.authToken, 'secret');
    
    // Verify in sessionStorage
    expect(sessionStorage.getItem(STORAGE_KEYS.authToken)).toBe(JSON.stringify('secret'));
    // Verify NOT in localStorage
    expect(localStorage.getItem(STORAGE_KEYS.authToken)).toBeNull();
  });

  it('should use localStorage for non-sensitive keys', async () => {
    // Clear both storages first
    sessionStorage.clear();
    localStorage.clear();
    
    // Import fresh module
    const module = await import('@/lib/storage');
    const storage = module.storage;
    const STORAGE_KEYS = module.STORAGE_KEYS;
    
    storage.set(STORAGE_KEYS.theme, 'dark');
    
    // Verify in localStorage
    expect(localStorage.getItem(STORAGE_KEYS.theme)).toBe(JSON.stringify('dark'));
    // Verify NOT in sessionStorage
    expect(sessionStorage.getItem(STORAGE_KEYS.theme)).toBeNull();
  });

  it('should clear both storages', async () => {
    const { storage } = await import('@/lib/storage');
    
    localStorage.setItem('test', 'value');
    sessionStorage.setItem('test', 'value');
    
    storage.clear();
    
    expect(localStorage.getItem('test')).toBeNull();
    expect(sessionStorage.getItem('test')).toBeNull();
  });

  it('should clear only sensitive data', async () => {
    const { storage } = await import('@/lib/storage');
    
    localStorage.setItem('public', 'data');
    sessionStorage.setItem('sensitive', 'data');
    
    storage.clearSensitive();
    
    // localStorage should still have data
    expect(localStorage.getItem('public')).toBe('data');
    // sessionStorage should be cleared
    expect(sessionStorage.getItem('sensitive')).toBeNull();
  });
});
