/**
 * API Route para upload de imagens processadas
 * POST /api/upload
 * 
 * Processa imagens automaticamente:
 * - Converte para WebP
 * - Remove metadados sensíveis (GPS, câmera, etc)
 * - Redimensiona se necessário
 * - Adiciona watermark opcional
 */

import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import sharp from 'sharp';
import { randomUUID } from 'crypto';
import { createClient } from '@supabase/supabase-js';
import { logger } from '@/lib/logger';
import { escapeHtml, sanitizeFilename } from '@/lib/security';

export const runtime = 'nodejs';

// Configurações
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/avif', 'image/svg+xml'];
const MAX_DIMENSION = 4096; // safety limit for resize inputs

// Simple in-memory rate limiter (best-effort).
// For VPS single instance, this already blocks obvious abuse.
// TODO: Em produção com múltiplas instâncias, usar Redis para rate limiting centralizado
// Exemplo: Redis com ioredis ou @upstash/redis para persistência entre nodes
const rl = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT_WINDOW_MS = 60_000;
const RATE_LIMIT_MAX = 30; // uploads/min per IP

interface UploadOptions {
  width?: number;
  height?: number;
  quality?: number;
  addWatermark?: boolean;
  keepMetadata?: boolean; // false por padrão = remove metadados
}

export async function POST(request: NextRequest) {
  try {
    // Basic rate limiting by IP (x-forwarded-for first hop).
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
        return NextResponse.json({ error: 'Muitas requisições. Tente novamente em instantes.' }, { status: 429 });
      }
    }

    // Auth: only admins can upload.
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    if (!supabaseUrl || !supabaseAnonKey) {
      return NextResponse.json({ error: 'Supabase não configurado no servidor.' }, { status: 503 });
    }

    const authHeader = request.headers.get('authorization') || '';
    const token = authHeader.toLowerCase().startsWith('bearer ') ? authHeader.slice(7).trim() : '';
    if (!token) {
      return NextResponse.json({ error: 'Não autenticado.' }, { status: 401 });
    }

    const authClient = createClient(supabaseUrl, supabaseAnonKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });

    const { data: userData, error: userError } = await authClient.auth.getUser(token);
    if (userError || !userData?.user) {
      return NextResponse.json({ error: 'Sessão inválida.' }, { status: 401 });
    }

    const role =
      (userData.user.user_metadata as Record<string, unknown> | null)?.role ||
      (userData.user.app_metadata as Record<string, unknown> | null)?.role;

    if (role !== 'admin') {
      return NextResponse.json({ error: 'Acesso negado.' }, { status: 403 });
    }

    // Parse do form data
    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    
    if (!file) {
      return NextResponse.json(
        { error: 'Nenhum arquivo enviado' },
        { status: 400 }
      );
    }

    // Validações
    const isSvgByExtension = file.name.toLowerCase().endsWith('.svg');
    if (!ALLOWED_TYPES.includes(file.type) && !isSvgByExtension) {
      return NextResponse.json(
        { error: 'Tipo de arquivo não suportado. Use: JPEG, PNG, WebP, GIF, AVIF ou SVG' },
        { status: 400 }
      );
    }

    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: 'Arquivo muito grande. Máximo: 10MB' },
        { status: 400 }
      );
    }

    // Opções de processamento
    const rawWidth = Number.parseInt(String(formData.get('width') ?? ''), 10);
    const rawHeight = Number.parseInt(String(formData.get('height') ?? ''), 10);
    const rawQuality = Number.parseInt(String(formData.get('quality') ?? ''), 10);

    const width =
      Number.isFinite(rawWidth) && rawWidth > 0 ? Math.min(rawWidth, MAX_DIMENSION) : undefined;
    const height =
      Number.isFinite(rawHeight) && rawHeight > 0 ? Math.min(rawHeight, MAX_DIMENSION) : undefined;
    const quality =
      Number.isFinite(rawQuality) && rawQuality >= 1 && rawQuality <= 95 ? rawQuality : 85;

    const options: UploadOptions = {
      width,
      height,
      quality,
      addWatermark: formData.get('watermark') === 'true',
      keepMetadata: formData.get('keepMetadata') === 'true',
    };

    // Converte para buffer
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

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
          { error: 'SVG com conteúdo potencialmente inseguro. Remova scripts/eventos e tente novamente.' },
          { status: 400 }
        );
      }

      const filename = `${randomUUID()}.svg`;
      const storageBucket = process.env.SUPABASE_UPLOAD_BUCKET || 'uploads';
      const month = new Date().toISOString().slice(0, 7).replace('-', '/');
      const objectPath = `${month}/${filename}`;

      const { error: uploadError } = await authClient.storage
        .from(storageBucket)
        .upload(objectPath, new Blob([new Uint8Array(buffer)], { type: 'image/svg+xml' }), {
          contentType: 'image/svg+xml',
          upsert: false,
        });

      if (uploadError) {
        return NextResponse.json({ error: 'Erro ao enviar arquivo vetorial para storage' }, { status: 500 });
      }

      const publicUrl = authClient.storage.from(storageBucket).getPublicUrl(objectPath).data.publicUrl;
      const sizeKb = `${(buffer.length / 1024).toFixed(2)} KB`;

      return NextResponse.json({
        success: true,
        file: {
          filename,
          url: publicUrl,
          originalName: escapeHtml(sanitizeFilename(file.name)),
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

    // Verifica metadados antes (para logging)
    const originalMetadata = await sharp(buffer).metadata();
    const hasGPS = originalMetadata.exif?.toString().includes('GPS') || false;

    if (hasGPS) {
      logger.warn('⚠️ Imagem contém dados GPS - serão removidos');
    }

    // Processa a imagem
    let pipeline = sharp(buffer);

    // Redimensiona se necessário
    if (options.width || options.height) {
      pipeline = pipeline.resize(options.width, options.height, {
        fit: 'inside',
        withoutEnlargement: true,
      });
    }

    // Adiciona watermark se solicitado
    if (options.addWatermark) {
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

    // Por padrão, o sharp remove metadados. Só preservamos se explicitamente solicitado.
    if (options.keepMetadata) {
      pipeline = pipeline.withMetadata();
    }

    // Converte para WebP
    pipeline = pipeline.webp({
      quality: options.quality,
      effort: 4,
    });

    const processedBuffer = await pipeline.toBuffer();

    // Gera nome único
    const filename = `${randomUUID()}.webp`;

    // Upload para Supabase Storage (preferível a salvar em disco local).
    const storageBucket = process.env.SUPABASE_UPLOAD_BUCKET || 'uploads';
    const month = new Date().toISOString().slice(0, 7).replace('-', '/'); // yyyy/mm
    const objectPath = `${month}/${filename}`;

    const { error: uploadError } = await authClient.storage
      .from(storageBucket)
      .upload(objectPath, new Blob([new Uint8Array(processedBuffer)], { type: 'image/webp' }), {
        contentType: 'image/webp',
        upsert: false,
      });

    if (uploadError) {
      return NextResponse.json({ error: 'Erro ao enviar imagem para storage' }, { status: 500 });
    }

    // URL publica (se bucket for public). Caso contrario, voce pode trocar por signed URL.
    const publicUrl = authClient.storage.from(storageBucket).getPublicUrl(objectPath).data.publicUrl;

    // Calcula estatísticas
    const originalSize = buffer.length;
    const processedSize = processedBuffer.length;
    const reduction = ((originalSize - processedSize) / originalSize * 100).toFixed(1);

    // Resposta
    return NextResponse.json({
      success: true,
      file: {
        filename,
        url: publicUrl,
        originalName: escapeHtml(sanitizeFilename(file.name)),
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
    return NextResponse.json(
      { error: 'Erro ao processar imagem' },
      { status: 500 }
    );
  }
}
