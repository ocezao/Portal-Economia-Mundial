/**
 * Cliente para operações administrativas de usuários via Edge Function
 */

import { supabase } from '@/lib/supabaseClient';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;
const FUNCTION_URL = `${SUPABASE_URL}/functions/v1/admin-users`;

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
  const { data } = await supabase.auth.getSession();
  const token = data.session?.access_token;

  if (!token) throw new Error('Sessão inválida');

  const response = await fetch(FUNCTION_URL, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      apikey: SUPABASE_ANON_KEY,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ action, ...payload }),
  });

  const json = await response.json();
  if (!response.ok) {
    throw new Error(json.error || 'Erro na função');
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
