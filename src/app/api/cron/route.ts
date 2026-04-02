/**
 * API de Cron para Atualização de Dados Externos
 * 
 * Endpoints que serão chamados periodicamente para
 * buscar dados das APIs e armazenar no banco local.
 * 
 * 调用: curl -X POST http://localhost:3000/api/cron?type=market-news
 */

import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { getMarketNews, getEarningsCalendar, getGlobalIndicesData, getCommoditiesData, getSectorsPerformance, getEconomicCalendar } from '@/services/economics/finnhubService';
import { saveSnapshotToLocalDb, getSnapshotFromLocalDb } from '@/lib/db';
import { CACHE_TTL } from '@/config/apiLimits';
import { dispatchDueEditorialJobs } from '@/services/editorialJobs';

const API_SECRET = process.env.CRON_API_SECRET || '';

function authenticateRequest(request: NextRequest): boolean {
  const providedSecret = request.headers.get('x-cron-secret');
  return providedSecret === API_SECRET && API_SECRET !== '';
}

export async function POST(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const type = searchParams.get('type');

  if (!authenticateRequest(request) && process.env.NODE_ENV === 'production') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    switch (type) {
      case 'market-news':
        return await refreshMarketNews();
      case 'earnings':
        return await refreshEarnings();
      case 'indices':
        return await refreshIndices();
      case 'commodities':
        return await refreshCommodities();
      case 'sectors':
        return await refreshSectors();
      case 'economic-calendar':
        return await refreshEconomicCalendar();
      case 'publish-scheduled':
        return await publishScheduledArticles();
      case 'all':
        return await refreshAll();
      default:
        return NextResponse.json({ error: 'Unknown refresh type. Use: market-news, earnings, indices, commodities, sectors, economic-calendar, publish-scheduled, all' }, { status: 400 });
    }
  } catch (error) {
    console.error('[Cron] Refresh failed:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

async function refreshMarketNews() {
  const key = 'finnhub_market_news:general';
  
  try {
    const data = await getMarketNews('general');
    
    if (data.length > 0) {
      await saveSnapshotToLocalDb(key, data);
      console.log(`[Cron] Market news updated: ${data.length} items`);
      return NextResponse.json({ 
        success: true, 
        key, 
        count: data.length,
        ttl: CACHE_TTL.MARKET_NEWS / 1000 / 60 + ' minutes'
      });
    }
    
    return NextResponse.json({ success: false, message: 'No data fetched' });
  } catch (error) {
    console.error('[Cron] Market news refresh failed:', error);
    return NextResponse.json({ success: false, error: String(error) }, { status: 500 });
  }
}

async function refreshEarnings() {
  const key = 'finnhub_earnings_calendar:next_7_days';
  
  try {
    const today = new Date().toISOString().split('T')[0];
    const nextWeek = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    
    const data = await getEarningsCalendar(today, nextWeek);
    const payload = { from: today, to: nextWeek, data };
    
    await saveSnapshotToLocalDb(key, payload);
    console.log(`[Cron] Earnings updated: ${data.length} items`);
    
    return NextResponse.json({ 
      success: true, 
      key, 
      count: data.length,
      ttl: CACHE_TTL.EARNINGS / 1000 / 60 + ' hours'
    });
  } catch (error) {
    console.error('[Cron] Earnings refresh failed:', error);
    return NextResponse.json({ success: false, error: String(error) }, { status: 500 });
  }
}

async function refreshIndices() {
  const key = 'finnhub_indices:global';
  
  try {
    const data = await getGlobalIndicesData();
    
    if (data.length > 0) {
      await saveSnapshotToLocalDb(key, data);
      console.log(`[Cron] Indices updated: ${data.length} items`);
      
      return NextResponse.json({ 
        success: true, 
        key, 
        count: data.length,
        ttl: CACHE_TTL.INDICES / 1000 / 60 + ' minutes'
      });
    }
    
    return NextResponse.json({ success: false, message: 'No data fetched' });
  } catch (error) {
    console.error('[Cron] Indices refresh failed:', error);
    return NextResponse.json({ success: false, error: String(error) }, { status: 500 });
  }
}

async function refreshCommodities() {
  const key = 'finnhub_commodities:main';
  
  try {
    const data = await getCommoditiesData();
    
    if (data.length > 0) {
      await saveSnapshotToLocalDb(key, data);
      console.log(`[Cron] Commodities updated: ${data.length} items`);
      
      return NextResponse.json({ 
        success: true, 
        key, 
        count: data.length,
        ttl: CACHE_TTL.COMMODITIES / 1000 / 60 + ' minutes'
      });
    }
    
    return NextResponse.json({ success: false, message: 'No data fetched' });
  } catch (error) {
    console.error('[Cron] Commodities refresh failed:', error);
    return NextResponse.json({ success: false, error: String(error) }, { status: 500 });
  }
}

async function refreshSectors() {
  const key = 'finnhub_sectors:main';
  
  try {
    const data = await getSectorsPerformance();
    
    if (data.length > 0) {
      await saveSnapshotToLocalDb(key, data);
      console.log(`[Cron] Sectors updated: ${data.length} items`);
      
      return NextResponse.json({ 
        success: true, 
        key, 
        count: data.length,
        ttl: CACHE_TTL.SECTORS / 1000 / 60 + ' hours'
      });
    }
    
    return NextResponse.json({ success: false, message: 'No data fetched' });
  } catch (error) {
    console.error('[Cron] Sectors refresh failed:', error);
    return NextResponse.json({ success: false, error: String(error) }, { status: 500 });
  }
}

async function refreshEconomicCalendar() {
  const key = 'finnhub_economic_calendar:next_7_days';
  
  try {
    const today = new Date().toISOString().split('T')[0];
    const nextWeek = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    
    const data = await getEconomicCalendar(today, nextWeek);
    const payload = { from: today, to: nextWeek, data };
    
    await saveSnapshotToLocalDb(key, payload);
    console.log(`[Cron] Economic calendar updated: ${data.length} items`);
    
    return NextResponse.json({ 
      success: true, 
      key, 
      count: data.length,
      ttl: CACHE_TTL.ECONOMIC_CALENDAR / 1000 / 60 + ' hours'
    });
  } catch (error) {
    console.error('[Cron] Economic calendar refresh failed:', error);
    return NextResponse.json({ success: false, error: String(error) }, { status: 500 });
  }
}

async function publishScheduledArticles() {
  console.log('[Cron] Starting scheduled articles publishing check...');
  
  try {
    const result = await dispatchDueEditorialJobs(50);
    console.log(`[Cron] Published ${result.published} scheduled articles`);
    
    return NextResponse.json({
      success: true,
      action: 'publish-scheduled',
      count: result.published,
      processed: result.processed,
      failed: result.failed,
      message: result.published > 0 ? `Published ${result.published} scheduled articles` : 'No articles to publish',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('[Cron] Publish scheduled articles failed:', error);
    return NextResponse.json({ success: false, error: String(error) }, { status: 500 });
  }
}

async function refreshAll() {
  const results = await Promise.allSettled([
    refreshMarketNews(),
    refreshEarnings(),
    refreshIndices(),
    refreshCommodities(),
    refreshSectors(),
  ]);
  
  const summary = results.map((r, i) => ({
    index: i,
    resultStatus: r.status,
    ...(r.status === 'fulfilled' ? { value: r.value } : { error: String(r.reason) })
  }));
  
  return NextResponse.json({
    success: true,
    results: summary,
    timestamp: new Date().toISOString()
  });
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const type = searchParams.get('type');
  
  if (type === 'status') {
    const keys = [
      'finnhub_market_news:general',
      'finnhub_earnings_calendar:next_7_days',
      'finnhub_indices:global',
      'finnhub_commodities:main',
      'finnhub_sectors:main',
    ];
    
    const snapshots = await Promise.all(
      keys.map(async (key) => {
        const data = await getSnapshotFromLocalDb(key);
        return { key, hasData: !!data, updatedAt: data?.fetched_at };
      })
    );
    
    return NextResponse.json({
      snapshots,
      timestamp: new Date().toISOString()
    });
  }
  
  return NextResponse.json({ 
    message: 'Use POST to trigger refresh',
    example: 'curl -X POST "http://localhost:3000/api/cron?type=market-news"',
    endpoints: [
      '?type=market-news',
      '?type=earnings',
      '?type=indices',
      '?type=commodities',
      '?type=sectors',
      '?type=economic-calendar',
      '?type=all',
      '?type=status (GET)'
    ]
  });
}
