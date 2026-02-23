/**
 * Página 404 - Página Não Encontrada
 * Com vídeo de animação em background
 */

import Link from 'next/link';
import { Home, Search } from 'lucide-react';
import { ROUTES } from '@/config/routes';

export default function NotFoundPage() {
  return (
    <div className="relative min-h-screen flex items-center justify-center overflow-hidden">
      {/* Video Background */}
      <video
        autoPlay
        loop
        muted
        playsInline
        className="absolute top-0 left-0 w-full h-full object-cover z-0"
      >
        <source src="/videos/404-globe.mp4" type="video/mp4" />
      </video>

      {/* Overlay */}
      <div className="absolute top-0 left-0 w-full h-full bg-black/60 z-10" />

      {/* Content */}
      <div className="relative z-20 text-center px-4 max-w-2xl mx-auto">
        {/* 404 Text */}
        <h1 className="text-8xl md:text-9xl font-bold text-white mb-2" style={{ fontFamily: 'var(--font-headline)' }}>
          404
        </h1>

        {/* Subtitle */}
        <h2 className="text-2xl md:text-3xl font-semibold text-white mb-4" style={{ fontFamily: 'var(--font-headline)' }}>
          Página Não Encontrada
        </h2>

        {/* Description */}
        <p className="text-lg text-gray-300 mb-8 max-w-md mx-auto">
          A página que você está procurando não existe ou foi movida.
          Que tal voltar para a página inicial ou buscar o que precisa?
        </p>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
          <Link 
            href={ROUTES.home}
            className="inline-flex items-center justify-center gap-2 bg-[#c40000] hover:bg-[#a00000] text-white rounded-full px-8 py-3 transition-colors font-medium"
          >
            <Home className="w-5 h-5" />
            Voltar ao Início
          </Link>

          <Link 
            href={ROUTES.busca}
            className="inline-flex items-center justify-center gap-2 border-2 border-white text-white hover:bg-white hover:text-[#111111] rounded-full px-8 py-3 transition-colors font-medium"
          >
            <Search className="w-5 h-5" />
            Buscar no Site
          </Link>
        </div>

        {/* Quick Links */}
        <div className="mt-12 pt-8 border-t border-white/20">
          <p className="text-sm text-gray-400 mb-4">Explore nossas sessões principais:</p>
          <div className="flex flex-wrap gap-3 justify-center">
            <Link href={ROUTES.home} className="text-sm px-4 py-2 bg-white/10 rounded-full text-white hover:bg-white/20 transition-colors">
              Home
            </Link>
            <Link href="/categoria/politica" className="text-sm px-4 py-2 bg-white/10 rounded-full text-white hover:bg-white/20 transition-colors">
              Política
            </Link>
            <Link href="/categoria/economia" className="text-sm px-4 py-2 bg-white/10 rounded-full text-white hover:bg-white/20 transition-colors">
              Economia
            </Link>
            <Link href="/categoria/tecnologia" className="text-sm px-4 py-2 bg-white/10 rounded-full text-white hover:bg-white/20 transition-colors">
              Tecnologia
            </Link>
            <Link href="/categoria/geopolitica" className="text-sm px-4 py-2 bg-white/10 rounded-full text-white hover:bg-white/20 transition-colors">
              Geopolítica
            </Link>
          </div>
        </div>
      </div>

      {/* Footer watermark */}
      <div className="absolute bottom-4 left-0 right-0 text-center z-20">
        <p className="text-xs text-white/40">
          Cenário Internacional • Notícias que movem o mundo
        </p>
      </div>
    </div>
  );
}
