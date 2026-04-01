import { z } from 'zod';

import { getEditorialMeta, formatZodError } from '@/lib/server/editorialApi';
import { requireEditorialRequest } from '@/lib/server/adminApi';
import { editorialError, editorialSuccess } from '@/lib/server/editorialHttp';

export async function GET(req: Request) {
  try {
    const auth = await requireEditorialRequest(req);
    if (!auth.ok) return editorialError(auth.message, auth.status, { code: 'UNAUTHORIZED' });

    const meta = await getEditorialMeta();
    return editorialSuccess(meta);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return editorialError(formatZodError(error), 400, { code: 'INVALID_QUERY' });
    }

    const message = error instanceof Error ? error.message : 'Erro interno do servidor';
    return editorialError(message, 500);
  }
}
