# Collector API - CIN Analytics

API de coleta de eventos de analytics first-party, construída com Fastify e PostgreSQL.

---

## Stack

- **Runtime:** Node.js 18+
- **Framework:** Fastify 4.x
- **Database:** PostgreSQL 15
- **Language:** TypeScript
- **Deploy:** Docker

---

## Estrutura

```
collector/
├── src/
│   ├── server.ts              # Entry point
│   ├── db/
│   │   ├── index.ts           # PostgreSQL pool
│   │   ├── insert.ts          # Batch insert com dedupe
│   │   ├── partition-check.ts # Verificação fail-fast
│   │   └── migrations/
│   │       └── 0001_init.sql  # Schema
│   ├── routes/
│   │   ├── health.ts          # GET /health
│   │   └── collect.ts         # POST /collect
│   └── plugins/
│       ├── rate-limit.ts      # Rate limiting
│       └── dedupe.ts          # LRU cache
├── Dockerfile
├── package.json
└── tsconfig.json
```

---

## Instalação

```bash
# Instalar dependências
npm install

# Build
npm run build

# Dev (com hot reload)
npm run dev

# Produção
npm start
```

---

## Variáveis de Ambiente

```bash
# Obrigatórias
POSTGRES_HOST=localhost
POSTGRES_PORT=5432
POSTGRES_DB=cin_analytics
POSTGRES_USER=analytics
POSTGRES_PASSWORD=senha_segura

# Opcionais
PORT=3000                    # Porta do servidor (default: 3000)
LOG_LEVEL=info               # Nível de log (debug|info|warn|error)
```

---

## Endpoints

### GET /health

Health check do sistema.

**Response:**
```json
{
  "status": "ok",
  "database": "connected"
}
```

### POST /collect

Recebe eventos do cliente.

**Request:**
```bash
curl -X POST http://localhost:3000/collect \
  -H "Content-Type: application/json" \
  -d '[{
    "v": "1.0.0",
    "event": "page_view",
    "user_id": "550e8400-e29b-41d4-a716-446655440000",
    "session_id": "6ba7b810-9dad-11d1-80b4-00c04fd430c8",
    "anonymous": false,
    "timestamp": 1710000000000,
    "url": "https://example.com/article",
    "properties": {"page_type": "article"}
  }]'
```

**Response:**
- `204 No Content` - Evento aceito
- `400 Bad Request` - Payload inválido
- `429 Too Many Requests` - Rate limit excedido

---

## Deduplicação

A deduplicação ocorre em duas camadas:

1. **Database:** `ON CONFLICT (event_id) DO NOTHING`
2. **Memory:** LRU cache para eventos recentes (LRU)

O `event_id` é um hash SHA-256 de:
```
sha256(`${event}:${url}:${timestamp_bucket}:${user_id}`)
```

O `timestamp_bucket` arredonda o timestamp para múltiplos de 5 segundos.

---

## Fail-Fast

O collector verifica no startup:

1. Partição do mês atual existe (`events_raw_YYYY_MM`)
2. UNIQUE INDEX(event_id) existe na partição

Se alguma verificação falhar, o processo encerra com `exit 1)`.

---

## Docker

```bash
# Build
docker build -t cin-collector .

# Run
docker run -p 3000:3000 \
  -e POSTGRES_HOST=postgres \
  -e POSTGRES_PASSWORD=secret \
  cin-collector
```

---

## Testes

```bash
# Testes de integração (requer PostgreSQL rodando)
npm test
```

---

## Referências

- [`docs/04-analytics-first-party.md`](../docs/04-analytics-first-party.md) - Arquitetura geral
- [`docs/09-event-schema.md`](../docs/09-event-schema.md) - Schema de eventos
- [`docs/10-data-model-postgres.md`](../docs/10-data-model-postgres.md) - Modelo de dados
- [`docs/14-deploy.md`](../docs/14-deploy.md) - Guia de deploy
