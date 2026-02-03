/**
 * Perfil do Usuário
 * Edição de dados pessoais
 */

import { useState } from 'react';
import { User, Mail, MapPin, Save, CheckCircle, AlertCircle } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { CONTENT_CONFIG } from '@/config/content';

export function UserProfile() {
  const { user, updateUser } = useAuth();
  
  const [formData, setFormData] = useState({
    name: user?.name || '',
    email: user?.email || '',
    region: user?.region || '',
  });
  
  const [isSaving, setIsSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};
    
    if (!formData.name.trim()) {
      newErrors.name = 'Nome é obrigatório';
    } else if (formData.name.trim().length < 3) {
      newErrors.name = 'Nome deve ter pelo menos 3 caracteres';
    }
    
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!formData.email.trim()) {
      newErrors.email = 'E-mail é obrigatório';
    } else if (!emailRegex.test(formData.email)) {
      newErrors.email = 'E-mail inválido';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async () => {
    if (!validate()) return;
    
    setIsSaving(true);
    
    // Simular delay de API
    await new Promise(resolve => setTimeout(resolve, 800));
    
    updateUser({
      name: formData.name.trim(),
      region: formData.region,
    });
    
    setIsSaving(false);
    toast.success('Perfil atualizado com sucesso!');
  };

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  return (
    <>
      <title>Meu Perfil - Portal Econômico Mundial</title>

      <main className="max-w-[768px] mx-auto px-4 py-6 sm:py-8">
        <header className="mb-6 sm:mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-[#111111]">Meu Perfil</h1>
          <p className="text-sm sm:text-base text-[#6b6b6b] mt-1">
            Gerencie suas informações pessoais
          </p>
        </header>

        <section className="bg-white border border-[#e5e5e5] rounded-lg p-4 sm:p-6">
          {/* Avatar */}
          <section className="flex items-center gap-4 mb-6 pb-6 border-b border-[#e5e5e5]">
            <figure className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-[#e5e5e5] flex items-center justify-center">
              {user?.avatar ? (
                <img 
                  src={user.avatar} 
                  alt="" 
                  className="w-full h-full rounded-full object-cover"
                />
              ) : (
                <User className="w-8 h-8 sm:w-10 sm:h-10 text-[#6b6b6b]" />
              )}
            </figure>
            <section>
              <h2 className="text-lg sm:text-xl font-semibold text-[#111111]">{user?.name}</h2>
              <p className="text-sm text-[#6b6b6b]">{user?.email}</p>
              <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-[#dcfce7] text-[#166534] text-xs rounded-full mt-2 capitalize">
                <CheckCircle className="w-3 h-3" />
                {user?.role === 'admin' ? 'Administrador' : 'Usuário'}
              </span>
            </section>
          </section>

          {/* Formulário */}
          <form className="space-y-5" onSubmit={(e) => { e.preventDefault(); handleSave(); }}>
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
                  disabled
                  className="pl-10 min-h-[44px] bg-[#f5f5f5] text-[#6b6b6b]"
                />
              </section>
              <p className="mt-1.5 text-xs text-[#6b6b6b]">
                O e-mail não pode ser alterado.
              </p>
            </fieldset>

            {/* Região */}
            <fieldset>
              <Label htmlFor="region" className="text-sm font-medium text-[#111111]">
                Região
              </Label>
              <section className="relative mt-1.5">
                <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[#6b6b6b]" />
                <select
                  id="region"
                  value={formData.region}
                  onChange={(e) => handleChange('region', e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 border border-[#e5e5e5] rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-[#c40000] focus:border-transparent min-h-[44px]"
                >
                  <option value="">Selecione sua região</option>
                  {CONTENT_CONFIG.regions.map(region => (
                    <option key={region.code} value={region.code}>
                      {region.name}
                    </option>
                  ))}
                </select>
              </section>
            </fieldset>

            {/* Info da conta */}
            <aside className="p-4 bg-[#f8fafc] rounded-lg">
              <h3 className="text-sm font-medium text-[#111111] mb-2">Informações da conta</h3>
              <ul className="space-y-1 text-sm text-[#6b6b6b]">
                <li>Membro desde: {new Date(user?.createdAt || '').toLocaleDateString('pt-BR')}</li>
                <li>Último login: {new Date(user?.lastLogin || '').toLocaleDateString('pt-BR')}</li>
              </ul>
            </aside>

            {/* Ações */}
            <footer className="flex justify-end pt-4 border-t border-[#e5e5e5]">
              <Button
                type="submit"
                disabled={isSaving}
                className="bg-[#c40000] hover:bg-[#a00000] min-h-[44px]"
              >
                {isSaving ? (
                  <>
                    <span className="w-4 h-4 mr-2 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Salvando...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4 mr-2" />
                    Salvar alterações
                  </>
                )}
              </Button>
            </footer>
          </form>
        </section>
      </main>
    </>
  );
}
