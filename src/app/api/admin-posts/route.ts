import { jsonResponse, requireEditorialRequest } from '@/lib/server/adminApi';
import { dispatchDueEditorialJobs } from '@/services/editorialJobs';

type Payload = Record<string, unknown> & { action?: string };

export async function POST(req: Request) {
  try {
    const auth = await requireEditorialRequest(req);
    if (!auth.ok) return jsonResponse({ error: auth.message }, auth.status);

    const payload = (await req.json()) as Payload;
    const action = payload.action;
    if (!action) return jsonResponse({ error: 'Acao invalida' }, 400);

    if (action === 'publish_scheduled') {
      const result = await dispatchDueEditorialJobs();
      return jsonResponse({ ok: true, count: result.published, processed: result.processed, failed: result.failed });
    }

    return jsonResponse({ error: 'Acao invalida' }, 400);
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Erro interno do servidor';
    return jsonResponse({ error: message }, 500);
  }
}
