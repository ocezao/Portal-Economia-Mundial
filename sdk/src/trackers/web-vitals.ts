/**
 * Tracker de Web Vitals
 * Coleta métricas de performance: LCP, CLS, INP, TTFB, FCP
 */

import type { AnalyticsSDK } from '../core/analytics';

// Tipos para entradas de performance
interface LayoutShiftEntry extends PerformanceEntry {
  hadRecentInput: boolean;
  value: number;
}

interface EventEntry extends PerformanceEntry {
  interactionId: number;
  duration: number;
  startTime: number;
  entryType: string;
  name: string;
}

interface FirstInputEntry extends PerformanceEntry {
  processingStart: number;
  startTime: number;
}

interface LargestContentfulPaintEntry extends PerformanceEntry {
  startTime: number;
}

interface WebVitalMetric {
  name: 'LCP' | 'CLS' | 'INP' | 'TTFB' | 'FCP' | 'FID';
  value: number;
  rating: 'good' | 'needs-improvement' | 'poor';
  delta?: number;
  entries?: PerformanceEntry[];
}

// Thresholds conforme Google Web Vitals
const THRESHOLDS: Record<string, { good: number; poor: number }> = {
  'LCP': { good: 2500, poor: 4000 },
  'FID': { good: 100, poor: 300 },
  'CLS': { good: 0.1, poor: 0.25 },
  'INP': { good: 200, poor: 500 },
  'TTFB': { good: 800, poor: 1800 },
  'FCP': { good: 1800, poor: 3000 }
};

// Type guards
function isLayoutShiftEntry(entry: PerformanceEntry): entry is LayoutShiftEntry {
  return entry.entryType === 'layout-shift' && 'hadRecentInput' in entry && 'value' in entry;
}

function isEventEntry(entry: PerformanceEntry): entry is EventEntry {
  return 'interactionId' in entry && 'duration' in entry;
}

function isFirstInputEntry(entry: PerformanceEntry): entry is FirstInputEntry {
  return entry.entryType === 'first-input' && 'processingStart' in entry;
}

function isLargestContentfulPaintEntry(entry: PerformanceEntry): entry is LargestContentfulPaintEntry {
  return entry.entryType === 'largest-contentful-paint' && 'startTime' in entry;
}

function isPerformanceNavigationTiming(entry: PerformanceEntry): entry is PerformanceNavigationTiming {
  return entry.entryType === 'navigation';
}

function isPerformancePaintTiming(entry: PerformanceEntry): entry is PerformancePaintTiming {
  return entry.entryType === 'paint';
}

export class WebVitalsTracker {
  private sdk: AnalyticsSDK;
  private reportedMetrics: Set<string> = new Set();
  private clsValue = 0;
  private inpValue = 0;
  private inpEntries: Array<{ duration: number; startTime: number; name: string }> = [];
  private isActive = false;

  constructor(sdk: AnalyticsSDK) {
    this.sdk = sdk;
  }

  /**
   * Inicia o tracking de Web Vitals
   */
  start(): void {
    if (this.isActive) return;
    this.isActive = true;

    // Aguardar página carregar
    if (document.readyState === 'complete') {
      this.collectMetrics();
    } else {
      window.addEventListener('load', () => this.collectMetrics());
    }

    // CLS precisa ser monitorado durante toda a vida da página
    this.observeCLS();
    
    // INP precisa monitorar interações
    this.observeINP();
  }

  /**
   * Para o tracking
   */
  stop(): void {
    this.isActive = false;
  }

  private collectMetrics(): void {
    // LCP (Largest Contentful Paint)
    this.observeLCP();
    
    // TTFB (Time to First Byte)
    this.measureTTFB();
    
    // FCP (First Contentful Paint)
    this.measureFCP();
    
    // FID (First Input Delay) - deprecated, mas ainda útil
    this.observeFID();
    
    // Navigation Timing
    this.measureNavigationTiming();
  }

  private observeLCP(): void {
    if (!('PerformanceObserver' in window)) return;

    try {
      const observer = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        const lastEntry = entries[entries.length - 1];
        
        if (lastEntry && isLargestContentfulPaintEntry(lastEntry)) {
          const value = Math.round(lastEntry.startTime);
          this.reportMetric('LCP', value);
        }
      });

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      observer.observe({ entryTypes: ['largest-contentful-paint'] as any });

      // Capturar valor final quando a página esconder
      document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'hidden' && this.reportedMetrics.has('LCP')) {
          observer.disconnect();
        }
      });
    } catch {
      // LCP não suportado
    }
  }

  private observeCLS(): void {
    if (!('PerformanceObserver' in window)) return;

    try {
      const observer = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (isLayoutShiftEntry(entry) && !entry.hadRecentInput) {
            this.clsValue += entry.value;
          }
        }
      });

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      observer.observe({ entryTypes: ['layout-shift'] as any });

      // Report CLS quando a página esconder
      document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'hidden') {
          this.reportMetric('CLS', Math.round(this.clsValue * 1000) / 1000);
        }
      });

      // Report periódico para CLS parcial
      setInterval(() => {
        if (this.clsValue > 0 && !this.reportedMetrics.has('CLS_partial')) {
          this.reportMetric('CLS', Math.round(this.clsValue * 1000) / 1000, true);
        }
      }, 10000);
    } catch {
      // CLS não suportado
    }
  }

  private observeINP(): void {
    if (!('PerformanceObserver' in window)) return;

    try {
      const observer = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          // INP é baseado em eventos de interação
          if (isEventEntry(entry) && 
              (entry.interactionId > 0 || 
               entry.entryType === 'first-input' ||
               entry.entryType === 'event')) {
            this.inpEntries.push({
              duration: entry.duration,
              startTime: entry.startTime,
              name: entry.name
            });
            
            // Atualizar INP (maior duração de interação)
            if (entry.duration > this.inpValue) {
              this.inpValue = entry.duration;
            }
          }
        }
      });

      // Tentar observer diferentes tipos de eventos
      try {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        observer.observe({ entryTypes: ['event'] as any, buffered: true });
      } catch {
        // Fallback para first-input
        try {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          observer.observe({ entryTypes: ['first-input'] as any, buffered: true });
        } catch {
          // Não suportado
        }
      }

      // Report INP ao sair
      document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'hidden' && this.inpValue > 0) {
          this.reportMetric('INP', Math.round(this.inpValue));
        }
      });
    } catch {
      // INP não suportado
    }
  }

  private observeFID(): void {
    if (!('PerformanceObserver' in window)) return;

    try {
      const observer = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (isFirstInputEntry(entry)) {
            const value = entry.processingStart - entry.startTime;
            this.reportMetric('FID', Math.round(value));
          }
        }
      });

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      observer.observe({ entryTypes: ['first-input'] as any });
    } catch {
      // FID não suportado
    }
  }

  private measureTTFB(): void {
    if (!('performance' in window)) return;

    const navEntry = performance.getEntriesByType('navigation')[0];
    
    if (navEntry && isPerformanceNavigationTiming(navEntry)) {
      const value = Math.round(navEntry.responseStart);
      this.reportMetric('TTFB', value);
    }
  }

  private measureFCP(): void {
    if (!('PerformanceObserver' in window)) return;

    try {
      const observer = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (isPerformancePaintTiming(entry) && entry.name === 'first-contentful-paint') {
            this.reportMetric('FCP', Math.round(entry.startTime));
            observer.disconnect();
          }
        }
      });

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      observer.observe({ entryTypes: ['paint'] as any });
    } catch {
      // FCP não suportado
    }
  }

  private measureNavigationTiming(): void {
    if (!('performance' in window)) return;

    const navEntry = performance.getEntriesByType('navigation')[0];
    
    if (navEntry && isPerformanceNavigationTiming(navEntry)) {
      // Métricas adicionais de navegação
      const dnsTime = navEntry.domainLookupEnd - navEntry.domainLookupStart;
      const tcpTime = navEntry.connectEnd - navEntry.connectStart;
      const downloadTime = navEntry.responseEnd - navEntry.responseStart;
      const domParseTime = navEntry.domComplete - navEntry.domInteractive;
      const loadTime = navEntry.loadEventEnd - navEntry.startTime;

      this.sdk.track('perf_navigation_timing', {
        dns_lookup_ms: Math.round(dnsTime),
        tcp_connect_ms: Math.round(tcpTime),
        download_ms: Math.round(downloadTime),
        dom_parse_ms: Math.round(domParseTime),
        total_load_ms: Math.round(loadTime),
        transfer_size_bytes: navEntry.transferSize,
        encoded_body_size_bytes: navEntry.encodedBodySize
      });
    }
  }

  private reportMetric(name: WebVitalMetric['name'], value: number, isPartial = false): void {
    const metricKey = isPartial ? `${name}_partial` : name;
    
    // Evitar duplicados (exceto CLS que é cumulativo)
    if (this.reportedMetrics.has(metricKey) && name !== 'CLS') return;
    this.reportedMetrics.add(metricKey);

    const threshold = THRESHOLDS[name];
    let rating: WebVitalMetric['rating'] = 'good';
    
    if (threshold) {
      if (value > threshold.poor) {
        rating = 'poor';
      } else if (value > threshold.good) {
        rating = 'needs-improvement';
      }
    }

    this.sdk.track('web_vital', {
      name,
      value,
      rating,
      is_partial: isPartial,
      threshold_good: threshold?.good,
      threshold_poor: threshold?.poor
    });
  }
}
