/**
 * Cliente para operacoes administrativas de usuarios.
 *
 * Usa API route same-origin (`/api/admin-users`) autenticada por cookie.
 */

export type AdminUser = {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'user';
  createdAt: string;
  lastLogin: string;
  isActive: boolean;
  region?: string | null;
  bio?: string | null;
  profession?: string | null;
  company?: string | null;
};

const callFunction = async (action: string, payload: Record<string, unknown> = {}) => {
  const response = await fetch('/api/admin-users', {
    method: 'POST',
    credentials: 'same-origin',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ action, ...payload }),
  });

  const json = await response.json();
  if (!response.ok) {
    throw new Error(json.error || 'Erro na funcao');
  }

  return json;
};

export async function listAdminUsers(): Promise<AdminUser[]> {
  const result = await callFunction('list_users');
  return result.users ?? [];
}

export async function createAdminUser(input: {
  name: string;
  email: string;
  password: string;
  role: 'admin' | 'user';
}) {
  return callFunction('create_user', input);
}

export async function updateAdminUser(input: {
  userId: string;
  name: string;
  email: string;
  role: 'admin' | 'user';
}) {
  return callFunction('update_user', input);
}

export async function updateAdminUserPassword(input: {
  userId: string;
  password: string;
}) {
  return callFunction('update_password', input);
}

export async function deleteAdminUser(input: { userId: string }) {
  return callFunction('delete_user', input);
}
