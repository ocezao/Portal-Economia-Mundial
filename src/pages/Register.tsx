/**
 * Página de Cadastro
 * Registro de novos usuários (mock)
 */

import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Eye, EyeOff, Lock, Mail, User, AlertCircle, CheckCircle, Info } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { useAuth } from '@/hooks/useAuth';
import { ROUTES } from '@/config/routes';
import { toast } from 'sonner';

interface FormData {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
  acceptTerms: boolean;
}

interface FormErrors {
  name?: string;
  email?: string;
  password?: string;
  confirmPassword?: string;
  acceptTerms?: string;
}

export function Register() {
  const navigate = useNavigate();
  const { register, error } = useAuth();
  const [formData, setFormData] = useState<FormData>({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    acceptTerms: false,
  });
  const [errors, setErrors] = useState<FormErrors>({});
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    // Nome
    if (!formData.name.trim()) {
      newErrors.name = 'Nome é obrigatório';
    } else if (formData.name.trim().length < 3) {
      newErrors.name = 'Nome deve ter pelo menos 3 caracteres';
    }

    // Email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!formData.email.trim()) {
      newErrors.email = 'E-mail é obrigatório';
    } else if (!emailRegex.test(formData.email)) {
      newErrors.email = 'E-mail inválido';
    }

    // Senha
    if (!formData.password) {
      newErrors.password = 'Senha é obrigatória';
    } else if (formData.password.length < 8) {
      newErrors.password = 'Senha deve ter pelo menos 8 caracteres';
    } else if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(formData.password)) {
      newErrors.password = 'Senha deve conter letra maiúscula, minúscula e número';
    }

    // Confirmar senha
    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'As senhas não coincidem';
    }

    // Termos
    if (!formData.acceptTerms) {
      newErrors.acceptTerms = 'Você deve aceitar os termos de uso';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) return;

    setIsLoading(true);

    const success = await register({
      name: formData.name.trim(),
      email: formData.email.trim().toLowerCase(),
      password: formData.password,
    });

    if (success) {
      toast.success('Cadastro realizado com sucesso!');
      navigate(ROUTES.app.root);
    } else {
      if (error?.field) {
        setErrors({ [error.field]: error.message } as FormErrors);
      } else {
        toast.error(error?.message || 'Erro ao criar conta. Tente novamente.');
      }
    }

    setIsLoading(false);
  };

  const handleChange = (field: keyof FormData, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Limpar erro do campo
    if (errors[field as keyof FormErrors]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };

  return (
    <>
      <title>Cadastro - Portal Econômico Mundial</title>
      <meta name="description" content="Crie sua conta no Portal Econômico Mundial" />

      <main className="min-h-screen flex items-center justify-center py-8 sm:py-12 px-4">
        <article className="w-full max-w-md">
          {/* Header */}
          <header className="text-center mb-6 sm:mb-8">
            <h1 className="text-2xl sm:text-3xl font-black text-[#111111] mb-2">Criar Conta</h1>
            <p className="text-sm sm:text-base text-[#6b6b6b]">
              Junte-se ao Portal Econômico Mundial
            </p>
          </header>

          {/* Aviso de simulação */}
          <aside className="mb-6 p-3 sm:p-4 bg-[#fefce8] border border-[#fde047] rounded-lg">
            <header className="flex items-start gap-2">
              <Info className="w-4 h-4 sm:w-5 sm:h-5 text-[#ca8a04] flex-shrink-0 mt-0.5" />
              <section>
                <h2 className="text-xs sm:text-sm font-medium text-[#854d0e]">Ambiente de demonstração</h2>
                <p className="text-xs text-[#a16207] mt-1">
                  Este é um ambiente de testes. Seus dados são armazenados apenas no navegador 
                  e podem ser perdidos ao limpar o cache.
                </p>
              </section>
            </header>
          </aside>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-5">
            {/* Nome */}
            <fieldset>
              <Label htmlFor="name" className="text-sm font-medium text-[#111111]">
                Nome completo
              </Label>
              <section className="relative mt-1.5">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[#6b6b6b]" />
                <Input
                  id="name"
                  type="text"
                  value={formData.name}
                  onChange={(e) => handleChange('name', e.target.value)}
                  placeholder="Seu nome"
                  className={`pl-10 min-h-[44px] ${errors.name ? 'border-[#ef4444]' : ''}`}
                  disabled={isLoading}
                />
              </section>
              {errors.name && (
                <p className="mt-1.5 text-xs text-[#ef4444] flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" />
                  {errors.name}
                </p>
              )}
            </fieldset>

            {/* Email */}
            <fieldset>
              <Label htmlFor="email" className="text-sm font-medium text-[#111111]">
                E-mail
              </Label>
              <section className="relative mt-1.5">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[#6b6b6b]" />
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleChange('email', e.target.value)}
                  placeholder="seu@email.com"
                  className={`pl-10 min-h-[44px] ${errors.email ? 'border-[#ef4444]' : ''}`}
                  disabled={isLoading}
                />
              </section>
              {errors.email && (
                <p className="mt-1.5 text-xs text-[#ef4444] flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" />
                  {errors.email}
                </p>
              )}
            </fieldset>

            {/* Senha */}
            <fieldset>
              <Label htmlFor="password" className="text-sm font-medium text-[#111111]">
                Senha
              </Label>
              <section className="relative mt-1.5">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[#6b6b6b]" />
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={formData.password}
                  onChange={(e) => handleChange('password', e.target.value)}
                  placeholder="••••••••"
                  className={`pl-10 pr-10 min-h-[44px] ${errors.password ? 'border-[#ef4444]' : ''}`}
                  disabled={isLoading}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#6b6b6b] hover:text-[#111111] tap-feedback"
                  aria-label={showPassword ? 'Ocultar senha' : 'Mostrar senha'}
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </section>
              {errors.password ? (
                <p className="mt-1.5 text-xs text-[#ef4444] flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" />
                  {errors.password}
                </p>
              ) : (
                <p className="mt-1.5 text-xs text-[#6b6b6b]">
                  Mínimo 8 caracteres, com maiúscula, minúscula e número
                </p>
              )}
            </fieldset>

            {/* Confirmar Senha */}
            <fieldset>
              <Label htmlFor="confirmPassword" className="text-sm font-medium text-[#111111]">
                Confirmar senha
              </Label>
              <section className="relative mt-1.5">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[#6b6b6b]" />
                <Input
                  id="confirmPassword"
                  type={showConfirmPassword ? 'text' : 'password'}
                  value={formData.confirmPassword}
                  onChange={(e) => handleChange('confirmPassword', e.target.value)}
                  placeholder="••••••••"
                  className={`pl-10 pr-10 min-h-[44px] ${errors.confirmPassword ? 'border-[#ef4444]' : ''}`}
                  disabled={isLoading}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#6b6b6b] hover:text-[#111111] tap-feedback"
                  aria-label={showConfirmPassword ? 'Ocultar senha' : 'Mostrar senha'}
                >
                  {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </section>
              {errors.confirmPassword && (
                <p className="mt-1.5 text-xs text-[#ef4444] flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" />
                  {errors.confirmPassword}
                </p>
              )}
            </fieldset>

            {/* Termos */}
            <fieldset>
              <section className="flex items-start gap-3">
                <Checkbox
                  id="terms"
                  checked={formData.acceptTerms}
                  onCheckedChange={(checked) => handleChange('acceptTerms', checked as boolean)}
                  disabled={isLoading}
                  className={`mt-0.5 ${errors.acceptTerms ? 'border-[#ef4444]' : ''}`}
                />
                <Label htmlFor="terms" className="text-sm text-[#6b6b6b] cursor-pointer">
                  Li e aceito os{' '}
                  <Link to={ROUTES.termos} className="text-[#c40000] hover:underline">
                    Termos de Uso
                  </Link>{' '}
                  e a{' '}
                  <Link to={ROUTES.privacidade} className="text-[#c40000] hover:underline">
                    Política de Privacidade
                  </Link>
                </Label>
              </section>
              {errors.acceptTerms && (
                <p className="mt-1.5 text-xs text-[#ef4444] flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" />
                  {errors.acceptTerms}
                </p>
              )}
            </fieldset>

            {/* Submit */}
            <Button
              type="submit"
              className="w-full bg-[#c40000] hover:bg-[#a00000] min-h-[48px] text-base"
              disabled={isLoading}
              aria-busy={isLoading}
            >
              {isLoading ? (
                <>
                  <span className="w-5 h-5 mr-2 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Criando conta...
                </>
              ) : (
                <>
                  <CheckCircle className="w-5 h-5 mr-2" />
                  Criar conta
                </>
              )}
            </Button>
          </form>

          {/* Links */}
          <footer className="mt-6 sm:mt-8 text-center text-sm text-[#6b6b6b]">
            <p>
              Já tem uma conta?{' '}
              <Link to={ROUTES.login} className="text-[#c40000] hover:underline font-medium">
                Faça login
              </Link>
            </p>
          </footer>
        </article>
      </main>
    </>
  );
}
