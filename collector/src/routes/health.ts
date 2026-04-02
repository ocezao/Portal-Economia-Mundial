import { FastifyInstance } from 'fastify';
import { checkDatabaseHealth } from '../db';

export async function healthRoutes(server: FastifyInstance) {
  server.get('/health', async (_request, reply) => {
    try {
      const connected = await checkDatabaseHealth();
      if (!connected) {
        return reply.code(503).send({ status: 'error', database: 'postgres_disconnected' });
      }
      return reply.code(200).send({ status: 'ok', database: 'postgres_connected' });
    } catch (err) {
      server.log.error({ err }, 'Falha no health check');
      return reply.code(503).send({ status: 'error', database: 'postgres_disconnected' });
    }
  });
}
