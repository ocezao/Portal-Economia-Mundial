/**
 * Configure Metabase via API:
 * - Creates/updates a Postgres data source pointing to Supabase Postgres (or any Postgres URL)
 * - Optionally triggers schema sync / field values rescan
 *
 * Usage:
 *   METABASE_URL=https://metabase.example.com
 *   METABASE_API_KEY=... (preferred)  OR  METABASE_ADMIN_EMAIL=... + METABASE_ADMIN_PASSWORD=...
 *   METABASE_SOURCE_DB_URL=postgresql://user:pass@host:5432/dbname   (defaults to SUPABASE_DB_URL)
 *   node scripts/metabase/setup-metabase.mjs
 */

import 'dotenv/config';

function required(name, value) {
  if (!value) throw new Error(`Missing required env var: ${name}`);
  return value;
}

function normalizeBaseUrl(url) {
  return String(url || '').replace(/\/+$/, '');
}

function parsePostgresUrl(rawUrl) {
  const u = new URL(rawUrl);
  const dbname = (u.pathname || '').replace(/^\//, '');
  return {
    host: u.hostname,
    port: u.port ? Number(u.port) : 5432,
    dbname,
    user: decodeURIComponent(u.username || ''),
    password: decodeURIComponent(u.password || ''),
    ssl: true,
  };
}

async function fetchJson(url, opts) {
  let res;
  try {
    res = await fetch(url, {
      ...opts,
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
        ...(opts && opts.headers ? opts.headers : {}),
      },
    });
  } catch (err) {
    const cause = err && err.cause ? ` cause=${err.cause}` : '';
    throw new Error(`fetch failed for ${url}${cause}`);
  }

  const text = await res.text();
  let json = null;
  try {
    json = text ? JSON.parse(text) : null;
  } catch {
    // leave as null; include raw text in error
  }

  if (!res.ok) {
    const msg = json && (json.message || json.error) ? (json.message || json.error) : text;
    throw new Error(`HTTP ${res.status} ${res.statusText} for ${url}${msg ? `: ${msg}` : ''}`);
  }

  return json;
}

async function getSessionToken(baseUrl, email, password) {
  const json = await fetchJson(`${baseUrl}/api/session`, {
    method: 'POST',
    body: JSON.stringify({ username: email, password }),
  });
  if (!json || !json.id) throw new Error('Metabase /api/session did not return a session id');
  return json.id;
}

function buildAuthHeaders({ apiKey, sessionToken }) {
  if (apiKey) return { 'X-API-KEY': apiKey };
  if (sessionToken) return { 'X-Metabase-Session': sessionToken };
  return {};
}

async function listDatabases(baseUrl, authHeaders) {
  return await fetchJson(`${baseUrl}/api/database`, { method: 'GET', headers: authHeaders });
}

async function createDatabase(baseUrl, authHeaders, payload) {
  return await fetchJson(`${baseUrl}/api/database`, {
    method: 'POST',
    headers: authHeaders,
    body: JSON.stringify(payload),
  });
}

async function updateDatabase(baseUrl, authHeaders, id, payload) {
  return await fetchJson(`${baseUrl}/api/database/${id}`, {
    method: 'PUT',
    headers: authHeaders,
    body: JSON.stringify(payload),
  });
}

async function tryTriggerSync(baseUrl, authHeaders, id) {
  // Best-effort: these endpoints exist on most Metabase versions; if they fail, do not break setup.
  const endpoints = [
    { name: 'sync_schema', url: `${baseUrl}/api/database/${id}/sync_schema` },
    { name: 'rescan_values', url: `${baseUrl}/api/database/${id}/rescan_values` },
  ];

  for (const ep of endpoints) {
    try {
      await fetchJson(ep.url, { method: 'POST', headers: authHeaders, body: '{}' });
      // eslint-disable-next-line no-console
      console.log(`[metabase] triggered ${ep.name} for database ${id}`);
    } catch (err) {
      // eslint-disable-next-line no-console
      console.warn(`[metabase] could not trigger ${ep.name} (continuing): ${String(err && err.message ? err.message : err)}`);
    }
  }
}

async function main() {
  const baseUrl = normalizeBaseUrl(required('METABASE_URL', process.env.METABASE_URL));

  const apiKey = process.env.METABASE_API_KEY || '';
  const adminEmail = process.env.METABASE_ADMIN_EMAIL || '';
  const adminPassword = process.env.METABASE_ADMIN_PASSWORD || '';

  const sourceDbUrl =
    process.env.METABASE_SOURCE_DB_URL ||
    process.env.SUPABASE_DB_URL ||
    '';
  required('METABASE_SOURCE_DB_URL (or SUPABASE_DB_URL)', sourceDbUrl);

  const dbName = process.env.METABASE_SOURCE_DB_NAME || 'Supabase Postgres (analytics)';
  const sslEnabled = String(process.env.METABASE_SOURCE_DB_SSL || 'true').toLowerCase() !== 'false';

  const parsed = parsePostgresUrl(sourceDbUrl);
  if (!parsed.dbname) throw new Error('DB name missing in METABASE_SOURCE_DB_URL path (expected .../postgres)');
  if (!parsed.user) throw new Error('User missing in METABASE_SOURCE_DB_URL');

  // Auth
  let sessionToken = '';
  if (!apiKey) {
    required('METABASE_ADMIN_EMAIL', adminEmail);
    required('METABASE_ADMIN_PASSWORD', adminPassword);
    sessionToken = await getSessionToken(baseUrl, adminEmail, adminPassword);
  }
  const authHeaders = buildAuthHeaders({ apiKey, sessionToken });

  // Payload for Postgres
  const details = {
    host: parsed.host,
    port: parsed.port,
    dbname: parsed.dbname,
    user: parsed.user,
    password: parsed.password,
    ssl: Boolean(sslEnabled),
    // Metabase versions differ; keeping ssl-mode is harmless if ignored, helpful if supported.
    'ssl-mode': sslEnabled ? 'require' : 'disable',
  };

  const payload = {
    name: dbName,
    engine: 'postgres',
    details,
    // Keep this explicit so we do not create a "sample" db accidentally.
    is_sample: false,
  };

  // Upsert by name
  const dbList = await listDatabases(baseUrl, authHeaders);
  const existing = Array.isArray(dbList && dbList.data) ? dbList.data.find((d) => d && d.name === dbName) : null;

  if (existing && existing.id) {
    await updateDatabase(baseUrl, authHeaders, existing.id, payload);
    // eslint-disable-next-line no-console
    console.log(`[metabase] updated database connection: "${dbName}" (id=${existing.id})`);
    await tryTriggerSync(baseUrl, authHeaders, existing.id);
    return;
  }

  // Create
  try {
    const created = await createDatabase(baseUrl, authHeaders, payload);
    const id = created && created.id ? created.id : null;
    // eslint-disable-next-line no-console
    console.log(`[metabase] created database connection: "${dbName}"${id ? ` (id=${id})` : ''}`);
    if (id) await tryTriggerSync(baseUrl, authHeaders, id);
  } catch (err) {
    // Retry without ssl-mode if the instance rejects unknown fields.
    const msg = String(err && err.message ? err.message : err);
    if (!msg.toLowerCase().includes('ssl-mode')) throw err;
    delete details['ssl-mode'];
    const created = await createDatabase(baseUrl, authHeaders, payload);
    const id = created && created.id ? created.id : null;
    // eslint-disable-next-line no-console
    console.log(`[metabase] created database connection (retry): "${dbName}"${id ? ` (id=${id})` : ''}`);
    if (id) await tryTriggerSync(baseUrl, authHeaders, id);
  }
}

main().catch((err) => {
  // eslint-disable-next-line no-console
  console.error(`[metabase] setup failed: ${String(err && err.message ? err.message : err)}`);
  // eslint-disable-next-line no-console
  if (err && err.cause) console.error(`[metabase] cause: ${String(err.cause && err.cause.message ? err.cause.message : err.cause)}`);
  process.exitCode = 1;
});
