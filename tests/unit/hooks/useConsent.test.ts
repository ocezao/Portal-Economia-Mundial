import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, waitFor, act } from '@testing-library/react';
import { useConsent, getConsentCookie, hasConsentFor } from '@/hooks/useConsent';

describe('useConsent', () => {
  const CONSENT_COOKIE_NAME = '__cin_consent';

  beforeEach(() => {
    // Limpar cookies
    document.cookie = `${CONSENT_COOKIE_NAME}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
    vi.clearAllMocks();
  });

  afterEach(() => {
    // Limpar cookies após cada teste
    document.cookie = `${CONSENT_COOKIE_NAME}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
  });

  it('deve inicializar sem consentimento quando não há cookie', async () => {
    const { result } = renderHook(() => useConsent());

    await waitFor(() => {
      expect(result.current.isLoaded).toBe(true);
    });

    expect(result.current.consent).toBeNull();
    expect(result.current.hasAnyConsent).toBe(false);
    expect(result.current.canUseAnalytics).toBe(false);
    expect(result.current.canUseAdvertising).toBe(false);
  });

  it('deve carregar consentimento do cookie', async () => {
    const mockConsent = {
      v: '1.0',
      consent: {
        necessary: true,
        analytics: true,
        advertising: false,
      },
      timestamp: Date.now(),
      bannerVersion: '1.0',
      bannerShown: true,
    };

    // Setar cookie
    const cookieValue = encodeURIComponent(btoa(JSON.stringify(mockConsent)));
    document.cookie = `${CONSENT_COOKIE_NAME}=${cookieValue}; path=/;`;

    const { result } = renderHook(() => useConsent());

    await waitFor(() => {
      expect(result.current.consent).not.toBeNull();
    });

    expect(result.current.consent?.analytics).toBe(true);
    expect(result.current.consent?.advertising).toBe(false);
    expect(result.current.canUseAnalytics).toBe(true);
    expect(result.current.canUseAdvertising).toBe(false);
    expect(result.current.hasAnyConsent).toBe(true);
  });

  it('deve verificar consentimento específico', async () => {
    const mockConsent = {
      v: '1.0',
      consent: {
        necessary: true,
        analytics: true,
        advertising: false,
      },
      timestamp: Date.now(),
      bannerVersion: '1.0',
      bannerShown: true,
    };

    const cookieValue = encodeURIComponent(btoa(JSON.stringify(mockConsent)));
    document.cookie = `${CONSENT_COOKIE_NAME}=${cookieValue}; path=/;`;

    const { result } = renderHook(() => useConsent());

    await waitFor(() => {
      expect(result.current.consent).not.toBeNull();
    });

    expect(result.current.hasConsentFor('necessary')).toBe(true);
    expect(result.current.hasConsentFor('analytics')).toBe(true);
    expect(result.current.hasConsentFor('advertising')).toBe(false);
  });

  it('deve revogar consentimento', async () => {
    const mockConsent = {
      v: '1.0',
      consent: {
        necessary: true,
        analytics: true,
        advertising: true,
      },
      timestamp: Date.now(),
      bannerVersion: '1.0',
      bannerShown: true,
    };

    const cookieValue = encodeURIComponent(btoa(JSON.stringify(mockConsent)));
    document.cookie = `${CONSENT_COOKIE_NAME}=${cookieValue}; path=/;`;

    const { result } = renderHook(() => useConsent());

    await waitFor(() => {
      expect(result.current.consent).not.toBeNull();
    });

    act(() => {
      result.current.revokeConsent();
    });

    await waitFor(() => {
      expect(result.current.consent?.analytics).toBe(false);
      expect(result.current.consent?.advertising).toBe(false);
    });

    expect(result.current.canUseAnalytics).toBe(false);
    expect(result.current.canUseAdvertising).toBe(false);
  });

  it('deve escutar eventos de atualização de consentimento', async () => {
    const { result } = renderHook(() => useConsent());

    await waitFor(() => {
      expect(result.current.isLoaded).toBe(true);
    });

    const newConsent = {
      necessary: true,
      analytics: true,
      advertising: true,
    };

    // Disparar evento
    act(() => {
      window.dispatchEvent(new CustomEvent('consentUpdated', { detail: newConsent }));
    });

    await waitFor(() => {
      expect(result.current.consent?.analytics).toBe(true);
      expect(result.current.consent?.advertising).toBe(true);
    });
  });
});

describe('getConsentCookie', () => {
  const CONSENT_COOKIE_NAME = '__cin_consent';

  beforeEach(() => {
    document.cookie = `${CONSENT_COOKIE_NAME}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
  });

  afterEach(() => {
    document.cookie = `${CONSENT_COOKIE_NAME}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
  });

  it('deve retornar null quando não há cookie', () => {
    const result = getConsentCookie();
    expect(result).toBeNull();
  });

  it('deve retornar config quando há cookie válido', () => {
    const mockConsent = {
      v: '1.0',
      consent: {
        necessary: true,
        analytics: false,
        advertising: false,
      },
      timestamp: Date.now(),
      bannerVersion: '1.0',
      bannerShown: true,
    };

    const cookieValue = encodeURIComponent(btoa(JSON.stringify(mockConsent)));
    document.cookie = `${CONSENT_COOKIE_NAME}=${cookieValue}; path=/;`;

    const result = getConsentCookie();
    expect(result).not.toBeNull();
    expect(result?.consent.necessary).toBe(true);
    expect(result?.consent.analytics).toBe(false);
  });

  it('deve retornar null para cookie inválido', () => {
    document.cookie = `${CONSENT_COOKIE_NAME}=invalid-base64; path=/;`;

    const result = getConsentCookie();
    expect(result).toBeNull();
  });
});

describe('hasConsentFor', () => {
  const CONSENT_COOKIE_NAME = '__cin_consent';

  beforeEach(() => {
    document.cookie = `${CONSENT_COOKIE_NAME}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
  });

  afterEach(() => {
    document.cookie = `${CONSENT_COOKIE_NAME}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
  });

  it('deve retornar false quando não há cookie', () => {
    expect(hasConsentFor('analytics')).toBe(false);
    expect(hasConsentFor('advertising')).toBe(false);
    expect(hasConsentFor('necessary')).toBe(false);
  });

  it('deve retornar valor correto quando há cookie', () => {
    const mockConsent = {
      v: '1.0',
      consent: {
        necessary: true,
        analytics: true,
        advertising: false,
      },
      timestamp: Date.now(),
      bannerVersion: '1.0',
      bannerShown: true,
    };

    const cookieValue = encodeURIComponent(btoa(JSON.stringify(mockConsent)));
    document.cookie = `${CONSENT_COOKIE_NAME}=${cookieValue}; path=/;`;

    expect(hasConsentFor('necessary')).toBe(true);
    expect(hasConsentFor('analytics')).toBe(true);
    expect(hasConsentFor('advertising')).toBe(false);
  });
});
