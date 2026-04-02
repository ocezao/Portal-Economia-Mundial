import { describe, expect, it, vi } from 'vitest';

import * as db from '@/lib/db';
import { searchArticles } from './newsManager';

vi.mock('@/lib/db', () => ({
  query: vi.fn(),
  queryOne: vi.fn(),
  withTransaction: vi.fn(),
}));

describe('newsManager.searchArticles', () => {
  it('returns [] for empty query', async () => {
    const res = await searchArticles('   ');
    expect(res).toEqual([]);
  });

  it('returns [] when local DB query fails', async () => {
    vi.mocked(db.query).mockRejectedValueOnce(new Error('db offline'));
    const res = await searchArticles('economia');
    expect(res).toEqual([]);
  });
});
