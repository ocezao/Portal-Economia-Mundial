/**
 * API Route para upload de imagens processadas
 * POST /api/upload
 */

import { randomUUID } from 'crypto';

import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import sharp from 'sharp';

import { requireAdminRequest } from '@/lib/server/adminApi';
import { buildPublicUploadUrl, saveUploadedFile } from '@/lib/server/fileStorage';
import { logger } from '@/lib/logger';
import { escapeHtml, sanitizeFilename } from '@/lib/security';

export const runtime = 'nodejs';

const MAX_FILE_SIZE = 10 * 1024 * 1024;
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/avif', 'image/svg+xml'];
const MAX_DIMENSION = 4096;

const rl = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT_WINDOW_MS = 60_000;
const RATE_LIMIT_MAX = 30;

interface UploadOptions {
  width?: number;
  height?: number;
  quality?: number;
  addWatermark?: boolean;
  keepMetadata?: boolean;
}

export async function POST(request: NextRequest) {
  try {
    const ip =
      request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
      request.headers.get('x-real-ip') ||
      'unknown';

    const now = Date.now();
    const bucket = rl.get(ip);
    if (!bucket || bucket.resetAt <= now) {
      rl.set(ip, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS });
    } else {
      bucket.count += 1;
      if (bucket.count > RATE_LIMIT_MAX) {
        return NextResponse.json({ error: 'Muitas requisicoes. Tente novamente em instantes.' }, { status: 429 });
      }
    }

    const auth = await requireAdminRequest(request);
    if (!auth.ok) {
      return NextResponse.json({ error: auth.message }, { status: auth.status });
    }

    const formData = await request.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json({ error: 'Nenhum arquivo enviado' }, { status: 400 });
    }

    const isSvgByExtension = file.name.toLowerCase().endsWith('.svg');
    if (!ALLOWED_TYPES.includes(file.type) && !isSvgByExtension) {
      return NextResponse.json(
        { error: 'Tipo de arquivo nao suportado. Use: JPEG, PNG, WebP, GIF, AVIF ou SVG' },
        { status: 400 },
      );
    }

    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json({ error: 'Arquivo muito grande. Maximo: 10MB' }, { status: 400 });
    }

    const rawWidth = Number.parseInt(String(formData.get('width') ?? ''), 10);
    const rawHeight = Number.parseInt(String(formData.get('height') ?? ''), 10);
    const rawQuality = Number.parseInt(String(formData.get('quality') ?? ''), 10);

    const options: UploadOptions = {
      width: Number.isFinite(rawWidth) && rawWidth > 0 ? Math.min(rawWidth, MAX_DIMENSION) : undefined,
      height: Number.isFinite(rawHeight) && rawHeight > 0 ? Math.min(rawHeight, MAX_DIMENSION) : undefined,
      quality: Number.isFinite(rawQuality) && rawQuality >= 1 && rawQuality <= 95 ? rawQuality : 85,
      addWatermark: formData.get('watermark') === 'true',
      keepMetadata: formData.get('keepMetadata') === 'true',
    };

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const month = new Date().toISOString().slice(0, 7).replace('-', '/');
    const originalName = escapeHtml(sanitizeFilename(file.name));
    const isVector = file.type === 'image/svg+xml' || isSvgByExtension;

    if (isVector) {
      const svgText = buffer.toString('utf8');
      const hasUnsafeSvg =
        /<script[\s>]/i.test(svgText) ||
        /\son\w+\s*=/i.test(svgText) ||
        /javascript:/i.test(svgText) ||
        /<foreignObject[\s>]/i.test(svgText) ||
        /<!ENTITY/i.test(svgText);

      if (hasUnsafeSvg) {
        return NextResponse.json(
          { error: 'SVG com conteudo potencialmente inseguro. Remova scripts/eventos e tente novamente.' },
          { status: 400 },
        );
      }

      const filename = `${randomUUID()}.svg`;
      await saveUploadedFile({ relativeDir: month, filename, buffer });
      const relativePath = `${month}/${filename}`;
      const sizeKb = `${(buffer.length / 1024).toFixed(2)} KB`;

      return NextResponse.json({
        success: true,
        file: {
          filename,
          url: buildPublicUploadUrl(relativePath),
          originalName,
          originalSize: sizeKb,
          processedSize: sizeKb,
          reduction: '0.0%',
          format: 'svg',
          metadata: {
            removed: false,
            hadGPS: false,
          },
        },
      });
    }

    const originalMetadata = await sharp(buffer).metadata();
    const hasGPS = originalMetadata.exif?.toString().includes('GPS') || false;

    if (hasGPS) {
      logger.warn('Imagem contem dados GPS - serao removidos');
    }

    let pipeline = sharp(buffer);

    if (options.width || options.height) {
      pipeline = pipeline.resize(options.width, options.height, {
        fit: 'inside',
        withoutEnlargement: true,
      });
    }

    if (options.addWatermark) {
      const metadata = await sharp(buffer).metadata();
      const widthValue = metadata.width ?? 1200;
      const heightValue = metadata.height ?? 630;
      const svg = `
        <svg width="${widthValue}" height="${heightValue}">
          <text x="50%" y="90%" font-family="Arial"
                font-size="${Math.max(20, widthValue / 40)}"
                fill="rgba(255,255,255,0.5)" text-anchor="middle">
            Cenario Internacional
          </text>
        </svg>
      `;
      pipeline = pipeline.composite([{ input: Buffer.from(svg), blend: 'over' }]);
    }

    if (options.keepMetadata) {
      pipeline = pipeline.withMetadata();
    }

    pipeline = pipeline.webp({
      quality: options.quality,
      effort: 4,
    });

    const processedBuffer = await pipeline.toBuffer();
    const filename = `${randomUUID()}.webp`;
    await saveUploadedFile({ relativeDir: month, filename, buffer: processedBuffer });
    const relativePath = `${month}/${filename}`;

    const originalSize = buffer.length;
    const processedSize = processedBuffer.length;
    const reduction = ((originalSize - processedSize) / originalSize * 100).toFixed(1);

    return NextResponse.json({
      success: true,
      file: {
        filename,
        url: buildPublicUploadUrl(relativePath),
        originalName,
        originalSize: `${(originalSize / 1024).toFixed(2)} KB`,
        processedSize: `${(processedSize / 1024).toFixed(2)} KB`,
        reduction: `${reduction}%`,
        format: 'webp',
        metadata: {
          removed: !options.keepMetadata,
          hadGPS: hasGPS,
        },
      },
    });
  } catch (error) {
    logger.error('Erro no upload:', error);
    return NextResponse.json({ error: 'Erro ao processar imagem' }, { status: 500 });
  }
}
