# Deploy em Produção na VPS (Execução Manual)

Este guia é para executar o deploy completo no terminal da VPS (Hostinger), em sequência, com o que cada comando faz.

## 1) Atualizar sistema e instalar utilitários

```bash
apt update && apt upgrade -y
apt install -y git curl ca-certificates
```

Atualiza pacotes do sistema e instala ferramentas usadas no deploy.

## 2) Criar pasta do projeto

```bash
mkdir -p /var/www/portal
cd /var/www/portal
```

Cria e acessa o diretório padrão da aplicação.

## 3) Clonar/atualizar repositório na branch `main`

```bash
if [ ! -d .git ]; then
  git clone --branch main https://github.com/ocezao/Portal-Economia-Mundial.git .
else
  git fetch origin main
  git checkout main
  git pull --ff-only origin main
fi
```

Garante que o servidor está com a versão mais recente do código.

## 4) Criar arquivo `.env` de produção

```bash
cp .env.example .env
nano .env
```

Cria o arquivo de variáveis sensíveis de produção.

## 5) Preencher variáveis obrigatórias no `.env`

```env
NEXT_PUBLIC_SITE_URL=https://cenariointernacional.com.br
NEXT_PUBLIC_API_BASE_URL=https://api.cenariointernacional.com.br
NEXT_PUBLIC_SUPABASE_URL=SEU_VALOR
NEXT_PUBLIC_SUPABASE_ANON_KEY=SEU_VALOR
SUPABASE_SERVICE_ROLE_KEY=SEU_VALOR
SUPABASE_UPLOAD_BUCKET=media
GNEWS_API_KEY=SEU_VALOR
NEXT_PUBLIC_FINNHUB_API_KEY=SEU_VALOR
FINNHUB_API_KEY=SEU_VALOR
NEXT_PUBLIC_ONESIGNAL_APP_ID=SEU_VALOR
ONESIGNAL_REST_API_KEY=SEU_VALOR
NEXT_PUBLIC_ADSENSE_CLIENT_ID=ca-pub-6096980902806551
NEXT_PUBLIC_ADSENSE_SLOT_INARTICLE=1577639969
CORS_ALLOWED_ORIGINS=https://cenariointernacional.com.br,https://www.cenariointernacional.com.br
MB_DB_HOST=db.aszrihpepmdwmggoqirw.supabase.co
MB_DB_PORT=5432
MB_DB_DBNAME=postgres
MB_DB_USER=postgres
MB_DB_PASS=SEU_DB_PASSWORD

# Metabase: automatizar conexao com o banco via API (opcional)
METABASE_URL=https://metabase.cenariointernacional.com.br
METABASE_API_KEY=SEU_VALOR

# Fonte de dados do Metabase (recomendado: Postgres do Supabase)
SUPABASE_DB_URL=postgresql://postgres:SEU_DB_PASSWORD@db.SEUPROJETO.supabase.co:5432/postgres
```

Define as configurações de app, API, collector, AdSense, OneSignal e Metabase.

## 6) Proteger permissões do `.env`

```bash
chmod 600 .env
```

Restringe leitura do `.env` apenas ao usuário dono.

## 7) Subir stack Docker de produção

```bash
docker compose -f docker-compose.prod.yml --env-file .env up -d --build
```

Sobe containers de aplicação principal, API, collector e Metabase.

## 7.1) Conectar Metabase ao banco (via API, recomendado)

Se vocÃª configurou `METABASE_URL`, `METABASE_API_KEY` e `SUPABASE_DB_URL` no `.env`, rode:

```bash
npm run metabase:setup
```

Isso cria/atualiza no Metabase uma conexÃ£o Postgres apontando para o Supabase e tenta disparar sync/rescan.

IMPORTANTE (Next.js + Supabase no browser)
- Variaveis `NEXT_PUBLIC_*` (ex.: `NEXT_PUBLIC_SUPABASE_URL` / `NEXT_PUBLIC_SUPABASE_ANON_KEY`) sao injetadas no bundle do navegador no momento do build.
- Se voce alterar qualquer `NEXT_PUBLIC_*` no `.env`, voce DEVE rebuildar a imagem e recriar os containers; caso contrario o login pode ficar com "Supabase nao configurado" e nao haver nenhuma requisicao para `*.supabase.co`.

Rebuild recomendado quando mexer em `NEXT_PUBLIC_*`:

```bash
docker compose -f docker-compose.prod.yml --env-file .env build --no-cache web api
docker compose -f docker-compose.prod.yml --env-file .env up -d --force-recreate web api
```

## 8) Validar containers e logs

```bash
docker compose -f docker-compose.prod.yml ps
docker compose -f docker-compose.prod.yml logs --tail=200
```

Confirma status de execução e erros recentes.

## 9) Aplicar configuração Nginx do projeto

```bash
cp deploy/nginx/portal.conf /etc/nginx/sites-available/portal
rm -f /etc/nginx/sites-enabled/default
ln -sf /etc/nginx/sites-available/portal /etc/nginx/sites-enabled/portal
nginx -t
systemctl reload nginx
```

Ativa roteamento por domínio/subdomínio e redirects HTTP para HTTPS.

## 10) Emitir SSL com Certbot

```bash
certbot --nginx \
  --non-interactive --agree-tos \
  -m contato@cenariointernacional.com.br \
  -d cenariointernacional.com.br \
  -d www.cenariointernacional.com.br \
  -d api.cenariointernacional.com.br \
  -d metabase.cenariointernacional.com.br
```

Emite e instala certificados para domínio principal e subdomínios.

## 11) Verificar renovação automática do SSL

```bash
systemctl status certbot.timer --no-pager
```

Garante renovação automática ativa.

## 12) Validar redirects e HTTPS

```bash
curl -I http://cenariointernacional.com.br
curl -I https://cenariointernacional.com.br
curl -I https://www.cenariointernacional.com.br
curl -I http://api.cenariointernacional.com.br
curl -I https://api.cenariointernacional.com.br
curl -I http://metabase.cenariointernacional.com.br
curl -I https://metabase.cenariointernacional.com.br
```

Valida redirecionamentos e disponibilidade HTTPS.

## 13) Validar portas internas obrigatórias

```bash
curl -I http://127.0.0.1:3000/api/health
curl -I http://127.0.0.1:4000/api/health
curl -I http://127.0.0.1:4010/health
curl -I http://127.0.0.1:3001
```

Confirma serviços internos nas portas padrão do projeto.

## 14) Testar evento real no collector

```bash
curl -X POST http://127.0.0.1:4010/collect \
  -H "Content-Type: application/json" \
  -d '[{"v":"1.0.0","event":"collector_vps_test","anonymous":true,"timestamp":1710000000000,"url":"/teste/vps","properties":{"origem":"vps"}}]'
```

Dispara evento real para confirmar gravação no Supabase.

## 7.2) Dashboard principal de tracking (Metabase)

Data: 2026-02-16

- Dashboard principal: `Tracking Completo - Executivo` (ID `3`)
- URL: `https://metabase.cenariointernacional.com.br/dashboard/3-tracking-completo-executivo`
- Filtro global de dias habilitado: `periodo_global`
- Cobertura de mapeamento: `20/20` cards

Para manutencao em lote dos mappings de periodo:

```bash
python3 /root/apply-dashboard-date-filter.py
```

(Referencia do script no repo: `scripts/metabase/apply-dashboard-date-filter.py`)
