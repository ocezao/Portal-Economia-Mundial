/**
 * Public site layout (server component).
 *
 * Why:
 * - The previous public chrome was gated behind client hydration, which hurt SEO and CWV
 *   (header/ticker/footer were missing from initial HTML and could introduce CLS).
 * - Route groups let us keep URLs intact while isolating /admin and /app layouts.
 */

import { APP_CONFIG } from '@/config/app';
import { Header } from '@/components/layout/Header';
import { MarketTicker } from '@/components/layout/MarketTicker';
import { Footer } from '@/components/layout/Footer';
import { AdUnit } from '@/components/ads/AdUnit';
import { CookieBanner } from '@/components/consent/CookieBanner';
import { AdSenseScript } from '@/components/ads/AdSenseScript';
import { ServiceWorkerRegistration } from '@/components/pwa/ServiceWorkerRegistration';
import { OneSignalInit } from '@/components/push/OneSignalInit';

const ADSENSE_SLOT_LAYOUT_FOOTER =
  process.env.NEXT_PUBLIC_ADSENSE_SLOT_LAYOUT_FOOTER || process.env.NEXT_PUBLIC_ADSENSE_SLOT_INARTICLE;

export default function SiteLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <ServiceWorkerRegistration />
      <OneSignalInit />
      <AdSenseScript />

      {/* Skip Link para acessibilidade */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-[700] focus:bg-[#c40000] focus:text-white focus:px-4 focus:py-2 focus:rounded"
      >
        Pular para o conteudo
      </a>

      {/* Ticker de Mercado */}
      {APP_CONFIG.features.enableMarketTicker && <MarketTicker />}

      <Header />

      <main id="main-content" className="flex-1 min-h-screen">
        {children}
      </main>

      {/* Publicidade global (abaixo do conteudo) */}
      <aside className="border-t border-[#e5e5e5] bg-[#fafafa]" aria-label="Publicidade">
        <div className="max-w-[1280px] mx-auto px-4 py-10">
          <AdUnit slot={ADSENSE_SLOT_LAYOUT_FOOTER} format="auto" className="mx-auto" />
        </div>
      </aside>

      <Footer />

      <CookieBanner />
    </>
  );
}

