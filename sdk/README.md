# SDK Analytics First-Party v1.1.0 - Portal Econômico Mundial

SDK JavaScript leve para coleta de eventos de analytics first-party, com recursos avançados de tracking, totalmente compatível com LGPD.

---

## Recursos Avançados Implementados

### 1. Engajamento do Usuário
- **Scroll Depth**: Profundidade máxima de scroll com marcos (25%, 50%, 75%, 90%, 100%)
- **Active Time**: Tempo real de engajamento (não apenas tempo na página)
- **Page Visibility**: Detecção de aba ativa/inativa
- **Idle Detection**: Identifica quando usuário para de interagir

### 2. Análise de Conteúdo
- **Article Reading**: Tracking completo de leitura de artigos
  - Início de leitura (scroll ≥ 10% ou tempo ≥ 10s)
  - Progresso com marcos (25%, 50%, 75%)
  - Completion rate (scroll ≥ 80% + tempo mínimo)
  - Parágrafos lidos (via Intersection Observer)
- **Time on Article**: Tempo real gasto em cada artigo
- **Abandonment Point**: Identifica onde usuário abandonou

### 3. Performance (Web Vitals Estendidos)
- **LCP** (Largest Contentful Paint)
- **CLS** (Cumulative Layout Shift)
- **INP** (Interaction to Next Paint)
- **TTFB** (Time to First Byte)
- **FCP** (First Contentful Paint)
- **FID** (First Input Delay) - legacy
- **Navigation Timing**: DNS, TCP, DOM parse times

### 4. Error Monitoring
- **JavaScript Errors**: Captura global de erros não tratados
- **Promise Rejections**: Unhandled promise rejections
- **Resource Errors**: Falhas em scripts, imagens, CSS
- **Dedup Local**: Evita spam de mesmos erros
- **Context Enriquecido**: URL, viewport, user agent

### 5. Atribuição e Campanhas
- **UTM Tracking**: Source, medium, campaign, term, content
- **Referrer Analysis**: Análise automática de fontes
- **Traffic Classification**: Organic, paid, social, direct, referral
- **First-Touch Attribution**: Persistência durante sessão

### 6. Anti-Fraud / Bot Detection
- **Headless Detection**: Identifica navegadores headless
- **Automation Signals**: WebDriver, PhantomJS, Selenium
- **Behavioral Analysis**: Padrões de mouse e clique
- **Technical Signals**: Plugins, languages, timezone
- **Safe Fingerprints**: Canvas e WebGL (hashed, não brutos)
- **Bot Score**: 0-100, classificação de risco

---

## Instalação

### Opção 1: Script Tag (Recomendado)

```html
<script 
  src="/analytics/analytics.min.js" 
  data-collector="https://collect.portaleconomicomundial.com"
  data-site-id="pem-prod"
  async
></script>
```

### Opção 2: NPM

```bash
npm install @pem/analytics-sdk
```

```typescript
import { PEMAnalytics } from '@pem/analytics-sdk';

const analytics = new PEMAnalytics({
  collectorUrl: 'https://collect.portaleconomicomundial.com',
  siteId: 'pem-prod',
  debug: false
});

await analytics.init();
```

---

## Uso Avançado

### Tracking de Artigo

```typescript
// Iniciar tracking quando usuário entra em artigo
analytics.startArticleReading({
  articleId: 'guerra-comercial-2024',
  category: 'geopolitica',
  authorSlug: 'maria-silva',
  wordCount: 1200
});

// Finalizar quando sai do artigo
analytics.endArticleReading();
```

### Tracking de Cliques

```typescript
// Tracking automático de cliques
document.addEventListener('click', (e) => {
  const target = e.target as HTMLElement;
  if (target.matches('[data-track]')) {
    analytics.trackClick(target, {
      custom_property: 'value'
    });
  }
});
```

### Métricas de Engajamento

```typescript
// Obter métricas em tempo real
const metrics = analytics.getEngagementMetrics();
console.log(metrics);
// {
//   activeTimeSeconds: 45,
//   totalTimeSeconds: 60,
//   maxScrollPercent: 75,
//   isUserActive: true
// }
```

### Score de Bot

```typescript
// Verificar probabilidade de ser bot
const botScore = analytics.getBotScore();
if (botScore > 80) {
  console.log('Tráfego suspeito detectado');
}
```

---

## Eventos Disponíveis

### Eventos Automáticos

| Evento | Descrição | Gatilho |
|--------|-----------|---------|
| `page_view` | Visualização de página | SPA navigation |
| `session_start` | Início de sessão | Primeira interação |
| `scroll_depth` | Profundidade de scroll | Marcos de scroll |
| `web_vital` | Métrica de performance | Web Vitals API |
| `js_error` | Erro JavaScript | window.onerror |
| `resource_error` | Erro de recurso | Error em elemento |
| `user_idle` | Usuário inativo | 30s sem interação |
| `visibility_change` | Mudança de visibilidade | visibilitychange |

### Eventos de Artigo

| Evento | Descrição | Propriedades |
|--------|-----------|--------------|
| `article_load` | Artigo carregado | article_id, word_count |
| `article_read_start` | Leitura iniciada | trigger, time_to_start_ms |
| `article_read_progress` | Progresso | scroll_depth_percent |
| `article_read_complete` | Leitura completa | total_time_seconds |
| `article_read_end` | Fim de leitura | abandonment_point_percent |
| `article_reading_pulse` | Heartbeat | time_spent_seconds |

### Eventos de Campanha

| Evento | Descrição | Propriedades |
|--------|-----------|--------------|
| `campaign_entry` | Entrada via campanha | utm_* |
| `session_start` | Com atribuição | traffic_source, traffic_medium |

### Eventos Anti-Fraud

| Evento | Descrição | Propriedades |
|--------|-----------|--------------|
| `anti_fraud_initial` | Sinais iniciais | bot_score, is_headless |
| `anti_fraud_update` | Atualização | mouse_movements_count |

---

## Configuração

```typescript
interface SDKConfig {
  collectorUrl: string;              // URL do collector (obrigatório)
  siteId?: string;                   // ID do site
  debug?: boolean;                   // Logs no console
  sessionTimeoutMinutes?: number;    // Timeout de sessão (padrão: 30)
  heartbeatIntervalSeconds?: number; // Intervalo de flush (padrão: 30)
  offlineQueueMaxSize?: number;      // Tamanho máximo da fila (padrão: 100)
  essentialEvents?: string[];        // Eventos sempre enviados
}
```

---

## Compatibilidade

- Chrome 60+
- Firefox 55+
- Safari 12+
- Edge 79+
- iOS Safari 12+
- Chrome Android 60+

---

## Changelog

### v1.1.0 (2024-02-04)
- ✨ Web Vitals estendidos (LCP, CLS, INP, TTFB, FCP)
- ✨ Article tracking completo (início, progresso, completion)
- ✨ Active time tracking (tempo real de engajamento)
- ✨ Error monitoring (JS, resources, promises)
- ✨ UTM e referrer tracking com atribuição
- ✨ Anti-fraud signals (bot detection)
- ✨ Scroll depth com marcos
- ✨ Visibility API integration

### v1.0.0 (2024-01-16)
- Lançamento inicial
- Consentimento LGPD
- Eventos essenciais
- Queue offline

---

## Licença

MIT - Portal Econômico Mundial
