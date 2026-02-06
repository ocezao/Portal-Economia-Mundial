# Sistema de Analytics First-Party - PEM

## Visão Geral

Sistema de rastreamento de usuários 100% first-party, gratuito e escalável para 1 milhão+ de usuários, totalmente compatível com LGPD e sem dependência de serviços de terceiros (Google, Meta, etc.).

**Status:** Implementado e validável via `scripts/verify.sh`

**Versão Atual:** v1.1.0 (Advanced Tracking)

---

## 1. Arquitetura Implementada

### Diagrama da Stack

```
┌─────────────────────────────────────────────────────────────────┐
│                         CLIENTE (Browser)                        │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────────┐  │
│  │   Website    │  │  SDK Analytics│  │   localStorage      │  │
│  │  (React)     │◄─┤  (vanilla JS)│◄─┤   (offline queue)   │  │
│  └──────────────┘  └──────┬───────┘  └──────────────────────┘  │
└───────────────────────────┼────────────────────────────────────┘
                            │ HTTPS + Beacon API
                            ▼
┌─────────────────────────────────────────────────────────────────┐
│                    COLLECTOR API (Node.js + Fastify)             │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────────┐  │
│  │   Routes     │  │   Validate   │  │   Deduplication      │  │
│  │   (/collect) │──┤    Schema    │──┤   (ON CONFLICT)      │  │
│  └──────────────┘  └──────────────┘  └──────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
                            │ Batch INSERT
                            ▼
┌─────────────────────────────────────────────────────────────────┐
│                    STORAGE (PostgreSQL 15)                       │
│  ┌─────────────────────────────────────────────────────────────┐│
│  │  Tabela: events_raw (particionada por mês)                  ││
│  │  • UNIQUE INDEX(event_id) por partição                      ││
│  │  • Partições: events_raw_YYYY_MM                            ││
│  │  • Índices GIN para JSONB                                   ││
│  └─────────────────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────────┐
│                      DASHBOARD (Metabase)                        │
│  ┌─────────────────────────────────────────────────────────────┐│
│  │  • Queries SQL nativas                                      ││
│  │  • Visualizações configuráveis                              ││
│  │  • Exportação CSV                                           ││
│  └─────────────────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────────────────┘
```

---

## 2. Recursos Avançados Implementados (v1.1.0)

### 2.1 Engajamento do Usuário

| Recurso | Descrição | Eventos |
|---------|-----------|---------|
| **Scroll Depth** | Profundidade máxima com marcos | `scroll_depth` (25%, 50%, 75%, 90%, 100%) |
| **Active Time** | Tempo real de engajamento | `engagement_pulse`, `engagement_final` |
| **Page Visibility** | Detecção de aba ativa | `visibility_change` |
| **Idle Detection** | Usuário inativo > 30s | `user_idle` |

**Exemplo de dados coletados:**
```json
{
  "event": "engagement_pulse",
  "properties": {
    "active_time_seconds": 45,
    "total_time_seconds": 60,
    "focus_events_count": 3,
    "is_final": false
  }
}
```

### 2.2 Análise de Conteúdo

| Recurso | Descrição | Gatilho |
|---------|-----------|---------|
| **Article Read Start** | Usuário começou a ler | Scroll ≥ 10% OU tempo ≥ 10s |
| **Article Progress** | Marcos de leitura | 25%, 50%, 75% de scroll |
| **Article Complete** | Leitura finalizada | Scroll ≥ 80% + tempo ≥ 15s |
| **Paragraphs Read** | Parágrafos visualizados | Intersection Observer |
| **Abandonment** | Ponto de abandono | Ao sair da página |

**Métricas calculadas:**
- Tempo médio de leitura por categoria
- Taxa de completion por autor
- Ponto médio de abandono
- Parágrafos lidos vs. total

### 2.3 Web Vitals Estendidos

| Métrica | Threshold Good | Threshold Poor | Descrição |
|---------|---------------|----------------|-----------|
| **LCP** | ≤ 2500ms | > 4000ms | Largest Contentful Paint |
| **CLS** | ≤ 0.1 | > 0.25 | Cumulative Layout Shift |
| **INP** | ≤ 200ms | > 500ms | Interaction to Next Paint |
| **TTFB** | ≤ 800ms | > 1800ms | Time to First Byte |
| **FCP** | ≤ 1800ms | > 3000ms | First Contentful Paint |
| **FID** | ≤ 100ms | > 300ms | First Input Delay (legacy) |

**Dados adicionais:**
- Navigation Timing (DNS, TCP, DOM parse)
- Transfer size
- Resource loading times

### 2.4 Error Monitoring

| Tipo de Erro | Captura | Contexto |
|-------------|---------|----------|
| **JS Errors** | `window.onerror` | Message, stack, source, line |
| **Promise Rejections** | `unhandledrejection` | Reason, stack |
| **Resource Errors** | Captura de evento | Tag, URL, tipo |

**Proteções:**
- Deduplicação local (mesmo erro não reportado 2x)
- Limite de 10 erros por sessão
- Truncamento de stack trace (>1000 chars)
- Sanitização de URLs

### 2.5 Atribuição e Campanhas

**UTM Parameters:**
- `utm_source`
- `utm_medium`
- `utm_campaign`
- `utm_term`
- `utm_content`

**Classificação automática de tráfego:**
| Tipo | Detecção |
|------|----------|
| Organic | Google, Bing, DuckDuckGo, etc. |
| Social | Facebook, Twitter, LinkedIn, etc. |
| Paid | UTM medium = cpc, ppc, paid |
| Direct | Sem referrer |
| Referral | Outros referrers |

**Eventos:**
- `campaign_entry`: Primeira visita com UTM
- `session_start`: Sempre com dados de atribuição

### 2.6 Anti-Fraud / Bot Detection

**Sinais Técnicos:**
- `is_headless`: Detecção de navegador headless
- `is_automated`: WebDriver, PhantomJS, Selenium
- `has_webdriver_property`: Propriedade navigator.webdriver
- `plugins_count`: Número de plugins
- `languages_count`: Número de idiomas

**Sinais Comportamentais:**
- `mouse_movements_count`: Movimentos de mouse
- `click_pattern_entropy`: Entropia dos cliques
- `time_to_first_interaction_ms`: Tempo até primeira interação

**Sinais de Fingerprint (hashed):**
- `canvas_fingerprint_hash`
- `webgl_fingerprint_hash`
- `fonts_hash`

**Score:**
- `bot_score`: 0-100 (maior = mais provável bot)
- `is_suspicious`: bot_score > 50
- `is_likely_bot`: bot_score > 80

---

## 3. SDK Client

### Instalação

**Script Tag (recomendado):**
```html
<script 
  src="/analytics/analytics.min.js" 
  data-collector="https://collect.portaleconomicomundial.com"
  data-site-id="pem-prod"
  async
></script>
```

**NPM:**
```bash
npm install @pem/analytics-sdk
```

### Uso

```typescript
import { PEMAnalytics } from '@pem/analytics-sdk';

const analytics = new PEMAnalytics({
  collectorUrl: 'https://collect.portaleconomicomundial.com',
  debug: false
});

await analytics.init();

// Tracking de artigo
analytics.startArticleReading({
  articleId: 'guerra-comercial-2024',
  category: 'geopolitica',
  wordCount: 1200
});

// Métricas em tempo real
const metrics = analytics.getEngagementMetrics();
const botScore = analytics.getBotScore();
```

---

## 4. Estrutura de Repositório

```
pem-analytics/
├── README.md                          # Visão geral e setup
├── docker-compose.yml                 # Stack completa
├── .env.example                       # Variáveis de ambiente
│
├── collector/                         # Backend Node.js
│   ├── src/
│   │   ├── server.ts                  # Entry point Fastify
│   │   ├── routes/
│   │   │   ├── collect.ts             # POST /collect
│   │   │   └── health.ts              # GET /health
│   │   ├── plugins/
│   │   │   ├── rate-limit.ts          # Rate limiting
│   │   │   └── dedupe.ts              # Deduplicação LRU
│   │   ├── db/
│   │   │   ├── index.ts               # Pool PostgreSQL
│   │   │   ├── insert.ts              # Batch insert com dedupe
│   │   │   ├── partition-check.ts     # Verificação fail-fast
│   │   │   └── migrations/
│   │   │       └── 0001_init.sql      # Schema inicial
│   ├── Dockerfile
│   ├── package.json
│   └── tsconfig.json
│
├── sdk/                               # SDK Client (browser)
│   ├── src/
│   │   ├── core/
│   │   │   └── analytics.ts           # Core SDK
│   │   ├── trackers/
│   │   │   ├── scroll.ts              # Scroll depth
│   │   │   ├── engagement.ts          # Active time
│   │   │   ├── web-vitals.ts          # Performance
│   │   │   ├── errors.ts              # Error monitoring
│   │   │   ├── utm.ts                 # Attribution
│   │   │   ├── anti-fraud.ts          # Bot detection
│   │   │   └── article.ts             # Article reading
│   │   ├── utils/
│   │   │   ├── device.ts              # Device detection
│   │   │   └── session.ts             # Session management
│   │   ├── types/
│   │   │   └── index.ts               # TypeScript types
│   │   └── index.ts                   # Entry point
│   ├── dist/                          # Build output
│   ├── package.json
│   ├── tsconfig.json
│   └── README.md
│
├── public/analytics/                  # CDN assets
│   └── analytics.min.js               # SDK minificado
│
├── scripts/                           # Utilitários
│   ├── verify.sh                      # Validação do sistema
│   └── partition-manager.sh           # Criar partições mensais
│
└── docs/                              # Documentação
    ├── 04-analytics-first-party.md    # Este arquivo
    ├── 05-lgpd-compliance.md          # Conformidade LGPD
    ├── 09-event-schema.md             # Schema de eventos
    └── 10-data-model-postgres.md      # Modelo de dados
```

---

## 5. Lista Completa de Eventos

### Eventos Core (v1.0.0)

| Categoria | Evento | Status |
|-----------|--------|--------|
| Navegação | `page_view` | ✅ |
| | `session_start` | ✅ |
| | `session_end` | ✅ |
| LGPD | `consent_granted` | ✅ |
| | `consent_revoked` | ✅ |

### Eventos Avançados (v1.1.0)

| Categoria | Evento | Status |
|-----------|--------|--------|
| **Engajamento** | `scroll_depth` | ✅ |
| | `scroll_depth_final` | ✅ |
| | `engagement_pulse` | ✅ |
| | `engagement_final` | ✅ |
| | `visibility_change` | ✅ |
| | `user_idle` | ✅ |
| **Conteúdo** | `article_load` | ✅ |
| | `article_read_start` | ✅ |
| | `article_read_progress` | ✅ |
| | `article_read_complete` | ✅ |
| | `article_read_end` | ✅ |
| | `article_reading_pulse` | ✅ |
| **Performance** | `web_vital` | ✅ |
| | `perf_navigation_timing` | ✅ |
| **Erros** | `js_error` | ✅ |
| | `resource_error` | ✅ |
| | `promise_rejection` | ✅ |
| **Atribuição** | `campaign_entry` | ✅ |
| **Anti-Fraud** | `anti_fraud_initial` | ✅ |
| | `anti_fraud_update` | ✅ |

---

## 6. Contrato do Endpoint `/collect`

### Endpoint
```
POST /collect
Content-Type: application/json
```

### Schema do Payload

```json
{
  "v": "1.1.0",                    // Versão do schema
  "event": "page_view",             // Nome do evento
  "user_id": "uuid",                // UUID do usuário (null se anônimo)
  "session_id": "uuid",             // UUID da sessão (null se anônimo)
  "anonymous": false,               // Flag LGPD
  "timestamp": 1704393600000,       // Timestamp em ms
  "url": "https://...",             // URL completa
  "referrer": "https://...",        // Referrer
  "properties": {                   // Propriedades específicas
    // ... dados do evento
  }
}
```

### Respostas HTTP

| Status | Significado | Retorno |
|--------|-------------|---------|
| `204` | Evento aceito e processado | Vazio |
| `400` | Schema inválido | `{ "error": "..." }` |
| `429` | Rate limit excedido | `{ "error": "rate_limited" }` |

---

## 7. Fail-Fast no Startup

O collector verifica no startup:

1. **Partição do mês atual existe?**
2. **UNIQUE INDEX(event_id) existe?**

Se qualquer verificação falhar, o processo encerra com exit(1).

---

## 8. Validação do Sistema

### Script de Verificação

```bash
./scripts/verify.sh
```

### Checklist Validado

- ✅ PostgreSQL healthy
- ✅ Partições criadas automaticamente
- ✅ UNIQUE INDEX(event_id) nas partições
- ✅ Collector /health respondendo
- ✅ POST /collect funcionando
- ✅ Deduplicação funcionando
- ✅ SDK compilado e disponível em public/analytics/

---

## 9. Deploy

### Requisitos

- Docker Engine 20.10+
- Docker Compose 2.0+
- Portas disponíveis: 3000 (collector), 5432 (postgres), 3001 (metabase)

### Comandos

```bash
# Subir toda a stack
docker-compose up -d

# Verificar status
./scripts/verify.sh

# Logs
docker compose logs -f collector
docker compose logs -f postgres
```

---

## 10. Referências

| Documento | Descrição |
|-----------|-----------|
| [`05-lgpd-compliance.md`](./05-lgpd-compliance.md) | Conformidade LGPD |
| [`09-event-schema.md`](./09-event-schema.md) | Schema completo de eventos |
| [`10-data-model-postgres.md`](./10-data-model-postgres.md) | Modelo de dados |
| [`sdk/README.md`](../sdk/README.md) | Documentação do SDK |

---

**Data de criação:** 2024-01-15  
**Última atualização:** 2024-02-04 (v1.1.0 - Advanced Tracking)  
**Status:** Implementado e validável
