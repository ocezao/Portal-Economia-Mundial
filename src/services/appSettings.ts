/**
 * Serviço para configurações globais (app_settings)
 */

import { supabase } from '@/lib/supabaseClient';
import type { AppSettings } from '@/hooks/useAppSettings';

const DEFAULT_SETTINGS: AppSettings = {
  readingLimitEnabled: true,
  readingLimitPercentage: 0.2,
  maxFreeArticles: 3,
  readingLimitScope: 'anon',
};

export async function getAppSettings(): Promise<AppSettings> {
  const { data, error } = await supabase
    .from('app_settings')
    .select('key, value');

  if (error) throw error;

  const next = { ...DEFAULT_SETTINGS };
  for (const row of data ?? []) {
    switch (row.key) {
      case 'reading_limit_enabled':
        next.readingLimitEnabled = Boolean(row.value);
        break;
      case 'reading_limit_percentage':
        next.readingLimitPercentage = Number(row.value);
        break;
      case 'max_free_articles':
        next.maxFreeArticles = Number(row.value);
        break;
      case 'reading_limit_scope':
        next.readingLimitScope = (row.value as AppSettings['readingLimitScope']) ?? 'anon';
        break;
      default:
        break;
    }
  }

  return next;
}

export async function updateAppSettings(settings: AppSettings): Promise<void> {
  const rows = [
    { key: 'reading_limit_enabled', value: settings.readingLimitEnabled },
    { key: 'reading_limit_percentage', value: settings.readingLimitPercentage },
    { key: 'max_free_articles', value: settings.maxFreeArticles },
    { key: 'reading_limit_scope', value: settings.readingLimitScope },
  ];

  const { error } = await supabase
    .from('app_settings')
    .upsert(rows, { onConflict: 'key' });

  if (error) throw error;
}
