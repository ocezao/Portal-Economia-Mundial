#!/usr/bin/env node
/**
 * Corrige o schema da tabela analytics_events para o formato esperado
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.scripts' });
dotenv.config(); // optionally load .env for local runs

const SUPABASE_URL = (process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || '').trim();
const SUPABASE_SERVICE_KEY = (process.env.SUPABASE_SERVICE_ROLE_KEY || '').trim();

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error('Missing env. Set SUPABASE_URL (or NEXT_PUBLIC_SUPABASE_URL) and SUPABASE_SERVICE_ROLE_KEY.');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

async function checkAndFixTable() {
  console.log('Verificando estrutura da tabela analytics_events...\n');
  
  // Tentar inserir um evento de teste com a estrutura atual
  try {
    const { data: columns, error: colError } = await supabase
      .from('analytics_events')
      .select('*')
      .limit(1);
    
    if (colError) {
      console.log('Erro ao verificar colunas:', colError.message);
    } else {
      console.log('Registro existente (para verificar schema):');
      console.log(columns);
    }
  } catch (e) {
    console.log('Não foi possível ler registros existentes');
  }
  
  // Verificar quais colunas existem tentando inserir com diferentes schemas
  console.log('\n--- Testando inserção com schema esperado ---');
  
  // Teste 1: Schema completo esperado
  const testEvent = {
    event_type: 'test_migration',
    event_data: { test: true, step: 'subagente_b' },
    session_id: `test-${Date.now()}`,
    page_url: 'https://cenariointernacional.com.br/test',
    referrer: 'setup-script',
    user_agent: 'SubagenteB/1.0',
    ip_address: '127.0.0.1'
  };
  
  const { data, error } = await supabase
    .from('analytics_events')
    .insert(testEvent)
    .select();
  
  if (error) {
    console.log('❌ Erro com schema completo:', error.message);
    console.log('\n--- Tentando schema alternativo (properties ao invés de event_data) ---');
    
    // Teste 2: Schema alternativo (properties)
    const testEventAlt = {
      event_type: 'test_migration',
      properties: { test: true, step: 'subagente_b' },
      session_id: `test-${Date.now()}`,
      page_url: 'https://cenariointernacional.com.br/test',
      referrer: 'setup-script',
      user_agent: 'SubagenteB/1.0',
      ip_address: '127.0.0.1'
    };
    
    const { data: data2, error: error2 } = await supabase
      .from('analytics_events')
      .insert(testEventAlt)
      .select();
    
    if (error2) {
      console.log('❌ Erro com schema alternativo:', error2.message);
      console.log('\n--- Tentando schema mínimo ---');
      
      // Teste 3: Schema mínimo
      const { data: data3, error: error3 } = await supabase
        .from('analytics_events')
        .insert({ event_type: 'test_migration' })
        .select();
      
      if (error3) {
        console.log('❌ Erro com schema mínimo:', error3.message);
        return { success: false, error: error3 };
      } else {
        console.log('✅ Sucesso com schema mínimo!');
        console.log('Registro:', data3);
        return { success: true, schema: 'minimal', data: data3 };
      }
    } else {
      console.log('✅ Sucesso com schema alternativo (properties)!');
      console.log('Registro:', data2);
      return { success: true, schema: 'properties', data: data2 };
    }
  } else {
    console.log('✅ Sucesso com schema completo (event_data)!');
    console.log('Registro:', data);
    return { success: true, schema: 'complete', data };
  }
}

async function main() {
  console.log('='.repeat(60));
  console.log('FIX ANALYTICS TABLE - Subagente B');
  console.log('='.repeat(60));
  
  const result = await checkAndFixTable();
  
  console.log('\n' + '='.repeat(60));
  console.log('RESULTADO:');
  console.log('='.repeat(60));
  
  if (result.success) {
    console.log(`✅ Tabela funcionando com schema: ${result.schema}`);
    
    if (result.schema === 'properties') {
      console.log('\n📋 SQL para adicionar coluna event_data (opcional):');
      console.log(`
ALTER TABLE analytics_events 
ADD COLUMN IF NOT EXISTS event_data JSONB DEFAULT '{}'::jsonb;
      `);
    }
  } else {
    console.log('❌ Tabela não está funcionando corretamente');
    console.log('Verifique o schema no dashboard do Supabase');
  }
  
  return result;
}

main().catch(console.error);
