import { buildSessionCookie, registerLocalUser } from '@/lib/server/localAuth';

export async function POST(req: Request) {
  try {
    const body = await req.json() as { name?: string; email?: string; password?: string; region?: string };
    if (!body.name || !body.email || !body.password) {
      return Response.json({ error: 'Nome, email e senha sao obrigatorios' }, { status: 400 });
    }

    const result = await registerLocalUser({
      name: body.name,
      email: body.email,
      password: body.password,
      region: body.region,
    });

    const response = Response.json({ ok: true, user: result.authUser, needsEmailConfirmation: false });
    response.headers.append('Set-Cookie', buildSessionCookie(result.session.token, result.session.expiresAt));
    return response;
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Erro interno do servidor';
    return Response.json({ error: message }, { status: 500 });
  }
}
