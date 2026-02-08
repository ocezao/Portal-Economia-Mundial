/**
 * Cookie Banner LGPD/GDPR Compliant
 * Consent Management Platform (CMP) Granular
 * Integração com AdSense
 */

'use client';

import { useState, useEffect, useCallback } from 'react';
import { X, Shield, Cookie, Settings, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';

export interface ConsentType {
  necessary: boolean;
  analytics: boolean;
  advertising: boolean;
};

interface ConsentConfig {
  v: string;
  consent: ConsentType;
  timestamp: number;
  bannerVersion: string;
  bannerShown: boolean;
};

const CONSENT_COOKIE_NAME = '__pem_consent';
const COOKIE_DAYS_GRANTED = 180;
const COOKIE_DAYS_DENIED = 365;
const BANNER_VERSION = '1.0';

// Hook personalizado para gerenciar consentimento
export function useConsent() {
  const [consent, setConsent] = useState<ConsentType | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    const saved = getConsentCookie();
    if (saved) {
      // Usar setTimeout para evitar setState síncrono
      setTimeout(() => setConsent(saved.consent), 0);
    }
    setTimeout(() => setIsLoaded(true), 0);
  }, []);

  const saveConsent = useCallback((newConsent: ConsentType) => {
    const config: ConsentConfig = {
      v: '1.0',
      consent: newConsent,
      timestamp: Date.now(),
      bannerVersion: BANNER_VERSION,
      bannerShown: true,
    };

    const hasAnyConsent = newConsent.analytics || newConsent.advertising;
    const days = hasAnyConsent ? COOKIE_DAYS_GRANTED : COOKIE_DAYS_DENIED;

    setCookie(CONSENT_COOKIE_NAME, btoa(JSON.stringify(config)), days);
    setConsent(newConsent);

    // Disparar evento para outros componentes
    if (typeof window !== 'undefined') {
      window.dispatchEvent(
        new CustomEvent('consentUpdated', { detail: newConsent }) as Event
      );

      // Inicializar AdSense se consentimento de publicidade
      const w = window as typeof window & { adsbygoogle?: { push: (arg: object) => void } };
      if (newConsent.advertising && w.adsbygoogle) {
        try {
          w.adsbygoogle.push({});
        } catch (e: unknown) {
          console.error('AdSense init error:', e);
        }
      }
    }
  }, []);

  const revokeConsent = useCallback(() => {
    const deniedConsent: ConsentType = {
      necessary: true,
      analytics: false,
      advertising: false,
    };
    saveConsent(deniedConsent);
  }, [saveConsent]);

  return { consent, isLoaded, saveConsent, revokeConsent };
}

// Funções auxiliares
function getConsentCookie(): ConsentConfig | null {
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

function setCookie(name: string, value: string, days: number) {
  const expires = new Date(Date.now() + days * 864e5).toUTCString();
  document.cookie = `${name}=${encodeURIComponent(
    value
  )};expires=${expires};path=/;secure;samesite=lax`;
}

export function hasConsentFor(type: keyof ConsentType): boolean {
  const saved = getConsentCookie();
  if (!saved) return false;
  return saved.consent[type] === true;
}

// Componente Principal
export function CookieBanner() {
  const [showBanner, setShowBanner] = useState(false);
  const [showPreferences, setShowPreferences] = useState(false);
  const [preferences, setPreferences] = useState<ConsentType>({
    necessary: true,
    analytics: false,
    advertising: false,
  });

  useEffect(() => {
    // Verificar se já existe consentimento
    const saved = getConsentCookie();
    setTimeout(() => {
      if (!saved || !saved.bannerShown) {
        setShowBanner(true);
      } else {
        setPreferences(saved.consent);
      }
    }, 0);
  }, []);

  const handleAcceptAll = () => {
    const allGranted: ConsentType = {
      necessary: true,
      analytics: true,
      advertising: true,
    };
    saveConsentToCookie(allGranted);
    setPreferences(allGranted);
    setShowBanner(false);
    setShowPreferences(false);
  };

  const handleRejectNonEssential = () => {
    const onlyNecessary: ConsentType = {
      necessary: true,
      analytics: false,
      advertising: false,
    };
    saveConsentToCookie(onlyNecessary);
    setPreferences(onlyNecessary);
    setShowBanner(false);
    setShowPreferences(false);
  };

  const handleSavePreferences = () => {
    saveConsentToCookie(preferences);
    setShowBanner(false);
    setShowPreferences(false);
  };

  const togglePreference = (key: keyof ConsentType) => {
    if (key === 'necessary') return; // Não pode desabilitar necessários
    setPreferences((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  if (!showBanner) return null;

  return (
    <>
      {/* Overlay escuro quando preferências estão abertas */}
      {showPreferences && (
        <div
          className="fixed inset-0 bg-black/50 z-[998]"
          onClick={() => setShowPreferences(false)}
          aria-hidden="true"
        />
      )}

      {/* Banner Principal */}
      <div
        role="dialog"
        aria-label="Configurações de cookies e privacidade"
        className={`fixed z-[999] transition-all duration-300 ${
          showPreferences
            ? 'bottom-auto top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-lg'
            : 'bottom-0 left-0 right-0'
        }`}
      >
        <div
          className={`bg-white shadow-2xl border border-[#e5e5e5] ${
            showPreferences ? 'rounded-xl' : 'rounded-t-xl'
          }`}
        >
          {!showPreferences ? (
            // Banner Compacto
            <div className="max-w-7xl mx-auto p-4 sm:p-6">
              <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
                {/* Ícone e Texto */}
                <div className="flex items-start gap-3 flex-1">
                  <div className="p-2 bg-[#c40000]/10 rounded-lg flex-shrink-0">
                    <Cookie className="w-6 h-6 text-[#c40000]" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-bold text-[#111111] mb-1">
                      Valorizamos sua privacidade
                    </h3>
                    <p className="text-sm text-[#6b6b6b] leading-relaxed">
                      Usamos cookies para melhorar sua experiência, analisar
                      tráfego e exibir anúncios relevantes. Consulte nossa{' '}
                      <a
                        href="/privacidade/"
                        className="text-[#c40000] hover:underline font-medium"
                      >
                        Política de Privacidade
                      </a>{' '}
                      e{' '}
                      <a
                        href="/cookies/"
                        className="text-[#c40000] hover:underline font-medium"
                      >
                        Política de Cookies
                      </a>
                      .
                    </p>
                  </div>
                </div>

                {/* Botões */}
                <div className="flex flex-wrap items-center gap-2 w-full lg:w-auto">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowPreferences(true)}
                    className="flex-1 lg:flex-none"
                  >
                    <Settings className="w-4 h-4 mr-2" />
                    Personalizar
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleRejectNonEssential}
                    className="flex-1 lg:flex-none"
                  >
                    Recusar
                  </Button>
                  <Button
                    size="sm"
                    onClick={handleAcceptAll}
                    className="flex-1 lg:flex-none bg-[#c40000] hover:bg-[#a00000]"
                  >
                    <Check className="w-4 h-4 mr-2" />
                    Aceitar Todos
                  </Button>
                </div>

                {/* Botão Fechar */}
                <button
                  onClick={handleRejectNonEssential}
                  className="absolute top-2 right-2 p-1 rounded-full hover:bg-[#f5f5f5] transition-colors lg:hidden"
                  aria-label="Fechar e recusar cookies"
                >
                  <X className="w-5 h-5 text-[#6b6b6b]" />
                </button>
              </div>
            </div>
          ) : (
            // Modal de Preferências
            <div className="p-6">
              {/* Header */}
              <div className="flex items-start justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-[#c40000]/10 rounded-lg">
                    <Shield className="w-6 h-6 text-[#c40000]" />
                  </div>
                  <div>
                    <h3 className="font-bold text-[#111111]">
                      Preferências de Cookies
                    </h3>
                    <p className="text-sm text-[#6b6b6b]">
                      Gerencie suas preferências de privacidade
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setShowPreferences(false)}
                  className="p-1 rounded-full hover:bg-[#f5f5f5] transition-colors"
                  aria-label="Fechar"
                >
                  <X className="w-5 h-5 text-[#6b6b6b]" />
                </button>
              </div>

              {/* Lista de Categorias */}
              <div className="space-y-4 mb-6">
                {/* Necessários - Sempre ativo */}
                <div className="p-4 bg-[#f5f5f5] rounded-lg border border-[#e5e5e5]">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-[#111111]">
                        Necessários
                      </span>
                      <span className="px-2 py-0.5 bg-[#22c55e]/10 text-[#22c55e] text-xs font-medium rounded-full">
                        Sempre ativo
                      </span>
                    </div>
                    <div className="w-11 h-6 bg-[#22c55e] rounded-full relative cursor-not-allowed">
                      <div className="absolute right-1 top-1 w-4 h-4 bg-white rounded-full shadow" />
                    </div>
                  </div>
                  <p className="text-sm text-[#6b6b6b]">
                    Essenciais para o funcionamento do site. Incluem
                    autenticação, segurança e preferências básicas.
                  </p>
                </div>

                {/* Analytics */}
                <div
                  className={`p-4 rounded-lg border cursor-pointer transition-colors ${
                    preferences.analytics
                      ? 'bg-[#eff6ff] border-[#bfdbfe]'
                      : 'bg-white border-[#e5e5e5] hover:border-[#bfdbfe]'
                  }`}
                  onClick={() => togglePreference('analytics')}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-semibold text-[#111111]">
                      Analytics (Análise)
                    </span>
                    <div
                      className={`w-11 h-6 rounded-full relative transition-colors ${
                        preferences.analytics ? 'bg-[#c40000]' : 'bg-[#d1d5db]'
                      }`}
                    >
                      <div
                        className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-all ${
                          preferences.analytics ? 'right-1' : 'left-1'
                        }`}
                      />
                    </div>
                  </div>
                  <p className="text-sm text-[#6b6b6b]">
                    Nos ajudam a entender como você usa o site, quais páginas
                    visita e por quanto tempo. Usamos dados anonimizados.
                  </p>
                </div>

                {/* Publicidade */}
                <div
                  className={`p-4 rounded-lg border cursor-pointer transition-colors ${
                    preferences.advertising
                      ? 'bg-[#eff6ff] border-[#bfdbfe]'
                      : 'bg-white border-[#e5e5e5] hover:border-[#bfdbfe]'
                  }`}
                  onClick={() => togglePreference('advertising')}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-semibold text-[#111111]">
                      Publicidade (AdSense)
                    </span>
                    <div
                      className={`w-11 h-6 rounded-full relative transition-colors ${
                        preferences.advertising
                          ? 'bg-[#c40000]'
                          : 'bg-[#d1d5db]'
                      }`}
                    >
                      <div
                        className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-all ${
                          preferences.advertising ? 'right-1' : 'left-1'
                        }`}
                      />
                    </div>
                  </div>
                  <p className="text-sm text-[#6b6b6b]">
                    Permitem exibir anúncios relevantes. Usamos o Google AdSense
                    e seguimos as políticas de privacidade do Google.
                  </p>
                </div>
              </div>

              {/* Botões de Ação */}
              <div className="flex flex-col sm:flex-row gap-3">
                <Button
                  variant="outline"
                  onClick={handleRejectNonEssential}
                  className="flex-1"
                >
                  Recusar Tudo
                </Button>
                <Button
                  onClick={handleAcceptAll}
                  variant="outline"
                  className="flex-1 border-[#c40000] text-[#c40000] hover:bg-[#c40000] hover:text-white"
                >
                  Aceitar Tudo
                </Button>
                <Button
                  onClick={handleSavePreferences}
                  className="flex-1 bg-[#c40000] hover:bg-[#a00000]"
                >
                  Salvar Preferências
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}

// Função auxiliar para salvar no cookie
function saveConsentToCookie(consent: ConsentType) {
  const config: ConsentConfig = {
    v: '1.0',
    consent,
    timestamp: Date.now(),
    bannerVersion: BANNER_VERSION,
    bannerShown: true,
  };

  const hasAnyConsent = consent.analytics || consent.advertising;
  const days = hasAnyConsent ? COOKIE_DAYS_GRANTED : COOKIE_DAYS_DENIED;

  setCookie(CONSENT_COOKIE_NAME, btoa(JSON.stringify(config)), days);

  // Disparar evento
  if (typeof window !== 'undefined') {
    window.dispatchEvent(
      new CustomEvent('consentUpdated', { detail: consent }) as Event
    );

    // Inicializar AdSense se consentido
    const w = window as typeof window & { adsbygoogle?: { push: (arg: object) => void } };
    if (consent.advertising && w.adsbygoogle) {
      try {
        w.adsbygoogle.push({});
      } catch (e: unknown) {
        console.error('AdSense initialization error:', e);
      }
    }
  }
}

// Botão flutuante para reabrir preferências (opcional)
export function ConsentFloatingButton() {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const saved = getConsentCookie();
    queueMicrotask(() => {
      setIsVisible(!!saved);
    });
  }, []);

  const handleReopen = () => {
    // Limpar cookie para mostrar banner novamente
    document.cookie = `${CONSENT_COOKIE_NAME}=;expires=Thu, 01 Jan 1970 00:00:00 UTC;path=/;`;
    window.location.reload();
  };

  if (!isVisible) return null;

  return (
    <button
      onClick={handleReopen}
      className="fixed bottom-4 left-4 z-[997] p-3 bg-white rounded-full shadow-lg border border-[#e5e5e5] hover:shadow-xl transition-shadow"
      aria-label="Alterar preferências de cookies"
      title="Preferências de privacidade"
    >
      <Cookie className="w-5 h-5 text-[#6b6b6b]" />
    </button>
  );
}
