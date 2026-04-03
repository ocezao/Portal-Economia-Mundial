# Collector API - Analytics (Postgres)

API de coleta de eventos first-party com Fastify gravando direto no Postgres local.

## Stack

- Runtime: Node.js 18+
- Framework: Fastify
- Persistência: Postgres (`analytics_events`)

## Variáveis obrigatórias

```bash
DATABASE_URL=postgresql://user:senha@localhost:5432/banco
CORS_ALLOWED_ORIGINS=https://cenariointernacional.com.br,https://www.cenariointernacional.com.br
PORT=4010
LOG_LEVEL=info
```

## Endpoints

- `GET /health`
- `POST /collect`

## Exemplo de evento

```bash
curl -X POST http://localhost:4010/collect \
  -H "Content-Type: application/json" \
  -d '[{"v":"1.0.0","event":"page_view","anonymous":true,"timestamp":1710000000000,"url":"/noticia/teste"}]'
```

Resposta esperada: `204 No Content`.
