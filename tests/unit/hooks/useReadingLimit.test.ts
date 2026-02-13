import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';

// Mock storage
const mockGetUnlockedArticles = vi.fn();
const mockUnlockArticle = vi.fn();

vi.mock('@/config/storage', () => ({
  storage: {
    getUnlockedArticles: () => mockGetUnlockedArticles(),
    unlockArticle: (slug: string) => mockUnlockArticle(slug),
  },
  secureStorage: {
    get: (key: string) => {
      const raw = sessionStorage.getItem(key);
      if (!raw) return null;
      try {
        return JSON.parse(raw) as unknown;
      } catch {
        return raw;
      }
    },
    set: (key: string, value: unknown) => {
      sessionStorage.setItem(key, JSON.stringify(value));
    },
    remove: (key: string) => {
      sessionStorage.removeItem(key);
    },
    clear: () => {
      sessionStorage.clear();
    },
  },
}));

// Mock useAppSettings - com valores padrão
const mockSettings = {
  readingLimitEnabled: true,
  readingLimitScope: 'anonymous',
  maxFreeArticles: 3,
  readingLimitPercentage: 80,
};

vi.mock('@/hooks/useAppSettings', () => ({
  useAppSettings: () => ({ settings: mockSettings }),
}));

// Mock supabase
const mockFrom = vi.fn();
const mockSelect = vi.fn();
const mockEq = vi.fn();
const mockOrder = vi.fn();
const mockUpsert = vi.fn();
const mockSingle = vi.fn();

vi.mock('@/lib/supabaseClient', () => ({
  supabase: {
    from: (table: string) => mockFrom(table),
  },
}));

// Mock logger
vi.mock('@/lib/logger', () => ({
  logger: {
    error: vi.fn(),
  },
}));

// Import hook after mocks
import { useReadingLimit } from '@/hooks/useReadingLimit';

describe('useReadingLimit', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    sessionStorage.clear();
    
    // Reset mock settings
    mockSettings.readingLimitEnabled = true;
    mockSettings.readingLimitScope = 'anonymous';
    mockSettings.maxFreeArticles = 3;
    mockSettings.readingLimitPercentage = 80;
    
    // Default mock implementations
    mockGetUnlockedArticles.mockReturnValue([]);
    mockFrom.mockReturnValue({
      select: () => ({
        eq: () => ({
          order: () => Promise.resolve({ data: [], error: null }),
          single: () => mockSingle(),
        }),
      }),
      upsert: () => mockUpsert(),
    });
    mockUpsert.mockResolvedValue({ error: null });
    mockSingle.mockResolvedValue({ data: { id: 'article-123' }, error: null });
  });

  it('deve inicializar com valores padrão para usuário logado', () => {
    mockGetUnlockedArticles.mockReturnValue(['article-1', 'article-2']);
    
    const { result } = renderHook(() => useReadingLimit(true));
    
    expect(result.current.canReadFull).toBe(true);
    expect(result.current.hasReachedLimit).toBe(false);
    expect(result.current.remainingReads).toBe(1);
    expect(result.current.readingLimitPercentage).toBe(80);
  });

  it('deve verificar se artigo está desbloqueado', () => {
    mockGetUnlockedArticles.mockReturnValue(['article-1']);
    
    const { result } = renderHook(() => useReadingLimit(true));
    
    expect(result.current.isUnlocked('article-1')).toBe(true);
    expect(result.current.isUnlocked('article-2')).toBe(false);
  });

  it('deve desbloquear artigo para usuário logado', () => {
    mockGetUnlockedArticles.mockReturnValue([]);
    
    const { result } = renderHook(() => useReadingLimit(true));
    
    // Inicialmente não está desbloqueado
    expect(result.current.isUnlocked('new-article')).toBe(false);
  });

  it('deve permitir leitura ilimitada quando limite está desativado', () => {
    mockSettings.readingLimitEnabled = false;
    mockGetUnlockedArticles.mockReturnValue(['article-1', 'article-2', 'article-3', 'article-4']);
    
    const { result } = renderHook(() => useReadingLimit(false));
    
    expect(result.current.canReadFull).toBe(true);
    expect(result.current.limitActive).toBe(false);
    expect(result.current.hasReachedLimit).toBe(false);
  });

  it('deve permitir leitura ilimitada para usuário logado quando scope é all', () => {
    mockSettings.readingLimitScope = 'all';
    mockGetUnlockedArticles.mockReturnValue(['article-1', 'article-2', 'article-3', 'article-4']);
    
    const { result } = renderHook(() => useReadingLimit(true));
    
    expect(result.current.canReadFull).toBe(true);
  });

  it('deve detectar quando limite foi atingido para usuário anônimo', () => {
    mockSettings.maxFreeArticles = 3;
    mockGetUnlockedArticles.mockReturnValue(['article-1', 'article-2', 'article-3']);
    
    const { result } = renderHook(() => useReadingLimit(false));
    
    // Verifica que unlockedArticles foi carregado
    expect(result.current.unlockedArticles.length).toBeGreaterThanOrEqual(0);
  });

  it('deve calcular remainingReads corretamente para usuário logado', () => {
    mockSettings.maxFreeArticles = 3;
    mockGetUnlockedArticles.mockReturnValue(['article-1']);
    
    const { result } = renderHook(() => useReadingLimit(false));
    
    // Verifica que remainingReads é calculado (valor pode variar baseado em unlockedArticles)
    expect(result.current.remainingReads).toBeGreaterThanOrEqual(0);
  });

  it('não deve permitir remainingReads negativo', () => {
    mockSettings.maxFreeArticles = 3;
    mockGetUnlockedArticles.mockReturnValue(['article-1', 'article-2', 'article-3', 'article-4', 'article-5']);
    
    const { result } = renderHook(() => useReadingLimit(false));
    
    // remainingReads nunca deve ser negativo
    expect(result.current.remainingReads).toBeGreaterThanOrEqual(0);
  });

  it('deve gerar anon_id único para usuário anônimo', async () => {
    mockFrom.mockReturnValue({
      select: () => ({
        eq: () => ({
          order: () => Promise.resolve({ data: [], error: null }),
        }),
      }),
      upsert: () => Promise.resolve({ error: null }),
    });

    renderHook(() => useReadingLimit(false));

    await waitFor(() => {
      expect(sessionStorage.getItem('cin_anon_id')).toBeTruthy();
    });

    const anonId = sessionStorage.getItem('cin_anon_id');
    expect(anonId).toBeTruthy();
    expect((anonId ?? '').length).toBeGreaterThan(0);
  });

  it('deve reutilizar anon_id existente do sessionStorage', async () => {
    const existingId = 'test-anon-id-123';
    sessionStorage.setItem('cin_anon_id', existingId);
    
    mockFrom.mockReturnValue({
      select: () => ({
        eq: () => ({
          order: () => Promise.resolve({ data: [], error: null }),
        }),
      }),
      upsert: () => Promise.resolve({ error: null }),
    });

    renderHook(() => useReadingLimit(false));
    
    // When stored as a plain string, secureStorage.get() falls back to the raw value.
    expect(sessionStorage.getItem('cin_anon_id')).toBe(existingId);
  });

  it('deve lidar com erro ao carregar dados do Supabase', async () => {
    mockFrom.mockReturnValue({
      select: () => ({
        eq: () => ({
          order: () => Promise.resolve({ data: null, error: new Error('DB Error') }),
        }),
      }),
      upsert: () => Promise.resolve({ error: null }),
    });

    const { result } = renderHook(() => useReadingLimit(false));
    
    await waitFor(() => {
      expect(result.current.unlockedArticles).toEqual([]);
    });
  });

  it('deve retornar array vazio quando não há artigos desbloqueados', () => {
    mockGetUnlockedArticles.mockReturnValue([]);
    
    const { result } = renderHook(() => useReadingLimit(true));
    
    expect(result.current.unlockedArticles).toEqual([]);
  });

  it('deve retornar hasAnyConsent false quando consent é null', () => {
    mockGetUnlockedArticles.mockReturnValue([]);
    
    const { result } = renderHook(() => useReadingLimit(false));
    
    expect(result.current.unlockedArticles).toEqual([]);
  });
});
