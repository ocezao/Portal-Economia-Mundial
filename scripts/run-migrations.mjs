#!/usr/bin/env node
/**
 * Script para executar migracoes SQL locais.
 * Requer psql ou execucao manual no banco local.
 */
import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

const migrations = [
  {
    file: '202502080001_add_performance_indexes.sql',
    description: 'Indices compostos para performance',
  },
  {
    file: '202502080002_add_comments_rls_policies.sql',
    description: 'Politicas de comentarios',
  },
  {
    file: '202502080003_add_rpc_functions.sql',
    description: 'Funcoes SQL otimizadas',
  },
  {
    file: '202502080004_fix_comments_schema.sql',
    description: 'Correcao de schema da tabela comments',
  },
];

console.log('MIGRACOES DO BANCO DE DADOS\n');
console.log('='.repeat(60));
console.log('\nINSTRUCOES:\n');
console.log('1. Acesse o banco local:');
console.log('   psql "$env:DATABASE_URL" -f <arquivo>\n');
console.log('2. Execute os seguintes arquivos na ordem:\n');

migrations.forEach((m, i) => {
  console.log(`   ${i + 1}. ${m.file}`);
  console.log(`      -> ${m.description}\n`);
});

console.log('='.repeat(60));
console.log('\nCONTEUDO DAS MIGRACOES:\n');

migrations.forEach((m, i) => {
  console.log(`\n${'-'.repeat(60)}`);
  console.log(`-- ${i + 1}. ${m.file}`);
  console.log(`${'-'.repeat(60)}\n`);

  try {
    const filepath = join(__dirname, '..', 'database', 'migrations', m.file);
    const content = readFileSync(filepath, 'utf-8');
    console.log(content);
  } catch (err) {
    console.error(`Erro ao ler ${m.file}:`, err.message);
  }
});

console.log('\n' + '='.repeat(60));
console.log('\nApos executar todas as migracoes, o banco local estara atualizado.\n');
console.log('Alternativa:');
console.log('   psql "$env:DATABASE_URL" -f database/migrations/<arquivo>.sql\n');
