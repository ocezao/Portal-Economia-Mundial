# Seed de Usuario Admin (Teste)

Este projeto possui scripts para criar/confirmar um usuario admin no Supabase usando a **Service Role Key**.

Regras de seguranca
- Nao coloque chaves, senhas ou URLs sensiveis em `docs/` nem em commits.
- Use `.env.scripts` (gitignored) para armazenar secrets localmente.

## Pre-requisitos

As chaves reais ficam em `.env` (raiz do projeto). Para os scripts, usamos `.env.scripts` apenas como alias.

No arquivo `.env` (raiz do projeto), garanta que existam as variaveis:
- `NEXT_PUBLIC_SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`

No arquivo `.env.scripts` (raiz do projeto), garanta que existam as variaveis:
- `SUPABASE_URL` (referenciando `NEXT_PUBLIC_SUPABASE_URL`)
- `SUPABASE_SERVICE_ROLE_KEY` (referenciando `SUPABASE_SERVICE_ROLE_KEY`)

## Criar usuario admin de teste

O script `confirm-email.mjs` cria (se nao existir) e garante:
- email confirmado no Supabase Auth
- `user_metadata.role = 'admin'`
- registro em `profiles` com `role = 'admin'`

Comandos (PowerShell):

```powershell
cd C:\Users\cezao\Downloads\app

# Cria/ajusta o usuario admin de teste.
$env:ADMIN_SEED_EMAIL = "admin.teste@cenariointernacional.com.br"
$env:ADMIN_SEED_NAME  = "Admin Teste CIN"
# Defina a senha no terminal (evita armazenar em arquivos).
$env:ADMIN_SEED_PASSWORD = "defina-uma-senha-forte-aqui"

node .\confirm-email.mjs
```

Se der erro `Invalid API key` (401)
- Confirme que `SUPABASE_SERVICE_ROLE_KEY` em `.env.scripts` é a **Service Role Key** (não a anon key).
- Confirme que `SUPABASE_URL` aponta para o projeto correto.

Senha
- Recomendado: sempre usar `ADMIN_SEED_PASSWORD` no terminal.
- Alternativo: definir `ADMIN_DEFAULT_PASSWORD` localmente em `.env.scripts` (nao commit).

## Promover usuario existente a admin

Se o usuario ja existir e voce quiser apenas garantir `role=admin` no Auth:

```powershell
cd C:\Users\cezao\Downloads\app

$env:ADMIN_SEED_EMAIL = "admin.teste@cenariointernacional.com.br"
$env:ADMIN_SEED_NAME  = "Admin Teste CIN"

node .\make-admin.mjs
```
