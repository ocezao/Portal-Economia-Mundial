-- Portal Economia (PTE) - Comments and post actions (text only)

create extension if not exists pgcrypto;
-- =========================
-- Comments (text only)
-- =========================
create table if not exists public.comments (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  article_id text not null,
  user_id uuid not null references public.profiles (id) on delete cascade,
  content text not null,
  status text not null default 'active'
);
alter table public.comments
  add constraint comments_content_check check (char_length(content) between 1 and 2000);
create index if not exists comments_article_id_idx on public.comments (article_id);
create index if not exists comments_user_id_idx on public.comments (user_id);
create index if not exists comments_created_at_idx on public.comments (created_at desc);
create index if not exists comments_status_idx on public.comments (status);
alter table public.comments enable row level security;
drop policy if exists "allow public read comments" on public.comments;
create policy "allow public read comments"
  on public.comments
  for select
  to anon, authenticated
  using (status = 'active');
drop policy if exists "allow admin read comments" on public.comments;
create policy "allow admin read comments"
  on public.comments
  for select
  to authenticated
  using (public.is_admin());
drop policy if exists "allow authenticated insert comments" on public.comments;
create policy "allow authenticated insert comments"
  on public.comments
  for insert
  to authenticated
  with check (auth.uid() = user_id and status = 'active');
drop policy if exists "allow owner update comments" on public.comments;
create policy "allow owner update comments"
  on public.comments
  for update
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
drop policy if exists "allow owner delete comments" on public.comments;
create policy "allow owner delete comments"
  on public.comments
  for delete
  to authenticated
  using (auth.uid() = user_id);
drop policy if exists "allow admin update comments" on public.comments;
create policy "allow admin update comments"
  on public.comments
  for update
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());
drop policy if exists "allow admin delete comments" on public.comments;
create policy "allow admin delete comments"
  on public.comments
  for delete
  to authenticated
  using (public.is_admin());
-- =========================
-- Post actions (like/save/favorite)
-- =========================
create table if not exists public.post_actions (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  article_id text not null,
  user_id uuid not null references public.profiles (id) on delete cascade,
  action text not null
);
alter table public.post_actions
  add constraint post_actions_action_check check (action in ('like','save','favorite'));
create unique index if not exists post_actions_unique_idx
  on public.post_actions (user_id, article_id, action);
create index if not exists post_actions_article_id_idx on public.post_actions (article_id);
create index if not exists post_actions_user_id_idx on public.post_actions (user_id);
alter table public.post_actions enable row level security;
drop policy if exists "allow owner read actions" on public.post_actions;
create policy "allow owner read actions"
  on public.post_actions
  for select
  to authenticated
  using (auth.uid() = user_id);
drop policy if exists "allow owner insert actions" on public.post_actions;
create policy "allow owner insert actions"
  on public.post_actions
  for insert
  to authenticated
  with check (auth.uid() = user_id);
drop policy if exists "allow owner delete actions" on public.post_actions;
create policy "allow owner delete actions"
  on public.post_actions
  for delete
  to authenticated
  using (auth.uid() = user_id);
drop policy if exists "allow admin read actions" on public.post_actions;
create policy "allow admin read actions"
  on public.post_actions
  for select
  to authenticated
  using (public.is_admin());
-- =========================
-- Activity helper (per-user)
-- =========================
create or replace function public.get_my_activity()
returns table (
  user_id uuid,
  comment_count int,
  action_count int,
  total_score int,
  rank int
)
language sql
security definer
set search_path = public
as $$
  with comment_counts as (
    select user_id, count(*)::int as comment_count
    from public.comments
    where status = 'active'
    group by user_id
  ),
  action_counts as (
    select user_id, count(*)::int as action_count
    from public.post_actions
    group by user_id
  ),
  merged as (
    select coalesce(c.user_id, a.user_id) as user_id,
           coalesce(c.comment_count, 0) as comment_count,
           coalesce(a.action_count, 0) as action_count,
           coalesce(c.comment_count, 0) + coalesce(a.action_count, 0) as total_score
    from comment_counts c
    full join action_counts a on a.user_id = c.user_id
  ),
  ranked as (
    select *, dense_rank() over (order by total_score desc, user_id) as rank
    from merged
  )
  select user_id, comment_count, action_count, total_score, rank
  from ranked
  where user_id = auth.uid();
$$;
grant execute on function public.get_my_activity() to authenticated;

