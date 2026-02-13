#!/usr/bin/env node
/**
 * Script CLI para processamento de imagens
 * Uso: node scripts/process-image.mjs <caminho-da-imagem> [opções]
 * 
 * Exemplos:
 *   node scripts/process-image.mjs foto.jpg
 *   node scripts/process-image.mjs foto.jpg --format webp --quality 90
 *   node scripts/process-image.mjs foto.jpg --strip-metadata --width 800
 *   node scripts/process-image.mjs foto.jpg --sanitize (remove tudo)
 */

import { readFileSync, writeFileSync, existsSync } from 'fs';
import { resolve, dirname, basename, extname } from 'path';
import sharp from 'sharp';

const args = process.argv.slice(2);

function showHelp() {
  console.log(`
🖼️  Processador de Imagens - CIN

Uso: node scripts/process-image.mjs <arquivo> [opções]

Opções:
  --format <webp|jpeg|png|avif>  Formato de saída (padrão: webp)
  --quality <1-100>              Qualidade (padrão: 85)
  --width <px>                   Largura máxima
  --height <px>                  Altura máxima
  --strip-metadata               Remove todos os metadados EXIF
  --sanitize                     Modo sanitização completa (privacidade máxima)
  --watermark <texto>            Adiciona watermark
  --output <caminho>             Caminho de saída
  --info                         Mostra metadados da imagem
  --compare                      Compara tamanhos (original vs otimizado)
  --help                         Mostra esta ajuda

Exemplos:
  # Converter para WebP
  node scripts/process-image.mjs foto.jpg

  # Remover metadados GPS/privados
  node scripts/process-image.mjs foto.jpg --strip-metadata

  # Criar thumbnail
  node scripts/process-image.mjs foto.jpg --width 400 --height 300

  # Sanitizar imagem de usuário (remove tudo)
  node scripts/process-image.mjs upload.jpg --sanitize

  # Ver metadados
  node scripts/process-image.mjs foto.jpg --info
`);
  process.exit(0);
}

if (args.length === 0 || args.includes('--help')) {
  showHelp();
}

const inputPath = resolve(args[0]);

if (!existsSync(inputPath)) {
  console.error(`❌ Arquivo não encontrado: ${inputPath}`);
  process.exit(1);
}

// Parse arguments
const options = {
  format: 'webp',
  quality: 85,
  stripMetadata: args.includes('--strip-metadata') || args.includes('--sanitize'),
  width: null,
  height: null,
  watermark: null,
  output: null,
} };

for (let i = 1; i < args.length; i++) {
  switch (args[i]) {
    case '--format':
      options.format = args[++i];
      break;
    case '--quality':
      options.quality = parseInt(args[++i]);
      break;
    case '--width':
      options.width = parseInt(args[++i]);
      break;
    case '--height':
      options.height = parseInt(args[++i]);
      break;
    case '--watermark':
      options.watermark = args[++i];
      break;
    case '--output':
      options.output = args[++i];
      break;
  }
}

async function main() {
  console.log(`\n🖼️  Processando: ${basename(inputPath)}\n`);

  // Modo info
  if (args.includes('--info')) {
    const metadata = await sharp(inputPath).metadata();
    console.log('📊 Metadados da imagem:');
    console.log(`   Formato: ${metadata.format}`);
    console.log(`   Dimensões: ${metadata.width}x${metadata.height}`);
    console.log(`   Canais: ${metadata.channels}`);
    console.log(`   Espaço de cor: ${metadata.space}`);
    console.log(`   EXIF: ${metadata.exif ? 'Presente' : 'Ausente'}`);
    console.log(`   ICC Profile: ${metadata.icc ? 'Presente' : 'Ausente'}`);
    console.log(`   Densidade: ${metadata.density || 'N/A'} DPI`);
    
    // Verifica GPS
    if (metadata.exif) {
      const exifStr = metadata.exif.toString();
      const hasGPS = exifStr.includes('GPS') || exifStr.includes('gps');
      console.log(`   GPS: ${hasGPS ? '⚠️  PRESENTE (risco de privacidade!)' : 'Não encontrado'}`);
    }
    
    const stats = readFileSync(inputPath);
    console.log(`   Tamanho: ${(stats.length / 1024).toFixed(2)} KB\n`);
    return;
  }

  // Modo comparação
  if (args.includes('--compare')) {
    const original = readFileSync(inputPath);
    
    console.log('📊 Comparando compressão...\n');
    console.log(`   Original: ${(original.length / 1024).toFixed(2)} KB`);

    const webp = await sharp(original).webp({ quality: 85 }).toBuffer();
    console.log(`   WebP (85%): ${(webp.length / 1024).toFixed(2)} KB (${((1 - webp.length/original.length) * 100).toFixed(1)}% menor)`);

    const jpeg = await sharp(original).jpeg({ quality: 85, mozjpeg: true }).toBuffer();
    console.log(`   JPEG (85%): ${(jpeg.length / 1024).toFixed(2)} KB (${((1 - jpeg.length/original.length) * 100).toFixed(1)}% menor)`);

    const webp90 = await sharp(original).webp({ quality: 90 }).toBuffer();
    console.log(`   WebP (90%): ${(webp90.length / 1024).toFixed(2)} KB (${((1 - webp90.length/original.length) * 100).toFixed(1)}% menor)`);

    console.log('');
    return;
  }

  // Processamento normal
  const inputBuffer = readFileSync(inputPath);
  let pipeline = sharp(inputBuffer);

  // Redimensiona
  if (options.width || options.height) {
    pipeline = pipeline.resize(options.width, options.height, { 
      fit: 'inside',
      withoutEnlargement: true 
    });
  }

  // Watermark
  if (options.watermark) {
    const metadata = await sharp(inputPath).metadata();
    const svg = `
      <svg width="${metadata.width}" height="${metadata.height}">
        <text x="50%" y="90%" font-family="Arial" 
              font-size="${Math.max(20, metadata.width / 40)}" 
              fill="rgba(255,255,255,0.5)" text-anchor="middle">
          ${options.watermark}
        </text>
      </svg>
    `;
    pipeline = pipeline.composite([{ input: Buffer.from(svg), blend: 'over' }]);
  }

  // Remove metadados
  if (options.stripMetadata) {
    pipeline = pipeline.withMetadata({});
  }

  // Converte formato
  const format = options.format;
  switch (format) {
    case 'webp':
      pipeline = pipeline.webp({ quality: options.quality, strip: options.stripMetadata });
      break;
    case 'jpeg':
    case 'jpg':
      pipeline = pipeline.jpeg({ quality: options.quality, mozjpeg: true, strip: options.stripMetadata });
      break;
    case 'png':
      pipeline = pipeline.png({ effort: 4, strip: options.stripMetadata });
      break;
    case 'avif':
      pipeline = pipeline.avif({ quality: options.quality, effort: 4, strip: options.stripMetadata });
      break;
  }

  const outputBuffer = await pipeline.toBuffer();

  // Determina caminho de saída
  const outputPath = options.output || inputPath.replace(
    extname(inputPath), 
    `-${format}.${format === 'jpeg' ? 'jpg' : format}`
  );

  writeFileSync(outputPath, outputBuffer);

  // Relatório
  const originalSize = inputBuffer.length;
  const newSize = outputBuffer.length;
  const reduction = ((originalSize - newSize) / originalSize * 100).toFixed(1);

  console.log('✅ Imagem processada com sucesso!\n');
  console.log(`   📁 Entrada:  ${inputPath}`);
  console.log(`   💾 Saída:    ${outputPath}`);
  console.log(`   📐 Tamanho:  ${(originalSize / 1024).toFixed(2)} KB → ${(newSize / 1024).toFixed(2)} KB`);
  console.log(`   📉 Redução:  ${reduction}%\n`);

  if (args.includes('--sanitize')) {
    console.log('🔒 Metadados removidos para privacidade\n');
  }
}

main().catch(err => {
  console.error('❌ Erro:', err.message);
  process.exit(1);
});
