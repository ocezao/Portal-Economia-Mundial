/**
 * Fastify server - Analytics Collector
 */

import Fastify from 'fastify';
import cors from '@fastify/cors';
import { healthRoutes } from './routes/health';
import { collectRoutes } from './routes/collect';
import { rateLimitPlugin } from './plugins/rate-limit';
import { dedupePlugin } from './plugins/dedupe';
import { checkCurrentPartition } from './db/partition-check';
import { collectorLogger } from './logger';

const server = Fastify({
  logger: {
    level: process.env.LOG_LEVEL || 'info'
  }
});

async function start() {
  try {
    // Plugins
    // CORS restrito para origens específicas em produção
    const allowedOrigins = process.env.CORS_ALLOWED_ORIGINS 
      ? process.env.CORS_ALLOWED_ORIGINS.split(',')
      : ['http://localhost:3000', 'http://localhost:5173'];
    
    await server.register(cors, {
      origin: allowedOrigins,
      credentials: true
    });

    await server.register(rateLimitPlugin);
    await server.register(dedupePlugin);

    // Routes
    await server.register(healthRoutes);
    await server.register(collectRoutes);

    // Verificação crítica: partição deve existir
    // Se não existir, processo encerra com exit(1)
    await checkCurrentPartition();

    const port = parseInt(process.env.PORT || '3000');
    
    await server.listen({ port, host: '0.0.0.0' });
    server.log.info(`Collector rodando na porta ${port}`);
    
  } catch (err) {
    collectorLogger.error('Falha ao iniciar collector:', err);
    process.exit(1);
  }
}

start();
