# Cenario Internacional

Aplicacao Next.js com PostgreSQL local, autenticacao por sessao HTTP-only, uploads em disco e deploy em Docker + Nginx.

## Estrutura principal

```text
/src
/collector
/database
/docs
/nginx
/scripts
```

## Variaveis principais

```bash
NEXT_PUBLIC_SITE_URL=
NEXT_PUBLIC_API_BASE_URL=
DATABASE_URL=
CRON_API_SECRET=
LOCAL_AUTH_SECRET=
AUTH_SESSION_SECRET=
EDITORIAL_API_KEY=
UPLOADS_DIR=
NEXT_PUBLIC_FINNHUB_API_KEY=
FINNHUB_API_KEY=
GNEWS_API_KEY=
```

As demais variaveis opcionais estao em `.env.example`.

## Desenvolvimento

```bash
npm install
npm run build
```

## Deploy oficial

1. Preencha o `.env` de producao.
2. Rode `npm run deploy:check`.
3. Suba com `docker compose -f docker-compose.prod.yml --env-file .env up -d --build`.
4. Aplique `deploy/nginx/portal.conf`.

## Referencia

- `docs/audits/AUDITORIA_REPOSITORIO_2026-04-03.md`
