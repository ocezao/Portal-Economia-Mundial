import { beforeEach, describe, expect, it, vi } from 'vitest';

const {
  requireEditorialRequestMock,
  getEditorialSeoAuditMock,
  getEditorialInternalLinkSuggestionsMock,
  getEditorialSimilarArticlesMock,
  getEditorialMarketContextMock,
  getEditorialReadinessMock,
  listEditorialUploadLibraryMock,
} = vi.hoisted(() => ({
  requireEditorialRequestMock: vi.fn(),
  getEditorialSeoAuditMock: vi.fn(),
  getEditorialInternalLinkSuggestionsMock: vi.fn(),
  getEditorialSimilarArticlesMock: vi.fn(),
  getEditorialMarketContextMock: vi.fn(),
  getEditorialReadinessMock: vi.fn(),
  listEditorialUploadLibraryMock: vi.fn(),
}));

vi.mock('@/lib/server/adminApi', () => ({
  requireEditorialRequest: requireEditorialRequestMock,
}));

vi.mock('@/lib/server/editorialIntelligence', () => ({
  getEditorialSeoAudit: getEditorialSeoAuditMock,
  getEditorialInternalLinkSuggestions: getEditorialInternalLinkSuggestionsMock,
  getEditorialSimilarArticles: getEditorialSimilarArticlesMock,
  getEditorialMarketContext: getEditorialMarketContextMock,
  getEditorialReadiness: getEditorialReadinessMock,
  listEditorialUploadLibrary: listEditorialUploadLibraryMock,
}));

describe('editorial capabilities routes', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    requireEditorialRequestMock.mockResolvedValue({ ok: true, admin: null, userId: 'agent' });
  });

  it('returns seo audit envelope', async () => {
    const { GET } = await import('@/app/api/v1/editorial/articles/[id]/seo-audit/route');
    getEditorialSeoAuditMock.mockResolvedValue({ article: { slug: 'teste' }, issues: [] });

    const response = await GET(new Request('http://localhost/api/v1/editorial/articles/teste/seo-audit'), {
      params: Promise.resolve({ id: 'teste' }),
    });
    const json = await response.json();

    expect(response.status).toBe(200);
    expect(json.ok).toBe(true);
    expect(getEditorialSeoAuditMock).toHaveBeenCalledWith(null, 'teste', 'id');
  });

  it('returns internal link suggestions', async () => {
    const { GET } = await import('@/app/api/v1/editorial/articles/[id]/internal-links/route');
    getEditorialInternalLinkSuggestionsMock.mockResolvedValue({ items: [{ slug: 'relacionado' }] });

    const response = await GET(new Request('http://localhost/api/v1/editorial/articles/teste/internal-links?limit=3&lookup=slug'), {
      params: Promise.resolve({ id: 'teste' }),
    });
    const json = await response.json();

    expect(response.status).toBe(200);
    expect(json.ok).toBe(true);
    expect(getEditorialInternalLinkSuggestionsMock).toHaveBeenCalledWith(null, 'teste', 'slug', 3);
  });

  it('returns similar articles', async () => {
    const { GET } = await import('@/app/api/v1/editorial/articles/[id]/similar/route');
    getEditorialSimilarArticlesMock.mockResolvedValue({ items: [{ slug: 'parecido', score: 0.6 }] });

    const response = await GET(new Request('http://localhost/api/v1/editorial/articles/teste/similar?limit=4'), {
      params: Promise.resolve({ id: 'teste' }),
    });
    const json = await response.json();

    expect(response.status).toBe(200);
    expect(json.ok).toBe(true);
    expect(getEditorialSimilarArticlesMock).toHaveBeenCalledWith(null, 'teste', 'id', 4);
  });

  it('returns market context', async () => {
    const { GET } = await import('@/app/api/v1/editorial/context/market/route');
    getEditorialMarketContextMock.mockResolvedValue({ indices: [], commodities: [] });

    const response = await GET(new Request('http://localhost/api/v1/editorial/context/market'));
    const json = await response.json();

    expect(response.status).toBe(200);
    expect(json.ok).toBe(true);
    expect(getEditorialMarketContextMock).toHaveBeenCalledTimes(1);
  });

  it('returns readiness context', async () => {
    const { GET } = await import('@/app/api/v1/editorial/readiness/route');
    getEditorialReadinessMock.mockResolvedValue({ ready: true, checks: {} });

    const response = await GET(new Request('http://localhost/api/v1/editorial/readiness'));
    const json = await response.json();

    expect(response.status).toBe(200);
    expect(json.ok).toBe(true);
    expect(getEditorialReadinessMock).toHaveBeenCalledTimes(1);
  });

  it('returns upload library listing', async () => {
    const { GET } = await import('@/app/api/v1/editorial/uploads/library/route');
    listEditorialUploadLibraryMock.mockResolvedValue({ items: [{ path: '2026/04/teste.webp' }], total: 1 });

    const response = await GET(new Request('http://localhost/api/v1/editorial/uploads/library?dir=2026/04&search=teste&limit=10'));
    const json = await response.json();

    expect(response.status).toBe(200);
    expect(json.ok).toBe(true);
    expect(listEditorialUploadLibraryMock).toHaveBeenCalledWith({ dir: '2026/04', search: 'teste', limit: 10 });
  });

  it('returns unauthorized on capability routes when auth fails', async () => {
    const { GET } = await import('@/app/api/v1/editorial/context/market/route');
    requireEditorialRequestMock.mockResolvedValueOnce({ ok: false, status: 401, message: 'Nao autorizado' });

    const response = await GET(new Request('http://localhost/api/v1/editorial/context/market'));
    const json = await response.json();

    expect(response.status).toBe(401);
    expect(json.ok).toBe(false);
    expect(json.error.code).toBe('UNAUTHORIZED');
  });
});
