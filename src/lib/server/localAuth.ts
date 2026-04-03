import { createHmac, randomBytes, randomUUID, scryptSync, timingSafeEqual } from 'node:crypto';

import { query, queryOne, queryRows, withTransaction } from '@/lib/db';
import type { User, UserRole } from '@/types/user';

const SESSION_COOKIE_NAME = 'portal_session';
const SESSION_TTL_MS = 1000 * 60 * 60 * 24 * 14;
const DEFAULT_AUTH_SECRET = 'change-me-local-auth-secret';

type DbAuthUser = {
  id: string;
  email: string;
  encrypted_password: string | null;
  raw_user_meta_data: Record<string, unknown> | null;
  created_at: string;
  last_sign_in_at: string | null;
  banned_until: string | null;
  full_name: string | null;
  name: string | null;
  avatar: string | null;
  role: string | null;
  status: string | null;
};

type DbSession = {
  id: string;
  user_id: string;
  expires_at: string;
};

function getAuthSecret() {
  return process.env.LOCAL_AUTH_SECRET || process.env.AUTH_SESSION_SECRET || DEFAULT_AUTH_SECRET;
}

function toBase64Url(value: Buffer | string) {
  return Buffer.from(value).toString('base64url');
}

function fromBase64Url(value: string) {
  return Buffer.from(value, 'base64url');
}

function hashSessionId(sessionId: string) {
  return createHmac('sha256', getAuthSecret()).update(sessionId).digest('hex');
}

function signSessionToken(sessionId: string) {
  const signature = createHmac('sha256', getAuthSecret()).update(sessionId).digest();
  return `${toBase64Url(sessionId)}.${toBase64Url(signature)}`;
}

function verifySessionToken(token: string | null) {
  if (!token) return null;

  const [encodedId, encodedSignature] = token.split('.');
  if (!encodedId || !encodedSignature) return null;

  const sessionId = fromBase64Url(encodedId).toString('utf8');
  const expected = createHmac('sha256', getAuthSecret()).update(sessionId).digest();
  const actual = fromBase64Url(encodedSignature);

  if (expected.length !== actual.length || !timingSafeEqual(expected, actual)) {
    return null;
  }

  return sessionId;
}

function hashPassword(password: string) {
  const salt = randomBytes(16);
  const derived = scryptSync(password, salt, 64);
  return `scrypt$${salt.toString('hex')}$${derived.toString('hex')}`;
}

function verifyPassword(password: string, storedHash: string | null) {
  if (!storedHash) return false;

  const [algorithm, saltHex, hashHex] = storedHash.split('$');
  if (algorithm !== 'scrypt' || !saltHex || !hashHex) return false;

  const expected = Buffer.from(hashHex, 'hex');
  const actual = scryptSync(password, Buffer.from(saltHex, 'hex'), expected.length);
  return expected.length === actual.length && timingSafeEqual(expected, actual);
}

function parseCookieHeader(cookieHeader: string | null) {
  if (!cookieHeader) return new Map<string, string>();

  return new Map(
    cookieHeader
      .split(';')
      .map((part) => part.trim())
      .filter(Boolean)
      .map((part) => {
        const [name, ...rest] = part.split('=');
        return [name, rest.join('=')];
      }),
  );
}

function mapDbUserToAuthUser(row: DbAuthUser): User {
  const metadata = row.raw_user_meta_data ?? {};
  const role = (row.role === 'admin' ? 'admin' : 'user') as UserRole;

  return {
    id: row.id,
    name: row.full_name ?? row.name ?? String(metadata.name ?? row.email),
    email: row.email,
    role,
    region: typeof metadata.region === 'string' ? metadata.region : 'BR',
    avatar: row.avatar ?? (typeof metadata.avatar === 'string' ? metadata.avatar : undefined),
    bio: typeof metadata.bio === 'string' ? metadata.bio : undefined,
    profession: typeof metadata.profession === 'string' ? metadata.profession : undefined,
    company: typeof metadata.company === 'string' ? metadata.company : undefined,
    socialLinks:
      typeof metadata.socialLinks === 'object' && metadata.socialLinks
        ? (metadata.socialLinks as User['socialLinks'])
        : undefined,
    twoFactorEnabled: typeof metadata.twoFactorEnabled === 'boolean' ? metadata.twoFactorEnabled : undefined,
    createdAt: row.created_at,
    lastLogin: row.last_sign_in_at ?? row.created_at,
    isActive: row.status !== 'disabled' && !row.banned_until,
    preferences: {
      categories: [],
      tags: [],
      language: 'pt-BR',
      reducedMotion: false,
      emailNotifications: true,
      pushNotifications: false,
    },
  };
}

async function getUserByEmail(email: string) {
  return queryOne<DbAuthUser>(
    `select
      u.id,
      u.email,
      u.encrypted_password,
      u.raw_user_meta_data,
      u.created_at,
      u.last_sign_in_at,
      u.banned_until,
      p.full_name,
      p.name,
      p.avatar,
      p.role,
      p.status
     from auth.users u
     left join public.profiles p on p.id = u.id
     where lower(u.email) = lower($1)
     limit 1`,
    [email],
  );
}

async function getUserById(userId: string) {
  return queryOne<DbAuthUser>(
    `select
      u.id,
      u.email,
      u.encrypted_password,
      u.raw_user_meta_data,
      u.created_at,
      u.last_sign_in_at,
      u.banned_until,
      p.full_name,
      p.name,
      p.avatar,
      p.role,
      p.status
     from auth.users u
     left join public.profiles p on p.id = u.id
     where u.id = $1
     limit 1`,
    [userId],
  );
}

export async function createLocalUser(input: {
  email: string;
  password: string;
  name: string;
  role?: UserRole;
  region?: string;
}) {
  const email = input.email.trim().toLowerCase();
  const name = input.name.trim();
  const role = input.role ?? 'user';
  const passwordHash = hashPassword(input.password);

  return withTransaction(async (client) => {
    const created = await client.query<{ id: string }>(
      `insert into auth.users (
        email,
        encrypted_password,
        raw_user_meta_data
      ) values (
        $1,
        $2,
        $3::jsonb
      )
      returning id`,
      [
        email,
        passwordHash,
        JSON.stringify({
          name,
          region: input.region || 'BR',
          role,
        }),
      ],
    );

    const userId = created.rows[0]?.id;
    if (!userId) throw new Error('Falha ao criar usuario');

    await client.query(
      `insert into public.profiles (
        id,
        email,
        full_name,
        name,
        role,
        status
      ) values ($1, $2, $3, $4, $5, 'active')
      on conflict (id) do update
        set email = excluded.email,
            full_name = excluded.full_name,
            name = excluded.name,
            role = excluded.role,
            status = excluded.status`,
      [userId, email, name, name, role],
    );

    return userId;
  });
}

export async function updateLocalUser(input: {
  userId: string;
  email?: string;
  name?: string;
  role?: UserRole;
  password?: string;
  status?: 'active' | 'disabled';
  region?: string;
  avatar?: string;
  bio?: string;
  profession?: string;
  company?: string;
  socialLinks?: User['socialLinks'];
  twoFactorEnabled?: boolean;
}) {
  return withTransaction(async (client) => {
    if (
      input.email ||
      input.password ||
      input.name ||
      input.role ||
      input.region !== undefined ||
      input.avatar !== undefined ||
      input.bio !== undefined ||
      input.profession !== undefined ||
      input.company !== undefined ||
      input.socialLinks !== undefined ||
      input.twoFactorEnabled !== undefined
    ) {
      const existing = await client.query<{ raw_user_meta_data: Record<string, unknown> | null }>(
        `select raw_user_meta_data
         from auth.users
         where id = $1
         limit 1`,
        [input.userId],
      );

      const metadata = { ...(existing.rows[0]?.raw_user_meta_data ?? {}) } as Record<string, unknown>;
      if (input.name) metadata.name = input.name.trim();
      if (input.role) metadata.role = input.role;
      if (input.region !== undefined) metadata.region = input.region || 'BR';
      if (input.avatar !== undefined) metadata.avatar = input.avatar || null;
      if (input.bio !== undefined) metadata.bio = input.bio || null;
      if (input.profession !== undefined) metadata.profession = input.profession || null;
      if (input.company !== undefined) metadata.company = input.company || null;
      if (input.socialLinks !== undefined) metadata.socialLinks = input.socialLinks ?? null;
      if (input.twoFactorEnabled !== undefined) metadata.twoFactorEnabled = input.twoFactorEnabled;

      const assignments: string[] = [];
      const values: unknown[] = [];
      let index = 1;

      if (input.email) {
        assignments.push(`email = $${index}`);
        values.push(input.email.trim().toLowerCase());
        index += 1;
      }

      if (input.password) {
        assignments.push(`encrypted_password = $${index}`);
        values.push(hashPassword(input.password));
        index += 1;
      }

      assignments.push(`raw_user_meta_data = $${index}::jsonb`);
      values.push(JSON.stringify(metadata));
      index += 1;

      values.push(input.userId);
      await client.query(
        `update auth.users
         set ${assignments.join(', ')}
         where id = $${index}`,
        values,
      );
    }

    if (input.email || input.name || input.role || input.status || input.avatar !== undefined) {
      const assignments: string[] = [];
      const values: unknown[] = [];
      let index = 1;

      if (input.email) {
        assignments.push(`email = $${index}`);
        values.push(input.email.trim().toLowerCase());
        index += 1;
      }
      if (input.name) {
        assignments.push(`full_name = $${index}`);
        values.push(input.name.trim());
        index += 1;
        assignments.push(`name = $${index}`);
        values.push(input.name.trim());
        index += 1;
      }
        if (input.role) {
          assignments.push(`role = $${index}`);
          values.push(input.role);
          index += 1;
        }
        if (input.avatar !== undefined) {
          assignments.push(`avatar = $${index}`);
          values.push(input.avatar || null);
          index += 1;
        }
        if (input.status) {
          assignments.push(`status = $${index}`);
          values.push(input.status);
        index += 1;
      }

      if (assignments.length > 0) {
        assignments.push(`updated_at = now()`);
        values.push(input.userId);
        await client.query(
          `update public.profiles
           set ${assignments.join(', ')}
           where id = $${index}`,
          values,
        );
      }
    }
  });
}

export async function changeLocalPassword(input: {
  userId: string;
  currentPassword: string;
  newPassword: string;
}) {
  const user = await getUserById(input.userId);
  if (!user || !verifyPassword(input.currentPassword, user.encrypted_password)) {
    throw new Error('Senha atual incorreta');
  }

  await updateLocalUser({
    userId: input.userId,
    password: input.newPassword,
  });
}

export async function deleteLocalUser(userId: string) {
  await query('delete from auth.users where id = $1', [userId]);
}

export async function changeLocalUserPassword(input: {
  userId: string;
  currentPassword: string;
  newPassword: string;
}) {
  const user = await getUserById(input.userId);
  if (!user || !verifyPassword(input.currentPassword, user.encrypted_password)) {
    return { ok: false as const, status: 401, message: 'Senha atual invalida' };
  }

  await updateLocalUser({ userId: input.userId, password: input.newPassword });
  return { ok: true as const };
}

async function createSession(userId: string) {
  const sessionId = randomUUID();
  const sessionHash = hashSessionId(sessionId);
  const expiresAt = new Date(Date.now() + SESSION_TTL_MS).toISOString();

  await query(
    `insert into public.auth_sessions (
      id,
      user_id,
      session_hash,
      expires_at
    ) values ($1, $2, $3, $4)`,
    [sessionId, userId, sessionHash, expiresAt],
  );

  return {
    token: signSessionToken(sessionId),
    expiresAt,
  };
}

export function buildSessionCookie(token: string, expiresAt: string) {
  const expires = new Date(expiresAt).toUTCString();
  return `${SESSION_COOKIE_NAME}=${token}; Path=/; HttpOnly; SameSite=Lax; Expires=${expires}`;
}

export function buildClearedSessionCookie() {
  return `${SESSION_COOKIE_NAME}=; Path=/; HttpOnly; SameSite=Lax; Expires=Thu, 01 Jan 1970 00:00:00 GMT`;
}

export async function getSessionFromRequest(req: Request) {
  const cookies = parseCookieHeader(req.headers.get('cookie'));
  const rawToken = cookies.get(SESSION_COOKIE_NAME) ?? null;
  const sessionId = verifySessionToken(rawToken);
  if (!sessionId) return null;

  const sessionHash = hashSessionId(sessionId);
  const session = await queryOne<DbSession>(
    `select id, user_id, expires_at
     from public.auth_sessions
     where id = $1
       and session_hash = $2
       and expires_at > now()
     limit 1`,
    [sessionId, sessionHash],
  );

  if (!session) return null;

  const user = await getUserById(session.user_id);
  if (!user) return null;

  return {
    sessionId: session.id,
    expiresAt: session.expires_at,
    user,
    authUser: mapDbUserToAuthUser(user),
  };
}

export async function requireAuthenticatedUser(req: Request) {
  const session = await getSessionFromRequest(req);
  if (!session) {
    return { ok: false as const, status: 401, message: 'Nao autenticado' };
  }

  if (session.user.status === 'disabled' || session.user.banned_until) {
    return { ok: false as const, status: 403, message: 'Conta desativada' };
  }

  return { ok: true as const, session };
}

export async function requireAdminUser(req: Request) {
  const auth = await requireAuthenticatedUser(req);
  if (!auth.ok) return auth;

  if (auth.session.user.role !== 'admin') {
    return { ok: false as const, status: 403, message: 'Sem permissao' };
  }

  return auth;
}

export async function loginLocalUser(email: string, password: string) {
  const user = await getUserByEmail(email.trim().toLowerCase());
  if (!user || !verifyPassword(password, user.encrypted_password)) {
    return null;
  }

  if (user.status === 'disabled' || user.banned_until) {
    throw new Error('Conta desativada');
  }

  await query('update auth.users set last_sign_in_at = now() where id = $1', [user.id]);
  const session = await createSession(user.id);

  return {
    authUser: mapDbUserToAuthUser({
      ...user,
      last_sign_in_at: new Date().toISOString(),
    }),
    session,
  };
}

export async function registerLocalUser(input: {
  name: string;
  email: string;
  password: string;
  region?: string;
}) {
  const existing = await getUserByEmail(input.email.trim().toLowerCase());
  if (existing) {
    throw new Error('Email ja cadastrado');
  }

  const userId = await createLocalUser({
    email: input.email,
    password: input.password,
    name: input.name,
    role: 'user',
    region: input.region,
  });

  const user = await getUserById(userId);
  if (!user) throw new Error('Falha ao carregar usuario');

  const session = await createSession(user.id);
  return {
    authUser: mapDbUserToAuthUser(user),
    session,
  };
}

export async function logoutLocalUser(req: Request) {
  const cookies = parseCookieHeader(req.headers.get('cookie'));
  const rawToken = cookies.get(SESSION_COOKIE_NAME) ?? null;
  const sessionId = verifySessionToken(rawToken);
  if (!sessionId) return;

  await query('delete from public.auth_sessions where id = $1', [sessionId]);
}

export async function listLocalUsers() {
  const rows = await queryRows<DbAuthUser>(
    `select
      u.id,
      u.email,
      u.encrypted_password,
      u.raw_user_meta_data,
      u.created_at,
      u.last_sign_in_at,
      u.banned_until,
      p.full_name,
      p.name,
      p.avatar,
      p.role,
      p.status
     from auth.users u
     left join public.profiles p on p.id = u.id
     order by u.created_at desc`,
  );

  return rows.map(mapDbUserToAuthUser);
}

export async function getLocalAuthUserById(userId: string) {
  const user = await getUserById(userId);
  return user ? mapDbUserToAuthUser(user) : null;
}

export { SESSION_COOKIE_NAME, hashPassword };
