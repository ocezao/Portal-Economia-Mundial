import { describe, expect, it, vi } from 'vitest';

import { searchArticles } from './newsManager';
import { supabase } from '@/lib/supabaseClient';

// In test env we don't want real network/db calls.
vi.mock('@/lib/supabaseClient', () => {
  const makeQuery = () => {
    const q: Record<string, unknown> = {};
    const chain = () => q;
    q.select = chain;
    q.eq = chain;
    q.or = chain;
    q.order = chain;
    q.limit = chain;
    q.in = chain;
    q.range = chain;
    q.then = (onFulfilled: (value: unknown) => unknown, onRejected: (reason: unknown) => unknown) =>
      Promise.resolve({ data: [], error: null }).then(onFulfilled, onRejected);
    return q;
  };

  return {
    isSupabaseConfigured: true,
    supabase: {
      rpc: vi.fn(async () => ({ data: [], error: { message: 'missing function' } })),
      from: vi.fn(() => makeQuery()),
    },
  };
});

describe('newsManager.searchArticles', () => {
  it('returns [] for empty query', async () => {
    const res = await searchArticles('   ');
    expect(res).toEqual([]);
  });

  it('falls back to ilike when RPC is unavailable', async () => {
    const res = await searchArticles('economia');
    expect(Array.isArray(res)).toBe(true);
    expect((supabase as { rpc: unknown }).rpc).toHaveBeenCalled();
  });
});

