# Conformidade LGPD - Guia Técnico Completo

## Visão Geral

Este documento define os requisitos técnicos e comportamentos do sistema de analytics para garantir total conformidade com a **Lei Geral de Proteção de Dados (LGPD - Lei 13.709/2018)**.

---

## 1. Princípios Fundamentais

### 1.1 Base Legal

Nossa base legal para processamento de dados é o **consentimento livre, específico e informado** (Art. 7º, I da LGPD), implementado através de:

- Banner de consentimento explícito
- Granularidade por finalidade (analytics separado de marketing)
- Registro de quando/how o consentimento foi dado
- Facilidade de revogação igual à de conceder

### 1.2 Dados que NUNCA Coletamos

| Tipo de Dado | Razão | LGPD |
|--------------|-------|------|
| **Nome completo** | Identificação direta | Art. 5º, II |
| **CPF/CNPJ** | Identificação direta | Art. 5º, II |
| **E-mail** | Identificação direta | Art. 5º, II |
| **Endereço IP (texto)** | Identificação possível | Art. 5º, I |
| **Precisão de localização** | Dado sensível | Art. 5º, II, §2º |
| **Dados de saúde** | Dado sensível | Art. 11º |
| **Raça/etnia** | Dado sensível | Art. 5º, II, §1º |
| **Fingerprint agressivo** (canvas/fonts) | Rastreamento invasivo | Art. 7º |
| **Cross-site tracking** | Sem consentimento específico | Art. 7º |

### 1.3 Dados que Coletamos (Com Consentimento)

| Dado | Pseudonimização | Finalidade |
|------|-----------------|------------|
| `user_id` (UUID) | Sim - aleatório | Distinção de usuários |
| `session_id` (UUID) | Sim - aleatório | Análise de sessão |
| `ip_hash` (SHA-256) | Sim - hash + salt | Segurança/rate limit |
| `user_agent_hash` | Sim - hash | Detecção de device |
| `url_path` | Parcial - sem query | Análise de conteúdo |
| `scroll_depth` | N/A - comportamento | Engajamento |
| `timestamp` | N/A - técnico | Ordenação temporal |

---

## 2. Estados de Consentimento

### 2.1 Máquina de Estados

```
                    ┌─────────────────┐
                    │   SEM COOKIE    │
                    │  (first visit)  │
                    └────────┬────────┘
                             │
                    Mostrar banner LGPD
                             │
              ┌──────────────┼──────────────┐
              │              │              │
              ▼              ▼              ▼
       ┌──────────┐   ┌──────────┐   ┌──────────┐
       │  ACCEPT  │   │  DENY    │   │  PENDING │
       │analytics │   │analytics │   │ (fechou  │
       │ = true   │   │ = false  │   │  banner) │
       └────┬─────┘   └────┬─────┘   └────┬─────┘
            │              │              │
            ▼              ▼              ▼
       ┌──────────┐   ┌──────────┐   ┌──────────┐
       │ Coletar  │   │ MODO     │   │ MODO     │
       │ tudo     │   │ ANÔNIMO  │   │ ANÔNIMO  │
       └──────────┘   │ mínimo   │   │ mínimo   │
                      └──────────┘   └──────────┘
                             │              │
                             └──────┬───────┘
                                    │
                         Usuário clica "Alterar"
                                    │
                                    ▼
                           ┌──────────────┐
                           │  SETTINGS    │
                           │  PREFERENCES │
                           └──────────────┘
```

### 2.2 Cookie de Consentimento (`__pem_consent`)

**Estrutura:**
```json
{
  "v": "1.0",
  "analytics": true,
  "timestamp": 1704393600000,
  "banner_shown": true,
  "banner_version": "1.0"
}
```

**Codificação:** Base64Url (seguro para cookies)

**Duração:**
- Se `analytics: true` → 180 dias
- Se `analytics: false` → 365 dias (lembrar preferência)

---

## 3. Comportamento por Estado

### 3.1 Estado: `analytics = false` (Opt-out)

#### Eventos BLOQUEADOS (Nunca enviados)

| Evento | Categoria | Razão |
|--------|-----------|-------|
| `page_view` | Navegação | Identifica comportamento |
| `article_read_*` | Conteúdo | Perfil de interesses |
| `session_start/end` | Sessão | Tracking de jornada |
| `video_play` | Mídia | Preferências |
| `scroll_depth` | Engajamento | Comportamento |
| `click` | Interação | Tracking detalhado |
| `search_execute` | Busca | Intenção do usuário |

#### Eventos PERMITIDOS (Anonimizados)

| Evento | Dados Coletados | Finalidade | Base Legal |
|--------|-----------------|------------|------------|
| `error_js` | Message, source, line | Funcionamento do site | Legítimo interesse |
| `error_api` | Endpoint, status | Funcionamento do site | Legítimo interesse |
| `perf_web_vital` | LCP, CLS (sem user_id) | Performance técnica | Legítimo interesse |

**Nota:** Eventos permitidos em opt-out **NÃO** incluem `user_id`, `session_id`, ou qualquer identificador. São enviados como "eventos órfãos" para métricas agregadas de saúde do sistema.

#### Pseudocódigo - SDK em Opt-out

```typescript
// SDK Initialization
class AnalyticsSDK {
  private consent: ConsentState = 'unknown';
  private userId: string | null = null;
  private sessionId: string | null = null;
  
  init() {
    // 1. Verificar cookie de consentimento
    const consentCookie = this.getCookie('__pem_consent');
    
    if (!consentCookie) {
      // Primeira visita - mostrar banner
      this.showBanner();
      this.consent = 'pending';
      this.setAnonymousMode();
    } else {
      const consent = this.parseConsent(consentCookie);
      
      if (consent.analytics === false) {
        // Opt-out explícito
        this.consent = 'denied';
        this.setAnonymousMode();
        this.clearTrackingIds(); // Limpar IDs existentes
      } else {
        // Opt-in
        this.consent = 'granted';
        this.initTrackingIds();
      }
    }
  }
  
  // Modo anônimo - apenas eventos essenciais
  private setAnonymousMode() {
    this.userId = null;
    this.sessionId = null;
    
    // Limpar cookies de tracking
    this.deleteCookie('__pem_uid');
    this.deleteCookie('__pem_sid');
    
    // Limpar localStorage relacionado
    localStorage.removeItem('pem_analytics_queue');
  }
  
  track(eventName: string, properties?: object) {
    // Verificar se evento é permitido em modo anônimo
    const allowedAnonymousEvents = [
      'error_js',
      'error_api', 
      'error_resource',
      'perf_web_vital'
    ];
    
    if (this.consent === 'denied') {
      if (!allowedAnonymousEvents.includes(eventName)) {
        // Evento bloqueado - não enviar
        return Promise.resolve({ blocked: true, reason: 'consent_denied' });
      }
      
      // Enviar evento anônimo (sem IDs)
      return this.sendAnonymousEvent(eventName, properties);
    }
    
    // Consentimento concedido - enviar normalmente
    return this.sendEvent(eventName, properties);
  }
  
  private sendAnonymousEvent(eventName: string, properties: object) {
    // Evento sem user_id e session_id
    const payload = {
      v: '1.0',
      event: eventName,
      // SEM user_id
      // SEM session_id
      timestamp: Date.now(),
      url: window.location.href,
      properties: this.sanitizeProperties(properties),
      anonymous: true // Flag para o collector
    };
    
    return this.sendToCollector(payload);
  }
}
```

---

### 3.2 Estado: Consentimento Pendente (`pending`)

#### Comportamento

```
Usuário chega no site
    │
    ▼
┌───────────────────────────────┐
│ 1. Mostrar banner LGPD        │
│ 2. Setar cookie:              │
│    __pem_consent = {          │
│      analytics: null,         │
│      banner_shown: true       │
│    }                          │
└───────────────────────────────┘
    │
    ▼
┌───────────────────────────────┐
│ MODO ANÔNIMO ATIVO            │
│                               │
│ • Não gerar user_id           │
│ • Não gerar session_id        │
• • Não enviar eventos de       │
│   comportamento               │
│ • Permitir eventos essenciais │
│   (erros, performance)        │
└───────────────────────────────┘
    │
    ▼
┌───────────────────────────────┐
│ Usuário interage com banner:  │
│                               │
│ [Aceitar] → analytics: true   │
│ [Recusar] → analytics: false  │
│ [Fechar]  → permanece pending │
└───────────────────────────────┘
```

#### Regras do Banner

- **Posição:** Bottom da tela (não bloqueia conteúdo)
- **Design:** Claro, em português, sem dark patterns
- **Ações:**
  - "Aceitar" - consentimento analytics
  - "Recusar" - negação explícita
  - "Personalizar" - escolha granular
  - "Fechar (X)" - não equivale a aceite

#### Eventos em Estado Pending

Mesmo comportamento de `analytics = false` até que o usuário tome uma decisão explícita.

---

### 3.3 Estado: Opt-out Posterior (Revogação)

#### Comportamento

Quando usuário revoga consentimento após ter dado:

```typescript
class AnalyticsSDK {
  revokeConsent() {
    // 1. Atualizar cookie imediatamente
    this.setCookie('__pem_consent', JSON.stringify({
      v: '1.0',
      analytics: false,
      timestamp: Date.now(),
      previous_consent: true // Flag de revogação
    }), 365);
    
    // 2. Parar tracking imediatamente
    this.consent = 'denied';
    
    // 3. Limpar dados locais
    this.clearTrackingIds();
    
    // 4. Tentar enviar sinal de revogação (best effort)
    this.sendRevocationSignal();
    
    // 5. Limpar queue de eventos pendentes
    this.flushQueue();
  }
  
  private sendRevocationSignal() {
    // Último evento identificável: revoke_consent
    // Após isso, user_id é deletado
    if (this.userId) {
      this.sendToCollector({
        v: '1.0',
        event: 'consent_revoked',
        user_id: this.userId, // Última vez que user_id é enviado
        timestamp: Date.now(),
        properties: {
          previous_consent_duration: this.calculateConsentDuration()
        }
      });
    }
  }
}
```

#### Backend - Processamento de Revogação

```sql
-- Quando recebe evento consent_revoked
-- 1. Marcar usuário para anonimização
INSERT INTO lgpd_revocation_queue (user_id, revoked_at, status)
VALUES ('user-uuid', NOW(), 'pending');

-- 2. Anonimizar eventos futuros (não históricos)
-- Os dados históricos permanecem por 25 meses (retencao legal)
-- mas são anonimizados em relatórios

-- 3. Criar view excluindo usuário
CREATE OR REPLACE VIEW events_compliant AS
SELECT * FROM events_raw
WHERE user_id NOT IN (
  SELECT user_id FROM lgpd_revocation_queue WHERE status = 'completed'
);
```

---

## 4. Eventos e Níveis de Consentimento

### 4.1 Matriz de Eventos vs Consentimento

| Evento | analytics=true | analytics=false | pending |
|--------|----------------|-----------------|---------|
| `page_view` | ✅ Enviar | ❌ Bloquear | ❌ Bloquear |
| `article_read_start` | ✅ Enviar | ❌ Bloquear | ❌ Bloquear |
| `article_read_progress` | ✅ Enviar | ❌ Bloquear | ❌ Bloquear |
| `article_read_complete` | ✅ Enviar | ❌ Bloquear | ❌ Bloquear |
| `session_start` | ✅ Enviar | ❌ Bloquear | ❌ Bloquear |
| `session_end` | ✅ Enviar | ❌ Bloquear | ❌ Bloquear |
| `click` | ✅ Enviar | ❌ Bloquear | ❌ Bloquear |
| `scroll_depth` | ✅ Enviar | ❌ Bloquear | ❌ Bloquear |
| `search_execute` | ✅ Enviar | ❌ Bloquear | ❌ Bloquear |
| `video_play` | ✅ Enviar | ❌ Bloquear | ❌ Bloquear |
| `video_progress` | ✅ Enviar | ❌ Bloquear | ❌ Bloquear |
| `bookmark_add` | ✅ Enviar | ❌ Bloquear | ❌ Bloquear |
| `share` | ✅ Enviar | ❌ Bloquear | ❌ Bloquear |
| `error_js` | ✅ Enviar | ✅ Anônimo | ✅ Anônimo |
| `error_api` | ✅ Enviar | ✅ Anônimo | ✅ Anônimo |
| `error_resource` | ✅ Enviar | ✅ Anônimo | ✅ Anônimo |
| `perf_web_vital` | ✅ Enviar | ✅ Anônimo | ✅ Anônimo |
| `perf_page_load` | ✅ Enviar | ✅ Anônimo | ✅ Anônimo |
| `consent_granted` | ✅ Enviar | N/A | N/A |
| `consent_revoked` | ✅ Enviar | N/A | N/A |

### 4.2 Diferença: Evento Completo vs Anônimo

```json
// Evento COMPLETO (analytics=true)
{
  "v": "1.0",
  "event": "error_js",
  "user_id": "550e8400-e29b-41d4-a716-446655440000",
  "session_id": "6ba7b810-9dad-11d1-80b4-00c04fd430c8",
  "timestamp": 1704393600000,
  "url": "https://...",
  "properties": {
    "message": "Cannot read property...",
    "source": "app.js",
    "line": 42
  }
}

// Evento ANÔNIMO (analytics=false)
{
  "v": "1.0",
  "event": "error_js",
  "user_id": null,           // ← REMOVIDO
  "session_id": null,        // ← REMOVIDO
  "anonymous": true,         // ← FLAG ADICIONADA
  "timestamp": 1704393600000,
  "url": "https://...",      // ← Mantido para contexto
  "properties": {
    "message": "Cannot read property...",
    "source": "app.js",
    "line": 42
  }
}
```

---

## 5. Implementação Técnica

### 5.1 SDK Client - Estrutura Completa

```typescript
// sdk/src/consent.ts

export type ConsentState = 'unknown' | 'pending' | 'granted' | 'denied';

export interface ConsentConfig {
  analytics: boolean | null;
  timestamp: number;
  bannerVersion: string;
  bannerShown: boolean;
}

export class ConsentManager {
  private static readonly COOKIE_NAME = '__pem_consent';
  private static readonly COOKIE_DAYS_GRANTED = 180;
  private static readonly COOKIE_DAYS_DENIED = 365;
  
  getConsent(): ConsentConfig | null {
    const cookie = this.getCookie(ConsentManager.COOKIE_NAME);
    if (!cookie) return null;
    
    try {
      return JSON.parse(atob(cookie));
    } catch {
      return null;
    }
  }
  
  setConsent(analytics: boolean): void {
    const config: ConsentConfig = {
      analytics,
      timestamp: Date.now(),
      bannerVersion: '1.0',
      bannerShown: true
    };
    
    const days = analytics 
      ? ConsentManager.COOKIE_DAYS_GRANTED 
      : ConsentManager.COOKIE_DAYS_DENIED;
    
    this.setCookie(
      ConsentManager.COOKIE_NAME,
      btoa(JSON.stringify(config)),
      days
    );
    
    // Disparar evento para analytics
    if (analytics) {
      this.track('consent_granted', { timestamp: config.timestamp });
    } else {
      this.track('consent_revoked', { timestamp: config.timestamp });
    }
  }
  
  hasConsent(): boolean {
    const consent = this.getConsent();
    return consent !== null && consent.analytics === true;
  }
  
  shouldShowBanner(): boolean {
    const consent = this.getConsent();
    return consent === null || !consent.bannerShown;
  }
  
  private getCookie(name: string): string | null {
    const match = document.cookie.match(new RegExp('(^| )' + name + '=([^;]+)'));
    return match ? decodeURIComponent(match[2]) : null;
  }
  
  private setCookie(name: string, value: string, days: number): void {
    const expires = new Date(Date.now() + days * 864e5).toUTCString();
    document.cookie = `${name}=${encodeURIComponent(value)};expires=${expires};path=/;secure;samesite=lax`;
  }
}
```

### 5.2 Collector - Validação de Consentimento

```typescript
// collector/src/plugins/consent-validation.ts

import { FastifyPluginAsync } from 'fastify';

export const consentValidation: FastifyPluginAsync = async (fastify) => {
  fastify.addHook('preHandler', async (request, reply) => {
    // Apenas para POST /collect
    if (request.url !== '/collect') return;
    
    const body = request.body as any;
    
    // 1. Verificar flag anonymous
    if (body.anonymous === true) {
      // Evento anônimo - permitir apenas tipos específicos
      const allowedAnonymousEvents = [
        'error_js',
        'error_api',
        'error_resource',
        'perf_web_vital',
        'perf_page_load'
      ];
      
      if (!allowedAnonymousEvents.includes(body.event)) {
        reply.code(403).send({
          error: 'Anonymous events not allowed for this event type',
          allowed_events: allowedAnonymousEvents
        });
        return;
      }
      
      // Validar que não tem user_id nem session_id
      if (body.user_id || body.session_id) {
        reply.code(400).send({
          error: 'Anonymous events cannot contain user_id or session_id'
        });
        return;
      }
      
      return; // Permitir continuar
    }
    
    // 2. Evento identificado - validar que tem IDs
    if (!body.user_id || !body.session_id) {
      reply.code(400).send({
        error: 'Identified events require user_id and session_id'
      });
      return;
    }
    
    // 3. Verificar se usuário não revogou (check rápido)
    const isRevoked = await fastify.db.query(
      'SELECT 1 FROM lgpd_revocation_queue WHERE user_id = $1 AND status = $2',
      [body.user_id, 'completed']
    );
    
    if (isRevoked.rows.length > 0) {
      // Usuário revogou - aceitar evento mas marcar como anônimo
      request.body = {
        ...body,
        user_id: null,
        session_id: null,
        anonymous: true,
        _was_revoked: true // Metadado interno
      };
    }
  });
};
```

---

## 6. Endpoints LGPD

### 6.1 POST `/forget` - Direito ao Esquecimento

**Descrição:** Permite usuário solicitar deleção de seus dados.

**Request:**
```json
{
  "user_id": "550e8400-e29b-41d4-a716-446655440000",
  "confirmation_token": "token-enviado-por-email",
  "reason": "user_request"
}
```

**Processo:**
```
1. Validar token de confirmação
2. Verificar se user_id existe
3. Inserir na fila de deleção
4. Retornar prazo (30 dias conforme LGPD)
5. Enviar confirmação por email
```

**Response:**
```json
{
  "success": true,
  "request_id": "req-abc-123",
  "deletion_deadline": "2024-02-15T23:59:59Z",
  "message": "Seus dados serão completamente removidos em até 30 dias"
}
```

### 6.2 GET `/export` - Portabilidade de Dados

**Descrição:** Permite usuário exportar todos os seus dados.

**Query Params:**
- `user_id`: UUID do usuário
- `token`: Token de autenticação
- `format`: `json` ou `csv`

**Response:** Download de arquivo com todos os eventos do usuário.

---

## 7. Checklist LGPD Técnico

### 7.1 Implementação SDK

- [ ] Banner LGPD exibido na primeira visita
- [ ] Cookie `__pem_consent` configurado corretamente
- [ ] Opção "Recusar" igualmente acessível que "Aceitar"
- [ ] Nenhum evento enviado antes do consentimento (exceto essenciais)
- [ ] Eventos essenciais em opt-out não contêm identificadores
- [ ] Limpeza de cookies ao opt-out
- [ ] Evento `consent_revoked` enviado ao revogar
- [ ] Queue de eventos limpa ao opt-out

### 7.2 Implementação Collector

- [ ] Validação de eventos anônimos (whitelist)
- [ ] Rejeição de user_id/session_id em eventos anônimos
- [ ] Fila `lgpd_revocation_queue` implementada
- [ ] Endpoint `/forget` funcionando
- [ ] Endpoint `/export` funcionando
- [ ] Retenção automática de dados (25 meses)
- [ ] Anonimização em eventos de usuários revogados

### 7.3 Banco de Dados

- [ ] Tabela `lgpd_revocation_queue` criada
- [ ] Tabela `lgpd_deletion_requests` criada
- [ ] Particionamento por data (facilita deleção)
- [ ] View `events_compliant` excluindo revogados
- [ ] Índices para busca por user_id (para deleção)

### 7.4 Documentação

- [ ] Política de privacidade atualizada
- [ ] Termos de uso com cláusula de analytics
- [ ] Descrição de cookies na página de privacidade
- [ ] Procedimento de solicitação de dados (DIREITOS LGPD)

### 7.5 Testes

- [ ] Teste: Usuário aceita → eventos enviados
- [ ] Teste: Usuário recusa → apenas essenciais
- [ ] Teste: Usuário recusa → cookies limpos
- [ ] Teste: Usuário revoga → tracking para
- [ ] Teste: Endpoint `/forget` remove dados
- [ ] Teste: Dados não aparecem em dashboards após revogação

---

## 8. Textos Legais (Templates)

### 8.1 Banner de Consentimento

```html
<div id="lgpd-banner" role="dialog" aria-label="Consentimento de cookies">
  <p>
    Utilizamos cookies para melhorar sua experiência, analisar tráfego 
    e personalizar conteúdo. Você pode aceitar todos os cookies, 
    recusar a análise de comportamento, ou personalizar suas preferências.
  </p>
  
  <div class="actions">
    <button onclick="acceptAll()">Aceitar Todos</button>
    <button onclick="denyAnalytics()">Recusar Análise</button>
    <button onclick="openPreferences()">Personalizar</button>
  </div>
  
  <a href="/privacidade">Política de Privacidade</a>
</div>
```

### 8.2 Seção de Política de Privacidade (Analytics)

```markdown
## Analytics e Cookies de Desempenho

Utilizamos um sistema de analytics próprio (first-party) para entender 
como nossos leitores interagem com o conteúdo.

### O que coletamos (com seu consentimento):
- Identificador anônimo (UUID) para distinguir usuários
- Páginas visitadas e tempo de leitura
- Interações com conteúdo (scroll, cliques)
- Tipo de dispositivo e navegador (sem identificação pessoal)

### O que NUNCA coletamos:
- Nome, e-mail, CPF ou outros dados pessoais
- Endereço IP completo (apenas hash anonimizado)
- Localização precisa

### Seus direitos:
- Você pode recusar o analytics a qualquer momento
- Seus dados são mantidos por até 25 meses
- Você pode solicitar exportação ou deleção total dos dados
- Para exercer seus direitos, envie e-mail para: privacidade@pem.com
```

---

## 9. Referências

- [Lei 13.709/2018 - LGPD](http://www.planalto.gov.br/ccivil_03/_ato2015-2018/2018/lei/l13709.htm)
- [Guia de Boas Práticas - ANPD](https://www.gov.br/anpd/pt-br)
- [04-analytics-first-party.md](./04-analytics-first-party.md) - Arquitetura técnica
- [08-data-governance.md](./08-data-governance.md) - Governança de dados

---

**Data de criação:** 2024-01-16  
**Versão:** 1.0  
**Owner:** Legal & Data Engineering  
**Revisão Legal:** [Pendente - adicionar nome do DPO quando designado]
