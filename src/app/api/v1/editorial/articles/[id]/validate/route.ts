import { validateEditorialArticle } from '@/lib/server/editorialAdmin';
import { requireEditorialRequest } from '@/lib/server/adminApi';
import { editorialError, editorialSuccess } from '@/lib/server/editorialHttp';

function getLookupMode(request: Request): 'id' | 'slug' {
  const { searchParams } = new URL(request.url);
  return searchParams.get('lookup') === 'slug' ? 'slug' : 'id';
}

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const auth = await requireEditorialRequest(req);
    if (!auth.ok) return editorialError(auth.message, auth.status, { code: 'UNAUTHORIZED' });

    const { id } = await params;
    const result = await validateEditorialArticle(auth.admin, id, getLookupMode(req));
    return editorialSuccess(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Erro interno do servidor';
    return editorialError(message, message === 'Artigo nao encontrado' ? 404 : 500, {
      code: message === 'Artigo nao encontrado' ? 'NOT_FOUND' : 'EDITORIAL_ERROR',
    });
  }
}
