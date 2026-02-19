/**
 * AdAboveFold - Anúncio acima da dobra (above the fold)
 * Posição: Topo da página, abaixo do header
 * Formato: Display responsivo (970x250 desktop, 320x100 mobile)
 */

'use client';

import Script from 'next/script';
import { useConsent } from '@/hooks/useConsent';

const ADSENSE_CLIENT_ID = process.env.NEXT_PUBLIC_ADSENSE_CLIENT_ID || 'ca-pub-6096980902806551';
const ADSENSE_SLOT = process.env.NEXT_PUBLIC_ADSENSE_SLOT_HOME_ABOVE_FOLD || '5551113379';

export function AdAboveFold() {
  const { canUseAdvertising, isLoaded } = useConsent();

  if (!isLoaded || !canUseAdvertising) {
    return (
      <div className="w-full bg-[#f5f5f5] min-h-[90px] md:min-h-[250px] flex items-center justify-center">
        <span className="text-xs text-[#9ca3af]">Publicidade</span>
      </div>
    );
  }

  return (
    <div className="w-full bg-[#f5f5f5] py-4">
      <div className="max-w-[1280px] mx-auto px-4">
        <ins
          className="adsbygoogle"
          style={{
            display: 'block',
            width: '100%',
            minHeight: '90px',
          }}
          data-ad-client={ADSENSE_CLIENT_ID}
          data-ad-slot={ADSENSE_SLOT}
          data-ad-format="auto"
          data-full-width-responsive="true"
        />
        <Script id="ad-above-fold-init" strategy="afterInteractive">
          {`(adsbygoogle = window.adsbygoogle || []).push({});`}
        </Script>
      </div>
    </div>
  );
}
