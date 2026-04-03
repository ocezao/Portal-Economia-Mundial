import { buildClearedSessionCookie, logoutLocalUser } from '@/lib/server/localAuth';

function json(data: unknown, status = 200, headers?: HeadersInit) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'content-type': 'application/json',
      ...headers,
    },
  });
}

export async function POST(req: Request) {
  try {
    await logoutLocalUser(req);
    return json({ ok: true }, 200, {
      'set-cookie': buildClearedSessionCookie(),
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Erro ao encerrar sessao';
    return json({ error: message }, 500);
  }
}
