import { buildSessionCookie, loginLocalUser } from '@/lib/server/localAuth';

export async function POST(req: Request) {
  try {
    const body = await req.json() as { email?: string; password?: string };
    if (!body.email || !body.password) {
      return Response.json({ error: 'Email e senha sao obrigatorios' }, { status: 400 });
    }

    const result = await loginLocalUser(body.email, body.password);
    if (!result) {
      return Response.json({ error: 'E-mail ou senha incorretos.' }, { status: 401 });
    }

    const response = Response.json({ ok: true, user: result.authUser });
    response.headers.append('Set-Cookie', buildSessionCookie(result.session.token, result.session.expiresAt));
    return response;
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Erro interno do servidor';
    return Response.json({ error: message }, { status: 500 });
  }
}
