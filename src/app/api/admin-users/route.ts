import { requireAdminRequest } from '@/lib/server/adminApi';
import { isEmailConfigured, sendEmailSafe } from '@/lib/server/email';
import {
  accountCreatedTemplate,
  accountEmailUpdatedTemplate,
  accountPasswordUpdatedTemplate,
} from '@/lib/server/emailTemplates';
import {
  createLocalUser,
  deleteLocalUser,
  listLocalUsers,
  updateLocalUser,
} from '@/lib/server/localAuth';

type Payload = Record<string, unknown> & { action?: string };

function json(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'content-type': 'application/json',
    },
  });
}

export async function POST(req: Request) {
  try {
    const auth = await requireAdminRequest(req);
    if (!auth.ok) return json({ error: auth.message }, auth.status);

    const payload = (await req.json()) as Payload;
    const action = payload.action;
    if (!action) return json({ error: 'Acao invalida' }, 400);

    if (action === 'list_users') {
      const users = await listLocalUsers();
      return json({ users });
    }

    if (action === 'create_user') {
      const email = payload.email as string | undefined;
      const password = payload.password as string | undefined;
      const name = payload.name as string | undefined;
      const role = payload.role as string | undefined;
      if (!email || !password) return json({ error: 'Email e senha sao obrigatorios' }, 400);

      const userId = await createLocalUser({
        email,
        password,
        name: name ?? email,
        role: role === 'admin' ? 'admin' : 'user',
      });

      if (isEmailConfigured()) {
        const tpl = accountCreatedTemplate(name || email);
        await sendEmailSafe({
          to: email,
          subject: tpl.subject,
          html: tpl.html,
          text: tpl.text,
        });
      }

      return json({ ok: true, userId });
    }

    if (action === 'update_user') {
      const userId = payload.userId as string | undefined;
      const email = payload.email as string | undefined;
      const name = payload.name as string | undefined;
      const role = payload.role as string | undefined;
      if (!userId) return json({ error: 'userId e obrigatorio' }, 400);

      await updateLocalUser({
        userId,
        email,
        name,
        role: role === 'admin' ? 'admin' : role === 'user' ? 'user' : undefined,
      });

      if (email && isEmailConfigured()) {
        const tpl = accountEmailUpdatedTemplate(name || email);
        await sendEmailSafe({
          to: email,
          subject: tpl.subject,
          html: tpl.html,
          text: tpl.text,
        });
      }
      return json({ ok: true });
    }

    if (action === 'update_password') {
      const userId = payload.userId as string | undefined;
      const password = payload.password as string | undefined;
      if (!userId || !password) return json({ error: 'userId e senha sao obrigatorios' }, 400);

      await updateLocalUser({ userId, password });

      if (isEmailConfigured()) {
        const users = await listLocalUsers();
        const updatedUser = users.find((user) => user.id === userId);
        const email = updatedUser?.email;
        const name = updatedUser?.name || email || 'Usuario';

        if (email) {
          const tpl = accountPasswordUpdatedTemplate(name);
          await sendEmailSafe({
            to: email,
            subject: tpl.subject,
            html: tpl.html,
            text: tpl.text,
          });
        }
      }

      return json({ ok: true });
    }

    if (action === 'delete_user') {
      const userId = payload.userId as string | undefined;
      if (!userId) return json({ error: 'userId e obrigatorio' }, 400);

      await deleteLocalUser(userId);

      return json({ ok: true });
    }

    return json({ error: 'Acao invalida' }, 400);
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Erro interno do servidor';
    return json({ error: message }, 500);
  }
}
