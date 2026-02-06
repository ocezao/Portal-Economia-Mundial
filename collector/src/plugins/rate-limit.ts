/**
 * Rate limiting plugin
 */

import { FastifyInstance } from 'fastify';
import fp from 'fastify-plugin';

// Simple in-memory rate limiter
const requests = new Map<string, { count: number; resetTime: number }>();

const WINDOW_MS = 60000; // 1 minute
const MAX_REQUESTS = 100; // requests per window per IP

export const rateLimitPlugin = fp(async (server: FastifyInstance) => {
  server.addHook('onRequest', async (request, reply) => {
    const ip = request.ip;
    const now = Date.now();
    
    const record = requests.get(ip);
    
    if (!record || now > record.resetTime) {
      // Reset window
      requests.set(ip, { count: 1, resetTime: now + WINDOW_MS });
      return;
    }
    
    if (record.count >= MAX_REQUESTS) {
      return reply.status(429).send({ 
        error: 'Too many requests',
        retryAfter: Math.ceil((record.resetTime - now) / 1000)
      });
    }
    
    record.count++;
  });
});
