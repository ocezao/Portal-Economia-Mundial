import { supabase } from '@/lib/supabaseClient';

const callAdminPosts = async (action: string, payload: Record<string, unknown> = {}) => {
  const { data } = await supabase.auth.getSession();
  const token = data.session?.access_token;

  if (!token) throw new Error('Sessao invalida');

  const response = await fetch('/api/admin-posts', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ action, ...payload }),
  });

  const json = await response.json();
  if (!response.ok) {
    throw new Error((json as { error?: string }).error || 'Erro na API de posts');
  }

  return json as { ok: boolean; count?: number };
};

export async function publishScheduledPostsNow(): Promise<number> {
  const result = await callAdminPosts('publish_scheduled');
  return result.count ?? 0;
}
