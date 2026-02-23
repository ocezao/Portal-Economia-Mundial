'use client';

import { useInsertionEffect } from 'react';

const APP_ID = process.env.NEXT_PUBLIC_ONESIGNAL_APP_ID || '';

export function OneSignalHeadScript() {
  useInsertionEffect(() => {
    if (!APP_ID) return;

    const script = document.createElement('script');
    script.src = 'https://cdn.onesignal.com/sdks/web/v16/OneSignalSDK.page.js';
    script.defer = true;
    script.async = true;
    document.head.appendChild(script);

    const initScript = document.createElement('script');
    initScript.textContent = `
      window.OneSignalDeferred = window.OneSignalDeferred || [];
      OneSignalDeferred.push(async function(OneSignal) {
        await OneSignal.init({
          appId: "${APP_ID}",
        });
      });
    `;
    document.head.appendChild(initScript);
  }, []);

  return null;
}
