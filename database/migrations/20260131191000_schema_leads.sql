-- Portal Economia (PTE) — banco local schema inicial (Leads)
-- Objetivo: armazenar apenas CONTATOS de leads (newsletter + fale conosco), sem expor dados via SELECT público.
-- Foco: melhorar a qualidade/consistência dos dados para consumo por IA (dedupe, normalização, metadados).

create extension if not exists pgcrypto;
create table if not exists public.leads (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),

  -- Origem do lead (ajuste conforme for adicionando novos pontos de coleta)
  source text not null,

  -- Contato
  name text,
  email text not null,
  email_normalized text generated always as (lower(email)) stored,

  -- Consentimento (newsletter / contato)
  consent boolean not null default true,

  -- Metadados não sensíveis (utm, path, referrer etc.)
  meta jsonb not null default '{}'::jsonb
);
-- Integridade básica
alter table public.leads
  add constraint leads_email_check check (position('@' in email) > 1 and char_length(email) <= 254);
-- Evita "lixo" em source (mantém flexível via padrões)
alter table public.leads
  add constraint leads_source_check check (
    source = 'fale_conosco'
    or source like 'newsletter_%'
  );
-- Índices para consultas internas (admin)
create index if not exists leads_created_at_idx on public.leads (created_at desc);
create index if not exists leads_source_created_at_idx on public.leads (source, created_at desc);
create index if not exists leads_email_normalized_idx on public.leads (email_normalized);
-- Dedupe (recomendado): evita duplicar o mesmo e-mail para a mesma origem.
-- Isso facilita análises e evita spam de cadastros repetidos.
create unique index if not exists leads_email_source_unique
  on public.leads (email_normalized, source);
-- RLS: permitir apenas INSERT anônimo; negar SELECT/UPDATE/DELETE.
alter table public.leads enable row level security;
drop policy if exists "allow anon insert" on public.leads;
create policy "allow anon insert"
  on public.leads
  for insert
  to anon, authenticated
  with check (true);
-- Segurança adicional recomendada:
-- 1) No painel do banco local, restrinja CORS para seus domínios.
-- 2) Considere adicionar CAPTCHA/Turnstile ou uma Edge Function para rate limit.;

