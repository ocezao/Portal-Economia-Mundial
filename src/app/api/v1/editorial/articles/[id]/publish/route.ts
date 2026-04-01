import { requireEditorialRequest } from '@/lib/server/adminApi';
import { editorialError, editorialSuccess, mapEditorialError } from '@/lib/server/editorialHttp';
import { publishEditorialArticle } from '@/lib/server/editorialAdmin';
import { formatZodError, parseEditorialPublishPayload } from '@/lib/server/editorialApi';
import { z } from 'zod';

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

    const { id } = await params;
    const body = parseEditorialPublishPayload(await req.json().catch(() => ({})));
    const article = await publishEditorialArticle(
      auth.admin,
      id,
      getLookupMode(req),
      body.publishedAt ?? new Date().toISOString(),
    );
    return editorialSuccess(article);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return editorialError(formatZodError(error), 400, { code: 'INVALID_PAYLOAD' });
    }

    const mapped = mapEditorialError(error);
    return editorialError(mapped.message, mapped.status, { code: mapped.code });
  }
}
