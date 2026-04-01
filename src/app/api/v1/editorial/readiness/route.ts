import { getEditorialReadiness } from '@/lib/server/editorialIntelligence';
import { requireEditorialRequest } from '@/lib/server/adminApi';
import { editorialError, editorialSuccess } from '@/lib/server/editorialHttp';

export async function GET(req: Request) {
  try {
    const auth = await requireEditorialRequest(req);
    if (!auth.ok) return editorialError(auth.message, auth.status, { code: 'UNAUTHORIZED' });

    const readiness = await getEditorialReadiness();
    return editorialSuccess(readiness);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Erro interno do servidor';
    return editorialError(message, 500, { code: 'EDITORIAL_ERROR' });
  }
}
