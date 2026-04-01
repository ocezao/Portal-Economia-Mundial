import { requireEditorialRequest } from '@/lib/server/adminApi';
import { editorialError, editorialSuccess } from '@/lib/server/editorialHttp';

export async function GET(req: Request) {
  const auth = await requireEditorialRequest(req);
  if (!auth.ok) return editorialError(auth.message, auth.status, { code: 'UNAUTHORIZED' });

  return editorialSuccess({
    authenticated: true,
    userId: auth.userId,
    user: auth.user,
    supportedMethods: [
      'Authorization: Bearer <EDITORIAL_API_KEY>',
      'x-api-key: <EDITORIAL_API_KEY>',
      'admin session cookie',
    ],
    credentialIssuance: 'A chave precisa ser provisionada externamente via EDITORIAL_API_KEY.',
  });
}
