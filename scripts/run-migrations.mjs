#!/usr/bin/env node
/**
 * Script para executar migrações SQL no Supabase
 * Requer Supabase CLI ou execução manual no Dashboard
 */
import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

const migrations = [
  {
    file: '202502080001_add_performance_indexes.sql',
    description: 'Índices compostos para performance'
  },
  {
    file: '202502080002_add_comments_rls_policies.sql',
    description: 'Políticas RLS para comentários'
  },
  {
    file: '202502080003_add_rpc_functions.sql',
    description: 'Funções RPC otimizadas'
  },
  {
    file: '202502080004_fix_comments_schema.sql',
    description: 'Correção de schema da tabela comments'
  }
];

console.log('🚀 MIGRAÇÕES DO BANCO DE DADOS\n');
console.log('═'.repeat(60));
console.log('\n📋 INSTRUÇÕES:\n');
console.log('1. Acesse o Supabase Dashboard:');
console.log('   https://app.supabase.com/project/aszrihpepmdwmggoqirw/sql\n');
console.log('2. Execute os seguintes arquivos NA ORDEM:\n');

migrations.forEach((m, i) => {
  console.log(`   ${i + 1}. ${m.file}`);
  console.log(`      └─ ${m.description}\n`);
});

console.log('═'.repeat(60));
console.log('\n📄 CONTEÚDO DAS MIGRAÇÕES:\n');

migrations.forEach((m, i) => {
  console.log(`\n${'─'.repeat(60)}`);
  console.log(`-- ${i + 1}. ${m.file}`);
  console.log(`${'─'.repeat(60)}\n`);
  
  try {
    const filepath = join(__dirname, '..', 'supabase', 'migrations', m.file);
    const content = readFileSync(filepath, 'utf-8');
    console.log(content);
  } catch (err) {
    console.error(`Erro ao ler ${m.file}:`, err.message);
  }
});

console.log('\n' + '═'.repeat(60));
console.log('\n✅ Após executar todas as migrações, o banco estará otimizado!\n');
console.log('💡 Alternativa: Use o Supabase CLI:');
console.log('   supabase db push\n');
