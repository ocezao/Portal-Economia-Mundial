import { Pool, type PoolClient, type QueryResultRow } from 'pg';

type CollectorEventInput = {
  event_type: string;
  session_id: string | null;
  user_id: string | null;
  url_path: string;
  properties: Record<string, unknown>;
  timestamp?: string | null;
};

let pool: Pool | null = null;

function getDatabaseUrl() {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    throw new Error('DATABASE_URL e obrigatoria para o collector.');
  }
  return databaseUrl;
}

function getPool() {
  if (!pool) {
    pool = new Pool({
      connectionString: getDatabaseUrl(),
    });
  }

  return pool;
}

function isUuidLike(value: string | null | undefined) {
  if (!value) return false;
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value);
}

function normalizeUuid(value: string | null | undefined): string | null {
  if (value && isUuidLike(value)) {
    return value;
  }
  return null;
}

export async function query(text: string, params?: unknown[]) {
  return getPool().query(text, params);
}

export async function getClient(): Promise<PoolClient> {
  return getPool().connect();
}

export async function insertCollectorEvents(rows: CollectorEventInput[]): Promise<number> {
  if (rows.length === 0) return 0;

  const values: unknown[] = [];
  const placeholders = rows
    .map((row, index) => {
      const offset = index * 6;
      values.push(
        row.event_type,
        normalizeUuid(row.session_id),
        normalizeUuid(row.user_id),
        row.url_path,
        JSON.stringify(row.properties ?? {}),
        row.timestamp ? new Date(row.timestamp) : new Date(),
      );
      return `($${offset + 1}, $${offset + 2}, $${offset + 3}, $${offset + 4}, $${offset + 5}::jsonb, $${offset + 6})`;
    })
    .join(', ');

  await query(
    `insert into public.analytics_events (
      event_type,
      session_id,
      user_id,
      url_path,
      properties,
      timestamp
    ) values ${placeholders}`,
    values,
  );

  return rows.length;
}

export async function checkDatabaseHealth(): Promise<boolean> {
  await query('select 1 from public.analytics_events limit 1');
  return true;
}

export type DbQueryResult<T extends QueryResultRow = QueryResultRow> = T[];
