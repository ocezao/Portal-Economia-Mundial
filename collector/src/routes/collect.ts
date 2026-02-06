/**
 * Event collection endpoint
 */

import { FastifyInstance, FastifyRequest } from 'fastify';
import { batchInsert } from '../db/insert';

interface CollectBody {
  v: string;
  event: string;
  user_id?: string;
  session_id?: string;
  anonymous: boolean;
  timestamp: number;
  url: string;
  referrer?: string;
  properties?: Record<string, any>;
}

export async function collectRoutes(server: FastifyInstance) {
  server.post('/collect', async (request: FastifyRequest<{ Body: CollectBody[] }>, reply) => {
    const events = request.body;
    const clientIP = request.ip;

    // Validate input
    if (!Array.isArray(events) || events.length === 0) {
      return reply.status(400).send({ error: 'Body must be a non-empty array of events' });
    }

    // Validate each event
    for (const event of events) {
      if (!event.v || !event.event || !event.timestamp || !event.url) {
        return reply.status(400).send({ 
          error: 'Each event must have v, event, timestamp, and url fields' 
        });
      }
    }

    try {
      const result = await batchInsert(events, clientIP);
      
      server.log.info(
        `Inserted ${result.inserted} events, ${result.duplicates} duplicates ignored`
      );

      // Return 204 No Content on success
      return reply.status(204).send();
    } catch (err) {
      server.log.error('Failed to insert events:', err);
      return reply.status(500).send({ error: 'Internal server error' });
    }
  });
}
