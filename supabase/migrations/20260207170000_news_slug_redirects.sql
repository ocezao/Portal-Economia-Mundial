-- Slug redirects for 301 on article URLs.
-- Enables stable SEO when editors change slugs.

create table if not exists public.news_slug_redirects (
  from_slug text primary key,
  to_slug text not null,
  article_id uuid null references public.news_articles(id) on delete set null,
  created_at timestamptz not null default now()
);

alter table public.news_slug_redirects enable row level security;

-- Public read access: allow the app to resolve redirects server-side for all users.
do $$
begin
  create policy "public can read redirects"
  on public.news_slug_redirects
  for select
  using (true);
exception
  when duplicate_object then null;
end $$;

-- Only admins (via JWT app_metadata.role) can manage redirect entries.
do $$
begin
  create policy "admin can manage redirects"
  on public.news_slug_redirects
  for all
  using ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin')
  with check ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');
exception
  when duplicate_object then null;
end $$;

