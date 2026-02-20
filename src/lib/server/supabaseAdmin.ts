import { createClient, type SupabaseClient } from '@supabase/supabase-js';

export function getSupabaseAdminClient(): SupabaseClient {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL || '';
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

  if (!url || !serviceKey) {
    throw new Error(`Missing env. URL: ${!!url}, Key: ${!!serviceKey}`);
  }

  return createClient(url, serviceKey, {
    auth: { persistSession: false },
  });
}
