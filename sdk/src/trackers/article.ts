/**
 * Tracker de Leitura de Artigos
 * Monitora tempo de leitura, progresso e completion rate
 */

import type { AnalyticsSDK } from '../core/analytics';

interface ArticleState {
  articleId: string | null;
  category: string | null;
  authorSlug: string | null;
  wordCount: number;
  startTime: number;
  lastActiveTime: number;
  maxScrollPercent: number;
  isReading: boolean;
  paragraphsRead: number;
  milestonesReached: Set<number>;
  hasStarted: boolean;
  hasCompleted: boolean;
}

const READING_START_THRESHOLD_PERCENT = 10; // 10% de scroll para considerar início
const READING_START_THRESHOLD_TIME = 10000; // 10 segundos na página
const COMPLETION_THRESHOLD_PERCENT = 80; // 80% de scroll para completar
const MIN_READING_TIME_MS = 15000; // Mínimo 15 segundos para completar
const MILESTONES = [25, 50, 75, 90];

export class ArticleTracker {
  private sdk: AnalyticsSDK;
  private state: ArticleState;
  private checkInterval: number | null = null;
  private visibilityObserver: IntersectionObserver | null = null;
  private paragraphs: Element[] = [];
  private readParagraphs: Set<Element> = new Set();

  constructor(sdk: AnalyticsSDK) {
    this.sdk = sdk;
    this.state = {
      articleId: null,
      category: null,
      authorSlug: null,
      wordCount: 0,
      startTime: 0,
      lastActiveTime: 0,
      maxScrollPercent: 0,
      isReading: false,
      paragraphsRead: 0,
      milestonesReached: new Set(),
      hasStarted: false,
      hasCompleted: false
    };
  }

  /**
   * Inicia tracking de um artigo
   */
  startArticle(config: {
    articleId: string;
    category: string;
    authorSlug?: string;
    wordCount?: number;
    selector?: string;
  }): void {
    // Parar artigo anterior se houver
    if (this.state.articleId && this.state.articleId !== config.articleId) {
      this.endArticle();
    }

    this.state.articleId = config.articleId;
    this.state.category = config.category;
    this.state.authorSlug = config.authorSlug || null;
    this.state.wordCount = config.wordCount || this.estimateWordCount(config.selector);
    this.state.startTime = Date.now();
    this.state.lastActiveTime = Date.now();
    this.state.isReading = true;
    this.state.hasStarted = false;
    this.state.hasCompleted = false;
    this.state.milestonesReached.clear();
    this.readParagraphs.clear();

    // Encontrar parágrafos para tracking de leitura
    this.setupParagraphTracking(config.selector);

    // Iniciar listeners
    this.setupScrollTracking();
    this.setupVisibilityTracking();

    // Verificar progresso periodicamente
    this.checkInterval = window.setInterval(() => this.checkProgress(), 5000);

    this.sdk.track('article_load', {
      article_id: config.articleId,
      category: config.category,
      author_slug: config.authorSlug,
      word_count: this.state.wordCount,
      estimated_read_time_minutes: Math.ceil(this.state.wordCount / 200)
    });
  }

  /**
   * Finaliza o tracking do artigo atual
   */
  endArticle(): void {
    if (!this.state.articleId || !this.state.isReading) return;

    // Enviar evento final
    this.sendArticleEndEvent();

    // Limpar estado
    if (this.checkInterval) {
      window.clearInterval(this.checkInterval);
      this.checkInterval = null;
    }

    if (this.visibilityObserver) {
      this.visibilityObserver.disconnect();
      this.visibilityObserver = null;
    }

    this.state.isReading = false;
    this.state.articleId = null;
  }

  /**
   * Retorna o progresso atual de leitura
   */
  getReadingProgress(): {
    scrollPercent: number;
    timeSpentSeconds: number;
    isComplete: boolean;
  } {
    return {
      scrollPercent: this.state.maxScrollPercent,
      timeSpentSeconds: this.getTimeSpentSeconds(),
      isComplete: this.state.hasCompleted
    };
  }

  private setupParagraphTracking(selector?: string): void {
    const container = selector 
      ? document.querySelector(selector)
      : document.querySelector('article, [role="article"], .article-content, main');

    if (!container) return;

    this.paragraphs = Array.from(container.querySelectorAll('p, h1, h2, h3, h4, h5, h6, li'));

    // Intersection Observer para parágrafos
    if ('IntersectionObserver' in window) {
      this.visibilityObserver = new IntersectionObserver(
        (entries) => {
          entries.forEach(entry => {
            if (entry.isIntersecting && entry.intersectionRatio >= 0.5) {
              this.readParagraphs.add(entry.target);
              this.state.paragraphsRead = this.readParagraphs.size;
            }
          });
        },
        { threshold: 0.5 }
      );

      this.paragraphs.forEach(p => this.visibilityObserver!.observe(p));
    }
  }

  private setupScrollTracking(): void {
    let ticking = false;

    window.addEventListener('scroll', () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          this.updateScrollProgress();
          ticking = false;
        });
        ticking = true;
      }
    }, { passive: true });
  }

  private setupVisibilityTracking(): void {
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible') {
        this.state.lastActiveTime = Date.now();
      }
    });
  }

  private updateScrollProgress(): void {
    const scrollTop = window.scrollY;
    const docHeight = document.documentElement.scrollHeight - window.innerHeight;
    
    if (docHeight <= 0) return;

    const scrollPercent = Math.min(100, Math.round((scrollTop / docHeight) * 100));
    
    if (scrollPercent > this.state.maxScrollPercent) {
      this.state.maxScrollPercent = scrollPercent;
    }

    // Verificar início de leitura
    if (!this.state.hasStarted && this.shouldStartReading(scrollPercent)) {
      this.state.hasStarted = true;
      this.sendArticleStartEvent();
    }

    // Verificar milestones
    MILESTONES.forEach(milestone => {
      if (scrollPercent >= milestone && !this.state.milestonesReached.has(milestone)) {
        this.state.milestonesReached.add(milestone);
        this.sendArticleProgressEvent(milestone);
      }
    });

    // Verificar completion
    if (!this.state.hasCompleted && this.shouldCompleteReading()) {
      this.state.hasCompleted = true;
      this.sendArticleCompleteEvent();
    }
  }

  private shouldStartReading(scrollPercent: number): boolean {
    const timeOnPage = Date.now() - this.state.startTime;
    return scrollPercent >= READING_START_THRESHOLD_PERCENT || 
           timeOnPage >= READING_START_THRESHOLD_TIME;
  }

  private shouldCompleteReading(): boolean {
    const timeSpent = Date.now() - this.state.startTime;
    return this.state.maxScrollPercent >= COMPLETION_THRESHOLD_PERCENT &&
           timeSpent >= MIN_READING_TIME_MS;
  }

  private checkProgress(): void {
    if (!this.state.isReading) return;

    // Update scroll progress
    this.updateScrollProgress();

    // Send heartbeat
    this.sdk.track('article_reading_pulse', {
      article_id: this.state.articleId,
      scroll_depth_percent: this.state.maxScrollPercent,
      time_spent_seconds: this.getTimeSpentSeconds(),
      paragraphs_read: this.state.paragraphsRead,
      milestones_reached: Array.from(this.state.milestonesReached)
    });
  }

  private sendArticleStartEvent(): void {
    this.sdk.track('article_read_start', {
      article_id: this.state.articleId,
      category: this.state.category,
      author_slug: this.state.authorSlug,
      word_count: this.state.wordCount,
      time_to_start_ms: Date.now() - this.state.startTime,
      trigger: 'scroll'
    });
  }

  private sendArticleProgressEvent(milestone: number): void {
    this.sdk.track('article_read_progress', {
      article_id: this.state.articleId,
      scroll_depth_percent: milestone,
      time_spent_seconds: this.getTimeSpentSeconds(),
      paragraphs_read: this.state.paragraphsRead
    });
  }

  private sendArticleCompleteEvent(): void {
    this.sdk.track('article_read_complete', {
      article_id: this.state.articleId,
      category: this.state.category,
      total_time_seconds: this.getTimeSpentSeconds(),
      max_scroll_percent: this.state.maxScrollPercent,
      paragraphs_read: this.state.paragraphsRead,
      estimated_total_paragraphs: this.paragraphs.length,
      completion_rate: this.calculateCompletionRate()
    });
  }

  private sendArticleEndEvent(): void {
    const timeSpent = this.getTimeSpentSeconds();
    
    this.sdk.track('article_read_end', {
      article_id: this.state.articleId,
      total_time_seconds: timeSpent,
      max_scroll_percent: this.state.maxScrollPercent,
      was_completed: this.state.hasCompleted,
      paragraphs_read: this.state.paragraphsRead,
      milestones_reached: Array.from(this.state.milestonesReached),
      abandonment_point_percent: this.calculateAbandonmentPoint()
    });
  }

  private getTimeSpentSeconds(): number {
    return Math.floor((Date.now() - this.state.startTime) / 1000);
  }

  private calculateCompletionRate(): number {
    if (this.state.wordCount === 0) return 0;
    const wordsRead = this.state.paragraphsRead * 30; // Estimativa média
    return Math.min(1, Math.round((wordsRead / this.state.wordCount) * 100) / 100);
  }

  private calculateAbandonmentPoint(): number {
    // Ponto provável de abandono baseado no último milestone
    const milestones = Array.from(this.state.milestonesReached);
    if (milestones.length === 0) {
      return Math.min(10, this.state.maxScrollPercent);
    }
    return Math.max(...milestones);
  }

  private estimateWordCount(selector?: string): number {
    const container = selector 
      ? document.querySelector(selector)
      : document.querySelector('article, [role="article"], .article-content, main');

    if (!container) return 0;

    const text = container.textContent || '';
    return text.trim().split(/\s+/).length;
  }
}
