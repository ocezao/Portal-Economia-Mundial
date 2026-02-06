/**
 * Tipos do SDK Analytics
 */

export type ConsentState = 'unknown' | 'pending' | 'granted' | 'denied';

export interface AnalyticsEvent {
  v: string;
  event: string;
  user_id: string | null;
  session_id: string | null;
  anonymous: boolean;
  timestamp: number;
  url: string;
  referrer: string | null;
  properties: Record<string, any>;
}

export interface QueueItem {
  event: AnalyticsEvent;
  retries: number;
  addedAt: number;
}

export interface SDKConfig {
  collectorUrl: string;
  siteId?: string;
  debug?: boolean;
  sessionTimeoutMinutes?: number;
  heartbeatIntervalSeconds?: number;
  offlineQueueMaxSize?: number;
  offlineStorageKey?: string;
  consentCookieName?: string;
  consentCookieDays?: {
    granted: number;
    denied: number;
  };
  essentialEvents?: string[];
  version?: string;
}

export interface DeviceInfo {
  type: 'desktop' | 'tablet' | 'mobile' | 'unknown';
  viewport_width: number;
  viewport_height: number;
  language: string;
  timezone: string;
  screen_width?: number;
  screen_height?: number;
  device_pixel_ratio?: number;
}

export interface BrowserInfo {
  browser_name: string;
  browser_version: string;
  os_name: string;
  os_version: string;
}

export interface ScrollData {
  depth_percent: number;
  max_depth_percent: number;
  page_height_pixels: number;
  viewport_height_pixels: number;
  scroll_speed_pixels_per_second?: number;
}

export interface EngagementData {
  active_time_seconds: number;
  total_time_seconds: number;
  visibility_percent: number;
  focus_events_count: number;
}

export interface WebVitalData {
  name: 'LCP' | 'FID' | 'CLS' | 'INP' | 'TTFB' | 'FCP';
  value: number;
  rating: 'good' | 'needs-improvement' | 'poor';
  delta?: number;
  entries?: any[];
}

export interface ErrorData {
  message: string;
  source?: string;
  line?: number;
  column?: number;
  stack?: string;
  handled?: boolean;
}

export interface UTMData {
  utm_source?: string;
  utm_medium?: string;
  utm_campaign?: string;
  utm_term?: string;
  utm_content?: string;
  referrer_host?: string;
  traffic_source?: string;
  traffic_medium?: string;
  is_organic: boolean;
  is_paid: boolean;
  is_social: boolean;
  is_direct: boolean;
  is_referral: boolean;
}

export interface AntiFraudSignals {
  // Sinais de bot
  bot_score: number; // 0-100, maior = mais provável bot
  is_headless: boolean;
  is_automated: boolean;
  
  // Sinais de comportamento humano
  mouse_movements_count: number;
  click_pattern_entropy: number;
  scroll_pattern_natural: boolean;
  time_to_first_interaction_ms: number;
  
  // Sinais técnicos
  has_consistent_timezone: boolean;
  has_webdriver_property: boolean;
  plugins_count: number;
  languages_count: number;
  
  // Fingerprints (hashed)
  canvas_fingerprint_hash?: string;
  webgl_fingerprint_hash?: string;
  fonts_hash?: string;
}

export interface ArticleReadingData {
  article_id: string;
  category: string;
  author_slug?: string;
  tags?: string[];
  word_count?: number;
  scroll_depth_percent: number;
  time_spent_seconds: number;
  is_complete: boolean;
  paragraphs_read?: number;
}
