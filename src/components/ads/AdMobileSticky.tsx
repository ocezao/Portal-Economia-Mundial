/**
 * AdMobileSticky - Anúncio fixo no rodapé (mobile only)
 * Posição: Fixo na parte inferior da tela
 * Formato: Multiplex adaptável
 */

'use client';

import { useEffect, useRef, useState } from 'react';
import { useConsent } from '@/hooks/useConsent';
import { X } from 'lucide-react';

const ADSENSE_CLIENT_ID = process.env.NEXT_PUBLIC_ADSENSE_CLIENT_ID || 'ca-pub-6096980902806551';
const ADSENSE_SLOT = process.env.NEXT_PUBLIC_ADSENSE_SLOT_MOBILE_STICKY || '2330053669';

export function AdMobileSticky() {
  const { canUseAdvertising, isLoaded } = useConsent();
  const adRef = useRef<HTMLDivElement>(null);
  const [isClosed, setIsClosed] = useState(false);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (!isLoaded || !canUseAdvertising) return;

    // Delay para mostrar o anúncio (não mostrar imediatamente)
    const timer = setTimeout(() => {
      setIsVisible(true);
    }, 3000);

    return () => clearTimeout(timer);
  }, [isLoaded, canUseAdvertising]);

  useEffect(() => {
    if (!isVisible || !adRef.current) return;
    
    try {
      const w = window as typeof window & { adsbygoogle?: { push: (arg: object) => void } };
      if (w.adsbygoogle) {
        w.adsbygoogle.push({});
      }
    } catch {
      // Silently fail
    }
  }, [isVisible]);

  if (!isLoaded || !canUseAdvertising || isClosed || !isVisible) {
    return null;
  }

  return (
    <div className="fixed bottom-0 left-0 right-0 z-[1000] bg-white shadow-lg border-t border-[#e5e5e5] lg:hidden">
      <div className="relative">
        {/* Botão fechar */}
        <button
          onClick={() => setIsClosed(true)}
          className="absolute top-0 right-0 p-1 bg-white rounded-full shadow-sm z-10 hover:bg-gray-100"
          aria-label="Fechar publicidade"
        >
          <X className="w-4 h-4 text-gray-500" />
        </button>
        
        {/* Container do anúncio */}
        <div ref={adRef} className="p-2">
          <ins
            className="adsbygoogle"
            style={{
              display: 'block',
              width: '100%',
              height: 'auto',
              minHeight: '90px',
            }}
            data-ad-client={ADSENSE_CLIENT_ID}
            data-ad-slot={ADSENSE_SLOT}
            data-ad-format="auto"
            data-full-width-responsive="true"
          />
        </div>
      </div>
    </div>
  );
}
