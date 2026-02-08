/**
 * Proxy de Autenticação - Next.js
 * Protege rotas /app/* e /admin/*
 * @date 2026-02-06
 */

import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Rotas que precisam de autenticação
const PROTECTED_ROUTES = [
  '/app',
  '/app/perfil',
  '/app/preferencias',
  '/app/configuracoes',
];

const ADMIN_ROUTES = [
  '/admin',
  '/admin/usuarios',
  '/admin/diagnostico',
  '/admin/noticias',
];

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Verificar se é uma rota protegida
  const isProtectedRoute = PROTECTED_ROUTES.some((route) =>
    pathname === route || pathname.startsWith(`${route}/`),
  );

  const isAdminRoute = ADMIN_ROUTES.some((route) =>
    pathname === route || pathname.startsWith(`${route}/`),
  );

  if (!isProtectedRoute && !isAdminRoute) {
    return NextResponse.next();
  }

  // Verificar token de autenticação no cookie ou localStorage (via cookie)
  // Nota: localStorage não está disponível no proxy, usamos cookies
  const sessionCookie = request.cookies.get('pem_session')?.value;

  if (!sessionCookie) {
    // Redirecionar para login se não estiver autenticado
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('redirect', pathname);
    return NextResponse.redirect(loginUrl);
  }

  try {
    const session = JSON.parse(sessionCookie);

    // Verificar se token está expirado
    if (session.expiresAt && new Date(session.expiresAt) < new Date()) {
      const loginUrl = new URL('/login', request.url);
      loginUrl.searchParams.set('redirect', pathname);
      return NextResponse.redirect(loginUrl);
    }

    // Verificar permissão de admin
    if (isAdminRoute && session.user?.role !== 'admin') {
      // Redirecionar para dashboard do usuário se não for admin
      return NextResponse.redirect(new URL('/app', request.url));
    }

    return NextResponse.next();
  } catch {
    // Cookie inválido, redirecionar para login
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('redirect', pathname);
    return NextResponse.redirect(loginUrl);
  }
}

export const config = {
  matcher: ['/app/:path*', '/admin/:path*'],
};

