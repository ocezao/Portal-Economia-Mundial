import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';

// Mock supabase
const {
  mockSelect,
  mockEq,
  mockOrder,
  mockFrom,
  mockInsert,
  mockDelete,
} = vi.hoisted(() => ({
  mockSelect: vi.fn(),
  mockEq: vi.fn(),
  mockOrder: vi.fn(),
  mockFrom: vi.fn(),
  mockInsert: vi.fn(),
  mockDelete: vi.fn(),
}));

vi.mock('@/lib/supabaseClient', () => ({
  supabase: {
    from: mockFrom,
  },
}));

// Mock useAuth
const mockUser = { id: 'user-123' };
const { mockUseAuth } = vi.hoisted(() => ({
  mockUseAuth: vi.fn(),
}));
vi.mock('@/hooks/useAuth', () => ({
  useAuth: mockUseAuth,
}));

// Mock logger
vi.mock('@/lib/logger', () => ({
  logger: {
    error: vi.fn(),
  },
}));

// Import hook after mocks (Vitest hoists vi.mock factories).
const { useBookmarks } = await import('@/hooks/useBookmarks');

describe('useBookmarks', () => {
  beforeEach(() => {
    vi.resetAllMocks();

    mockUseAuth.mockReturnValue({ user: mockUser });
    
    // Setup default chain
    mockOrder.mockReturnValue({ data: [], error: null });
    mockEq.mockReturnValue({ order: mockOrder });
    mockSelect.mockReturnValue({ eq: mockEq });
    mockFrom.mockReturnValue({ select: mockSelect });
  });

  it('should return empty bookmarks when user is not logged in', async () => {
    mockUseAuth.mockReturnValue({ user: null });
    
    const { result } = renderHook(() => useBookmarks());
    expect(result.current.bookmarks).toEqual([]);
  });

  it('should load bookmarks when user is logged in', async () => {
    const mockData = [
      {
        created_at: '2024-01-01',
        news_articles: {
          slug: 'test-article',
          title: 'Test Article',
          excerpt: 'Test excerpt',
          cover_image: '/test.jpg',
          news_article_categories: [
            { categories: { slug: 'economia' } },
          ],
        },
      },
    ];
    
    mockOrder.mockResolvedValue({ data: mockData, error: null });
    
    const { result } = renderHook(() => useBookmarks());
    
    await waitFor(() => {
      expect(result.current.bookmarks).toHaveLength(1);
    });
    
    expect(result.current.bookmarks[0].articleSlug).toBe('test-article');
  });

  it('should check if article is bookmarked', async () => {
    const mockData = [
      {
        created_at: '2024-01-01',
        news_articles: {
          slug: 'test-article',
          title: 'Test Article',
          excerpt: 'Test excerpt',
          cover_image: '/test.jpg',
          news_article_categories: [],
        },
      },
    ];
    
    mockOrder.mockResolvedValue({ data: mockData, error: null });
    
    const { result } = renderHook(() => useBookmarks());
    
    await waitFor(() => {
      expect(result.current.isBookmarked('test-article')).toBe(true);
      expect(result.current.isBookmarked('other-article')).toBe(false);
    });
  });

  it('should handle error when loading bookmarks', async () => {
    mockOrder.mockResolvedValue({ data: null, error: new Error('DB Error') });
    
    const { result } = renderHook(() => useBookmarks());
    
    await waitFor(() => {
      expect(result.current.bookmarks).toEqual([]);
    });
  });

  it('should add bookmark successfully', async () => {
    mockOrder.mockResolvedValue({ data: [], error: null });
    
    const mockSingle = vi.fn().mockResolvedValue({ 
      data: { id: 'article-123' }, 
      error: null 
    });
    const mockSelect2 = vi.fn().mockReturnValue({ eq: vi.fn().mockReturnValue({ single: mockSingle }) });
    
    mockInsert.mockResolvedValue({ error: null });
    mockFrom.mockImplementation((table: string) => {
      if (table === 'bookmarks') {
        return { insert: mockInsert, select: mockSelect };
      }
      return { select: mockSelect2 };
    });
    
    const { result } = renderHook(() => useBookmarks());
    
    await waitFor(() => {
      expect(result.current.bookmarks).toEqual([]);
    });
    
    const bookmark = {
      articleSlug: 'new-article',
      title: 'New Article',
      category: 'economia',
      excerpt: 'Excerpt',
      coverImage: '/image.jpg',
    };
    
    await result.current.addBookmark(bookmark);
    
    expect(mockInsert).toHaveBeenCalled();
  });

  it('should remove bookmark successfully', async () => {
    const mockData = [
      {
        created_at: '2024-01-01',
        news_articles: {
          slug: 'test-article',
          title: 'Test Article',
          excerpt: 'Test excerpt',
          cover_image: '/test.jpg',
          news_article_categories: [],
        },
      },
    ];
    
    mockOrder.mockResolvedValueOnce({ data: mockData, error: null });
    mockOrder.mockResolvedValueOnce({ data: [], error: null }); // After removal
    
    const mockSingle = vi.fn().mockResolvedValue({ 
      data: { id: 'article-123' }, 
      error: null 
    });
    const mockEq2 = vi.fn().mockReturnValue({ eq: vi.fn().mockReturnValue({ single: mockSingle }) });
    const mockDelete = vi.fn().mockReturnValue({ eq: mockEq2 });
    
    mockFrom.mockImplementation((table: string) => {
      if (table === 'bookmarks') {
        return { 
          delete: mockDelete,
          select: mockSelect,
        };
      }
      return { select: vi.fn().mockReturnValue({ eq: vi.fn().mockReturnValue({ single: mockSingle }) }) };
    });
    
    const { result } = renderHook(() => useBookmarks());
    
    await waitFor(() => {
      expect(result.current.bookmarks).toHaveLength(1);
    });
    
    await result.current.removeBookmark('test-article');
  });

  it('should toggle bookmark', async () => {
    mockOrder.mockResolvedValue({ data: [], error: null });
    
    const mockSingle = vi.fn().mockResolvedValue({ 
      data: { id: 'article-123' }, 
      error: null 
    });
    
    mockFrom.mockImplementation((table: string) => {
      if (table === 'bookmarks') {
        return { 
          insert: vi.fn().mockResolvedValue({ error: null }),
          delete: vi.fn().mockReturnValue({ eq: vi.fn().mockReturnValue({ eq: vi.fn().mockResolvedValue({ error: null }) }) }),
          select: mockSelect,
        };
      }
      return { select: vi.fn().mockReturnValue({ eq: vi.fn().mockReturnValue({ single: mockSingle }) }) };
    });
    
    const { result } = renderHook(() => useBookmarks());
    
    await waitFor(() => {
      expect(result.current.bookmarks).toEqual([]);
    });
    
    const bookmark = {
      articleSlug: 'new-article',
      title: 'New Article',
      category: 'economia',
      excerpt: 'Excerpt',
      coverImage: '/image.jpg',
    };
    
    // Toggle on (add)
    await result.current.toggleBookmark(bookmark);
  });

  it('should clear all bookmarks', async () => {
    mockOrder.mockResolvedValue({ data: [], error: null });
    
    const mockDelete = vi.fn().mockReturnValue({ 
      eq: vi.fn().mockResolvedValue({ error: null }) 
    });
    
    mockFrom.mockImplementation((table: string) => {
      if (table === 'bookmarks') {
        return { 
          delete: mockDelete,
          select: mockSelect,
        };
      }
      return { select: mockSelect };
    });
    
    const { result } = renderHook(() => useBookmarks());
    
    await waitFor(() => {
      expect(result.current.bookmarks).toEqual([]);
    });
    
    await result.current.clearAll();
  });

  it('should not add bookmark when user is not logged in', async () => {
    mockUseAuth.mockReturnValue({ user: null });
    
    const { result } = renderHook(() => useBookmarks());
    
    const bookmark = {
      articleSlug: 'new-article',
      title: 'New Article',
      category: 'economia',
      excerpt: 'Excerpt',
      coverImage: '/image.jpg',
    };
    
    await result.current.addBookmark(bookmark);
    expect(mockInsert).not.toHaveBeenCalled();
  });
});
