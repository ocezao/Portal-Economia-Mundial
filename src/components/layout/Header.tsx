/**
 * Header Principal - Navegação e Brand
 * Menu editorial distribuído igualmente
 */

'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Menu, X, Search, User, UserCircle } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { APP_CONFIG } from '@/config/app';
import { ROUTES } from '@/config/routes';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';

// Itens do menu principal
const MENU_ITEMS = [
  { label: 'Home', path: ROUTES.home },
  { label: 'Em Alta', path: '/em-alta' },
  { label: 'Destaque', path: '/destaque' },
  { label: 'Todas as Categorias', path: '/categorias' },
  { label: 'Sobre Nós', path: ROUTES.sobre },
  { label: 'Contato', path: ROUTES.faleConosco },
];

export function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const { isAuthenticated, user } = useAuth();
  const pathname = usePathname();
  const router = useRouter();

  const isActive = (path: string) => pathname === path;

  useEffect(() => {
    // Evita `useSearchParams()` no layout (SSG exige Suspense). Leitura client-side.
    if (typeof window === 'undefined') return;
    const params = new URLSearchParams(window.location.search);
    setSearchQuery(params.get('q') ?? '');
  }, [pathname]);

  return (
    <header className="sticky top-0 z-[200] bg-white/95 backdrop-blur border-b border-[#e6e1d8]">
      {/* Container principal com largura máxima */}
      <nav className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8">
        {/* Linha principal: Logo | Menu | Ações */}
        <div className="flex items-center justify-between min-h-[72px]">
          
          {/* Logo - próximo do canto esquerdo */}
          <Link
            href={ROUTES.home}
            className="flex-shrink-0 flex items-end gap-2 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#c40000] focus-visible:ring-offset-2 tap-feedback"
            aria-label={`${APP_CONFIG.brand.name} - Página inicial`}
          >
            <span className="text-2xl sm:text-3xl font-black text-[#111111] tracking-tight font-headline">
              {APP_CONFIG.brand.short}
            </span>
          </Link>

          {/* Menu Desktop - distribuído igualmente no centro */}
          <ul className="hidden lg:flex items-center justify-center flex-1 mx-8">
            <div className="flex items-center justify-between w-full max-w-4xl">
              {MENU_ITEMS.map((item) => {
                const active = isActive(item.path);
                return (
                  <li key={item.path}>
                    <Link
                      href={item.path}
                      className={`flex items-center px-2 py-2 text-[15px] font-normal border-b-2 transition-all duration-200 tap-feedback whitespace-nowrap ${
                        active
                          ? 'text-[#c40000] border-[#c40000]'
                          : 'text-[#111111] border-transparent hover:border-[#111111]'
                      }`}
                    >
                      {item.label}
                    </Link>
                  </li>
                );
              })}
            </div>
          </ul>

          {/* Ações - próximo do canto direito */}
          <section className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
            {/* Botão Busca */}
            <button
              onClick={() => setIsSearchOpen(!isSearchOpen)}
              className="p-2.5 rounded-full border border-[#e6e1d8] hover:border-[#111111] hover:bg-[#f6f3ef] transition-colors tap-feedback"
              aria-label="Abrir busca"
              aria-expanded={isSearchOpen}
            >
              <Search className="w-5 h-5 text-[#111111]" />
            </button>

            {/* Usuário autenticado ou botões de User */}
            {isAuthenticated ? (
              user?.role === 'admin' ? (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button className="flex items-center gap-2 px-3 py-2 rounded-full border border-[#e6e1d8] hover:border-[#111111] hover:bg-[#f6f3ef] transition-colors tap-feedback">
                      <span className="hidden md:block text-sm font-normal text-[#111111] max-w-[90px] truncate">
                        {user?.name.split(' ')[0]}
                      </span>
                      <User className="w-5 h-5 text-[#c40000]" />
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-56">
                    <DropdownMenuItem asChild>
                      <Link href="/admin" className="cursor-pointer">
                        Dashboard Admin
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem asChild>
                      <Link href="/app" className="cursor-pointer">
                        Área do Usuário
                      </Link>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              ) : (
                <Link
                  href={ROUTES.app.root}
                  className="flex items-center gap-2 px-3 py-2 rounded-full border border-[#e6e1d8] hover:border-[#111111] hover:bg-[#f6f3ef] transition-colors tap-feedback"
                  aria-label="Área do usuário"
                >
                  <span className="hidden md:block text-sm font-normal text-[#111111] max-w-[90px] truncate">
                    {user?.name.split(' ')[0]}
                  </span>
                  <User className="w-5 h-5 text-[#111111]" />
                </Link>
              )
            ) : (
              <>
                {/* User icon: only on extra-small screens (mobile). */}
                <Link
                  href={ROUTES.login}
                  className="sm:hidden p-2.5 rounded-full border border-[#e6e1d8] hover:border-[#111111] hover:bg-[#f6f3ef] transition-colors tap-feedback"
                  aria-label="Entrar"
                >
                  <UserCircle className="w-5 h-5 text-[#111111]" />
                </Link>

                <Button
                  asChild
                  variant="outline"
                  size="sm"
                  className="hidden sm:inline-flex border-[#111111] text-[#111111] hover:bg-[#111111] hover:text-white rounded-full"
                >
                  <Link href={ROUTES.login}>Entrar</Link>
                </Button>
                <Button
                  asChild
                  size="sm"
                  className="hidden md:inline-flex bg-[#c40000] hover:bg-[#a00000] text-white rounded-full"
                >
                  <Link href="/cadastro">Cadastrar</Link>
                </Button>
              </>
            )}

            {/* Menu Mobile Toggle */}
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="lg:hidden p-2.5 rounded-full border border-[#e6e1d8] hover:border-[#111111] hover:bg-[#f6f3ef] transition-colors tap-feedback"
              aria-label={isMenuOpen ? 'Fechar menu' : 'Abrir menu'}
              aria-expanded={isMenuOpen}
              aria-controls="mobile-menu"
            >
              {isMenuOpen ? <X className="w-5 h-5 text-[#111111]" /> : <Menu className="w-5 h-5 text-[#111111]" />}
            </button>
          </section>
        </div>
      </nav>

      {/* Barra de Busca */}
      {isSearchOpen && (
        <section className="border-t border-[#e6e1d8] bg-[#f6f3ef] px-4 py-4">
          <form
            className="max-w-[1280px] mx-auto flex gap-2"
            onSubmit={(e) => {
              e.preventDefault();
              const q = searchQuery.trim();
              router.push(q ? `${ROUTES.busca}?q=${encodeURIComponent(q)}` : ROUTES.busca);
              setIsSearchOpen(false);
            }}
          >
            <input
              type="search"
              placeholder="Buscar notícias..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="flex-1 min-h-[48px] px-4 py-2 border border-[#e6e1d8] rounded-full text-base focus:outline-none focus:ring-2 focus:ring-[#c40000] focus:border-transparent"
              aria-label="Campo de busca"
            />
            <Button type="submit" className="bg-[#111111] hover:bg-[#000000] min-h-[48px] rounded-full px-6">
              Buscar
            </Button>
          </form>
        </section>
      )}

      {/* Menu Mobile */}
      {isMenuOpen && (
        <section
          id="mobile-menu"
          className="lg:hidden border-t border-[#e6e1d8] bg-white max-h-[70vh] overflow-y-auto"
          role="navigation"
          aria-label="Menu principal"
        >
          <ul className="px-4 py-4 space-y-1">
            <li className="px-3 pt-1 pb-2 text-xs uppercase tracking-[0.28em] text-[#6b6b6b]">
              Navegação
            </li>
            
            {MENU_ITEMS.map((item) => (
              <li key={item.path}>
                <Link
                  href={item.path}
                  onClick={() => setIsMenuOpen(false)}
                  aria-current={isActive(item.path) ? 'page' : undefined}
                  className={`block py-3.5 px-3 rounded-xl text-lg font-normal tap-feedback ${
                    isActive(item.path)
                      ? 'text-[#c40000] bg-[#fff5f5]'
                      : 'text-[#111111] hover:bg-[#f6f3ef]'
                  }`}
                >
                  {item.label}
                </Link>
              </li>
            ))}

            {!isAuthenticated && (
              <>
                <li className="border-t border-[#e6e1d8] my-2" />
                <li>
                  <Link
                    href={ROUTES.login}
                    onClick={() => setIsMenuOpen(false)}
                    className="block py-3.5 px-3 rounded-xl text-base font-normal text-[#111111] hover:bg-[#f6f3ef] tap-feedback"
                  >
                    Entrar
                  </Link>
                </li>
                <li>
                  <Link
                    href="/cadastro"
                    onClick={() => setIsMenuOpen(false)}
                    className="block py-3.5 px-3 rounded-xl text-base font-normal text-[#c40000] hover:bg-[#fff5f5] tap-feedback"
                  >
                    Cadastrar
                  </Link>
                </li>
              </>
            )}
          </ul>
        </section>
      )}
    </header>
  );
}
