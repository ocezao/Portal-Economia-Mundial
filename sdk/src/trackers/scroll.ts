/**
 * Tracker de Scroll Depth
 * Monitora profundidade de scroll e velocidade
 */

import type { AnalyticsSDK } from '../core/analytics';

interface ScrollState {
  maxScrollPercent: number;
  lastScrollY: number;
  lastScrollTime: number;
  tickMarks: Set<number>;
}

const SCROLL_TICKS = [25, 50, 75, 90, 100];
const DEBOUNCE_MS = 250;

export class ScrollTracker {
  private sdk: AnalyticsSDK;
  private state: ScrollState;
  private debounceTimer: number | null = null;
  private isActive: boolean = false;

  constructor(sdk: AnalyticsSDK) {
    this.sdk = sdk;
    this.state = {
      maxScrollPercent: 0,
      lastScrollY: 0,
      lastScrollTime: Date.now(),
      tickMarks: new Set()
    };
  }

  /**
   * Inicia o tracking de scroll
   */
  start(): void {
    if (this.isActive) return;
    this.isActive = true;

    // Calcular scroll inicial
    this.handleScroll();

    // Adicionar listener
    window.addEventListener('scroll', this.onScroll.bind(this), { passive: true });
    
    // Track no beforeunload para enviar dados finais
    window.addEventListener('beforeunload', this.sendFinalScroll.bind(this));
  }

  /**
   * Para o tracking de scroll
   */
  stop(): void {
    this.isActive = false;
    window.removeEventListener('scroll', this.onScroll.bind(this));
    window.removeEventListener('beforeunload', this.sendFinalScroll.bind(this));
  }

  /**
   * Retorna a profundidade máxima alcançada
   */
  getMaxScrollPercent(): number {
    return this.state.maxScrollPercent;
  }

  /**
   * Retorna os tick marks alcançados
   */
  getReachedTicks(): number[] {
    return Array.from(this.state.tickMarks);
  }

  private onScroll(): void {
    if (this.debounceTimer) {
      window.clearTimeout(this.debounceTimer);
    }

    this.debounceTimer = window.setTimeout(() => {
      this.handleScroll();
    }, DEBOUNCE_MS);
  }

  private handleScroll(): void {
    const scrollY = window.scrollY || window.pageYOffset;
    const docHeight = document.documentElement.scrollHeight - window.innerHeight;
    
    if (docHeight <= 0) return;

    const scrollPercent = Math.min(100, Math.round((scrollY / docHeight) * 100));
    const now = Date.now();
    const timeDelta = now - this.state.lastScrollTime;
    const scrollDelta = Math.abs(scrollY - this.state.lastScrollY);
    
    // Calcular velocidade (pixels por segundo)
    const speed = timeDelta > 0 ? Math.round((scrollDelta / timeDelta) * 1000) : 0;

    // Atualizar máximo
    if (scrollPercent > this.state.maxScrollPercent) {
      this.state.maxScrollPercent = scrollPercent;
    }

    // Verificar tick marks
    SCROLL_TICKS.forEach(tick => {
      if (scrollPercent >= tick && !this.state.tickMarks.has(tick)) {
        this.state.tickMarks.add(tick);
        this.sendScrollEvent(tick, speed, true);
      }
    });

    // Atualizar estado
    this.state.lastScrollY = scrollY;
    this.state.lastScrollTime = now;
  }

  private sendScrollEvent(depthPercent: number, speed: number, isMilestone: boolean = false): void {
    this.sdk.track('scroll_depth', {
      depth_percent: depthPercent,
      max_depth_percent: this.state.maxScrollPercent,
      page_height_pixels: document.documentElement.scrollHeight,
      viewport_height_pixels: window.innerHeight,
      scroll_speed_pixels_per_second: speed,
      is_milestone: isMilestone
    });
  }

  private sendFinalScroll(): void {
    this.sdk.track('scroll_depth_final', {
      max_depth_percent: this.state.maxScrollPercent,
      reached_ticks: Array.from(this.state.tickMarks),
      page_height_pixels: document.documentElement.scrollHeight
    });
  }
}
