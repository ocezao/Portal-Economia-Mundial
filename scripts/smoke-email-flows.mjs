#!/usr/bin/env node

/**
 * Smoke test dos fluxos de email/contato.
 *
 * Uso:
 *   node scripts/smoke-email-flows.mjs
 *   BASE_URL=http://127.0.0.1:3000 node scripts/smoke-email-flows.mjs
 *
 * Opcional (testes admin):
 *   ADMIN_BEARER_TOKEN=... ADMIN_TEST_USER_ID=... ADMIN_TEST_USER_EMAIL=...
 */

const baseUrl = process.env.BASE_URL || 'http://127.0.0.1:3000';
const adminToken = process.env.ADMIN_BEARER_TOKEN || '';
const adminUserId = process.env.ADMIN_TEST_USER_ID || '';
const adminUserEmail = process.env.ADMIN_TEST_USER_EMAIL || '';

const results = [];

async function post(path, body, headers = {}) {
  const response = await fetch(`${baseUrl}${path}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...headers,
    },
    body: JSON.stringify(body),
  });

  let json = null;
  try {
    json = await response.json();
  } catch {
    json = null;
  }

  return { status: response.status, json };
}

function ok(name, details) {
  results.push({ name, ok: true, details });
}

function fail(name, details) {
  results.push({ name, ok: false, details });
}

async function run() {
  const contactValid = {
    name: 'Teste Smoke',
    email: 'contato@cenariointernacional.com.br',
    phone: '11999990000',
    subject: 'Smoke test contato',
    category: 'suporte',
    message: 'Mensagem de teste automatizado para validar endpoint de contato e fluxo de email.',
    userId: null,
  };
  const contactInvalid = {
    ...contactValid,
    message: 'curta',
  };

  const careerValid = {
    name: 'Teste Candidato',
    email: 'contato@cenariointernacional.com.br',
    phone: '11999990000',
    role: 'Analista',
    location: 'Sao Paulo',
    linkedinUrl: 'https://linkedin.com/in/teste',
    portfolioUrl: 'https://example.com',
    resumeUrl: 'https://example.com/cv',
    coverLetter:
      'Texto de teste automatizado para validar endpoint de carreiras e confirmar persistencia e envio.',
    userId: null,
  };
  const careerInvalid = {
    ...careerValid,
    coverLetter: 'curto',
  };

  const r1 = await post('/api/contact-messages/', contactValid);
  if (r1.status === 200 && r1.json?.ok === true) ok('contact_valid', `status=${r1.status}`);
  else fail('contact_valid', `status=${r1.status} body=${JSON.stringify(r1.json)}`);

  const r2 = await post('/api/contact-messages/', contactInvalid);
  if (r2.status === 400) ok('contact_invalid', `status=${r2.status}`);
  else fail('contact_invalid', `status=${r2.status} body=${JSON.stringify(r2.json)}`);

  const r3 = await post('/api/career-applications/', careerValid);
  if (r3.status === 200 && r3.json?.ok === true) ok('career_valid', `status=${r3.status}`);
  else fail('career_valid', `status=${r3.status} body=${JSON.stringify(r3.json)}`);

  const r4 = await post('/api/career-applications/', careerInvalid);
  if (r4.status === 400) ok('career_invalid', `status=${r4.status}`);
  else fail('career_invalid', `status=${r4.status} body=${JSON.stringify(r4.json)}`);

  if (adminToken && adminUserId && adminUserEmail) {
    const r5 = await post(
      '/api/admin-users',
      {
        action: 'update_user',
        userId: adminUserId,
        email: adminUserEmail,
        name: 'Smoke Test User',
        role: 'user',
      },
      { Authorization: `Bearer ${adminToken}` },
    );
    if (r5.status === 200 && r5.json?.ok === true) ok('admin_update_user', `status=${r5.status}`);
    else fail('admin_update_user', `status=${r5.status} body=${JSON.stringify(r5.json)}`);
  } else {
    ok('admin_update_user', 'skipped (missing ADMIN_BEARER_TOKEN/ADMIN_TEST_USER_ID/ADMIN_TEST_USER_EMAIL)');
  }

  const failed = results.filter((r) => !r.ok);

  for (const item of results) {
    const marker = item.ok ? 'PASS' : 'FAIL';
    console.log(`[${marker}] ${item.name} - ${item.details}`);
  }

  if (failed.length > 0) {
    console.error(`\nSmoke test concluido com falhas (${failed.length}).`);
    process.exit(1);
  }

  console.log('\nSmoke test concluido com sucesso.');
}

run().catch((error) => {
  console.error(`Erro no smoke test: ${error instanceof Error ? error.message : String(error)}`);
  process.exit(1);
});
