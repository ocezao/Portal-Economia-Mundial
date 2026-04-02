import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor, act } from '@testing-library/react';

const { mockUseAuth } = vi.hoisted(() => ({
  mockUseAuth: vi.fn(),
}));

vi.mock('@/hooks/useAuth', () => ({
  useAuth: mockUseAuth,
}));

vi.mock('@/lib/logger', () => ({
  logger: {
    error: vi.fn(),
  },
}));

const fetchMock = vi.fn();
global.fetch = fetchMock as unknown as typeof fetch;

const { useBookmarks } = await import('@/hooks/useBookmarks');

describe('useBookmarks', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    mockUseAuth.mockReturnValue({ user: { id: 'user-123' } });
    fetchMock.mockResolvedValue({
      ok: true,
      json: async () => ({ bookmarks: [] }),
    });
  });

  it('should return empty bookmarks when user is not logged in', () => {
    mockUseAuth.mockReturnValue({ user: null });

    const { result } = renderHook(() => useBookmarks());
    expect(result.current.bookmarks).toEqual([]);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('should load bookmarks from local API', async () => {
    fetchMock.mockResolvedValue({
      ok: true,
      json: async () => ({
        bookmarks: [{
          articleSlug: 'test-article',
          title: 'Test Article',
          category: 'economia',
          excerpt: 'Test excerpt',
          coverImage: '/test.jpg',
          bookmarkedAt: '2024-01-01T00:00:00Z',
        }],
      }),
    });

    const { result } = renderHook(() => useBookmarks());

    await waitFor(() => {
      expect(result.current.bookmarks).toHaveLength(1);
    });

    expect(result.current.bookmarks[0].articleSlug).toBe('test-article');
    expect(fetchMock).toHaveBeenCalledWith('/api/user/bookmarks', expect.any(Object));
  });

  it('should add bookmark through local API', async () => {
    fetchMock
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ bookmarks: [] }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ ok: true }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          bookmarks: [{
            articleSlug: 'new-article',
            title: 'New Article',
            category: 'economia',
            excerpt: 'Excerpt',
            coverImage: '/image.jpg',
            bookmarkedAt: '2024-01-01T00:00:00Z',
          }],
        }),
      });

    const { result } = renderHook(() => useBookmarks());

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledTimes(1);
    });

    await act(async () => {
      await result.current.addBookmark({
        articleSlug: 'new-article',
        title: 'New Article',
        category: 'economia',
        excerpt: 'Excerpt',
        coverImage: '/image.jpg',
      });
    });

    expect(fetchMock).toHaveBeenNthCalledWith(
      2,
      '/api/user/bookmarks',
      expect.objectContaining({ method: 'POST' }),
    );
  });

  it('should remove bookmark through local API', async () => {
    fetchMock
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          bookmarks: [{
            articleSlug: 'test-article',
            title: 'Test Article',
            category: 'economia',
            excerpt: 'Test excerpt',
            coverImage: '/test.jpg',
            bookmarkedAt: '2024-01-01T00:00:00Z',
          }],
        }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ ok: true }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ bookmarks: [] }),
      });

    const { result } = renderHook(() => useBookmarks());

    await waitFor(() => {
      expect(result.current.bookmarks).toHaveLength(1);
    });

    await act(async () => {
      await result.current.removeBookmark('test-article');
    });

    expect(fetchMock).toHaveBeenNthCalledWith(
      2,
      '/api/user/bookmarks?articleSlug=test-article',
      expect.objectContaining({ method: 'DELETE' }),
    );
  });
});
