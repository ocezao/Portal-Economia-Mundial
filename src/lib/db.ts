import type { Pool } from 'pg';

let pool: Pool | null = null;

// Só inicializar o pool se estivermos no servidor (Node.js)
if (typeof window === 'undefined' && process.env.DATABASE_URL) {
  // Dynamic import para evitar problemas no build do cliente
  const { Pool: PgPool } = require('pg');
  pool = new PgPool({
    connectionString: process.env.DATABASE_URL,
  });
}

export async function query(text: string, params?: any[]) {
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
