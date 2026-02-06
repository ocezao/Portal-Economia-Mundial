# Schema de Eventos - Especificação Enterprise

## A) Padrões de Governança de Eventos

### A.1 Convenção de Nomes

#### Eventos (snake_case)

```
Regras:
- Sempre minúsculas
- Palavras separadas por underscore
- Verbo + Substantivo ou Substantivo + Verbo
- Máximo 50 caracteres
- Sem prefixos/sufixos desnecessários
```

**Exemplos válidos:**
- `page_view` ✅
- `article_read_start` ✅
- `scroll_depth` ✅
- `video_play` ✅

**Exemplos inválidos:**
- `pageView` ❌ (camelCase)
- `PageView` ❌ (PascalCase)
- `page-view` ❌ (kebab-case)
- `pem_page_view` ❌ (prefixo desnecessário)
- `pv` ❌ (abreviação não clara)

#### Propriedades (snake_case)

```
Regras:
- Sempre minúsculas
- Palavras separadas por underscore
- Sem abreviações (exceto convenções estabelecidas)
- Unidades no nome quando aplicável
- Consistência temporal: use _seconds, _ms, _at
```

**Sufixos obrigatórios por tipo:**

| Tipo | Sufixo | Exemplo |
|------|--------|---------|
| Identificador | `_id` | `article_id`, `user_id` |
| Timestamp | `_at` | `created_at`, `updated_at` |
| Contador | `_count` | `pageviews_count` |
| Duração (segundos) | `_seconds` | `time_spent_seconds` |
| Duração (ms) | `_ms` | `load_time_ms` |
| Porcentagem (0-100) | `_percent` | `scroll_depth_percent` |
| Taxa (0.0-1.0) | `_rate` | `conversion_rate` |
| Categoria/Tipo | `_type` | `device_type` |
| Hash | `_hash` | `ip_hash`, `ua_hash` |
| URL completa | `_url` | `page_url`, `referrer_url` |
| Path URL | `_path` | `page_path` |
| Hostname | `_host` | `referrer_host` |

#### Categorias Oficiais

```yaml
navigation:     # Navegação do usuário
  - page_view
  - page_exit
  - session_start
  - session_end
  - navigation_back

content:        # Interação com conteúdo editorial
  - article_read_start
  - article_read_progress
  - article_read_complete
  - article_time_spent
  - video_play
  - video_progress
  - video_complete
  - podcast_play

engagement:     # Engajamento e interações
  - click
  - scroll_depth
  - search_execute
  - search_result_click
  - share
  - bookmark_add
  - bookmark_remove
  - print

performance:    # Performance técnica
  - web_vital
  - page_load_time
  - resource_load_time
  - first_paint
  - first_contentful_paint

error:          # Erros e falhas
  - js_error
  - api_error
  - resource_error
  - promise_rejection

consent:        # LGPD / Consentimento
  - consent_granted
  - consent_revoked
  - consent_updated

system:         # Eventos de sistema
  - collector_ready
  - sdk_initialized
  - queue_flushed
```

---

### A.2 Regras para Criação/Alteração de Eventos

#### Como Adicionar Novos Eventos

```
ETAPA 1: Validação (antes de criar)
├── Verificar se evento similar já existe
├── Confirmar categoria adequada
├── Validar nomenclatura (snake_case)
└── Revisar campos proibidos

ETAPA 2: Definição
├── Criar schema JSON
├── Definir campos obrigatórios
├── Definir campos opcionais
├── Estabelecer valores default
└── Criar exemplos válidos/inválidos

ETAPA 3: Documentação
├── Atualizar docs/09-event-schema.md
├── Adicionar ao CHANGELOG
├── Notificar equipe de dados
└── Atualizar dashboards afetados

ETAPA 4: Implementação
├── Adicionar validação no collector
├── Atualizar SDK client (se aplicável)
├── Deploy em staging
└── Validar em produção
```

#### Como Adicionar Campos

**Adição de campo OPCIONAL (Backward Compatible):**
```
1. Adicionar campo no schema com required: false
2. Deploy collector com nova validação
3. Atualizar SDK para enviar novo campo
4. Monitorar taxa de preenchimento
5. (Opcional) Após 90% adesão, tornar obrigatório em major version
```

**Adição de campo OBRIGATÓRIO (Breaking Change):**
```
1. Bump major version do schema
2. Adicionar campo no schema com required: true
3. Criar transformador de versão anterior
4. Deploy collector suportando ambas versões
5. Comunicar breaking change
6. Deprecar versão antiga (6 meses)
```

#### Campos PROIBIDOS (Nunca coletar)

```yaml
# Dados Pessoais (PII)
nome_completo:      # Nome do usuário
email:              # Endereço de email
cpf:                # CPF
cnpj:               # CNPJ
telefone:           # Telefone
celular:            # Celular
data_nascimento:    # Data de nascimento
endereco:           # Endereço completo
cep:                # CEP (preciso)
rg:                 # RG
cartao_credito:     # Dados de cartão
senha:              # Qualquer senha
ip_address:         # IP completo (usar hash)
user_agent_text:    # UA completo (usar hash)
lat_lng_preciso:    # Geolocalização precisa

# Dados Sensíveis (LGPD Art. 5º, II §1º)
raca_etnia:         # Raça ou etnia
religiao:           # Religião
opiniao_politica:   # Opinião política
saude:              # Dados de saúde
orientacao_sexual:  # Orientação sexual
genetica:           # Dados genéticos
biometria:          # Dados biométricos

# Rastreamento Invasivo
fingerprint_canvas: # Fingerprint via canvas
fingerprint_webgl:  # Fingerprint via WebGL
fingerprint_audio:  # Fingerprint via AudioContext
font_list:          # Lista de fontes instaladas
screen_resolution:  # Resolução + profundidade de cor
```

#### Campos OBRIGATÓRIOS (Em todo evento)

```json
{
  "v": "string",           // Versão do schema global
  "event": "string",       // Nome do evento
  "user_id": "string",     // UUID first-party (null se anônimo)
  "session_id": "string",  // UUID da sessão (null se anônimo)
  "timestamp": "integer",  // Unix timestamp (milliseconds)
  "url": "string",         // URL completa onde ocorreu
  "properties": "object"   // Propriedades específicas do evento
}
```

---

### A.3 Classificação Oficial de Eventos

#### Core Events (Nunca mudar sem versionar)

Eventos fundamentais para métricas de negócio. **Qualquer alteração requer bump major.**

```yaml
core_events:
  - page_view:
      stability: stable
      criticality: high
      dashboards: ["traffic", "acquisition", "engagement"]
      
  - session_start:
      stability: stable
      criticality: high
      dashboards: ["sessions", "users", "retention"]
      
  - article_read_complete:
      stability: stable
      criticality: high
      dashboards: ["content_performance", "editorial_kpis"]
      
  - web_vital:
      stability: stable
      criticality: medium
      dashboards: ["performance", "core_web_vitals"]
```

#### Optional Events

Eventos importantes mas não críticos. Mudanças devem ser backward compatible.

```yaml
optional_events:
  - scroll_depth:
      stability: evolving
      criticality: medium
      
  - video_progress:
      stability: evolving
      criticality: low
      
  - search_execute:
      stability: stable
      criticality: medium
```

#### Experimental Events

Eventos em teste. Podem mudar ou ser removidos sem aviso.

```yaml
experimental_events:
  - heatmap_interaction:
      stability: experimental
      criticality: low
      note: "Sujeito a remoção após análise"
      
  - ml_feature_usage:
      stability: experimental
      criticality: low
```

---

### A.4 Política de Versionamento

#### Versão Global (schema.v)

```
Formato: MAJOR.MINOR.PATCH
Exemplo: "1.2.0"

MAJOR (X.0.0):
- Breaking change
- Novo campo obrigatório
- Remoção de campo
- Mudança de tipo

MINOR (x.Y.0):
- Novo campo opcional
- Novo evento
- Novo enum value

PATCH (x.y.Z):
- Correção de descrição
- Ajuste de constraint
- Documentação
```

#### Versão por Evento (event_version)

```json
{
  "v": "1.2.0",
  "event": "article_read",
  "event_version": "2.1.0",
  "properties": { ... }
}
```

**Quando usar event_version:**
- Mudança semântica no evento
- Novo campo obrigatório específico do evento
- Mudança na estrutura de properties

#### Compatibilidade Retroativa

```
Collector v2.x suporta:
- Payloads v2.x (nativo)
- Payloads v1.x (com transformação)

Collector v1.x suporta:
- Apenas payloads v1.x
- Rejeita payloads v2.x (400 Bad Request)
```

**Matriz de Compatibilidade:**

| Payload ↓ / Collector → | v1.x | v2.x | v3.x |
|------------------------|------|------|------|
| v1.0 | ✅ | ✅ | ❌ |
| v1.1 | ✅ | ✅ | ❌ |
| v2.0 | ❌ | ✅ | ✅ |
| v2.1 | ❌ | ✅ | ✅ |
| v3.0 | ❌ | ❌ | ✅ |

#### Estratégia de Depreciação

```
FASE 1: Anúncio (T-6 meses)
├── Marcar como deprecated na documentação
├── Adicionar warning nos logs
├── Comunicar equipes afetadas
└── Banner no dashboard

FASE 2: Grace Period (T-3 meses)
├── Bump major version
├── Manter funcionalidade
├── Retornar header X-Deprecated
└── Ainda aceita eventos

FASE 3: Hard Deprecation (T-0)
├── Remover suporte
├── Retornar 400 Bad Request
└── Forçar migração
```

---

## B) Especificação Completa do Event Schema

### B.1 Schema Mestre (EventEnvelope)

```json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "$id": "https://portaleconomicomundial.com/schemas/event-envelope-v1.json",
  "title": "EventEnvelope",
  "description": "Envelope padrão para todos os eventos de analytics",
  "type": "object",
  "required": ["v", "event", "timestamp", "url"],
  "properties": {
    "v": {
      "description": "Versão global do schema",
      "type": "string",
      "pattern": "^\\d+\\.\\d+\\.\\d+$",
      "examples": ["1.0.0", "1.2.0"]
    },
    "event": {
      "description": "Nome do evento (snake_case)",
      "type": "string",
      "pattern": "^[a-z][a-z0-9_]*$",
      "minLength": 1,
      "maxLength": 50
    },
    "event_version": {
      "description": "Versão específica do evento (opcional)",
      "type": "string",
      "pattern": "^\\d+\\.\\d+\\.\\d+$"
    },
    "user_id": {
      "description": "UUID first-party do usuário (null se anônimo/LGPD)",
      "type": ["string", "null"],
      "format": "uuid"
    },
    "session_id": {
      "description": "UUID da sessão atual (null se anônimo/LGPD)",
      "type": ["string", "null"],
      "format": "uuid"
    },
    "anonymous": {
      "description": "Flag indicando evento sem identificadores (LGPD)",
      "type": "boolean",
      "default": false
    },
    "timestamp": {
      "description": "Timestamp UTC do evento (milliseconds)",
      "type": "integer",
      "minimum": 1609459200000,
      "maximum": 4102444800000
    },
    "url": {
      "description": "URL completa onde o evento ocorreu (canonizada)",
      "type": "string",
      "format": "uri",
      "maxLength": 2048
    },
    "referrer": {
      "description": "URL de referrer (canonizada)",
      "type": ["string", "null"],
      "format": "uri",
      "maxLength": 2048
    },
    "properties": {
      "description": "Propriedades específicas do evento",
      "type": "object",
      "additionalProperties": true
    },
    "device": {
      "description": "Informações do dispositivo",
      "type": "object",
      "properties": {
        "type": {
          "type": "string",
          "enum": ["desktop", "tablet", "mobile", "unknown"]
        },
        "viewport_width": {
          "type": "integer",
          "minimum": 100,
          "maximum": 10000
        },
        "viewport_height": {
          "type": "integer",
          "minimum": 100,
          "maximum": 10000
        },
        "language": {
          "type": "string",
          "pattern": "^[a-z]{2}(-[A-Z]{2})?$",
          "examples": ["pt-BR", "en-US", "es"]
        },
        "timezone": {
          "type": "string",
          "examples": ["America/Sao_Paulo", "UTC"]
        }
      }
    },
    "metadata": {
      "description": "Metadados injetados pelo collector",
      "type": "object",
      "properties": {
        "received_at": {
          "type": "integer",
          "description": "Timestamp de recebimento"
        },
        "ip_hash": {
          "type": "string",
          "description": "Hash SHA-256 do IP"
        },
        "user_agent_hash": {
          "type": "string",
          "description": "Hash do User-Agent"
        },
        "processing_version": {
          "type": "string",
          "description": "Versão do collector"
        }
      }
    }
  },
  "additionalProperties": false
}
```

#### Regras de Normalização de URL

```javascript
// Canonização de URL
function canonicalizeUrl(url) {
  const urlObj = new URL(url);
  
  // 1. Remover parâmetros de tracking conhecidos
  const trackingParams = [
    'utm_source', 'utm_medium', 'utm_campaign',
    'utm_term', 'utm_content', 'fbclid', 'gclid',
    'ref', 'source'
  ];
  
  trackingParams.forEach(param => {
    urlObj.searchParams.delete(param);
  });
  
  // 2. Remover fragmentos (#)
  urlObj.hash = '';
  
  // 3. Garantir trailing slash consistente
  let pathname = urlObj.pathname;
  if (!pathname.endsWith('/') && !pathname.includes('.')) {
    pathname += '/';
  }
  
  // 4. Lowercase hostname
  urlObj.hostname = urlObj.hostname.toLowerCase();
  
  return urlObj.toString();
}
```

---

### B.2 Schemas por Evento

#### Evento: `page_view`

**Descrição:** Visualização de página. Disparado quando o usuário carrega ou navega para uma nova página.

**Schema:**
```json
{
  "allOf": [{ "$ref": "#/EventEnvelope" }],
  "properties": {
    "event": { "const": "page_view" },
    "properties": {
      "type": "object",
      "properties": {
        "page_type": {
          "type": "string",
          "enum": ["home", "article", "category", "tag", "search", "author", "static"],
          "description": "Tipo da página"
        },
        "page_id": {
          "type": ["string", "null"],
          "maxLength": 100,
          "description": "Slug ou ID da página"
        },
        "category": {
          "type": ["string", "null"],
          "enum": ["economia", "geopolitica", "tecnologia", null],
          "description": "Categoria editorial (se aplicável)"
        }
      }
    }
  }
}
```

**Exemplo Válido:**
```json
{
  "v": "1.0.0",
  "event": "page_view",
  "user_id": "550e8400-e29b-41d4-a716-446655440000",
  "session_id": "6ba7b810-9dad-11d1-80b4-00c04fd430c8",
  "timestamp": 1704393600000,
  "url": "https://portaleconomicomundial.com/noticia/guerra-comercial-2024",
  "referrer": "https://google.com/",
  "properties": {
    "page_type": "article",
    "page_id": "guerra-comercial-2024",
    "category": "geopolitica"
  },
  "device": {
    "type": "desktop",
    "viewport_width": 1920,
    "viewport_height": 1080,
    "language": "pt-BR"
  }
}
```

**Exemplo Inválido (erros):**
```json
// ❌ Erro: page_type inválido
{
  "properties": {
    "page_type": "blog"  // Não está no enum
  }
}

// ❌ Erro: URL muito longa
{
  "url": "https://..." // > 2048 caracteres
}

// ❌ Erro: timestamp no futuro
{
  "timestamp": 9999999999999  // Muito no futuro
}
```

---

#### Evento: `session_start`

**Descrição:** Início de uma nova sessão. Disparado quando um usuário chega sem sessão ativa (30min de inatividade).

**Schema:**
```json
{
  "allOf": [{ "$ref": "#/EventEnvelope" }],
  "properties": {
    "event": { "const": "session_start" },
    "properties": {
      "type": "object",
      "properties": {
        "traffic_source": {
          "type": ["string", "null"],
          "maxLength": 100,
          "description": "Fonte de tráfego analisada"
        },
        "traffic_medium": {
          "type": ["string", "null"],
          "maxLength": 50,
          "description": "Meio de aquisição"
        },
        "referrer_host": {
          "type": ["string", "null"],
          "maxLength": 200,
          "description": "Hostname do referrer"
        },
        "utm_source": {
          "type": ["string", "null"],
          "maxLength": 100
        },
        "utm_medium": {
          "type": ["string", "null"],
          "maxLength": 100
        },
        "utm_campaign": {
          "type": ["string", "null"],
          "maxLength": 200
        }
      }
    }
  }
}
```

**Exemplo Válido:**
```json
{
  "v": "1.0.0",
  "event": "session_start",
  "user_id": "550e8400-e29b-41d4-a716-446655440000",
  "session_id": "6ba7b810-9dad-11d1-80b4-00c04fd430c8",
  "timestamp": 1704393600000,
  "url": "https://portaleconomicomundial.com/",
  "referrer": "https://www.google.com/search?q=economia+brasil",
  "properties": {
    "traffic_source": "google",
    "traffic_medium": "organic",
    "referrer_host": "www.google.com",
    "utm_source": null,
    "utm_medium": null,
    "utm_campaign": null
  }
}
```

---

#### Evento: `session_end`

**Descrição:** Fim de sessão. Disparado por heartbeat timeout ou fechamento da página.

**Schema:**
```json
{
  "allOf": [{ "$ref": "#/EventEnvelope" }],
  "properties": {
    "event": { "const": "session_end" },
    "properties": {
      "type": "object",
      "required": ["duration_seconds", "pageviews_count"],
      "properties": {
        "duration_seconds": {
          "type": "integer",
          "minimum": 0,
          "maximum": 86400,
          "description": "Duração total da sessão em segundos"
        },
        "pageviews_count": {
          "type": "integer",
          "minimum": 1,
          "description": "Número de pageviews na sessão"
        },
        "events_count": {
          "type": "integer",
          "minimum": 1,
          "description": "Total de eventos na sessão"
        },
        "is_bounce": {
          "type": "boolean",
          "description": "Sessão com apenas 1 pageview e < 10s"
        }
      }
    }
  }
}
```

**Exemplo Válido:**
```json
{
  "v": "1.0.0",
  "event": "session_end",
  "user_id": "550e8400-e29b-41d4-a716-446655440000",
  "session_id": "6ba7b810-9dad-11d1-80b4-00c04fd430c8",
  "timestamp": 1704397200000,
  "url": "https://portaleconomicomundial.com/noticia/outro-artigo",
  "properties": {
    "duration_seconds": 3600,
    "pageviews_count": 5,
    "events_count": 12,
    "is_bounce": false
  }
}
```

---

#### Evento: `article_read_start`

**Descrição:** Usuário começou a ler um artigo (scroll ≥ 10% ou tempo ≥ 10s).

**Schema:**
```json
{
  "allOf": [{ "$ref": "#/EventEnvelope" }],
  "properties": {
    "event": { "const": "article_read_start" },
    "properties": {
      "type": "object",
      "required": ["article_id", "category"],
      "properties": {
        "article_id": {
          "type": "string",
          "maxLength": 100,
          "description": "Slug único do artigo"
        },
        "category": {
          "type": "string",
          "enum": ["economia", "geopolitica", "tecnologia"]
        },
        "author_slug": {
          "type": ["string", "null"],
          "maxLength": 100,
          "description": "Slug do autor (se não houver login)"
        },
        "tags": {
          "type": "array",
          "items": { "type": "string", "maxLength": 50 },
          "maxItems": 10,
          "description": "Tags do artigo"
        },
        "word_count": {
          "type": ["integer", "null"],
          "minimum": 1,
          "description": "Número de palavras do artigo"
        },
        "trigger": {
          "type": "string",
          "enum": ["scroll", "time", "visibility"],
          "description": "O que disparou o evento"
        }
      }
    }
  }
}
```

**Exemplo Válido:**
```json
{
  "v": "1.0.0",
  "event": "article_read_start",
  "user_id": "550e8400-e29b-41d4-a716-446655440000",
  "session_id": "6ba7b810-9dad-11d1-80b4-00c04fd430c8",
  "timestamp": 1704393660000,
  "url": "https://portaleconomicomundial.com/noticia/guerra-comercial-2024",
  "properties": {
    "article_id": "guerra-comercial-2024",
    "category": "geopolitica",
    "author_slug": "maria-silva",
    "tags": ["china", "eua", "comercio", "tarifas"],
    "word_count": 1200,
    "trigger": "scroll"
  }
}
```

---

#### Evento: `article_read_progress`

**Descrição:** Progresso de leitura do artigo (marcos: 25%, 50%, 75%).

**Schema:**
```json
{
  "allOf": [{ "$ref": "#/EventEnvelope" }],
  "properties": {
    "event": { "const": "article_read_progress" },
    "properties": {
      "type": "object",
      "required": ["article_id", "scroll_depth_percent"],
      "properties": {
        "article_id": {
          "type": "string",
          "maxLength": 100
        },
        "scroll_depth_percent": {
          "type": "integer",
          "enum": [25, 50, 75],
          "description": "Marco de scroll atingido"
        },
        "time_spent_seconds": {
          "type": "integer",
          "minimum": 0,
          "description": "Tempo gasto até este marco"
        }
      }
    }
  }
}
```

---

#### Evento: `article_read_complete`

**Descrição:** Leitura completa do artigo (scroll ≥ 80% + tempo mínimo).

**Schema:**
```json
{
  "allOf": [{ "$ref": "#/EventEnvelope" }],
  "properties": {
    "event": { "const": "article_read_complete" },
    "properties": {
      "type": "object",
      "required": ["article_id", "total_time_seconds"],
      "properties": {
        "article_id": {
          "type": "string",
          "maxLength": 100
        },
        "total_time_seconds": {
          "type": "integer",
          "minimum": 10,
          "description": "Tempo total de leitura em segundos"
        },
        "max_scroll_percent": {
          "type": "integer",
          "minimum": 80,
          "maximum": 100,
          "description": "Máximo scroll atingido"
        },
        "paragraphs_read": {
          "type": ["integer", "null"],
          "minimum": 1,
          "description": "Número de parágrafos lidos (estimativa)"
        }
      }
    }
  }
}
```

**Exemplo Válido:**
```json
{
  "v": "1.0.0",
  "event": "article_read_complete",
  "user_id": "550e8400-e29b-41d4-a716-446655440000",
  "session_id": "6ba7b810-9dad-11d1-80b4-00c04fd430c8",
  "timestamp": 1704394200000,
  "url": "https://portaleconomicomundial.com/noticia/guerra-comercial-2024",
  "properties": {
    "article_id": "guerra-comercial-2024",
    "total_time_seconds": 420,
    "max_scroll_percent": 95,
    "paragraphs_read": 18
  }
}
```

---

#### Evento: `scroll_depth`

**Descrição:** Profundidade máxima de scroll em uma página.

**Schema:**
```json
{
  "allOf": [{ "$ref": "#/EventEnvelope" }],
  "properties": {
    "event": { "const": "scroll_depth" },
    "properties": {
      "type": "object",
      "required": ["depth_percent"],
      "properties": {
        "depth_percent": {
          "type": "integer",
          "minimum": 0,
          "maximum": 100,
          "description": "Porcentagem máxima de scroll"
        },
        "page_height_pixels": {
          "type": ["integer", "null"],
          "minimum": 1,
          "description": "Altura total da página em pixels"
        },
        "viewport_height_pixels": {
          "type": ["integer", "null"],
          "minimum": 1,
          "description": "Altura do viewport em pixels"
        }
      }
    }
  }
}
```

---

#### Evento: `click`

**Descrição:** Clique em elemento interativo. Modelo seguro para tracking.

**Schema:**
```json
{
  "allOf": [{ "$ref": "#/EventEnvelope" }],
  "properties": {
    "event": { "const": "click" },
    "properties": {
      "type": "object",
      "required": ["target_type", "target_id"],
      "properties": {
        "target_type": {
          "type": "string",
          "enum": [
            "button",
            "link",
            "card",
            "image",
            "menu_item",
            "tab",
            "share_button",
            "nav_item"
          ],
          "description": "Tipo do elemento clicado"
        },
        "target_id": {
          "type": "string",
          "maxLength": 100,
          "description": "ID ou identificador do elemento (sem PII)"
        },
        "target_text": {
          "type": ["string", "null"],
          "maxLength": 100,
          "description": "Texto do elemento (truncado, sem PII)"
        },
        "placement": {
          "type": "string",
          "maxLength": 50,
          "description": "Localização na página (header, sidebar, etc)"
        },
        "article_id": {
          "type": ["string", "null"],
          "maxLength": 100,
          "description": "Artigo relacionado (se aplicável)"
        },
        "href": {
          "type": ["string", "null"],
          "maxLength": 500,
          "description": "URL de destino (se link)"
        }
      }
    }
  }
}
```

**Exemplo Válido:**
```json
{
  "v": "1.0.0",
  "event": "click",
  "user_id": "550e8400-e29b-41d4-a716-446655440000",
  "session_id": "6ba7b810-9dad-11d1-80b4-00c04fd430c8",
  "timestamp": 1704393700000,
  "url": "https://portaleconomicomundial.com/",
  "properties": {
    "target_type": "card",
    "target_id": "article-guerra-comercial-2024",
    "target_text": "Guerra Comercial: Impactos...",
    "placement": "hero_section",
    "article_id": "guerra-comercial-2024",
    "href": "https://portaleconomicomundial.com/noticia/guerra-comercial-2024"
  }
}
```

---

#### Evento: `search`

**Descrição:** Execução de busca no site.

**Schema:**
```json
{
  "allOf": [{ "$ref": "#/EventEnvelope" }],
  "properties": {
    "event": { "const": "search" },
    "properties": {
      "type": "object",
      "required": ["query"],
      "properties": {
        "query": {
          "type": "string",
          "maxLength": 200,
          "description": "Termo de busca (normalizado)"
        },
        "results_count": {
          "type": ["integer", "null"],
          "minimum": 0,
          "description": "Número de resultados"
        },
        "has_results": {
          "type": "boolean",
          "description": "Se teve resultados"
        },
        "filters_used": {
          "type": "array",
          "items": { "type": "string" },
          "description": "Filtros aplicados"
        },
        "query_length": {
          "type": "integer",
          "minimum": 1,
          "description": "Comprimento da query"
        }
      }
    }
  }
}
```

---

#### Evento: `web_vital`

**Descrição:** Core Web Vitals e outras métricas de performance.

**Schema:**
```json
{
  "allOf": [{ "$ref": "#/EventEnvelope" }],
  "properties": {
    "event": { "const": "web_vital" },
    "properties": {
      "type": "object",
      "required": ["name", "value", "rating"],
      "properties": {
        "name": {
          "type": "string",
          "enum": ["LCP", "FID", "CLS", "INP", "TTFB", "FCP"],
          "description": "Nome do Web Vital"
        },
        "value": {
          "type": "number",
          "minimum": 0,
          "description": "Valor medido (ms ou score)"
        },
        "rating": {
          "type": "string",
          "enum": ["good", "needs-improvement", "poor"],
          "description": "Classificação do valor"
        },
        "delta": {
          "type": ["number", "null"],
          "description": "Diferença do valor anterior (se houver)"
        },
        "entries": {
          "type": ["array", "null"],
          "description": "PerformanceEntries relacionados (limitado)"
        }
      }
    }
  }
}
```

**Exemplo Válido:**
```json
{
  "v": "1.0.0",
  "event": "web_vital",
  "user_id": "550e8400-e29b-41d4-a716-446655440000",
  "session_id": "6ba7b810-9dad-11d1-80b4-00c04fd430c8",
  "timestamp": 1704393620000,
  "url": "https://portaleconomicomundial.com/noticia/guerra-comercial-2024",
  "properties": {
    "name": "LCP",
    "value": 1200,
    "rating": "good",
    "delta": null,
    "entries": null
  }
}
```

---

#### Evento: `js_error`

**Descrição:** Erro JavaScript não tratado.

**Schema:**
```json
{
  "allOf": [{ "$ref": "#/EventEnvelope" }],
  "properties": {
    "event": { "const": "js_error" },
    "properties": {
      "type": "object",
      "required": ["message"],
      "properties": {
        "message": {
          "type": "string",
          "maxLength": 500,
          "description": "Mensagem de erro (truncada)"
        },
        "source": {
          "type": ["string", "null"],
          "maxLength": 200,
          "description": "Arquivo fonte do erro"
        },
        "line": {
          "type": ["integer", "null"],
          "minimum": 1,
          "description": "Linha do erro"
        },
        "column": {
          "type": ["integer", "null"],
          "minimum": 1,
          "description": "Coluna do erro"
        },
        "stack": {
          "type": ["string", "null"],
          "maxLength": 1000,
          "description": "Stack trace (truncado)"
        },
        "handled": {
          "type": "boolean",
          "default": false,
          "description": "Se o erro foi tratado"
        }
      }
    }
  }
}
```

---

#### Evento: `api_error`

**Descrição:** Erro em chamada de API.

**Schema:**
```json
{
  "allOf": [{ "$ref": "#/EventEnvelope" }],
  "properties": {
    "event": { "const": "api_error" },
    "properties": {
      "type": "object",
      "required": ["endpoint", "status_code"],
      "properties": {
        "endpoint": {
          "type": "string",
          "maxLength": 500,
          "description": "Endpoint da API (path apenas, sem query)"
        },
        "status_code": {
          "type": "integer",
          "minimum": 400,
          "maximum": 599,
          "description": "HTTP status code"
        },
        "method": {
          "type": "string",
          "enum": ["GET", "POST", "PUT", "DELETE", "PATCH"]
        },
        "error_code": {
          "type": ["string", "null"],
          "maxLength": 100,
          "description": "Código de erro interno"
        },
        "response_time_ms": {
          "type": ["integer", "null"],
          "minimum": 0,
          "description": "Tempo de resposta em ms"
        }
      }
    }
  }
}
```

---

## C) Resumo dos Schemas

| Evento | Categoria | Campos Obrigatórios | Versão Estável |
|--------|-----------|---------------------|----------------|
| `page_view` | navigation | page_type | 1.0.0 |
| `session_start` | navigation | traffic_source, referrer_host | 1.0.0 |
| `session_end` | navigation | duration_seconds, pageviews_count | 1.0.0 |
| `article_read_start` | content | article_id, category | 1.0.0 |
| `article_read_progress` | content | article_id, scroll_depth_percent | 1.0.0 |
| `article_read_complete` | content | article_id, total_time_seconds | 1.0.0 |
| `scroll_depth` | engagement | depth_percent | 1.0.0 |
| `click` | engagement | target_type, target_id | 1.0.0 |
| `search` | engagement | query | 1.0.0 |
| `web_vital` | performance | name, value, rating | 1.0.0 |
| `js_error` | error | message | 1.0.0 |
| `api_error` | error | endpoint, status_code | 1.0.0 |

---

**Data de criação:** 2024-01-17  
**Versão:** 1.0.0  
**Autor:** Engenharia de Dados PEM  
**Status:** Especificação ativa
