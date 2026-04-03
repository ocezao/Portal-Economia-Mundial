import {
  buildClearedSessionCookie,
  buildSessionCookie,
  getSessionFromRequest,
  loginLocalUser,
  logoutLocalUser,
  requireAuthenticatedUser,
  updateLocalUser,
} from '@/lib/server/localAuth';

type LoginPayload = {
  email?: string;
  password?: string;
};

type ProfilePayload = {
  name?: string;
  region?: string;
  bio?: string;
  profession?: string;
  company?: string;
  avatar?: string;
  socialLinks?: {
    website?: string;
    twitter?: string;
    linkedin?: string;
    github?: string;
  };
  twoFactorEnabled?: boolean;
};

function jsonResponse(data: unknown, init: ResponseInit = {}) {
  return new Response(JSON.stringify(data), {
    ...init,
    headers: {
      'content-type': 'application/json',
      ...(init.headers ?? {}),
    },
  });
}

function mapAuthError(error: unknown) {
  const message = error instanceof Error ? error.message : 'Erro ao autenticar.';
  const normalized = message.toLowerCase();

  if (normalized.includes('email ja cadastrado')) {
    return { status: 409, code: 'AUTH_EMAIL_IN_USE', message: 'Este e-mail ja esta em uso.' };
  }

  if (normalized.includes('conta desativada')) {
    return { status: 403, code: 'AUTH_ACCOUNT_DISABLED', message: 'Sua conta esta desativada.' };
  }

  return { status: 500, code: 'AUTH_UNKNOWN_ERROR', message };
}

export async function GET(req: Request) {
  try {
    const session = await getSessionFromRequest(req);
    if (!session) {
      return jsonResponse({ authenticated: false, user: null, expiresAt: null });
    }

    return jsonResponse({
      authenticated: true,
      user: session.authUser,
      expiresAt: session.expiresAt,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Erro interno do servidor';
    return jsonResponse({ authenticated: false, user: null, expiresAt: null, error: message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const payload = (await req.json()) as LoginPayload;
    const email = payload.email?.trim() ?? '';
    const password = payload.password ?? '';

    if (!email || !password) {
      return jsonResponse(
        { error: { code: 'AUTH_INVALID_INPUT', message: 'E-mail e senha sao obrigatorios.' } },
        { status: 400 },
      );
    }

    const result = await loginLocalUser(email, password);
    if (!result) {
      return jsonResponse(
        { error: { code: 'AUTH_INVALID_CREDENTIALS', message: 'E-mail ou senha incorretos.' } },
        { status: 401 },
      );
    }

    return jsonResponse(
      {
        ok: true,
        user: result.authUser,
        expiresAt: result.session.expiresAt,
      },
      {
        headers: {
          'set-cookie': buildSessionCookie(result.session.token, result.session.expiresAt),
        },
      },
    );
  } catch (error) {
    const mapped = mapAuthError(error);
    return jsonResponse({ error: { code: mapped.code, message: mapped.message } }, { status: mapped.status });
  }
}

export async function PATCH(req: Request) {
  const auth = await requireAuthenticatedUser(req);
  if (!auth.ok) {
    return jsonResponse({ error: { code: 'AUTH_UNAUTHORIZED', message: auth.message } }, { status: auth.status });
  }

  try {
    const payload = (await req.json()) as ProfilePayload;
    await updateLocalUser({
      userId: auth.session.authUser.id,
      name: payload.name,
      region: payload.region,
      bio: payload.bio,
      profession: payload.profession,
      company: payload.company,
      avatar: payload.avatar,
      socialLinks: payload.socialLinks,
      twoFactorEnabled: payload.twoFactorEnabled,
    });

    const refreshed = await getSessionFromRequest(req);
    return jsonResponse({
      ok: true,
      user: refreshed?.authUser ?? auth.session.authUser,
      expiresAt: refreshed?.expiresAt ?? auth.session.expiresAt,
    });
  } catch (error) {
    const mapped = mapAuthError(error);
    return jsonResponse({ error: { code: mapped.code, message: mapped.message } }, { status: mapped.status });
  }
}

export async function DELETE(req: Request) {
  await logoutLocalUser(req);
  return jsonResponse(
    { ok: true },
    {
      headers: {
        'set-cookie': buildClearedSessionCookie(),
      },
    },
  );
}
