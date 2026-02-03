/**
 * Configurações do Usuário
 * Idioma, privacidade, gerenciamento de dados
 */

import { useState } from 'react';
import { Globe, Eye, Download, Trash2, AlertTriangle, FileJson, Shield } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { toast } from 'sonner';
import { storage, STORAGE_KEYS } from '@/config/storage';

export function UserSettings() {
  const { user, updatePreferences, logout } = useAuth();
  
  const [settings, setSettings] = useState({
    language: user?.preferences?.language || 'pt-BR',
    reducedMotion: user?.preferences?.reducedMotion || false,
    emailNotifications: user?.preferences?.emailNotifications ?? true,
    pushNotifications: user?.preferences?.pushNotifications || false,
  });

  const handleSettingChange = (key: string, value: boolean | string) => {
    setSettings(prev => ({ ...prev, [key]: value }));
    
    if (key === 'reducedMotion' || key === 'emailNotifications' || key === 'pushNotifications') {
      updatePreferences({ [key]: value });
    }
  };

  const exportData = () => {
    const data = {
      user: user,
      bookmarks: storage.get(STORAGE_KEYS.bookmarks),
      history: storage.get(STORAGE_KEYS.readingHistory),
      comments: storage.get('pem_comments'),
      preferences: user?.preferences,
      exportedAt: new Date().toISOString(),
    };
    
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `pem-dados-${user?.id}-${Date.now()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    toast.success('Dados exportados com sucesso!');
  };

  const clearAllData = () => {
    if (confirm('ATENÇÃO: Isso apagará TODOS os seus dados localmente (favoritos, histórico, comentários). Esta ação não pode ser desfeita. Deseja continuar?')) {
      // Limpar dados do usuário
      Object.values(STORAGE_KEYS).forEach(key => {
        if (key !== STORAGE_KEYS.authToken && key !== STORAGE_KEYS.authSession) {
          storage.remove(key);
        }
      });
      
      toast.success('Todos os dados foram apagados.');
      logout();
    }
  };

  return (
    <>
      <title>Configurações - Portal Econômico Mundial</title>

      <main className="max-w-[768px] mx-auto px-4 py-6 sm:py-8">
        <header className="mb-6 sm:mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-[#111111]">Configurações</h1>
          <p className="text-sm sm:text-base text-[#6b6b6b] mt-1">
            Gerencie suas preferências e dados
          </p>
        </header>

        <section className="space-y-6">
          {/* Idioma */}
          <article className="bg-white border border-[#e5e5e5] rounded-lg p-4 sm:p-6">
            <header className="flex items-center gap-2 mb-4">
              <Globe className="w-5 h-5 text-[#c40000]" />
              <h2 className="text-lg font-semibold text-[#111111]">Idioma</h2>
            </header>
            
            <fieldset>
              <label className="block text-sm text-[#6b6b6b] mb-2">
                Selecione o idioma de exibição
              </label>
              <select
                value={settings.language}
                onChange={(e) => handleSettingChange('language', e.target.value)}
                className="w-full px-4 py-2.5 border border-[#e5e5e5] rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-[#c40000] min-h-[44px]"
              >
                <option value="pt-BR">Português (Brasil)</option>
                <option value="en">English</option>
              </select>
              <p className="text-xs text-[#6b6b6b] mt-2">
                A tradução automática será aplicada ao conteúdo quando disponível.
              </p>
            </fieldset>
          </article>

          {/* Acessibilidade */}
          <article className="bg-white border border-[#e5e5e5] rounded-lg p-4 sm:p-6">
            <header className="flex items-center gap-2 mb-4">
              <Eye className="w-5 h-5 text-[#c40000]" />
              <h2 className="text-lg font-semibold text-[#111111]">Acessibilidade</h2>
            </header>
            
            <ul className="space-y-3">
              <li>
                <label className="flex items-start gap-3 cursor-pointer">
                  <Checkbox
                    checked={settings.reducedMotion}
                    onCheckedChange={(checked) => handleSettingChange('reducedMotion', checked)}
                  />
                  <section>
                    <p className="text-sm font-medium text-[#111111]">Reduzir animações</p>
                    <p className="text-xs text-[#6b6b6b]">
                      Desativa animações e transições para melhor acessibilidade.
                    </p>
                  </section>
                </label>
              </li>
            </ul>
          </article>

          {/* Notificações */}
          <article className="bg-white border border-[#e5e5e5] rounded-lg p-4 sm:p-6">
            <header className="flex items-center gap-2 mb-4">
              <Shield className="w-5 h-5 text-[#c40000]" />
              <h2 className="text-lg font-semibold text-[#111111]">Notificações</h2>
            </header>
            
            <ul className="space-y-3">
              <li>
                <label className="flex items-start gap-3 cursor-pointer">
                  <Checkbox
                    checked={settings.emailNotifications}
                    onCheckedChange={(checked) => handleSettingChange('emailNotifications', checked)}
                  />
                  <section>
                    <p className="text-sm font-medium text-[#111111]">Newsletter por e-mail</p>
                    <p className="text-xs text-[#6b6b6b]">
                      Receba as principais notícias diretamente no seu e-mail.
                    </p>
                  </section>
                </label>
              </li>
              <li>
                <label className="flex items-start gap-3 cursor-pointer">
                  <Checkbox
                    checked={settings.pushNotifications}
                    onCheckedChange={(checked) => handleSettingChange('pushNotifications', checked)}
                  />
                  <section>
                    <p className="text-sm font-medium text-[#111111]">Notificações push</p>
                    <p className="text-xs text-[#6b6b6b]">
                      Receba alertas de notícias urgentes no navegador.
                    </p>
                  </section>
                </label>
              </li>
            </ul>
          </article>

          {/* Privacidade e Dados */}
          <article className="bg-white border border-[#e5e5e5] rounded-lg p-4 sm:p-6">
            <header className="flex items-center gap-2 mb-4">
              <FileJson className="w-5 h-5 text-[#c40000]" />
              <h2 className="text-lg font-semibold text-[#111111]">Seus Dados</h2>
            </header>
            
            <aside className="p-3 bg-[#f8fafc] rounded-lg mb-4">
              <p className="text-sm text-[#6b6b6b]">
                <strong>Armazenamento local:</strong> Seus dados são armazenados apenas no seu 
                navegador (LocalStorage) e não são transmitidos para servidores externos. 
                Você pode exportar ou apagar seus dados a qualquer momento.
              </p>
            </aside>

            <ul className="space-y-3">
              <li>
                <Button
                  variant="outline"
                  onClick={exportData}
                  className="w-full justify-start gap-2"
                >
                  <Download className="w-4 h-4" />
                  Exportar meus dados (JSON)
                </Button>
              </li>
              <li>
                <Button
                  variant="outline"
                  onClick={clearAllData}
                  className="w-full justify-start gap-2 text-[#ef4444] border-[#ef4444] hover:bg-[#fef2f2]"
                >
                  <Trash2 className="w-4 h-4" />
                  Apagar todos os meus dados
                </Button>
              </li>
            </ul>
          </article>

          {/* Aviso */}
          <aside className="p-4 bg-[#fef2f2] border border-[#fecaca] rounded-lg">
            <header className="flex items-start gap-2">
              <AlertTriangle className="w-5 h-5 text-[#dc2626] flex-shrink-0 mt-0.5" />
              <section>
                <h3 className="text-sm font-medium text-[#dc2626]">Ambiente de demonstração</h3>
                <p className="text-xs text-[#7f1d1d] mt-1">
                  Este é um portal de notícias demonstrativo. Todos os dados são armazenados 
                  localmente no seu navegador e podem ser perdidos ao limpar o cache. 
                  Não há servidor backend.
                </p>
              </section>
            </header>
          </aside>
        </section>
      </main>
    </>
  );
}
