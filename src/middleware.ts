import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const rateLimitMap = new Map<string, { count: number; startTime: number }>();

const RATE_LIMIT_WINDOW = 60 * 1000;
const RATE_LIMIT_MAX_REQUESTS = 100;

function getClientIP(request: NextRequest): string {
  const forwarded = request.headers.get('x-forwarded-for');
  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }
  const realIP = request.headers.get('x-real-ip');
  if (realIP) {
    return realIP;
  }
  return 'unknown';
}

function isRateLimited(ip: string): boolean {
  const now = Date.now();
  const record = rateLimitMap.get(ip);

  if (!record || now - record.startTime > RATE_LIMIT_WINDOW) {
    rateLimitMap.set(ip, { count: 1, startTime: now });
    return false;
  }

  record.count++;
  
  if (record.count > RATE_LIMIT_MAX_REQUESTS) {
    return true;
  }

  return false;
}

const BLOCKED_PATHS = [
  '/wp-admin',
  '/wp-login.php',
  '/phpMyAdmin',
  '/.env',
  '/.git/config',
  '/server-status',
];

const BLOCKED_IPS = new Set([
  '192.168.1.1',
]);

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const clientIP = getClientIP(request);

  if (BLOCKED_IPS.has(clientIP)) {
    return new NextResponse('Forbidden', { status: 403 });
  }

  for (const blockedPath of BLOCKED_PATHS) {
    if (pathname.startsWith(blockedPath)) {
      return new NextResponse('Not Found', { status: 404 });
    }
  }

  if (pathname.startsWith('/api/')) {
    if (isRateLimited(clientIP)) {
      return new NextResponse(
        JSON.stringify({ error: 'Too many requests' }),
        { 
          status: 429,
          headers: { 
            'Content-Type': 'application/json',
            'Retry-After': '60'
          }
        }
      );
    }
  }

  const response = NextResponse.next();
  
  response.headers.set('X-Request-ID', crypto.randomUUID());
  
  return response;
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|public/).*)',
  ],
};
