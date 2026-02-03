/**
 * Header Principal - Navegação e Brand
 * Menu expandido com subcategorias
 */

import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Menu, X, Search, User, ChevronDown, Home } from 'lucide-react';
import { APP_CONFIG } from '@/config/app';
import { ROUTES, CATEGORIES, SUBCATEGORIES } from '@/config/routes';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';

export function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [expandedCategory, setExpandedCategory] = useState<string | null>(null);
  const { isAuthenticated, user } = useAuth();
  const location = useLocation();

  const isActive = (path: string) => location.pathname === path;
  const isCategoryActive = (slug: string) => location.pathname.startsWith(`/categoria/${slug}`);

  return (
    <header className="sticky top-0 z-[200] bg-white border-b border-[#e5e5e5]">
      <nav className="max-w-[1280px] mx-auto px-4 h-14 sm:h-16 flex items-center justify-between">
        {/* Logo */}
        <Link 
          to={ROUTES.home} 
          className="flex items-center gap-2 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#c40000] focus-visible:ring-offset-2 tap-feedback"
          aria-label={`${APP_CONFIG.brand.name} - Página inicial`}
        >
          <span className="text-xl sm:text-2xl font-black text-[#111111] tracking-tight">
            {APP_CONFIG.brand.short}
          </span>
          <span className="hidden lg:block text-sm font-medium text-[#6b6b6b]">
            {APP_CONFIG.brand.name}
          </span>
        </Link>

        {/* Navegação Desktop */}
        <ul className="hidden lg:flex items-center gap-1">
          {/* Home */}
          <li>
            <Link
              to={ROUTES.home}
              className={`flex items-center gap-1 px-3 py-2 text-sm font-medium rounded-md transition-colors tap-feedback ${
                isActive(ROUTES.home) 
                  ? 'text-[#c40000] bg-[#fef2f2]' 
                  : 'text-[#111111] hover:text-[#c40000] hover:bg-[#f5f5f5]'
              }`}
            >
              <Home className="w-4 h-4" />
              <span className="hidden xl:inline">Início</span>
            </Link>
          </li>

          {/* Categorias com submenu */}
          {CATEGORIES.map(cat => {
            const subcats = SUBCATEGORIES[cat.slug as keyof typeof SUBCATEGORIES];
            const hasSubmenu = subcats && subcats.length > 0;
            const isExpanded = expandedCategory === cat.slug;

            return (
              <li key={cat.slug} className="relative">
                {hasSubmenu ? (
                  <details 
                    className="group"
                    open={isExpanded}
                    onToggle={(e) => setExpandedCategory(
                      (e.target as HTMLDetailsElement).open ? cat.slug : null
                    )}
                  >
                    <summary 
                      className={`flex items-center gap-1 px-3 py-2 text-sm font-medium rounded-md cursor-pointer list-none transition-colors tap-feedback ${
                        isCategoryActive(cat.slug)
                          ? 'text-[#c40000] bg-[#fef2f2]'
                          : 'text-[#111111] hover:text-[#c40000] hover:bg-[#f5f5f5]'
                      }`}
                    >
                      {cat.name}
                      <ChevronDown className={`w-4 h-4 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                    </summary>
                    <ul className="absolute top-full left-0 mt-1 w-48 bg-white border border-[#e5e5e5] rounded-lg shadow-lg py-2 z-50">
                      <li>
                        <Link
                          to={ROUTES.categoria(cat.slug)}
                          className="block px-4 py-2 text-sm text-[#111111] hover:bg-[#f5f5f5] hover:text-[#c40000]"
                        >
                          Todas em {cat.name}
                        </Link>
                      </li>
                      <li className="border-t border-[#e5e5e5] my-1" />
                      {subcats.map(sub => (
                        <li key={sub.slug}>
                          <Link
                            to={ROUTES.categoria(sub.slug)}
                            className="block px-4 py-2 text-sm text-[#6b6b6b] hover:bg-[#f5f5f5] hover:text-[#c40000]"
                          >
                            {sub.name}
                          </Link>
                        </li>
                      ))}
                    </ul>
                  </details>
                ) : (
                  <Link
                    to={ROUTES.categoria(cat.slug)}
                    className={`flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors tap-feedback ${
                      isCategoryActive(cat.slug)
                        ? 'text-[#c40000] bg-[#fef2f2]'
                        : 'text-[#111111] hover:text-[#c40000] hover:bg-[#f5f5f5]'
                    }`}
                  >
                    {cat.name}
                  </Link>
                )}
              </li>
            );
          })}
        </ul>

        {/* Ações */}
        <section className="flex items-center gap-1 sm:gap-2">
          {/* Busca */}
          <button
            onClick={() => setIsSearchOpen(!isSearchOpen)}
            className="p-2 sm:p-2.5 rounded-md hover:bg-[#f5f5f5] transition-colors tap-feedback"
            aria-label="Abrir busca"
            aria-expanded={isSearchOpen}
          >
            <Search className="w-5 h-5 text-[#111111]" />
          </button>

          {/* Usuário */}
          {isAuthenticated ? (
            <Link
              to={user?.role === 'admin' ? '/admin' : ROUTES.app.root}
              className="flex items-center gap-2 px-2 sm:px-3 py-2 rounded-md hover:bg-[#f5f5f5] transition-colors tap-feedback"
              aria-label={user?.role === 'admin' ? 'Painel administrativo' : 'Área do usuário'}
            >
              <span className="hidden md:block text-sm font-medium text-[#111111] max-w-[80px] truncate">
                {user?.name.split(' ')[0]}
              </span>
              <User className={`w-5 h-5 ${user?.role === 'admin' ? 'text-[#c40000]' : 'text-[#111111]'}`} />
              {user?.role === 'admin' && (
                <span className="hidden lg:block text-xs bg-[#c40000] text-white px-1.5 py-0.5 rounded">Admin</span>
              )}
            </Link>
          ) : (
            <>
              <Link to={ROUTES.login} className="hidden sm:block">
                <Button 
                  variant="outline" 
                  size="sm"
                  className="border-[#111111] text-[#111111] hover:bg-[#111111] hover:text-white"
                >
                  Entrar
                </Button>
              </Link>
              <Link to="/cadastro" className="hidden md:block">
                <Button 
                  size="sm"
                  className="bg-[#c40000] hover:bg-[#a00000] text-white"
                >
                  Cadastrar
                </Button>
              </Link>
            </>
          )}

          {/* Menu Mobile */}
          <button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="lg:hidden p-2 sm:p-2.5 rounded-md hover:bg-[#f5f5f5] transition-colors tap-feedback"
            aria-label={isMenuOpen ? 'Fechar menu' : 'Abrir menu'}
            aria-expanded={isMenuOpen}
          >
            {isMenuOpen ? (
              <X className="w-5 h-5 text-[#111111]" />
            ) : (
              <Menu className="w-5 h-5 text-[#111111]" />
            )}
          </button>
        </section>
      </nav>

      {/* Barra de Busca */}
      {isSearchOpen && (
        <section className="border-t border-[#e5e5e5] bg-[#f5f5f5] px-4 py-3">
          <form className="max-w-[1280px] mx-auto flex gap-2" onSubmit={(e) => e.preventDefault()}>
            <input
              type="search"
              placeholder="Buscar notícias..."
              className="flex-1 min-h-[44px] px-4 py-2 border border-[#e5e5e5] rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-[#c40000] focus:border-transparent"
              aria-label="Campo de busca"
            />
            <Button type="submit" className="bg-[#111111] hover:bg-[#000000] min-h-[44px]">
              Buscar
            </Button>
          </form>
        </section>
      )}

      {/* Menu Mobile */}
      {isMenuOpen && (
        <section className="lg:hidden border-t border-[#e5e5e5] bg-white max-h-[70vh] overflow-y-auto">
          <ul className="px-4 py-4 space-y-1">
            {/* Home */}
            <li>
              <Link
                to={ROUTES.home}
                onClick={() => setIsMenuOpen(false)}
                className={`flex items-center gap-2 py-3 px-3 rounded-lg text-base font-medium tap-feedback ${
                  isActive(ROUTES.home)
                    ? 'text-[#c40000] bg-[#fef2f2]'
                    : 'text-[#111111] hover:bg-[#f5f5f5]'
                }`}
              >
                <Home className="w-5 h-5" />
                Início
              </Link>
            </li>

            {/* Categorias */}
            {CATEGORIES.map(cat => {
              const subcats = SUBCATEGORIES[cat.slug as keyof typeof SUBCATEGORIES];
              const hasSubmenu = subcats && subcats.length > 0;

              return (
                <li key={cat.slug}>
                  {hasSubmenu ? (
                    <details className="group">
                      <summary className="flex items-center justify-between py-3 px-3 rounded-lg text-base font-medium text-[#111111] hover:bg-[#f5f5f5] cursor-pointer list-none tap-feedback">
                        {cat.name}
                        <ChevronDown className="w-5 h-5 transition-transform group-open:rotate-180" />
                      </summary>
                      <ul className="pl-4 mt-1 space-y-1">
                        <li>
                          <Link
                            to={ROUTES.categoria(cat.slug)}
                            onClick={() => setIsMenuOpen(false)}
                            className="block py-2 px-3 text-sm text-[#111111] hover:text-[#c40000]"
                          >
                            Todas em {cat.name}
                          </Link>
                        </li>
                        {subcats.map(sub => (
                          <li key={sub.slug}>
                            <Link
                              to={ROUTES.categoria(sub.slug)}
                              onClick={() => setIsMenuOpen(false)}
                              className="block py-2 px-3 text-sm text-[#6b6b6b] hover:text-[#c40000]"
                            >
                              {sub.name}
                            </Link>
                          </li>
                        ))}
                      </ul>
                    </details>
                  ) : (
                    <Link
                      to={ROUTES.categoria(cat.slug)}
                      onClick={() => setIsMenuOpen(false)}
                      className={`block py-3 px-3 rounded-lg text-base font-medium tap-feedback ${
                        isCategoryActive(cat.slug)
                          ? 'text-[#c40000] bg-[#fef2f2]'
                          : 'text-[#111111] hover:bg-[#f5f5f5]'
                      }`}
                    >
                      {cat.name}
                    </Link>
                  )}
                </li>
              );
            })}

            <li className="border-t border-[#e5e5e5] my-2" />

            <li>
              <Link
                to={ROUTES.sobre}
                onClick={() => setIsMenuOpen(false)}
                className="block py-3 px-3 rounded-lg text-base font-medium text-[#6b6b6b] hover:bg-[#f5f5f5] tap-feedback"
              >
                Sobre
              </Link>
            </li>

            {!isAuthenticated && (
              <>
                <li>
                  <Link
                    to={ROUTES.login}
                    onClick={() => setIsMenuOpen(false)}
                    className="block py-3 px-3 rounded-lg text-base font-medium text-[#111111] hover:bg-[#f5f5f5] tap-feedback"
                  >
                    Entrar
                  </Link>
                </li>
                <li>
                  <Link
                    to="/cadastro"
                    onClick={() => setIsMenuOpen(false)}
                    className="block py-3 px-3 rounded-lg text-base font-medium text-[#c40000] hover:bg-[#fef2f2] tap-feedback"
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
