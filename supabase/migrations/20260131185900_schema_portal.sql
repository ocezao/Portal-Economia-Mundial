-- Portal Economia (PTE) — Supabase schema complementar (Conteúdo e Candidaturas)
-- Objetivo: leitura pública de notícias e envio anônimo de candidaturas.

create extension if not exists pgcrypto;
-- =========================
-- Notícias (leitura pública)
-- =========================
create table if not exists public.news_articles (
  id text primary key,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  published boolean not null default true,

  title text not null,
  subtitle text not null,
  author text not null,
  publish_date date not null,
  category text not null,
  category_label text,
  image text not null,
  excerpt text not null,
  content text not null,
  quote text,
  info_box text,
  related_ids text[] not null default '{}'::text[],
  featured boolean not null default false,
  read_time integer not null default 4
);
create index if not exists news_articles_publish_date_idx on public.news_articles (publish_date desc);
create index if not exists news_articles_category_idx on public.news_articles (category);
create index if not exists news_articles_featured_idx on public.news_articles (featured);
alter table public.news_articles enable row level security;
drop policy if exists "allow public read" on public.news_articles;
create policy "allow public read"
  on public.news_articles
  for select
  to anon, authenticated
  using (published = true);
-- ======================================
-- Candidaturas (Trabalhe conosco - insert)
-- ======================================
create table if not exists public.job_applications (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),

  name text not null,
  email text not null,
  area text not null,
  message text not null,
  resume_file_name text,
  resume_path text,
  consent boolean not null default true,
  meta jsonb not null default '{}'::jsonb
);
alter table public.job_applications
  add constraint job_applications_email_check check (position('@' in email) > 1 and char_length(email) <= 254);
create index if not exists job_applications_created_at_idx on public.job_applications (created_at desc);
create index if not exists job_applications_area_idx on public.job_applications (area);
alter table public.job_applications enable row level security;
drop policy if exists "allow anon insert job applications" on public.job_applications;
create policy "allow anon insert job applications"
  on public.job_applications
  for insert
  to anon, authenticated
  with check (true);
-- ==========================
-- Contato (mensagens do site)
-- ==========================
create table if not exists public.contact_messages (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),

  name text not null,
  email text not null,
  subject text not null,
  message text not null,
  consent boolean not null default true,
  meta jsonb not null default '{}'::jsonb
);
alter table public.contact_messages
  add constraint contact_messages_email_check check (position('@' in email) > 1 and char_length(email) <= 254);
create index if not exists contact_messages_created_at_idx on public.contact_messages (created_at desc);
alter table public.contact_messages enable row level security;
drop policy if exists "allow anon insert contact messages" on public.contact_messages;
create policy "allow anon insert contact messages"
  on public.contact_messages
  for insert
  to anon, authenticated
  with check (true);
-- ==========================
-- Storage (currículos)
-- ==========================
insert into storage.buckets (id, name, public)
values ('resumes', 'resumes', false)
on conflict (id) do nothing;
drop policy if exists "allow anon resume upload" on storage.objects;
create policy "allow anon resume upload"
  on storage.objects
  for insert
  to anon, authenticated
  with check (bucket_id = 'resumes');
drop policy if exists "allow authenticated resume read" on storage.objects;
create policy "allow authenticated resume read"
  on storage.objects
  for select
  to authenticated
  using (bucket_id = 'resumes');
-- Observações:
-- 1) Restrinja CORS no painel do Supabase para seus domínios.
-- 2) Para edição de notícias, use Service Role ou um backend seguro.;
