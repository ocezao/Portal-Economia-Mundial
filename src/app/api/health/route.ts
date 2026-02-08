/**
 * Health Check Endpoint
 * GET /api/health
 * 
 * Verifica:
 * - Status geral do servidor
 * - Conexão com Supabase
 * - Tempo de resposta
 * - Uso de memória
 */

import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

interface HealthStatus {
  status: 'healthy' | 'degraded' | 'unhealthy';
  timestamp: string;
  uptime: number;
  version: string;
  checks: {
    server: {
      status: 'ok' | 'error';
      responseTime: number;
      memory: {
        used: string;
        total: string;
        percentage: number;
      };
    };
    database: {
      status: 'ok' | 'error';
      responseTime: number;
      error?: string;
    };
  };
}

export async function GET(request: NextRequest): Promise<NextResponse> {
  const startTime = Date.now();
  const checks: HealthStatus['checks'] = {
    server: {
      status: 'ok',
      responseTime: 0,
      memory: {
        used: '0 MB',
        total: '0 MB',
        percentage: 0,
      },
    },
    database: {
      status: 'error',
      responseTime: 0,
    },
  };

  // Check de memória
  const memUsage = process.memoryUsage();
  const memUsedMB = Math.round(memUsage.heapUsed / 1024 / 1024);
  const memTotalMB = Math.round(memUsage.heapTotal / 1024 / 1024);
  const memPercentage = Math.round((memUsage.heapUsed / memUsage.heapTotal) * 100);

  checks.server.memory = {
    used: `${memUsedMB} MB`,
    total: `${memTotalMB} MB`,
    percentage: memPercentage,
  };

  // Check de conexão com Supabase
  const dbStartTime = Date.now();
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseKey) {
      checks.database.status = 'error';
      checks.database.error = 'Variáveis de ambiente Supabase não configuradas';
    } else {
      const supabase = createClient(supabaseUrl, supabaseKey, {
        auth: { persistSession: false, autoRefreshToken: false },
      });

      // Testa conexão com uma query simples
      const { error } = await supabase.from('profiles').select('count', { count: 'exact', head: true });
      
      if (error && error.code !== 'PGRST116') {
        // PGRST116 = tabela não existe (ainda assim conectou)
        throw error;
      }

      checks.database.status = 'ok';
    }
  } catch (error) {
    checks.database.status = 'error';
    checks.database.error = error instanceof Error ? error.message : 'Erro desconhecido';
  }
  checks.database.responseTime = Date.now() - dbStartTime;

  // Tempo total de resposta
  checks.server.responseTime = Date.now() - startTime;

  // Determinar status geral
  let overallStatus: HealthStatus['status'] = 'healthy';
  if (checks.database.status === 'error') {
    overallStatus = 'degraded';
  }
  if (checks.server.memory.percentage > 90) {
    overallStatus = 'degraded';
  }

  const healthStatus: HealthStatus = {
    status: overallStatus,
    timestamp: new Date().toISOString(),
    uptime: Math.floor(process.uptime()),
    version: process.env.npm_package_version || '1.0.0',
    checks,
  };

  // Status code baseado na saúde
  const statusCode = overallStatus === 'healthy' ? 200 : overallStatus === 'degraded' ? 200 : 503;

  return NextResponse.json(healthStatus, {
    status: statusCode,
    headers: {
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      'Pragma': 'no-cache',
      'Expires': '0',
    },
  });
}

/**
 * HEAD /api/health
 * Lightweight health check para load balancers
 */
export async function HEAD(): Promise<NextResponse> {
  return new NextResponse(null, { status: 200 });
}
