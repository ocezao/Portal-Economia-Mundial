/**
 * PÃ¡gina de Login
 * AutenticaÃ§Ã£o mock para demonstraÃ§Ã£o
 */

import { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Eye, EyeOff, Lock, Mail } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/hooks/useAuth';
import { ROUTES } from '@/config/routes';
import { toast } from 'sonner';

export function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { login, isAuthenticated, isAdmin, isLoading: isAuthLoading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (isAuthLoading) return;
    if (!isAuthenticated) return;
    navigate(isAdmin ? '/admin' : '/app', { replace: true });
  }, [isAuthenticated, isAdmin, isAuthLoading, navigate]);
  
  const handleForgotPassword = () => {
    toast.info('Recuperação de senha em breve.');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    const success = await login({ email, password });
    
    if (success) {
      toast.success('Login realizado com sucesso!');
      // Verificar o role do usuÃ¡rio recÃ©m-logado
      const storedSession = localStorage.getItem('pem_session');
      if (storedSession) {
        const session = JSON.parse(storedSession);
        if (session.user?.role === 'admin') {
          navigate('/admin');
        } else {
          navigate('/app');
        }
      } else {
        navigate('/app');
      }
    } else {
      toast.error('E-mail ou senha incorretos');
    }
    
    setIsLoading(false);
  };

  return (
    <>
      <title>Entrar - Portal Econômico Mundial</title>
      
      <section className="min-h-screen flex items-center justify-center py-12 px-4">
        <article className="w-full max-w-md">
          {/* Header */}
          <header className="text-center mb-8">
            <h1 className="text-3xl font-black text-[#111111] mb-2">PEM</h1>
            <p className="text-[#6b6b6b]">Entre na sua conta</p>
          </header>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
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
                  placeholder="â€¢â€¢â€¢â€¢â€¢â€¢â€¢â€¢"
                  className="pl-10 pr-10"
                  required
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

            <Button
              type="submit"
              className="w-full bg-[#c40000] hover:bg-[#a00000]"
              disabled={isLoading}
            >
              {isLoading ? 'Entrando...' : 'Entrar'}
            </Button>
          </form>

          {/* Demo Credentials */}
          <aside className="mt-8 p-4 bg-[#f5f5f5] rounded-lg text-sm">
            <p className="font-medium text-[#111111] mb-2">Credenciais de demonstração:</p>
            <ul className="space-y-1 text-[#6b6b6b]">
              <li><strong>Usuário:</strong> usuario@exemplo.com / senha123</li>
              <li><strong>Admin:</strong> admin@pem.com / admin123</li>
            </ul>
          </aside>

          {/* Links */}
          <footer className="mt-6 text-center text-sm text-[#6b6b6b]">
            <p>
              <button
                type="button"
                onClick={handleForgotPassword}
                className="text-[#c40000] hover:underline"
              >
                Esqueceu a senha?
              </button>
            </p>
            <p className="mt-2">
              Não tem conta?{' '}
              <Link to={ROUTES.register} className="text-[#c40000] hover:underline">
                Cadastre-se
              </Link>
            </p>
          </footer>
        </article>
      </section>
    </>
  );
}
