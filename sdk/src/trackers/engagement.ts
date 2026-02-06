/**
 * Tracker de Engajamento (Active Time & Visibility)
 * Mede tempo real de engajamento do usuário
 */

import type { AnalyticsSDK } from '../core/analytics';

interface EngagementState {
  totalTimeSeconds: number;
  activeTimeSeconds: number;
  lastActiveTimestamp: number;
  isActive: boolean;
  isVisible: boolean;
  focusEventsCount: number;
  lastSentActiveTime: number;
}

const IDLE_TIMEOUT_MS = 30000; // 30 segundos de inatividade
const REPORT_INTERVAL_MS = 30000; // Report a cada 30 segundos
const MIN_ACTIVE_TIME_SECONDS = 5; // Mínimo para reportar

export class EngagementTracker {
  private sdk: AnalyticsSDK;
  private state: EngagementState;
  private checkInterval: number | null = null;
  private reportInterval: number | null = null;
  private isTracking: boolean = false;

  constructor(sdk: AnalyticsSDK) {
    this.sdk = sdk;
    this.state = {
      totalTimeSeconds: 0,
      activeTimeSeconds: 0,
      lastActiveTimestamp: Date.now(),
      isActive: true,
      isVisible: !document.hidden,
      focusEventsCount: 0,
      lastSentActiveTime: 0
    };
  }

  /**
   * Inicia o tracking de engajamento
   */
  start(): void {
    if (this.isTracking) return;
    this.isTracking = true;

    // Configurar listeners
    this.setupVisibilityListener();
    this.setupActivityListeners();

    // Iniciar timers
    this.checkInterval = window.setInterval(() => this.checkActivity(), 1000);
    this.reportInterval = window.setInterval(() => this.reportEngagement(), REPORT_INTERVAL_MS);

    // Report ao sair da página
    window.addEventListener('beforeunload', () => this.reportEngagement(true));
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'hidden') {
        this.reportEngagement(true);
      }
    });

    // Marcar como ativo
    this.markActive();
  }

  /**
   * Para o tracking de engajamento
   */
  stop(): void {
    this.isTracking = false;
    
    if (this.checkInterval) {
      window.clearInterval(this.checkInterval);
      this.checkInterval = null;
    }
    
    if (this.reportInterval) {
      window.clearInterval(this.reportInterval);
      this.reportInterval = null;
    }
  }

  /**
   * Retorna tempo ativo atual
   */
  getActiveTimeSeconds(): number {
    return this.state.activeTimeSeconds;
  }

  /**
   * Retorna tempo total
   */
  getTotalTimeSeconds(): number {
    return this.state.totalTimeSeconds;
  }

  /**
   * Verifica se usuário está ativo
   */
  isUserActive(): boolean {
    return this.state.isActive && this.state.isVisible;
  }

  private setupVisibilityListener(): void {
    document.addEventListener('visibilitychange', () => {
      const isVisible = document.visibilityState === 'visible';
      this.state.isVisible = isVisible;
      
      if (isVisible) {
        this.markActive();
        this.sdk.track('visibility_change', { 
          visible: true,
          hidden_duration_ms: Date.now() - this.state.lastActiveTimestamp 
        });
      } else {
        this.sdk.track('visibility_change', { visible: false });
        this.reportEngagement(true);
      }
    });
  }

  private setupActivityListeners(): void {
    const activityEvents = ['mousedown', 'keydown', 'touchstart', 'scroll', 'mousemove'];
    
    activityEvents.forEach(event => {
      document.addEventListener(event, () => this.markActive(), { passive: true });
    });
  }

  private markActive(): void {
    const now = Date.now();
    
    // Se estava inativo, registrar retorno
    if (!this.state.isActive) {
      this.state.focusEventsCount++;
      this.state.isActive = true;
    }
    
    this.state.lastActiveTimestamp = now;
  }

  private checkActivity(): void {
    const now = Date.now();
    const timeSinceLastActivity = now - this.state.lastActiveTimestamp;
    
    // Verificar se ficou inativo
    if (timeSinceLastActivity > IDLE_TIMEOUT_MS && this.state.isActive) {
      this.state.isActive = false;
      this.sdk.track('user_idle', { 
        idle_duration_ms: timeSinceLastActivity,
        active_time_before_idle_seconds: this.state.activeTimeSeconds
      });
    }
    
    // Incrementar contadores se ativo e visível
    if (this.state.isActive && this.state.isVisible) {
      this.state.activeTimeSeconds++;
    }
    this.state.totalTimeSeconds++;
  }

  private reportEngagement(final: boolean = false): void {
    const activeDelta = this.state.activeTimeSeconds - this.state.lastSentActiveTime;
    
    // Só reportar se tiver tempo ativo significativo ou for report final
    if (activeDelta >= MIN_ACTIVE_TIME_SECONDS || final) {
      this.sdk.track(final ? 'engagement_final' : 'engagement_pulse', {
        active_time_seconds: this.state.activeTimeSeconds,
        total_time_seconds: this.state.totalTimeSeconds,
        active_time_delta_seconds: activeDelta,
        focus_events_count: this.state.focusEventsCount,
        is_final: final
      });
      
      this.state.lastSentActiveTime = this.state.activeTimeSeconds;
    }
  }
}
