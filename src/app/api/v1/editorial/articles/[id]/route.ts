import {
  getEditorialArticle,
  type EditorialPayload,
  updateEditorialArticle,
} from '@/lib/server/editorialAdmin';
import { formatZodError, parseEditorialPayload } from '@/lib/server/editorialApi';
import { requireEditorialRequest } from '@/lib/server/adminApi';
import { editorialError, editorialSuccess, mapEditorialError } from '@/lib/server/editorialHttp';
import { z } from 'zod';

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
    const article = await getEditorialArticle(auth.admin, id, getLookupMode(req));
    return editorialSuccess(article);
  } catch (error) {
    const mapped = mapEditorialError(error);
    return editorialError(mapped.message, mapped.status, { code: mapped.code });
  }
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const auth = await requireEditorialRequest(req);
    if (!auth.ok) return editorialError(auth.message, auth.status, { code: 'UNAUTHORIZED' });

    const { id } = await params;
    const payload = parseEditorialPayload((await req.json()) as EditorialPayload);
    const article = await updateEditorialArticle(auth.admin, id, getLookupMode(req), payload);
    return editorialSuccess(article);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return editorialError(formatZodError(error), 400, { code: 'INVALID_PAYLOAD' });
    }

    const mapped = mapEditorialError(error);
    return editorialError(mapped.message, mapped.status, { code: mapped.code });
  }
}
