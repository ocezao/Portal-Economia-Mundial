/**
 * Página de Login - Next.js App Router
 * Autenticação de usuários
 * @migration Vite → Next.js (App Router)
 * @date 2026-02-06
 * @client-component necessário por hooks de navegação e estado
 */

'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Eye, EyeOff, Lock, Mail } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/hooks/useAuth';
import { ROUTES } from '@/config/routes';
import { toast } from 'sonner';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { login, isAuthenticated, isAdmin, isLoading: isAuthLoading } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    if (isAuthLoading) return;
    if (!isAuthenticated) return;

    const next = searchParams.get('next') ?? searchParams.get('redirect');
    const isSafeNext = typeof next === 'string' && next.startsWith('/') && !next.startsWith('//') && !next.includes('://');
    router.replace(isSafeNext ? next : isAdmin ? '/admin' : '/app');
  }, [isAuthenticated, isAdmin, isAuthLoading, router, searchParams]);
  
  const handleForgotPassword = () => {
    toast.info('Recuperacao de senha em breve.');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    const result = await login({ email, password });

    if (result.ok) {
      toast.success('Sucesso');
      // O redirecionamento ?? feito pelo useEffect baseado em isAuthenticated/isAdmin
    } else {
      toast.error(result.error.message);
    }
    
    setIsLoading(false);
  };

  return (
    <section className="min-h-screen flex items-center justify-center py-12 px-4">
      <article className="w-full max-w-md">
        {/* Header */}
        <header className="text-center mb-8">
          <h1 className="text-3xl font-black text-[#111111] mb-2">CIN</h1>
          <p className="text-[#6b6b6b]">Acesse sua conta</p>
        </header>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          <fieldset>
            <Label htmlFor="email">Email</Label>
            <section className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[#6b6b6b]" />
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="seu@email.com"
                className="pl-10"
                required
              />
            </section>
          </fieldset>

          <fieldset>
            <Label htmlFor="password">Senha</Label>
            <section className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[#6b6b6b]" />
              <Input
                id="password"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="pl-10 pr-10"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[#6b6b6b] hover:text-[#111111]"
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </section>
          </fieldset>

          <Button
            type="submit"
            className="w-full bg-[#c40000] hover:bg-[#a00000]"
            disabled={isLoading}
          >
            {isLoading ? 'Carregando...' : 'Entrar'}
          </Button>
        </form>

        {/* Links */}
        <footer className="mt-6 text-center text-sm text-[#6b6b6b]">
          <p>
            <button
              type="button"
              onClick={handleForgotPassword}
              className="text-[#c40000] hover:underline"
            >
              Esqueci minha senha
            </button>
          </p>
          <p className="mt-2">
            Nao tem conta?{' '}
            <Link href={ROUTES.register} className="text-[#c40000] hover:underline">
              Cadastre-se
            </Link>
          </p>
        </footer>
      </article>
    </section>
  );
}
