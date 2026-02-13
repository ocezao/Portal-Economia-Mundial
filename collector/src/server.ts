/**
 * Fastify server - Analytics Collector
 */

import Fastify from 'fastify';
import cors from '@fastify/cors';
import { healthRoutes } from './routes/health';
import { collectRoutes } from './routes/collect';
import { rateLimitPlugin } from './plugins/rate-limit';
import { dedupePlugin } from './plugins/dedupe';
import { collectorLogger } from './logger';

const server = Fastify({
  logger: {
    level: process.env.LOG_LEVEL || 'info',
  },
});

async function start() {
  try {
    const allowedOrigins = process.env.CORS_ALLOWED_ORIGINS
      ? process.env.CORS_ALLOWED_ORIGINS.split(',')
      : ['http://localhost:3000', 'http://localhost:5173', 'http://localhost:4000'];

    await server.register(cors, {
      origin: allowedOrigins,
      credentials: true,
    });

    await server.register(rateLimitPlugin);
    await server.register(dedupePlugin);

    await server.register(healthRoutes);
    await server.register(collectRoutes);

    const port = parseInt(process.env.PORT || '4010', 10);

    await server.listen({ port, host: '0.0.0.0' });
    server.log.info(`Collector rodando na porta ${port}`);
  } catch (err) {
    collectorLogger.error('Falha ao iniciar collector:', err);
    process.exit(1);
  }
}

start();
