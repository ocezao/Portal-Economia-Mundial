/**
 * AdSense script loader (consent-gated)
 * Loads Google AdSense only after the user grants advertising consent.
 */

'use client';

import Script from 'next/script';

import { useConsent } from '@/hooks/useConsent';

// Client ID do AdSense - pode vir de env ou usar o valor direto
const ADSENSE_CLIENT_ID = process.env.NEXT_PUBLIC_ADSENSE_CLIENT_ID || 'ca-pub-6096980902806551';

export function AdSenseScript() {
  const { isLoaded, canUseAdvertising } = useConsent();

  if (!ADSENSE_CLIENT_ID) return null;
  if (!isLoaded || !canUseAdvertising) return null;

  return (
    <Script
      id="adsense-script"
      src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${ADSENSE_CLIENT_ID}`}
      async
      strategy="afterInteractive"
      crossOrigin="anonymous"
      onLoad={() => {
        // Allow ad units to retry once the script is available.
        window.dispatchEvent(new Event('adsenseLoaded'));
      }}
    />
  );
}
