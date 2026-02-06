# Governança de Dados - Analytics First-Party

## Visão Geral

Este documento estabelece as políticas, convenções e responsabilidades para garantir a qualidade, consistência e rastreabilidade dos dados do sistema de analytics do Portal Econômico Mundial.

---

## 1. Camadas de Dados (Data Layers)

### 1.1 Definição das Camadas

```
┌─────────────────────────────────────────────────────────────────┐
│                     CAMADAS DE DADOS                             │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌──────────────┐     ┌──────────────┐     ┌──────────────┐    │
│  │   RAW        │────▶│   AGGREGATED │────▶│   DERIVED    │    │
│  │   (Bronze)   │     │   (Silver)   │     │   (Gold)     │    │
│  └──────────────┘     └──────────────┘     └──────────────┘    │
│         │                    │                    │             │
│    Imutável            Atualizável           Calculado          │
│    Append-only         Idempotente           Ephemeral          │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### 1.2 Camada RAW (Bronze)

**Definição:** Dados brutos exatamente como recebidos do cliente.

| Característica | Descrição |
|----------------|-----------|
| **Imutabilidade** | ❌ NUNCA atualizado ou deletado |
| **Operação** | Apenas INSERT (append-only) |
| **Retenção** | 25 meses (LGPD) |
| **Particionamento** | Por mês (`events_2024_01`) |
| **Formato** | JSONB completo preservado |

**Esquema:**
```sql
CREATE TABLE events_raw (
  id BIGSERIAL,
  received_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  payload JSONB NOT NULL,           -- Payload completo original
  payload_hash VARCHAR(64),         -- SHA-256 para deduplicação
  schema_version VARCHAR(10),       -- v: "1.0"
  event_name VARCHAR(50),           -- event: "page_view"
  user_id UUID,                     -- user_id (indexado)
  session_id UUID,                  -- session_id (indexado)
  event_timestamp TIMESTAMPTZ,      -- timestamp do evento
  -- Metadados do collector
  ip_hash VARCHAR(64),              -- IP anonimizado
  user_agent_hash VARCHAR(64),      -- UA hash
  processing_metadata JSONB         -- Info de processamento
) PARTITION BY RANGE (received_at);
```

**Regras de Ouro RAW:**
1. ✅ **Nunca modifique** dados já inseridos
2. ✅ **Nunca delete** registros (soft-delete apenas via flag)
3. ✅ **Sempre preserve** o payload JSONB original
4. ✅ **Sempre armazene** timestamp de recebimento

---

### 1.3 Camada AGGREGATED (Silver)

**Definição:** Dados limpos, normalizados e agregados para análise.

| Característica | Descrição |
|----------------|-----------|
| **Fonte** | Derived from RAW |
| **Operação** | INSERT + UPDATE (idempotente) |
| **Retenção** | 25 meses |
| **Atualização** | Batch a cada 1 hora |
| **Consistência** | Pode ser reprocessado do RAW |

**Tabelas Principais:**
```sql
-- Sessões normalizadas
CREATE TABLE sessions (
  session_id UUID PRIMARY KEY,
  user_id UUID NOT NULL,
  started_at TIMESTAMPTZ,
  ended_at TIMESTAMPTZ,
  duration_seconds INTEGER,
  pageviews INTEGER DEFAULT 0,
  events_count INTEGER DEFAULT 0,
  device_type VARCHAR(20),
  traffic_source VARCHAR(100),
  landing_page VARCHAR(2048),
  exit_page VARCHAR(2048),
  is_bounce BOOLEAN DEFAULT FALSE,
  country VARCHAR(2),              -- ISO code (GeoIP)
  -- Metadados
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  raw_event_ids BIGINT[]           -- Referência aos eventos RAW
);

-- Page views normalizados
CREATE TABLE page_views (
  id BIGSERIAL,
  view_id UUID UNIQUE,             -- Gerado deterministicamente
  session_id UUID REFERENCES sessions,
  user_id UUID,
  url_path VARCHAR(2048),
  url_query VARCHAR(2048),
  referrer_host VARCHAR(500),
  referrer_path VARCHAR(2048),
  duration_seconds INTEGER,
  scroll_depth INTEGER,
  timestamp TIMESTAMPTZ,
  device JSONB,
  properties JSONB
);

-- Artigos - métricas agregadas
CREATE TABLE article_metrics (
  article_id VARCHAR(100) PRIMARY KEY,
  date DATE,
  total_views INTEGER DEFAULT 0,
  unique_viewers INTEGER DEFAULT 0,
  avg_time_spent DECIMAL(10,2),
  completion_rate DECIMAL(5,2),     -- % que leu 100%
  scroll_50_count INTEGER DEFAULT 0,
  scroll_100_count INTEGER DEFAULT 0,
  last_updated TIMESTAMPTZ
);
```

**Regras de Ouro AGGREGATED:**
1. ✅ **Sempre pode ser reprocessado** a partir do RAW
2. ✅ **Idempotente:** Mesmo input = Mesmo output
3. ✅ **Nunca dependa** de outros dados agregados
4. ✅ **Sempre mantenha** referência ao RAW (event_ids)

---

### 1.4 Camada DERIVED (Gold)

**Definição:** Dados calculados, métricas de negócio e datasets para BI.

| Característica | Descrição |
|----------------|-----------|
| **Fonte** | Derived from AGGREGATED |
| **Operação** | Recreate (DROP + CREATE) ou UPDATE |
| **Retenção** | Variável (1-12 meses) |
| **Atualização** | Scheduled (diário/hora) |
| **Performance** | Otimizado para queries BI |

**Tabelas/Materialized Views:**
```sql
-- Métricas diárias materializadas
CREATE MATERIALIZED VIEW mv_daily_kpis AS
SELECT 
  DATE(started_at) as date,
  COUNT(DISTINCT session_id) as sessions,
  COUNT(DISTINCT user_id) as unique_users,
  SUM(pageviews) as total_pageviews,
  AVG(duration_seconds) as avg_session_duration,
  SUM(CASE WHEN is_bounce THEN 1 ELSE 0 END)::FLOAT / COUNT(*) as bounce_rate,
  -- Categorias de dispositivo
  COUNT(*) FILTER (WHERE device_type = 'mobile') as mobile_sessions,
  COUNT(*) FILTER (WHERE device_type = 'desktop') as desktop_sessions
FROM sessions
WHERE started_at >= CURRENT_DATE - INTERVAL '90 days'
GROUP BY DATE(started_at);

-- Cohorts de retenção
CREATE TABLE cohort_retention (
  cohort_date DATE,                -- Data do primeiro acesso
  days_since INTEGER,              -- Dias desde cohort
  total_users INTEGER,             -- Total no cohort
  active_users INTEGER,            -- Ativos em days_since
  retention_rate DECIMAL(5,2)      -- % ativos
);

-- Funnels pré-calculados
CREATE TABLE funnel_steps (
  funnel_name VARCHAR(50),
  step_order INTEGER,
  step_name VARCHAR(100),
  date DATE,
  users_count INTEGER,
  conversion_rate DECIMAL(5,2)
);
```

**Regras de Ouro DERIVED:**
1. ✅ **Pode ser destruído e recriado** sem perda de dados
2. ✅ **Nunca armazene** dados que não existam em AGGREGATED
3. ✅ **Sempre documente** a fórmula de cálculo
4. ✅ **Versão** datasets importantes (v1, v2, etc)

---

### 1.5 Tabela de Responsabilidade

| Camada | Owner | Operações Permitidas | SLA de Retenção |
|--------|-------|---------------------|-----------------|
| **RAW** | Collector | INSERT apenas | 25 meses (LGPD) |
| **AGGREGATED** | ETL Pipeline | INSERT, UPDATE, DELETE (reprocessamento) | 25 meses |
| **DERIVED** | BI Team | DROP, CREATE, UPDATE | Variável (configurável) |

---

## 2. Regras de Processamento

### 2.1 Append-Only (Camada RAW)

**Definição:** Dados da camada RAW são imutáveis e apenas incrementais.

```sql
-- ✅ CORRETO: Apenas INSERT
INSERT INTO events_raw (payload, received_at, ...)
VALUES ('{"event": "page_view"...}', NOW(), ...);

-- ❌ PROIBIDO: NUNCA faça isso
UPDATE events_raw SET payload = ... WHERE id = 1;
DELETE FROM events_raw WHERE received_at < '2024-01-01';
```

**Exceções (LGPD):**
```sql
-- ✅ Permitted: Deleção por solicitação do usuário (LGPD)
-- Criar view filtrada em vez de DELETE físico
CREATE VIEW events_raw_compliant AS
SELECT * FROM events_raw
WHERE user_id NOT IN (SELECT user_id FROM lgpd_deletion_requests);
```

**Política de Correção de Erros:**
```
Erro detectado no RAW:
├── NÃO corrija o dado original
├── Insira novo registro corrigido (se aplicável)
└── Documente na tabela de auditoria

Exemplo:
├── Evento duplicado detectado
├── Mantenha ambos no RAW (imutável)
└── Deduplique na camada AGGREGATED
```

---

### 2.2 Reprocessamento

**Definição:** Recalcular camadas superiores a partir do RAW.

#### Quando Reprocessar

| Cenário | Ação | Camadas |
|---------|------|---------|
| Bug no ETL | Reprocessar período afetado | AGGREGATED + DERIVED |
| Novo campo adicionado | Reprocessar desde início | AGGREGATED + DERIVED |
| Mudança de regra de negócio | Reprocessar período relevante | DERIVED apenas |
| Dados faltantes identificados | Reprocessar período | AGGREGATED + DERIVED |

#### Processo de Reprocessamento

```sql
-- 1. Identificar período afetado
SELECT MIN(received_at), MAX(received_at)
FROM events_raw
WHERE event_name = 'article_read'
  AND payload->>'properties' IS NULL;

-- 2. Criar tabela temporária com dados corrigidos
CREATE TEMP TABLE sessions_fixed AS
SELECT 
  session_id,
  -- Correções aplicadas
  CASE 
    WHEN device_type IS NULL THEN 'unknown'
    ELSE device_type
  END as device_type_fixed
FROM sessions
WHERE created_at BETWEEN '2024-01-01' AND '2024-01-31';

-- 3. Atualizar (idempotente)
UPDATE sessions s
SET 
  device_type = sf.device_type_fixed,
  updated_at = NOW()
FROM sessions_fixed sf
WHERE s.session_id = sf.session_id;

-- 4. Invalidar/Atualizar camada DERIVED
REFRESH MATERIALIZED VIEW mv_daily_kpis;
```

#### Idempotência

Toda transformação AGGREGATED → DERIVED deve ser **idempotente**:

```sql
-- ✅ IDEMPOTENTE: Mesmo resultado se executar N vezes
INSERT INTO sessions (session_id, user_id, started_at)
SELECT 
  session_id,
  MAX(user_id) as user_id,
  MIN(event_timestamp) as started_at
FROM events_raw
WHERE event_name = 'session_start'
GROUP BY session_id
ON CONFLICT (session_id) DO UPDATE SET
  started_at = EXCLUDED.started_at,
  updated_at = NOW();

-- ❌ NÃO-IDEMPOTENTE: Cria duplicatas se executar novamente
INSERT INTO sessions (session_id, user_id, started_at)
SELECT session_id, user_id, event_timestamp
FROM events_raw
WHERE event_name = 'session_start';
```

---

### 2.3 Correção de Bugs Históricos

#### Estratégia de Correção

**Nível 1: Bug no DERIVED (Mais Comum)**
```
Problema: Fórmula de bounce rate incorreta
Impacto: Dashboards BI
Solução: 
  1. Corrigir fórmula
  2. REFRESH MATERIALIZED VIEW
  3. Reprocessar período afetado (1-7 dias)
```

**Nível 2: Bug no AGGREGATED**
```
Problema: Device type sendo classificado incorretamente
Impacto: Sessões
Solução:
  1. Corrigir lógica de ETL
  2. Identificar período afetado
  3. Reprocessar sessões do período
  4. Invalidar DERIVED dependentes
```

**Nível 3: Bug no RAW (Raro, Crítico)**
```
Problema: Dados corrompidos no collector
Impacto: Todos os dados do período
Solução:
  1. NÃO modifique RAW
  2. Se possível, recuperar de backup
  3. Criar tabela events_raw_corrected
  4. ETL usar JOIN com correções
```

#### Registro de Correções

```sql
-- Tabela de auditoria de correções
CREATE TABLE data_corrections (
  id SERIAL PRIMARY KEY,
  correction_date TIMESTAMPTZ DEFAULT NOW(),
  layer VARCHAR(20),               -- 'AGGREGATED' | 'DERIVED'
  affected_table VARCHAR(100),
  date_range_start DATE,
  date_range_end DATE,
  reason TEXT,
  sql_applied TEXT,
  rows_affected INTEGER,
  validated_by VARCHAR(100),
  jira_ticket VARCHAR(50)
);

-- Exemplo de registro
INSERT INTO data_corrections VALUES (
  NOW(),
  'DERIVED',
  'mv_daily_kpis',
  '2024-01-01',
  '2024-01-15',
  'Correção no cálculo de bounce rate - ticket ANA-123',
  'REFRESH MATERIALIZED VIEW mv_daily_kpis;',
  15,
  'joao.silva',
  'ANA-123'
);
```

---

## 3. Convenções de Nomenclatura

### 3.1 Eventos

#### Regras Gerais
- ** snake_case** (minúsculas com underline)
- **Verbo + Substantivo** ou **Substantivo + Verbo**
- **Máximo 50 caracteres**
- **Sem prefixos/sufixos desnecessários**

#### Padrões por Categoria

| Categoria | Padrão | Exemplos |
|-----------|--------|----------|
| **Navegação** | `page_{ação}` | `page_view`, `page_scroll`, `page_exit` |
| **Conteúdo** | `{conteúdo}_{ação}` | `article_read_start`, `article_read_complete`, `video_play`, `video_pause` |
| **Engajamento** | `{elemento}_{ação}` | `button_click`, `form_submit`, `search_execute` |
| **Performance** | `perf_{métrica}` | `perf_web_vital`, `perf_resource_load` |
| **Erros** | `error_{tipo}` | `error_js`, `error_api`, `error_resource` |

#### Lista Oficial de Eventos (MVP)

```yaml
# Navegação
page_view:
  description: Visualização de página
  category: navigation
  
session_start:
  description: Início de nova sessão
  category: navigation
  
session_end:
  description: Fim de sessão (heartbeat timeout)
  category: navigation

# Conteúdo Editorial
article_read_start:
  description: Usuário começou a ler (scroll 10%)
  category: content
  
article_read_progress:
  description: Progresso de leitura (25%, 50%, 75%, 100%)
  category: content
  properties:
    - scroll_depth: integer  # 25, 50, 75, 100
    
article_read_complete:
  description: Leitura completa (tempo + scroll 80%)
  category: content
  
article_time_spent:
  description: Tempo total no artigo
  category: content
  properties:
    - seconds: integer

# Mídia
video_play:
  description: Início de reprodução de vídeo
  category: media
  
video_progress:
  description: Progresso do vídeo
  category: media
  properties:
    - percent: integer  # 25, 50, 75, 100

# Engajamento
click:
  description: Clique em elemento interativo
  category: engagement
  properties:
    - element_id: string
    - element_type: string  # button, link, card
    
scroll_depth:
  description: Profundidade máxima de scroll
  category: engagement
  properties:
    - depth_percent: integer

search_execute:
  description: Execução de busca
  category: engagement
  properties:
    - query: string
    - results_count: integer

# Performance
perf_web_vital:
  description: Core Web Vital medido
  category: performance
  properties:
    - name: string  # LCP, FID, CLS, INP, TTFB
    - value: number
    - rating: string  # good, needs-improvement, poor

# Erros
error_js:
  description: Erro JavaScript não tratado
  category: error
  properties:
    - message: string
    - source: string
    - line: integer
```

---

### 3.2 Propriedades

#### Regras Gerais
- **snake_case** minúsculas
- **Sem abreviações** (exceto convenções estabelecidas)
- **Unidades no nome** quando aplicável
- **Consistência temporal:** use `_seconds`, `_ms`, `_at`

#### Padrões de Sufixo

| Sufixo | Uso | Exemplo |
|--------|-----|---------|
| `_id` | Identificadores únicos | `article_id`, `user_id` |
| `_at` | Timestamps | `created_at`, `updated_at` |
| `_count` | Contadores inteiros | `pageviews_count`, `clicks_count` |
| `_seconds` | Duração em segundos | `time_spent_seconds` |
| `_ms` | Duração em milissegundos | `load_time_ms` |
| `_percent` | Porcentagem (0-100) | `scroll_depth_percent` |
| `_rate` | Taxa/Razão (0.0-1.0) | `conversion_rate` |
| `_type` | Categorização | `device_type`, `content_type` |
| `_hash` | Valor hash (SHA-256) | `ip_hash`, `ua_hash` |
| `_url` | URLs completas | `page_url`, `referrer_url` |
| `_path` | Path de URL | `page_path` |
| `_host` | Hostname | `referrer_host` |

#### Propriedades Comuns (Toda Requisição)

```json
{
  "v": "1.0",
  "event": "page_view",
  "event_v": "1.0",
  "user_id": "uuid",
  "session_id": "uuid",
  "timestamp": 1704393600000,
  "url": "https://...",
  "referrer": "https://...",
  "properties": { ... },
  "device": {
    "type": "desktop",
    "viewport_width": 1920,
    "viewport_height": 1080,
    "language": "pt-BR",
    "timezone": "America/Sao_Paulo"
  }
}
```

#### Propriedades Específicas por Evento

```yaml
# article_read_progress
scroll_depth_percent:
  type: integer
  range: [0, 100]
  description: Porcentagem de scroll na página

time_spent_seconds:
  type: integer
  min: 0
  description: Tempo gasto na página em segundos

article_id:
  type: string
  max_length: 100
  description: Slug ou identificador único do artigo

category:
  type: enum
  values: [economia, geopolitica, tecnologia]
  description: Categoria editorial do conteúdo

# perf_web_vital
vital_name:
  type: enum
  values: [LCP, FID, CLS, INP, TTFB, FCP]
  description: Nome do Core Web Vital

vital_value:
  type: number
  description: Valor medido (milisegundos ou score)

vital_rating:
  type: enum
  values: [good, needs-improvement, poor]
  description: Classificação do valor
```

---

### 3.3 Tabelas e Colunas (Banco de Dados)

#### Convenções SQL

| Elemento | Convenção | Exemplo |
|----------|-----------|---------|
| **Tabelas** | snake_case, plural | `events_raw`, `sessions`, `page_views` |
| **Colunas** | snake_case | `user_id`, `created_at` |
| **Índices** | idx_{tabela}_{colunas} | `idx_events_user_timestamp` |
| **Constraints** | fk_{tabela}_{ref} | `fk_sessions_user_id` |
| **Views** | vw_{descrição} | `vw_daily_metrics` |
| **Materialized Views** | mv_{descrição} | `mv_monthly_kpis` |
| **Funções** | fn_{ação}_{objeto} | `fn_calculate_bounce_rate` |
| **Triggers** | tr_{tabela}_{ação} | `tr_events_update_timestamp` |

#### Prefixos de Tabela

| Prefixo | Uso | Exemplo |
|---------|-----|---------|
| `events_` | Tabelas de eventos brutos | `events_raw`, `events_2024_01` |
| `stg_` | Staging (temporário) | `stg_sessions_processing` |
| `dim_` | Dimensões (star schema) | `dim_users`, `dim_articles` |
| `fact_` | Fatos (star schema) | `fact_pageviews` |
| `lgpd_` | LGPD/compliance | `lgpd_deletion_requests` |

---

## 4. Fluxo de Dados (Raw → Aggregated → BI)

### 4.1 Diagrama de Fluxo

```
┌─────────────────────────────────────────────────────────────────────┐
│                         FLUXO DE DADOS                              │
└─────────────────────────────────────────────────────────────────────┘

[CLIENTE]
    │
    │ POST /collect
    │ {event, user_id, timestamp, ...}
    ▼
┌─────────────────┐
│   COLLECTOR     │  ◄── Validação Schema
│   (Node.js)     │  ◄── Rate Limiting
└────────┬────────┘  ◄── Deduplicação
         │
         │ INSERT (append-only)
         │
         ▼
┌─────────────────────────┐     ┌─────────────────────────┐
│      EVENTS_RAW         │     │   DEDUPLICATION_CACHE   │
│   (PostgreSQL -         │◄────┤   (Redis/Memória)       │
│    Particionado)        │     │   TTL: 60 segundos      │
│                         │     └─────────────────────────┘
│  • payload JSONB        │
│  • schema_version       │
│  • received_at          │
│  • ip_hash              │
└────────┬────────────────┘
         │
         │ ETL Pipeline (a cada 1h)
         │
         ▼
┌─────────────────────────┐
│     STG_PREPROCESS      │  ◄── Normalização
│     (Temp Table)        │  ◄── Limpeza
└────────┬────────────────┘  ◄── Enriquecimento
         │
         │ INSERT / UPDATE
         │
         ▼
┌─────────────────────────┐
│       SESSIONS          │
│       PAGE_VIEWS        │  ◄── Dados normalizados
│    ARTICLE_METRICS      │  ◄── Referência a RAW
│                         │
│  • Idempotente          │
│  • Atualizável          │
│  • Indexado para BI     │
└────────┬────────────────┘
         │
         │ Aggregation Job (a cada 6h)
         │
         ▼
┌─────────────────────────┐
│   MV_DAILY_KPIS         │
│   COHORT_RETENTION      │  ◄── Métricas calculadas
│   FUNNEL_STEPS          │  ◄── Otimizado para query
│                         │
│  • Materialized Views   │
│  • Pré-agregado         │
│  • Fast query           │
└────────┬────────────────┘
         │
         │ Metabase / BI Tool
         │
         ▼
┌─────────────────────────┐
│      DASHBOARDS         │
│    • Real-time          │
│    • Editorial          │
│    • Performance        │
└─────────────────────────┘
```

### 4.2 Detalhamento das Etapas

#### Etapa 1: Ingestão (Real-time)
```sql
-- O collector insere na tabela particionada
INSERT INTO events_raw (
  received_at,
  payload,
  payload_hash,
  schema_version,
  event_name,
  user_id,
  session_id,
  event_timestamp,
  ip_hash,
  user_agent_hash
) VALUES (
  NOW(),
  '{"event": "page_view", ...}',
  'a1b2c3...',  -- SHA-256 do payload
  '1.0',
  'page_view',
  '550e8400-...',
  '6ba7b810-...',
  '2024-01-15 10:30:00',
  'hash_do_ip',
  'hash_do_ua'
);
```

#### Etapa 2: ETL Hourly
```sql
-- Stored procedure executada a cada hora
CREATE OR REPLACE PROCEDURE etl_hourly_sessions()
LANGUAGE plpgsql AS $$
DECLARE
  last_processed TIMESTAMPTZ;
BEGIN
  -- Pega último timestamp processado
  SELECT MAX(updated_at) INTO last_processed FROM etl_watermark WHERE table_name = 'sessions';
  
  -- Insere/atualiza sessões
  INSERT INTO sessions (
    session_id, user_id, started_at, device_type, raw_event_ids
  )
  SELECT 
    session_id,
    MAX(user_id),
    MIN(event_timestamp),
    MODE() WITHIN GROUP (ORDER BY payload->'device'->>'type'),
    ARRAY_AGG(id)
  FROM events_raw
  WHERE event_name = 'session_start'
    AND received_at > last_processed
  GROUP BY session_id
  ON CONFLICT (session_id) DO UPDATE SET
    ended_at = EXCLUDED.started_at + INTERVAL '30 minutes',
    pageviews = (
      SELECT COUNT(*) FROM events_raw e2 
      WHERE e2.session_id = EXCLUDED.session_id 
        AND e2.event_name = 'page_view'
    ),
    updated_at = NOW();
  
  -- Atualiza watermark
  UPDATE etl_watermark SET updated_at = NOW() WHERE table_name = 'sessions';
END;
$$;
```

#### Etapa 3: Agregação BI (6h)
```sql
-- Refresh das materialized views
REFRESH MATERIALIZED VIEW CONCURRENTLY mv_daily_kpis;
REFRESH MATERIALIZED VIEW CONCURRENTLY mv_cohort_retention;
```

---

## 5. Checklist Operacional

### 5.1 Daily Operations

```markdown
## Checklist Diário - Analytics

### Manhã (09:00)
- [ ] Verificar lag do ETL (deve ser < 1h)
  ```sql
  SELECT MAX(received_at) - MAX(processed_at) as lag 
  FROM events_raw WHERE received_at > NOW() - INTERVAL '1 day';
  ```
- [ ] Validar volume de eventos (comparar com média 7 dias)
- [ ] Verificar taxa de erro do collector (< 0.1%)
- [ ] Conferir rate limiting (bloqueios legítimos vs. abuso)

### Tarde (15:00)
- [ ] Dashboard Metabase acessível e atualizado
- [ ] Nenhum alerta de performance ativo
- [ ] Backups automáticos executados (verificar logs)

### Noite (22:00)
- [ ] ETL diário completo (verificar `etl_watermark`)
- [ ] Materialized views atualizadas
- [ ] Verificar espaço em disco (< 80%)
```

### 5.2 Weekly Review

```markdown
## Checklist Semanal

### Segunda-feira
- [ ] Revisar dados da semana anterior
- [ ] Validar consistência entre RAW e AGGREGATED
  ```sql
  -- Verificação de integridade
  SELECT 
    DATE(received_at) as date,
    COUNT(*) as raw_count,
    (SELECT COUNT(*) FROM sessions WHERE DATE(started_at) = DATE(e.received_at)) as sessions_count
  FROM events_raw e
  WHERE received_at > NOW() - INTERVAL '7 days'
  GROUP BY DATE(received_at)
  ORDER BY date DESC;
  ```
- [ ] Analisar eventos com maior taxa de erro

### Quarta-feira
- [ ] Revisar dashboards de negócio
- [ ] Validar métricas críticas (bounce rate, tempo médio)
- [ ] Verificar anomalias detectadas

### Sexta-feira
- [ ] Preparar relatório de saúde do sistema
- [ ] Planejar manutenções da próxima semana
- [ ] Revisar LGPD: solicitações de deleção pendentes
```

### 5.3 Monthly Governance

```markdown
## Checklist Mensal - Governança

### Revisão de Dados
- [ ] Auditoria de retenção (dados > 25 meses deletados)
- [ ] Análise de crescimento de storage
- [ ] Otimização de índices (REINDEX se necessário)
- [ ] Validar particionamento (criar partições próximos meses)

### Qualidade
- [ ] Taxa de eventos válidos (> 99%)
- [ ] Taxa de duplicatas (< 0.1%)
- [ ] Completude de campos obrigatórios (> 99.5%)
- [ ] Latência p95 (< 100ms)

### Documentação
- [ ] Atualizar catálogo de dados se houver novos campos
- [ ] Revisar e atualizar runbooks
- [ ] Documentar quaisquer incidentes ou anomalias

### Planejamento
- [ ] Projeção de crescimento para próximo trimestre
- [ ] Revisar necessidade de reprocessamento histórico
- [ ] Atualizar roadmap de evolução do schema
```

### 5.4 Incident Response

```markdown
## Playbook de Incidentes

### Severity 1 - Dados Corrompidos
**Critérios:** Perda de dados, dados incorretos em produção há > 24h

**Ações:**
1. [ ] Pare o pipeline ETL imediatamente
2. [ ] Identifique o período afetado
3. [ ] Notifique stakeholders (Slack #analytics-alerts)
4. [ ] Inicie reprocessamento do RAW
5. [ ] Valide correção antes de reativar pipeline

### Severity 2 - Performance Degradada
**Critérios:** Latência > 500ms, ETL lag > 3h

**Ações:**
1. [ ] Verificar carga no PostgreSQL (slow queries)
2. [ ] Verificar conectividade collector → DB
3. [ ] Escalar collector se necessário (horizontal)
4. [ ] Considerar pausar processamento não-crítico

### Severity 3 - Alertas de Qualidade
**Critérios:** Taxa de erro > 1%, spike de duplicatas

**Ações:**
1. [ ] Investigar causa raiz nos logs
2. [ ] Verificar releases recentes do SDK
3. [ ] Ajustar thresholds se for falso positivo
4. [ ] Documentar no registro de incidentes
```

---

## 6. Ferramentas e Acesso

### 6.1 Responsáveis

| Papel | Responsabilidade | Acesso |
|-------|------------------|--------|
| **Data Engineer** | Pipeline ETL, Collector | PostgreSQL (write), Collector deploy |
| **Analytics Engineer** | Modelagem AGGREGATED/DERIVED | PostgreSQL (write), Metabase admin |
| **BI Analyst** | Dashboards, relatórios | Metabase (read), PostgreSQL (read) |
| **Product Manager** | Definição de eventos | Metabase (read), Documentação |
| **Dev Frontend** | SDK client, instrumentação | Collector docs, SDK repo |

### 6.2 Ambientes

| Ambiente | Dados | Retenção | Uso |
|----------|-------|----------|-----|
| **Production** | Reais | 25 meses | Sistema real |
| **Staging** | Sintéticos | 30 dias | Testes de integração |
| **Dev** | Local/Seed | Temporário | Desenvolvimento |
| **Analytics** | Réplica read-only | 25 meses | Queries BI (isolado) |

---

## 7. Referências

- [04-analytics-first-party.md](./04-analytics-first-party.md) - Especificação técnica
- [07-event-versioning.md](./07-event-versioning.md) - Versionamento de eventos
- [05-lgpd-compliance.md](./05-lgpd-compliance.md) - Conformidade e privacidade

---

**Data de criação:** 2024-01-16  
**Versão:** 1.0  
**Owner:** Data Engineering Team  
**Status:** Ativo
