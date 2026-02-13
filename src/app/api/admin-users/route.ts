import { createClient } from '@supabase/supabase-js';

type Payload = Record<string, unknown> & { action?: string };

function getBearerToken(req: Request): string | null {
  const auth = req.headers.get('authorization') ?? '';
  if (!auth.toLowerCase().startsWith('bearer ')) return null;
  return auth.slice(7).trim() || null;
}

function json(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'content-type': 'application/json',
    },
  });
}

function getAdminClient() {
  const url = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || '';
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
  if (!url || !serviceKey) {
    throw new Error('Missing env. Set SUPABASE_URL (or NEXT_PUBLIC_SUPABASE_URL) and SUPABASE_SERVICE_ROLE_KEY.');
  }
  return createClient(url, serviceKey, {
    auth: { persistSession: false },
  });
}

async function requireAdmin(req: Request) {
  const token = getBearerToken(req);
  if (!token) return { ok: false as const, status: 401, message: 'Nao autenticado' };

  const admin = getAdminClient();
  const { data, error } = await admin.auth.getUser(token);
  if (error || !data.user) return { ok: false as const, status: 401, message: 'Sessao invalida' };

  const { data: profile, error: profileError } = await admin
    .from('profiles')
    .select('role')
    .eq('id', data.user.id)
    .maybeSingle();

  if (profileError) return { ok: false as const, status: 500, message: 'Erro interno ao verificar permissoes' };
  if (profile?.role !== 'admin') return { ok: false as const, status: 403, message: 'Sem permissao' };

  return { ok: true as const, admin, userId: data.user.id };
}

export async function POST(req: Request) {
  try {
    const auth = await requireAdmin(req);
    if (!auth.ok) return json({ error: auth.message }, auth.status);

    const payload = (await req.json()) as Payload;
    const action = payload.action;
    if (!action) return json({ error: 'Acao invalida' }, 400);

    const admin = auth.admin;

    if (action === 'list_users') {
      const { data, error } = await admin.auth.admin.listUsers({ page: 1, perPage: 200 });
      if (error) return json({ error: error.message }, 500);

      const users = data?.users ?? [];
      const ids = users.map((u) => u.id);

      const { data: profiles } = await admin.from('profiles').select('id, name, role, avatar').in('id', ids);
      const profileMap = new Map((profiles ?? []).map((p) => [p.id, p]));

      const mapped = users.map((u) => {
        const p = profileMap.get(u.id) as { name?: string; role?: string } | undefined;
        return {
          id: u.id,
          email: u.email,
          name: p?.name ?? (u.user_metadata as any)?.name ?? u.email ?? 'Usuario',
          role: (p?.role ?? 'user') as 'admin' | 'user',
          createdAt: u.created_at,
          lastLogin: u.last_sign_in_at ?? u.created_at,
          isActive: !u.banned_until,
          region: null,
          bio: null,
          profession: null,
          company: null,
        };
      });

      return json({ users: mapped });
    }

    if (action === 'create_user') {
      const email = payload.email as string | undefined;
      const password = payload.password as string | undefined;
      const name = payload.name as string | undefined;
      const role = payload.role as string | undefined;
      if (!email || !password) return json({ error: 'Email e senha sao obrigatorios' }, 400);

      const { data, error } = await admin.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: { name, role },
      });
      if (error) return json({ error: error.message }, 500);

      const userId = data.user?.id;
      if (userId) {
        await admin.from('profiles').upsert({ id: userId, name, role: role ?? 'user' }, { onConflict: 'id' });
      }

      return json({ ok: true, userId });
    }

    if (action === 'update_user') {
      const userId = payload.userId as string | undefined;
      const email = payload.email as string | undefined;
      const name = payload.name as string | undefined;
      const role = payload.role as string | undefined;
      if (!userId) return json({ error: 'userId e obrigatorio' }, 400);

      if (email) {
        const { error } = await admin.auth.admin.updateUserById(userId, { email });
        if (error) return json({ error: error.message }, 500);
      }

      await admin.from('profiles').upsert({ id: userId, name, role }, { onConflict: 'id' });
      return json({ ok: true });
    }

    if (action === 'update_password') {
      const userId = payload.userId as string | undefined;
      const password = payload.password as string | undefined;
      if (!userId || !password) return json({ error: 'userId e senha sao obrigatorios' }, 400);

      const { error } = await admin.auth.admin.updateUserById(userId, { password });
      if (error) return json({ error: error.message }, 500);

      return json({ ok: true });
    }

    if (action === 'delete_user') {
      const userId = payload.userId as string | undefined;
      if (!userId) return json({ error: 'userId e obrigatorio' }, 400);

      const { error } = await admin.auth.admin.deleteUser(userId);
      if (error) return json({ error: error.message }, 500);

      return json({ ok: true });
    }

    return json({ error: 'Acao invalida' }, 400);
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Erro interno do servidor';
    return json({ error: message }, 500);
  }
}

