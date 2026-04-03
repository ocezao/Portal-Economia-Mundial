import { NextResponse } from 'next/server';

import { getSessionFromRequest } from '@/lib/server/localAuth';

export async function GET(req: Request) {
  try {
    const session = await getSessionFromRequest(req);
    if (!session) {
      return NextResponse.json({ authenticated: false }, { status: 401 });
    }

    return NextResponse.json({
      authenticated: true,
      user: session.authUser,
      expiresAt: session.expiresAt,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Erro interno do servidor';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
