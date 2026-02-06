/**
 * Utilitários para detecção de dispositivo e browser
 */

import type { DeviceInfo, BrowserInfo } from '../types';

/**
 * Gera um UUID v4
 */
export function generateUUID(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

/**
 * Detecta o tipo de dispositivo baseado no user agent e tela
 */
export function getDeviceInfo(): DeviceInfo {
  const ua = navigator.userAgent;
  const width = window.innerWidth;
  const height = window.innerHeight;
  
  // Detectar tipo de dispositivo
  let type: DeviceInfo['type'] = 'desktop';
  
  if (/Mobi|Android|iPhone|iPad|iPod/i.test(ua)) {
    if (/iPad|Tablet|Android(?!.*Mobile)/i.test(ua) || (width >= 768 && width <= 1366)) {
      type = 'tablet';
    } else {
      type = 'mobile';
    }
  }
  
  return {
    type,
    viewport_width: width,
    viewport_height: height,
    language: navigator.language || 'unknown',
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || 'unknown',
    screen_width: window.screen.width,
    screen_height: window.screen.height,
    device_pixel_ratio: window.devicePixelRatio || 1
  };
}

/**
 * Extrai informações do browser a partir do user agent
 */
export function getBrowserInfo(): BrowserInfo {
  const ua = navigator.userAgent;
  
  // Detectar browser
  let browser_name = 'unknown';
  let browser_version = 'unknown';
  
  if (/Edg\/([\d.]+)/i.test(ua)) {
    browser_name = 'Edge';
    browser_version = ua.match(/Edg\/([\d.]+)/i)?.[1] || 'unknown';
  } else if (/Chrome\/([\d.]+)/i.test(ua)) {
    browser_name = 'Chrome';
    browser_version = ua.match(/Chrome\/([\d.]+)/i)?.[1] || 'unknown';
  } else if (/Firefox\/([\d.]+)/i.test(ua)) {
    browser_name = 'Firefox';
    browser_version = ua.match(/Firefox\/([\d.]+)/i)?.[1] || 'unknown';
  } else if (/Safari\/([\d.]+)/i.test(ua) && /Version\/([\d.]+)/i.test(ua)) {
    browser_name = 'Safari';
    browser_version = ua.match(/Version\/([\d.]+)/i)?.[1] || 'unknown';
  } else if (/Opera|OPR\/([\d.]+)/i.test(ua)) {
    browser_name = 'Opera';
    browser_version = ua.match(/(?:Opera|OPR)\/([\d.]+)/i)?.[1] || 'unknown';
  }
  
  // Detectar OS
  let os_name = 'unknown';
  let os_version = 'unknown';
  
  if (/Windows NT 10/.test(ua)) {
    os_name = 'Windows';
    os_version = '10/11';
  } else if (/Windows NT 6.3/.test(ua)) {
    os_name = 'Windows';
    os_version = '8.1';
  } else if (/Windows NT 6.2/.test(ua)) {
    os_name = 'Windows';
    os_version = '8';
  } else if (/Windows NT 6.1/.test(ua)) {
    os_name = 'Windows';
    os_version = '7';
  } else if (/Mac OS X ([\d_]+)/.test(ua)) {
    os_name = 'macOS';
    os_version = (ua.match(/Mac OS X ([\d_]+)/)?.[1] || 'unknown').replace(/_/g, '.');
  } else if (/Android ([\d.]+)/.test(ua)) {
    os_name = 'Android';
    os_version = ua.match(/Android ([\d.]+)/)?.[1] || 'unknown';
  } else if (/iPhone OS ([\d_]+)/.test(ua) || /iPad.*OS ([\d_]+)/.test(ua)) {
    os_name = 'iOS';
    os_version = (ua.match(/(?:iPhone|iPad).*OS ([\d_]+)/)?.[1] || 'unknown').replace(/_/g, '.');
  } else if (/Linux/.test(ua)) {
    os_name = 'Linux';
    os_version = 'unknown';
  }
  
  return {
    browser_name,
    browser_version,
    os_name,
    os_version
  };
}

/**
 * Calcula hash simples de uma string (FNV-1a)
 */
export function hashString(str: string): string {
  let hash = 0x811c9dc5;
  for (let i = 0; i < str.length; i++) {
    hash ^= str.charCodeAt(i);
    hash += (hash << 1) + (hash << 4) + (hash << 7) + (hash << 8) + (hash << 24);
  }
  return (hash >>> 0).toString(16);
}
