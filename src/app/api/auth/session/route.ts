import { getSessionFromRequest } from '@/lib/server/localAuth';

export async function GET(req: Request) {
  try {
    const session = await getSessionFromRequest(req);
    if (!session) {
      return Response.json({ user: null }, { status: 200 });
    }

    return Response.json({ user: session.authUser }, { status: 200 });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Erro interno do servidor';
    return Response.json({ error: message }, { status: 500 });
  }
}
