import type { Pool, PoolClient, QueryResult, QueryResultRow } from 'pg';

let pool: Pool | null = null;

// Só inicializar o pool se estivermos no servidor (Node.js)
if (typeof window === 'undefined' && process.env.DATABASE_URL) {
  // Dynamic import para evitar problemas no build do cliente
  const { Pool: PgPool } = require('pg');
  pool = new PgPool({
    connectionString: process.env.DATABASE_URL,
  });
}

export async function query(text: string, params?: unknown[]) {
  if (!pool) {
    throw new Error('Database pool not available. DATABASE_URL may not be configured.');
  }
  
  const client = await pool.connect();
  try {
    const result = await client.query(text, params);
    return result;
  } finally {
    client.release();
  }
}

export async function getClient() {
  if (!pool) {
    throw new Error('Database pool not available');
  }
  return pool.connect();
}

export async function queryRows<T extends QueryResultRow = QueryResultRow>(
  text: string,
  params?: unknown[],
): Promise<T[]> {
  const result = await query(text, params);
  return result.rows as T[];
}

export async function queryOne<T extends QueryResultRow = QueryResultRow>(
  text: string,
  params?: unknown[],
): Promise<T | null> {
  const rows = await queryRows<T>(text, params);
  return rows[0] ?? null;
}

export async function withTransaction<T>(
  fn: (client: PoolClient) => Promise<T>,
): Promise<T> {
  const client = await getClient();
  try {
    await client.query('BEGIN');
    const result = await fn(client);
    await client.query('COMMIT');
    return result;
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

export type DbClient = PoolClient;
export type DbQueryResult<T extends QueryResultRow = QueryResultRow> = QueryResult<T>;

export interface SnapshotData {
  key: string;
  data: unknown;
  fetched_at: Date | null;
}

export async function saveSnapshotToLocalDb(key: string, data: unknown): Promise<boolean> {
  if (!pool) {
    console.log('[DB] Pool not available, skipping snapshot save');
    return false;
  }
  
  try {
    const client = await pool.connect();
    try {
      await client.query(
        `INSERT INTO external_snapshots (key, data, fetched_at)
         VALUES ($1, $2, NOW())
         ON CONFLICT (key) DO UPDATE SET data = $2, fetched_at = NOW()`,
        [key, JSON.stringify(data)]
      );
      return true;
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('[DB] Failed to save snapshot:', error);
    return false;
  }
}

export async function getSnapshotFromLocalDb<T>(key: string): Promise<SnapshotData | null> {
  if (!pool) {
    return null;
  }
  
  try {
    const client = await pool.connect();
    try {
      const result = await client.query(
        'SELECT key, data, fetched_at FROM external_snapshots WHERE key = $1',
        [key]
      );
      
      if (result.rows.length === 0) {
        return null;
      }
      
      const row = result.rows[0];
      return {
        key: row.key,
        data: row.data,
        fetched_at: row.fetched_at,
      };
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('[DB] Failed to get snapshot:', error);
    return null;
  }
}
