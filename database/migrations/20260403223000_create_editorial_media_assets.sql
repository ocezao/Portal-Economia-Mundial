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
);

create index if not exists idx_editorial_media_assets_created_at
  on editorial_media_assets (created_at desc);

create index if not exists idx_editorial_media_assets_source_type
  on editorial_media_assets (source_type);
