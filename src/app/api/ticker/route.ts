/**
 * API Route para Dados do Ticker de Mercado
 * 
 * Endpoint que retorna os dados dos índices e commodities
 * do banco local (cache da Finnhub API).
 * 
 * GET /api/ticker
 */

import { NextRequest, NextResponse } from 'next/server';
import { getGlobalIndicesSnapshot, getCommoditiesSnapshot } from '@/services/economics/snapshots';
import { logger } from '@/lib/logger';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const type = searchParams.get('type'); // 'indices', 'commodities', 'all'
    
    const indices = await getGlobalIndicesSnapshot();
    const commodities = await getCommoditiesSnapshot();
    
    const response = {
      indices: indices.slice(0, 6),
      commodities: commodities.slice(0, 4),
      updatedAt: new Date().toISOString(),
    };
    
    // Se pedir apenas um tipo
    if (type === 'indices') {
      return NextResponse.json({ 
        data: response.indices, 
        updatedAt: response.updatedAt 
      });
    }
    
    if (type === 'commodities') {
      return NextResponse.json({ 
        data: response.commodities, 
        updatedAt: response.updatedAt 
      });
    }
    
    // Por padrão, retorna tudo
    return NextResponse.json(response);
    
  } catch (error) {
    logger.error('[API /ticker] Error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch ticker data' },
      { status: 500 }
    );
  }
}
