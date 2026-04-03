import { randomUUID } from 'crypto';

import { query, queryRows } from '@/lib/db';

export interface EditorialAssetRecord {
  id: string;
  storagePath: string;
  publicUrl: string;
  originalName: string;
  mimeType: string | null;
  sizeBytes: number;
  width: number | null;
  height: number | null;
  format: string | null;
  sourceType: string;
  sourceUrl: string | null;
  titleText: string | null;
  altText: string | null;
  caption: string | null;
  creditText: string | null;
  focusKeywords: string[];
  promptText: string | null;
  metadata: Record<string, unknown>;
  createdBy: string | null;
  createdAt: string;
}

interface AssetRow {
  id: string;
  storage_path: string;
  public_url: string;
  original_name: string;
  mime_type: string | null;
  size_bytes: number;
  width: number | null;
  height: number | null;
  format: string | null;
  source_type: string;
  source_url: string | null;
  title_text: string | null;
  alt_text: string | null;
  caption: string | null;
  credit_text: string | null;
  focus_keywords: string[] | null;
  prompt_text: string | null;
  metadata: Record<string, unknown> | null;
  created_by: string | null;
  created_at: string;
}

let schemaReady: Promise<void> | null = null;

function mapAssetRow(row: AssetRow): EditorialAssetRecord {
  return {
    id: row.id,
    storagePath: row.storage_path,
    publicUrl: row.public_url,
    originalName: row.original_name,
    mimeType: row.mime_type,
    sizeBytes: row.size_bytes,
    width: row.width,
    height: row.height,
    format: row.format,
    sourceType: row.source_type,
    sourceUrl: row.source_url,
    titleText: row.title_text,
    altText: row.alt_text,
    caption: row.caption,
    creditText: row.credit_text,
    focusKeywords: row.focus_keywords ?? [],
    promptText: row.prompt_text,
    metadata: row.metadata ?? {},
    createdBy: row.created_by,
    createdAt: row.created_at,
  };
}

export async function ensureEditorialAssetSchema() {
  if (!schemaReady) {
    schemaReady = (async () => {
      await query(`
        create table if not exists editorial_media_assets (
          id text primary key,
          storage_path text not null unique,
          public_url text not null unique,
          original_name text not null,
          mime_type text,
          size_bytes integer not null,
          width integer,
          height integer,
          format text,
          source_type text not null default 'upload',
          source_url text,
          title_text text,
          alt_text text,
          caption text,
          credit_text text,
          focus_keywords text[] not null default '{}',
          prompt_text text,
          metadata jsonb not null default '{}'::jsonb,
          created_by text,
          created_at timestamptz not null default now()
        )
      `);
      await query(`alter table editorial_media_assets add column if not exists title_text text`);
      await query(`alter table editorial_media_assets add column if not exists caption text`);
      await query(`alter table editorial_media_assets add column if not exists credit_text text`);
      await query(`alter table editorial_media_assets add column if not exists focus_keywords text[] not null default '{}'`);
      await query(`create index if not exists idx_editorial_media_assets_created_at on editorial_media_assets(created_at desc)`);
      await query(`create index if not exists idx_editorial_media_assets_source_type on editorial_media_assets(source_type)`);
    })().catch((error) => {
      schemaReady = null;
      throw error;
    });
  }

  await schemaReady;
}

export async function registerEditorialAsset(input: {
  storagePath: string;
  publicUrl: string;
  originalName: string;
  mimeType?: string | null;
  sizeBytes: number;
  width?: number | null;
  height?: number | null;
  format?: string | null;
  sourceType?: string | null;
  sourceUrl?: string | null;
  titleText?: string | null;
  altText?: string | null;
  caption?: string | null;
  creditText?: string | null;
  focusKeywords?: string[];
  promptText?: string | null;
  metadata?: Record<string, unknown>;
  createdBy?: string | null;
}) {
  await ensureEditorialAssetSchema();

  const rows = await queryRows<AssetRow>(
    `insert into editorial_media_assets (
       id,
       storage_path,
       public_url,
       original_name,
       mime_type,
       size_bytes,
       width,
       height,
       format,
       source_type,
       source_url,
       title_text,
       alt_text,
       caption,
       credit_text,
       focus_keywords,
       prompt_text,
       metadata,
       created_by
     )
     values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16::text[],$17,$18::jsonb,$19)
     on conflict (storage_path) do update set
       public_url = excluded.public_url,
       original_name = excluded.original_name,
       mime_type = excluded.mime_type,
       size_bytes = excluded.size_bytes,
       width = excluded.width,
       height = excluded.height,
       format = excluded.format,
       source_type = excluded.source_type,
       source_url = excluded.source_url,
       title_text = excluded.title_text,
       alt_text = excluded.alt_text,
       caption = excluded.caption,
       credit_text = excluded.credit_text,
       focus_keywords = excluded.focus_keywords,
       prompt_text = excluded.prompt_text,
       metadata = excluded.metadata,
       created_by = excluded.created_by
     returning *`,
    [
      randomUUID(),
      input.storagePath,
      input.publicUrl,
      input.originalName,
      input.mimeType ?? null,
      input.sizeBytes,
      input.width ?? null,
      input.height ?? null,
      input.format ?? null,
      input.sourceType ?? 'upload',
      input.sourceUrl ?? null,
      input.titleText ?? null,
      input.altText ?? null,
      input.caption ?? null,
      input.creditText ?? null,
      input.focusKeywords ?? [],
      input.promptText ?? null,
      JSON.stringify(input.metadata ?? {}),
      input.createdBy ?? null,
    ],
  );

  return mapAssetRow(rows[0]);
}

export async function listEditorialAssets(options?: {
  search?: string;
  dir?: string;
  limit?: number;
}) {
  await ensureEditorialAssetSchema();

  const limit = Math.max(1, Math.min(options?.limit ?? 50, 200));
  const params: unknown[] = [];
  const conditions: string[] = [];

  if (options?.dir) {
    params.push(`${options.dir.replace(/^\/+/, '').replace(/\\/g, '/')}/%`);
    conditions.push(`storage_path like $${params.length}`);
  }

  if (options?.search?.trim()) {
    params.push(`%${options.search.trim().toLowerCase()}%`);
    conditions.push(`(lower(original_name) like $${params.length} or lower(storage_path) like $${params.length} or lower(coalesce(alt_text, '')) like $${params.length})`);
  }

  params.push(limit);
  const whereClause = conditions.length > 0 ? `where ${conditions.join(' and ')}` : '';

  const rows = await queryRows<AssetRow>(
    `select *
       from editorial_media_assets
       ${whereClause}
      order by created_at desc
      limit $${params.length}`,
    params,
  );

  return rows.map(mapAssetRow);
}

export async function getEditorialAssetByPublicUrl(publicUrl: string) {
  await ensureEditorialAssetSchema();
  const rows = await queryRows<AssetRow>(
    `select * from editorial_media_assets where public_url = $1 limit 1`,
    [publicUrl],
  );
  return rows[0] ? mapAssetRow(rows[0]) : null;
}

export async function updateEditorialAssetMetadata(input: {
  assetId?: string;
  publicUrl?: string;
  titleText?: string | null;
  altText?: string | null;
  caption?: string | null;
  creditText?: string | null;
  focusKeywords?: string[];
  sourceType?: string | null;
  sourceUrl?: string | null;
  promptText?: string | null;
  metadata?: Record<string, unknown>;
}) {
  await ensureEditorialAssetSchema();

  const keyField = input.assetId ? 'id' : input.publicUrl ? 'public_url' : null;
  const keyValue = input.assetId ?? input.publicUrl ?? null;
  if (!keyField || !keyValue) {
    throw new Error('Informe assetId ou publicUrl para atualizar metadados da imagem');
  }

  const rows = await queryRows<AssetRow>(
    `update editorial_media_assets
        set title_text = coalesce($1, title_text),
            alt_text = coalesce($2, alt_text),
            caption = coalesce($3, caption),
            credit_text = coalesce($4, credit_text),
            focus_keywords = coalesce($5::text[], focus_keywords),
            source_type = coalesce($6, source_type),
            source_url = coalesce($7, source_url),
            prompt_text = coalesce($8, prompt_text),
            metadata = case when $9::jsonb is null then metadata else metadata || $9::jsonb end
      where ${keyField} = $10
      returning *`,
    [
      input.titleText ?? null,
      input.altText ?? null,
      input.caption ?? null,
      input.creditText ?? null,
      input.focusKeywords ?? null,
      input.sourceType ?? null,
      input.sourceUrl ?? null,
      input.promptText ?? null,
      input.metadata ? JSON.stringify(input.metadata) : null,
      keyValue,
    ],
  );

  if (!rows[0]) {
    throw new Error('Asset editorial nao encontrado');
  }

  return mapAssetRow(rows[0]);
}
