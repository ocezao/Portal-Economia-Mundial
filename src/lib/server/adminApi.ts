import { requireAdminUser } from '@/lib/server/localAuth';
import { logger } from '@/lib/logger';

export function getBearerToken(req: Request): string | null {
  const auth = req.headers.get('authorization') ?? '';
  if (!auth.toLowerCase().startsWith('bearer ')) return null;
  return auth.slice(7).trim() || null;
}

export function jsonResponse(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'content-type': 'application/json',
    },
  });
}

export function slugifyText(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/--+/g, '-')
    .trim();
}

function normalizeIp(raw: string | null): string | null {
  if (!raw) return null;
  const first = raw.split(',')[0]?.trim();
  if (!first) return null;

  const bracketless = first.replace(/^\[|\]$/g, '');
  const withoutPort = bracketless.includes(':') && bracketless.includes('.')
    ? bracketless.replace(/:\d+$/, '')
    : bracketless;

  return withoutPort.startsWith('::ffff:') ? withoutPort.slice(7) : withoutPort;
}

function parseEnvList(value: string | undefined): string[] {
  return (value ?? '')
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);
}

const DEFAULT_EDITORIAL_ALLOWED_IPS = ['187.77.37.175', '47.253.152.120', '47.253.4.207'];

function isPrivateIpv4(ip: string): boolean {
  if (ip === '127.0.0.1') return true;
  if (ip.startsWith('10.')) return true;
  if (ip.startsWith('192.168.')) return true;

  const parts = ip.split('.');
  if (parts.length !== 4) return false;
  const first = Number(parts[0]);
  const second = Number(parts[1]);
  if (!Number.isInteger(first) || !Number.isInteger(second)) return false;

  return first === 172 && second >= 16 && second <= 31;
}

function isPrivateIp(ip: string | null): boolean {
  if (!ip) return false;
  if (ip === '::1') return true;
  if (ip.startsWith('fc') || ip.startsWith('fd')) return true;
  if (ip.includes('.')) return isPrivateIpv4(ip);
  return false;
}

function ipv4ToInt(ip: string): number | null {
  const parts = ip.split('.');
  if (parts.length !== 4) return null;

  const numbers = parts.map((part) => Number(part));
  if (numbers.some((part) => !Number.isInteger(part) || part < 0 || part > 255)) return null;

  return numbers.reduce((acc, part) => ((acc << 8) | part) >>> 0, 0);
}

function isIpInCidr(ip: string, cidr: string): boolean {
  const [network, prefixRaw] = cidr.split('/');
  const prefix = Number(prefixRaw);
  const ipInt = ipv4ToInt(ip);
  const networkInt = ipv4ToInt(network);

  if (ipInt === null || networkInt === null || !Number.isInteger(prefix) || prefix < 0 || prefix > 32) {
    return false;
  }

  const mask = prefix === 0 ? 0 : (0xffffffff << (32 - prefix)) >>> 0;
  return (ipInt & mask) === (networkInt & mask);
}

function getTrustedRequestIp(req: Request): string | null {
  const realIp = normalizeIp(req.headers.get('x-real-ip'));
  if (realIp) return realIp;

  const forwarded = normalizeIp(req.headers.get('x-forwarded-for'));
  if (forwarded) return forwarded;

  return normalizeIp(req.headers.get('cf-connecting-ip'));
}

async function getEditorialBodyApiKey(req: Request): Promise<string | null> {
  const contentType = req.headers.get('content-type')?.toLowerCase() ?? '';
  if (!contentType.includes('application/json')) return null;

  try {
    const payload = await req.clone().json() as Record<string, unknown>;
    const candidate = payload.apiKey ?? payload.editorialApiKey;
    return typeof candidate === 'string' && candidate.trim() ? candidate.trim() : null;
  } catch {
    return null;
  }
}

async function getEditorialAuthDiagnostics(req: Request) {
  const contentType = req.headers.get('content-type')?.toLowerCase() ?? '';
  let bodyKeyPresent = false;

  if (contentType.includes('application/json')) {
    try {
      const payload = await req.clone().json() as Record<string, unknown>;
      const candidate = payload.apiKey ?? payload.editorialApiKey;
      bodyKeyPresent = typeof candidate === 'string' && candidate.trim().length > 0;
    } catch {
      bodyKeyPresent = false;
    }
  }

  return {
    ip: getTrustedRequestIp(req),
    contentType,
    hasAuthorization: Boolean(getBearerToken(req)),
    hasXApiKey: Boolean(req.headers.get('x-api-key')?.trim()),
    bodyKeyPresent,
  };
}

async function getEditorialApiKey(req: Request): Promise<string | null> {
  const bearer = getBearerToken(req);
  if (bearer) return bearer;

  const apiKey = req.headers.get('x-api-key')?.trim();
  if (apiKey) return apiKey;

  return getEditorialBodyApiKey(req);
}

async function allowEditorialApiKey(req: Request): Promise<boolean> {
  const configuredKeys = [
    process.env.EDITORIAL_API_KEY?.trim(),
  ].filter((value): value is string => Boolean(value));
  if (configuredKeys.length === 0) return false;

  const providedKey = await getEditorialApiKey(req);
  return Boolean(providedKey && configuredKeys.includes(providedKey));
}

function buildInternalEditorialUser(ip: string | null) {
  const label = ip ?? 'unknown';
  return {
    id: `internal-editorial:${label}`,
    email: 'internal-editorial@vps.local',
    name: `Internal Editorial (${label})`,
    role: 'admin' as const,
    region: 'BR',
    createdAt: new Date(0).toISOString(),
    lastLogin: new Date(0).toISOString(),
    isActive: true,
    preferences: {
      categories: [],
      tags: [],
      language: 'pt-BR',
      reducedMotion: false,
      emailNotifications: false,
      pushNotifications: false,
    },
  };
}

function allowInternalEditorialBypass(req: Request) {
  const enabled = (process.env.ALLOW_INTERNAL_EDITORIAL_IP_BYPASS ?? 'false').toLowerCase() === 'true';
  if (!enabled) return false;

  const requestIp = getTrustedRequestIp(req);
  if (!requestIp) return false;

  if ((process.env.EDITORIAL_ALLOW_PRIVATE_NETWORKS ?? 'true').toLowerCase() === 'true' && isPrivateIp(requestIp)) {
    return true;
  }

  const allowedIps = [...DEFAULT_EDITORIAL_ALLOWED_IPS, ...parseEnvList(process.env.EDITORIAL_ALLOWED_IPS)];
  if (allowedIps.includes(requestIp)) return true;

  const allowedCidrs = parseEnvList(process.env.EDITORIAL_ALLOWED_CIDRS);
  return requestIp.includes('.') && allowedCidrs.some((cidr) => isIpInCidr(requestIp, cidr));
}

export async function requireAdminRequest(req: Request) {
  try {
    const auth = await requireAdminUser(req);
    if (!auth.ok) return auth;
    return { ok: true as const, admin: null, userId: auth.session.authUser.id, user: auth.session.authUser };
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Erro desconhecido';
    return { ok: false as const, status: 500, message: `Erro ao verificar admin: ${message}` };
  }
}

export async function requireEditorialRequest(req: Request) {
  const requestIp = getTrustedRequestIp(req);
  if (await allowEditorialApiKey(req) || allowInternalEditorialBypass(req)) {
    const user = buildInternalEditorialUser(requestIp);
    return { ok: true as const, admin: null, userId: user.id, user };
  }

  const diagnostics = await getEditorialAuthDiagnostics(req);
  logger.warnRateLimit('editorial-auth-unauthorized', 60000, '[editorial-auth] unauthorized', diagnostics);

  return requireAdminRequest(req);
}
