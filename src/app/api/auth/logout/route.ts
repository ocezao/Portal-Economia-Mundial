import { buildClearedSessionCookie, logoutLocalUser } from '@/lib/server/localAuth';

export async function POST(req: Request) {
  try {
    await logoutLocalUser(req);
    const response = Response.json({ ok: true });
    response.headers.append('Set-Cookie', buildClearedSessionCookie());
    return response;
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Erro interno do servidor';
    return Response.json({ error: message }, { status: 500 });
  }
}
