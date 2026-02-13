# Qualidade de Dados e Monitoramento

## D) Regras de Qualidade de Dados + Monitoramento

---

### D.1 Regras de Validação Server-Side

#### D.1.1 Validação de Timestamps

```typescript
// collector/src/validation/timestamp.ts

export function validateTimestamp(timestamp: number): ValidationResult {
  const now = Date.now();
  const oneHour = 60 * 60 * 1000;
  const minDate = new Date('2020-01-01').getTime();
  
  // Rejeitar timestamps no futuro (mais de 1 hora à frente)
  if (timestamp > now + oneHour) {
    return {
      valid: false,
      error: 'timestamp_future',
      message: `Timestamp ${timestamp} está no futuro`,
      action: 'reject'
    };
  }
  
  // Rejeitar timestamps muito antigos (antes de 2020)
  if (timestamp < minDate) {
    return {
      valid: false,
      error: 'timestamp_too_old',
      message: `Timestamp ${timestamp} é anterior a 2020`,
      action: 'reject'
    };
  }
  
  // Alertar sobre timestamps muito no passado (> 7 dias)
  const sevenDays = 7 * 24 * 60 * 60 * 1000;
  if (timestamp < now - sevenDays) {
    return {
      valid: true,
      warning: 'timestamp_stale',
      message: `Timestamp ${timestamp} tem mais de 7 dias`,
      action: 'accept_with_flag'
    };
  }
  
  return { valid: true };
}
```

#### D.1.2 Validação de URLs

```typescript
// collector/src/validation/url.ts

export function validateUrl(url: string): ValidationResult {
  // Tamanho máximo
  if (url.length > 2048) {
    return {
      valid: false,
      error: 'url_too_long',
      message: `URL excede 2048 caracteres (${url.length})`,
      action: 'truncate_or_reject'
    };
  }
  
  // Formato válido
  try {
    const urlObj = new URL(url);
    
    // Protocolo permitido
    if (!['http:', 'https:'].includes(urlObj.protocol)) {
      return {
        valid: false,
        error: 'url_invalid_protocol',
        message: `Protocolo ${urlObj.protocol} não permitido`,
        action: 'reject'
      };
    }
    
    // Host válido
    if (!urlObj.hostname.includes('.')) {
      return {
        valid: false,
        error: 'url_invalid_host',
        message: 'Hostname inválido',
        action: 'reject'
      };
    }
    
  } catch (e) {
    return {
      valid: false,
      error: 'url_malformed',
      message: 'URL malformada',
      action: 'reject'
    };
  }
  
  return { valid: true };
}

// Canonização de URL
export function canonicalizeUrl(url: string): string {
  const urlObj = new URL(url);
  
  // Remover parâmetros de tracking
  const trackingParams = [
    'utm_source', 'utm_medium', 'utm_campaign',
    'utm_term', 'utm_content', 'utm_id',
    'fbclid', 'gclid', 'ttclid', 'wbraid',
    'ref', 'source', 'medium'
  ];
  
  trackingParams.forEach(param => {
    urlObj.searchParams.delete(param);
  });
  
  // Remover hash
  urlObj.hash = '';
  
  // Lowercase hostname
  urlObj.hostname = urlObj.hostname.toLowerCase();
  
  return urlObj.toString();
}
```

#### D.1.3 Validação de Property Overflow

```typescript
// collector/src/validation/properties.ts

const LIMITS = {
  MAX_PROPERTIES_COUNT: 50,           // Máximo de propriedades
  MAX_PROPERTY_KEY_LENGTH: 50,        // Tamanho máximo da chave
  MAX_PROPERTY_VALUE_LENGTH: 1000,    // Tamanho máximo do valor string
  MAX_PROPERTY_DEPTH: 3,              // Profundidade máxida do objeto
  MAX_PAYLOAD_SIZE_BYTES: 16384       // 16KB payload total
};

export function validateProperties(
  properties: Record<string, any>, 
  depth: number = 0
): ValidationResult {
  // Verificar profundidade
  if (depth > LIMITS.MAX_PROPERTY_DEPTH) {
    return {
      valid: false,
      error: 'properties_too_deep',
      message: `Propriedades excedem profundidade máxima ${LIMITS.MAX_PROPERTY_DEPTH}`,
      action: 'reject'
    };
  }
  
  // Verificar contagem
  const keys = Object.keys(properties);
  if (keys.length > LIMITS.MAX_PROPERTIES_COUNT) {
    return {
      valid: false,
      error: 'properties_too_many',
      message: `Mais de ${LIMITS.MAX_PROPERTIES_COUNT} propriedades (${keys.length})`,
      action: 'truncate'
    };
  }
  
  for (const key of keys) {
    // Validar chave
    if (key.length > LIMITS.MAX_PROPERTY_KEY_LENGTH) {
      return {
        valid: false,
        error: 'property_key_too_long',
        message: `Chave '${key}' excede ${LIMITS.MAX_PROPERTY_KEY_LENGTH} caracteres`,
        action: 'reject'
      };
    }
    
    // Validar valor
    const value = properties[key];
    
    if (typeof value === 'string' && value.length > LIMITS.MAX_PROPERTY_VALUE_LENGTH) {
      return {
        valid: false,
        error: 'property_value_too_long',
        message: `Valor da chave '${key}' excede ${LIMITS.MAX_PROPERTY_VALUE_LENGTH} caracteres`,
        action: 'truncate'
      };
    }
    
    // Recursão para objetos aninhados
    if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
      const nestedValidation = validateProperties(value, depth + 1);
      if (!nestedValidation.valid) {
        return nestedValidation;
      }
    }
  }
  
  return { valid: true };
}
```

#### D.1.4 Detecção de Anomalias de Rate

```typescript
// collector/src/validation/rate-anomaly.ts

interface RateWindow {
  userId: string;
  eventCount: number;
  windowStart: number;
  events: string[];
}

const ANOMALY_THRESHOLDS = {
  EVENTS_PER_MINUTE: 30,           // Máximo normal
  EVENTS_PER_MINUTE_SUSPICIOUS: 60, // Suspeito
  EVENTS_PER_MINUTE_ABUSIVE: 100,   // Abusivo (bloquear)
  
  SAME_EVENT_PER_MINUTE: 10,       // Mesmo evento repetido
  SESSIONS_PER_MINUTE: 5           // Múltiplas sessões
};

const rateWindows = new Map<string, RateWindow>();

export function checkRateAnomaly(
  userId: string, 
  eventName: string
): ValidationResult {
  const now = Date.now();
  const windowKey = `${userId}:${Math.floor(now / 60000)}`; // Janela de 1 minuto
  
  let window = rateWindows.get(windowKey);
  
  if (!window) {
    window = {
      userId,
      eventCount: 0,
      windowStart: now,
      events: []
    };
    rateWindows.set(windowKey, window);
  }
  
  window.eventCount++;
  window.events.push(eventName);
  
  // Cleanup de janelas antigas (a cada 5 minutos)
  if (window.eventCount % 100 === 0) {
    cleanupOldWindows(now);
  }
  
  // Verificar limites
  if (window.eventCount > ANOMALY_THRESHOLDS.EVENTS_PER_MINUTE_ABUSIVE) {
    return {
      valid: false,
      error: 'rate_anomaly_abusive',
      message: `Taxa excessiva: ${window.eventCount} eventos/min`,
      action: 'block_and_alert'
    };
  }
  
  if (window.eventCount > ANOMALY_THRESHOLDS.EVENTS_PER_MINUTE_SUSPICIOUS) {
    return {
      valid: true,
      warning: 'rate_anomaly_suspicious',
      message: `Taxa suspeita: ${window.eventCount} eventos/min`,
      action: 'accept_with_flag'
    };
  }
  
  // Verificar repetição do mesmo evento
  const sameEventCount = window.events.filter(e => e === eventName).length;
  if (sameEventCount > ANOMALY_THRESHOLDS.SAME_EVENT_PER_MINUTE) {
    return {
      valid: true,
      warning: 'repeated_event_anomaly',
      message: `Evento '${eventName}' repetido ${sameEventCount}x`,
      action: 'deduplicate'
    };
  }
  
  return { valid: true };
}

function cleanupOldWindows(now: number): void {
  const cutoff = now - 5 * 60 * 1000; // 5 minutos
  for (const [key, window] of rateWindows.entries()) {
    if (window.windowStart < cutoff) {
      rateWindows.delete(key);
    }
  }
}
```

---

### D.2 Métricas de Qualidade

#### D.2.1 Tabela de Métricas

```sql
-- Tabela para métricas de qualidade
CREATE TABLE data_quality_metrics (
    id SERIAL PRIMARY KEY,
    measured_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Período
    period_start TIMESTAMPTZ NOT NULL,
    period_end TIMESTAMPTZ NOT NULL,
    period_type VARCHAR(20) NOT NULL,  -- 'hour', 'day'
    
    -- Volume
    total_events_received INTEGER DEFAULT 0,
    total_events_accepted INTEGER DEFAULT 0,
    total_events_rejected INTEGER DEFAULT 0,
    total_events_warning INTEGER DEFAULT 0,
    
    -- Taxas
    rejection_rate_percent DECIMAL(5,2),
    warning_rate_percent DECIMAL(5,2),
    duplicate_rate_percent DECIMAL(5,2),
    
    -- Latência
    latency_p50_ms INTEGER,
    latency_p95_ms INTEGER,
    latency_p99_ms INTEGER,
    
    -- Top rejeições
    top_rejection_reasons JSONB,
    
    -- Anomalias detectadas
    rate_anomalies_detected INTEGER DEFAULT 0,
    rate_anomalies_blocked INTEGER DEFAULT 0
);

-- Índice
CREATE INDEX idx_quality_metrics_period 
    ON data_quality_metrics (period_type, period_start DESC);
```

#### D.2.2 Query de Dashboard de Qualidade

```sql
-- View para dashboard de qualidade
CREATE OR REPLACE VIEW vw_data_quality_dashboard AS
WITH hourly_stats AS (
    SELECT 
        DATE_TRUNC('hour', received_at) as hour,
        COUNT(*) as total,
        COUNT(*) FILTER (WHERE error_message IS NULL) as accepted,
        COUNT(*) FILTER (WHERE error_message IS NOT NULL) as rejected
    FROM events_raw
    WHERE received_at > NOW() - INTERVAL '24 hours'
    GROUP BY 1
)
SELECT 
    hour,
    total,
    accepted,
    rejected,
    ROUND(rejected::NUMERIC / NULLIF(total, 0) * 100, 2) as rejection_rate_percent
FROM hourly_stats
ORDER BY hour DESC;
```

#### D.2.3 Alertas de Qualidade

```sql
-- Função para verificar qualidade e alertar
CREATE OR REPLACE FUNCTION check_data_quality()
RETURNS TABLE (
    alert_type VARCHAR,
    severity VARCHAR,
    message TEXT,
    metric_value NUMERIC
) AS $$
DECLARE
    v_last_hour_stats RECORD;
    v_baseline_stats RECORD;
BEGIN
    -- Estatísticas da última hora
    SELECT 
        COUNT(*) as total,
        COUNT(*) FILTER (WHERE error_message IS NOT NULL) as rejected,
        AVG(EXTRACT(EPOCH FROM (received_at - event_timestamp))) * 1000 as avg_latency_ms
    INTO v_last_hour_stats
    FROM events_raw
    WHERE received_at > NOW() - INTERVAL '1 hour';
    
    -- Rejeição > 5%
    IF v_last_hour_stats.total > 0 AND 
       (v_last_hour_stats.rejected::NUMERIC / v_last_hour_stats.total) > 0.05 THEN
        RETURN QUERY SELECT 
            'high_rejection_rate'::VARCHAR,
            'warning'::VARCHAR,
            format('Taxa de rejeição: %.2f%%', 
                v_last_hour_stats.rejected::NUMERIC / v_last_hour_stats.total * 100)::TEXT,
            (v_last_hour_stats.rejected::NUMERIC / v_last_hour_stats.total * 100)::NUMERIC;
    END IF;
    
    -- Latência > 500ms (p95)
    IF v_last_hour_stats.avg_latency_ms > 500 THEN
        RETURN QUERY SELECT 
            'high_latency'::VARCHAR,
            'warning'::VARCHAR,
            format('Latência média: %.0f ms', v_last_hour_stats.avg_latency_ms)::TEXT,
            v_last_hour_stats.avg_latency_ms::NUMERIC;
    END IF;
    
    -- Volume anômalo (diferença > 50% da média 7d)
    SELECT AVG(daily_count) as avg_daily
    INTO v_baseline_stats
    FROM (
        SELECT DATE(received_at), COUNT(*) as daily_count
        FROM events_raw
        WHERE received_at > NOW() - INTERVAL '7 days'
        GROUP BY 1
    ) sub;
    
    IF v_last_hour_stats.total > (v_baseline_stats.avg_daily / 24 * 1.5) THEN
        RETURN QUERY SELECT 
            'high_volume_anomaly'::VARCHAR,
            'info'::VARCHAR,
            format('Volume %.0f%% acima da média', 
                (v_last_hour_stats.total / (v_baseline_stats.avg_daily / 24) - 1) * 100)::TEXT,
            (v_last_hour_stats.total / (v_baseline_stats.avg_daily / 24))::NUMERIC;
    END IF;
    
    RETURN;
END;
$$ LANGUAGE plpgsql;
```

---

### D.3 Dead-Letter Queue

#### D.3.1 Tabela de Eventos Rejeitados

```sql
-- Tabela para armazenar amostra de eventos rejeitados
CREATE TABLE events_rejected (
    id BIGSERIAL PRIMARY KEY,
    received_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Original payload (anonimizado)
    original_payload JSONB,
    
    -- Motivo da rejeição
    rejection_reason VARCHAR(100) NOT NULL,
    rejection_code VARCHAR(50) NOT NULL,
    validation_details JSONB,
    
    -- Contexto (sem PII)
    event_name VARCHAR(50),
    schema_version VARCHAR(10),
    url_host VARCHAR(255),
    
    -- Sampling (não guardar tudo)
    is_sample BOOLEAN DEFAULT TRUE,
    sample_rate INTEGER DEFAULT 100,  -- 1 em cada N
    
    -- Retenção curta
    expires_at TIMESTAMPTZ DEFAULT NOW() + INTERVAL '7 days'
);

-- Índice para expiry
CREATE INDEX idx_events_rejected_expires 
    ON events_rejected (expires_at);

-- Parte da função de inserção com sampling
CREATE OR REPLACE FUNCTION log_rejected_event(
    p_payload JSONB,
    p_reason VARCHAR,
    p_code VARCHAR,
    p_details JSONB
) RETURNS VOID AS $$
BEGIN
    -- Sample apenas 1% dos eventos rejeitados
    IF random() < 0.01 THEN
        INSERT INTO events_rejected (
            original_payload,
            rejection_reason,
            rejection_code,
            validation_details,
            event_name,
            schema_version,
            url_host,
            is_sample,
            sample_rate
        ) VALUES (
            -- Remover PII do payload antes de armazenar
            p_payload - 'user_id' - 'session_id',
            p_reason,
            p_code,
            p_details,
            p_payload->>'event',
            p_payload->>'v',
            (p_payload->>'url')::JSONB->>'host',
            TRUE,
            100
        );
    END IF;
END;
$$ LANGUAGE plpgsql;

-- Cleanup automático de eventos expirados
CREATE OR REPLACE FUNCTION cleanup_expired_rejected_events()
RETURNS INTEGER AS $$
DECLARE
    v_deleted INTEGER;
BEGIN
    DELETE FROM events_rejected 
    WHERE expires_at < NOW();
    
    GET DIAGNOSTICS v_deleted = ROW_COUNT;
    RETURN v_deleted;
END;
$$ LANGUAGE plpgsql;
```

---

### D.4 Casos de Teste Automatizáveis

#### D.4.1 Testes de Unidade

```typescript
// collector/tests/validation.test.ts

describe('Validação de Eventos', () => {
  
  describe('Timestamp', () => {
    it('deve aceitar timestamp válido', () => {
      const result = validateTimestamp(Date.now() - 1000);
      expect(result.valid).toBe(true);
    });
    
    it('deve rejeitar timestamp no futuro (> 1h)', () => {
      const result = validateTimestamp(Date.now() + 2 * 60 * 60 * 1000);
      expect(result.valid).toBe(false);
      expect(result.error).toBe('timestamp_future');
    });
    
    it('deve rejeitar timestamp muito antigo (< 2020)', () => {
      const result = validateTimestamp(new Date('2019-01-01').getTime());
      expect(result.valid).toBe(false);
      expect(result.error).toBe('timestamp_too_old');
    });
    
    it('deve alertar sobre timestamp antigo (> 7 dias)', () => {
      const result = validateTimestamp(Date.now() - 10 * 24 * 60 * 60 * 1000);
      expect(result.valid).toBe(true);
      expect(result.warning).toBe('timestamp_stale');
    });
  });
  
  describe('URL', () => {
    it('deve aceitar URL HTTPS válida', () => {
      const result = validateUrl('https://example.com/path');
      expect(result.valid).toBe(true);
    });
    
    it('deve rejeitar URL muito longa', () => {
      const longUrl = 'https://example.com/' + 'a'.repeat(3000);
      const result = validateUrl(longUrl);
      expect(result.valid).toBe(false);
      expect(result.error).toBe('url_too_long');
    });
    
    it('deve rejeitar protocolo inválido', () => {
      const result = validateUrl('ftp://example.com/file');
      expect(result.valid).toBe(false);
      expect(result.error).toBe('url_invalid_protocol');
    });
    
    it('deve rejeitar URL malformada', () => {
      const result = validateUrl('not-a-valid-url');
      expect(result.valid).toBe(false);
      expect(result.error).toBe('url_malformed');
    });
  });
  
  describe('Propriedades', () => {
    it('deve aceitar propriedades válidas', () => {
      const props = { key1: 'value1', key2: 123 };
      const result = validateProperties(props);
      expect(result.valid).toBe(true);
    });
    
    it('deve rejeitar muitas propriedades', () => {
      const props = {};
      for (let i = 0; i < 60; i++) {
        props[`key${i}`] = 'value';
      }
      const result = validateProperties(props);
      expect(result.valid).toBe(false);
      expect(result.error).toBe('properties_too_many');
    });
    
    it('deve rejeitar propriedade muito profunda', () => {
      const props = {
        level1: {
          level2: {
            level3: {
              level4: 'too deep'
            }
          }
        }
      };
      const result = validateProperties(props);
      expect(result.valid).toBe(false);
      expect(result.error).toBe('properties_too_deep');
    });
    
    it('deve rejeitar valor muito longo', () => {
      const props = {
        key: 'a'.repeat(2000)
      };
      const result = validateProperties(props);
      expect(result.valid).toBe(false);
      expect(result.error).toBe('property_value_too_long');
    });
  });
  
  describe('Rate Anomaly', () => {
    it('deve aceitar taxa normal', () => {
      const userId = 'user-1';
      for (let i = 0; i < 20; i++) {
        const result = checkRateAnomaly(userId, 'page_view');
        expect(result.valid).toBe(true);
        expect(result.warning).toBeUndefined();
      }
    });
    
    it('deve alertar sobre taxa suspeita', () => {
      const userId = 'user-2';
      for (let i = 0; i < 70; i++) {
        checkRateAnomaly(userId, 'page_view');
      }
      const result = checkRateAnomaly(userId, 'page_view');
      expect(result.warning).toBe('rate_anomaly_suspicious');
    });
    
    it('deve bloquear taxa abusiva', () => {
      const userId = 'user-3';
      for (let i = 0; i < 110; i++) {
        checkRateAnomaly(userId, 'page_view');
      }
      const result = checkRateAnomaly(userId, 'page_view');
      expect(result.valid).toBe(false);
      expect(result.error).toBe('rate_anomaly_abusive');
    });
  });
  
});
```

#### D.4.2 Testes de Integração

```typescript
// collector/tests/integration/collect.test.ts

describe('Endpoint /collect', () => {
  
  it('deve aceitar evento válido completo', async () => {
    const response = await request(app)
      .post('/collect')
      .send({
        v: '1.0.0',
        event: 'page_view',
        user_id: '550e8400-e29b-41d4-a716-446655440000',
        session_id: '6ba7b810-9dad-11d1-80b4-00c04fd430c8',
        timestamp: Date.now(),
        url: 'https://portaleconomicomundial.com/',
        properties: {
          page_type: 'home'
        }
      });
    
    expect(response.status).toBe(204);
  });
  
  it('deve rejeitar evento sem campos obrigatórios', async () => {
    const response = await request(app)
      .post('/collect')
      .send({
        v: '1.0.0',
        event: 'page_view'
        // faltando timestamp e url
      });
    
    expect(response.status).toBe(400);
    expect(response.body.error).toBe('validation_failed');
  });
  
  it('deve rejeitar evento duplicado', async () => {
    const event = {
      v: '1.0.0',
      event: 'page_view',
      user_id: '550e8400-e29b-41d4-a716-446655440000',
      session_id: '6ba7b810-9dad-11d1-80b4-00c04fd430c8',
      timestamp: Date.now(),
      url: 'https://portaleconomicomundial.com/',
      properties: {}
    };
    
    // Primeiro envio
    await request(app).post('/collect').send(event);
    
    // Segundo envio (duplicado)
    const response = await request(app).post('/collect').send(event);
    expect(response.status).toBe(409);
  });
  
  it('deve aceitar evento anônimo válido', async () => {
    const response = await request(app)
      .post('/collect')
      .send({
        v: '1.0.0',
        event: 'error_js',
        user_id: null,
        session_id: null,
        anonymous: true,
        timestamp: Date.now(),
        url: 'https://portaleconomicomundial.com/',
        properties: {
          message: 'Test error'
        }
      });
    
    expect(response.status).toBe(204);
  });
  
  it('deve rejeitar evento anônimo com user_id', async () => {
    const response = await request(app)
      .post('/collect')
      .send({
        v: '1.0.0',
        event: 'error_js',
        user_id: '550e8400-e29b-41d4-a716-446655440000', // Não permitido
        session_id: null,
        anonymous: true,
        timestamp: Date.now(),
        url: 'https://portaleconomicomundial.com/',
        properties: {}
      });
    
    expect(response.status).toBe(400);
    expect(response.body.error).toContain('anonymous');
  });
  
  it('deve rejeitar evento não-essencial em opt-out', async () => {
    // Simular usuário com consentimento negativo
    const userId = 'user-opted-out';
    
    const response = await request(app)
      .post('/collect')
      .send({
        v: '1.0.0',
        event: 'page_view', // Evento não-essencial
        user_id: userId,
        session_id: 'session-123',
        timestamp: Date.now(),
        url: 'https://portaleconomicomundial.com/',
        properties: {}
      })
      .set('X-Consent-Analytics', 'false'); // Header simulando opt-out
    
    expect(response.status).toBe(403);
  });
  
});
```

#### D.4.3 Testes de Carga

```typescript
// collector/tests/load/k6-load-test.js

import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = {
  stages: [
    { duration: '2m', target: 100 },   // Ramp up
    { duration: '5m', target: 100 },   // Steady state
    { duration: '2m', target: 200 },   // Spike
    { duration: '5m', target: 200 },   // Steady state spike
    { duration: '2m', target: 0 },     // Ramp down
  ],
  thresholds: {
    http_req_duration: ['p(95)<100'],   // 95% < 100ms
    http_req_failed: ['rate<0.01'],      // < 1% erros
  },
};

const BASE_URL = __ENV.BASE_URL || 'http://localhost:3000';

export default function () {
  const payload = JSON.stringify({
    v: '1.0.0',
    event: 'page_view',
    user_id: `user-${Math.floor(Math.random() * 10000)}`,
    session_id: `session-${Math.floor(Math.random() * 100000)}`,
    timestamp: Date.now(),
    url: 'https://portaleconomicomundial.com/teste',
    properties: {
      page_type: 'article'
    }
  });
  
  const response = http.post(`${BASE_URL}/collect`, payload, {
    headers: {
      'Content-Type': 'application/json',
    },
  });
  
  check(response, {
    'status is 204': (r) => r.status === 204,
    'response time < 100ms': (r) => r.timings.duration < 100,
  });
  
  sleep(1);
}
```

---

## E) Plano de Implementação

### E.1 Ordem de Implementação

```
FASE 1: Fundação (Semanas 1-2)
├── 1.1 Setup PostgreSQL
│   ├── Criar database e usuários
│   ├── Executar migrations 0001-0010
│   ├── Configurar partições iniciais
│   └── Validar índices
│
├── 1.2 Collector API Base
│   ├── Setup Fastify
│   ├── Endpoint /health
│   ├── Conexão PostgreSQL
│   └── Logging estruturado
│
└── Critério de aceite: 
    curl /health retorna 200
    INSERT manual funciona

FASE 2: Ingestão (Semanas 3-4)
├── 2.1 Endpoint /collect
│   ├── Schema validation (JSON Schema)
│   ├── Deduplicação
│   ├── Rate limiting
│   └── INSERT em events_raw
│
├── 2.2 Validações
│   ├── Timestamp validation
│   ├── URL validation
│   ├── Property overflow check
│   └── LGPD compliance check
│
└── Critério de aceite:
    1000 req/s sem perda
    < 50ms latência p95

FASE 3: Processamento (Semanas 5-6)
├── 3.1 ETL Hourly
│   ├── Processar events_raw
│   ├── Popular sessions
│   ├── Popular page_views
│   └── Marcar como processed
│
├── 3.2 Normalização
│   ├── article_events
│   └── errors
│
└── Critério de aceite:
    Lag ETL < 1 hora
    Dados consistentes RAW ↔ Normalizado

FASE 4: Agregações (Semanas 7-8)
├── 4.1 Materialized Views
│   ├── mv_daily_metrics
│   ├── article_metrics_daily
│   └── acquisition_metrics_daily
│
├── 4.2 Refresh automation
│   ├── Schedule (cron/scheduler)
│   └── REFRESH CONCURRENTLY
│
└── Critério de aceite:
    Dashboards populados
    Refresh < 5 minutos

FASE 5: Qualidade (Semanas 9-10)
├── 5.1 Monitoramento
│   ├── data_quality_metrics
│   ├── Alertas automáticos
│   └── Dashboard de qualidade
│
├── 5.2 Dead-letter
│   ├── events_rejected
│   ├── Sampling
│   └── Cleanup automático
│
└── Critério de aceite:
    < 1% rejeição
    Alertas funcionando

FASE 6: LGPD & Polimento (Semanas 11-12)
├── 6.1 LGPD endpoints
│   ├── POST /forget
│   ├── GET /export
│   └── Revogação automática
│
├── 6.2 SDK Client
│   ├── Consent management
│   ├── Opt-out handling
│   └── Queue offline
│
└── Critério de aceite:
    Testes LGPD passam
    Cookie banner funcional
```

### E.2 Critérios de Aceite por Etapa

| Fase | Critério | Como Validar |
|------|----------|--------------|
| 1 | Database funcional | `psql -c "SELECT 1"` |
| 2 | Ingestão funciona | `curl -X POST /collect` → 204 |
| 3 | ETL funciona | `SELECT COUNT(*) FROM sessions` > 0 |
| 4 | Agregações funcionam | `REFRESH MATERIALIZED VIEW` ok |
| 5 | Qualidade monitorada | Alerta de teste disparado |
| 6 | LGPD compliant | Revogação remove dados |

### E.3 Estratégia de Rollback

```
Problema detectado:
├── Fase 1 (Database): 
│   └── Restore de backup
│
├── Fase 2-3 (Collector/ETL):
│   ├── Rollback para versão anterior (git)
│   ├── Manter database (dados são compatíveis)
│   └── Redeploy
│
├── Fase 4 (Agregações):
│   ├── DROP MATERIALIZED VIEW
│   ├── Recriar versão anterior
│   └── REFRESH
│
└── Fase 5-6 (Qualidade/LGPD):
    ├── Desabilitar feature flag
    └── Manter dados existentes
```

---

**Data de criação:** 2024-01-17  
**Versão:** 1.0.0  
**Autor:** Engenharia de Dados CIN
