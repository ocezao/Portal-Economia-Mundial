/**
 * Core do SDK Analytics - Cenario Internacional
 * Responsável por inicialização, fila de eventos, consentimento e comunicação com collector
 */

import type { AnalyticsEvent, SDKConfig, ConsentState, QueueItem } from '../types';
import { generateUUID, getDeviceInfo, getBrowserInfo } from '../utils/device';
import { SessionManager } from '../utils/session';
import { sdkLogger } from './logger';

const DEFAULT_CONFIG: SDKConfig = {
  collectorUrl: '',
  siteId: 'default',
  debug: false,
  sessionTimeoutMinutes: 30,
  heartbeatIntervalSeconds: 30,
  offlineQueueMaxSize: 100,
  offlineStorageKey: 'cin_analytics_queue',
  consentCookieName: '__cin_consent',
  consentCookieDays: {
    granted: 180,
    denied: 365
  },
  essentialEvents: [
    'js_error',
    'api_error',
    'resource_error',
    'web_vital',
    'perf_page_load',
    'promise_rejection'
  ],
  version: '1.1.0'
};

export class AnalyticsSDK {
  private config: SDKConfig;
  private sessionManager: SessionManager;
  private queue: QueueItem[] = [];
  private isOnline: boolean = true;
  private flushInterval: number | null = null;
  private debug: boolean = false;
  private initialized: boolean = false;
  private sendAttempts: Map<string, number> = new Map();
  private maxRetries: number = 3;

  constructor(config: Partial<SDKConfig>) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.debug = this.config.debug || false;
    this.sessionManager = new SessionManager(this.config.sessionTimeoutMinutes!);
    
    if (typeof window !== 'undefined') {
      this.loadQueueFromStorage();
      this.setupOnlineOfflineListeners();
    }
  }

  /**
   * Inicializa o SDK
   */
  async init(): Promise<void> {
    if (this.initialized) {
      this.log('SDK já inicializado');
      return;
    }

    this.log('Inicializando SDK Analytics v' + this.config.version);

    // Restaurar sessão existente ou criar nova
    this.sessionManager.init();

    // Verificar consentimento existente
    const consent = this.getConsentState();
    
    if (consent === 'granted') {
      this.log('Consentimento prévio encontrado: granted');
      this.ensureIdentifiers();
    } else if (consent === 'denied') {
      this.log('Consentimento prévio: denied (modo anônimo)');
      this.clearIdentifiers();
    } else {
      this.log('Consentimento: pendente');
    }

    // Iniciar flush periódico
    this.startPeriodicFlush();

    // Enviar evento de inicialização
    this.track('sdk_initialized', {
      sdk_version: this.config.version,
      consent_state: consent,
      device_type: getDeviceInfo().type
    });

    this.initialized = true;
    this.log('SDK inicializado com sucesso');
  }

  /**
   * Registra um evento
   */
  async track(eventName: string, properties: Record<string, any> = {}): Promise<{ success: boolean; blocked?: boolean; reason?: string }> {
    const consent = this.getConsentState();
    const isEssential = this.config.essentialEvents?.includes(eventName);

    // Verificar se evento deve ser bloqueado
    if (consent === 'denied' && !isEssential) {
      this.log(`Evento ${eventName} bloqueado (opt-out)`);
      return { success: false, blocked: true, reason: 'consent_denied' };
    }

    // Criar evento
    const event: AnalyticsEvent = {
      v: this.config.version!,
      event: eventName,
      user_id: consent === 'granted' ? this.sessionManager.getUserId() : null,
      session_id: consent === 'granted' ? this.sessionManager.getSessionId() : null,
      anonymous: consent !== 'granted',
      timestamp: Date.now(),
      url: this.canonicalizeUrl(window.location.href),
      referrer: document.referrer || null,
      properties: {
        ...properties,
        ...getDeviceInfo(),
        ...getBrowserInfo()
      }
    };

    // Adicionar à fila
    const queueItem: QueueItem = {
      event,
      retries: 0,
      addedAt: Date.now()
    };

    this.queue.push(queueItem);
    this.saveQueueToStorage();

    // Tentar enviar imediatamente se online
    if (this.isOnline) {
      this.flush();
    }

    this.log(`Evento enfileirado: ${eventName}`);
    return { success: true };
  }

  /**
   * Define o consentimento do usuário
   */
  setConsent(granted: boolean): void {
    const state: ConsentState = granted ? 'granted' : 'denied';
    const expiresDays = granted ? this.config.consentCookieDays!.granted : this.config.consentCookieDays!.denied;
    
    this.setCookie(this.config.consentCookieName!, JSON.stringify({
      analytics: granted,
      timestamp: Date.now()
    }), expiresDays);

    if (granted) {
      this.ensureIdentifiers();
      this.track('consent_granted', {
        previous_state: this.getConsentState() === 'unknown' ? 'unknown' : 'pending'
      });
    } else {
      this.track('consent_revoked', {
        cleared_at: Date.now()
      });
      this.clearIdentifiers();
    }

    this.log(`Consentimento alterado: ${state}`);
  }

  /**
   * Revoga o consentimento
   */
  revokeConsent(): void {
    this.setConsent(false);
  }

  /**
   * Retorna o estado atual do consentimento
   */
  getConsentState(): ConsentState {
    const cookie = this.getCookie(this.config.consentCookieName!);
    
    if (!cookie) {
      return 'unknown';
    }

    try {
      const parsed = JSON.parse(cookie);
      if (parsed.analytics === true) return 'granted';
      if (parsed.analytics === false) return 'denied';
      return 'pending';
    } catch {
      return 'unknown';
    }
  }

  /**
   * Envia todos os eventos pendentes
   */
  async flush(): Promise<void> {
    if (this.queue.length === 0) return;

    const batch = this.queue.splice(0, 50); // Enviar em lotes de 50
    const events = batch.map(item => item.event);

    try {
      const response = await fetch(`${this.config.collectorUrl}/collect`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(events),
        keepalive: true
      });

      if (response.status === 204) {
        this.log(`${events.length} eventos enviados com sucesso`);
        this.saveQueueToStorage();
      } else {
        // Re-enfileirar eventos com retry
        batch.forEach(item => {
          const attempts = this.sendAttempts.get(item.event.event) || 0;
          if (attempts < this.maxRetries) {
            this.sendAttempts.set(item.event.event, attempts + 1);
            this.queue.push({ ...item, retries: attempts + 1 });
          }
        });
        this.saveQueueToStorage();
      }
    } catch (err) {
      this.log(`Erro ao enviar eventos: ${err}`);
      // Re-enfileirar para tentar depois
      batch.forEach(item => {
        const attempts = this.sendAttempts.get(item.event.event) || 0;
        if (attempts < this.maxRetries) {
          this.sendAttempts.set(item.event.event, attempts + 1);
          this.queue.push({ ...item, retries: attempts + 1 });
        }
      });
      this.saveQueueToStorage();
    }
  }

  /**
   * Destrói o SDK e limpa recursos
   */
  destroy(): void {
    if (this.flushInterval) {
      window.clearInterval(this.flushInterval);
      this.flushInterval = null;
    }
    
    // Flush final
    this.flush();
    
    this.initialized = false;
    this.log('SDK destruído');
  }

  // ========== Métodos privados ==========

  private log(message: string): void {
    sdkLogger.debug(this.debug, `[CIN Analytics] ${message}`);
  }

  private ensureIdentifiers(): void {
    this.sessionManager.ensureUserId();
    this.sessionManager.ensureSessionId();
  }

  private clearIdentifiers(): void {
    this.sessionManager.clearIdentifiers();
  }

  private setCookie(name: string, value: string, days: number): void {
    const expires = new Date(Date.now() + days * 24 * 60 * 60 * 1000).toUTCString();
    document.cookie = `${name}=${encodeURIComponent(value)};expires=${expires};path=/;SameSite=Lax`;
  }

  private getCookie(name: string): string | null {
    const match = document.cookie.match(new RegExp('(^| )' + name + '=([^;]+)'));
    return match ? decodeURIComponent(match[2]) : null;
  }

  private loadQueueFromStorage(): void {
    try {
      const stored = localStorage.getItem(this.config.offlineStorageKey!);
      if (stored) {
        this.queue = JSON.parse(stored);
        this.log(`${this.queue.length} eventos carregados do storage`);
      }
    } catch (err) {
      this.log(`Erro ao carregar queue: ${err}`);
    }
  }

  private saveQueueToStorage(): void {
    try {
      // Limitar tamanho da fila
      if (this.queue.length > this.config.offlineQueueMaxSize!) {
        this.queue = this.queue.slice(-this.config.offlineQueueMaxSize!);
      }
      localStorage.setItem(this.config.offlineStorageKey!, JSON.stringify(this.queue));
    } catch (err) {
      this.log(`Erro ao salvar queue: ${err}`);
    }
  }

  private setupOnlineOfflineListeners(): void {
    window.addEventListener('online', () => {
      this.isOnline = true;
      this.log('Conexão restaurada, enviando fila...');
      this.flush();
    });

    window.addEventListener('offline', () => {
      this.isOnline = false;
      this.log('Conexão perdida, modo offline ativado');
    });

    // Flush antes de fechar a página
    window.addEventListener('beforeunload', () => {
      this.flush();
    });

    // Flush quando a página fica invisível
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'hidden') {
        this.flush();
      }
    });
  }

  private startPeriodicFlush(): void {
    this.flushInterval = window.setInterval(() => {
      if (this.isOnline && this.queue.length > 0) {
        this.flush();
      }
    }, this.config.heartbeatIntervalSeconds! * 1000);
  }

  private canonicalizeUrl(url: string): string {
    try {
      const urlObj = new URL(url);
      
      // Remover parâmetros de tracking
      const trackingParams = [
        'utm_source', 'utm_medium', 'utm_campaign',
        'utm_term', 'utm_content', 'fbclid', 'gclid',
        'ref', 'source'
      ];
      
      trackingParams.forEach(param => {
        urlObj.searchParams.delete(param);
      });
      
      // Remover fragmentos
      urlObj.hash = '';
      
      // Lowercase hostname
      urlObj.hostname = urlObj.hostname.toLowerCase();
      
      return urlObj.toString();
    } catch {
      return url;
    }
  }
}
