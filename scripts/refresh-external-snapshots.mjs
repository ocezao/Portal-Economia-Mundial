/**
 * Refresh external_snapshots in Supabase.
 *
 * Designed to run locally or via GitHub Actions schedule.
 * Exits 0 when required env vars are missing (so CI/schedules don't fail by default).
 *
 * Required:
 * - SUPABASE_URL
 * - SUPABASE_SERVICE_ROLE_KEY
 * - FINNHUB_API_KEY (preferred) or NEXT_PUBLIC_FINNHUB_API_KEY
 */

import { createClient } from '@supabase/supabase-js';

function mustGet(name) {
  const v = process.env[name];
  return typeof v === 'string' && v.length > 0 ? v : null;
}

const SUPABASE_URL = mustGet('SUPABASE_URL') || mustGet('NEXT_PUBLIC_SUPABASE_URL');
const SERVICE_ROLE = mustGet('SUPABASE_SERVICE_ROLE_KEY');

if (!SUPABASE_URL || !SERVICE_ROLE) {
  console.log('[snapshots] missing SUPABASE_URL/SUPABASE_SERVICE_ROLE_KEY; skipping');
  process.exit(0);
}

// Ensure Finnhub key is available for server-side fetches.
const FINNHUB_API_KEY = mustGet('FINNHUB_API_KEY') || mustGet('NEXT_PUBLIC_FINNHUB_API_KEY');
if (!FINNHUB_API_KEY) {
  console.log('[snapshots] missing FINNHUB_API_KEY (or NEXT_PUBLIC_FINNHUB_API_KEY); skipping');
  process.exit(0);
}

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE, {
  auth: { persistSession: false, autoRefreshToken: false },
});

const FINNHUB_BASE = 'https://finnhub.io/api/v1';

function isoDate(d) {
  return d.toISOString().split('T')[0];
}

async function finnhub(endpoint, params = {}) {
  const url = new URL(`${FINNHUB_BASE}${endpoint}`);
  url.searchParams.set('token', FINNHUB_API_KEY);
  for (const [k, v] of Object.entries(params)) {
    if (v === undefined || v === null || v === '') continue;
    url.searchParams.set(k, String(v));
  }

  const res = await fetch(url.toString());
  if (!res.ok) {
    const body = await res.text().catch(() => '');
    throw new Error(`Finnhub ${res.status} ${res.statusText} ${body}`.trim());
  }
  return res.json();
}

async function upsertSnapshot(key, data) {
  const payload = {
    key,
    data,
    updated_at: new Date().toISOString(),
  };

  const { error } = await supabase.from('external_snapshots').upsert(payload, { onConflict: 'key' });
  if (error) throw error;
}

async function run() {
  const today = isoDate(new Date());
  const nextWeek = isoDate(new Date(Date.now() + 7 * 24 * 60 * 60 * 1000));

  // Fetch external data (minimize calls).
  const [marketNewsGeneral, marketNewsEconomic, earningsCalendar, economicCalendar] = await Promise.all([
    finnhub('/news', { category: 'general', minId: 0 }).then((x) => (Array.isArray(x) ? x.slice(0, 30) : [])),
    finnhub('/news', { category: 'economic', minId: 0 }).then((x) => (Array.isArray(x) ? x.slice(0, 30) : [])),
    finnhub('/calendar/earnings', { from: today, to: nextWeek }).catch(() => ({})),
    finnhub('/calendar/economic', { from: today, to: nextWeek }).catch(() => ([])),
  ]);

  const earningsNext7Days = Array.isArray(earningsCalendar?.earningsCalendar)
    ? earningsCalendar.earningsCalendar.slice(0, 50)
    : [];

  const economicNext7Days = Array.isArray(economicCalendar)
    ? economicCalendar.slice(0, 60)
    : [];

  // Indices/commodities: store quotes for a small, fixed set of proxies (low call count).
  const indicesSymbols = [
    { symbol: 'SPY', displaySymbol: 'SPX', name: 'S&P 500', region: 'EUA', currency: 'USD' },
    { symbol: 'DIA', displaySymbol: 'DJI', name: 'Dow Jones', region: 'EUA', currency: 'USD' },
    { symbol: 'QQQ', displaySymbol: 'NDX', name: 'Nasdaq 100', region: 'EUA', currency: 'USD' },
    { symbol: 'EWZ', displaySymbol: 'IBOV', name: 'Ibovespa', region: 'Brasil', currency: 'USD' },
    { symbol: 'EWG', displaySymbol: 'DAX', name: 'DAX', region: 'Alemanha', currency: 'USD' },
    { symbol: 'EWU', displaySymbol: 'FTSE', name: 'FTSE 100', region: 'Reino Unido', currency: 'USD' },
  ];

  const commoditySymbols = [
    { symbol: 'BNO', displaySymbol: 'BRENT', name: 'Petroleo Brent', unit: 'USD' },
    { symbol: 'USO', displaySymbol: 'WTI', name: 'Petroleo WTI', unit: 'USD' },
    { symbol: 'GLD', displaySymbol: 'OURO', name: 'Ouro', unit: 'USD' },
    { symbol: 'SLV', displaySymbol: 'PRATA', name: 'Prata', unit: 'USD' },
  ];

  const sectorSymbols = [
    { key: 'ENERGY', name: 'Energia', symbol: 'XLE' },
    { key: 'TECHNOLOGY', name: 'Tecnologia', symbol: 'XLK' },
    { key: 'FINANCIAL', name: 'Financeiro', symbol: 'XLF' },
    { key: 'HEALTHCARE', name: 'Saude', symbol: 'XLV' },
    { key: 'INDUSTRIAL', name: 'Industria', symbol: 'XLI' },
    { key: 'MATERIALS', name: 'Materiais', symbol: 'XLB' },
    { key: 'UTILITIES', name: 'Utilidades', symbol: 'XLU' },
    { key: 'REAL_ESTATE', name: 'Imobiliario', symbol: 'XLRE' },
    { key: 'CONSUMER_DISC', name: 'Consumo Discricionario', symbol: 'XLY' },
    { key: 'CONSUMER_STAPLES', name: 'Consumo Basico', symbol: 'XLP' },
    { key: 'COMMUNICATION', name: 'Comunicacao', symbol: 'XLC' },
  ];

  const fetchQuote = async (symbol) => finnhub('/quote', { symbol }).catch(() => null);

  const [indicesQuotes, commodityQuotes] = await Promise.all([
    Promise.all(indicesSymbols.map((s) => fetchQuote(s.symbol))),
    Promise.all(commoditySymbols.map((s) => fetchQuote(s.symbol))),
  ]);

  const sectorQuotes = await Promise.all(sectorSymbols.map((s) => fetchQuote(s.symbol)));

  const indicesGlobal = indicesSymbols
    .map((meta, idx) => ({ ...meta, quote: indicesQuotes[idx] }))
    .filter((x) => x.quote && typeof x.quote.c === 'number' && (x.quote.c > 0 || x.quote.pc > 0));

  const commoditiesMain = commoditySymbols
    .map((meta, idx) => ({ ...meta, quote: commodityQuotes[idx] }))
    .filter((x) => x.quote && typeof x.quote.c === 'number' && (x.quote.c > 0 || x.quote.pc > 0));

  const sectorsMain = sectorSymbols
    .map((meta, idx) => ({ ...meta, quote: sectorQuotes[idx] }))
    .filter((x) => x.quote && typeof x.quote.c === 'number' && (x.quote.c > 0 || x.quote.pc > 0));

  await Promise.all([
    upsertSnapshot('finnhub_market_news:general', marketNewsGeneral),
    upsertSnapshot('finnhub_market_news:economic', marketNewsEconomic),
    upsertSnapshot('finnhub_earnings_calendar:next_7_days', { from: today, to: nextWeek, data: earningsNext7Days }),
    upsertSnapshot('finnhub_economic_calendar:next_7_days', { from: today, to: nextWeek, data: economicNext7Days }),
    upsertSnapshot('finnhub_indices:global', indicesGlobal),
    upsertSnapshot('finnhub_commodities:main', commoditiesMain),
    upsertSnapshot('finnhub_sectors:main', sectorsMain),
  ]);

  console.log('[snapshots] refreshed ok');
}

run().catch((err) => {
  console.error('[snapshots] failed:', err?.message || err);
  process.exit(1);
});
