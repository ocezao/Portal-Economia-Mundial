import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor, act } from '@testing-library/react';

const mockUser = { id: 'user-123', email: 'test@example.com' };
let mockUserState: typeof mockUser | null = mockUser;

vi.mock('@/hooks/useAuth', () => ({
  useAuth: () => ({ user: mockUserState }),
}));

vi.mock('@/lib/logger', () => ({
  logger: {
    error: vi.fn(),
  },
}));

const fetchMock = vi.fn();
global.fetch = fetchMock as unknown as typeof fetch;

const { useReadingHistory } = await import('@/hooks/useReadingHistory');

describe('useReadingHistory', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    mockUserState = mockUser;
    fetchMock.mockResolvedValue({
      ok: true,
      json: async () => ({ history: [] }),
    });
  });

  it('deve retornar historico vazio quando usuario nao esta logado', async () => {
    mockUserState = null;

    const { result } = renderHook(() => useReadingHistory());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.history).toEqual([]);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('deve carregar historico da API local', async () => {
    fetchMock.mockResolvedValue({
      ok: true,
      json: async () => ({
        history: [{
          articleSlug: 'artigo-teste',
          title: 'Artigo de Teste',
          category: 'economia',
          readAt: '2024-01-15T10:00:00Z',
          timeSpent: 300,
          progress: 100,
        }],
      }),
    });

    const { result } = renderHook(() => useReadingHistory());

    await waitFor(() => {
      expect(result.current.history).toHaveLength(1);
    });

    expect(result.current.history[0].articleSlug).toBe('artigo-teste');
    expect(result.current.isLoading).toBe(false);
  });

  it('deve expor reload e consultar novamente a API', async () => {
    const { result } = renderHook(() => useReadingHistory());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    await act(async () => {
      await result.current.reload();
    });

    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(fetchMock).toHaveBeenCalledWith('/api/user/reading-history', expect.any(Object));
  });
});
