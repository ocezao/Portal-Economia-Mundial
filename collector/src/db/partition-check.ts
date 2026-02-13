/**
 * Verificação rigorosa de partições - FAIL FAST
 */

import { pool } from './index';
import { collectorLogger as logger } from '../logger';

/**
 * Verifica se partição do mês atual existe e tem índice único
 * Se não existir, loga erro e encerra processo com exit(1)
 */
export async function checkCurrentPartition(): Promise<void> {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const partitionName = `events_raw_${year}_${month}`;
  
  logger.info(`[Partition Check] Verificando partição: ${partitionName}`);
  
  try {
    // Verificar se partição existe
    const partitionResult = await pool.query(`
      SELECT 1 
      FROM pg_tables 
      WHERE tablename = $1 
      AND schemaname = 'public'
    `, [partitionName]);
    
    if (partitionResult.rowCount === 0) {
      logger.error('');
      logger.error('╔════════════════════════════════════════════════════════════════╗');
      logger.error('║                    ERRO FATAL                                  ║');
      logger.error('╠════════════════════════════════════════════════════════════════╣');
      logger.error(`║  Partição ${partitionName} não existe!                          ║`);
      logger.error('║                                                                ║');
      logger.error('║  O Collector não pode iniciar sem a partição do mês atual.     ║');
      logger.error('║                                                                ║');
      logger.error('║  Execute: docker compose run --rm init-partitions              ║');
      logger.error('╚════════════════════════════════════════════════════════════════╝');
      logger.error('');
      process.exit(1);
    }
    
    // Verificar se índice único existe na partição
    const indexName = `${partitionName}_event_id_unique`;
    const indexResult = await pool.query(`
      SELECT 1 
      FROM pg_indexes 
      WHERE indexname = $1
      AND schemaname = 'public'
    `, [indexName]);
    
    if (indexResult.rowCount === 0) {
      logger.error('');
      logger.error('╔════════════════════════════════════════════════════════════════╗');
      logger.error('║                    ERRO FATAL                                  ║');
      logger.error('╠════════════════════════════════════════════════════════════════╣');
      logger.error(`║  UNIQUE INDEX em ${partitionName} não existe!                   ║`);
      logger.error('║                                                                ║');
      logger.error('║  A deduplicação não funcionará corretamente.                   ║');
      logger.error('║                                                                ║');
      logger.error('║  Execute: docker compose run --rm init-partitions              ║');
      logger.error('╚════════════════════════════════════════════════════════════════╝');
      logger.error('');
      process.exit(1);
    }
    
    logger.info(`[Partition Check] ✓ Partição ${partitionName} OK`);
    logger.info(`[Partition Check] ✓ UNIQUE INDEX em event_id OK`);
    
  } catch (err) {
    logger.error('[Partition Check] Erro ao verificar partição:', err);
    process.exit(1);
  }
}
