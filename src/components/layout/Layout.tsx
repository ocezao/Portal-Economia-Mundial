/**
 * Layout Principal da Aplicação
 * Envolve todas as páginas com Header, Ticker e Footer
 */

import { Outlet } from 'react-router-dom';
import { Header } from './Header';
import { MarketTicker } from './MarketTicker';
import { Footer } from './Footer';
import { APP_CONFIG } from '@/config/app';

export function Layout() {
  return (
    <>
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
        <Outlet />
      </main>

      {/* Footer */}
      <Footer />
    </>
  );
}
