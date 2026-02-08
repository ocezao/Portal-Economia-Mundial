-- Fix RLS for leads table (allow anon insert)

begin;
-- Ensure basic grants for API role usage
grant usage on schema public to anon, authenticated;
grant insert on table public.leads to anon, authenticated;
-- Ensure RLS and policy exist
alter table public.leads enable row level security;
-- Recreate policy to avoid missing/altered state
drop policy if exists "allow anon insert" on public.leads;
create policy "allow anon insert"
  on public.leads
  for insert
  to anon, authenticated
  with check (true);
commit;
