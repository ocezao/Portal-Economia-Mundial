-- External snapshots (cache) for third-party data (Finnhub etc.)
-- Purpose: reduce per-request external calls and protect against API rate limits.

create table if not exists public.external_snapshots (
  key text primary key,
  data jsonb not null,
  updated_at timestamptz not null default now()
);

create index if not exists external_snapshots_updated_at_idx
  on public.external_snapshots (updated_at desc);

alter table public.external_snapshots enable row level security;

-- Public read access (safe only for non-sensitive cached data).
do $$
begin
  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'external_snapshots'
      and policyname = 'External snapshots are readable by anyone'
  ) then
    create policy "External snapshots are readable by anyone"
      on public.external_snapshots
      for select
      using (true);
  end if;
end $$;

-- Writes should be done by service_role (cron/edge function) or a trusted backend.
-- We intentionally do not create insert/update policies for anon/authenticated.

