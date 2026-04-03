import { getSessionFromRequest, requireAuthenticatedUser, updateLocalUser } from '@/lib/server/localAuth';

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'content-type': 'application/json',
    },
  });
}

export async function PATCH(req: Request) {
  try {
    const auth = await requireAuthenticatedUser(req);
    if (!auth.ok) return json({ error: auth.message }, auth.status);

    const payload = (await req.json()) as {
      name?: string;
      region?: string;
      avatar?: string;
      bio?: string;
      profession?: string;
      company?: string;
      socialLinks?: Record<string, string | undefined>;
      twoFactorEnabled?: boolean;
    };

    await updateLocalUser({
      userId: auth.session.authUser.id,
      name: payload.name,
      region: payload.region,
      avatar: payload.avatar,
      bio: payload.bio,
      profession: payload.profession,
      company: payload.company,
      socialLinks: payload.socialLinks,
      twoFactorEnabled: payload.twoFactorEnabled,
    });

    const refreshed = await getSessionFromRequest(req);
    if (!refreshed) {
      return json({ error: 'Sessao nao encontrada apos atualizar perfil' }, 500);
    }

    return json({ ok: true, user: refreshed.authUser, expiresAt: refreshed.expiresAt });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Erro ao atualizar perfil';
    return json({ error: message }, 500);
  }
}
