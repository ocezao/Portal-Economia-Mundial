-- Portal Economia (PTE) - User Activity Tables
-- Objetivo: favoritos, histórico de leitura e progresso de leitura por usuário

create extension if not exists pgcrypto;

-- =========================
-- Bookmarks (Favoritos)
-- =========================
-- Armazena os artigos favoritados pelos usuários

create table if not exists public.bookmarks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  article_id text not null references public.news_articles (id) on delete cascade,
  created_at timestamptz not null default now()
);

-- Constraint única: um usuário não pode favoritar o mesmo artigo duas vezes
alter table public.bookmarks
  add constraint bookmarks_user_article_unique unique (user_id, article_id);

-- Índices para performance
create index if not exists bookmarks_user_id_idx on public.bookmarks (user_id);
create index if not exists bookmarks_article_id_idx on public.bookmarks (article_id);
create index if not exists bookmarks_created_at_idx on public.bookmarks (created_at desc);

-- RLS: segurança em nível de linha
alter table public.bookmarks enable row level security;

-- Políticas: usuários veem apenas seus próprios favoritos
drop policy if exists "allow owner read bookmarks" on public.bookmarks;
create policy "allow owner read bookmarks"
  on public.bookmarks
  for select
  to authenticated
  using (auth.uid() = user_id);

-- Políticas: usuários inserem apenas seus próprios favoritos
drop policy if exists "allow owner insert bookmarks" on public.bookmarks;
create policy "allow owner insert bookmarks"
  on public.bookmarks
  for insert
  to authenticated
  with check (auth.uid() = user_id);

-- Políticas: usuários deletam apenas seus próprios favoritos
drop policy if exists "allow owner delete bookmarks" on public.bookmarks;
create policy "allow owner delete bookmarks"
  on public.bookmarks
  for delete
  to authenticated
  using (auth.uid() = user_id);

-- Políticas: admins podem ver todos os favoritos
drop policy if exists "allow admin read bookmarks" on public.bookmarks;
create policy "allow admin read bookmarks"
  on public.bookmarks
  for select
  to authenticated
  using (public.is_admin());

-- =========================
-- Reading History (Histórico de Leitura)
-- =========================
-- Registra o histórico de artigos lidos pelos usuários e tempo gasto

create table if not exists public.reading_history (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  article_id text not null references public.news_articles (id) on delete cascade,
  time_spent integer not null default 0,
  read_at timestamptz not null default now()
);

-- Constraint: tempo gasto não pode ser negativo
alter table public.reading_history
  add constraint reading_history_time_spent_check check (time_spent >= 0);

-- Índices para performance
create index if not exists reading_history_user_id_idx on public.reading_history (user_id);
create index if not exists reading_history_article_id_idx on public.reading_history (article_id);
create index if not exists reading_history_read_at_idx on public.reading_history (read_at desc);

-- RLS: segurança em nível de linha
alter table public.reading_history enable row level security;

-- Políticas: usuários veem apenas seu próprio histórico
drop policy if exists "allow owner read history" on public.reading_history;
create policy "allow owner read history"
  on public.reading_history
  for select
  to authenticated
  using (auth.uid() = user_id);

-- Políticas: usuários inserem apenas no próprio histórico
drop policy if exists "allow owner insert history" on public.reading_history;
create policy "allow owner insert history"
  on public.reading_history
  for insert
  to authenticated
  with check (auth.uid() = user_id);

-- Políticas: usuários atualizam apenas seu próprio histórico
drop policy if exists "allow owner update history" on public.reading_history;
create policy "allow owner update history"
  on public.reading_history
  for update
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Políticas: usuários deletam apenas seu próprio histórico
drop policy if exists "allow owner delete history" on public.reading_history;
create policy "allow owner delete history"
  on public.reading_history
  for delete
  to authenticated
  using (auth.uid() = user_id);

-- Políticas: admins podem ver todo o histórico
drop policy if exists "allow admin read history" on public.reading_history;
create policy "allow admin read history"
  on public.reading_history
  for select
  to authenticated
  using (public.is_admin());

-- =========================
-- Reading Progress (Progresso de Leitura)
-- =========================
-- Armazena o progresso de leitura do usuário em cada artigo

create table if not exists public.reading_progress (
  user_id uuid not null references auth.users (id) on delete cascade,
  article_id text not null references public.news_articles (id) on delete cascade,
  progress_pct integer not null default 0,
  last_position integer not null default 0,
  updated_at timestamptz not null default now(),
  primary key (user_id, article_id)
);

-- Constraints: validação de valores
alter table public.reading_progress
  add constraint reading_progress_pct_check check (progress_pct between 0 and 100);

alter table public.reading_progress
  add constraint reading_progress_position_check check (last_position >= 0);

-- Índices para performance
create index if not exists reading_progress_user_id_idx on public.reading_progress (user_id);
create index if not exists reading_progress_article_id_idx on public.reading_progress (article_id);
create index if not exists reading_progress_updated_at_idx on public.reading_progress (updated_at desc);

-- RLS: segurança em nível de linha
alter table public.reading_progress enable row level security;

-- Políticas: usuários veem apenas seu próprio progresso
drop policy if exists "allow owner read progress" on public.reading_progress;
create policy "allow owner read progress"
  on public.reading_progress
  for select
  to authenticated
  using (auth.uid() = user_id);

-- Políticas: usuários inserem apenas seu próprio progresso
drop policy if exists "allow owner insert progress" on public.reading_progress;
create policy "allow owner insert progress"
  on public.reading_progress
  for insert
  to authenticated
  with check (auth.uid() = user_id);

-- Políticas: usuários atualizam apenas seu próprio progresso
drop policy if exists "allow owner update progress" on public.reading_progress;
create policy "allow owner update progress"
  on public.reading_progress
  for update
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Políticas: usuários deletam apenas seu próprio progresso
drop policy if exists "allow owner delete progress" on public.reading_progress;
create policy "allow owner delete progress"
  on public.reading_progress
  for delete
  to authenticated
  using (auth.uid() = user_id);

-- Políticas: admins podem ver todo o progresso
drop policy if exists "allow admin read progress" on public.reading_progress;
create policy "allow admin read progress"
  on public.reading_progress
  for select
  to authenticated
  using (public.is_admin());

-- Observações:
-- 1) As tabelas usam CASCADE em deletes para manter integridade referencial
-- 2) Cada usuário vê apenas seus próprios dados (exceto admins)
-- 3) Índices otimizam consultas por usuário, artigo e data
-- 4) Constraints garantem validade dos dados (progresso 0-100%, tempo não negativo)
