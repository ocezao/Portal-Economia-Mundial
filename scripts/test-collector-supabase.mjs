#!/usr/bin/env node
/**
 * Testa a escrita do collector no Supabase com o schema real da tabela
 */

import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';
import dotenv from 'dotenv';
import { writeFile } from 'fs/promises';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: '.env.scripts' });
dotenv.config(); // optionally load .env for local runs

const SUPABASE_URL = (process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || '').trim();
const SUPABASE_SERVICE_KEY = (process.env.SUPABASE_SERVICE_ROLE_KEY || '').trim();

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error('Missing env. Set SUPABASE_URL (or NEXT_PUBLIC_SUPABASE_URL) and SUPABASE_SERVICE_ROLE_KEY.');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

async function testCollectorEvent() {
  console.log('Testando inserção de evento de analytics...\n');
  
  // Evento com schema real da tabela analytics_events
  const collectorEvent = {
    event_type: 'page_view',
    session_id: crypto.randomUUID(),
    url_path: '/test-migration',
    properties: {
      test: true,
      migration: 'subagente_b',
      timestamp: new Date().toISOString(),
      user_agent: 'Mozilla/5.0 (Test)',
      referrer: 'https://setup.script/'
    }
  };
  
  console.log('Dados do evento:');
  console.log(JSON.stringify(collectorEvent, null, 2));
  
  const { data, error } = await supabase
    .from('analytics_events')
    .insert(collectorEvent)
    .select()
    .single();
  
  if (error) {
    console.log('\n❌ ERRO:', error.message);
    return { success: false, error };
  }
  
  console.log('\n✅ Evento inserido com sucesso!');
  console.log('ID:', data.id);
  console.log('Timestamp:', data.created_at);
  
  return { 
    success: true, 
    eventId: data.id,
    eventType: data.event_type,
    sessionId: data.session_id,
    createdAt: data.created_at
  };
}

async function verifyInsert(eventId) {
  console.log('\nVerificando registro inserido...');
  
  const { data, error } = await supabase
    .from('analytics_events')
    .select('*')
    .eq('id', eventId)
    .single();
  
  if (error) {
    console.log('❌ Erro ao verificar:', error.message);
    return false;
  }
  
  console.log('✅ Registro confirmado no banco!');
  console.log('Detalhes:', JSON.stringify(data, null, 2));
  return true;
}

async function main() {
  console.log('='.repeat(70));
  console.log('TESTE DO COLLECTOR - Supabase Analytics');
  console.log('='.repeat(70));
  console.log(`Timestamp: ${new Date().toISOString()}`);
  console.log(`Tabela: analytics_events`);
  console.log('='.repeat(70) + '\n');
  
  const result = await testCollectorEvent();
  
  if (result.success) {
    await verifyInsert(result.eventId);
    
    // Salvar relatório
    const report = {
      timestamp: new Date().toISOString(),
      test: 'collector_write',
      success: true,
      eventId: result.eventId,
      eventType: result.eventType,
      sessionId: result.sessionId,
      createdAt: result.createdAt,
      table: 'analytics_events',
      project: SUPABASE_URL
    };
    
    const reportPath = join(__dirname, `collector-test-report-${Date.now()}.json`);
    await writeFile(reportPath, JSON.stringify(report, null, 2));
    console.log(`\n📄 Relatório salvo: ${reportPath}`);
  }
  
  console.log('\n' + '='.repeat(70));
  console.log(result.success ? '✅ TESTE CONCLUÍDO COM SUCESSO' : '❌ TESTE FALHOU');
  console.log('='.repeat(70));
  
  return result;
}

main().catch(console.error);
