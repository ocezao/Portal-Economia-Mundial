import { beforeEach, describe, expect, it, vi } from 'vitest';

interface JobState {
  id: string;
  article_id: string;
  job_type: string;
  status: string;
  run_after: string | null;
  attempts: number | null;
  result?: string | null;
  last_error?: string | null;
}

const state = vi.hoisted(() => ({
  jobs: [] as JobState[],
  articleStatus: 'scheduled',
}));

const dbMocks = vi.hoisted(() => ({
  withTransaction: vi.fn(),
}));

vi.mock('@/lib/db', () => ({
  withTransaction: dbMocks.withTransaction,
}));

import { dispatchDueEditorialJobs } from '@/services/editorialJobs';

function createClient() {
  return {
    query: vi.fn(async (sql: string, params?: unknown[]) => {
      if (sql.includes('from article_jobs') && sql.includes("where status = 'queued'")) {
        const limit = Number(params?.[0] ?? 25);
        const rows = state.jobs
          .filter((job) => job.status === 'queued')
          .slice(0, limit)
          .map((job) => ({ ...job }));
        return { rows, rowCount: rows.length };
      }

      if (sql.includes('update article_jobs') && sql.includes("set status = 'running'")) {
        const attempts = Number(params?.[0] ?? 0);
        const jobId = String(params?.[1] ?? '');
        const job = state.jobs.find((item) => item.id === jobId);
        if (job) {
          job.status = 'running';
          job.attempts = attempts;
        }
        return { rows: [], rowCount: job ? 1 : 0 };
      }

      if (sql.includes('update news_articles')) {
        const shouldPublish = state.articleStatus === 'scheduled';
        if (shouldPublish) {
          state.articleStatus = 'published';
        }
        return { rows: [], rowCount: shouldPublish ? 1 : 0 };
      }

      if (sql.includes('update article_jobs') && sql.includes("set status = 'completed'")) {
        const jobId = String(params?.[1] ?? '');
        const job = state.jobs.find((item) => item.id === jobId);
        if (job) {
          job.status = 'completed';
          job.result = String(params?.[0] ?? null);
          job.last_error = null;
        }
        return { rows: [], rowCount: job ? 1 : 0 };
      }

      if (sql.includes('update article_jobs') && sql.includes("set status = 'failed'")) {
        const message = String(params?.[0] ?? '');
        const jobId = String(params?.[1] ?? '');
        const job = state.jobs.find((item) => item.id === jobId);
        if (job) {
          job.status = 'failed';
          job.last_error = message;
        }
        return { rows: [], rowCount: job ? 1 : 0 };
      }

      throw new Error(`Unhandled SQL in test: ${sql}`);
    }),
  };
}

describe('dispatchDueEditorialJobs', () => {
  beforeEach(() => {
    state.jobs = [
      {
        id: 'job-1',
        article_id: 'article-1',
        job_type: 'publish_article',
        status: 'queued',
        run_after: '2026-04-01T09:00:00.000Z',
        attempts: 0,
      },
    ];
    state.articleStatus = 'scheduled';

    dbMocks.withTransaction.mockImplementation(async (fn: (client: ReturnType<typeof createClient>) => Promise<unknown>) => {
      const client = createClient();
      return fn(client);
    });
  });

  it('publishes queued jobs once and does not reprocess on the next dispatch', async () => {
    const first = await dispatchDueEditorialJobs(10);
    const second = await dispatchDueEditorialJobs(10);

    expect(first).toEqual({ processed: 1, published: 1, failed: 0 });
    expect(second).toEqual({ processed: 0, published: 0, failed: 0 });
    expect(state.jobs[0]?.status).toBe('completed');
    expect(state.jobs[0]?.attempts).toBe(1);
    expect(state.articleStatus).toBe('published');
  });

  it('does not count as published when the article is no longer scheduled', async () => {
    state.articleStatus = 'published';

    const result = await dispatchDueEditorialJobs(10);

    expect(result).toEqual({ processed: 1, published: 0, failed: 0 });
    expect(state.jobs[0]?.status).toBe('completed');
  });
});
