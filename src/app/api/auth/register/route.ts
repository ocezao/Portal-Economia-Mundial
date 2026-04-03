import {
  buildSessionCookie,
  registerLocalUser,
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
      name?: string;
      email?: string;
      password?: string;
      region?: string;
    };

    const name = payload.name?.trim() ?? '';
    const email = payload.email?.trim().toLowerCase() ?? '';
    const password = payload.password ?? '';

    if (!name || !email || !password) {
      return json({ error: { code: 'AUTH_INVALID_INPUT', message: 'Nome, e-mail e senha sao obrigatorios.' } }, 400);
    }

    if (password.length < 6) {
      return json({ error: { code: 'AUTH_WEAK_PASSWORD', message: 'A senha deve ter pelo menos 6 caracteres.' } }, 400);
    }

    const result = await registerLocalUser({
      name,
      email,
      password,
      region: payload.region,
    });

    return json(
      {
        ok: true,
        user: result.authUser,
        expiresAt: result.session.expiresAt,
        needsEmailConfirmation: false,
      },
      200,
      buildSessionCookie(result.session.token, result.session.expiresAt),
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Erro interno do servidor';
    const status = message === 'Email ja cadastrado' ? 409 : 500;
    const code = status === 409 ? 'AUTH_EMAIL_IN_USE' : 'AUTH_UNKNOWN_ERROR';
    const safeMessage = status === 409 ? 'Este e-mail ja esta em uso.' : message;
    return json({ error: { code, message: safeMessage } }, status);
  }
}
