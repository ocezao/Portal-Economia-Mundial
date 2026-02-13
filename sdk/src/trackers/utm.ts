/**
 * Tracker de UTM e Referrer
 * Analisa e rastreia fontes de tráfego, campanhas e atribuição
 */

import type { AnalyticsSDK } from '../core/analytics';
import type { UTMData } from '../types';

const UTM_KEYS = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content'];
const SOCIAL_DOMAINS = ['facebook.com', 'fb.com', 'instagram.com', 'twitter.com', 'x.com', 'linkedin.com', 'youtube.com', 'tiktok.com', 'pinterest.com', 'reddit.com'];
const SEARCH_ENGINES = ['google.com', 'bing.com', 'yahoo.com', 'duckduckgo.com', 'yandex.com', 'baidu.com'];

export class UTMTracker {
  private sdk: AnalyticsSDK;
  private utmData: UTMData;
  private sessionStorageKey = '__cin_attribution';

  constructor(sdk: AnalyticsSDK) {
    this.sdk = sdk;
    this.utmData = this.extractUTMData();
  }

  /**
   * Inicia o tracking de atribuição
   */
  start(): void {
    // Extrair dados da URL atual
    const currentData = this.extractUTMData();
    
    // Verificar se há dados de UTM na URL
    if (currentData.utm_source || currentData.utm_campaign) {
      // Salvar para sessão (first-touch attribution)
      this.saveAttribution(currentData);
      
      // Enviar evento de campanha
      this.trackCampaignEntry(currentData);
    } else {
      // Verificar se há attribution salvo
      const saved = this.loadAttribution();
      if (saved) {
        this.utmData = saved;
      } else {
        // Analisar referrer para atribuição orgânica
        this.analyzeReferrer();
      }
    }

    // Sempre reportar session_start com dados de atribuição
    this.trackSessionStart();
  }

  /**
   * Retorna os dados UTM atuais
   */
  getUTMData(): UTMData {
    return this.utmData;
  }

  /**
   * Retorna a fonte de tráfego analisada
   */
  getTrafficSource(): string {
    if (this.utmData.utm_source) return this.utmData.utm_source;
    if (this.utmData.is_direct) return 'direct';
    if (this.utmData.is_organic) return this.utmData.referrer_host || 'organic';
    if (this.utmData.is_social) return this.utmData.referrer_host || 'social';
    return this.utmData.referrer_host || 'unknown';
  }

  private extractUTMData(): UTMData {
    const url = new URL(window.location.href);
    const referrer = document.referrer;
    
    const data: UTMData = {
      utm_source: url.searchParams.get('utm_source') || undefined,
      utm_medium: url.searchParams.get('utm_medium') || undefined,
      utm_campaign: url.searchParams.get('utm_campaign') || undefined,
      utm_term: url.searchParams.get('utm_term') || undefined,
      utm_content: url.searchParams.get('utm_content') || undefined,
      referrer_host: this.extractReferrerHost(referrer),
      is_organic: false,
      is_paid: false,
      is_social: false,
      is_direct: !referrer,
      is_referral: false
    };

    // Classificar tráfego
    if (data.utm_medium) {
      const medium = data.utm_medium.toLowerCase();
      data.is_paid = ['cpc', 'ppc', 'paid', 'cpm', 'cpa'].includes(medium);
      data.is_organic = medium === 'organic';
    }

    if (data.referrer_host) {
      data.is_social = SOCIAL_DOMAINS.some(domain => 
        data.referrer_host!.includes(domain)
      );
      
      data.is_organic = SEARCH_ENGINES.some(domain => 
        data.referrer_host!.includes(domain)
      ) && !data.is_paid;

      data.is_referral = !data.is_social && !data.is_organic && !data.is_direct;
    }

    // Determinar traffic_source e traffic_medium
    if (data.utm_source) {
      data.traffic_source = data.utm_source;
      data.traffic_medium = data.utm_medium || 'campaign';
    } else if (data.is_direct) {
      data.traffic_source = 'direct';
      data.traffic_medium = 'none';
    } else if (data.is_social) {
      data.traffic_source = this.mapSocialSource(data.referrer_host!);
      data.traffic_medium = 'social';
    } else if (data.is_organic) {
      data.traffic_source = this.mapSearchEngine(data.referrer_host!);
      data.traffic_medium = 'organic';
    } else if (data.is_referral) {
      data.traffic_source = data.referrer_host!;
      data.traffic_medium = 'referral';
    }

    return data;
  }

  private extractReferrerHost(referrer: string | undefined): string | undefined {
    if (!referrer) return undefined;
    try {
      return new URL(referrer).hostname.replace(/^www\./, '');
    } catch {
      return undefined;
    }
  }

  private mapSocialSource(host: string): string {
    if (host.includes('facebook') || host.includes('fb.com')) return 'facebook';
    if (host.includes('instagram')) return 'instagram';
    if (host.includes('twitter') || host.includes('x.com')) return 'twitter';
    if (host.includes('linkedin')) return 'linkedin';
    if (host.includes('youtube')) return 'youtube';
    if (host.includes('tiktok')) return 'tiktok';
    if (host.includes('pinterest')) return 'pinterest';
    if (host.includes('reddit')) return 'reddit';
    return 'social_other';
  }

  private mapSearchEngine(host: string): string {
    if (host.includes('google')) return 'google';
    if (host.includes('bing')) return 'bing';
    if (host.includes('yahoo')) return 'yahoo';
    if (host.includes('duckduckgo')) return 'duckduckgo';
    return 'search_other';
  }

  private analyzeReferrer(): void {
    const referrer = document.referrer;
    if (!referrer) {
      this.utmData.is_direct = true;
      return;
    }

    const data = this.extractUTMData();
    this.utmData = data;
    this.saveAttribution(data);
  }

  private trackCampaignEntry(data: UTMData): void {
    this.sdk.track('campaign_entry', {
      utm_source: data.utm_source,
      utm_medium: data.utm_medium,
      utm_campaign: data.utm_campaign,
      utm_term: data.utm_term,
      utm_content: data.utm_content,
      landing_page: window.location.pathname,
      referrer_host: data.referrer_host
    });
  }

  private trackSessionStart(): void {
    this.sdk.track('session_start', {
      traffic_source: this.utmData.traffic_source,
      traffic_medium: this.utmData.traffic_medium,
      referrer_host: this.utmData.referrer_host,
      is_organic: this.utmData.is_organic,
      is_paid: this.utmData.is_paid,
      is_social: this.utmData.is_social,
      is_direct: this.utmData.is_direct,
      utm_source: this.utmData.utm_source,
      utm_campaign: this.utmData.utm_campaign,
      landing_page: window.location.pathname
    });
  }

  private saveAttribution(data: UTMData): void {
    try {
      sessionStorage.setItem(this.sessionStorageKey, JSON.stringify({
        ...data,
        saved_at: Date.now()
      }));
    } catch {
      // Storage não disponível
    }
  }

  private loadAttribution(): UTMData | null {
    try {
      const saved = sessionStorage.getItem(this.sessionStorageKey);
      if (saved) {
        const parsed = JSON.parse(saved);
        delete parsed.saved_at;
        return parsed;
      }
    } catch {
      // Storage não disponível
    }
    return null;
  }
}
