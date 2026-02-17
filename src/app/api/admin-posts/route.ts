import { getSupabaseAdminClient } from '@/lib/server/supabaseAdmin';

type Payload = Record<string, unknown> & { action?: string };

function getBearerToken(req: Request): string | null {
  const auth = req.headers.get('authorization') ?? '';
  if (!auth.toLowerCase().startsWith('bearer ')) return null;
  return auth.slice(7).trim() || null;
}

function json(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'content-type': 'application/json' },
  });
}

async function requireAdmin(req: Request) {
  const token = getBearerToken(req);
  if (!token) return { ok: false as const, status: 401, message: 'Nao autenticado' };

  const admin = getSupabaseAdminClient();
  const { data, error } = await admin.auth.getUser(token);
  if (error || !data.user) return { ok: false as const, status: 401, message: 'Sessao invalida' };

  const { data: profile, error: profileError } = await admin
    .from('profiles')
    .select('role')
    .eq('id', data.user.id)
    .maybeSingle();

  if (profileError) return { ok: false as const, status: 500, message: 'Erro interno ao verificar permissoes' };
  if (profile?.role !== 'admin') return { ok: false as const, status: 403, message: 'Sem permissao' };

  return { ok: true as const, admin };
}

async function publishScheduledNow(admin: ReturnType<typeof getSupabaseAdminClient>) {
  const now = new Date().toISOString();
  const { data, error } = await admin
    .from('news_articles')
    .update({ status: 'published' })
    .eq('status', 'scheduled')
    .lte('published_at', now)
    .select('id');

  if (error) throw error;
  return Array.isArray(data) ? data.length : 0;
}

export async function POST(req: Request) {
  try {
    const auth = await requireAdmin(req);
    if (!auth.ok) return json({ error: auth.message }, auth.status);

    const payload = (await req.json()) as Payload;
    const action = payload.action;
    if (!action) return json({ error: 'Acao invalida' }, 400);

    if (action === 'publish_scheduled') {
      const count = await publishScheduledNow(auth.admin);
      return json({ ok: true, count });
    }

    return json({ error: 'Acao invalida' }, 400);
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Erro interno do servidor';
    return json({ error: message }, 500);
  }
}
