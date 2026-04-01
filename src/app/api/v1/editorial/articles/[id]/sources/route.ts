import { z } from 'zod';

import { addEditorialArticleSource } from '@/lib/server/editorialAdmin';
import { formatZodError, parseEditorialSourcePayload } from '@/lib/server/editorialApi';
import { requireEditorialRequest } from '@/lib/server/adminApi';
import { editorialError, editorialSuccess } from '@/lib/server/editorialHttp';

function getLookupMode(request: Request): 'id' | 'slug' {
  const { searchParams } = new URL(request.url);
  return searchParams.get('lookup') === 'slug' ? 'slug' : 'id';
}

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const auth = await requireEditorialRequest(req);
    if (!auth.ok) return editorialError(auth.message, auth.status, { code: 'UNAUTHORIZED' });

    const source = parseEditorialSourcePayload(await req.json());
    const { id } = await params;
    const result = await addEditorialArticleSource(auth.admin, id, getLookupMode(req), source);
    return editorialSuccess(result, 201);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return editorialError(formatZodError(error), 400, { code: 'INVALID_PAYLOAD' });
    }

    const message = error instanceof Error ? error.message : 'Erro interno do servidor';
    return editorialError(message, message === 'Artigo nao encontrado' ? 404 : 500, {
      code: message === 'Artigo nao encontrado' ? 'NOT_FOUND' : 'EDITORIAL_ERROR',
    });
  }
}
