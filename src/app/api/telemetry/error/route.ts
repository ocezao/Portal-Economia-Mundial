import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

import { query } from '@/lib/db';

export const runtime = 'nodejs';

// Best-effort in-memory rate limiter.
// TODO: Em produção com múltiplas instâncias, usar Redis para rate limiting centralizado
// Exemplo: Redis com ioredis ou @upstash/redis para persistência entre nodes
const rl = new Map<string, { count: number; resetAt: number }>();
const WINDOW_MS = 60_000;
const MAX = 60; // events/min per IP
const MAX_BODY_BYTES = 20_000; // prevent abuse (best-effort)

function limitText(value: unknown, max: number): string | null {
  if (typeof value !== 'string') return null;
  const v = value.trim();
  if (!v) return null;
  return v.length > max ? v.slice(0, max) : v;
}

export async function POST(req: NextRequest) {
  const ip =
    req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    req.headers.get('x-real-ip') ||
    'unknown';

  const now = Date.now();
  const bucket = rl.get(ip);
  if (!bucket || bucket.resetAt <= now) {
    rl.set(ip, { count: 1, resetAt: now + WINDOW_MS });
  } else {
    bucket.count += 1;
    if (bucket.count > MAX) {
      return NextResponse.json({ ok: false }, { status: 429 });
    }
  }

  if (!process.env.DATABASE_URL) {
    return NextResponse.json({ ok: false }, { status: 503 });
  }

  let body: Record<string, unknown> | null = null;
  try {
    const len = req.headers.get('content-length');
    if (len && Number.parseInt(len, 10) > MAX_BODY_BYTES) {
      return NextResponse.json({ ok: false }, { status: 413 });
    }

    const text = await req.text();
    if (text.length > MAX_BODY_BYTES) {
      return NextResponse.json({ ok: false }, { status: 413 });
    }

    body = JSON.parse(text);
  } catch {
    return NextResponse.json({ ok: false }, { status: 400 });
  }

  const message = limitText(body?.message, 500);
  if (!message) return NextResponse.json({ ok: false }, { status: 400 });

  const stack = limitText(body?.stack, 4000);
  const digest = limitText(body?.digest, 200);
  const url = limitText(body?.url, 2048);
  const pathname = limitText(body?.pathname, 512);
  const userAgent = limitText(req.headers.get('user-agent'), 512);
  const referrer = limitText(req.headers.get('referer'), 2048);

  try {
    await query(
      `insert into app_errors (
         source,
         message,
         stack,
         digest,
         url,
         pathname,
         user_agent,
         referrer
       ) values ($1, $2, $3, $4, $5, $6, $7, $8)`,
      ['web', message, stack, digest, url, pathname, userAgent, referrer],
    );
  } catch {
    return NextResponse.json({ ok: false }, { status: 503 });
  }

  // Always respond OK to avoid loops.
  return NextResponse.json({ ok: true }, { status: 200 });
}
