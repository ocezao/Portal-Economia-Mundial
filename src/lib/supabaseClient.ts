import { createClient } from '@supabase/supabase-js';
import { logger } from './logger';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey);

/**
 * If the project is started without a configured `.env`, creating a Supabase
 * client with an empty URL/key can throw at import-time, leading to a blank
 * screen (the app fails before React renders).
 *
 * To keep the app renderable (public routes, static UI), we only create the
 * real client when env vars exist. Otherwise we export a disabled client that
 * returns `{ data: null, error }` instead of throwing.
 */
function createDisabledSupabaseClient() {
  const makeError = (op: string) =>
    new Error(
      `Supabase not configured (${op}). Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in .env.`,
    );

  const disabledResult = (op: string) => ({ data: null, error: makeError(op) });

  // Minimal thenable query builder so `await supabase.from(...).select(...)` works.
  const makeQuery = (op: string) => {
    const result = disabledResult(op);
    const q: any = {};

    const returnSelf = () => q;
    const returnPromise = () => Promise.resolve(result);

    // Chainable modifiers (common subset).
    q.eq = returnSelf;
    q.neq = returnSelf;
    q.gt = returnSelf;
    q.gte = returnSelf;
    q.lt = returnSelf;
    q.lte = returnSelf;
    q.like = returnSelf;
    q.ilike = returnSelf;
    q.in = returnSelf;
    q.contains = returnSelf;
    q.overlaps = returnSelf;
    q.or = returnSelf;
    q.order = returnSelf;
    q.limit = returnSelf;
    q.range = returnSelf;

    // Explicit terminal helpers.
    q.single = returnPromise;
    q.maybeSingle = returnPromise;

    // CRUD starters (still thenable).
    q.select = returnSelf;
    q.insert = returnSelf;
    q.update = returnSelf;
    q.upsert = returnSelf;
    q.delete = returnSelf;

    // Thenable contract (await works).
    q.then = (onFulfilled: any, onRejected: any) => Promise.resolve(result).then(onFulfilled, onRejected);
    q.catch = (onRejected: any) => Promise.resolve(result).catch(onRejected);
    q.finally = (onFinally: any) => Promise.resolve(result).finally(onFinally);

    return q;
  };

  const authResult = (op: string) => ({
    data: { session: null, user: null },
    error: makeError(op),
  });

  const client: any = {
    from: (_table: string) => makeQuery('from'),
    rpc: (_fn: string, _args?: unknown) => makeQuery('rpc'),
    auth: {
      getSession: async () => authResult('auth.getSession'),
      onAuthStateChange: (_cb: unknown) => ({
        data: { subscription: { unsubscribe: () => void 0 } },
      }),
      signInWithPassword: async (_args: unknown) => authResult('auth.signInWithPassword'),
      signUp: async (_args: unknown) => authResult('auth.signUp'),
      signOut: async () => ({ error: makeError('auth.signOut') }),
      updateUser: async (_args: unknown) => ({ data: { user: null }, error: makeError('auth.updateUser') }),
    },
  };

  return client;
}

export const supabase = isSupabaseConfigured
  ? createClient(supabaseUrl as string, supabaseAnonKey as string, {
      auth: {
        // On the server, there is no localStorage. Supabase-js detects this, but
        // we also disable session persistence/refresh for safety.
        persistSession: typeof window !== 'undefined',
        autoRefreshToken: typeof window !== 'undefined',
      },
    })
  : (createDisabledSupabaseClient() as ReturnType<typeof createClient>);

if (!isSupabaseConfigured) {
  logger.warn(
    'Supabase not configured. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in .env to enable Auth and DB features.',
  );
}
