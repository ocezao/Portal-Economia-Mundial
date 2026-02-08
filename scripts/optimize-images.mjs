#!/usr/bin/env node
/**
 * Script de Otimização de Imagens
 * 
 * Converte e otimiza imagens para WebP com tamanhos reduzidos
 * Uso: npm run optimize-images
 */

import { promises as fs } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import sharp from 'sharp';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const CONFIG = {
  inputDir: path.join(process.cwd(), 'public/images/news'),
  outputDir: path.join(process.cwd(), 'public/images/news'),
  maxWidth: 800,
  maxHeight: 600,
  quality: 80,
  maxFileSize: 200 * 1024, // 200KB
  formats: ['.jpg', '.jpeg', '.png', '.gif', '.bmp', '.tiff'],
};

async function getImageDimensions(inputPath) {
  const metadata = await sharp(inputPath).metadata();
  return { width: metadata.width, height: metadata.height };
}

async function calculateTargetDimensions(width, height) {
  const aspectRatio = width / height;
  
  let targetWidth = width;
  let targetHeight = height;
  
  if (width > CONFIG.maxWidth) {
    targetWidth = CONFIG.maxWidth;
    targetHeight = Math.round(targetWidth / aspectRatio);
  }
  
  if (targetHeight > CONFIG.maxHeight) {
    targetHeight = CONFIG.maxHeight;
    targetWidth = Math.round(targetHeight * aspectRatio);
  }
  
  return { width: targetWidth, height: targetHeight };
}

async function optimizeImage(inputPath, outputPath) {
  const { width, height } = await getImageDimensions(inputPath);
  const targetDims = await calculateTargetDimensions(width, height);
  
  let quality = CONFIG.quality;
  let outputBuffer;
  
  // Tenta diferentes qualidades até ficar abaixo do tamanho máximo
  do {
    outputBuffer = await sharp(inputPath)
      .resize(targetDims.width, targetDims.height, {
        fit: 'inside',
        withoutEnlargement: true,
      })
      .webp({ 
        quality,
        effort: 6,
        smartSubsample: true,
        reductionEffort: 6,
      })
      .toBuffer();
    
    if (outputBuffer.length <= CONFIG.maxFileSize || quality <= 50) {
      break;
    }
    
    quality -= 5;
  } while (quality > 50);
  
  await fs.writeFile(outputPath, outputBuffer);
  
  const originalStats = await fs.stat(inputPath);
  const newStats = await fs.stat(outputPath);
  
  const reduction = ((originalStats.size - newStats.size) / originalStats.size * 100).toFixed(1);
  
  return {
    originalSize: (originalStats.size / 1024 / 1024).toFixed(2),
    newSize: (newStats.size / 1024).toFixed(2),
    reduction,
    quality,
    dimensions: `${targetDims.width}x${targetDims.height}`,
  };
}

async function processDirectory(dir) {
  const files = await fs.readdir(dir);
  const imageFiles = files.filter(file => {
    const ext = path.extname(file).toLowerCase();
    return CONFIG.formats.includes(ext);
  });
  
  if (imageFiles.length === 0) {
    console.log('ℹ️ Nenhuma imagem para otimizar encontrada em:', dir);
    return;
  }
  
  console.log(`\n🖼️  Encontradas ${imageFiles.length} imagens para otimizar\n`);
  
  const results = [];
  
  for (const file of imageFiles) {
    const inputPath = path.join(dir, file);
    const outputFilename = `${path.parse(file).name}.webp`;
    const outputPath = path.join(CONFIG.outputDir, outputFilename);
    
    try {
      process.stdout.write(`⏳ Otimizando ${file}... `);
      const result = await optimizeImage(inputPath, outputPath);
      results.push({ file, outputFilename, ...result });
      console.log(`✅ ${result.newSize}KB (${result.reduction}% menor, Q:${result.quality})`);
    } catch (error) {
      console.log(`❌ Erro: ${error.message}`);
    }
  }
  
  // Summary
  console.log('\n' + '='.repeat(60));
  console.log('📊 RESUMO DA OTIMIZAÇÃO');
  console.log('='.repeat(60));
  
  let totalOriginal = 0;
  let totalNew = 0;
  
  results.forEach(r => {
    totalOriginal += parseFloat(r.originalSize);
    totalNew += parseFloat(r.newSize) / 1024; // Convert KB to MB
    console.log(`✓ ${r.outputFilename}: ${r.originalSize}MB → ${r.newSize}KB (${r.reduction}% redução)`);
  });
  
  const totalReduction = ((totalOriginal - totalNew) / totalOriginal * 100).toFixed(1);
  console.log('\n' + '-'.repeat(60));
  console.log(`📦 Total original: ${totalOriginal.toFixed(2)} MB`);
  console.log(`📦 Total otimizado: ${(totalNew * 1024).toFixed(2)} KB`);
  console.log(`🎯 Economia total: ${totalReduction}%`);
  console.log('='.repeat(60) + '\n');
  
  return results;
}

async function checkExistingWebP(dir) {
  const files = await fs.readdir(dir);
  const webpFiles = files.filter(file => path.extname(file).toLowerCase() === '.webp');
  
  console.log(`\n🔍 Verificando imagens WebP existentes...`);
  
  const largeWebP = [];
  
  for (const file of webpFiles) {
    const filePath = path.join(dir, file);
    const stats = await fs.stat(filePath);
    const sizeKB = (stats.size / 1024).toFixed(2);
    
    if (stats.size > CONFIG.maxFileSize) {
      largeWebP.push({ file, size: sizeKB });
    }
  }
  
  if (largeWebP.length > 0) {
    console.log(`⚠️  ${largeWebP.length} imagens WebP estão acima de ${CONFIG.maxFileSize / 1024}KB:`);
    largeWebP.forEach(({ file, size }) => {
      console.log(`   - ${file}: ${size}KB`);
    });
    console.log('💡 Execute: npm run optimize-images para reprocessar\n');
  } else {
    console.log('✅ Todas as imagens WebP estão dentro do limite de tamanho\n');
  }
}

// Main
async function main() {
  const args = process.argv.slice(2);
  const command = args[0];
  
  console.log('\n🚀 Otimizador de Imagens PEM\n');
  
  try {
    // Ensure output directory exists
    await fs.mkdir(CONFIG.outputDir, { recursive: true });
    
    if (command === '--check' || command === '-c') {
      await checkExistingWebP(CONFIG.outputDir);
    } else {
      await processDirectory(CONFIG.inputDir);
    }
  } catch (error) {
    console.error('❌ Erro:', error.message);
    process.exit(1);
  }
}

main();
