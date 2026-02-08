#!/usr/bin/env node
/**
 * Exporta conteudo do Supabase para JSON (backup "gratis" sem depender de VPS).
 *
 * Uso:
 * - SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=... node scripts/export-supabase-content.mjs > backup.json
 *
 * Opcional:
 * - TABLES=news_articles,categories,tags node scripts/export-supabase-content.mjs
 */

import { createClient } from '@supabase/supabase-js';

const supabaseUrl =
  process.env.SUPABASE_URL?.trim() ||
  process.env.NEXT_PUBLIC_SUPABASE_URL?.trim() ||
  '';

const serviceRole =
  process.env.SUPABASE_SERVICE_ROLE_KEY?.trim() ||
  '';

if (!supabaseUrl || !serviceRole) {
  // Intencionalmente nao falha com stacktrace enorme.
  console.error(
    'Missing env. Set SUPABASE_URL (or NEXT_PUBLIC_SUPABASE_URL) and SUPABASE_SERVICE_ROLE_KEY.',
  );
  process.exit(1);
}

const TABLES_DEFAULT = [
  'news_articles',
  'categories',
  'tags',
  'news_article_categories',
  'news_article_tags',
  'authors',
];

const tables = (process.env.TABLES?.trim() ? process.env.TABLES.split(',') : TABLES_DEFAULT)
  .map((t) => t.trim())
  .filter(Boolean);

const supabase = createClient(supabaseUrl, serviceRole, {
  auth: { persistSession: false, autoRefreshToken: false },
});

async function fetchAll(table) {
  const pageSize = 1000;
  let from = 0;
  const rows = [];

  while (true) {
    const to = from + pageSize - 1;
    const { data, error } = await supabase.from(table).select('*').range(from, to);
    if (error) throw new Error(`Fetch failed for ${table}: ${error.message}`);
    if (!data || data.length === 0) break;
    rows.push(...data);
    if (data.length < pageSize) break;
    from += pageSize;
  }

  return rows;
}

const startedAt = new Date().toISOString();
const out = {
  meta: {
    startedAt,
    supabaseUrl,
    tables,
  },
  data: {},
};

for (const table of tables) {
  out.data[table] = await fetchAll(table);
}

process.stdout.write(JSON.stringify(out, null, 2));

