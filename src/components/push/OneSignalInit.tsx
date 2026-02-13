'use client';

import Script from 'next/script';
import { useEffect, useState } from 'react';

const APP_ID = process.env.NEXT_PUBLIC_ONESIGNAL_APP_ID || '';

export function OneSignalInit() {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (!APP_ID || !ready) return;

    // OneSignal recomenda usar fila diferida para inicialização.
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (window as any).OneSignalDeferred = (window as any).OneSignalDeferred || [];
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (window as any).OneSignalDeferred.push(async function (OneSignal: any) {
      await OneSignal.init({
        appId: APP_ID,
        notifyButton: { enable: true },
        allowLocalhostAsSecureOrigin: true,
      });
    });
  }, [ready]);

  if (!APP_ID) return null;

  return (
    <Script
      id="onesignal-sdk"
      src="https://cdn.onesignal.com/sdks/web/v16/OneSignalSDK.page.js"
      strategy="afterInteractive"
      onLoad={() => setReady(true)}
    />
  );
}

