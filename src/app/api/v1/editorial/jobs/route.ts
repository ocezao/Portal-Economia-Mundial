import { z } from 'zod';

import { listEditorialJobs } from '@/lib/server/editorialAdmin';
import { formatZodError, parseEditorialJobsQuery } from '@/lib/server/editorialApi';
import { requireEditorialRequest } from '@/lib/server/adminApi';
import { editorialError, editorialSuccess } from '@/lib/server/editorialHttp';

export async function GET(req: Request) {
  try {
    const auth = await requireEditorialRequest(req);
    if (!auth.ok) return editorialError(auth.message, auth.status, { code: 'UNAUTHORIZED' });

    const { searchParams } = new URL(req.url);
    const filters = parseEditorialJobsQuery(Object.fromEntries(searchParams.entries()));
    const jobs = await listEditorialJobs(auth.admin, filters);
    return editorialSuccess({ items: jobs, filters });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return editorialError(formatZodError(error), 400, { code: 'INVALID_QUERY' });
    }

    const message = error instanceof Error ? error.message : 'Erro interno do servidor';
    return editorialError(message, 500);
  }
}
