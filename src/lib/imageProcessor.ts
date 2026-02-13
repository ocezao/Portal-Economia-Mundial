/**
 * Processador de Imagens com Sharp
 * - Converte para WebP
 * - Remove/Edita metadados EXIF
 * - Otimiza imagens para web
 */

import sharp from 'sharp';

export interface ImageProcessingOptions {
  // Conversão
  format?: 'webp' | 'jpeg' | 'jpg' | 'png' | 'avif';
  quality?: number; // 1-100 (padrão: 80)
  
  // Dimensões
  width?: number;
  height?: number;
  fit?: 'cover' | 'contain' | 'fill' | 'inside' | 'outside';
  
  // Metadados
  stripMetadata?: boolean; // Remove TODOS os metadados (GPS, câmera, etc)
  metadata?: {
    title?: string;
    description?: string;
    author?: string;
    copyright?: string;
    keywords?: string[];
  };
  
  // Otimização
  progressive?: boolean; // JPEG/PNG progressivo
  effort?: number; // 0-6, quanto maior = melhor compressão (mais lento)
}

/**
 * Processa uma imagem: converte formato, redimensiona, gerencia metadados
 */
export async function processImage(
  input: Buffer | string,
  options: ImageProcessingOptions = {}
): Promise<Buffer> {
  const {
    format = 'webp',
    quality = 80,
    width,
    height,
    fit = 'cover',
    stripMetadata = true,
    metadata,
    progressive = true,
    effort = 4,
  } = options;

  let pipeline = sharp(input);

  // Redimensiona se necessário
  if (width || height) {
    pipeline = pipeline.resize(width, height, { fit });
  }

  // Por padrão, o sharp remove metadados. Só preservamos se explicitamente solicitado.
  if (!stripMetadata && !metadata) {
    pipeline = pipeline.withMetadata();
  }

  // Converte para o formato desejado
  switch (format) {
    case 'webp':
      pipeline = pipeline.webp({ 
        quality, 
        effort,
      });
      break;
    case 'jpeg':
    case 'jpg':
      pipeline = pipeline.jpeg({ 
        quality, 
        progressive,
        mozjpeg: true, // Melhor compressão
      });
      break;
    case 'png':
      pipeline = pipeline.png({ 
        progressive,
        effort,
      });
      break;
    case 'avif':
      pipeline = pipeline.avif({ 
        quality, 
        effort,
      });
      break;
  }

  // Adiciona novos metadados personalizados (se especificado)
  if (metadata && !stripMetadata) {
    const exifData = buildExifMetadata(metadata);
    pipeline = pipeline.withMetadata({
      exif: exifData,
      icc: 'sRGB', // Perfil de cor padrão para web
    });
  }

  return await pipeline.toBuffer();
}

/**
 * Converte qualquer imagem para WebP otimizado
 * Remove todos os metadados sensíveis automaticamente
 */
export async function convertToWebP(
  input: Buffer | string,
  quality: number = 85
): Promise<Buffer> {
  return processImage(input, {
    format: 'webp',
    quality,
    stripMetadata: true, // Sempre remove metadados por segurança
    effort: 4, // Boa compressão sem ser muito lento
  });
}

/**
 * Gera múltiplas versões da imagem (responsivo)
 */
export async function generateResponsiveImages(
  input: Buffer | string,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _baseName: string
): Promise<{ [key: string]: Buffer }> {
  const sizes = [
    { name: 'thumbnail', width: 150, height: 150 },
    { name: 'small', width: 400 },
    { name: 'medium', width: 800 },
    { name: 'large', width: 1200 },
    { name: 'full', width: 1920 },
  ];

  const results: { [key: string]: Buffer } = {};

  for (const size of sizes) {
    results[size.name] = await processImage(input, {
      format: 'webp',
      width: size.width,
      height: size.height,
      fit: size.height ? 'cover' : 'inside',
      quality: size.name === 'thumbnail' ? 70 : 85,
      stripMetadata: true,
    });
  }

  return results;
}

/**
 * Verifica se a imagem contém metadados GPS (privacidade)
 */
export async function hasGPSMetadata(input: Buffer | string): Promise<boolean> {
  try {
    const metadata = await sharp(input).metadata();
    if (metadata.exif) {
      const exifString = metadata.exif.toString();
      return exifString.includes('GPS') || exifString.includes('gps');
    }
    return false;
  } catch {
    return false;
  }
}

/**
 * Extrai metadados da imagem para análise
 */
export async function extractMetadata(input: Buffer | string) {
  const metadata = await sharp(input).metadata();
  
  return {
    format: metadata.format,
    width: metadata.width,
    height: metadata.height,
    hasAlpha: metadata.hasAlpha,
    hasProfile: !!metadata.icc,
    exif: metadata.exif ? 'Presente' : 'Ausente',
    gps: await hasGPSMetadata(input),
    density: metadata.density,
    space: metadata.space,
    channels: metadata.channels,
  };
}

/**
 * Limpa completamente todos os metadados de uma imagem
 * Útil para uploads de usuários (privacidade)
 */
export async function sanitizeImage(input: Buffer | string): Promise<Buffer> {
  const buffer = Buffer.isBuffer(input) ? input : Buffer.from(input);
  
  return sharp(buffer)
    .rotate() // Auto-orienta baseado no EXIF
    .webp({ quality: 85, effort: 4 })
    .toBuffer();
}

/**
 * Adiciona watermark na imagem
 */
export async function addWatermark(
  input: Buffer | string,
  watermarkText: string = 'Cenario Internacional'
): Promise<Buffer> {
  const image = sharp(input);
  const metadata = await image.metadata();
  
  // Cria SVG do watermark
  const svg = `
    <svg width="${metadata.width}" height="${metadata.height}">
      <text 
        x="50%" 
        y="90%" 
        font-family="Arial" 
        font-size="${Math.max(20, (metadata.width || 800) / 40)}" 
        fill="rgba(255,255,255,0.5)"
        text-anchor="middle"
      >${watermarkText}</text>
    </svg>
  `;

  return image
    .composite([{
      input: Buffer.from(svg),
      blend: 'over'
    }])
    .webp({ quality: 85, effort: 4 })
    .toBuffer();
}

/**
 * Constrói metadados EXIF personalizados
 */
function buildExifMetadata(metadata: {
  title?: string;
  description?: string;
  author?: string;
  copyright?: string;
  keywords?: string[];
}) {
  // Retorna objeto simples que o Sharp converte para EXIF
  return {
    IFD0: {
      DocumentName: metadata.title || '',
      ImageDescription: metadata.description || '',
      Artist: metadata.author || '',
      Copyright: metadata.copyright || '',
      XPKeywords: metadata.keywords?.join('; ') || '',
    },
  };
}

/**
 * Compara tamanhos: original vs otimizado
 */
export async function compareCompression(
  input: Buffer
): Promise<{
  original: number;
  webp: number;
  jpeg: number;
  reduction: string;
}> {
  const original = input.length;
  
  const webpBuffer = await sharp(input)
    .webp({ quality: 85 })
    .toBuffer();
  
  const jpegBuffer = await sharp(input)
    .jpeg({ quality: 85, mozjpeg: true })
    .toBuffer();

  const reduction = ((original - webpBuffer.length) / original * 100).toFixed(1);

  return {
    original,
    webp: webpBuffer.length,
    jpeg: jpegBuffer.length,
    reduction: `${reduction}%`,
  };
}
