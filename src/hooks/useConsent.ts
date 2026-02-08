/**
 * Hook para gerenciar consentimento LGPD/GDPR
 * Usado em componentes que precisam verificar permissões
 */

import { useState, useEffect, useCallback } from 'react';

export type ConsentType = {
  necessary: boolean;
  analytics: boolean;
  advertising: boolean;
};

type ConsentConfig = {
  v: string;
  consent: ConsentType;
  timestamp: number;
  bannerVersion: string;
  bannerShown: boolean;
};

const CONSENT_COOKIE_NAME = '__pem_consent';

// Função para ler o cookie de consentimento
export function getConsentCookie(): ConsentConfig | null {
  if (typeof document === 'undefined') return null;
  const match = document.cookie.match(
    new RegExp('(^| )' + CONSENT_COOKIE_NAME + '=([^;]+)')
  );
  if (!match) return null;

  try {
    return JSON.parse(atob(decodeURIComponent(match[2])));
  } catch {
    return null;
  }
}

// Verifica permissão específica
export function hasConsentFor(type: keyof ConsentType): boolean {
  const saved = getConsentCookie();
  if (!saved) return false;
  return saved.consent[type] === true;
}

// Hook principal
export function useConsent() {
  const [consent, setConsent] = useState<ConsentType | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    const saved = getConsentCookie();
    queueMicrotask(() => {
      if (saved) {
        setConsent(saved.consent);
      }
      setIsLoaded(true);
    });

    // Ouvir mudanças de consentimento
    const handleConsentUpdate = (event: CustomEvent<ConsentType>) => {
      setConsent(event.detail);
    };

    window.addEventListener(
      'consentUpdated',
      handleConsentUpdate as EventListener
    );

    return () => {
      window.removeEventListener(
        'consentUpdated',
        handleConsentUpdate as EventListener
      );
    };
  }, []);

  // Verificar permissão específica
  const canUseAnalytics = consent?.analytics === true;
  const canUseAdvertising = consent?.advertising === true;
  const hasAnyConsent = consent !== null;

  // Revogar consentimento
  const revokeConsent = useCallback(() => {
    const deniedConsent: ConsentType = {
      necessary: true,
      analytics: false,
      advertising: false,
    };

    const config: ConsentConfig = {
      v: '1.0',
      consent: deniedConsent,
      timestamp: Date.now(),
      bannerVersion: '1.0',
      bannerShown: true,
    };

    const expires = new Date(
      Date.now() + 365 * 864e5
    ).toUTCString();
    document.cookie = `${CONSENT_COOKIE_NAME}=${encodeURIComponent(
      btoa(JSON.stringify(config))
    )};expires=${expires};path=/;secure;samesite=lax`;

    setConsent(deniedConsent);

    // Disparar evento
    if (typeof window !== 'undefined') {
      window.dispatchEvent(
        new CustomEvent('consentUpdated', { detail: deniedConsent })
      );
    }
  }, []);

  return {
    consent,
    isLoaded,
    canUseAnalytics,
    canUseAdvertising,
    hasAnyConsent,
    revokeConsent,
    hasConsentFor: (type: keyof ConsentType) => consent?.[type] === true,
  };
}
