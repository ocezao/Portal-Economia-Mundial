/**
 * Tracker de Erros
 * Captura erros JavaScript, promises rejeitadas e erros de recursos
 */

import type { AnalyticsSDK } from '../core/analytics';

interface ErrorContext {
  url: string;
  userAgent: string;
  viewport: { width: number; height: number };
}

export class ErrorTracker {
  private sdk: AnalyticsSDK;
  private reportedErrors: Set<string> = new Set();
  private maxErrorsPerSession: number = 10;
  private errorCount: number = 0;
  private isActive: boolean = false;

  constructor(sdk: AnalyticsSDK) {
    this.sdk = sdk;
  }

  /**
   * Inicia o tracking de erros
   */
  start(): void {
    if (this.isActive) return;
    this.isActive = true;

    // Erros globais
    window.addEventListener('error', this.handleError.bind(this));
    
    // Promises rejeitadas
    window.addEventListener('unhandledrejection', this.handleRejection.bind(this));
    
    // Erros de recursos (scripts, imagens, etc)
    document.addEventListener('error', this.handleResourceError.bind(this), true);
  }

  /**
   * Para o tracking de erros
   */
  stop(): void {
    this.isActive = false;
    window.removeEventListener('error', this.handleError.bind(this));
    window.removeEventListener('unhandledrejection', this.handleRejection.bind(this));
    document.removeEventListener('error', this.handleResourceError.bind(this), true);
  }

  /**
   * Reporta um erro manualmente
   */
  reportError(error: Error, context?: Record<string, any>): void {
    this.sendErrorEvent({
      message: error.message,
      stack: error.stack,
      handled: true,
      ...context
    });
  }

  private handleError(event: ErrorEvent): void {
    // Ignorar se limite atingido
    if (this.errorCount >= this.maxErrorsPerSession) return;

    const errorKey = this.generateErrorKey(event.message, event.filename, event.lineno);
    
    // Dedup local (mesmo erro na mesma sessão)
    if (this.reportedErrors.has(errorKey)) return;
    this.reportedErrors.add(errorKey);

    this.sendErrorEvent({
      message: event.message,
      source: this.sanitizeUrl(event.filename),
      line: event.lineno || undefined,
      column: event.colno || undefined,
      stack: event.error?.stack,
      handled: event.error ? false : true,
      error_type: 'js_error'
    });

    this.errorCount++;
  }

  private handleRejection(event: PromiseRejectionEvent): void {
    if (this.errorCount >= this.maxErrorsPerSession) return;

    let message: string;
    let stack: string | undefined;

    if (event.reason instanceof Error) {
      message = event.reason.message;
      stack = event.reason.stack;
    } else if (typeof event.reason === 'string') {
      message = event.reason;
    } else {
      try {
        message = JSON.stringify(event.reason);
      } catch {
        message = 'Promise rejected with non-serializable value';
      }
    }

    const errorKey = this.generateErrorKey(message, '', 0);
    if (this.reportedErrors.has(errorKey)) return;
    this.reportedErrors.add(errorKey);

    this.sendErrorEvent({
      message,
      stack,
      handled: false,
      error_type: 'promise_rejection'
    });

    this.errorCount++;
  }

  private handleResourceError(event: Event): void {
    if (this.errorCount >= this.maxErrorsPerSession) return;

    const target = event.target as HTMLElement;
    
    // Verificar se é um elemento com src
    if (!target || (!target.hasAttribute('src') && !target.hasAttribute('href'))) {
      return;
    }

    const tagName = target.tagName?.toLowerCase();
    const src = target.getAttribute('src') || target.getAttribute('href') || '';
    
    const errorKey = this.generateErrorKey(`resource_failed:${tagName}`, src, 0);
    if (this.reportedErrors.has(errorKey)) return;
    this.reportedErrors.add(errorKey);

    this.sdk.track('resource_error', {
      resource_type: tagName,
      resource_url: this.sanitizeUrl(src),
      page_url: window.location.href,
      error_type: 'resource_error'
    });

    this.errorCount++;
  }

  private sendErrorEvent(errorData: Record<string, any>): void {
    const context: ErrorContext = {
      url: window.location.href,
      userAgent: navigator.userAgent,
      viewport: {
        width: window.innerWidth,
        height: window.innerHeight
      }
    };

    // Truncar stack trace se muito grande
    if (errorData.stack && errorData.stack.length > 1000) {
      errorData.stack = errorData.stack.substring(0, 1000) + '... [truncated]';
    }

    // Truncar mensagem se muito grande
    if (errorData.message && errorData.message.length > 500) {
      errorData.message = errorData.message.substring(0, 500) + '... [truncated]';
    }

    this.sdk.track('js_error', {
      ...errorData,
      context: {
        url: context.url,
        viewport_width: context.viewport.width,
        viewport_height: context.viewport.height
      },
      session_error_count: this.errorCount + 1
    });
  }

  private generateErrorKey(message: string, filename: string, line: number): string {
    // Simplificar a mensagem para dedup
    const simplified = message
      .replace(/\d+/g, 'N') // Substituir números
      .replace(/['"`][^'"`]*['"`]/g, 'STR') // Substituir strings
      .substring(0, 100);
    
    return `${simplified}:${this.sanitizeUrl(filename)}:${line}`;
  }

  private sanitizeUrl(url: string | undefined): string | undefined {
    if (!url) return undefined;
    
    try {
      // Remover query params sensíveis
      const urlObj = new URL(url, window.location.href);
      return `${urlObj.origin}${urlObj.pathname}`;
    } catch {
      return url.substring(0, 200);
    }
  }
}
