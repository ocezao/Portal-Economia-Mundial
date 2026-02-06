# Versionamento de Eventos - Estratégia Oficial

## Visão Geral

Este documento define a estratégia oficial de versionamento de eventos do sistema de analytics first-party do Portal Econômico Mundial. O objetivo é garantir **evolução contínua sem quebra de compatibilidade**, permitindo que o sistema cresça sem perder dados históricos.

---

## 1. Estratégia de Versionamento

### 1.1 Versão Global do Schema (Schema Version)

Toda requisição ao endpoint `/collect` **DEVE** incluir a versão global do schema no payload.

```json
{
  "v": "1.0",
  "event": "page_view",
  ...
}
```

#### Convenção de Versionamento Global

Usamos **Semantic Versioning 2.0** adaptado para schemas de eventos:

| Versão | Formato | Significado | Exemplo |
|--------|---------|-------------|---------|
| **Major** | `X.0` | Mudança quebrante (breaking change) | `2.0` - Remove campos obrigatórios |
| **Minor** | `x.Y` | Nova funcionalidade compatível | `1.1` - Novos campos opcionais |
| **Patch** | `x.y.Z` | Correção de schema | `1.0.1` - Ajuste em descrição/constraint |

#### Regras de Compatibilidade por Versão Global

```
┌─────────────────────────────────────────────────────────────────┐
│                    REGRAS DE COMPATIBILIDADE                     │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  Payload com v: "1.0"  →  Aceito pelo collector v1.x e v2.x     │
│  Payload com v: "2.0"  →  Aceito APENAS pelo collector v2.x+    │
│                                                                  │
│  Política de suporte:                                           │
│  • N versões major suportadas simultaneamente (N = 2)           │
│  • Grace period de 6 meses para migração entre majors           │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

#### Exemplo de Evolução

| Data | Versão | Mudança | Impacto |
|------|--------|---------|---------|
| 2024-01 | `1.0` | Lançamento inicial | Baseline |
| 2024-03 | `1.1` | Novo campo opcional `device.language` | Backward compatible |
| 2024-06 | `1.2` | Novo evento `video_pause` | Backward compatible |
| 2024-09 | `2.0` | Campo `user_agent` agora é hash obrigatório | **Breaking change** |

---

### 1.2 Versão por Evento (Event Version)

Além da versão global, eventos individuais podem ter sua própria versão para tracking granular de evolução.

```json
{
  "v": "1.2",
  "event": "article_read",
  "event_v": "2.1",
  "properties": {
    "scroll_depth": 75,
    "reading_time": 120,
    "new_feature_flag": true
  }
}
```

#### Quando Usar Event Version

| Cenário | Usar `event_v`? | Exemplo |
|---------|-----------------|---------|
| Evento novo | Sim | `"event_v": "1.0"` |
| Novo campo obrigatório no evento | Sim | `"event_v": "2.0"` |
| Mudança semântica do evento | Sim | `"event_v": "3.0"` |
| Novo campo opcional | Não | Usar schema v1.1 global |
| Correção de validação | Não | Usar patch global |

#### Exemplo Prático: Evolução do Evento `article_read`

```
article_read v1.0 (2024-01)
├── properties:
│   ├── article_id (required)
│   └── scroll_depth (required)

article_read v2.0 (2024-04) - BREAKING
├── properties:
│   ├── article_id (required)
│   ├── scroll_depth (required)
│   └── time_spent_seconds (NEW required)  ← Breaking!

article_read v2.1 (2024-06) - BACKWARD COMPATIBLE
├── properties:
│   ├── article_id (required)
│   ├── scroll_depth (required)
│   ├── time_spent_seconds (required)
│   └── paragraph_reached (NEW optional)  ← Novo opcional
```

---

### 1.3 Matriz de Compatibilidade

```
                    COLLECTOR VERSION
                   1.x        2.x        3.x
                ┌─────────┬─────────┬─────────┐
   Payload v1.0 │   ✅    │   ✅    │   ❌    │
   Payload v1.1 │   ✅    │   ✅    │   ❌    │
   Payload v2.0 │   ❌    │   ✅    │   ✅    │
   Payload v2.1 │   ❌    │   ✅    │   ✅    │
   Payload v3.0 │   ❌    │   ❌    │   ✅    │
                └─────────┴─────────┴─────────┘
```

---

## 2. Regras de Evolução do Schema

### 2.1 Adição de Novos Campos

#### Regra Fundamental: **Adição Só de Opcionais**

Novos campos só podem ser adicionados como **opcionais** em versões minor/patch.

```json
// Schema v1.0
{
  "v": "1.0",
  "event": "page_view",
  "user_id": "uuid",
  "url": "string"
}

// Schema v1.1 - ✅ VÁLIDO (novo campo opcional)
{
  "v": "1.1",
  "event": "page_view",
  "user_id": "uuid",
  "url": "string",
  "referrer": "string?"  // Opcional - backward compatible
}

// Schema v2.0 - ⚠️ NOVO CAMPO OBRIGATÓRIO = Major bump
{
  "v": "2.0",
  "event": "page_view",
  "user_id": "uuid",
  "url": "string",
  "referrer": "string"   // Agora obrigatório - breaking change!
}
```

#### Processo para Adicionar Campo

```
1. Adicionar campo como opcional na próxima minor version
   └─ v: "1.1", novo_campo?: tipo

2. Atualizar SDK client para enviar novo campo
   └─ Backward compatible: clientes antigos ainda funcionam

3. Após grace period de 3 meses (ou 90% adesão)
   └─ Tornar campo obrigatório na próxima major version
   
4. Bump major version: v: "2.0"
   └─ Documentar breaking change
   └─ Manter suporte à v1.x por 6 meses
```

#### Exemplo Prático

**Cenário:** Queremos adicionar `device_battery_level` ao evento `page_view`.

```typescript
// ETAPA 1: Schema v1.1 (Backward compatible)
{
  "v": "1.1",
  "event": "page_view",
  "user_id": "uuid",
  "url": "string",
  "device": {
    "type": "mobile",
    "battery_level?": "number"  // Novo, opcional
  }
}

// ETAPA 2: Coleta por 3 meses
// - SDK novo envia battery_level
// - SDK antigo não envia (null no banco)
// - Ambos aceitos ✓

// ETAPA 3: Schema v2.0 (Breaking - após grace period)
{
  "v": "2.0",
  "event": "page_view",
  "user_id": "uuid",
  "url": "string",
  "device": {
    "type": "mobile",
    "battery_level": "number"   // Agora obrigatório
  }
}

// ETAPA 4: Manter ambos por 6 meses
// - Collector aceita v1.1 e v2.0
// - Dashboards lidam com null
// - Depois: desativar v1.1
```

---

### 2.2 Depreciação de Campos

#### Processo de Depreciação em 4 Etapas

```
ETAPA 1: Depreciação Suave (Minor version)
├── Marcar campo como deprecated na documentação
├── Adicionar warning no collector (logs)
├── Manter funcionalidade 100%
└── Duração: 3 meses

ETAPA 2: Grace Period (Major version)
├── Bump para major version (ex: v2.0)
├── Campo ainda aceito, mas não obrigatório
├── Retornar header "X-Deprecated-Fields: field_name"
├── Duração: 6 meses

ETAPA 3: Hard Deprecation (Major version)
├── Bump para major version (ex: v3.0)
├── Campo ainda aceito, mas ignorado
├── Não retorna erro se presente
├── Duração: 3 meses

ETAPA 4: Remoção (Major version)
├── Bump para major version (ex: v4.0)
├── Campo rejeitado se presente (400 Bad Request)
└─ Ou: aceito mas não armazenado (drop silencioso)
```

#### Exemplo: Depreciação do Campo `user_agent`

```typescript
// v1.0 - Campo ativo
{
  "v": "1.0",
  "event": "page_view",
  "user_agent": "Mozilla/5.0..."  // Required
}

// v1.5 - Depreciação suave (minor)
{
  "v": "1.5",
  "event": "page_view",
  "user_agent": "Mozilla/5.0...",  // Deprecated - ainda funciona
  "user_agent_hash": "abc123..."   // Novo campo recomendado
}
// Collector log: "[DEPRECATED] Field 'user_agent' in event 'page_view'. Use 'user_agent_hash'"

// v2.0 - Grace period (major)
{
  "v": "2.0",
  "event": "page_view",
  "user_agent?": "string",          // Opcional, deprecated
  "user_agent_hash": "abc123..."    // Obrigatório
}
// Response header: X-Deprecated-Fields: user_agent

// v3.0 - Hard deprecation (major)
{
  "v": "3.0",
  "event": "page_view",
  "user_agent_hash": "abc123..."    // Único campo aceito
}
// Campo user_agent é aceito mas ignorado (não armazenado)

// v4.0 - Remoção (major)
{
  "v": "4.0",
  "event": "page_view",
  "user_agent_hash": "abc123..."
}
// Payload com user_agent → 400 Bad Request
```

#### Tabela de Transição

| Versão | `user_agent` | `user_agent_hash` | Comportamento |
|--------|--------------|-------------------|---------------|
| 1.0-1.4 | Obrigatório | - | Normal |
| 1.5-1.9 | Obrigatório | Opcional | Warning logs |
| 2.0-2.9 | Opcional | Obrigatório | Header deprecated |
| 3.0-3.9 | Ignorado | Obrigatório | Drop silencioso |
| 4.0+ | Rejeitado | Obrigatório | 400 Bad Request |

---

### 2.3 Remoção Segura de Eventos

#### Processo de Remoção de Evento

```
ETAPA 1: Congelamento (Minor)
├── Marcar evento como deprecated
├── Parar de gerar no SDK client
├── Ainda aceita recebimentos
└── Duração: 6 meses

ETAPA 2: Rejeição Suave (Major)
├── Bump major version
├── Retornar 202 Accepted + warning
├── Não armazenar no banco
└── Duração: 3 meses

ETAPA 3: Rejeição Dura (Major)
├── Bump major version
├── Retornar 400 Bad Request
└─ Documentar breaking change
```

#### Exemplo: Remoção do Evento `old_click_tracking`

```typescript
// ETAPA 1: Congelamento (v1.8)
// - Documentação: "Evento será removido em v2.0"
// - SDK para de enviar
// - Collector continua aceitando

// ETAPA 2: Rejeição suave (v2.0)
POST /collect
{
  "v": "2.0",
  "event": "old_click_tracking",
  ...
}

// Response: 202 Accepted
{
  "warning": "Event 'old_click_tracking' deprecated and not stored",
  "alternative": "Use 'click' event instead"
}
// Não armazena no banco

// ETAPA 3: Rejeição dura (v3.0)
POST /collect
{
  "v": "3.0",
  "event": "old_click_tracking",
  ...
}

// Response: 400 Bad Request
{
  "error": "Unknown event 'old_click_tracking'",
  "supported_events": ["page_view", "click", "article_read", ...]
}
```

---

## 3. Lógica do Backend (Collector)

### 3.1 Estrutura de Roteamento por Versão

```typescript
// Pseudo-código da lógica de versionamento no collector

interface VersionHandler {
  major: number;
  minor: number;
  validate: (payload: unknown) => ValidationResult;
  transform?: (payload: unknown) => NormalizedEvent;
  supportedEvents: string[];
}

const versionHandlers: VersionHandler[] = [
  {
    major: 1,
    minor: 0,
    validate: validateV1_0,
    transform: transformV1_0_to_v2_0,
    supportedEvents: ['page_view', 'click', 'session_start']
  },
  {
    major: 1,
    minor: 1,
    validate: validateV1_1,
    supportedEvents: ['page_view', 'click', 'session_start', 'article_read']
  },
  {
    major: 2,
    minor: 0,
    validate: validateV2_0,
    supportedEvents: ['page_view', 'click', 'session_start', 'article_read', 'video_play']
  }
];

// Lógica de roteamento
function routePayload(payload: unknown): HandlerResult {
  const version = extractVersion(payload);
  const handler = findHandler(version);
  
  if (!handler) {
    return { 
      status: 400, 
      error: `Unsupported schema version: ${version}. Supported: ${listSupportedVersions()}` 
    };
  }
  
  // Validação
  const validation = handler.validate(payload);
  if (!validation.valid) {
    return { status: 400, error: validation.errors };
  }
  
  // Transformação (se necessário)
  const normalized = handler.transform 
    ? handler.transform(payload) 
    : payload;
  
  // Verificação de evento
  const eventName = extractEventName(payload);
  if (!handler.supportedEvents.includes(eventName)) {
    return { 
      status: 400, 
      error: `Event '${eventName}' not supported in schema ${version}` 
    };
  }
  
  return { status: 204, data: normalized };
}
```

### 3.2 Migração de Dados (Transformação)

Quando um payload antigo chega, ele deve ser **normalizado** para o schema atual antes de persistir.

```typescript
// Transformador v1.0 → v2.0
function transformV1_0_to_v2_0(payload: V1_0_Payload): V2_0_Payload {
  return {
    v: '2.0',  // Normaliza versão
    event: payload.event,
    user_id: payload.user_id,
    session_id: payload.session_id,
    timestamp: payload.timestamp,
    url: payload.url,
    referrer: payload.referrer,
    // Transformações específicas
    device: {
      type: inferDeviceType(payload.user_agent),  // Inferir do UA
      viewport_width: payload.viewport_width,
      viewport_height: payload.viewport_height,
      // Novos campos v2.0 com defaults
      language: 'pt-BR',  // Default para v1.0
      battery_level: null  // Não disponível em v1.0
    },
    // Campo deprecado: user_agent → user_agent_hash
    user_agent_hash: hashUserAgent(payload.user_agent),
    // Properties normalizadas
    properties: {
      ...payload.properties,
      // Adicionar defaults para campos novos
      scroll_depth: payload.properties.scroll_depth ?? 0
    }
  };
}
```

### 3.3 Política de Retenção de Versões

```
┌─────────────────────────────────────────────────────────────────┐
│              SUPORTE A VERSÕES NO COLLECTOR                      │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  Versão Atual: 3.x                                              │
│                                                                  │
│  Suporte Ativo:                                                 │
│  ├── 3.x (current)      → Suporte total                         │
│  ├── 2.x (previous)     → Suporte + transformação               │
│  └── 1.x (deprecated)   → Apenas aceitação, grava com warning   │
│                                                                  │
│  Não Suportado:                                                 │
│  └── < 1.0              → 400 Bad Request                       │
│                                                                  │
│  Grace Period: 6 meses entre major versions                     │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### 3.4 Respostas HTTP por Cenário

| Cenário | Versão Payload | Versão Collector | Status | Resposta |
|---------|----------------|------------------|--------|----------|
| Sucesso | 2.0 | 2.x/3.x | 204 | No Content |
| Sucesso (transformado) | 1.0 | 2.x | 204 | + Header `X-Transformed: true` |
| Warning (deprecated) | 1.0 | 3.x | 202 | Body com warning |
| Versão futura | 3.0 | 2.x | 400 | `"Schema version 3.0 not yet supported"` |
| Versão muito antiga | 0.9 | 2.x | 400 | `"Schema version 0.9 no longer supported"` |
| Evento desconhecido | 2.0 | 2.x | 400 | Lista de eventos suportados |
| Schema inválido | 2.0 | 2.x | 400 | Detalhes da validação |

---

## 4. Estratégia de Migração de Dados Históricos

### 4.1 Abordagem: "Esquema na Leitura" (Schema on Read)

Ao invés de migrar dados antigos no banco, mantemos os dados como foram coletados e aplicamos transformações na **query time**.

```sql
-- View que normaliza eventos v1.0 e v2.0
CREATE VIEW normalized_events AS
SELECT 
  id,
  timestamp,
  event,
  -- Normalização de versão
  CASE 
    WHEN payload->>'v' = '1.0' THEN transform_v1_to_v2(payload)
    WHEN payload->>'v' = '1.1' THEN transform_v11_to_v2(payload)
    ELSE payload
  END as normalized_payload,
  -- Metadados
  payload->>'v' as original_version
FROM events;
```

### 4.2 Materialização de Agregações

Para performance, agregações diárias são materializadas com schema fixo:

```sql
-- Tabela materializada (schema estável)
CREATE TABLE daily_stats_v2 (
  date DATE PRIMARY KEY,
  total_pageviews INTEGER,
  total_users INTEGER,
  -- ... schema estável
);

-- Atualização considerando todas as versões
INSERT INTO daily_stats_v2
SELECT 
  DATE(timestamp),
  COUNT(*) FILTER (WHERE event = 'page_view'),
  COUNT(DISTINCT user_id)
FROM events
WHERE timestamp >= CURRENT_DATE - INTERVAL '1 day'
GROUP BY DATE(timestamp);
```

---

## 5. Checklist de Implementação

### Checklist de Nova Versão

```markdown
## Antes do Release

### Planejamento
- [ ] Documentar mudanças na versão
- [ ] Atualizar JSON Schema
- [ ] Definir se é breaking change (major/minor/patch)
- [ ] Criar transformador de versão anterior (se necessário)

### Implementação
- [ ] Implementar validador novo no collector
- [ ] Adicionar handler de transformação
- [ ] Atualizar SDK client (enviar nova versão)
- [ ] Testes de compatibilidade retroativa

### Migração
- [ ] Deploy collector com suporte à nova versão
- [ ] Deploy SDK gradual (10% → 50% → 100%)
- [ ] Monitorar taxa de erro
- [ ] Verificar transformações automáticas

### Comunicação
- [ ] Atualizar documentação de API
- [ ] Notificar equipe de dados
- [ ] Atualizar queries do Metabase (se necessário)
- [ ] Agendar deprecação da versão antiga

### Pós-Deploy
- [ ] Monitorar por 7 dias
- [ ] Validar integridade dos dados
- [ ] Documentar lições aprendidas
```

### Checklist de Depreciação

```markdown
## Processo de Depreciação

### Fase 1: Anúncio (T-6 meses)
- [ ] Criar issue de depreciação
- [ ] Documentar data de desativação
- [ ] Adicionar warnings no collector
- [ ] Comunicar stakeholders

### Fase 2: Grace Period (T-3 meses)
- [ ] Implementar header X-Deprecated
- [ ] Reduzir uso interno (SDKs)
- [ ] Monitorar volume de eventos antigos
- [ ] Preparar queries de migração

### Fase 3: Desativação (T-0)
- [ ] Remover handler da versão
- [ ] Atualizar documentação
- [ ] Arquivar schema antigo
- [ ] Backup dos dados históricos
```

---

## 6. Exemplos de Cenários Reais

### Cenário 1: Adição de Campo Opcional

**Contexto:** Queremos adicionar `device.orientation` (portrait/landscape).

```json
// Schema v1.2 (NOVO)
{
  "v": "1.2",
  "event": "page_view",
  "user_id": "uuid",
  "session_id": "uuid",
  "device": {
    "type": "mobile",
    "viewport_width": 375,
    "viewport_height": 812,
    "orientation": "portrait"  // NOVO - opcional
  }
}
```

**Implementação:**
1. Bump minor: `1.1` → `1.2`
2. Campo é opcional (`orientation?`)
3. SDK novo envia, SDK antigo não envia
4. No banco: `orientation` pode ser NULL
5. Queries: `COALESCE(orientation, 'unknown')`

---

### Cenário 2: Mudança de Tipo (String → Enum)

**Contexto:** Campo `device.type` precisa ser restrito a valores específicos.

```json
// Schema v1.0 (ANTIGO)
{
  "device": {
    "type": "mobile phone"  // String livre
  }
}

// Schema v2.0 (NOVO - BREAKING)
{
  "device": {
    "type": "mobile"  // Enum: "desktop" | "tablet" | "mobile"
  }
}
```

**Implementação:**
1. Bump major: `1.x` → `2.0`
2. Criar transformador: `normalizeDeviceType()`
   - `"mobile phone"` → `"mobile"`
   - `"desktop computer"` → `"desktop"`
3. Collector aceita v1.0 e normaliza para v2.0
4. Após 6 meses, desativar v1.0

---

### Cenário 3: Remoção de Evento

**Contexto:** Evento `old_video_play` sendo substituído por `media_play`.

**Timeline:**
- **Mes 0:** Marcar `old_video_play` como deprecated
- **Mes 3:** SDK para de enviar `old_video_play`
- **Mes 6:** Collector retorna 202 com warning
- **Mes 9:** Collector retorna 400

---

## 7. Referências

- [Semantic Versioning 2.0.0](https://semver.org/)
- [JSON Schema](https://json-schema.org/)
- Documentação relacionada:
  - [`04-analytics-first-party.md`](./04-analytics-first-party.md) - Especificação geral
  - [`05-lgpd-compliance.md`](./05-lgpd-compliance.md) - Conformidade

---

**Data de criação:** 2024-01-16  
**Versão:** 1.0  
**Autor:** Arquitetura de Dados PEM  
**Status:** Documento ativo
