/**
 * Layout Principal da Aplicação
 * Envolve todas as páginas com Header, Ticker e Footer
 */

'use client';

import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';

import { Header } from './Header';
import { MarketTicker } from './MarketTicker';
import { Footer } from './Footer';
import { APP_CONFIG } from '@/config/app';
import { AdUnit } from '@/components/ads/AdUnit';

const ADSENSE_SLOT_LAYOUT_FOOTER = process.env.NEXT_PUBLIC_ADSENSE_SLOT_INARTICLE;

export function Layout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);
  // `usePathname()` can be unreliable during/after hydration in some setups.
  // After mount, prefer the real browser URL to decide if we're in /admin or /app.
  const safePath = pathname ?? '';
  const pathForRouting = mounted ? window.location.pathname : safePath;
  const segments = pathForRouting.split('/').filter(Boolean);
  const isAdmin = segments[0] === 'admin';
  const isApp = segments[0] === 'app';
  const showAds = !isAdmin && !isApp;

  // Prevent hydration mismatches by rendering only route content on the server/first paint.
  // After mount, we can safely add the public chrome (header/ticker/footer) for non-admin routes.
  if (!mounted) return <>{children}</>;

  // Admin has its own shell/layout (sidebar, topbar, etc.).
  // Avoid rendering the public site chrome (ticker/header/footer) around it.
  if (isAdmin) return <>{children}</>;

  return (
    <>
      {/* Skip Link para acessibilidade */}
      <a 
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-[700] focus:bg-[#c40000] focus:text-white focus:px-4 focus:py-2 focus:rounded"
      >
        Pular para o conteudo
      </a>

      {/* Ticker de Mercado */}
      {APP_CONFIG.features.enableMarketTicker && <MarketTicker />}

      {/* Header */}
      <Header />

      {/* Conteúdo Principal */}
      <main id="main-content" className="flex-1 min-h-screen">
        {children}
      </main>

      {/* Publicidade global (abaixo do conteúdo) */}
      {showAds && (
        <aside className="border-t border-[#e5e5e5] bg-[#fafafa]" aria-label="Publicidade">
          <div className="max-w-[1280px] mx-auto px-4 py-10">
            <AdUnit slot={ADSENSE_SLOT_LAYOUT_FOOTER} format="auto" className="mx-auto" />
          </div>
        </aside>
      )}

      {/* Footer */}
      <Footer />
    </>
  );
}
