/**
 * Componente de Anúncio AdSense Otimizado
 * - Integração com sistema de consentimento LGPD
 * - Dimensões fixas para evitar CLS
 * - Lazy loading com IntersectionObserver
 * - Placeholder visual durante carregamento
 */

'use client';

import { useEffect, useRef, useState } from 'react';
import { useConsent } from '@/hooks/useConsent';

export type AdFormat = 'auto' | 'rectangle' | 'leaderboard' | 'skyscraper' | 'billboard';

interface AdUnitProps {
  slot?: string;
  format: AdFormat;
  className?: string;
  lazy?: boolean;
}

// Dimensões fixas para cada formato (evita CLS)
const AD_DIMENSIONS: Record<AdFormat, { width: string; height: string; minHeight: string; maxWidth?: string }> = {
  auto: { 
    width: '100%', 
    height: 'auto', 
    minHeight: '250px',
    maxWidth: '100%'
  },
  rectangle: { 
    width: '300px', 
    height: '250px', 
    minHeight: '250px',
    maxWidth: '300px'
  },
  leaderboard: { 
    width: '728px', 
    height: '90px', 
    minHeight: '90px',
    maxWidth: '728px'
  },
  skyscraper: { 
    width: '160px', 
    height: '600px', 
    minHeight: '600px',
    maxWidth: '160px'
  },
  billboard: {
    width: '970px',
    height: '250px',
    minHeight: '250px',
    maxWidth: '970px'
  }
};

// AdSense Client ID (deve vir do .env)
const ADSENSE_CLIENT_ID = process.env.NEXT_PUBLIC_ADSENSE_CLIENT_ID || '';

export function AdUnit({ slot, format, className = '', lazy = true }: AdUnitProps) {
  const adRef = useRef<HTMLDivElement>(null);
  const hasPushedRef = useRef(false);
  const [isVisible, setIsVisible] = useState(!lazy);
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);
  const { canUseAdvertising, isLoaded: consentLoaded } = useConsent();

  const dimensions = AD_DIMENSIONS[format];

  // Intersection Observer para lazy loading
  useEffect(() => {
    if (!lazy || isVisible) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      {
        rootMargin: '200px', // Pré-carrega antes de entrar na viewport
        threshold: 0,
      }
    );

    if (adRef.current) {
      observer.observe(adRef.current);
    }

    return () => observer.disconnect();
  }, [lazy, isVisible]);

  // Carregar anúncio quando visível e com consentimento
  useEffect(() => {
    if (!isVisible || !consentLoaded) return;

    // Se não tem consentimento de publicidade, não carrega
    if (!canUseAdvertising) return;

    // Se não há AdSense configurado (ou slot vazio), não tenta inicializar.
    if (!ADSENSE_CLIENT_ID || !slot) return;

    if (hasPushedRef.current) return;

    let cancelled = false;
    let attempts = 0;
    const MAX_ATTEMPTS = 12;
    const RETRY_DELAY_MS = 650;

    const tryPush = () => {
      if (cancelled || hasPushedRef.current) return;
      const w = window as typeof window & { adsbygoogle?: { push: (arg: object) => void } };

      // Script ainda não carregou: tentar novamente.
      if (!w.adsbygoogle) {
        attempts += 1;
        if (attempts >= MAX_ATTEMPTS) {
          setHasError(true);
          return;
        }
        setTimeout(tryPush, RETRY_DELAY_MS);
        return;
      }

      try {
        w.adsbygoogle.push({});
        hasPushedRef.current = true;
        setIsLoaded(true);
        setHasError(false);
      } catch (e: unknown) {
        console.error('AdSense error:', e);
        setHasError(true);
      }
    };

    // Delay para não competir com conteúdo crítico.
    const startDelay = lazy ? 900 : 100;
    const startTimer = setTimeout(tryPush, startDelay);

    const handleAdsenseLoaded = () => {
      tryPush();
    };

    window.addEventListener('adsenseLoaded', handleAdsenseLoaded);

    return () => {
      cancelled = true;
      clearTimeout(startTimer);
      window.removeEventListener('adsenseLoaded', handleAdsenseLoaded);
    };
  }, [isVisible, consentLoaded, canUseAdvertising, lazy, slot]);

  // Se não tem consentimento, mostra mensagem alternativa
  if (consentLoaded && !canUseAdvertising) {
    return (
      <div
        ref={adRef}
        className={`ad-container ad-disabled ${className}`}
        style={{
          width: dimensions.width,
          maxWidth: dimensions.maxWidth,
          minHeight: dimensions.minHeight,
        }}
      >
        <div className="w-full h-full min-h-[250px] bg-[#f5f5f5] rounded-lg flex items-center justify-center p-4">
          <div className="text-center">
            <p className="text-sm text-[#6b6b6b] mb-2">Publicidade desativada</p>
            <p className="text-xs text-[#9ca3af]">
              Ative cookies de publicidade para ver anúncios relevantes
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Se não tem AdSense configurado (ou slot vazio), renderiza placeholder estático.
  if (!ADSENSE_CLIENT_ID || !slot) {
    return <AdPlaceholder format={format} className={className} />;
  }

  // Se ainda não está visível (lazy loading), mostra placeholder
  if (!isVisible) {
    return (
      <div
        ref={adRef}
        className={`ad-container ad-placeholder ${className}`}
        style={{
          width: dimensions.width,
          maxWidth: dimensions.maxWidth,
          minHeight: dimensions.minHeight,
          backgroundColor: '#f5f5f5',
        }}
        aria-label="Espaço reservado para publicidade"
      />
    );
  }

  return (
    <div
      ref={adRef}
      className={`ad-container ${className}`}
      style={{
        width: dimensions.width,
        maxWidth: '100%',
        minHeight: dimensions.minHeight,
        backgroundColor: isLoaded ? 'transparent' : '#f5f5f5',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      {/* Placeholder enquanto carrega */}
      {!isLoaded && !hasError && (
        <div className="text-center p-4">
          <div className="animate-pulse flex flex-col items-center gap-2">
            <div className="w-8 h-8 bg-[#e5e5e5] rounded" />
            <span className="text-xs text-[#9ca3af]">Carregando...</span>
          </div>
        </div>
      )}

      {/* Mensagem de erro */}
      {hasError && (
        <div className="text-center p-4">
          <span className="text-xs text-[#9ca3af]">Publicidade</span>
        </div>
      )}

      {/* AdSense Ins */}
      <ins
        className="adsbygoogle"
        style={{
          display: 'block',
          width: dimensions.width,
          height: dimensions.height,
          maxWidth: '100%',
        }}
        data-ad-client={ADSENSE_CLIENT_ID}
        data-ad-slot={slot}
        data-ad-format={format === 'auto' ? 'auto' : undefined}
        data-full-width-responsive={format === 'auto' ? 'true' : undefined}
      />
    </div>
  );
}

// Componente para above-the-fold (sem lazy loading)
export function AdUnitAboveFold({ slot, format, className = '' }: Omit<AdUnitProps, 'lazy'>) {
  return <AdUnit slot={slot} format={format} className={className} lazy={false} />;
}

// Componente estático para quando não há AdSense configurado
export function AdPlaceholder({ format, className = '' }: { format: AdFormat; className?: string }) {
  const dimensions = AD_DIMENSIONS[format];

  return (
    <div
      className={`ad-placeholder bg-[#f5f5f5] rounded-lg flex items-center justify-center ${className}`}
      style={{
        width: dimensions.width,
        maxWidth: '100%',
        minHeight: dimensions.minHeight,
      }}
    >
      <div className="text-center p-4">
        <span className="text-xs text-[#9ca3af] uppercase tracking-wider">Publicidade</span>
      </div>
    </div>
  );
}
