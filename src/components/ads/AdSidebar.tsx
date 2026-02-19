/**
 * AdSidebar - Anúncio na barra lateral (desktop only)
 * Posição: Coluna direita, sticky ao scrollar
 * Formato: Display (300x250)
 */

'use client';

import { useEffect, useRef } from 'react';
import { useConsent } from '@/hooks/useConsent';

const ADSENSE_CLIENT_ID = process.env.NEXT_PUBLIC_ADSENSE_CLIENT_ID || 'ca-pub-6096980902806551';
const ADSENSE_SLOT = process.env.NEXT_PUBLIC_ADSENSE_SLOT_SIDEBAR || '5551113379';

export function AdSidebar() {
  const { canUseAdvertising, isLoaded } = useConsent();
  const adRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isLoaded || !canUseAdvertising || !adRef.current) return;
    
    try {
      const w = window as typeof window & { adsbygoogle?: { push: (arg: object) => void } };
      if (w.adsbygoogle) {
        w.adsbygoogle.push({});
      }
    } catch {
      // Silently fail
    }
  }, [isLoaded, canUseAdvertising]);

  if (!isLoaded || !canUseAdvertising) {
    return (
      <aside className="hidden lg:block w-[300px] sticky top-24 self-start">
        <div className="bg-[#f5f5f5] rounded-lg min-h-[250px] flex items-center justify-center">
          <span className="text-xs text-[#9ca3af]">Publicidade</span>
        </div>
      </aside>
    );
  }

  return (
    <aside className="hidden lg:block w-[300px] sticky top-24 self-start h-fit">
      <div ref={adRef} className="bg-[#f5f5f5] rounded-lg p-2">
        <ins
          className="adsbygoogle"
          style={{
            display: 'inline-block',
            width: '300px',
            height: '250px',
          }}
          data-ad-client={ADSENSE_CLIENT_ID}
          data-ad-slot={ADSENSE_SLOT}
        />
      </div>
    </aside>
  );
}
