import { requireAdminRequest } from '@/lib/server/adminApi';
import { deleteStoredFile, listStoredFiles } from '@/lib/server/fileStorage';

function json(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'content-type': 'application/json' },
  });
}

export async function GET(req: Request) {
  try {
    const auth = await requireAdminRequest(req);
    if (!auth.ok) return json({ error: auth.message }, auth.status);

    const files = await listStoredFiles();
    files.sort((a, b) => {
      const at = a.updatedAt ? new Date(a.updatedAt).getTime() : 0;
      const bt = b.updatedAt ? new Date(b.updatedAt).getTime() : 0;
      return bt - at;
    });

    return json({ ok: true, bucket: 'uploads', files });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Erro interno do servidor';
    return json({ error: message }, 500);
  }
}

export async function DELETE(req: Request) {
  try {
    const auth = await requireAdminRequest(req);
    if (!auth.ok) return json({ error: auth.message }, auth.status);

    const payload = (await req.json().catch(() => ({}))) as { path?: string };
    const path = payload.path?.trim();
    if (!path) return json({ error: 'Path do arquivo e obrigatorio' }, 400);

    await deleteStoredFile(path);
    return json({ ok: true, path });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Erro interno do servidor';
    return json({ error: message }, 500);
  }
}
