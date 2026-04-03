import { randomUUID } from 'crypto';

import type { NextRequest } from 'next/server';
import sharp from 'sharp';

import { requireEditorialRequest, slugifyText } from '@/lib/server/adminApi';
import { registerEditorialAsset, updateEditorialAssetMetadata } from '@/lib/server/editorialAssetStore';
import { editorialError, editorialSuccess } from '@/lib/server/editorialHttp';
import { buildPublicUploadUrl, saveUploadedFile } from '@/lib/server/fileStorage';
import { logger } from '@/lib/logger';
import { escapeHtml, sanitizeFilename } from '@/lib/security';

export const runtime = 'nodejs';

const MAX_FILE_SIZE = 10 * 1024 * 1024;
const MAX_DIMENSION = 4096;
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/avif', 'image/svg+xml'];

function parseBoolean(value: FormDataEntryValue | string | null | undefined) {
  return String(value ?? '').toLowerCase() === 'true';
}

function parseInteger(value: FormDataEntryValue | string | null | undefined) {
  const parsed = Number.parseInt(String(value ?? ''), 10);
  return Number.isFinite(parsed) ? parsed : undefined;
}

function normalizeBase64Payload(raw: string) {
  const trimmed = raw.trim();
  const match = /^data:([^;]+);base64,(.+)$/i.exec(trimmed);
  if (match) {
    return {
      mimeType: match[1],
      base64: match[2],
    };
  }

  return {
    mimeType: undefined,
    base64: trimmed,
  };
}

function buildStoredFilename(originalName: string, extension: string) {
  const sanitized = sanitizeFilename(originalName);
  const basename = sanitized.replace(/\.[^.]+$/, '');
  const slug = slugifyText(basename).replace(/^-+|-+$/g, '').slice(0, 72) || 'imagem-editorial';
  const suffix = randomUUID().slice(0, 8);
  return `${slug}-${suffix}.${extension.replace(/^\./, '')}`;
}

async function buildAssetResponse(input: {
  relativePath: string;
  filename: string;
  originalName: string;
  originalSizeBytes: number;
  processedBuffer: Buffer;
  format: string;
  mimeType: string;
  metadata: {
    removed: boolean;
    hadGPS: boolean;
  };
  width?: number | null;
  height?: number | null;
  sourceType?: string | null;
  sourceUrl?: string | null;
  titleText?: string | null;
  altText?: string | null;
  caption?: string | null;
  creditText?: string | null;
  focusKeywords?: string[];
  promptText?: string | null;
  createdBy?: string | null;
}) {
  const publicUrl = buildPublicUploadUrl(input.relativePath);
  const processedSize = input.processedBuffer.length;
  const reduction = input.originalSizeBytes > 0
    ? ((input.originalSizeBytes - processedSize) / input.originalSizeBytes * 100).toFixed(1)
    : '0.0';

  const asset = await registerEditorialAsset({
    storagePath: input.relativePath,
    publicUrl,
    originalName: input.originalName,
    mimeType: input.mimeType,
    sizeBytes: processedSize,
    width: input.width ?? null,
    height: input.height ?? null,
    format: input.format,
    sourceType: input.sourceType ?? 'upload',
    sourceUrl: input.sourceUrl ?? null,
    titleText: input.titleText ?? null,
    altText: input.altText ?? null,
    caption: input.caption ?? null,
    creditText: input.creditText ?? null,
    focusKeywords: input.focusKeywords ?? [],
    promptText: input.promptText ?? null,
    metadata: input.metadata,
    createdBy: input.createdBy ?? null,
  });

  return {
    asset,
    file: {
      filename: input.filename,
      url: publicUrl,
      originalName: input.originalName,
      originalSize: `${(input.originalSizeBytes / 1024).toFixed(2)} KB`,
      processedSize: `${(processedSize / 1024).toFixed(2)} KB`,
      reduction: `${reduction}%`,
      format: input.format,
      metadata: input.metadata,
    },
  };
}

export async function POST(request: NextRequest) {
  try {
    const auth = await requireEditorialRequest(request);
    if (!auth.ok) {
      return editorialError(auth.message, auth.status, { code: 'UNAUTHORIZED' });
    }

    const month = new Date().toISOString().slice(0, 7).replace('-', '/');
    const contentType = request.headers.get('content-type')?.toLowerCase() ?? '';

    if (contentType.includes('application/json')) {
      let payload: {
        filename?: string;
        contentType?: string;
        base64?: string;
        width?: number;
        height?: number;
        quality?: number;
        watermark?: boolean;
        keepMetadata?: boolean;
        sourceType?: string;
        sourceUrl?: string;
        titleText?: string;
        altText?: string;
        caption?: string;
        creditText?: string;
        focusKeywords?: string[];
        promptText?: string;
      };

      try {
        const rawBody = await request.text();
        payload = JSON.parse(rawBody) as typeof payload;
      } catch {
        return editorialError('Corpo JSON invalido para upload editorial', 400, {
          code: 'INVALID_JSON_UPLOAD_PAYLOAD',
        });
      }

      if (!payload || typeof payload !== 'object') {
        return editorialError('Envie um objeto JSON valido para upload editorial', 400, {
          code: 'INVALID_JSON_UPLOAD_PAYLOAD',
        });
      }

      if (!payload.base64?.trim()) {
        return editorialError('Envie base64 no corpo JSON para upload remoto', 400, { code: 'MISSING_BASE64' });
      }

      const normalized = normalizeBase64Payload(payload.base64);
      const mimeType = payload.contentType?.trim() || normalized.mimeType || 'image/webp';
      const filename = sanitizeFilename(payload.filename || `generated-image.${mimeType.includes('png') ? 'png' : mimeType.includes('svg') ? 'svg' : 'webp'}`);
      const isSvgByExtension = filename.toLowerCase().endsWith('.svg');
      if (!ALLOWED_TYPES.includes(mimeType) && !isSvgByExtension) {
        return editorialError('Tipo de arquivo nao suportado. Use: JPEG, PNG, WebP, GIF, AVIF ou SVG', 400, {
          code: 'UNSUPPORTED_FILE_TYPE',
        });
      }

      const buffer = Buffer.from(normalized.base64, 'base64');
      if (buffer.length === 0) {
        return editorialError('Base64 invalido ou vazio', 400, { code: 'INVALID_BASE64' });
      }
      if (buffer.length > MAX_FILE_SIZE) {
        return editorialError('Arquivo muito grande. Maximo: 10MB', 400, { code: 'FILE_TOO_LARGE' });
      }

      const width = Number.isFinite(payload.width) && payload.width! > 0 ? Math.min(payload.width!, MAX_DIMENSION) : undefined;
      const height = Number.isFinite(payload.height) && payload.height! > 0 ? Math.min(payload.height!, MAX_DIMENSION) : undefined;
      const quality = Number.isFinite(payload.quality) && payload.quality! >= 1 && payload.quality! <= 95 ? payload.quality! : 85;
      const addWatermark = Boolean(payload.watermark);
      const keepMetadata = Boolean(payload.keepMetadata);
      const originalName = escapeHtml(filename);
      const isVector = mimeType === 'image/svg+xml' || isSvgByExtension;

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

        const storedName = buildStoredFilename(filename, 'svg');
        await saveUploadedFile({ relativeDir: month, filename: storedName, buffer });
        const response = await buildAssetResponse({
          relativePath: `${month}/${storedName}`,
          filename: storedName,
          originalName,
          originalSizeBytes: buffer.length,
          processedBuffer: buffer,
          format: 'svg',
          mimeType: 'image/svg+xml',
          metadata: {
            removed: false,
            hadGPS: false,
          },
          sourceType: payload.sourceType,
          sourceUrl: payload.sourceUrl,
          titleText: payload.titleText,
          altText: payload.altText,
          caption: payload.caption,
          creditText: payload.creditText,
          focusKeywords: payload.focusKeywords,
          promptText: payload.promptText,
          createdBy: auth.userId,
        });

        return editorialSuccess(response);
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
      const processedMetadata = await sharp(processedBuffer).metadata();
      const storedName = buildStoredFilename(filename, 'webp');
      await saveUploadedFile({ relativeDir: month, filename: storedName, buffer: processedBuffer });

      const response = await buildAssetResponse({
        relativePath: `${month}/${storedName}`,
        filename: storedName,
        originalName,
        originalSizeBytes: buffer.length,
        processedBuffer,
        format: 'webp',
        mimeType: 'image/webp',
        metadata: {
          removed: !keepMetadata,
          hadGPS: hasGPS,
        },
        width: processedMetadata.width ?? null,
        height: processedMetadata.height ?? null,
        sourceType: payload.sourceType,
        sourceUrl: payload.sourceUrl,
        titleText: payload.titleText,
        altText: payload.altText,
        caption: payload.caption,
        creditText: payload.creditText,
        focusKeywords: payload.focusKeywords,
        promptText: payload.promptText,
        createdBy: auth.userId,
      });

      return editorialSuccess(response);
    }

    if (!contentType.includes('multipart/form-data') && !contentType.includes('application/x-www-form-urlencoded')) {
      return editorialError(
        'Content-Type nao suportado para upload editorial. Use application/json com base64 ou multipart/form-data com file.',
        415,
        { code: 'UNSUPPORTED_UPLOAD_CONTENT_TYPE' },
      );
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

    const width = (() => {
      const parsed = parseInteger(formData.get('width'));
      return Number.isFinite(parsed) && parsed! > 0 ? Math.min(parsed!, MAX_DIMENSION) : undefined;
    })();
    const height = (() => {
      const parsed = parseInteger(formData.get('height'));
      return Number.isFinite(parsed) && parsed! > 0 ? Math.min(parsed!, MAX_DIMENSION) : undefined;
    })();
    const quality = (() => {
      const parsed = parseInteger(formData.get('quality'));
      return Number.isFinite(parsed) && parsed! >= 1 && parsed! <= 95 ? parsed! : 85;
    })();
    const addWatermark = parseBoolean(formData.get('watermark'));
    const keepMetadata = parseBoolean(formData.get('keepMetadata'));

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
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

      const storedName = buildStoredFilename(file.name, 'svg');
      await saveUploadedFile({ relativeDir: month, filename: storedName, buffer });
      const response = await buildAssetResponse({
        relativePath: `${month}/${storedName}`,
        filename: storedName,
        originalName,
        originalSizeBytes: buffer.length,
        processedBuffer: buffer,
        format: 'svg',
        mimeType: 'image/svg+xml',
        metadata: {
          removed: false,
          hadGPS: false,
        },
        sourceType: String(formData.get('sourceType') ?? 'upload'),
        sourceUrl: String(formData.get('sourceUrl') ?? '') || null,
        titleText: String(formData.get('titleText') ?? '') || null,
        altText: String(formData.get('altText') ?? '') || null,
        caption: String(formData.get('caption') ?? '') || null,
        creditText: String(formData.get('creditText') ?? '') || null,
        focusKeywords: String(formData.get('focusKeywords') ?? '')
          .split(',')
          .map((item) => item.trim())
          .filter(Boolean),
        promptText: String(formData.get('promptText') ?? '') || null,
        createdBy: auth.userId,
      });

      return editorialSuccess(response);
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
    const processedMetadata = await sharp(processedBuffer).metadata();
    const storedName = buildStoredFilename(file.name, 'webp');
    await saveUploadedFile({ relativeDir: month, filename: storedName, buffer: processedBuffer });

    const response = await buildAssetResponse({
      relativePath: `${month}/${storedName}`,
      filename: storedName,
      originalName,
      originalSizeBytes: buffer.length,
      processedBuffer,
      format: 'webp',
      mimeType: 'image/webp',
      metadata: {
        removed: !keepMetadata,
        hadGPS: hasGPS,
      },
      width: processedMetadata.width ?? null,
      height: processedMetadata.height ?? null,
      sourceType: String(formData.get('sourceType') ?? 'upload'),
      sourceUrl: String(formData.get('sourceUrl') ?? '') || null,
      titleText: String(formData.get('titleText') ?? '') || null,
      altText: String(formData.get('altText') ?? '') || null,
      caption: String(formData.get('caption') ?? '') || null,
      creditText: String(formData.get('creditText') ?? '') || null,
      focusKeywords: String(formData.get('focusKeywords') ?? '')
        .split(',')
        .map((item) => item.trim())
        .filter(Boolean),
      promptText: String(formData.get('promptText') ?? '') || null,
      createdBy: auth.userId,
    });

    return editorialSuccess(response);
  } catch (error) {
    logger.error('Erro no upload editorial:', error);
    return editorialError('Erro ao processar imagem', 500, { code: 'UPLOAD_PROCESSING_ERROR' });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const auth = await requireEditorialRequest(request);
    if (!auth.ok) {
      return editorialError(auth.message, auth.status, { code: 'UNAUTHORIZED' });
    }

    const payload = await request.json() as {
      assetId?: string;
      publicUrl?: string;
      titleText?: string;
      altText?: string;
      caption?: string;
      creditText?: string;
      focusKeywords?: string[];
      sourceType?: string;
      sourceUrl?: string;
      promptText?: string;
      metadata?: Record<string, unknown>;
    };

    const asset = await updateEditorialAssetMetadata({
      assetId: payload.assetId,
      publicUrl: payload.publicUrl,
      titleText: payload.titleText,
      altText: payload.altText,
      caption: payload.caption,
      creditText: payload.creditText,
      focusKeywords: payload.focusKeywords,
      sourceType: payload.sourceType,
      sourceUrl: payload.sourceUrl,
      promptText: payload.promptText,
      metadata: payload.metadata,
    });

    return editorialSuccess({ asset });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Erro ao atualizar metadados da imagem';
    return editorialError(message, 400, { code: 'EDITORIAL_ASSET_METADATA_ERROR' });
  }
}
