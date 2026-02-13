import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { logger } from './logger';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey);

// ==================== CONFIGURAÇÕES ====================

const MAX_RETRIES = 3;
const RETRY_DELAY_MS = 1000;
const REQUEST_TIMEOUT_MS = 10000; // 10 segundos

// ==================== TIPOS ====================

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

// ==================== CLIENTE DESABILITADO (FALLBACK) ====================

function createDisabledSupabaseClient(): DisabledSupabaseClient {
  const makeError = (op: string): Error =>
    new Error(
      `Supabase not configured (${op}). Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in .env.`,
    );

  const disabledResult = (op: string): DisabledQueryResult => ({ data: null, error: makeError(op) });

  const makeQuery = (): DisabledQueryBuilder => {
    const result = disabledResult('query');
    const returnSelf: QueryMethod = () => makeQuery();
    const returnPromise: PromiseMethod = () => Promise.resolve(result);

    return {
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
      single: returnPromise,
      maybeSingle: returnPromise,
      select: returnSelf,
      insert: returnSelf,
      update: returnSelf,
      upsert: returnSelf,
      delete: returnSelf,
      then: (onfulfilled, onrejected) => Promise.resolve(result).then(onfulfilled, onrejected),
      catch: (onrejected) => Promise.resolve(result).catch(onrejected),
      finally: (onfinally) => Promise.resolve(result).finally(onfinally),
    };
  };

  const authResult = (op: string) => ({
    data: { session: null, user: null },
    error: makeError(op),
  });

  return {
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
}

// ==================== RETRY HELPER ====================

async function withRetry<T>(
  operation: () => Promise<T>,
  operationName: string,
  maxRetries: number = MAX_RETRIES
): Promise<T> {
  let lastError: Error | undefined;
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      
      // Não retry em erros de autenticação ou permissão
      if (lastError.message.includes('JWT') || 
          lastError.message.includes('auth') ||
          lastError.message.includes('permission') ||
          lastError.message.includes('not configured')) {
        throw lastError;
      }
      
      // Log do erro
      if (attempt < maxRetries) {
        logger.warn(`[supabaseClient] ${operationName} failed (attempt ${attempt}/${maxRetries}):`, lastError.message);
        // Espera exponencial antes de tentar novamente
        await new Promise(resolve => setTimeout(resolve, RETRY_DELAY_MS * attempt));
      }
    }
  }
  
  throw lastError || new Error(`${operationName} failed after ${maxRetries} attempts`);
}

// ==================== CLIENTE SUPABASE REAL ====================

function createRealSupabaseClient(): SupabaseClient {
  const client = createClient(supabaseUrl as string, supabaseAnonKey as string, {
    auth: {
      persistSession: typeof window !== 'undefined',
      autoRefreshToken: typeof window !== 'undefined',
      detectSessionInUrl: typeof window !== 'undefined',
      flowType: 'implicit',
    },
    global: {
      headers: {
        'X-Client-Info': 'portal-economico-web',
      },
      fetch: (url, options = {}) => {
        // Adiciona AbortController com timeout para evitar requisições penduradas
        const controller = new AbortController();
        const timeoutId = setTimeout(() => {
          controller.abort();
          logger.warn('[supabaseClient] Request timeout:', url);
        }, REQUEST_TIMEOUT_MS);

        return fetch(url, {
          ...options,
          signal: controller.signal,
        }).finally(() => {
          clearTimeout(timeoutId);
        }).catch(error => {
          if (error.name === 'AbortError') {
            throw new Error('Request timeout - Supabase connection took too long');
          }
          throw error;
        });
      },
    },
  });

  return client;
}

// ==================== EXPORTAÇÃO ====================

// eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion
export const supabase: SupabaseClient | DisabledSupabaseClient = isSupabaseConfigured
  ? createRealSupabaseClient()
  : createDisabledSupabaseClient();

if (!isSupabaseConfigured) {
  logger.warn(
    '[supabaseClient] Supabase not configured. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in .env to enable Auth and DB features.',
  );
} else {
  logger.log('[supabaseClient] Supabase client initialized successfully');
}

// ==================== HELPERS DE CONEXÃO ====================

/**
 * Verifica se o Supabase está acessível
 */
export async function checkSupabaseConnection(): Promise<boolean> {
  if (!isSupabaseConfigured) return false;
  
  try {
    const { error } = await (supabase as SupabaseClient)
      .from('profiles')
      .select('id', { count: 'exact', head: true })
      .abortSignal(AbortSignal.timeout(5000));
    
    return !error;
  } catch {
    return false;
  }
}

/**
 * Wrapper seguro para queries Supabase com tratamento de erro e retry
 * Aceita diretamente um builder do Supabase (ex: supabase.from('table').select())
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function safeQuery<T = any>(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  builder: { then: (...args: any[]) => any },
  errorMessage = 'Database query failed'
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
): Promise<{ data: T | null; error: Error | null; count?: number | null } & Record<string, any>> {
  if (!isSupabaseConfigured) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return { data: null, error: new Error('Supabase not configured') } as any;
  }

  try {
    // Executa o builder com retry
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const result = await withRetry(() => Promise.resolve(builder.then((r: any) => r)), errorMessage);
    
    // Verifica se o resultado tem erro
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const r = result as any;
    if (r && r.error) {
      if (shouldLogGlobal(`safeQuery:error:${errorMessage}`)) {
        logger.warn(`[safeQuery] ${errorMessage}:`, r.error.message || r.error);
      }
    }
    
    // eslint-disable-next-line @typescript-eslint/no-unsafe-return
    return result as { data: T | null; error: Error | null; count?: number | null } & Record<string, any>;
  } catch (error) {
    const err = error instanceof Error ? error : new Error(String(error));
    if (shouldLogGlobal(`safeQuery:catch:${errorMessage}`)) {
      logger.error(`[safeQuery] ${errorMessage}:`, err.message);
    }
    // eslint-disable-next-line @typescript-eslint/no-unsafe-return
    return { data: null, error: err } as { data: T | null; error: Error | null; count?: number | null } & Record<string, any>;
  }
}

// Helper global para rate limiting de logs
const logCacheGlobal = new Map<string, number>();
function shouldLogGlobal(key: string, intervalMs = 30000): boolean {
  const now = Date.now();
  const lastLog = logCacheGlobal.get(key);
  if (!lastLog || now - lastLog > intervalMs) {
    logCacheGlobal.set(key, now);
    return true;
  }
  return false;
}
