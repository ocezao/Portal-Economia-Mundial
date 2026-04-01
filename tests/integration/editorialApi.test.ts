import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  requireEditorialRequest: vi.fn(),
  createEditorialArticle: vi.fn(),
  addEditorialArticleSource: vi.fn(),
  enrichStoredEditorialArticle: vi.fn(),
  validateEditorialArticle: vi.fn(),
  approveEditorialArticle: vi.fn(),
  publishEditorialArticle: vi.fn(),
  scheduleEditorialArticle: vi.fn(),
  listEditorialJobs: vi.fn(),
  dispatchDueEditorialJobs: vi.fn(),
  parseEditorialPayload: vi.fn((input) => input),
  parseEditorialSourcePayload: vi.fn((input) => input),
  parseEditorialApprovePayload: vi.fn((input) => input),
  parseEditorialPublishPayload: vi.fn((input) => input),
  parseEditorialSchedulePayload: vi.fn((input) => input),
  parseEditorialJobsQuery: vi.fn((input) => input),
  formatZodError: vi.fn(() => 'invalid payload'),
}));

vi.mock('@/lib/server/adminApi', () => ({
  requireEditorialRequest: mocks.requireEditorialRequest,
}));

vi.mock('@/lib/server/editorialAdmin', () => ({
  createEditorialArticle: mocks.createEditorialArticle,
  addEditorialArticleSource: mocks.addEditorialArticleSource,
  enrichStoredEditorialArticle: mocks.enrichStoredEditorialArticle,
  validateEditorialArticle: mocks.validateEditorialArticle,
  approveEditorialArticle: mocks.approveEditorialArticle,
  publishEditorialArticle: mocks.publishEditorialArticle,
  scheduleEditorialArticle: mocks.scheduleEditorialArticle,
  listEditorialJobs: mocks.listEditorialJobs,
}));

vi.mock('@/lib/server/editorialApi', () => ({
  parseEditorialPayload: mocks.parseEditorialPayload,
  parseEditorialSourcePayload: mocks.parseEditorialSourcePayload,
  parseEditorialApprovePayload: mocks.parseEditorialApprovePayload,
  parseEditorialPublishPayload: mocks.parseEditorialPublishPayload,
  parseEditorialSchedulePayload: mocks.parseEditorialSchedulePayload,
  parseEditorialJobsQuery: mocks.parseEditorialJobsQuery,
  formatZodError: mocks.formatZodError,
}));

vi.mock('@/services/editorialJobs', () => ({
  dispatchDueEditorialJobs: mocks.dispatchDueEditorialJobs,
}));

import { GET as getDiscovery } from '@/app/api/v1/editorial/route';
import { GET as getAuth } from '@/app/api/v1/editorial/auth/route';
import { POST as createArticle } from '@/app/api/v1/editorial/articles/route';
import { POST as addSource } from '@/app/api/v1/editorial/articles/[id]/sources/route';
import { POST as enrichArticle } from '@/app/api/v1/editorial/articles/[id]/enrich/route';
import { GET as validateArticle } from '@/app/api/v1/editorial/articles/[id]/validate/route';
import { POST as approveArticle } from '@/app/api/v1/editorial/articles/[id]/approve/route';
import { POST as publishArticle } from '@/app/api/v1/editorial/articles/[id]/publish/route';
import { POST as scheduleArticle } from '@/app/api/v1/editorial/articles/[id]/schedule/route';
import { GET as listJobs } from '@/app/api/v1/editorial/jobs/route';
import { POST as dispatchJobs } from '@/app/api/v1/editorial/jobs/dispatch/route';

function makeRequest(url: string, init?: RequestInit) {
  return new Request(url, init);
}

async function readJson(response: Response) {
  return response.json() as Promise<Record<string, unknown>>;
}

describe('Editorial API integration', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.requireEditorialRequest.mockResolvedValue({
      ok: true,
      admin: null,
      userId: 'editorial-agent',
      user: { id: 'editorial-agent', role: 'admin' },
    });
  });

  it('returns discovery metadata for agents', async () => {
    const response = await getDiscovery(makeRequest('https://example.com/api/v1/editorial'));
    const body = await readJson(response);

    expect(response.status).toBe(200);
    expect(body.ok).toBe(true);
    expect(body.data.docs).toBe('/api/v1/editorial/openapi');
    expect(body.data.endpoints.auth).toBe('/api/v1/editorial/auth');
    expect(body.data.authentication.supported).toContain('Authorization: Bearer <EDITORIAL_API_KEY>');
  });

  it('rejects auth check when credential is invalid', async () => {
    mocks.requireEditorialRequest.mockResolvedValueOnce({
      ok: false,
      status: 401,
      message: 'Nao autorizado',
    });

    const response = await getAuth(makeRequest('https://example.com/api/v1/editorial/auth'));
    const body = await readJson(response);

    expect(response.status).toBe(401);
    expect(body.ok).toBe(false);
    expect(body.error.code).toBe('UNAUTHORIZED');
  });

  it('creates an article in draft mode through the editorial route', async () => {
    mocks.createEditorialArticle.mockResolvedValueOnce({
      id: 'article-1',
      slug: 'novo-artigo',
      status: 'draft',
      editorial_status: 'draft',
      published_at: null,
    });

    const response = await createArticle(makeRequest('https://example.com/api/v1/editorial/articles', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ title: 'Novo artigo', status: 'draft' }),
    }));
    const body = await readJson(response);

    expect(response.status).toBe(201);
    expect(body.ok).toBe(true);
    expect(body.data.status).toBe('draft');
    expect(mocks.createEditorialArticle).toHaveBeenCalledTimes(1);
  });

  it('returns workflow conflict when creation tries to bypass draft', async () => {
    mocks.createEditorialArticle.mockRejectedValueOnce(
      new Error('Fluxo editorial exige criacao inicial como draft'),
    );

    const response = await createArticle(makeRequest('https://example.com/api/v1/editorial/articles', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ title: 'Artigo invalido', status: 'published' }),
    }));
    const body = await readJson(response);

    expect(response.status).toBe(409);
    expect(body.ok).toBe(false);
    expect(body.error.code).toBe('WORKFLOW_CONFLICT');
  });

  it('adds a source to the article', async () => {
    mocks.addEditorialArticleSource.mockResolvedValueOnce({
      id: 'source-1',
      source_name: 'Reuters',
    });

    const response = await addSource(
      makeRequest('https://example.com/api/v1/editorial/articles/novo-artigo/sources?lookup=slug', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ sourceName: 'Reuters' }),
      }),
      { params: Promise.resolve({ id: 'novo-artigo' }) },
    );
    const body = await readJson(response);

    expect(response.status).toBe(201);
    expect(body.ok).toBe(true);
    expect(mocks.addEditorialArticleSource).toHaveBeenCalledWith(null, 'novo-artigo', 'slug', { sourceName: 'Reuters' });
  });

  it('returns validation payload for the article', async () => {
    mocks.validateEditorialArticle.mockResolvedValueOnce({
      articleId: 'article-1',
      slug: 'novo-artigo',
      status: 'draft',
      editorialStatus: 'draft',
      readyToPublish: false,
      issues: [{ code: 'missing_approval', severity: 'error', message: 'missing approval' }],
      checks: {
        hasTitle: true,
        hasExcerpt: true,
        hasContent: true,
        hasCategory: true,
        hasAuthor: true,
        hasCoverImage: true,
        hasSeoTitle: true,
        hasMetaDescription: true,
        hasFaqItems: true,
        hasSources: true,
        scheduledWithDate: true,
        hasApprovedStatus: false,
      },
    });

    const response = await validateArticle(
      makeRequest('https://example.com/api/v1/editorial/articles/novo-artigo/validate?lookup=slug'),
      { params: Promise.resolve({ id: 'novo-artigo' }) },
    );
    const body = await readJson(response);

    expect(response.status).toBe(200);
    expect(body.ok).toBe(true);
    expect(body.data.readyToPublish).toBe(false);
    expect(body.data.issues[0].code).toBe('missing_approval');
  });

  it('enriches stored editorial metadata', async () => {
    mocks.enrichStoredEditorialArticle.mockResolvedValueOnce({
      id: 'article-1',
      slug: 'novo-artigo',
      seo_title: 'Titulo SEO enriquecido',
      meta_description: 'Meta description enriquecida com tamanho adequado.',
      faq_items: [{ question: 'O que mudou?', answer: 'O artigo foi enriquecido.' }],
      editorial_status: 'enriched',
    });

    const response = await enrichArticle(
      makeRequest('https://example.com/api/v1/editorial/articles/novo-artigo/enrich?lookup=slug', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({}),
      }),
      { params: Promise.resolve({ id: 'novo-artigo' }) },
    );
    const body = await readJson(response);

    expect(response.status).toBe(200);
    expect(body.ok).toBe(true);
    expect(body.data.editorial_status).toBe('enriched');
    expect(mocks.enrichStoredEditorialArticle).toHaveBeenCalledWith(null, 'novo-artigo', 'slug');
  });

  it('returns validation conflict when approve is requested too early', async () => {
    mocks.approveEditorialArticle.mockRejectedValueOnce(
      new Error('Artigo ainda nao pode ser aprovado; execute validate e corrija os erros pendentes'),
    );

    const response = await approveArticle(
      makeRequest('https://example.com/api/v1/editorial/articles/novo-artigo/approve?lookup=slug', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({}),
      }),
      { params: Promise.resolve({ id: 'novo-artigo' }) },
    );
    const body = await readJson(response);

    expect(response.status).toBe(409);
    expect(body.ok).toBe(false);
    expect(body.error.code).toBe('VALIDATION_REQUIRED');
  });

  it('returns validation conflict when publish is requested before approval', async () => {
    mocks.publishEditorialArticle.mockRejectedValueOnce(
      new Error('Artigo nao esta apto para publicacao; execute validate e corrija os erros antes de publicar ou agendar'),
    );

    const response = await publishArticle(
      makeRequest('https://example.com/api/v1/editorial/articles/novo-artigo/publish?lookup=slug', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({}),
      }),
      { params: Promise.resolve({ id: 'novo-artigo' }) },
    );
    const body = await readJson(response);

    expect(response.status).toBe(409);
    expect(body.ok).toBe(false);
    expect(body.error.code).toBe('VALIDATION_REQUIRED');
  });

  it('returns validation conflict when schedule is requested before approval', async () => {
    mocks.parseEditorialSchedulePayload.mockReturnValueOnce({
      publishedAt: '2026-04-02T12:30:00-03:00',
    });
    mocks.scheduleEditorialArticle.mockRejectedValueOnce(
      new Error('Artigo nao esta apto para publicacao; execute validate e corrija os erros antes de publicar ou agendar'),
    );

    const response = await scheduleArticle(
      makeRequest('https://example.com/api/v1/editorial/articles/novo-artigo/schedule?lookup=slug', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ publishedAt: '2026-04-02T12:30:00-03:00' }),
      }),
      { params: Promise.resolve({ id: 'novo-artigo' }) },
    );
    const body = await readJson(response);

    expect(response.status).toBe(409);
    expect(body.ok).toBe(false);
    expect(body.error.code).toBe('VALIDATION_REQUIRED');
  });

  it('lists editorial jobs with envelope and filters', async () => {
    mocks.listEditorialJobs.mockResolvedValueOnce([
      { id: 'job-1', status: 'queued', job_type: 'publish_article' },
    ]);

    const response = await listJobs(
      makeRequest('https://example.com/api/v1/editorial/jobs?status=queued&limit=10'),
    );
    const body = await readJson(response);

    expect(response.status).toBe(200);
    expect(body.ok).toBe(true);
    expect(body.data.items).toHaveLength(1);
    expect(body.data.filters.status).toBe('queued');
  });

  it('dispatches due editorial jobs', async () => {
    mocks.dispatchDueEditorialJobs.mockResolvedValueOnce({
      processed: 1,
      published: 1,
      failed: 0,
    });

    const response = await dispatchJobs(
      makeRequest('https://example.com/api/v1/editorial/jobs/dispatch', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ limit: 5 }),
      }),
    );
    const body = await readJson(response);

    expect(response.status).toBe(200);
    expect(body.ok).toBe(true);
    expect(body.data.processed).toBe(1);
    expect(mocks.dispatchDueEditorialJobs).toHaveBeenCalledWith(5);
  });
});
