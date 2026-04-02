# Guia de Deploy Seguro

Este guia cobre o fluxo oficial de producao com Docker Compose e banco local.

## Checklist pre-deploy

- segredos apenas em `.env`
- validar `DB_NAME`, `DB_USER` e `DB_PASSWORD`
- validar `NEXT_PUBLIC_SITE_URL` e `NEXT_PUBLIC_API_BASE_URL`
- validar `CRON_API_SECRET` e `EDITORIAL_API_KEY`
- revisar logs e variaveis antes de subir a stack
- executar `docker compose -f docker-compose.yml config`

## Seguranca da stack

- `database` roda localmente na VPS
- `web`, `api` e `collector` usam `DATABASE_URL` montado pelo Compose
- `supabase/migrations/` e `supabase/functions/` sao historicos de schema e utilitarios
- PM2 nao faz parte do fluxo oficial

## Nginx

Use o reverse proxy do projeto com os servicos expostos nas portas:

- `3000` para `web`
- `4000` para `api`
- `4010` para `collector`
- `3001` para `metabase`

## Testes pos-deploy

```bash
curl -I https://cenariointernacional.com.br
curl -I https://api.cenariointernacional.com.br/api/health
curl http://127.0.0.1:3000/api/health
curl http://127.0.0.1:4000/api/health
curl http://127.0.0.1:4010/health
```

```bash
docker compose -f docker-compose.yml ps
docker compose -f docker-compose.yml logs --tail=100 web api collector database
```

## Resposta a incidentes

- se o banco cair, verificar o container `portal-database`
- se o `healthcheck` falhar, testar `127.0.0.1` dentro do container
- se a aplicacao subir degradada, revisar `DATABASE_URL`, heap e logs da stack
- se o deploy precisar de rollback, restaurar o release anterior e recriar a stack
