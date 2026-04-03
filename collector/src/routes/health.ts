import { FastifyInstance } from 'fastify';
import { checkDatabaseHealth } from '../db';

export async function healthRoutes(server: FastifyInstance) {
  server.get('/health', async () => {
    try {
      const connected = await checkDatabaseHealth();
      if (!connected) {
        return { status: 'error', database: 'postgres_disconnected' };
      }
      return { status: 'ok', database: 'postgres_connected' };
    } catch (err) {
      server.log.error({ err }, 'Falha no health check');
      return { status: 'error', database: 'postgres_disconnected' };
    }
  });
}
