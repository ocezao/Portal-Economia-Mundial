/**
 * Configurações do Usuário - Versão Aprimorada
 * Idioma, privacidade, segurança, aparência e gerenciamento de dados
 */

import { useState } from 'react';
import { 
  Globe, 
  Eye, 
  Download, 
  Trash2, 
  AlertTriangle, 
  FileJson, 
  Shield,
  Lock,
  Bell,
  Moon,
  Sun,
  Monitor,
  Type,
  Layout,
  Smartphone,
  Cookie,
  Fingerprint,
  Save,
  Check,
  Copy,
  RefreshCw,
  EyeOff,
  Laptop,
  Mail
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { STORAGE_KEYS } from '@/config/storage';
import { useBookmarks } from '@/hooks/useBookmarks';
import { useReadingHistory } from '@/hooks/useReadingHistory';
import { supabase } from '@/lib/supabaseClient';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';

type Theme = 'light' | 'dark' | 'system';
type FontSize = 'small' | 'medium' | 'large';
type LayoutDensity = 'compact' | 'comfortable' | 'spacious';

interface UserSettingsData {
  // Geral
  language: string;
  theme: Theme;
  fontSize: FontSize;
  layoutDensity: LayoutDensity;
  reducedMotion: boolean;
  
  // Notificações
  emailNotifications: boolean;
  pushNotifications: boolean;
  newsletterWeekly: boolean;
  newsletterDaily: boolean;
  breakingNewsAlerts: boolean;
  marketAlerts: boolean;
  
  // Privacidade
  shareReadingHistory: boolean;
  allowPersonalization: boolean;
  analyticsConsent: boolean;
  marketingConsent: boolean;
  cookieConsent: boolean;
  
  // Conteúdo
  autoPlayVideos: boolean;
  loadImages: boolean;
  infiniteScroll: boolean;
  showReadingTime: boolean;
  showRelatedArticles: boolean;
}

export function UserSettings() {
  const { user, updatePreferences, logout } = useAuth();
  const { bookmarks, clearAll: clearAllBookmarks } = useBookmarks();
  const { history: readingHistory, reload: reloadHistory } = useReadingHistory();
  const [activeTab, setActiveTab] = useState('geral');
  const [showResetDialog, setShowResetDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [deleteConfirmation, setDeleteConfirmation] = useState('');
  const [hasChanges, setHasChanges] = useState(false);
  
  const [settings, setSettings] = useState<UserSettingsData>({
    // Geral
    language: user?.preferences?.language || 'pt-BR',
    theme: (user?.preferences?.theme as Theme) || 'system',
    fontSize: (user?.preferences?.fontSize as FontSize) || 'medium',
    layoutDensity: (user?.preferences?.layoutDensity as LayoutDensity) || 'comfortable',
    reducedMotion: user?.preferences?.reducedMotion || false,
    
    // Notificações
    emailNotifications: user?.preferences?.emailNotifications ?? true,
    pushNotifications: user?.preferences?.pushNotifications || false,
    newsletterWeekly: user?.preferences?.newsletterWeekly ?? true,
    newsletterDaily: user?.preferences?.newsletterDaily || false,
    breakingNewsAlerts: user?.preferences?.breakingNewsAlerts ?? true,
    marketAlerts: user?.preferences?.marketAlerts || false,
    
    // Privacidade
    shareReadingHistory: user?.preferences?.shareReadingHistory || false,
    allowPersonalization: user?.preferences?.allowPersonalization ?? true,
    analyticsConsent: user?.preferences?.analyticsConsent ?? true,
    marketingConsent: user?.preferences?.marketingConsent || false,
    cookieConsent: user?.preferences?.cookieConsent ?? true,
    
    // Conteúdo
    autoPlayVideos: user?.preferences?.autoPlayVideos || false,
    loadImages: user?.preferences?.loadImages ?? true,
    infiniteScroll: user?.preferences?.infiniteScroll ?? true,
    showReadingTime: user?.preferences?.showReadingTime ?? true,
    showRelatedArticles: user?.preferences?.showRelatedArticles ?? true,
  });

  const handleSettingChange = <K extends keyof UserSettingsData>(
    key: K, 
    value: UserSettingsData[K]
  ) => {
    setSettings(prev => ({ ...prev, [key]: value }));
    setHasChanges(true);
  };

  const saveSettings = () => {
    updatePreferences({
      ...settings,
      language: settings.language as 'pt-BR' | 'en',
    });
    setHasChanges(false);
    toast.success('Configurações salvas com sucesso!');
  };

  const exportData = (format: 'json' | 'csv') => {
    const data = {
      user: user,
      bookmarks,
      history: readingHistory,
      comments: [],
      preferences: settings,
      exportedAt: new Date().toISOString(),
    };
    
    if (format === 'json') {
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `pem-dados-${user?.id}-${Date.now()}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } else {
      // CSV export
      const csvRows = [
        ['Tipo', 'ID', 'Data', 'Título/Descrição'],
        ['Usuário', user?.id || '', user?.createdAt || '', user?.name || ''],
        ...(data.bookmarks || []).map((b) => ['Favorito', b.articleSlug, b.bookmarkedAt, b.title]),
        ...(data.history || []).map((h) => ['Histórico', h.articleSlug, h.readAt, h.title]),
      ];
      const csv = csvRows.map(row => row.map((cell: string) => `"${cell}"`).join(',')).join('\n');
      const blob = new Blob([csv], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `pem-dados-${user?.id}-${Date.now()}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }
    
    toast.success(`Dados exportados em ${format.toUpperCase()}!`);
  };

  const clearAllData = async () => {
    // Limpar dados do usuário
    Object.values(STORAGE_KEYS).forEach(key => {
      if (key !== STORAGE_KEYS.authToken && key !== STORAGE_KEYS.authSession) {
        if (key !== STORAGE_KEYS.bookmarks && key !== STORAGE_KEYS.readingHistory) {
          localStorage.removeItem(key);
        }
      }
    });
    
    if (user) {
      await supabase.from('reading_history').delete().eq('user_id', user.id);
      await supabase.from('reading_progress').delete().eq('user_id', user.id);
      await clearAllBookmarks();
      await reloadHistory();
    }
    toast.success('Todos os dados foram apagados.');
    setShowDeleteDialog(false);
    logout();
  };

  const resetSettings = () => {
    setSettings({
      language: 'pt-BR',
      theme: 'system',
      fontSize: 'medium',
      layoutDensity: 'comfortable',
      reducedMotion: false,
      emailNotifications: true,
      pushNotifications: false,
      newsletterWeekly: true,
      newsletterDaily: false,
      breakingNewsAlerts: true,
      marketAlerts: false,
      shareReadingHistory: false,
      allowPersonalization: true,
      analyticsConsent: true,
      marketingConsent: false,
      cookieConsent: true,
      autoPlayVideos: false,
      loadImages: true,
      infiniteScroll: true,
      showReadingTime: true,
      showRelatedArticles: true,
    });
    setHasChanges(true);
    setShowResetDialog(false);
    toast.success('Configurações restauradas para o padrão');
  };

  const copySessionInfo = () => {
    const sessionInfo = {
      userId: user?.id,
      email: user?.email,
      role: user?.role,
      sessionTime: new Date().toISOString(),
    };
    navigator.clipboard.writeText(JSON.stringify(sessionInfo, null, 2));
    toast.success('Informações copiadas para a área de transferência');
  };

  return (
    <>
      <title>Configurações - Portal Econômico Mundial</title>

      <main className="max-w-[1024px] mx-auto px-4 py-6 sm:py-8">
        <header className="mb-6 sm:mb-8 flex items-start justify-between">
          <section>
            <h1 className="text-2xl sm:text-3xl font-bold text-[#111111]">Configurações</h1>
            <p className="text-sm sm:text-base text-[#6b6b6b] mt-1">
              Personalize sua experiência no portal
            </p>
          </section>
          {hasChanges && (
            <Button 
              onClick={saveSettings}
              className="bg-[#c40000] hover:bg-[#a00000]"
            >
              <Save className="w-4 h-4 mr-2" />
              Salvar alterações
            </Button>
          )}
        </header>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-2">
            <TabsTrigger value="geral" className="gap-2">
              <Monitor className="w-4 h-4" />
              <span className="hidden sm:inline">Geral</span>
            </TabsTrigger>
            <TabsTrigger value="aparencia" className="gap-2">
              <Sun className="w-4 h-4" />
              <span className="hidden sm:inline">Aparência</span>
            </TabsTrigger>
            <TabsTrigger value="notificacoes" className="gap-2">
              <Bell className="w-4 h-4" />
              <span className="hidden sm:inline">Notificações</span>
            </TabsTrigger>
            <TabsTrigger value="privacidade" className="gap-2">
              <Shield className="w-4 h-4" />
              <span className="hidden sm:inline">Privacidade</span>
            </TabsTrigger>
            <TabsTrigger value="conteudo" className="gap-2">
              <Layout className="w-4 h-4" />
              <span className="hidden sm:inline">Conteúdo</span>
            </TabsTrigger>
            <TabsTrigger value="dados" className="gap-2">
              <FileJson className="w-4 h-4" />
              <span className="hidden sm:inline">Dados</span>
            </TabsTrigger>
          </TabsList>

          {/* ABA GERAL */}
          <TabsContent value="geral" className="space-y-6">
            {/* Idioma */}
            <article className="bg-white border border-[#e5e5e5] rounded-lg p-4 sm:p-6">
              <header className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-[#fef2f2] rounded-lg">
                  <Globe className="w-5 h-5 text-[#c40000]" />
                </div>
                <section>
                  <h2 className="text-lg font-semibold text-[#111111]">Idioma e Região</h2>
                  <p className="text-xs text-[#6b6b6b]">Configure o idioma de exibição do conteúdo</p>
                </section>
              </header>
              
              <section className="grid sm:grid-cols-2 gap-4">
                <fieldset>
                  <Label className="text-sm text-[#111111]">Idioma do portal</Label>
                  <select
                    value={settings.language}
                    onChange={(e) => handleSettingChange('language', e.target.value)}
                    className="w-full mt-1.5 px-4 py-2.5 border border-[#e5e5e5] rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-[#c40000] min-h-[44px]"
                  >
                    <option value="pt-BR">Português (Brasil)</option>
                    <option value="pt-PT">Português (Portugal)</option>
                    <option value="en">English</option>
                    <option value="es">Español</option>
                    <option value="fr">Français</option>
                  </select>
                </fieldset>
                
                <fieldset>
                  <Label className="text-sm text-[#111111]">Fuso horário</Label>
                  <select
                    className="w-full mt-1.5 px-4 py-2.5 border border-[#e5e5e5] rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-[#c40000] min-h-[44px] bg-[#f5f5f5]"
                    disabled
                  >
                    <option>America/Sao_Paulo (GMT-3)</option>
                  </select>
                  <p className="text-xs text-[#6b6b6b] mt-1">Detectado automaticamente</p>
                </fieldset>
              </section>
            </article>

            {/* Acessibilidade */}
            <article className="bg-white border border-[#e5e5e5] rounded-lg p-4 sm:p-6">
              <header className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-[#fef2f2] rounded-lg">
                  <Eye className="w-5 h-5 text-[#c40000]" />
                </div>
                <section>
                  <h2 className="text-lg font-semibold text-[#111111]">Acessibilidade</h2>
                  <p className="text-xs text-[#6b6b6b]">Recursos para melhorar a usabilidade</p>
                </section>
              </header>
              
              <ul className="space-y-4">
                <li>
                  <label className="flex items-start gap-3 cursor-pointer">
                    <Checkbox
                      checked={settings.reducedMotion}
                      onCheckedChange={(checked) => handleSettingChange('reducedMotion', checked as boolean)}
                    />
                    <section>
                      <p className="text-sm font-medium text-[#111111]">Reduzir animações</p>
                      <p className="text-xs text-[#6b6b6b]">
                        Desativa animações e transições para melhor acessibilidade.
                      </p>
                    </section>
                  </label>
                </li>
                <li>
                  <label className="flex items-start gap-3">
                    <Checkbox checked disabled />
                    <section>
                      <p className="text-sm font-medium text-[#111111]">Navegação por teclado</p>
                      <p className="text-xs text-[#6b6b6b]">
                        Permite navegar usando apenas o teclado (Tab, Enter, Esc).
                      </p>
                    </section>
                  </label>
                </li>
              </ul>
            </article>

            {/* Sessão */}
            <article className="bg-white border border-[#e5e5e5] rounded-lg p-4 sm:p-6">
              <header className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-[#fef2f2] rounded-lg">
                  <Fingerprint className="w-5 h-5 text-[#c40000]" />
                </div>
                <section>
                  <h2 className="text-lg font-semibold text-[#111111]">Sessão Atual</h2>
                  <p className="text-xs text-[#6b6b6b]">Informações sobre sua sessão</p>
                </section>
              </header>
              
              <section className="space-y-3">
                <section className="flex items-center justify-between p-3 bg-[#f8fafc] rounded-lg">
                  <section>
                    <p className="text-sm font-medium text-[#111111]">ID da Sessão</p>
                    <p className="text-xs text-[#6b6b6b] font-mono">{user?.id?.slice(0, 16)}...</p>
                  </section>
                  <Button variant="outline" size="sm" onClick={copySessionInfo}>
                    <Copy className="w-4 h-4" />
                  </Button>
                </section>
                <section className="flex items-center justify-between p-3 bg-[#f8fafc] rounded-lg">
                  <section>
                    <p className="text-sm font-medium text-[#111111]">Último login</p>
                    <p className="text-xs text-[#6b6b6b]">
                      {new Date(user?.lastLogin || '').toLocaleString('pt-BR')}
                    </p>
                  </section>
                </section>
                <section className="flex items-center justify-between p-3 bg-[#f8fafc] rounded-lg">
                  <section>
                    <p className="text-sm font-medium text-[#111111]">Tipo de conta</p>
                    <p className="text-xs text-[#6b6b6b] capitalize">
                      {user?.role === 'admin' ? 'Administrador' : 'Padrão'}
                    </p>
                  </section>
                </section>
              </section>
            </article>
          </TabsContent>

          {/* ABA APARÊNCIA */}
          <TabsContent value="aparencia" className="space-y-6">
            <article className="bg-white border border-[#e5e5e5] rounded-lg p-4 sm:p-6">
              <header className="flex items-center gap-3 mb-6">
                <div className="p-2 bg-[#fef2f2] rounded-lg">
                  <Sun className="w-5 h-5 text-[#c40000]" />
                </div>
                <section>
                  <h2 className="text-lg font-semibold text-[#111111]">Tema</h2>
                  <p className="text-xs text-[#6b6b6b]">Escolha como o portal deve ser exibido</p>
                </section>
              </header>
              
              <section className="grid grid-cols-3 gap-4">
                {[
                  { value: 'light', label: 'Claro', icon: Sun },
                  { value: 'dark', label: 'Escuro', icon: Moon },
                  { value: 'system', label: 'Sistema', icon: Laptop },
                ].map((theme) => (
                  <button
                    key={theme.value}
                    onClick={() => handleSettingChange('theme', theme.value as Theme)}
                    className={`flex flex-col items-center gap-2 p-4 rounded-lg border-2 transition-all ${
                      settings.theme === theme.value
                        ? 'border-[#c40000] bg-[#fef2f2]'
                        : 'border-[#e5e5e5] hover:border-[#c40000]/50'
                    }`}
                  >
                    <theme.icon className={`w-6 h-6 ${settings.theme === theme.value ? 'text-[#c40000]' : 'text-[#6b6b6b]'}`} />
                    <span className={`text-sm font-medium ${settings.theme === theme.value ? 'text-[#c40000]' : 'text-[#111111]'}`}>
                      {theme.label}
                    </span>
                  </button>
                ))}
              </section>
            </article>

            <article className="bg-white border border-[#e5e5e5] rounded-lg p-4 sm:p-6">
              <header className="flex items-center gap-3 mb-6">
                <div className="p-2 bg-[#fef2f2] rounded-lg">
                  <Type className="w-5 h-5 text-[#c40000]" />
                </div>
                <section>
                  <h2 className="text-lg font-semibold text-[#111111]">Tamanho da Fonte</h2>
                  <p className="text-xs text-[#6b6b6b]">Ajuste o tamanho do texto</p>
                </section>
              </header>
              
              <section className="space-y-4">
                <section className="flex items-center gap-4">
                  <span className="text-xs text-[#6b6b6b]">A</span>
                  <Slider
                    value={[settings.fontSize === 'small' ? 1 : settings.fontSize === 'medium' ? 2 : 3]}
                    onValueChange={([v]) => handleSettingChange('fontSize', v === 1 ? 'small' : v === 2 ? 'medium' : 'large')}
                    min={1}
                    max={3}
                    step={1}
                    className="flex-1"
                  />
                  <span className="text-lg text-[#6b6b6b]">A</span>
                </section>
                <section className="flex justify-between text-xs text-[#6b6b6b]">
                  <span>Pequeno</span>
                  <span>Médio</span>
                  <span>Grande</span>
                </section>
              </section>
            </article>

            <article className="bg-white border border-[#e5e5e5] rounded-lg p-4 sm:p-6">
              <header className="flex items-center gap-3 mb-6">
                <div className="p-2 bg-[#fef2f2] rounded-lg">
                  <Layout className="w-5 h-5 text-[#c40000]" />
                </div>
                <section>
                  <h2 className="text-lg font-semibold text-[#111111]">Densidade do Layout</h2>
                  <p className="text-xs text-[#6b6b6b]">Espaçamento entre elementos</p>
                </section>
              </header>
              
              <section className="space-y-3">
                {[
                  { value: 'compact', label: 'Compacto', desc: 'Menos espaçamento, mais conteúdo visível' },
                  { value: 'comfortable', label: 'Confortável', desc: 'Equilíbrio entre conteúdo e espaçamento' },
                  { value: 'spacious', label: 'Espaçoso', desc: 'Mais espaçamento, leitura relaxada' },
                ].map((density) => (
                  <label
                    key={density.value}
                    className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-all ${
                      settings.layoutDensity === density.value
                        ? 'border-[#c40000] bg-[#fef2f2]'
                        : 'border-[#e5e5e5] hover:border-[#c40000]/50'
                    }`}
                  >
                    <input
                      type="radio"
                      name="density"
                      value={density.value}
                      checked={settings.layoutDensity === density.value}
                      onChange={(e) => handleSettingChange('layoutDensity', e.target.value as LayoutDensity)}
                      className="accent-[#c40000]"
                    />
                    <section>
                      <p className={`text-sm font-medium ${settings.layoutDensity === density.value ? 'text-[#c40000]' : 'text-[#111111]'}`}>
                        {density.label}
                      </p>
                      <p className="text-xs text-[#6b6b6b]">{density.desc}</p>
                    </section>
                  </label>
                ))}
              </section>
            </article>
          </TabsContent>

          {/* ABA NOTIFICAÇÕES */}
          <TabsContent value="notificacoes" className="space-y-6">
            <article className="bg-white border border-[#e5e5e5] rounded-lg p-4 sm:p-6">
              <header className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-[#fef2f2] rounded-lg">
                  <Mail className="w-5 h-5 text-[#c40000]" />
                </div>
                <section>
                  <h2 className="text-lg font-semibold text-[#111111]">E-mail</h2>
                  <p className="text-xs text-[#6b6b6b]">Configure quais e-mails deseja receber</p>
                </section>
              </header>
              
              <ul className="space-y-4">
                <li className="flex items-center justify-between">
                  <section>
                    <p className="text-sm font-medium text-[#111111]">Newsletter semanal</p>
                    <p className="text-xs text-[#6b6b6b]">Resumo dos principais destaques da semana</p>
                  </section>
                  <Switch
                    checked={settings.newsletterWeekly}
                    onCheckedChange={(checked) => handleSettingChange('newsletterWeekly', checked)}
                  />
                </li>
                <li className="flex items-center justify-between">
                  <section>
                    <p className="text-sm font-medium text-[#111111]">Newsletter diária</p>
                    <p className="text-xs text-[#6b6b6b]">Resumo matinal com as notícias mais importantes</p>
                  </section>
                  <Switch
                    checked={settings.newsletterDaily}
                    onCheckedChange={(checked) => handleSettingChange('newsletterDaily', checked)}
                  />
                </li>
                <li className="flex items-center justify-between">
                  <section>
                    <p className="text-sm font-medium text-[#111111]">Alertas de notícias urgentes</p>
                    <p className="text-xs text-[#6b6b6b]">Notificações sobre eventos importantes em tempo real</p>
                  </section>
                  <Switch
                    checked={settings.breakingNewsAlerts}
                    onCheckedChange={(checked) => handleSettingChange('breakingNewsAlerts', checked)}
                  />
                </li>
                <li className="flex items-center justify-between">
                  <section>
                    <p className="text-sm font-medium text-[#111111]">Alertas de mercado</p>
                    <p className="text-xs text-[#6b6b6b]">Movimentações importantes nos mercados financeiros</p>
                  </section>
                  <Switch
                    checked={settings.marketAlerts}
                    onCheckedChange={(checked) => handleSettingChange('marketAlerts', checked)}
                  />
                </li>
              </ul>
            </article>

            <article className="bg-white border border-[#e5e5e5] rounded-lg p-4 sm:p-6">
              <header className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-[#fef2f2] rounded-lg">
                  <Smartphone className="w-5 h-5 text-[#c40000]" />
                </div>
                <section>
                  <h2 className="text-lg font-semibold text-[#111111]">Push e Dispositivos</h2>
                  <p className="text-xs text-[#6b6b6b]">Notificações no navegador e dispositivos</p>
                </section>
              </header>
              
              <ul className="space-y-4">
                <li className="flex items-center justify-between">
                  <section>
                    <p className="text-sm font-medium text-[#111111]">Notificações push</p>
                    <p className="text-xs text-[#6b6b6b]">Receba alertas no navegador mesmo com o site fechado</p>
                  </section>
                  <Switch
                    checked={settings.pushNotifications}
                    onCheckedChange={(checked) => handleSettingChange('pushNotifications', checked)}
                  />
                </li>
              </ul>
            </article>
          </TabsContent>

          {/* ABA PRIVACIDADE */}
          <TabsContent value="privacidade" className="space-y-6">
            <article className="bg-white border border-[#e5e5e5] rounded-lg p-4 sm:p-6">
              <header className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-[#fef2f2] rounded-lg">
                  <Lock className="w-5 h-5 text-[#c40000]" />
                </div>
                <section>
                  <h2 className="text-lg font-semibold text-[#111111]">Privacidade de Dados</h2>
                  <p className="text-xs text-[#6b6b6b]">Controle como seus dados são usados</p>
                </section>
              </header>
              
              <ul className="space-y-4">
                <li className="flex items-center justify-between">
                  <section>
                    <p className="text-sm font-medium text-[#111111]">Personalização de conteúdo</p>
                    <p className="text-xs text-[#6b6b6b]">Permite que usemos seu histórico para recomendar artigos</p>
                  </section>
                  <Switch
                    checked={settings.allowPersonalization}
                    onCheckedChange={(checked) => handleSettingChange('allowPersonalization', checked)}
                  />
                </li>
                <li className="flex items-center justify-between">
                  <section>
                    <p className="text-sm font-medium text-[#111111]">Histórico de leitura</p>
                    <p className="text-xs text-[#6b6b6b]">Salvar histórico de artigos lidos</p>
                  </section>
                  <Switch
                    checked={settings.shareReadingHistory}
                    onCheckedChange={(checked) => handleSettingChange('shareReadingHistory', checked)}
                  />
                </li>
                <li className="flex items-center justify-between">
                  <section>
                    <p className="text-sm font-medium text-[#111111]">Cookies analíticos</p>
                    <p className="text-xs text-[#6b6b6b]">Ajuda-nos a melhorar o site com dados anônimos</p>
                  </section>
                  <Switch
                    checked={settings.analyticsConsent}
                    onCheckedChange={(checked) => handleSettingChange('analyticsConsent', checked)}
                  />
                </li>
                <li className="flex items-center justify-between">
                  <section>
                    <p className="text-sm font-medium text-[#111111]">Marketing e parceiros</p>
                    <p className="text-xs text-[#6b6b6b]">Receber ofertas de parceiros selecionados</p>
                  </section>
                  <Switch
                    checked={settings.marketingConsent}
                    onCheckedChange={(checked) => handleSettingChange('marketingConsent', checked)}
                  />
                </li>
              </ul>
            </article>

            <article className="bg-white border border-[#e5e5e5] rounded-lg p-4 sm:p-6">
              <header className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-[#fef2f2] rounded-lg">
                  <Cookie className="w-5 h-5 text-[#c40000]" />
                </div>
                <section>
                  <h2 className="text-lg font-semibold text-[#111111]">Cookies</h2>
                  <p className="text-xs text-[#6b6b6b]">Gerenciar preferências de cookies</p>
                </section>
              </header>
              
              <section className="space-y-3">
                <section className="p-3 bg-[#f8fafc] rounded-lg">
                  <section className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-[#111111]">Cookies essenciais</span>
                    <span className="text-xs text-[#6b6b6b] bg-[#e5e5e5] px-2 py-0.5 rounded">Obrigatório</span>
                  </section>
                  <p className="text-xs text-[#6b6b6b]">Necessários para o funcionamento do site</p>
                </section>
                <section className="p-3 bg-[#f8fafc] rounded-lg">
                  <section className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-[#111111]">Cookies de preferências</span>
                    <Switch
                      checked={settings.cookieConsent}
                      onCheckedChange={(checked) => handleSettingChange('cookieConsent', checked)}
                    />
                  </section>
                  <p className="text-xs text-[#6b6b6b]">Lembram suas configurações e preferências</p>
                </section>
              </section>
            </article>
          </TabsContent>

          {/* ABA CONTEÚDO */}
          <TabsContent value="conteudo" className="space-y-6">
            <article className="bg-white border border-[#e5e5e5] rounded-lg p-4 sm:p-6">
              <header className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-[#fef2f2] rounded-lg">
                  <Eye className="w-5 h-5 text-[#c40000]" />
                </div>
                <section>
                  <h2 className="text-lg font-semibold text-[#111111]">Exibição de Conteúdo</h2>
                  <p className="text-xs text-[#6b6b6b]">Como o conteúdo é apresentado</p>
                </section>
              </header>
              
              <ul className="space-y-4">
                <li className="flex items-center justify-between">
                  <section>
                    <p className="text-sm font-medium text-[#111111]">Tempo de leitura</p>
                    <p className="text-xs text-[#6b6b6b]">Mostrar estimativa de tempo de leitura nos artigos</p>
                  </section>
                  <Switch
                    checked={settings.showReadingTime}
                    onCheckedChange={(checked) => handleSettingChange('showReadingTime', checked)}
                  />
                </li>
                <li className="flex items-center justify-between">
                  <section>
                    <p className="text-sm font-medium text-[#111111]">Artigos relacionados</p>
                    <p className="text-xs text-[#6b6b6b]">Sugerir artigos relacionados ao final da leitura</p>
                  </section>
                  <Switch
                    checked={settings.showRelatedArticles}
                    onCheckedChange={(checked) => handleSettingChange('showRelatedArticles', checked)}
                  />
                </li>
                <li className="flex items-center justify-between">
                  <section>
                    <p className="text-sm font-medium text-[#111111]">Rolagem infinita</p>
                    <p className="text-xs text-[#6b6b6b]">Carregar mais conteúdo automaticamente ao rolar</p>
                  </section>
                  <Switch
                    checked={settings.infiniteScroll}
                    onCheckedChange={(checked) => handleSettingChange('infiniteScroll', checked)}
                  />
                </li>
              </ul>
            </article>

            <article className="bg-white border border-[#e5e5e5] rounded-lg p-4 sm:p-6">
              <header className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-[#fef2f2] rounded-lg">
                  <Monitor className="w-5 h-5 text-[#c40000]" />
                </div>
                <section>
                  <h2 className="text-lg font-semibold text-[#111111]">Mídia</h2>
                  <p className="text-xs text-[#6b6b6b]">Configurações de vídeo e imagens</p>
                </section>
              </header>
              
              <ul className="space-y-4">
                <li className="flex items-center justify-between">
                  <section>
                    <p className="text-sm font-medium text-[#111111]">Reprodução automática de vídeos</p>
                    <p className="text-xs text-[#6b6b6b]">Iniciar vídeos automaticamente (com som desativado)</p>
                  </section>
                  <Switch
                    checked={settings.autoPlayVideos}
                    onCheckedChange={(checked) => handleSettingChange('autoPlayVideos', checked)}
                  />
                </li>
                <li className="flex items-center justify-between">
                  <section>
                    <p className="text-sm font-medium text-[#111111]">Carregar imagens</p>
                    <p className="text-xs text-[#6b6b6b]">Desative para economizar dados móveis</p>
                  </section>
                  <Switch
                    checked={settings.loadImages}
                    onCheckedChange={(checked) => handleSettingChange('loadImages', checked)}
                  />
                </li>
              </ul>
            </article>
          </TabsContent>

          {/* ABA DADOS */}
          <TabsContent value="dados" className="space-y-6">
            <article className="bg-white border border-[#e5e5e5] rounded-lg p-4 sm:p-6">
              <header className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-[#fef2f2] rounded-lg">
                  <Download className="w-5 h-5 text-[#c40000]" />
                </div>
                <section>
                  <h2 className="text-lg font-semibold text-[#111111]">Exportar Dados</h2>
                  <p className="text-xs text-[#6b6b6b]">Baixe uma cópia dos seus dados</p>
                </section>
              </header>
              
              <aside className="p-3 bg-[#f0fdf4] border border-[#86efac] rounded-lg mb-4">
                <section className="flex items-start gap-2">
                  <Check className="w-4 h-4 text-[#22c55e] mt-0.5" />
                  <p className="text-sm text-[#166534]">
                    Seus dados são seus. Você pode exportá-los a qualquer momento.
                  </p>
                </section>
              </aside>

              <ul className="grid sm:grid-cols-2 gap-3">
                <li>
                  <Button
                    variant="outline"
                    onClick={() => exportData('json')}
                    className="w-full justify-start gap-2"
                  >
                    <FileJson className="w-4 h-4" />
                    Exportar como JSON
                  </Button>
                </li>
                <li>
                  <Button
                    variant="outline"
                    onClick={() => exportData('csv')}
                    className="w-full justify-start gap-2"
                  >
                    <Layout className="w-4 h-4" />
                    Exportar como CSV
                  </Button>
                </li>
              </ul>
            </article>

            <article className="bg-white border border-[#e5e5e5] rounded-lg p-4 sm:p-6">
              <header className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-[#fef2f2] rounded-lg">
                  <RefreshCw className="w-5 h-5 text-[#c40000]" />
                </div>
                <section>
                  <h2 className="text-lg font-semibold text-[#111111]">Restaurar Padrões</h2>
                  <p className="text-xs text-[#6b6b6b]">Voltar configurações ao estado inicial</p>
                </section>
              </header>
              
              <Button
                variant="outline"
                onClick={() => setShowResetDialog(true)}
                className="w-full justify-start gap-2"
              >
                <RefreshCw className="w-4 h-4" />
                Restaurar configurações padrão
              </Button>
            </article>

            <article className="bg-white border border-[#ef4444] rounded-lg p-4 sm:p-6">
              <header className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-[#fef2f2] rounded-lg">
                  <Trash2 className="w-5 h-5 text-[#ef4444]" />
                </div>
                <section>
                  <h2 className="text-lg font-semibold text-[#ef4444]">Zona de Perigo</h2>
                  <p className="text-xs text-[#6b6b6b]">Ações que não podem ser desfeitas</p>
                </section>
              </header>
              
              <aside className="p-3 bg-[#fef2f2] border border-[#fecaca] rounded-lg mb-4">
                <section className="flex items-start gap-2">
                  <AlertTriangle className="w-4 h-4 text-[#dc2626] mt-0.5" />
                  <p className="text-sm text-[#7f1d1d]">
                    A exclusão de dados é permanente. Não será possível recuperar seus favoritos, histórico e configurações.
                  </p>
                </section>
              </aside>

              <Button
                variant="outline"
                onClick={() => setShowDeleteDialog(true)}
                className="w-full justify-start gap-2 text-[#ef4444] border-[#ef4444] hover:bg-[#fef2f2]"
              >
                <Trash2 className="w-4 h-4" />
                Apagar todos os meus dados
              </Button>
            </article>

            {/* Aviso */}
            <aside className="p-4 bg-[#fef2f2] border border-[#fecaca] rounded-lg">
              <header className="flex items-start gap-2">
                <EyeOff className="w-5 h-5 text-[#dc2626] flex-shrink-0 mt-0.5" />
                <section>
                  <h3 className="text-sm font-medium text-[#dc2626]">Armazenamento Local</h3>
                  <p className="text-xs text-[#7f1d1d] mt-1">
                    Este é um portal demonstrativo. Seus dados são armazenados apenas no seu 
                    navegador (LocalStorage) e podem ser perdidos ao limpar o cache. 
                    Não há servidor backend - seus dados não saem deste dispositivo.
                  </p>
                </section>
              </header>
            </aside>
          </TabsContent>
        </Tabs>

        {/* Botão flutuante para salvar em mobile */}
        {hasChanges && (
          <section className="fixed bottom-6 right-6 sm:hidden">
            <Button 
              onClick={saveSettings}
              className="bg-[#c40000] hover:bg-[#a00000] shadow-lg rounded-full w-14 h-14"
            >
              <Save className="w-6 h-6" />
            </Button>
          </section>
        )}

        {/* Dialog de Reset */}
        <Dialog open={showResetDialog} onOpenChange={setShowResetDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Restaurar configurações padrão?</DialogTitle>
              <DialogDescription>
                Todas as suas configurações personalizadas serão perdidas e restauradas para o estado inicial.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowResetDialog(false)}>
                Cancelar
              </Button>
              <Button onClick={resetSettings} className="bg-[#c40000] hover:bg-[#a00000]">
                Restaurar
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Dialog de Exclusão */}
        <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle className="text-[#ef4444]">Apagar todos os dados?</DialogTitle>
              <DialogDescription>
                Esta ação é irreversível. Todos os seus dados serão permanentemente removidos.
                <br /><br />
                Digite <strong>APAGAR</strong> para confirmar:
              </DialogDescription>
            </DialogHeader>
            <Input
              value={deleteConfirmation}
              onChange={(e) => setDeleteConfirmation(e.target.value)}
              placeholder="Digite APAGAR"
              className="mt-4"
            />
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowDeleteDialog(false)}>
                Cancelar
              </Button>
              <Button 
                onClick={clearAllData}
                disabled={deleteConfirmation !== 'APAGAR'}
                className="bg-[#ef4444] hover:bg-[#dc2626]"
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Apagar permanentemente
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </main>
    </>
  );
}
