# Modelo de Dados PostgreSQL - Analytics First-Party

## DDL Implementado

Este documento descreve o schema real implementado no arquivo `collector/src/db/migrations/0001_init.sql`.

---

## 1. Tabela Principal: events_raw

### Estrutura

```sql
-- Tabela principal de eventos brutos
-- Particionada mensalmente para performance e retenção
CREATE TABLE IF NOT EXISTS events_raw (
    event_id VARCHAR(32) NOT NULL,              -- Hash SHA-256 para deduplicação
    event_time TIMESTAMPTZ NOT NULL,            -- Timestamp do evento (cliente)
    received_at TIMESTAMPTZ DEFAULT NOW(),      -- Timestamp de recebimento
    event_name VARCHAR(100) NOT NULL,           -- Nome do evento (snake_case)
    
    -- Identificadores (pseudonimizados)
    user_id UUID,                               -- NULL se anônimo/LGPD
    session_id UUID,                            -- NULL se anônimo/LGPD
    anonymous BOOLEAN DEFAULT false,            -- Flag LGPD
    
    -- URLs
    url TEXT NOT NULL,                          -- URL completa
    referrer TEXT,                              -- Referrer
    
    -- Payload completo
    properties JSONB DEFAULT '{}',              -- Propriedades específicas
    
    -- Metadados do collector
    ip_hash VARCHAR(16),                        -- Hash SHA-256 do IP (LGPD)
    user_agent_hash VARCHAR(32),                -- Hash do User-Agent
    
    -- Geolocalização (aproximada)
    geo_country VARCHAR(2),                     -- Código do país (ISO 3166-1)
    geo_region VARCHAR(10),                     -- Código da região/estado
    
    -- Dispositivo
    device_type VARCHAR(20),                    -- desktop, tablet, mobile
    browser VARCHAR(50),                        -- Navegador detectado
    
    PRIMARY KEY (event_id, event_time)
) PARTITION BY RANGE (event_time);
```

### Comentários

```sql
COMMENT ON TABLE events_raw IS 'Tabela append-only de eventos brutos. NUNCA atualizar ou deletar registros.';
COMMENT ON COLUMN events_raw.event_id IS 'Hash SHA-256 para deduplicação: hash(event:url:timestamp_bucket:user_id)';
COMMENT ON COLUMN events_raw.user_id IS 'UUID first-party. NULL para eventos anônimos (LGPD opt-out).';
COMMENT ON COLUMN events_raw.ip_hash IS 'Hash SHA-256 do IP com salt. Pseudonimização LGPD.';
```

---

## 2. Particionamento

### Criação de Partições

Partições são criadas automaticamente pelo script `scripts/partition-manager.sh`:

```sql
-- Partição mensal (exemplo: Janeiro 2024)
CREATE TABLE IF NOT EXISTS events_raw_2024_01 
    PARTITION OF events_raw
    FOR VALUES FROM ('2024-01-01') TO ('2024-02-01');

-- Índice único ESSENCIAL para deduplicação (por partição)
CREATE UNIQUE INDEX IF NOT EXISTS events_raw_2024_01_event_id_unique 
    ON events_raw_2024_01(event_id);
```

### Script de Gerenciamento

O `partition-manager.sh`:
1. Cria partições para o mês atual + 3 meses futuros
2. Cria UNIQUE INDEX(event_id) em cada partição
3. Falha se não conseguir criar (set -euo pipefail)

---

## 3. Índices

### Índices na Tabela Pai

```sql
-- Índice para queries por tempo
CREATE INDEX IF NOT EXISTS idx_events_raw_event_time 
    ON events_raw(event_time);

-- Índice para queries por usuário
CREATE INDEX IF NOT EXISTS idx_events_raw_user_id 
    ON events_raw(user_id);

-- Índice para queries por tipo de evento
CREATE INDEX IF NOT EXISTS idx_events_raw_event_name 
    ON events_raw(event_name);

-- Índice para queries por URL
CREATE INDEX IF NOT EXISTS idx_events_raw_url 
    ON events_raw(url);

-- Índice GIN para JSONB (queries flexíveis em properties)
CREATE INDEX IF NOT EXISTS idx_events_raw_properties 
    ON events_raw USING GIN(properties);
```

### Índices por Partição

Cada partição recebe automaticamente:

```sql
-- Único por partição (obrigatório para ON CONFLICT)
CREATE UNIQUE INDEX {partition_name}_event_id_unique 
    ON {partition_name}(event_id);
```

---

## 4. Deduplicação

### Mecanismo

A deduplicação ocorre via `ON CONFLICT` no INSERT:

```typescript
// collector/src/db/insert.ts
const result = await client.query(
  `
  INSERT INTO events_raw (...)
  VALUES (...)
  ON CONFLICT (event_id) DO NOTHING
  RETURNING event_id
  `,
  [...]
);

if (result.rowCount === 0) {
  // Evento duplicado
  duplicates++;
}
```

### Geração do event_id

```typescript
function generateEventId(event: AnalyticsEvent): string {
  // Bucket de 5 segundos para tolerância de tempo
  const bucket = Math.floor(event.timestamp / 5000) * 5000;
  const input = `${event.event}:${event.url}:${bucket}:${event.user_id || 'anon'}`;
  return createHash('sha256').update(input).digest('hex').slice(0, 32);
}
```

---

## 5. Verificação de Partições (Fail-Fast)

O collector verifica no startup (`collector/src/db/partition-check.ts`):

```typescript
export async function checkCurrentPartition(): Promise<void> {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const partitionName = `events_raw_${year}_${month}`;
  
  // Verificar se partição existe
  const partitionResult = await pool.query(`
    SELECT 1 FROM pg_tables 
    WHERE tablename = $1 AND schemaname = 'public'
  `, [partitionName]);
  
  if (partitionResult.rowCount === 0) {
    console.error('ERRO FATAL: Partição não existe!');
    process.exit(1);
  }
  
  // Verificar UNIQUE INDEX
  const indexResult = await pool.query(`
    SELECT 1 FROM pg_indexes 
    WHERE indexname = $1 AND schemaname = 'public'
  `, [`${partitionName}_event_id_unique`]);
  
  if (indexResult.rowCount === 0) {
    console.error('ERRO FATAL: UNIQUE INDEX não existe!');
    process.exit(1);
  }
}
```

---

## 6. Queries Comuns

### Eventos por Período

```sql
-- Eventos das últimas 24 horas
SELECT 
    event_name,
    COUNT(*) as count
FROM events_raw
WHERE event_time > NOW() - INTERVAL '24 hours'
GROUP BY event_name
ORDER BY count DESC;
```

### Deduplicação Confirmada

```sql
-- Verificar se deduplicação funcionou
SELECT 
    url,
    event_name,
    COUNT(*) as count
FROM events_raw
WHERE url = 'https://test.com/article'
GROUP BY url, event_name;
-- Esperado: count = 1 para eventos duplicados
```

### Eventos por Usuário

```sql
-- Jornada de um usuário
SELECT 
    event_time,
    event_name,
    url
FROM events_raw
WHERE user_id = '550e8400-e29b-41d4-a716-446655440000'
ORDER BY event_time;
```

### Performance de Partições

```sql
-- Verificar partições existentes
SELECT 
    tablename,
    pg_size_pretty(pg_total_relation_size(tablename::regclass)) as size
FROM pg_tables
WHERE tablename LIKE 'events_raw_%'
ORDER BY tablename;
```

---

## 7. Manutenção

### Criar Nova Partição (Manual)

```sql
-- Criar partição para próximo mês
CREATE TABLE IF NOT EXISTS events_raw_2024_12 
    PARTITION OF events_raw
    FOR VALUES FROM ('2024-12-01') TO ('2025-01-01');

-- Criar índice único
CREATE UNIQUE INDEX events_raw_2024_12_event_id_unique 
    ON events_raw_2024_12(event_id);
```

### Remover Partição Antiga

```sql
-- Dropar partição (dados são perdidos!)
DROP TABLE IF EXISTS events_raw_2023_01;
```

### Verificar Saúde do Banco

```sql
-- Tamanho por partição
SELECT 
    schemaname,
    tablename,
    pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as size
FROM pg_tables
WHERE tablename LIKE 'events_raw_%'
ORDER BY tablename DESC
LIMIT 10;
```

---

## 8. Variáveis de Ambiente

```bash
# Conexão PostgreSQL
POSTGRES_HOST=postgres
POSTGRES_PORT=5432
POSTGRES_DB=pem_analytics
POSTGRES_USER=analytics
POSTGRES_PASSWORD=dev_password_123

# Pool de conexões
POSTGRES_POOL_MIN=5
POSTGRES_POOL_MAX=20
```

---

## 9. Migrações

### Estrutura

```
collector/src/db/migrations/
└── 0001_init.sql          # Schema inicial
```

### Aplicação Automática

O `docker-compose.yml` monta migrations em `/docker-entrypoint-initdb.d/`, executando automaticamente no primeiro startup do PostgreSQL.

---

**Data de criação:** 2024-01-17  
**Última atualização:** 2024-02-03 (simplificado para schema real)  
**Compatibilidade:** PostgreSQL 15+
