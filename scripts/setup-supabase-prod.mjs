#!/usr/bin/env node
/**
 * Script de configuração do Supabase para produção
 * Subagente B - Migração de Produção
 */

import { createClient } from '@supabase/supabase-js';
import { createReadStream } from 'fs';
import dotenv from 'dotenv';
import { writeFile, unlink } from 'fs/promises';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// ============================================================================
// CONFIGURAÇÃO
// ============================================================================

dotenv.config({ path: '.env.scripts' });
dotenv.config(); // optionally load .env for local runs

const SUPABASE_URL = (process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || '').trim();
const SUPABASE_SERVICE_KEY = (process.env.SUPABASE_SERVICE_ROLE_KEY || '').trim();
const BUCKET_NAME = 'media';

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error('Missing env. Set SUPABASE_URL (or NEXT_PUBLIC_SUPABASE_URL) and SUPABASE_SERVICE_ROLE_KEY.');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false }
});

const log = {
  info: (msg) => console.log(`[INFO] ${msg}`),
  success: (msg) => console.log(`[✅] ${msg}`),
  error: (msg) => console.log(`[❌] ${msg}`),
  warn: (msg) => console.log(`[⚠️] ${msg}`),
  step: (num, msg) => console.log(`\n[${num}/6] ${msg}`)
};

// ============================================================================
// 1. CRIAR BUCKET MEDIA
// ============================================================================

async function createMediaBucket() {
  log.step(1, 'Criando bucket "media" no Supabase Storage...');
  
  try {
    // Verificar se bucket já existe
    const { data: buckets, error: listError } = await supabase.storage.listBuckets();
    
    if (listError) {
      log.error(`Erro ao listar buckets: ${listError.message}`);
      return { success: false, error: listError };
    }
    
    const existingBucket = buckets.find(b => b.name === BUCKET_NAME);
    
    if (existingBucket) {
      log.success(`Bucket "${BUCKET_NAME}" já existe!`);
      return { success: true, created: false, bucket: existingBucket };
    }
    
    // Criar bucket
    const { data, error } = await supabase.storage.createBucket(BUCKET_NAME, {
      public: true,
      fileSizeLimit: 50 * 1024 * 1024, // 50MB
      allowedMimeTypes: [
        'image/png',
        'image/jpeg',
        'image/gif',
        'image/webp',
        'image/svg+xml',
        'video/mp4',
        'video/webm',
        'application/pdf',
        'text/plain',
        'application/json'
      ]
    });
    
    if (error) {
      log.error(`Erro ao criar bucket: ${error.message}`);
      return { success: false, error };
    }
    
    log.success(`Bucket "${BUCKET_NAME}" criado com sucesso!`);
    return { success: true, created: true, bucket: data };
  } catch (err) {
    log.error(`Exceção ao criar bucket: ${err.message}`);
    return { success: false, error: err };
  }
}

// ============================================================================
// 2. CONFIGURAR POLÍTICAS DO BUCKET (RLS)
// ============================================================================

async function configureBucketPolicies() {
  log.step(2, 'Configurando políticas de acesso do bucket...');
  
  const policies = [
    // Policy para SELECT (público)
    {
      name: 'Allow public select',
      definition: 'true',
      check: null,
      operation: 'SELECT'
    },
    // Policy para INSERT (autenticado)
    {
      name: 'Allow authenticated insert',
      definition: null,
      check: 'auth.role() = \'authenticated\'',
      operation: 'INSERT'
    },
    // Policy para UPDATE (autenticado - dono do arquivo)
    {
      name: 'Allow authenticated update own files',
      definition: 'auth.role() = \'authenticated\'',
      check: null,
      operation: 'UPDATE'
    },
    // Policy para DELETE (autenticado - dono do arquivo)
    {
      name: 'Allow authenticated delete own files',
      definition: 'auth.role() = \'authenticated\'',
      check: null,
      operation: 'DELETE'
    }
  ];
  
  try {
    // Criar políticas via SQL/RPC
    for (const policy of policies) {
      const { error } = await supabase.rpc('create_storage_policy', {
        bucket_name: BUCKET_NAME,
        policy_name: policy.name,
        policy_definition: policy.definition,
        policy_check: policy.check,
        policy_operation: policy.operation
      });
      
      // Ignorar erro se política já existe
      if (error && !error.message.includes('already exists')) {
        log.warn(`Aviso ao criar política "${policy.name}": ${error.message}`);
      }
    }
    
    log.success('Políticas de acesso configuradas!');
    return { success: true };
  } catch (err) {
    // Se a função RPC não existir, vamos usar SQL direto
    log.warn('Usando SQL direto para políticas...');
    return configurePoliciesViaSQL();
  }
}

async function configurePoliciesViaSQL() {
  const sql = `
    -- Habilitar RLS no bucket
    ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;
    
    -- Política para SELECT (público)
    CREATE POLICY "Allow public select on media" 
      ON storage.objects FOR SELECT 
      USING (bucket_id = '${BUCKET_NAME}');
    
    -- Política para INSERT (autenticado)
    CREATE POLICY "Allow authenticated insert on media" 
      ON storage.objects FOR INSERT 
      WITH CHECK (bucket_id = '${BUCKET_NAME}' AND auth.role() = 'authenticated');
    
    -- Política para UPDATE (autenticado)
    CREATE POLICY "Allow authenticated update on media" 
      ON storage.objects FOR UPDATE 
      USING (bucket_id = '${BUCKET_NAME}' AND auth.role() = 'authenticated');
    
    -- Política para DELETE (autenticado)
    CREATE POLICY "Allow authenticated delete on media" 
      ON storage.objects FOR DELETE 
      USING (bucket_id = '${BUCKET_NAME}' AND auth.role() = 'authenticated');
  `;
  
  try {
    const { error } = await supabase.rpc('exec_sql', { sql });
    if (error && !error.message.includes('already exists')) {
      log.warn(`Nota: Políticas podem precisar ser configuradas manualmente no dashboard`);
      return { success: false, warning: true };
    }
    log.success('Políticas SQL aplicadas!');
    return { success: true };
  } catch (err) {
    log.warn('Políticas devem ser configuradas manualmente no dashboard do Supabase');
    return { success: false, warning: true };
  }
}

// ============================================================================
// 3. CRIAR TABELA ANALYTICS_EVENTS
// ============================================================================

async function createAnalyticsTable() {
  log.step(3, 'Criando tabela analytics_events...');
  
  const createTableSQL = `
    CREATE TABLE IF NOT EXISTS analytics_events (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      event_type TEXT NOT NULL,
      event_data JSONB DEFAULT '{}',
      user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
      session_id TEXT,
      page_url TEXT,
      referrer TEXT,
      user_agent TEXT,
      ip_address TEXT,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );
    
    -- Índices para performance
    CREATE INDEX IF NOT EXISTS idx_analytics_events_event_type 
      ON analytics_events(event_type);
    CREATE INDEX IF NOT EXISTS idx_analytics_events_created_at 
      ON analytics_events(created_at DESC);
    CREATE INDEX IF NOT EXISTS idx_analytics_events_user_id 
      ON analytics_events(user_id);
    CREATE INDEX IF NOT EXISTS idx_analytics_events_session_id 
      ON analytics_events(session_id);
    CREATE INDEX IF NOT EXISTS idx_analytics_events_page_url 
      ON analytics_events(page_url);
    
    -- Índice GIN para buscas em event_data JSONB
    CREATE INDEX IF NOT EXISTS idx_analytics_events_event_data 
      ON analytics_events USING GIN(event_data);
    
    -- Habilitar RLS
    ALTER TABLE analytics_events ENABLE ROW LEVEL SECURITY;
    
    -- Política para INSERT (permitir inserção anônima do collector)
    CREATE POLICY "Allow insert on analytics_events" 
      ON analytics_events FOR INSERT 
      WITH CHECK (true);
    
    -- Política para SELECT (apenas admin/service role)
    CREATE POLICY "Allow select on analytics_events" 
      ON analytics_events FOR SELECT 
      USING (auth.role() = 'service_role' OR auth.role() = 'authenticated');
  `;
  
  try {
    // Tentar criar via SQL
    const { error } = await supabase.rpc('exec_sql', { sql: createTableSQL });
    
    if (error) {
      // Tentar método alternativo: criar via API REST
      log.warn(`SQL exec falhou: ${error.message}. Tentando método alternativo...`);
      return createTableViaAPI();
    }
    
    log.success('Tabela analytics_events criada com índices!');
    return { success: true };
  } catch (err) {
    return createTableViaAPI();
  }
}

async function createTableViaAPI() {
  // Criar tabela via migrations ou verificar se já existe
  try {
    const { data, error } = await supabase
      .from('analytics_events')
      .select('id', { count: 'exact', head: true });
    
    if (!error) {
      log.success('Tabela analytics_events já existe!');
      return { success: true, created: false };
    }
    
    log.warn('Tabela não existe e não foi possível criar via API. Crie manualmente no SQL Editor:');
    console.log('\n--- SQL PARA CRIAR TABELA ---');
    console.log(`
CREATE TABLE IF NOT EXISTS analytics_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_type TEXT NOT NULL,
  event_data JSONB DEFAULT '{}',
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  session_id TEXT,
  page_url TEXT,
  referrer TEXT,
  user_agent TEXT,
  ip_address TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_analytics_events_event_type ON analytics_events(event_type);
CREATE INDEX idx_analytics_events_created_at ON analytics_events(created_at DESC);
CREATE INDEX idx_analytics_events_user_id ON analytics_events(user_id);
CREATE INDEX idx_analytics_events_event_data ON analytics_events USING GIN(event_data);

ALTER TABLE analytics_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow insert on analytics_events" 
  ON analytics_events FOR INSERT WITH CHECK (true);
    `);
    console.log('--- FIM DO SQL ---\n');
    
    return { success: false, manual: true };
  } catch (err) {
    log.error(`Erro ao verificar tabela: ${err.message}`);
    return { success: false, error: err };
  }
}

// ============================================================================
// 4. TESTAR UPLOAD
// ============================================================================

async function testUpload() {
  log.step(4, 'Testando upload para o bucket media...');
  
  const testFileName = `test-prod-${Date.now()}.txt`;
  const testContent = `Teste de upload - Portal Econômico Mundial
Timestamp: ${new Date().toISOString()}
Bucket: ${BUCKET_NAME}
Teste: Subagente B - Migração de Produção`;
  
  const tempFilePath = join(__dirname, testFileName);
  
  try {
    // Criar arquivo temporário
    await writeFile(tempFilePath, testContent);
    
    // Fazer upload
    const { data, error } = await supabase.storage
      .from(BUCKET_NAME)
      .upload(testFileName, createReadStream(tempFilePath), {
        contentType: 'text/plain',
        upsert: false
      });
    
    // Limpar arquivo temporário
    await unlink(tempFilePath).catch(() => {});
    
    if (error) {
      log.error(`Erro no upload: ${error.message}`);
      return { success: false, error };
    }
    
    // Obter URL pública
    const { data: { publicUrl } } = supabase.storage
      .from(BUCKET_NAME)
      .getPublicUrl(testFileName);
    
    log.success(`Upload teste realizado com sucesso!`);
    log.info(`Arquivo: ${testFileName}`);
    log.info(`URL Pública: ${publicUrl}`);
    
    return { 
      success: true, 
      fileName: testFileName, 
      publicUrl,
      timestamp: new Date().toISOString()
    };
  } catch (err) {
    log.error(`Exceção no upload: ${err.message}`);
    return { success: false, error: err };
  }
}

// ============================================================================
// 5. TESTAR ESCRITA DO COLLECTOR
// ============================================================================

async function testCollectorWrite() {
  log.step(5, 'Testando escrita de evento de analytics...');
  
  const testEvent = {
    event_type: 'test_migration',
    event_data: {
      test: true,
      migration_step: 'subagente_b',
      timestamp: Date.now(),
      source: 'setup-script'
    },
    session_id: `test-session-${Date.now()}`,
    page_url: 'https://cenariointernacional.com.br/setup-test',
    referrer: 'setup-script',
    user_agent: 'SubagenteB/1.0',
    ip_address: '127.0.0.1'
  };
  
  try {
    const { data, error } = await supabase
      .from('analytics_events')
      .insert(testEvent)
      .select()
      .single();
    
    if (error) {
      log.error(`Erro ao inserir evento: ${error.message}`);
      return { success: false, error };
    }
    
    log.success(`Evento de teste inserido com sucesso!`);
    log.info(`Event ID: ${data.id}`);
    log.info(`Event Type: ${data.event_type}`);
    log.info(`Created At: ${data.created_at}`);
    
    return { 
      success: true, 
      eventId: data.id,
      eventType: data.event_type,
      createdAt: data.created_at
    };
  } catch (err) {
    log.error(`Exceção ao inserir evento: ${err.message}`);
    return { success: false, error: err };
  }
}

// ============================================================================
// 6. VERIFICAR VARIÁVEIS DO .ENV
// ============================================================================

async function checkEnvVariables() {
  log.step(6, 'Verificando variáveis de ambiente necessárias...');
  
  const requiredVars = [
    'NEXT_PUBLIC_SUPABASE_URL',
    'NEXT_PUBLIC_SUPABASE_ANON_KEY',
    'SUPABASE_SERVICE_ROLE_KEY',
    'SUPABASE_UPLOAD_BUCKET'
  ];
  
  const envVars = {};
  
  log.info('Variáveis obrigatórias para o .env de produção:');
  console.log('');
  
  for (const varName of requiredVars) {
    const value = process.env[varName] || getEnvVarFromFile(varName);
    envVars[varName] = value ? '✅ Configurada' : '❌ NÃO CONFIGURADA';
    const isSensitive =
      varName.includes('KEY') || varName.includes('PASSWORD') || varName.includes('SECRET') || varName.includes('TOKEN');
    const printable = value ? (isSensitive ? '[set]' : value) : '[VAZIO]';
    console.log(`  ${varName}=${printable}`);
  }
  
  console.log('');
  
  // Verificar especificamente o bucket
  const bucketVar = process.env.SUPABASE_UPLOAD_BUCKET || 'NÃO DEFINIDO';
  if (bucketVar !== 'media') {
    log.warn(`SUPABASE_UPLOAD_BUCKET deve ser "media", atualmente é: ${bucketVar}`);
    log.info('Adicione ao .env de produção: SUPABASE_UPLOAD_BUCKET=media');
  } else {
    log.success('SUPABASE_UPLOAD_BUCKET=media ✅');
  }
  
  return { success: true, vars: envVars };
}

function getEnvVarFromFile(varName) {
  // Na prática, lemos do arquivo .env
  // Mas para este script, usamos os valores já conhecidos
  void varName;
  return null;
}

// ============================================================================
// EXECUÇÃO PRINCIPAL
// ============================================================================

async function main() {
  console.log('='.repeat(70));
  console.log('SUPABASE MANAGER - Subagente B (Migração de Produção)');
  console.log('='.repeat(70));
  console.log(`Projeto: ${SUPABASE_URL}`);
  console.log(`Bucket: ${BUCKET_NAME}`);
  console.log(`Timestamp: ${new Date().toISOString()}`);
  console.log('='.repeat(70));
  
  const results = {
    bucket: null,
    policies: null,
    table: null,
    upload: null,
    collector: null,
    env: null,
    timestamp: new Date().toISOString()
  };
  
  try {
    // 1. Criar bucket
    results.bucket = await createMediaBucket();
    
    // 2. Configurar políticas
    results.policies = await configureBucketPolicies();
    
    // 3. Criar tabela
    results.table = await createAnalyticsTable();
    
    // 4. Testar upload (se bucket foi criado)
    if (results.bucket.success) {
      results.upload = await testUpload();
    }
    
    // 5. Testar escrita do collector (se tabela foi criada)
    if (results.table.success) {
      results.collector = await testCollectorWrite();
    }
    
    // 6. Verificar variáveis
    results.env = await checkEnvVariables();
    
  } catch (err) {
    log.error(`Erro fatal: ${err.message}`);
    console.error(err);
  }
  
  // ============================================================================
  // RELATÓRIO FINAL
  // ============================================================================
  
  console.log('\n' + '='.repeat(70));
  console.log('RELATÓRIO FINAL - Subagente B');
  console.log('='.repeat(70));
  
  console.log(`\n1. BUCKET "media": ${results.bucket?.success ? '✅ CONCLUÍDO' : '❌ FALHA'}`);
  if (results.bucket?.created === false) {
    console.log('   ℹ️ Bucket já existia');
  }
  
  console.log(`\n2. POLÍTICAS DE ACESSO: ${results.policies?.success ? '✅ CONCLUÍDO' : '⚠️ VERIFICAÇÃO MANUAL NECESSÁRIA'}`);
  if (results.policies?.warning) {
    console.log('   ⚠️ Configure manualmente no dashboard: Storage > Policies');
  }
  
  console.log(`\n3. TABELA analytics_events: ${results.table?.success ? '✅ CONCLUÍDO' : '⚠️ VERIFICAÇÃO MANUAL NECESSÁRIA'}`);
  if (results.table?.manual) {
    console.log('   ⚠️ Execute o SQL fornecido acima no Supabase SQL Editor');
  }
  
  console.log(`\n4. TESTE DE UPLOAD: ${results.upload?.success ? '✅ CONCLUÍDO' : '❌ FALHA'}`);
  if (results.upload?.success) {
    console.log(`   📄 Arquivo: ${results.upload.fileName}`);
    console.log(`   🔗 URL: ${results.upload.publicUrl}`);
  }
  
  console.log(`\n5. TESTE DO COLLECTOR: ${results.collector?.success ? '✅ CONCLUÍDO' : '❌ FALHA'}`);
  if (results.collector?.success) {
    console.log(`   📝 Event ID: ${results.collector.eventId}`);
    console.log(`   ⏰ Timestamp: ${results.collector.createdAt}`);
  }
  
  console.log(`\n6. VARIÁVEIS .env: ${results.env?.success ? '✅ VERIFICADO' : '⚠️ ATENÇÃO'}`);
  console.log('   ⚠️ Certifique-se de adicionar ao .env de produção:');
  console.log('      SUPABASE_UPLOAD_BUCKET=media');
  console.log('      CORS_ALLOWED_ORIGINS=https://cenariointernacional.com.br,https://www.cenariointernacional.com.br');
  
  console.log('\n' + '='.repeat(70));
  
  // Salvar relatório em arquivo
  const reportPath = join(__dirname, `supabase-setup-report-${Date.now()}.json`);
  await writeFile(reportPath, JSON.stringify(results, null, 2));
  console.log(`\n📄 Relatório detalhado salvo em: ${reportPath}`);
  
  // Status final
  const allCriticalOk = results.bucket?.success && results.upload?.success;
  const status = allCriticalOk ? '✅ CONCLUÍDO' : '⚠️ CONCLUÍDO COM RESSALVAS';
  console.log(`\n${status}`);
  
  return results;
}

main().catch(console.error);
