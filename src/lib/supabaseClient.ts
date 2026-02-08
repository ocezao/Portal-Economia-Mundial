import { createClient } from '@supabase/supabase-js';
import { logger } from './logger';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey);

// Tipos para o cliente desabilitado
interface DisabledQueryResult {
  data: null;
  error: Error;
}

type QueryMethod = () => DisabledQueryBuilder;
type PromiseMethod = () => Promise<DisabledQueryResult>;

interface DisabledQueryBuilder {
  eq: QueryMethod;
  neq: QueryMethod;
  gt: QueryMethod;
  gte: QueryMethod;
  lt: QueryMethod;
  lte: QueryMethod;
  like: QueryMethod;
  ilike: QueryMethod;
  in: QueryMethod;
  contains: QueryMethod;
  overlaps: QueryMethod;
  or: QueryMethod;
  order: QueryMethod;
  limit: QueryMethod;
  range: QueryMethod;
  single: PromiseMethod;
  maybeSingle: PromiseMethod;
  select: QueryMethod;
  insert: QueryMethod;
  update: QueryMethod;
  upsert: QueryMethod;
  delete: QueryMethod;
  then: <TResult1 = DisabledQueryResult, TResult2 = never>(
    onfulfilled?: ((value: DisabledQueryResult) => TResult1 | PromiseLike<TResult1>) | null,
    onrejected?: ((reason: unknown) => TResult2 | PromiseLike<TResult2>) | null
  ) => Promise<TResult1 | TResult2>;
  catch: <TResult = never>(
    onrejected?: ((reason: unknown) => TResult | PromiseLike<TResult>) | null
  ) => Promise<DisabledQueryResult | TResult>;
  finally: (onfinally?: (() => void) | null) => Promise<DisabledQueryResult>;
}

interface AuthSubscription {
  unsubscribe: () => void;
}

interface AuthStateChangeCallback {
  (cb: unknown): { data: { subscription: AuthSubscription } };
}

interface DisabledSupabaseClient {
  from: (table: string) => DisabledQueryBuilder;
  rpc: (fn: string, args?: Record<string, unknown>) => DisabledQueryBuilder;
  auth: {
    getSession: () => Promise<{ data: { session: null; user: null }; error: Error }>;
    getUser: () => Promise<{ data: { user: null }; error: Error }>;
    onAuthStateChange: AuthStateChangeCallback;
    signInWithPassword: (args: Record<string, unknown>) => Promise<{ data: { session: null; user: null }; error: Error }>;
    signUp: (args: Record<string, unknown>) => Promise<{ data: { session: null; user: null }; error: Error }>;
    signOut: () => Promise<{ error: Error }>;
    updateUser: (args: Record<string, unknown>) => Promise<{ data: { user: null }; error: Error }>;
  };
}

/**
 * If the project is started without a configured `.env`, creating a Supabase
 * client with an empty URL/key can throw at import-time, leading to a blank
 * screen (the app fails before React renders).
 *
 * To keep the app renderable (public routes, static UI), we only create the
 * real client when env vars exist. Otherwise we export a disabled client that
 * returns `{ data: null, error }` instead of throwing.
 */
function createDisabledSupabaseClient(): DisabledSupabaseClient {
  const makeError = (op: string): Error =>
    new Error(
      `Supabase not configured (${op}). Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in .env.`,
    );

  const disabledResult = (op: string): DisabledQueryResult => ({ data: null, error: makeError(op) });

  // Minimal thenable query builder so `await supabase.from(...).select(...)` works.
  const makeQuery = (): DisabledQueryBuilder => {
    const result = disabledResult('query');

    const returnSelf: QueryMethod = () => makeQuery();
    const returnPromise: PromiseMethod = () => Promise.resolve(result);

    const q: DisabledQueryBuilder = {
      // Chainable modifiers (common subset).
      eq: returnSelf,
      neq: returnSelf,
      gt: returnSelf,
      gte: returnSelf,
      lt: returnSelf,
      lte: returnSelf,
      like: returnSelf,
      ilike: returnSelf,
      in: returnSelf,
      contains: returnSelf,
      overlaps: returnSelf,
      or: returnSelf,
      order: returnSelf,
      limit: returnSelf,
      range: returnSelf,

      // Explicit terminal helpers.
      single: returnPromise,
      maybeSingle: returnPromise,

      // CRUD starters (still thenable).
      select: returnSelf,
      insert: returnSelf,
      update: returnSelf,
      upsert: returnSelf,
      delete: returnSelf,

      // Thenable contract (await works).
      then: (onfulfilled, onrejected) => Promise.resolve(result).then(onfulfilled, onrejected),
      catch: (onrejected) => Promise.resolve(result).catch(onrejected),
      finally: (onfinally) => Promise.resolve(result).finally(onfinally),
    };

    return q;
  };

  const authResult = (op: string) => ({
    data: { session: null, user: null },
    error: makeError(op),
  });

  const client: DisabledSupabaseClient = {
    from: () => makeQuery(),
    rpc: () => makeQuery(),
    auth: {
      getSession: async () => authResult('auth.getSession'),
      getUser: async () => ({ data: { user: null }, error: makeError('auth.getUser') }),
      onAuthStateChange: () => ({
        data: { subscription: { unsubscribe: () => { /* no-op */ } } },
      }),
      signInWithPassword: async () => authResult('auth.signInWithPassword'),
      signUp: async () => authResult('auth.signUp'),
      signOut: async () => ({ error: makeError('auth.signOut') }),
      updateUser: async () => ({ data: { user: null }, error: makeError('auth.updateUser') }),
    },
  };

  return client;
}

// eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion
export const supabase = isSupabaseConfigured
  ? createClient(supabaseUrl as string, supabaseAnonKey as string, {
      auth: {
        // On the server, there is no localStorage. Supabase-js detects this, but
        // we also disable session persistence/refresh for safety.
        persistSession: typeof window !== 'undefined',
        autoRefreshToken: typeof window !== 'undefined',
      },
    })
  : createDisabledSupabaseClient();

if (!isSupabaseConfigured) {
  logger.warn(
    'Supabase not configured. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in .env to enable Auth and DB features.',
  );
}
