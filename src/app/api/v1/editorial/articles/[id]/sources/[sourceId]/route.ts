import { deleteEditorialArticleSource } from '@/lib/server/editorialAdmin';
import { requireEditorialRequest } from '@/lib/server/adminApi';
import { editorialError, editorialSuccess } from '@/lib/server/editorialHttp';

function getLookupMode(request: Request): 'id' | 'slug' {
  const { searchParams } = new URL(request.url);
  return searchParams.get('lookup') === 'slug' ? 'slug' : 'id';
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string; sourceId: string }> },
) {
  try {
    const auth = await requireEditorialRequest(req);
    if (!auth.ok) return editorialError(auth.message, auth.status, { code: 'UNAUTHORIZED' });

    const { id, sourceId } = await params;
    const result = await deleteEditorialArticleSource(auth.admin, id, getLookupMode(req), sourceId);
    return editorialSuccess(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Erro interno do servidor';
    const status = message === 'Artigo nao encontrado' || message === 'Fonte nao encontrada' ? 404 : 500;
    const code = message === 'Fonte nao encontrada' || message === 'Artigo nao encontrado' ? 'NOT_FOUND' : 'EDITORIAL_ERROR';
    return editorialError(message, status, { code });
  }
}
