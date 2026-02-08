/**
 * Snapshots (cache) para dados externos (ex: Finnhub).
 *
 * Ideia: um job (Edge Function/cron) atualiza `external_snapshots` periodicamente
 * e o site so le deste cache. Isso reduz custo por pageview e evita rate limit.
 */

import { supabase, isSupabaseConfigured } from '@/lib/supabaseClient';
import {
  getMarketNews,
  getEconomicCalendar,
  getEarningsCalendar,
  getGlobalIndicesData,
  getCommoditiesData,
  getSectorsPerformance,
} from './finnhubService';
import type { EarningsEvent, MarketNews, EconomicCalendarEvent } from './finnhubService';
import { logger } from '@/lib/logger';

type SnapshotRow = { key: string; data: unknown; updated_at: string };

async function readSnapshot<T>(key: string): Promise<{ data: T | null; updatedAt: Date | null }> {
  if (!isSupabaseConfigured) return { data: null, updatedAt: null };

  const { data, error } = await supabase
    .from('external_snapshots')
    .select('key, data, updated_at')
    .eq('key', key)
    .maybeSingle();

  if (error) return { data: null, updatedAt: null };
  if (!data) return { data: null, updatedAt: null };

  const row = data as SnapshotRow;
  return {
    data: (row.data as T) ?? null,
    updatedAt: row.updated_at ? new Date(row.updated_at) : null,
  };
}

async function readSnapshotWithMeta<T>(key: string) {
  return readSnapshot<T>(key);
}

function isFresh(updatedAt: Date | null, ttlMs: number) {
  if (!updatedAt) return false;
  return Date.now() - updatedAt.getTime() <= ttlMs;
}

function requireSnapshots() {
  return process.env.EXTERNAL_SNAPSHOTS_REQUIRE === 'true';
}

/**
 * Noticia de mercado (Finnhub) via snapshot quando possivel.
 * TTL padrao: 5 minutos.
 */
export async function getMarketNewsSnapshot(category: string = 'general'): Promise<MarketNews[]> {
  const key = `finnhub_market_news:${category}`;
  const ttlMs = 5 * 60 * 1000;

  try {
    const snap = await readSnapshot<MarketNews[]>(key);
    if (snap.data && isFresh(snap.updatedAt, ttlMs)) return snap.data;
  } catch {
    // ignore
  }

  if (requireSnapshots()) return [];

  // Fallback: chamada direta (mantem app funcionando sem job em dev).
  try {
    return await getMarketNews(category);
  } catch (err) {
    logger.warn('[Snapshots] marketNews fallback failed:', err);
    return [];
  }
}

export async function getEarningsNext7DaysSnapshot(): Promise<EarningsEvent[]> {
  const key = 'finnhub_earnings_calendar:next_7_days';
  const ttlMs = 60 * 60 * 1000;

  try {
    const snap = await readSnapshot<{ from: string; to: string; data: EarningsEvent[] }>(key);
    if (snap.data?.data && isFresh(snap.updatedAt, ttlMs)) return snap.data.data;
  } catch {
    // ignore
  }

  if (requireSnapshots()) return [];

  // Fallback: compute window now.
  const today = new Date().toISOString().split('T')[0];
  const nextWeek = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
  try {
    return await getEarningsCalendar(today, nextWeek);
  } catch (err) {
    logger.warn('[Snapshots] earnings fallback failed:', err);
    return [];
  }
}

export type SnapshotQuote = {
  symbol: string;
  displaySymbol?: string;
  name: string;
  region?: string;
  currency?: string;
  unit?: string;
  quote: { c: number; d: number; dp: number; h: number; l: number; o: number; pc: number; t: number };
};

export async function getGlobalIndicesSnapshot(): Promise<SnapshotQuote[]> {
  const key = 'finnhub_indices:global';
  const ttlMs = 5 * 60 * 1000;

  try {
    const snap = await readSnapshot<SnapshotQuote[]>(key);
    if (Array.isArray(snap.data) && isFresh(snap.updatedAt, ttlMs)) return snap.data;
  } catch {
    // ignore
  }

  if (requireSnapshots()) return [];

  try {
    // Fallback uses the existing helper (may call Finnhub).
    const data = await getGlobalIndicesData();
    return data.map((d: { symbol: string; name: string; region: string; currency: string; price: number; change: number; changePercent: number; high: number; low: number; open: number; previousClose: number; timestamp: number }) => ({
      symbol: d.symbol,
      name: d.name,
      region: d.region,
      currency: d.currency,
      quote: {
        c: d.price,
        d: d.change,
        dp: d.changePercent,
        h: d.high,
        l: d.low,
        o: d.open,
        pc: d.previousClose,
        t: d.timestamp,
      },
    }));
  } catch (err) {
    logger.warn('[Snapshots] indices fallback failed:', err);
    return [];
  }
}

export async function getCommoditiesSnapshot(): Promise<SnapshotQuote[]> {
  const key = 'finnhub_commodities:main';
  const ttlMs = 5 * 60 * 1000;

  try {
    const snap = await readSnapshot<SnapshotQuote[]>(key);
    if (Array.isArray(snap.data) && isFresh(snap.updatedAt, ttlMs)) return snap.data;
  } catch {
    // ignore
  }

  if (requireSnapshots()) return [];

  try {
    const data = await getCommoditiesData();
    return data.map((d: { symbol: string; name: string; unit: string; price: number; change: number; changePercent: number; high: number; low: number; open: number; previousClose: number }) => ({
      symbol: d.symbol,
      name: d.name,
      unit: d.unit,
      quote: {
        c: d.price,
        d: d.change,
        dp: d.changePercent,
        h: d.high,
        l: d.low,
        o: d.open,
        pc: d.previousClose,
        t: Date.now(),
      },
    }));
  } catch (err) {
    logger.warn('[Snapshots] commodities fallback failed:', err);
    return [];
  }
}

export type SnapshotSector = {
  key: string;
  name: string;
  symbol: string;
  quote: { c: number; d: number; dp: number; h: number; l: number; o: number; pc: number; t: number };
};

export async function getSectorsSnapshot(): Promise<SnapshotSector[]> {
  const key = 'finnhub_sectors:main';
  const ttlMs = 5 * 60 * 1000;

  try {
    const snap = await readSnapshotWithMeta<SnapshotSector[]>(key);
    if (Array.isArray(snap.data) && isFresh(snap.updatedAt, ttlMs)) return snap.data;
  } catch {
    // ignore
  }

  if (requireSnapshots()) return [];

  try {
    const data = await getSectorsPerformance();
    return data.map((d: { key: string; name: string; symbol: string; price: number; change: number; changePercent: number }) => ({
      key: d.key,
      name: d.name,
      symbol: d.symbol,
      quote: {
        c: d.price,
        d: d.change,
        dp: d.changePercent,
        h: d.price,
        l: d.price,
        o: d.price,
        pc: d.price - d.change,
        t: Date.now(),
      },
    }));
  } catch (err) {
    logger.warn('[Snapshots] sectors fallback failed:', err);
    return [];
  }
}

export async function getEconomicCalendarNext7DaysSnapshot(): Promise<EconomicCalendarEvent[]> {
  const key = 'finnhub_economic_calendar:next_7_days';
  const ttlMs = 60 * 60 * 1000;

  try {
    const snap = await readSnapshotWithMeta<{ from: string; to: string; data: EconomicCalendarEvent[] }>(key);
    if (snap.data?.data && isFresh(snap.updatedAt, ttlMs)) return snap.data.data;
  } catch {
    // ignore
  }

  if (requireSnapshots()) return [];

  const today = new Date().toISOString().split('T')[0];
  const nextWeek = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
  try {
    return await getEconomicCalendar(today, nextWeek);
  } catch (err) {
    logger.warn('[Snapshots] economicCalendar fallback failed:', err);
    return [];
  }
}
