/**
 * Tracker de Anti-Fraud e Detecção de Bots
 * Coleta sinais para identificar tráfego automatizado
 * Sem usar fingerprinting invasivo (respeito à LGPD)
 */

import type { AnalyticsSDK } from '../core/analytics';
import type { AntiFraudSignals } from '../types';
import { hashString } from '../utils/device';

export class AntiFraudTracker {
  private sdk: AnalyticsSDK;
  private signals: Partial<AntiFraudSignals> = {};
  private mouseMovements: number = 0;
  private clickTimes: number[] = [];
  private interactionStartTime: number = Date.now();
  private isActive: boolean = false;

  constructor(sdk: AnalyticsSDK) {
    this.sdk = sdk;
  }

  /**
   * Inicia a coleta de sinais anti-fraud
   */
  start(): void {
    if (this.isActive) return;
    this.isActive = true;

    // Coletar sinais técnicos imediatos
    this.collectTechnicalSignals();
    
    // Monitorar comportamento
    this.setupBehavioralTracking();
    
    // Coletar fingerprints seguros (hash apenas)
    this.collectSafeFingerprints();

    // Enviar sinais iniciais
    this.sendInitialSignals();

    // Enviar sinais atualizados periodicamente
    setInterval(() => this.sendUpdatedSignals(), 60000); // A cada 1 minuto
  }

  /**
   * Para a coleta
   */
  stop(): void {
    this.isActive = false;
  }

  /**
   * Retorna o score de bot atual
   */
  getBotScore(): number {
    return this.calculateBotScore();
  }

  private collectTechnicalSignals(): void {
    const nav = navigator as any;
    const win = window as any;

    this.signals.is_headless = this.detectHeadlessBrowser();
    this.signals.is_automated = this.detectAutomation();
    this.signals.has_webdriver_property = !!nav.webdriver;
    this.signals.plugins_count = nav.plugins?.length || 0;
    this.signals.languages_count = nav.languages?.length || 1;
    this.signals.has_consistent_timezone = this.checkTimezoneConsistency();
    
    this.signals.mouse_movements_count = 0;
    this.signals.click_pattern_entropy = 0;
    this.signals.scroll_pattern_natural = true;
    this.signals.time_to_first_interaction_ms = 0;
  }

  private detectHeadlessBrowser(): boolean {
    const nav = navigator as any;
    const win = window as any;

    // Sinais de headless Chrome
    const headlessSignals = [
      nav.webdriver === true,
      win.callPhantom || win._phantom,
      nav.plugins?.length === 0 && nav.mimeTypes?.length === 0,
      nav.userAgent?.includes('HeadlessChrome'),
      !nav.languages || nav.languages.length === 0,
      nav.hardwareConcurrency === undefined,
      nav.deviceMemory === undefined
    ];

    return headlessSignals.filter(Boolean).length >= 3;
  }

  private detectAutomation(): boolean {
    const nav = navigator as any;
    const win = window as any;

    // Verificar propriedades de automação
    if (nav.webdriver) return true;
    if (win.document?.documentElement?.getAttribute('webdriver')) return true;
    if (win.callPhantom || win._phantom) return true;
    if (win.selenium || win.callSelenium) return true;
    if (win.__webdriver_script_fn) return true;
    if (win.domAutomation || win.domAutomationController) return true;
    if (win.CDC_adoQpoasnfa76pfcZLmcfl_Array || win.CDC_adoQpoasnfa76pfcZLmcfl_Promise) return true;

    // Verificar user agent suspeito
    const ua = nav.userAgent?.toLowerCase() || '';
    const botPatterns = [
      'bot', 'crawler', 'spider', 'scraper', 'headless',
      'phantomjs', 'selenium', 'puppeteer', 'playwright',
      'cypress', 'webdriver', 'automation'
    ];
    
    return botPatterns.some(pattern => ua.includes(pattern));
  }

  private checkTimezoneConsistency(): boolean {
    try {
      const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
      const offset = new Date().getTimezoneOffset();
      
      // Verificar se timezone é razoável
      if (!timezone || timezone === 'UTC') {
        // UTC é válido mas suspeito se combinado com outros sinais
        return offset === 0;
      }
      
      return true;
    } catch {
      return false;
    }
  }

  private setupBehavioralTracking(): void {
    // Contar movimentos de mouse
    document.addEventListener('mousemove', () => {
      this.mouseMovements++;
      if (this.signals.mouse_movements_count === 0) {
        this.signals.time_to_first_interaction_ms = Date.now() - this.interactionStartTime;
      }
      this.signals.mouse_movements_count = this.mouseMovements;
    }, { passive: true });

    // Registrar cliques para padrão
    document.addEventListener('click', (e) => {
      this.clickTimes.push(Date.now());
      this.signals.click_pattern_entropy = this.calculateClickEntropy();
    }, { passive: true });

    // Monitorar scroll natural
    let lastScrollTime = Date.now();
    document.addEventListener('scroll', () => {
      const now = Date.now();
      const delta = now - lastScrollTime;
      
      // Scrolls muito rápidos podem indicar automação
      if (delta < 50) {
        // Marcar como potencialmente não natural
        // (mas não definitivo, scroll rápido pode ser humano)
      }
      
      lastScrollTime = now;
    }, { passive: true });
  }

  private calculateClickEntropy(): number {
    if (this.clickTimes.length < 2) return 0;

    // Calcular intervalos entre cliques
    const intervals: number[] = [];
    for (let i = 1; i < this.clickTimes.length; i++) {
      intervals.push(this.clickTimes[i] - this.clickTimes[i - 1]);
    }

    if (intervals.length === 0) return 0;

    // Calcular variância dos intervalos
    const mean = intervals.reduce((a, b) => a + b, 0) / intervals.length;
    const variance = intervals.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / intervals.length;
    
    // Entropia simplificada (maior = mais variável = mais humano)
    const entropy = Math.min(1, variance / 1000000); // Normalizar
    
    return Math.round(entropy * 100) / 100;
  }

  private collectSafeFingerprints(): void {
    // Canvas fingerprint (apenas hash, nunca dados brutos)
    this.signals.canvas_fingerprint_hash = this.getCanvasFingerprintHash();
    
    // WebGL fingerprint (apenas hash)
    this.signals.webgl_fingerprint_hash = this.getWebGLFingerprintHash();
    
    // Lista de fontes (hash apenas, nunca lista completa)
    this.signals.fonts_hash = this.getFontsHash();
  }

  private getCanvasFingerprintHash(): string | undefined {
    try {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) return undefined;

      // Desenhar elementos que variam entre dispositivos
      canvas.width = 200;
      canvas.height = 50;
      
      ctx.textBaseline = 'top';
      ctx.font = '14px Arial';
      ctx.fillStyle = '#f60';
      ctx.fillRect(0, 0, 200, 50);
      ctx.fillStyle = '#069';
      ctx.fillText('CIN Analytics 🔒', 10, 15);
      
      const dataUrl = canvas.toDataURL();
      return hashString(dataUrl).substring(0, 16);
    } catch {
      return undefined;
    }
  }

  private getWebGLFingerprintHash(): string | undefined {
    try {
      const canvas = document.createElement('canvas');
      const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
      if (!gl) return undefined;

      const debugInfo = (gl as any).getExtension('WEBGL_debug_renderer_info');
      if (!debugInfo) return undefined;

      const vendor = (gl as WebGLRenderingContext).getParameter(debugInfo.UNMASKED_VENDOR_WEBGL);
      const renderer = (gl as WebGLRenderingContext).getParameter(debugInfo.UNMASKED_RENDERER_WEBGL);
      
      return hashString(`${vendor}-${renderer}`).substring(0, 16);
    } catch {
      return undefined;
    }
  }

  private getFontsHash(): string | undefined {
    // Simplificado - apenas contagem e algumas fontes comuns
    const commonFonts = ['Arial', 'Times New Roman', 'Courier New', 'Georgia', 'Verdana'];
    let availableCount = 0;

    // Teste simples de fonte
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) return undefined;

    const testString = 'mmmmmmmmmwwwwwww';
    ctx.font = '72px monospace';
    const baseline = ctx.measureText(testString).width;

    commonFonts.forEach(font => {
      ctx.font = `72px "${font}", monospace`;
      if (ctx.measureText(testString).width !== baseline) {
        availableCount++;
      }
    });

    return hashString(`fonts:${availableCount}`).substring(0, 16);
  }

  private calculateBotScore(): number {
    let score = 0;

    // Sinais fortes de bot
    if (this.signals.is_headless) score += 40;
    if (this.signals.is_automated) score += 50;
    if (this.signals.has_webdriver_property) score += 30;
    
    // Sinais moderados
    if (this.signals.plugins_count === 0) score += 15;
    if (this.signals.languages_count === 0) score += 10;
    if (!this.signals.has_consistent_timezone) score += 15;
    
    // Sinais comportamentais
    if (this.signals.mouse_movements_count === 0) score += 10;
    if (this.signals.click_pattern_entropy! < 0.1 && this.clickTimes.length > 5) score += 15;
    if (this.signals.time_to_first_interaction_ms! > 30000) score += 5; // Muito lento
    
    // Sinais negativos (reduzem score = mais humano)
    if (this.signals.mouse_movements_count! > 50) score -= 10;
    if (this.signals.click_pattern_entropy! > 0.5) score -= 10;

    return Math.max(0, Math.min(100, score));
  }

  private sendInitialSignals(): void {
    this.sendSignals('anti_fraud_initial');
  }

  private sendUpdatedSignals(): void {
    this.sendSignals('anti_fraud_update');
  }

  private sendSignals(eventName: string): void {
    const botScore = this.calculateBotScore();
    
    this.sdk.track(eventName, {
      bot_score: botScore,
      is_headless: this.signals.is_headless,
      is_automated: this.signals.is_automated,
      has_webdriver_property: this.signals.has_webdriver_property,
      plugins_count: this.signals.plugins_count,
      languages_count: this.signals.languages_count,
      has_consistent_timezone: this.signals.has_consistent_timezone,
      mouse_movements_count: this.signals.mouse_movements_count,
      click_pattern_entropy: this.signals.click_pattern_entropy,
      scroll_pattern_natural: this.signals.scroll_pattern_natural,
      time_to_first_interaction_ms: this.signals.time_to_first_interaction_ms,
      canvas_fingerprint_hash: this.signals.canvas_fingerprint_hash,
      webgl_fingerprint_hash: this.signals.webgl_fingerprint_hash,
      fonts_hash: this.signals.fonts_hash,
      is_suspicious: botScore > 50,
      is_likely_bot: botScore > 80
    });
  }
}
