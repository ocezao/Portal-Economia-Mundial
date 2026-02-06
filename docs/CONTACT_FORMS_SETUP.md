# Formulario de Contato e Carreiras (Supabase)

Este guia cria as tabelas para:
- `contact_messages` (Fale Conosco)
- `career_applications` (Trabalhe Conosco)

Antes de criar, verifique se as tabelas e colunas ja existem.

---

## 1. Verificar tabelas existentes

```sql
select table_name
from information_schema.tables
where table_schema = 'public'
  and table_name in ('contact_messages', 'career_applications');
```

## 2. Verificar colunas existentes

```sql
select table_name, column_name, data_type
from information_schema.columns
where table_schema = 'public'
  and table_name in ('contact_messages', 'career_applications')
order by table_name, ordinal_position;
```

---

## 3. Criar/ajustar tabelas (idempotente)

```sql
create table if not exists public.contact_messages (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  email text not null,
  phone text,
  subject text not null,
  category text not null default 'duvida',
  message text not null,
  user_id uuid,
  status text not null default 'new',
  created_at timestamptz not null default now()
);

create table if not exists public.career_applications (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  email text not null,
  phone text,
  role text not null,
  location text,
  linkedin_url text,
  portfolio_url text,
  resume_url text,
  cover_letter text not null,
  user_id uuid,
  status text not null default 'new',
  created_at timestamptz not null default now()
);
```

Se as tabelas ja existirem, use `alter table ... add column if not exists` para colunas novas:

```sql
alter table public.contact_messages
  add column if not exists phone text,
  add column if not exists category text,
  add column if not exists user_id uuid,
  add column if not exists status text,
  add column if not exists created_at timestamptz;

alter table public.career_applications
  add column if not exists phone text,
  add column if not exists location text,
  add column if not exists linkedin_url text,
  add column if not exists portfolio_url text,
  add column if not exists resume_url text,
  add column if not exists user_id uuid,
  add column if not exists status text,
  add column if not exists created_at timestamptz;
```

---

## 4. RLS (recomendado)

Se usar RLS, libere apenas `insert` para anon/autenticado:

```sql
alter table public.contact_messages enable row level security;
alter table public.career_applications enable row level security;

create policy "contact_messages_insert"
on public.contact_messages
for insert
to anon, authenticated
with check (true);

create policy "career_applications_insert"
on public.career_applications
for insert
to anon, authenticated
with check (true);
```

---

## 5. Campos usados no frontend

### contact_messages
- `name`, `email`, `phone`, `subject`, `category`, `message`, `user_id`

### career_applications
- `name`, `email`, `phone`, `role`, `location`, `linkedin_url`, `portfolio_url`, `resume_url`, `cover_letter`, `user_id`

