# Guia de Provisionamento Manual do VPS (EXEMPLO)

ATENCAO: Este arquivo e um TEMPLATE seguro (sem secrets) e pode ser versionado.
Crie um arquivo local `scripts/vps-provision-manual.md` com valores reais.
Esse arquivo real esta no `.gitignore` e NAO deve ser commitado.

## Conexao

```bash
ssh root@SEU_IP
```

## Estrutura

```bash
mkdir -p /var/www/portal
cd /var/www/portal
```

## Clone do repositorio

```bash
git clone https://github.com/ocezao/Portal-Economia-Mundial.git .
git checkout main
```

## Criar .env de producao (NUNCA versionar)

```bash
nano /var/www/portal/.env
```

Cole e preencha os placeholders:

```env
# URLs
NEXT_PUBLIC_SITE_URL=https://SEU_DOMINIO
NEXT_PUBLIC_API_BASE_URL=https://SEU_DOMINIO/api

# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://SEU_PROJETO.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=INSIRA_AQUI
SUPABASE_SERVICE_ROLE_KEY=INSIRA_AQUI
SUPABASE_UPLOAD_BUCKET=media

# APIs Externas
GNEWS_API_KEY=INSIRA_AQUI
NEXT_PUBLIC_FINNHUB_API_KEY=INSIRA_AQUI
FINNHUB_API_KEY=INSIRA_AQUI

# OneSignal
NEXT_PUBLIC_ONESIGNAL_APP_ID=INSIRA_AQUI
ONESIGNAL_REST_API_KEY=INSIRA_AQUI

# AdSense
NEXT_PUBLIC_ADSENSE_CLIENT_ID=INSIRA_AQUI
NEXT_PUBLIC_ADSENSE_SLOT_INARTICLE=INSIRA_AQUI

# CORS
CORS_ALLOWED_ORIGINS=https://SEU_DOMINIO,https://www.SEU_DOMINIO

# PostgreSQL (se usar Analytics local)
POSTGRES_PASSWORD=INSIRA_SENHA_FORTE
```

## Permissoes do .env

```bash
chmod 600 /var/www/portal/.env
chown root:root /var/www/portal/.env
```

## Verificar ferramentas

```bash
docker --version
docker compose version
nginx -v
git --version
```

## Proximos passos

- Deploy: `docker compose -f docker-compose.prod.yml up -d`
- Health check: `curl -I https://SEU_DOMINIO/api/health`
