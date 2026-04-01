# Runbook de Operacoes

## Escopo

Runbook principal do projeto para ambiente de producao.

Para operacao editorial por agente, use tambem:

- `docs/ops/RUNBOOK_EDITORIAL_LLM.md`

## Informacoes basicas

- dominio principal: `cenariointernacional.com.br`
- projeto esperado na VPS: `/var/www/portal`
- app principal: Next.js
- banco principal: PostgreSQL local via `DATABASE_URL`
- cron editorial: `/api/cron?type=editorial-jobs`

## Comandos basicos da aplicacao

```bash
cd /var/www/portal
npm run build
npm start
```

Se estiver usando Docker ou outro supervisor, adapte o comando ao processo real da VPS.

## Variaveis criticas

- `DATABASE_URL`
- `NEXT_PUBLIC_SITE_URL`
- `EDITORIAL_API_KEY`
- `CRON_API_SECRET`
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
git pull origin main
npm ci
npm run build
```

Depois, reinicie o processo da aplicacao conforme o gerenciador usado na VPS.

## Troubleshooting

### 1. `Database pool not available`

Diagnostico:

- `DATABASE_URL` ausente ou invalido

Acao:

1. verificar ambiente do processo
2. confirmar conectividade com PostgreSQL
3. reiniciar a aplicacao apos corrigir a variavel

### 2. `UNAUTHORIZED` na API editorial

Diagnostico:

- `EDITORIAL_API_KEY` ausente, incorreta ou base URL errada

Acao:

1. validar segredo no ambiente do agente
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
3. disparar manualmente `/api/cron?type=editorial-jobs`
4. revisar logs da aplicacao

### 5. upload falhando

Diagnostico:

- permissao de escrita
- path de uploads
- arquivo invalido

Acao:

1. revisar permissao do diretorio de uploads
2. verificar tamanho e tipo do arquivo
3. revisar logs do endpoint de upload

## Monitoramento minimo recomendado

- uptime de `/api/health`
- uptime da home
- fila de jobs editoriais
- falhas em cron
- crescimento de uploads
- uso de disco

## Backups

O ambiente deve ter backup recorrente de:

1. banco PostgreSQL
2. diretorio `public/uploads`
3. arquivo de ambiente seguro fora do repositorio

Sem isso, a operacao nao pode ser considerada robusta.

## Limites desta documentacao

Este runbook nao prova que a VPS atual esta normalizada. Ele documenta o que deve existir e como operar a stack atual. A comprovacao depende de validacao no servidor real.
