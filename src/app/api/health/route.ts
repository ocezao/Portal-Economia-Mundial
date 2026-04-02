import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

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

export async function GET(_request: NextRequest): Promise<NextResponse> {
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

  const memUsage = process.memoryUsage();
  const memUsedMB = Math.round(memUsage.heapUsed / 1024 / 1024);
  const memTotalMB = Math.round(memUsage.heapTotal / 1024 / 1024);
  const memPercentage = Math.round((memUsage.heapUsed / memUsage.heapTotal) * 100);

  checks.server.memory = {
    used: `${memUsedMB} MB`,
    total: `${memTotalMB} MB`,
    percentage: memPercentage,
  };

  const dbStartTime = Date.now();
  try {
    await query('select 1');
    checks.database.status = 'ok';
  } catch (error) {
    checks.database.status = 'error';
    checks.database.error = error instanceof Error ? error.message : 'Erro desconhecido';
  }
  checks.database.responseTime = Date.now() - dbStartTime;

  checks.server.responseTime = Date.now() - startTime;

  const overallStatus: HealthStatus['status'] = checks.database.status === 'ok' ? 'healthy' : 'unhealthy';

  const healthStatus: HealthStatus = {
    status: overallStatus,
    timestamp: new Date().toISOString(),
    uptime: Math.floor(process.uptime()),
    version: process.env.npm_package_version || '1.0.0',
    checks,
  };

  const statusCode = overallStatus === 'unhealthy' ? 503 : 200;

  return NextResponse.json(healthStatus, {
    status: statusCode,
    headers: {
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      Pragma: 'no-cache',
      Expires: '0',
    },
  });
}

export async function HEAD(): Promise<NextResponse> {
  return new NextResponse(null, { status: 200 });
}
