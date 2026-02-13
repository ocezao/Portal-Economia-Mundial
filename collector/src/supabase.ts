import { createClient, SupabaseClient } from '@supabase/supabase-js';

type CollectorEventRow = {
  event_type: string;
  session_id: string | null;
  user_id: string | null;
  url_path: string;
  properties: Record<string, unknown>;
  created_at?: string;
};

const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

if (!supabaseUrl || !supabaseKey) {
  throw new Error(
    'SUPABASE_URL/NEXT_PUBLIC_SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY são obrigatórios para o collector.',
  );
}

export const supabase: SupabaseClient = createClient(supabaseUrl, supabaseKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

export async function insertCollectorEvents(rows: CollectorEventRow[]): Promise<number> {
  const { error } = await supabase.from('analytics_events').insert(rows);
  if (error) throw error;
  return rows.length;
}

export async function checkSupabaseHealth(): Promise<boolean> {
  const { error } = await supabase.from('analytics_events').select('id', { head: true, count: 'exact' });
  return !error;
}
