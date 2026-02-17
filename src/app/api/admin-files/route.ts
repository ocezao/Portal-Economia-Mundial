import { getSupabaseAdminClient } from '@/lib/server/supabaseAdmin';

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

type AdminClient = ReturnType<typeof getSupabaseAdminClient>;

type FileRow = {
  name: string;
  path: string;
  size: number;
  contentType: string | null;
  updatedAt: string | null;
  publicUrl: string;
  isVector: boolean;
};

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

function isFolderLike(item: { id?: string | null; metadata?: unknown }) {
  return !item.id || item.metadata === null;
}

async function listFilesRecursive(admin: AdminClient, bucket: string, prefix = ''): Promise<FileRow[]> {
  const rows: FileRow[] = [];
  const pageSize = 100;
  let offset = 0;

  // eslint-disable-next-line no-constant-condition
  while (true) {
    const { data, error } = await admin.storage.from(bucket).list(prefix, {
      limit: pageSize,
      offset,
      sortBy: { column: 'name', order: 'asc' },
    });

    if (error) throw error;
    if (!data || data.length === 0) break;

    for (const item of data) {
      if (isFolderLike(item)) {
        const nestedPrefix = `${prefix}${item.name}/`;
        const nested = await listFilesRecursive(admin, bucket, nestedPrefix);
        rows.push(...nested);
        continue;
      }

      const fullPath = `${prefix}${item.name}`;
      const publicUrl = admin.storage.from(bucket).getPublicUrl(fullPath).data.publicUrl;
      const contentType = item.metadata?.mimetype ?? null;
      const isVector =
        contentType === 'image/svg+xml' || item.name.toLowerCase().endsWith('.svg');

      rows.push({
        name: item.name,
        path: fullPath,
        size: item.metadata?.size ?? 0,
        contentType,
        updatedAt: item.updated_at ?? null,
        publicUrl,
        isVector,
      });
    }

    if (data.length < pageSize) break;
    offset += pageSize;
  }

  return rows;
}

export async function GET(req: Request) {
  try {
    const auth = await requireAdmin(req);
    if (!auth.ok) return json({ error: auth.message }, auth.status);

    const bucket = process.env.SUPABASE_UPLOAD_BUCKET || 'uploads';
    const files = await listFilesRecursive(auth.admin, bucket);
    files.sort((a, b) => {
      const at = a.updatedAt ? new Date(a.updatedAt).getTime() : 0;
      const bt = b.updatedAt ? new Date(b.updatedAt).getTime() : 0;
      return bt - at;
    });

    return json({ ok: true, bucket, files });
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Erro interno do servidor';
    return json({ error: message }, 500);
  }
}

export async function DELETE(req: Request) {
  try {
    const auth = await requireAdmin(req);
    if (!auth.ok) return json({ error: auth.message }, auth.status);

    const payload = (await req.json().catch(() => ({}))) as { path?: string };
    const path = (payload.path || '').trim();
    if (!path) return json({ error: 'Path do arquivo é obrigatório' }, 400);

    const bucket = process.env.SUPABASE_UPLOAD_BUCKET || 'uploads';
    const { error } = await auth.admin.storage.from(bucket).remove([path]);
    if (error) return json({ error: error.message || 'Erro ao excluir arquivo' }, 500);

    return json({ ok: true, path });
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Erro interno do servidor';
    return json({ error: message }, 500);
  }
}
