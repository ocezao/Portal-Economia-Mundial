'use client';

import { useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';

import { useAuth } from '@/hooks/useAuth';

type RequireAuthProps = {
  children: React.ReactNode;
  requireAdmin?: boolean;
};

export default function RequireAuth({ children, requireAdmin }: RequireAuthProps) {
  const { isAuthenticated, isAdmin, isLoading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (isLoading) return;

    // Not logged in: force login.
    if (!isAuthenticated) {
      const next = `${window.location.pathname}${window.location.search}`;
      const loginUrl = `/login?next=${encodeURIComponent(next)}`;
      router.replace(loginUrl);
      return;
    }

    // Logged in but not admin: block admin-only routes.
    if (requireAdmin && !isAdmin) {
      router.replace(`/`);
    }
  }, [isAuthenticated, isAdmin, isLoading, requireAdmin, router]);

  if (isLoading) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-white text-[#111111]">
        <p className="text-sm text-[#6b6b6b]">Carregando...</p>
      </main>
    );
  }

  if (!isAuthenticated) {
    // While redirecting.
    return (
      <main className="min-h-screen flex items-center justify-center bg-white text-[#111111]">
        <p className="text-sm text-[#6b6b6b]">Redirecionando para login...</p>
      </main>
    );
  }

  if (requireAdmin && !isAdmin) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-white text-[#111111]">
        <p className="text-sm text-[#6b6b6b]">Acesso negado.</p>
      </main>
    );
  }

  return <>{children}</>;
}
