-- Portal Economia (PTE) - Auth/Profiles/Admin schema
-- Objetivo: sistema de usuarios + admin com RLS seguro

create extension if not exists pgcrypto;
-- =========================
-- Perfis de usuarios
-- =========================
create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  email text,
  full_name text,
  role text not null default 'user',
  status text not null default 'active'
);
create index if not exists profiles_role_idx on public.profiles (role);
alter table public.profiles enable row level security;
-- Funcoes auxiliares
create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
as $$
  select exists (
    select 1
    from public.profiles p
    where p.id = auth.uid()
      and p.role = 'admin'
      and p.status = 'active'
  );
$$;
-- RLS: usuario ve/edita apenas o proprio perfil
drop policy if exists "profile self read" on public.profiles;
create policy "profile self read"
  on public.profiles
  for select
  to authenticated
  using (auth.uid() = id);
drop policy if exists "profile self update" on public.profiles;
create policy "profile self update"
  on public.profiles
  for update
  to authenticated
  using (auth.uid() = id);
-- RLS: admin pode ler/editar todos
drop policy if exists "admin read all profiles" on public.profiles;
create policy "admin read all profiles"
  on public.profiles
  for select
  to authenticated
  using (public.is_admin());
drop policy if exists "admin update all profiles" on public.profiles;
create policy "admin update all profiles"
  on public.profiles
  for update
  to authenticated
  using (public.is_admin());
-- Trigger: cria perfil ao cadastrar usuario
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
as $$
begin
  insert into public.profiles (id, email, full_name)
  values (new.id, new.email, new.raw_user_meta_data->>'full_name')
  on conflict (id) do nothing;
  return new;
end;
$$;
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
-- =========================
-- Admin: leitura de dados do portal
-- =========================
drop policy if exists "allow admin manage news" on public.news_articles;
create policy "allow admin manage news"
  on public.news_articles
  for all
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());
drop policy if exists "allow admin read job applications" on public.job_applications;
create policy "allow admin read job applications"
  on public.job_applications
  for select
  to authenticated
  using (public.is_admin());
drop policy if exists "allow admin read contact messages" on public.contact_messages;
create policy "allow admin read contact messages"
  on public.contact_messages
  for select
  to authenticated
  using (public.is_admin());
-- Observacoes:
-- 1) Defina manualmente o primeiro admin em public.profiles (role = 'admin').
-- 2) Restrinja CORS e dominios no painel do banco local.;

