/**
 * Hook para carregar configurações da aplicação no Supabase
 * Mantém fallback para APP_CONFIG quando o banco não responder
 */

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { APP_CONFIG } from '@/config/app';

export type ReadingLimitScope = 'anon' | 'all';

export interface AppSettings {
  readingLimitEnabled: boolean;
  readingLimitPercentage: number;
  maxFreeArticles: number;
  readingLimitScope: ReadingLimitScope;
}

const DEFAULT_SETTINGS: AppSettings = {
  readingLimitEnabled: true,
  readingLimitPercentage: APP_CONFIG.features.readingLimit,
  maxFreeArticles: APP_CONFIG.features.maxFreeArticles,
  readingLimitScope: 'anon',
};

export function useAppSettings() {
  const [settings, setSettings] = useState<AppSettings>(DEFAULT_SETTINGS);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    const load = async () => {
      try {
        const { data, error } = await supabase
          .from('app_settings')
          .select('key, value');

        if (error) {
          // Erro silenciado em produção
          if (process.env.NODE_ENV !== 'production') {
            // eslint-disable-next-line no-console
            console.error('Erro ao carregar app_settings:', error);
          }
          return;
        }

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
              next.readingLimitScope = (row.value as ReadingLimitScope) ?? 'anon';
              break;
            default:
              break;
          }
        }

        if (isMounted) setSettings(next);
      } catch (error) {
        // Erro silenciado em produção
        if (process.env.NODE_ENV !== 'production') {
          // eslint-disable-next-line no-console
          console.error('Erro ao carregar configurações:', error);
        }
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };

    load();
    return () => {
      isMounted = false;
    };
  }, []);

  return { settings, isLoading };
}
