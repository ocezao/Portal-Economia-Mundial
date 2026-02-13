import { FastifyInstance, FastifyRequest } from 'fastify';
import { insertCollectorEvents } from '../supabase';

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
      const rows = events.map((event) => ({
        event_type: event.event,
        session_id: event.session_id || null,
        user_id: event.user_id || null,
        url_path: event.url,
        properties: {
          v: event.v,
          anonymous: event.anonymous,
          timestamp: event.timestamp,
          referrer: event.referrer || null,
          ...event.properties,
        },
      }));

      const inserted = await insertCollectorEvents(rows);
      server.log.info(`Eventos recebidos e gravados no Supabase: ${inserted}`);

      // Return 204 No Content on success
      return reply.status(204).send();
    } catch (err) {
      server.log.error({ err }, 'Falha ao inserir eventos');
      return reply.status(500).send({ error: 'Internal server error' });
    }
  });
}
