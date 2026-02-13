/**
 * Database connection pool
 */

import { Pool, PoolConfig } from 'pg';
import { collectorLogger } from '../logger';

const password = process.env.POSTGRES_PASSWORD;

if (!password) {
  throw new Error(
    'POSTGRES_PASSWORD environment variable is required. ' +
    'Please set it in your .env file or environment variables.'
  );
}

const config: PoolConfig = {
  host: process.env.POSTGRES_HOST || 'localhost',
  port: parseInt(process.env.POSTGRES_PORT || '5432'),
  database: process.env.POSTGRES_DB || 'cin_analytics',
  user: process.env.POSTGRES_USER || 'analytics',
  password,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
};

export const pool = new Pool(config);

// Log connection errors
pool.on('error', (err) => {
  collectorLogger.error('Unexpected database error:', err);
});

