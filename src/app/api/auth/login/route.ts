import {
  buildSessionCookie,
  loginLocalUser,
} from '@/lib/server/localAuth';

function json(data: unknown, status = 200, cookie?: string) {
  const headers: Record<string, string> = {
    'content-type': 'application/json',
  };
  if (cookie) headers['set-cookie'] = cookie;

  return new Response(JSON.stringify(data), {
    status,
    headers,
  });
}

export async function POST(req: Request) {
  try {
    const payload = await req.json() as {
      email?: string;
      password?: string;
    };

    const email = payload.email?.trim().toLowerCase();
    const password = payload.password ?? '';

    if (!email || !password) {
      return json({ error: 'E-mail e senha sao obrigatorios.' }, 400);
    }

    const result = await loginLocalUser(email, password);
    if (!result) {
      return json({ error: 'E-mail ou senha incorretos.' }, 401);
    }

    return json(
      {
        ok: true,
        user: result.authUser,
        expiresAt: result.session.expiresAt,
      },
      200,
      buildSessionCookie(result.session.token, result.session.expiresAt),
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Erro interno do servidor';
    return json({ error: message }, 500);
  }
}
