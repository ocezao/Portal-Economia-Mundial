'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useMemo, useState } from 'react';
import {
  LayoutDashboard,
  Newspaper,
  Calendar,
  Users,
  UserCog,
  Settings,
  Activity,
  FolderOpen,
  Menu,
  X,
  LogOut,
  ExternalLink,
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';

type NavItem = {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
};

function isActivePath(pathname: string, href: string) {
  if (href === '/admin/dashboard') return pathname === '/admin' || pathname.startsWith('/admin/dashboard');
  return pathname.startsWith(href);
}

export default function AdminShellClient({ children }: { children: React.ReactNode }) {
  const pathname = usePathname() || '/';
  const router = useRouter();
  const { logout } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);

  const items = useMemo<NavItem[]>(
    () => [
      { href: '/admin/dashboard', label: 'Dashboard', icon: LayoutDashboard },
      { href: '/admin/noticias', label: 'Noticias', icon: Newspaper },
      { href: '/admin/agendamentos', label: 'Agendamentos', icon: Calendar },
      { href: '/admin/usuarios', label: 'Usuarios', icon: UserCog },
      { href: '/admin/autores', label: 'Autores', icon: Users },
      { href: '/admin/arquivos', label: 'Arquivos', icon: FolderOpen },
      { href: '/admin/settings', label: 'Configuracoes', icon: Settings },
      { href: '/admin/diagnostico', label: 'Diagnostico', icon: Activity },
    ],
    []
  );

  const Sidebar = ({ mode }: { mode: 'desktop' | 'mobile' }) => (
    <aside
      className={
        mode === 'desktop'
          ? 'hidden lg:flex lg:w-72 lg:flex-col lg:border-r lg:border-[#e5e5e5] lg:bg-white'
          : 'w-72 max-w-[85vw] h-full bg-white border-r border-[#e5e5e5]'
      }
    >
      <header className="px-4 py-4 border-b border-[#e5e5e5]">
        <div className="flex items-center justify-between gap-2">
          <Link href="/admin/dashboard" className="flex items-center gap-2 min-w-0">
            <span className="w-9 h-9 rounded-lg bg-[#c40000] text-white flex items-center justify-center font-bold">
              CIN
            </span>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-[#111111] truncate">Painel Administrativo</p>
              <p className="text-xs text-[#6b6b6b] truncate">Cenario Internacional</p>
            </div>
          </Link>

          {mode === 'mobile' ? (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setMobileOpen(false)}
              aria-label="Fechar menu"
            >
              <X className="w-5 h-5" />
            </Button>
          ) : null}
        </div>
      </header>

      <nav className="p-2 flex-1 overflow-y-auto">
        {items.map((it) => {
          const active = isActivePath(pathname, it.href);
          const Icon = it.icon;
          return (
            <Link
              key={it.href}
              href={it.href}
              onClick={() => mode === 'mobile' && setMobileOpen(false)}
              className={[
                'flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors',
                active ? 'bg-[#fef2f2] text-[#c40000]' : 'text-[#111111] hover:bg-[#f4f4f5]',
              ].join(' ')}
            >
              <Icon className={active ? 'w-4 h-4' : 'w-4 h-4 text-[#6b6b6b]'} />
              <span className="truncate">{it.label}</span>
            </Link>
          );
        })}
      </nav>

      <footer className="p-3 border-t border-[#e5e5e5] space-y-2">
        <Button
          variant="outline"
          className="w-full justify-between"
          onClick={() => {
            if (mode === 'mobile') setMobileOpen(false);
            router.push('/');
          }}
        >
          <span>Ver site</span>
          <ExternalLink className="w-4 h-4" />
        </Button>

        <Button
          variant="outline"
          className="w-full justify-between text-[#ef4444]"
          onClick={async () => {
            await logout();
            if (mode === 'mobile') setMobileOpen(false);
          }}
        >
          <span>Sair</span>
          <LogOut className="w-4 h-4" />
        </Button>
      </footer>
    </aside>
  );

  return (
    <div className="min-h-screen bg-[#f6f7f8]">
      {/* Mobile topbar */}
      <header className="lg:hidden sticky top-0 z-40 bg-white border-b border-[#e5e5e5]">
        <div className="h-14 px-3 flex items-center justify-between">
          <Button variant="ghost" size="sm" onClick={() => setMobileOpen(true)} aria-label="Abrir menu">
            <Menu className="w-5 h-5" />
          </Button>
          <Link href="/admin/dashboard" className="text-sm font-semibold text-[#111111]">
            Admin CIN
          </Link>
          <div className="w-9" />
        </div>
      </header>

      {/* Mobile drawer */}
      {mobileOpen ? (
        <div className="lg:hidden fixed inset-0 z-50">
          <button
            type="button"
            aria-label="Fechar menu"
            className="absolute inset-0 bg-black/30"
            onClick={() => setMobileOpen(false)}
          />
          <div className="absolute left-0 top-0 h-full">
            <Sidebar mode="mobile" />
          </div>
        </div>
      ) : null}

      <div className="flex">
        <Sidebar mode="desktop" />
        <div className="flex-1 min-w-0">
          {/* Content */}
          <div className="px-3 sm:px-4 lg:px-8 py-4 lg:py-8">{children}</div>
        </div>
      </div>
    </div>
  );
}

