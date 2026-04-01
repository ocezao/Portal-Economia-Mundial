import { randomUUID } from 'crypto';

import type { NextRequest } from 'next/server';
import sharp from 'sharp';

import { requireEditorialRequest } from '@/lib/server/adminApi';
import { editorialError, editorialSuccess } from '@/lib/server/editorialHttp';
import { buildPublicUploadUrl, saveUploadedFile } from '@/lib/server/fileStorage';
import { logger } from '@/lib/logger';
import { escapeHtml, sanitizeFilename } from '@/lib/security';

export const runtime = 'nodejs';

const MAX_FILE_SIZE = 10 * 1024 * 1024;
const MAX_DIMENSION = 4096;
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/avif', 'image/svg+xml'];

export async function POST(request: NextRequest) {
  try {
    const auth = await requireEditorialRequest(request);
    if (!auth.ok) {
      return editorialError(auth.message, auth.status, { code: 'UNAUTHORIZED' });
    }

    const formData = await request.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return editorialError('Nenhum arquivo enviado', 400, { code: 'MISSING_FILE' });
    }

    const isSvgByExtension = file.name.toLowerCase().endsWith('.svg');
    if (!ALLOWED_TYPES.includes(file.type) && !isSvgByExtension) {
      return editorialError('Tipo de arquivo nao suportado. Use: JPEG, PNG, WebP, GIF, AVIF ou SVG', 400, {
        code: 'UNSUPPORTED_FILE_TYPE',
      });
    }

    if (file.size > MAX_FILE_SIZE) {
      return editorialError('Arquivo muito grande. Maximo: 10MB', 400, { code: 'FILE_TOO_LARGE' });
    }

    const rawWidth = Number.parseInt(String(formData.get('width') ?? ''), 10);
    const rawHeight = Number.parseInt(String(formData.get('height') ?? ''), 10);
    const rawQuality = Number.parseInt(String(formData.get('quality') ?? ''), 10);

    const width = Number.isFinite(rawWidth) && rawWidth > 0 ? Math.min(rawWidth, MAX_DIMENSION) : undefined;
    const height = Number.isFinite(rawHeight) && rawHeight > 0 ? Math.min(rawHeight, MAX_DIMENSION) : undefined;
    const quality = Number.isFinite(rawQuality) && rawQuality >= 1 && rawQuality <= 95 ? rawQuality : 85;
    const addWatermark = formData.get('watermark') === 'true';
    const keepMetadata = formData.get('keepMetadata') === 'true';

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
        return editorialError(
          'SVG com conteudo potencialmente inseguro. Remova scripts/eventos e tente novamente.',
          400,
          { code: 'UNSAFE_SVG' },
        );
      }

      const filename = `${randomUUID()}.svg`;
      await saveUploadedFile({ relativeDir: month, filename, buffer });
      const publicPath = `${month}/${filename}`;
      const sizeKb = `${(buffer.length / 1024).toFixed(2)} KB`;

      return editorialSuccess({
        file: {
          filename,
          url: buildPublicUploadUrl(publicPath),
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

    let pipeline = sharp(buffer);

    if (width || height) {
      pipeline = pipeline.resize(width, height, {
        fit: 'inside',
        withoutEnlargement: true,
      });
    }

    if (addWatermark) {
      const metadata = await sharp(buffer).metadata();
      const w = metadata.width ?? 1200;
      const h = metadata.height ?? 630;
      const svg = `
        <svg width="${w}" height="${h}">
          <text x="50%" y="90%" font-family="Arial"
                font-size="${Math.max(20, w / 40)}"
                fill="rgba(255,255,255,0.5)" text-anchor="middle">
            Cenario Internacional
          </text>
        </svg>
      `;
      pipeline = pipeline.composite([{ input: Buffer.from(svg), blend: 'over' }]);
    }

    if (keepMetadata) {
      pipeline = pipeline.withMetadata();
    }

    pipeline = pipeline.webp({
      quality,
      effort: 4,
    });

    const processedBuffer = await pipeline.toBuffer();
    const filename = `${randomUUID()}.webp`;
    await saveUploadedFile({ relativeDir: month, filename, buffer: processedBuffer });
    const publicPath = `${month}/${filename}`;

    const originalSize = buffer.length;
    const processedSize = processedBuffer.length;
    const reduction = ((originalSize - processedSize) / originalSize * 100).toFixed(1);

    return editorialSuccess({
      file: {
        filename,
        url: buildPublicUploadUrl(publicPath),
        originalName,
        originalSize: `${(originalSize / 1024).toFixed(2)} KB`,
        processedSize: `${(processedSize / 1024).toFixed(2)} KB`,
        reduction: `${reduction}%`,
        format: 'webp',
        metadata: {
          removed: !keepMetadata,
          hadGPS: hasGPS,
        },
      },
    });
  } catch (error) {
    logger.error('Erro no upload editorial:', error);
    return editorialError('Erro ao processar imagem', 500, { code: 'UPLOAD_PROCESSING_ERROR' });
  }
}
