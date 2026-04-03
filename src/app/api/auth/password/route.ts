import { changeLocalPassword, requireAuthenticatedUser } from '@/lib/server/localAuth';

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'content-type': 'application/json',
    },
  });
}

export async function POST(req: Request) {
  try {
    const auth = await requireAuthenticatedUser(req);
    if (!auth.ok) return json({ error: auth.message }, auth.status);

    const payload = (await req.json()) as { currentPassword?: string; newPassword?: string };
    const currentPassword = payload.currentPassword?.trim();
    const newPassword = payload.newPassword?.trim();

    if (!currentPassword || !newPassword) {
      return json({ error: 'Senha atual e nova senha sao obrigatorias' }, 400);
    }

    if (newPassword.length < 8) {
      return json({ error: 'A nova senha deve ter pelo menos 8 caracteres' }, 400);
    }

    await changeLocalPassword({
      userId: auth.session.authUser.id,
      currentPassword,
      newPassword,
    });

    return json({ ok: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Erro ao alterar senha';
    const status = message === 'Senha atual incorreta' ? 400 : 500;
    return json({ error: message }, status);
  }
}
