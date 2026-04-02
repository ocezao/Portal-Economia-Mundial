# Deploy em Producao na VPS (Execucao Manual)

Este guia descreve o fluxo oficial de deploy para producao com Docker Compose e banco local.

## 1) Preparar o servidor

```bash
apt update && apt upgrade -y
apt install -y git curl ca-certificates docker.io docker-compose-plugin nginx
```

## 2) Criar o diretorio do projeto

```bash
mkdir -p /var/www/portal
cd /var/www/portal
```

## 3) Obter o codigo

```bash
git clone --branch main https://github.com/ocezao/Portal-Economia-Mundial.git .
```

Se o diretorio ja existir com um clone valido:

```bash
git fetch origin
git pull --ff-only origin main
```

## 4) Criar o `.env`

```bash
cp .env.example .env
nano .env
```

## 5) Preencher variaveis obrigatorias

```env
NEXT_PUBLIC_SITE_URL=https://cenariointernacional.com.br
NEXT_PUBLIC_API_BASE_URL=https://api.cenariointernacional.com.br
DB_NAME=portal
DB_USER=portal_user
DB_PASSWORD=SEU_VALOR_FORTE
GNEWS_API_KEY=SEU_VALOR
NEXT_PUBLIC_FINNHUB_API_KEY=SEU_VALOR
FINNHUB_API_KEY=SEU_VALOR
NEXT_PUBLIC_ONESIGNAL_APP_ID=SEU_VALOR
ONESIGNAL_REST_API_KEY=SEU_VALOR
NEXT_PUBLIC_ADSENSE_CLIENT_ID=ca-pub-6096980902806551
NEXT_PUBLIC_ADSENSE_SLOT_INARTICLE=1577639969
CORS_ALLOWED_ORIGINS=https://cenariointernacional.com.br,https://www.cenariointernacional.com.br
CRON_API_SECRET=SEU_VALOR
EDITORIAL_API_KEY=SEU_VALOR
SMTP_HOST=SEU_VALOR
SMTP_PORT=587
SMTP_USER=SEU_VALOR
SMTP_PASS=SEU_VALOR
SMTP_SECURITY=SSL
```

Observacoes:

- O `DATABASE_URL` e montado pelo `docker-compose.yml` a partir de `DB_NAME`, `DB_USER` e `DB_PASSWORD`.
- O runtime oficial nao depende de PM2.
- `supabase/migrations/` permanece no repositorio como historico de schema.

## 6) Proteger o arquivo

```bash
chmod 600 .env
```

## 7) Subir a stack oficial

```bash
docker compose -f docker-compose.yml up -d --build
```

## 8) Validar a stack

```bash
docker compose -f docker-compose.yml ps
docker compose -f docker-compose.yml logs --tail=200 web api collector database
curl -I http://127.0.0.1:3000/api/health
curl -I http://127.0.0.1:4000/api/health
curl -I http://127.0.0.1:4010/health
curl -I http://127.0.0.1:3001
```

## 9) Aplicar Nginx

```bash
cp deploy/nginx/portal.conf /etc/nginx/sites-available/portal
rm -f /etc/nginx/sites-enabled/default
ln -sf /etc/nginx/sites-available/portal /etc/nginx/sites-enabled/portal
nginx -t
systemctl reload nginx
```

## 10) SSL

```bash
certbot --nginx \
  --non-interactive --agree-tos \
  -m contato@cenariointernacional.com.br \
  -d cenariointernacional.com.br \
  -d www.cenariointernacional.com.br \
  -d api.cenariointernacional.com.br \
  -d metabase.cenariointernacional.com.br
```

## 11) Smoke tests

```bash
curl -I https://cenariointernacional.com.br
curl -I https://api.cenariointernacional.com.br/api/health
curl https://cenariointernacional.com.br/api/health
```

```bash
curl -X POST "https://cenariointernacional.com.br/api/cron?type=editorial-jobs" \
  -H "x-cron-secret: $CRON_API_SECRET"
```

## 12) Operacao recorrente

- Reinicio: `docker compose -f docker-compose.yml restart web api collector`
- Logs: `docker compose -f docker-compose.yml logs -f`
- Status: `docker compose -f docker-compose.yml ps`
- Backup: `scripts/backup.sh`

## 13) O que nao usar mais

- PM2 nao e parte do fluxo oficial de producao.
- `docker-compose.prod.yml` nao e o caminho oficial de producao deste projeto.
- Credenciais Supabase nao sao requisitos do runtime oficial local.

## 14) Dashboards

- Dashboard principal de tracking: `https://metabase.cenariointernacional.com.br/dashboard/3-tracking-completo-executivo`
- Ajustes em lote de periodo: `scripts/metabase/apply-dashboard-date-filter.py`
