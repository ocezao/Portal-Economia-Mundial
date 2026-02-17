/**
 * Configuração de Armazenamento Local
 * @deprecated Use src/lib/storage.ts diretamente
 * 
 * Este arquivo mantém compatibilidade com código existente.
 * Novo código deve importar de '@/lib/storage'
 */

// Re-exporta tudo do novo storage seguro
export {
  secureStorage,
  publicStorage,
  storage,
  STORAGE_KEYS,
  type UserData,
  type UserPreferences,
  type ReadingProgress,
  type ReadingHistory,
  type Bookmark,
  type DailyStats,
} from '@/lib/storage';
