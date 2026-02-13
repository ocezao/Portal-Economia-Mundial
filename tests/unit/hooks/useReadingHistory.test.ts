import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';

// Mock supabase
const mockSelect = vi.fn();
const mockEq = vi.fn();
const mockOrder = vi.fn();
const mockFrom = vi.fn();

vi.mock('@/lib/supabaseClient', () => ({
  supabase: {
    from: (table: string) => mockFrom(table),
  },
}));

// Mock useAuth
const mockUser = { id: 'user-123', email: 'test@example.com' };
let mockUserState: typeof mockUser | null = mockUser;

vi.mock('@/hooks/useAuth', () => ({
  useAuth: () => ({ user: mockUserState }),
}));

// Mock logger
vi.mock('@/lib/logger', () => ({
  logger: {
    error: vi.fn(),
  },
}));

import { useReadingHistory } from '@/hooks/useReadingHistory';

describe('useReadingHistory', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    mockUserState = mockUser;
    
    // Setup default chain
    mockOrder.mockReturnValue({ data: [], error: null });
    mockEq.mockReturnValue({ order: mockOrder });
    mockSelect.mockReturnValue({ eq: mockEq });
    mockFrom.mockReturnValue({ select: mockSelect });
  });

  it('deve retornar histórico vazio quando usuário não está logado', async () => {
    mockUserState = null;
    
    const { result } = renderHook(() => useReadingHistory());
    
    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });
    
    expect(result.current.history).toEqual([]);
  });

  it('deve carregar histórico quando usuário está logado', async () => {
    const mockData = [
      {
        read_at: '2024-01-15T10:00:00Z',
        time_spent: 300,
        news_articles: {
          slug: 'artigo-teste',
          title: 'Artigo de Teste',
          news_article_categories: [
            { categories: { slug: 'economia' } },
          ],
        },
      },
    ];
    
    mockOrder.mockResolvedValue({ data: mockData, error: null });
    
    const { result } = renderHook(() => useReadingHistory());
    
    await waitFor(() => {
      expect(result.current.history).toHaveLength(1);
    });
    
    expect(result.current.history[0].articleSlug).toBe('artigo-teste');
    expect(result.current.history[0].title).toBe('Artigo de Teste');
    expect(result.current.history[0].category).toBe('economia');
    expect(result.current.isLoading).toBe(false);
  });

  it('deve usar categoria padrão quando não há categoria', async () => {
    const mockData = [
      {
        read_at: '2024-01-15T10:00:00Z',
        time_spent: 300,
        news_articles: {
          slug: 'artigo-teste',
          title: 'Artigo de Teste',
          news_article_categories: [],
        },
      },
    ];
    
    mockOrder.mockResolvedValue({ data: mockData, error: null });
    
    const { result } = renderHook(() => useReadingHistory());
    
    await waitFor(() => {
      expect(result.current.history).toHaveLength(1);
    });
    
    expect(result.current.history[0].category).toBe('economia');
  });

  it('deve filtrar itens sem slug', async () => {
    const mockData = [
      {
        read_at: '2024-01-15T10:00:00Z',
        time_spent: 300,
        news_articles: {
          slug: '',
          title: 'Artigo Inválido',
          news_article_categories: [],
        },
      },
      {
        read_at: '2024-01-15T11:00:00Z',
        time_spent: 200,
        news_articles: {
          slug: 'artigo-valido',
          title: 'Artigo Válido',
          news_article_categories: [],
        },
      },
    ];
    
    mockOrder.mockResolvedValue({ data: mockData, error: null });
    
    const { result } = renderHook(() => useReadingHistory());
    
    await waitFor(() => {
      expect(result.current.history).toHaveLength(1);
    });
    
    expect(result.current.history[0].articleSlug).toBe('artigo-valido');
  });

  it('deve lidar com erro ao carregar histórico', async () => {
    mockOrder.mockResolvedValue({ data: null, error: new Error('DB Error') });
    
    const { result } = renderHook(() => useReadingHistory());
    
    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });
    
    expect(result.current.history).toEqual([]);
  });

  it('deve fornecer função de reload', async () => {
    mockOrder.mockResolvedValue({ data: [], error: null });
    
    const { result } = renderHook(() => useReadingHistory());
    
    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });
    
    expect(typeof result.current.reload).toBe('function');
    
    // Chamar reload
    result.current.reload();
    
    await waitFor(() => {
      expect(mockFrom).toHaveBeenCalledWith('reading_history');
    });
  });

  it('deve definir progress como 100', async () => {
    const mockData = [
      {
        read_at: '2024-01-15T10:00:00Z',
        time_spent: 300,
        news_articles: {
          slug: 'artigo-teste',
          title: 'Artigo de Teste',
          news_article_categories: [],
        },
      },
    ];
    
    mockOrder.mockResolvedValue({ data: mockData, error: null });
    
    const { result } = renderHook(() => useReadingHistory());
    
    await waitFor(() => {
      expect(result.current.history).toHaveLength(1);
    });
    
    expect(result.current.history[0].progress).toBe(100);
  });

  it('deve usar valores padrão quando dados estão incompletos', async () => {
    const mockData = [
      {
        read_at: null,
        time_spent: null,
        news_articles: {
          slug: 'artigo-incompleto',
          title: null,
          news_article_categories: null,
        },
      },
    ];
    
    mockOrder.mockResolvedValue({ data: mockData, error: null });
    
    const { result } = renderHook(() => useReadingHistory());
    
    await waitFor(() => {
      expect(result.current.history).toHaveLength(1);
    });
    
    expect(result.current.history[0].articleSlug).toBe('artigo-incompleto');
    expect(result.current.history[0].title).toBe('');
    expect(result.current.history[0].timeSpent).toBe(0);
    expect(result.current.history[0].readAt).toBeDefined();
  });
});
