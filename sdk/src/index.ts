/**
 * SDK Analytics First-Party - Cenario Internacional
 * 
 * Ponto de entrada principal do SDK. Exporta a API pública e
 * gerencia a inicialização automática com todos os trackers.
 * 
 * @version 1.1.0
 */

import { AnalyticsSDK } from './core/analytics';
import { ScrollTracker } from './trackers/scroll';
import { EngagementTracker } from './trackers/engagement';
import { WebVitalsTracker } from './trackers/web-vitals';
import { ErrorTracker } from './trackers/errors';
import { UTMTracker } from './trackers/utm';
import { AntiFraudTracker } from './trackers/anti-fraud';
import { ArticleTracker } from './trackers/article';

import type { SDKConfig, ConsentState } from './types';

// Versão do SDK
export const SDK_VERSION = '1.1.0';

/**
 * Classe principal que estende o SDK base com trackers especializados
 */
export class CINAnalytics extends AnalyticsSDK {
  private scrollTracker: ScrollTracker;
  private engagementTracker: EngagementTracker;
  private webVitalsTracker: WebVitalsTracker;
  private errorTracker: ErrorTracker;
  private utmTracker: UTMTracker;
  private antiFraudTracker: AntiFraudTracker;
  private articleTracker: ArticleTracker;

  constructor(config: Partial<SDKConfig>) {
    super(config);

    // Inicializar trackers
    this.scrollTracker = new ScrollTracker(this);
    this.engagementTracker = new EngagementTracker(this);
    this.webVitalsTracker = new WebVitalsTracker(this);
    this.errorTracker = new ErrorTracker(this);
    this.utmTracker = new UTMTracker(this);
    this.antiFraudTracker = new AntiFraudTracker(this);
    this.articleTracker = new ArticleTracker(this);
  }

  /**
   * Inicializa o SDK e todos os trackers
   */
  async init(): Promise<void> {
    await super.init();

    // Iniciar trackers (alguns dependem de consentimento)
    this.errorTracker.start(); // Sempre ativo (essencial)
    this.webVitalsTracker.start(); // Sempre ativo (essencial)
    this.antiFraudTracker.start(); // Sempre ativo (anti-fraud)

    // Verificar consentimento para trackers comportamentais
    const consent = this.getConsentState();
    
    if (consent === 'granted') {
      this.scrollTracker.start();
      this.engagementTracker.start();
      this.utmTracker.start();
    }

    // Setup listener para mudança de consentimento
    this.setupConsentListener();

    // Track page view inicial
    this.trackPageView();
  }

  /**
   * Rastreia uma visualização de página
   */
  trackPageView(properties?: Record<string, any>): void {
    this.track('page_view', {
      page_type: properties?.page_type || this.detectPageType(),
      page_path: window.location.pathname,
      page_title: document.title,
      ...properties
    });
  }

  /**
   * Rastreia um clique em elemento
   */
  trackClick(element: HTMLElement, properties?: Record<string, any>): void {
    const rect = element.getBoundingClientRect();
    
    this.track('click', {
      target_type: this.detectElementType(element),
      target_id: element.id || element.getAttribute('data-track-id') || undefined,
      target_text: this.extractElementText(element),
      target_tag: element.tagName.toLowerCase(),
      placement: this.detectPlacement(element),
      ...properties
    });
  }

  /**
   * Inicia tracking de leitura de artigo
   */
  startArticleReading(config: {
    articleId: string;
    category: string;
    authorSlug?: string;
    wordCount?: number;
  }): void {
    const consent = this.getConsentState();
    if (consent !== 'granted') {
      // Silently return - não logar em produção para evitar poluição do console
      // Em debug mode, o log seria visível via método this.log
      if (this.debug) {
        this.log('Article tracking requires consent');
      }
      return;
    }

    this.articleTracker.startArticle(config);
  }

  /**
   * Finaliza tracking de leitura de artigo
   */
  endArticleReading(): void {
    this.articleTracker.endArticle();
  }

  /**
   * Retorna dados de engajamento atuais
   */
  getEngagementMetrics(): {
    activeTimeSeconds: number;
    totalTimeSeconds: number;
    maxScrollPercent: number;
    isUserActive: boolean;
  } {
    return {
      activeTimeSeconds: this.engagementTracker.getActiveTimeSeconds(),
      totalTimeSeconds: this.engagementTracker.getTotalTimeSeconds(),
      maxScrollPercent: this.scrollTracker.getMaxScrollPercent(),
      isUserActive: this.engagementTracker.isUserActive()
    };
  }

  /**
   * Retorna score de detecção de bot
   */
  getBotScore(): number {
    return this.antiFraudTracker.getBotScore();
  }

  /**
   * Destrói o SDK e todos os trackers
   */
  destroy(): void {
    this.scrollTracker.stop();
    this.engagementTracker.stop();
    this.webVitalsTracker.stop();
    this.errorTracker.stop();
    this.antiFraudTracker.stop();
    
    super.destroy();
  }

  // ========== Métodos privados ==========

  private setupConsentListener(): void {
    // Verificar mudanças de consentimento periodicamente
    let lastConsent = this.getConsentState();
    
    setInterval(() => {
      const currentConsent = this.getConsentState();
      
      if (currentConsent !== lastConsent) {
        if (currentConsent === 'granted' && lastConsent !== 'granted') {
          // Consentimento concedido - iniciar trackers
          this.scrollTracker.start();
          this.engagementTracker.start();
          this.utmTracker.start();
        } else if (currentConsent !== 'granted' && lastConsent === 'granted') {
          // Consentimento revogado - parar trackers
          this.scrollTracker.stop();
          this.engagementTracker.stop();
        }
        lastConsent = currentConsent;
      }
    }, 1000);
  }

  private detectPageType(): string {
    const path = window.location.pathname;
    
    if (path === '/' || path === '') return 'home';
    if (path.startsWith('/noticia/') || path.includes('/article/')) return 'article';
    if (path.startsWith('/categoria/') || path.includes('/category/')) return 'category';
    if (path.includes('/tag/')) return 'tag';
    if (path.includes('/search')) return 'search';
    if (path.includes('/sobre') || path.includes('/about')) return 'about';
    
    return 'static';
  }

  private detectElementType(element: HTMLElement): string {
    const tag = element.tagName.toLowerCase();
    
    if (tag === 'button') return 'button';
    if (tag === 'a') return 'link';
    if (element.hasAttribute('data-track-type')) {
      return element.getAttribute('data-track-type') || 'unknown';
    }
    if (element.closest('nav')) return 'nav_item';
    if (element.closest('article')) return 'article_element';
    if (element.closest('header')) return 'header_element';
    if (element.closest('footer')) return 'footer_element';
    
    return 'element';
  }

  private extractElementText(element: HTMLElement): string | undefined {
    const text = element.textContent?.trim() || element.getAttribute('aria-label');
    if (!text) return undefined;
    
    // Truncar e limpar
    return text.substring(0, 100).replace(/\s+/g, ' ');
  }

  private detectPlacement(element: HTMLElement): string {
    if (element.closest('header')) return 'header';
    if (element.closest('nav')) return 'navigation';
    if (element.closest('main')) return 'main_content';
    if (element.closest('aside')) return 'sidebar';
    if (element.closest('footer')) return 'footer';
    if (element.closest('article')) return 'article';
    if (element.closest('[role="banner"]')) return 'hero';
    
    return 'unknown';
  }
}

// Exportar tipos
export type { SDKConfig, ConsentState, AnalyticsEvent } from './types';

// Singleton para inicialização automática via script tag
let globalInstance: CINAnalytics | null = null;

/**
 * Inicialização automática quando carregado via script tag
 */
if (typeof window !== 'undefined') {
  const script = document.currentScript as HTMLScriptElement;
  
  if (script) {
    const collectorUrl = script.getAttribute('data-collector');
    const siteId = script.getAttribute('data-site-id') || 'default';
    const debug = script.getAttribute('data-debug') === 'true';

    if (collectorUrl) {
      globalInstance = new CINAnalytics({
        collectorUrl,
        siteId,
        debug
      });

      globalInstance.init().catch(() => {
        // Erro silenciado para não expor detalhes internos
        // O erro é capturado mas não logado diretamente
        // Em debug mode, o erro seria visível nos logs internos do SDK
      });

      // Expor globalmente
      (window as any).cinAnalytics = globalInstance;
    }
  }
}

// Exportar classe e singleton
export { CINAnalytics as AnalyticsSDK };
export const getAnalytics = (): CINAnalytics | null => globalInstance;

// Export default
export default CINAnalytics;
