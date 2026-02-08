/**
 * Layout Principal da Aplicação
 * Envolve todas as páginas com Header, Ticker e Footer
 */

'use client';

import { usePathname } from 'next/navigation';

import { Header } from './Header';
import { MarketTicker } from './MarketTicker';
import { Footer } from './Footer';
import { ScrollProgress } from './ScrollProgress';
import { APP_CONFIG } from '@/config/app';
import { AdUnit } from '@/components/ads/AdUnit';

const ADSENSE_SLOT_LAYOUT_FOOTER = process.env.NEXT_PUBLIC_ADSENSE_SLOT_LAYOUT_FOOTER;

export function Layout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const showAds = !pathname.startsWith('/admin') && !pathname.startsWith('/app');

  return (
    <>
      {/* Barra de Progresso de Rolagem */}
      <ScrollProgress />

      {/* Skip Link para acessibilidade */}
      <a 
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-[700] focus:bg-[#c40000] focus:text-white focus:px-4 focus:py-2 focus:rounded"
      >
        Pular para o conteúdo principal
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
