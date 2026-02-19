/**
 * AdFeed - Anúncio entre artigos (in-feed)
 * Posição: A cada 3-4 artigos na listagem
 * Formato: In-feed (nativo)
 */

'use client';

import { useEffect, useRef } from 'react';
import { useConsent } from '@/hooks/useConsent';

const ADSENSE_CLIENT_ID = process.env.NEXT_PUBLIC_ADSENSE_CLIENT_ID || 'ca-pub-6096980902806551';
const ADSENSE_SLOT = process.env.NEXT_PUBLIC_ADSENSE_SLOT_FEED_INLINE || '9394590232';

interface AdFeedProps {
  className?: string;
}

export function AdFeed({ className = '' }: AdFeedProps) {
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
      <div className={`bg-[#f5f5f5] rounded-lg min-h-[250px] flex items-center justify-center ${className}`}>
        <span className="text-xs text-[#9ca3af]">Publicidade</span>
      </div>
    );
  }

  return (
    <div ref={adRef} className={`bg-[#f5f5f5] rounded-lg overflow-hidden ${className}`}>
      <ins
        className="adsbygoogle"
        style={{
          display: 'block',
          width: '100%',
          minHeight: '250px',
        }}
        data-ad-client={ADSENSE_CLIENT_ID}
        data-ad-slot={ADSENSE_SLOT}
        data-ad-format="fluid"
        data-ad-layout-key="-fb+5w+4e-db+86"
      />
    </div>
  );
}
