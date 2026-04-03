/**
 * AdSense script loader
 * Loads Google AdSense script in <head> for all users
 * Ads are only displayed after user grants advertising consent (LGPD compliant)
 */

'use client';

import Script from 'next/script';

import { useConsent } from '@/hooks/useConsent';
import { useEffect } from 'react';
import { logger } from '@/lib/logger';

// Client ID do AdSense - pode vir de env ou usar o valor direto
const ADSENSE_CLIENT_ID = process.env.NEXT_PUBLIC_ADSENSE_CLIENT_ID || 'ca-pub-6096980902806551';

export function AdSenseScript() {
  const { isLoaded, canUseAdvertising } = useConsent();

  // Only load script if we have a client ID
  if (!ADSENSE_CLIENT_ID) return null;

  return (
    <>
      <Script
        id="adsense-script"
        src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${ADSENSE_CLIENT_ID}`}
        async
        strategy="afterInteractive"
        crossOrigin="anonymous"
      />
      <AdSenseInitializer />
    </>
  );
}

/**
 * Separate component to handle consent-based ad initialization
 * This runs after the script is loaded and checks consent
 */
function AdSenseInitializer() {
  const { isLoaded, canUseAdvertising } = useConsent();

  useEffect(() => {
    if (!isLoaded) return;
    
    // Only initialize ads if user has given consent
    if (canUseAdvertising) {
      try {
        const w = window as typeof window & { adsbygoogle?: { push: (arg: object) => void } };
        if (w.adsbygoogle) {
          w.adsbygoogle.push({});
        }
        // Dispatch event to notify ad units that they can retry
        window.dispatchEvent(new Event('adsenseLoaded'));
      } catch (e) {
        logger.error('AdSense init error:', e);
      }
    }
  }, [isLoaded, canUseAdvertising]);

  return null;
}
