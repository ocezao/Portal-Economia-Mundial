import { z } from 'zod';

import { checkEditorialSlug, formatZodError } from '@/lib/server/editorialApi';
import { requireEditorialRequest } from '@/lib/server/adminApi';
import { editorialError, editorialSuccess } from '@/lib/server/editorialHttp';

export async function GET(req: Request) {
  try {
    const auth = await requireEditorialRequest(req);
    if (!auth.ok) return editorialError(auth.message, auth.status, { code: 'UNAUTHORIZED' });

    const { searchParams } = new URL(req.url);
    const result = await checkEditorialSlug(Object.fromEntries(searchParams.entries()));
    return editorialSuccess(result);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return editorialError(formatZodError(error), 400, { code: 'INVALID_QUERY' });
    }

    const message = error instanceof Error ? error.message : 'Erro interno do servidor';
    return editorialError(message, 500);
  }
}
