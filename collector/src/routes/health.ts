import { FastifyInstance } from 'fastify';
import { checkSupabaseHealth } from '../supabase';

export async function healthRoutes(server: FastifyInstance) {
  server.get('/health', async () => {
    try {
      const connected = await checkSupabaseHealth();
      if (!connected) {
        return { status: 'error', database: 'supabase_disconnected' };
      }
      return { status: 'ok', database: 'supabase_connected' };
    } catch (err) {
      server.log.error({ err }, 'Falha no health check');
      return { status: 'error', database: 'supabase_disconnected' };
    }
  });
}
