/**
 * Health check route
 */

import { FastifyInstance } from 'fastify';
import { pool } from '../db/index';

export async function healthRoutes(server: FastifyInstance) {
  server.get('/health', async () => {
    try {
      // Check database connectivity
      await pool.query('SELECT 1');
      return { status: 'ok', database: 'connected' };
    } catch (err) {
      server.log.error('Health check failed:', err);
      return { status: 'error', database: 'disconnected' };
    }
  });
}
