import { dispatchDueEditorialJobs } from '@/services/editorialJobs';
import { requireEditorialRequest } from '@/lib/server/adminApi';
import { editorialError, editorialSuccess } from '@/lib/server/editorialHttp';

export async function POST(req: Request) {
  try {
    const auth = await requireEditorialRequest(req);
    if (!auth.ok) return editorialError(auth.message, auth.status, { code: 'UNAUTHORIZED' });

    const body = await req.json().catch(() => ({})) as { limit?: number };
    const limit = typeof body.limit === 'number' ? body.limit : 25;
    const result = await dispatchDueEditorialJobs(limit);
    return editorialSuccess(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Erro interno do servidor';
    return editorialError(message, 500);
  }
}
