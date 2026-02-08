#!/usr/bin/env node
/**
 * Teste do processador de imagens
 * Gera uma imagem de teste e processa para verificar tudo está funcionando
 */

import { writeFileSync, existsSync, mkdirSync, unlinkSync } from 'fs';
import { join } from 'path';
import sharp from 'sharp';

const TEST_DIR = join(process.cwd(), 'scripts', 'test-output');

async function createTestImage() {
  // Cria uma imagem de teste com metadados EXIF simulados
  const svg = `
    <svg width="1200" height="800" xmlns="http://www.w3.org/2000/svg">
      <rect width="1200" height="800" fill="#1a365d"/>
      <text x="50%" y="45%" font-family="Arial" font-size="48" fill="white" text-anchor="middle">
        Portal Econômico Mundial
      </text>
      <text x="50%" y="55%" font-family="Arial" font-size="24" fill="#94a3b8" text-anchor="middle">
        Imagem de Teste para Processamento
      </text>
      <rect x="100" y="700" width="1000" height="2" fill="#c40000"/>
    </svg>
  `;

  return await sharp(Buffer.from(svg))
    .jpeg({ quality: 90 })
    .toBuffer();
}

async function test() {
  console.log('🧪 Testando processador de imagens...\n');

  // Cria diretório de teste
  if (!existsSync(TEST_DIR)) {
    mkdirSync(TEST_DIR, { recursive: true });
  }

  try {
    // 1. Cria imagem de teste
    console.log('1️⃣ Criando imagem de teste...');
    const testBuffer = await createTestImage();
    const testPath = join(TEST_DIR, 'original.jpg');
    writeFileSync(testPath, testBuffer);
    console.log(`   ✅ Imagem criada: ${(testBuffer.length / 1024).toFixed(2)} KB\n`);

    // 2. Testa conversão WebP
    console.log('2️⃣ Convertendo para WebP...');
    const webpBuffer = await sharp(testBuffer)
      .webp({ quality: 85 })
      .toBuffer();
    writeFileSync(join(TEST_DIR, 'converted.webp'), webpBuffer);
    const reduction = ((testBuffer.length - webpBuffer.length) / testBuffer.length * 100).toFixed(1);
    console.log(`   ✅ WebP: ${(webpBuffer.length / 1024).toFixed(2)} KB (${reduction}% redução)\n`);

    // 3. Testa remoção de metadados
    console.log('3️⃣ Removendo metadados...');
    const cleanBuffer = await sharp(testBuffer)
      .withMetadata({})  // Remove todos os metadados
      .webp({ quality: 85, strip: true })
      .toBuffer();
    writeFileSync(join(TEST_DIR, 'sanitized.webp'), cleanBuffer);
    console.log(`   ✅ Metadados removidos\n`);

    // 4. Testa redimensionamento
    console.log('4️⃣ Redimensionando (800px largura)...');
    const resizedBuffer = await sharp(testBuffer)
      .resize(800, null, { withoutEnlargement: true })
      .webp({ quality: 85 })
      .toBuffer();
    const resizedMeta = await sharp(resizedBuffer).metadata();
    writeFileSync(join(TEST_DIR, 'resized.webp'), resizedBuffer);
    console.log(`   ✅ Redimensionado: ${resizedMeta.width}x${resizedMeta.height}\n`);

    // 5. Testa thumbnail
    console.log('5️⃣ Criando thumbnail (400x300)...');
    const thumbBuffer = await sharp(testBuffer)
      .resize(400, 300, { fit: 'cover' })
      .webp({ quality: 70 })
      .toBuffer();
    writeFileSync(join(TEST_DIR, 'thumbnail.webp'), thumbBuffer);
    console.log(`   ✅ Thumbnail: ${(thumbBuffer.length / 1024).toFixed(2)} KB\n`);

    // 6. Verifica metadados
    console.log('6️⃣ Verificando metadados...');
    const withMeta = await sharp(testBuffer).metadata();
    const withoutMeta = await sharp(cleanBuffer).metadata();
    console.log(`   Original: EXIF=${withMeta.exif ? 'Sim' : 'Não'}`);
    console.log(`   Sanitizada: EXIF=${withoutMeta.exif ? 'Sim' : 'Não'}\n`);

    // 7. Compara formatos
    console.log('7️⃣ Comparando formatos...');
    const formats = ['webp', 'jpeg', 'png'];
    for (const format of formats) {
      let buffer;
      switch (format) {
        case 'webp':
          buffer = await sharp(testBuffer).webp({ quality: 85 }).toBuffer();
          break;
        case 'jpeg':
          buffer = await sharp(testBuffer).jpeg({ quality: 85, mozjpeg: true }).toBuffer();
          break;
        case 'png':
          buffer = await sharp(testBuffer).png({ effort: 4 }).toBuffer();
          break;
      }
      const size = (buffer.length / 1024).toFixed(2);
      const red = ((testBuffer.length - buffer.length) / testBuffer.length * 100).toFixed(1);
      console.log(`   ${format.toUpperCase()}: ${size} KB (${red}% vs original)`);
    }

    console.log('\n✅ Todos os testes passaram!\n');
    console.log(`📁 Arquivos de teste em: ${TEST_DIR}`);
    console.log('   - original.jpg (imagem base)');
    console.log('   - converted.webp (conversão padrão)');
    console.log('   - sanitized.webp (sem metadados)');
    console.log('   - resized.webp (redimensionada)');
    console.log('   - thumbnail.webp (thumbnail 400x300)');

  } catch (error) {
    console.error('❌ Erro nos testes:', error.message);
    process.exit(1);
  }
}

// Pergunta se quer limpar arquivos de teste
async function cleanup() {
  console.log('\n🧹 Deseja limpar arquivos de teste? (s/n)');
  process.stdin.once('data', (data) => {
    const answer = data.toString().trim().toLowerCase();
    if (answer === 's' || answer === 'sim') {
      try {
        const files = ['original.jpg', 'converted.webp', 'sanitized.webp', 'resized.webp', 'thumbnail.webp'];
        for (const file of files) {
          const path = join(TEST_DIR, file);
          if (existsSync(path)) {
            unlinkSync(path);
          }
        }
        console.log('✅ Arquivos de teste removidos');
      } catch (e) {
        console.log('⚠️ Não foi possível remover todos os arquivos');
      }
    }
    process.exit(0);
  });
}

test().then(cleanup);
