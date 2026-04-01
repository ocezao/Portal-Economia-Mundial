import { z } from 'zod';

import { approveEditorialArticle } from '@/lib/server/editorialAdmin';
import { formatZodError, parseEditorialApprovePayload } from '@/lib/server/editorialApi';
import { requireEditorialRequest } from '@/lib/server/adminApi';
import { editorialError, editorialSuccess, mapEditorialError } from '@/lib/server/editorialHttp';

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

    parseEditorialApprovePayload(await req.json().catch(() => ({})));
    const { id } = await params;
    const result = await approveEditorialArticle(auth.admin, id, getLookupMode(req));
    return editorialSuccess(result);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return editorialError(formatZodError(error), 400, { code: 'INVALID_PAYLOAD' });
    }

    const mapped = mapEditorialError(error);
    return editorialError(mapped.message, mapped.status, { code: mapped.code });
  }
}
