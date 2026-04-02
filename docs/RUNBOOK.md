# Runbook de Operacoes

## Escopo

Runbook principal do projeto para producao com Docker Compose e banco local.

Para operacao editorial por agente, use tambem:

- `docs/ops/RUNBOOK_EDITORIAL_LLM.md`

## Informacoes basicas

- dominio principal: `cenariointernacional.com.br`
- projeto ativo na VPS: `/var/www/portal` ou o release promovido para producao
- app principal: Next.js
- banco principal: PostgreSQL local via `DATABASE_URL`
- cron editorial: `POST /api/cron?type=editorial-jobs`

## Comandos basicos da stack

```bash
cd /var/www/portal
docker compose -f docker-compose.yml ps
docker compose -f docker-compose.yml up -d --build
```

## Variaveis criticas

- `DB_NAME`
- `DB_USER`
- `DB_PASSWORD`
- `NEXT_PUBLIC_SITE_URL`
- `NEXT_PUBLIC_API_BASE_URL`
- `GNEWS_API_KEY`
- `NEXT_PUBLIC_FINNHUB_API_KEY`
- `FINNHUB_API_KEY`
- `NEXT_PUBLIC_ONESIGNAL_APP_ID`
- `ONESIGNAL_REST_API_KEY`
- `CORS_ALLOWED_ORIGINS`
- `CRON_API_SECRET`
- `EDITORIAL_API_KEY`
- `SMTP_HOST`
- `SMTP_PORT`
- `SMTP_USER`
- `SMTP_PASS`

## Health checks

Rotas principais:

- `GET /api/health`
- `GET /api/v1/editorial`
- `GET /api/v1/editorial/auth` com credencial valida

## Verificacoes rapidas

### Aplicacao

```bash
curl -I https://cenariointernacional.com.br
curl https://cenariointernacional.com.br/api/health
curl -I https://api.cenariointernacional.com.br/api/health
```

### Stack local

```bash
docker compose -f docker-compose.yml ps
docker compose -f docker-compose.yml logs --tail=100 web api collector database
```

### Editorial API

```bash
curl https://cenariointernacional.com.br/api/v1/editorial
curl -H "Authorization: Bearer $EDITORIAL_API_KEY" \
  https://cenariointernacional.com.br/api/v1/editorial/auth
```

### Cron editorial

```bash
curl -X POST "https://cenariointernacional.com.br/api/cron?type=editorial-jobs" \
  -H "x-cron-secret: $CRON_API_SECRET"
```

## Procedimento de deploy manual

```bash
cd /var/www/portal
git pull --ff-only origin main
docker compose -f docker-compose.yml up -d --build
```

Depois, valide os containers, o health check e os logs da stack.

## Troubleshooting

### 1. `Database pool not available`

Diagnostico:

- `DATABASE_URL` ausente ou invalido
- `DB_NAME`, `DB_USER` ou `DB_PASSWORD` ausentes no `.env`

Acao:

1. verificar o `.env`
2. confirmar que `portal-database` esta healthy
3. reiniciar a stack com `docker compose -f docker-compose.yml up -d --build`

### 2. `UNAUTHORIZED` na API editorial

Diagnostico:

- `EDITORIAL_API_KEY` ausente, incorreta ou base URL errada

Acao:

1. validar o segredo no ambiente do agente
2. chamar `/api/v1/editorial/auth`
3. confirmar que o agente nao esta usando `CRON_API_SECRET`

### 3. `VALIDATION_REQUIRED`

Diagnostico:

- fluxo editorial fora de ordem ou artigo com pendencias

Acao:

1. chamar `/api/v1/editorial/articles/{id}/validate`
2. corrigir erros
3. repetir `approve`
4. repetir `publish` ou `schedule`

### 4. artigo agendado nao publicou

Diagnostico:

- cron nao rodou
- job falhou
- segredo de cron invalido

Acao:

1. chamar `/api/v1/editorial/jobs`
2. verificar jobs `queued` ou `failed`
3. disparar manualmente `POST /api/cron?type=editorial-jobs`
4. revisar logs da aplicacao e do cron

### 5. upload falhando

Diagnostico:

- permissao de escrita
- path de uploads
- arquivo invalido

Acao:

1. revisar permissao do diretorio `public/uploads`
2. verificar tamanho e tipo do arquivo
3. revisar logs do endpoint de upload

## Monitoramento minimo recomendado

- uptime de `/api/health`
- uptime da home
- fila de jobs editoriais
- falhas em cron
- crescimento de uploads
- uso de disco
- status do container `portal-database`

## Backups

O ambiente deve ter backup recorrente de:

1. banco PostgreSQL local
2. diretorio `public/uploads`
3. arquivo de ambiente seguro fora do repositorio

Sem isso, a operacao nao pode ser considerada robusta.

## Limites desta documentacao

Este runbook nao prova que a VPS atual esta normalizada. Ele documenta o fluxo oficial de producao com Docker Compose e banco local. A comprovacao depende de validacao no servidor real.
