/**
 * Configure Metabase via API:
 * - Creates/updates a Postgres data source pointing to the local application database
 * - Optionally triggers schema sync / field values rescan
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
  return {
    host: u.hostname,
    port: u.port ? Number(u.port) : 5432,
    dbname: (u.pathname || '').replace(/^\//, ''),
    user: decodeURIComponent(u.username || ''),
    password: decodeURIComponent(u.password || ''),
    ssl: true,
  };
}

async function fetchJson(url, opts) {
  const res = await fetch(url, {
    ...opts,
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
      ...(opts && opts.headers ? opts.headers : {}),
    },
  });

  const text = await res.text();
  const json = text ? JSON.parse(text) : null;
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
  return fetchJson(`${baseUrl}/api/database`, { method: 'GET', headers: authHeaders });
}

async function createDatabase(baseUrl, authHeaders, payload) {
  return fetchJson(`${baseUrl}/api/database`, {
    method: 'POST',
    headers: authHeaders,
    body: JSON.stringify(payload),
  });
}

async function updateDatabase(baseUrl, authHeaders, id, payload) {
  return fetchJson(`${baseUrl}/api/database/${id}`, {
    method: 'PUT',
    headers: authHeaders,
    body: JSON.stringify(payload),
  });
}

async function tryTriggerSync(baseUrl, authHeaders, id) {
  const endpoints = [
    { name: 'sync_schema', url: `${baseUrl}/api/database/${id}/sync_schema` },
    { name: 'rescan_values', url: `${baseUrl}/api/database/${id}/rescan_values` },
  ];

  for (const ep of endpoints) {
    try {
      await fetchJson(ep.url, { method: 'POST', headers: authHeaders, body: '{}' });
      console.log(`[metabase] triggered ${ep.name} for database ${id}`);
    } catch (err) {
      console.warn(`[metabase] could not trigger ${ep.name}: ${String(err && err.message ? err.message : err)}`);
    }
  }
}

async function main() {
  const baseUrl = normalizeBaseUrl(required('METABASE_URL', process.env.METABASE_URL));
  const apiKey = process.env.METABASE_API_KEY || '';
  const adminEmail = process.env.METABASE_ADMIN_EMAIL || '';
  const adminPassword = process.env.METABASE_ADMIN_PASSWORD || '';
  const sourceDbUrl = process.env.METABASE_SOURCE_DB_URL || process.env.DATABASE_URL || '';

  required('METABASE_SOURCE_DB_URL (or DATABASE_URL)', sourceDbUrl);

  const dbName = process.env.METABASE_SOURCE_DB_NAME || 'Portal Postgres (analytics)';
  const sslEnabled = String(process.env.METABASE_SOURCE_DB_SSL || 'true').toLowerCase() !== 'false';
  const parsed = parsePostgresUrl(sourceDbUrl);

  let sessionToken = '';
  if (!apiKey) {
    required('METABASE_ADMIN_EMAIL', adminEmail);
    required('METABASE_ADMIN_PASSWORD', adminPassword);
    sessionToken = await getSessionToken(baseUrl, adminEmail, adminPassword);
  }

  const authHeaders = buildAuthHeaders({ apiKey, sessionToken });
  const details = {
    host: parsed.host,
    port: parsed.port,
    dbname: parsed.dbname,
    user: parsed.user,
    password: parsed.password,
    ssl: Boolean(sslEnabled),
    'ssl-mode': sslEnabled ? 'require' : 'disable',
  };

  const payload = {
    name: dbName,
    engine: 'postgres',
    details,
    is_sample: false,
  };

  const dbList = await listDatabases(baseUrl, authHeaders);
  const existing = Array.isArray(dbList && dbList.data) ? dbList.data.find((d) => d && d.name === dbName) : null;

  if (existing && existing.id) {
    await updateDatabase(baseUrl, authHeaders, existing.id, payload);
    console.log(`[metabase] updated database connection: "${dbName}" (id=${existing.id})`);
    await tryTriggerSync(baseUrl, authHeaders, existing.id);
    return;
  }

  const created = await createDatabase(baseUrl, authHeaders, payload);
  const id = created && created.id ? created.id : null;
  console.log(`[metabase] created database connection: "${dbName}"${id ? ` (id=${id})` : ''}`);
  if (id) await tryTriggerSync(baseUrl, authHeaders, id);
}

main().catch((err) => {
  console.error(`[metabase] setup failed: ${String(err && err.message ? err.message : err)}`);
  process.exitCode = 1;
});
