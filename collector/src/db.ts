import { Pool } from 'pg';

type CollectorEventRow = {
  event_type: string;
  session_id: string | null;
  user_id: string | null;
  url_path: string;
  properties: Record<string, unknown>;
  created_at?: string;
};

const databaseUrl = process.env.DATABASE_URL || '';

if (!databaseUrl) {
  throw new Error('DATABASE_URL e obrigatorio para o collector.');
}

const pool = new Pool({
  connectionString: databaseUrl,
});

export async function insertCollectorEvents(rows: CollectorEventRow[]): Promise<number> {
  const client = await pool.connect();
  try {
    for (const row of rows) {
      await client.query(
        `insert into analytics_events (
          event_type,
          session_id,
          user_id,
          url_path,
          properties,
          created_at,
          timestamp
        ) values ($1, $2, $3, $4, $5::jsonb, coalesce($6::timestamptz, now()), coalesce($6::timestamptz, now()))`,
        [
          row.event_type,
          row.session_id,
          row.user_id,
          row.url_path,
          JSON.stringify(row.properties ?? {}),
          row.created_at ?? null,
        ],
      );
    }
  } finally {
    client.release();
  }

  return rows.length;
}

export async function checkDatabaseHealth(): Promise<boolean> {
  try {
    await pool.query('select 1 from analytics_events limit 1');
    return true;
  } catch {
    return false;
  }
}
