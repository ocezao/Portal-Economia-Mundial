import { createEditorialArticle, type EditorialPayload } from '@/lib/server/editorialAdmin';
import {
  formatZodError,
  listEditorialArticles,
  parseEditorialPayload,
} from '@/lib/server/editorialApi';
import { requireEditorialRequest } from '@/lib/server/adminApi';
import { editorialError, editorialSuccess, mapEditorialError } from '@/lib/server/editorialHttp';
import { z } from 'zod';

export async function GET(req: Request) {
  try {
    const auth = await requireEditorialRequest(req);
    if (!auth.ok) return editorialError(auth.message, auth.status, { code: 'UNAUTHORIZED' });

    const { searchParams } = new URL(req.url);
    const articles = await listEditorialArticles(Object.fromEntries(searchParams.entries()));
    return editorialSuccess(articles);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return editorialError(formatZodError(error), 400, { code: 'INVALID_QUERY' });
    }

    const mapped = mapEditorialError(error);
    return editorialError(mapped.message, mapped.status, { code: mapped.code });
  }
}

export async function POST(req: Request) {
  try {
    const auth = await requireEditorialRequest(req);
    if (!auth.ok) return editorialError(auth.message, auth.status, { code: 'UNAUTHORIZED' });

    const payload = parseEditorialPayload((await req.json()) as EditorialPayload);
    const result = await createEditorialArticle(auth.admin, payload);
    return editorialSuccess(result, 201);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return editorialError(formatZodError(error), 400, { code: 'INVALID_PAYLOAD' });
    }

    const mapped = mapEditorialError(error);
    return editorialError(mapped.message, mapped.status, { code: mapped.code });
  }
}
