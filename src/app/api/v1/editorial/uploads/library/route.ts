import { listEditorialUploadLibrary } from '@/lib/server/editorialIntelligence';
import { requireEditorialRequest } from '@/lib/server/adminApi';
import { editorialError, editorialSuccess } from '@/lib/server/editorialHttp';

function getLimit(request: Request) {
  const raw = new URL(request.url).searchParams.get('limit');
  const parsed = raw ? Number.parseInt(raw, 10) : 50;
  return Number.isFinite(parsed) && parsed > 0 ? Math.min(parsed, 200) : 50;
}

export async function GET(req: Request) {
  try {
    const auth = await requireEditorialRequest(req);
    if (!auth.ok) return editorialError(auth.message, auth.status, { code: 'UNAUTHORIZED' });

    const { searchParams } = new URL(req.url);
    const files = await listEditorialUploadLibrary({
      dir: searchParams.get('dir') ?? undefined,
      search: searchParams.get('search') ?? undefined,
      limit: getLimit(req),
    });

    return editorialSuccess(files);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Erro interno do servidor';
    return editorialError(message, 500, { code: 'EDITORIAL_ERROR' });
  }
}
