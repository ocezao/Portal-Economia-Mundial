/**
 * Página de Cadastro - Next.js App Router
 * Registro de novos usuários
 * @migration Vite → Next.js (App Router)
 * @date 2026-02-06
 * @client-component necessário por hooks de navegação e estado
 */

'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Eye, EyeOff, Lock, Mail, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/hooks/useAuth';
import { ROUTES } from '@/config/routes';
import { toast } from 'sonner';

export default function RegisterPage() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { register } = useAuth();
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (password !== confirmPassword) {
      toast.error('As senhas não coincidem');
      return;
    }

    if (password.length < 6) {
      toast.error('A senha deve ter pelo menos 6 caracteres');
      return;
    }

    setIsLoading(true);

    const success = await register({ name, email, password });
    
    if (success) {
      toast.success('Cadastro realizado com sucesso!');
      router.push('/app');
    } else {
      toast.error('E-mail já cadastrado ou erro no registro');
    }
    
    setIsLoading(false);
  };

  return (
    <section className="min-h-screen flex items-center justify-center py-12 px-4">
      <article className="w-full max-w-md">
        {/* Header */}
        <header className="text-center mb-8">
          <h1 className="text-3xl font-black text-[#111111] mb-2">PEM</h1>
          <p className="text-[#6b6b6b]">Crie sua conta</p>
        </header>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          <fieldset>
            <Label htmlFor="name">Nome completo</Label>
            <section className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[#6b6b6b]" />
              <Input
                id="name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Seu nome"
                className="pl-10"
                required
              />
            </section>
          </fieldset>

          <fieldset>
            <Label htmlFor="email">E-mail</Label>
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
                minLength={6}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[#6b6b6b] hover:text-[#111111]"
              >
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </section>
          </fieldset>

          <fieldset>
            <Label htmlFor="confirmPassword">Confirmar senha</Label>
            <section className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[#6b6b6b]" />
              <Input
                id="confirmPassword"
                type={showPassword ? 'text' : 'password'}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="••••••••"
                className="pl-10"
                required
              />
            </section>
          </fieldset>

          <Button
            type="submit"
            className="w-full bg-[#c40000] hover:bg-[#a00000]"
            disabled={isLoading}
          >
            {isLoading ? 'Criando conta...' : 'Criar conta'}
          </Button>
        </form>

        {/* Links */}
        <footer className="mt-6 text-center text-sm text-[#6b6b6b]">
          <p>
            Já tem conta?{' '}
            <Link href={ROUTES.login} className="text-[#c40000] hover:underline">
              Entrar
            </Link>
          </p>
        </footer>
      </article>
    </section>
  );
}
