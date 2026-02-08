-- Application error events (lightweight observability without external services)

create extension if not exists pgcrypto;

create table if not exists public.app_errors (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  source text not null default 'web',
  message text not null,
  stack text,
  digest text,
  url text,
  pathname text,
  user_agent text
);

create index if not exists app_errors_created_at_idx on public.app_errors (created_at desc);

alter table public.app_errors enable row level security;

-- Allow inserts from the app (anonymous is OK; we rate-limit at the API route).
do $$
begin
  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'app_errors'
      and policyname = 'App errors are insertable by anyone'
  ) then
    create policy "App errors are insertable by anyone"
      on public.app_errors
      for insert
      with check (true);
  end if;
end $$;

-- Reads should be restricted (admin-only) in a real setup. We do not add select policy here.

