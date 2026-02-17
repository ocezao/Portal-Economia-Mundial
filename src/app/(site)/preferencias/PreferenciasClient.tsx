/**
 * Preferências do Usuário - Versão Aprimorada
 * Personalização avançada de feed, notificações e experiência
 */

'use client';

import { useState } from 'react';
import { 
  Heart, 
  Tag, 
  Sliders, 
  Save, 
  CheckCircle,
  Clock,
  Newspaper,
  Filter,
  Bell,
  TrendingUp,
  Globe,
  MessageCircle,
  Zap,
  BarChart3,
  Layout,
  Eye,
  Target,
  RotateCcw,
  Sparkles,
  X,
  Moon,
  Sun
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { CATEGORIES } from '@/config/routes';
import { CONTENT_CONFIG } from '@/config/content';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

// Tipos de feed disponíveis
type FeedLayout = 'grid' | 'list' | 'compact';
type FeedSort = 'relevance' | 'date' | 'popular';
type ContentDensity = 'minimal' | 'balanced' | 'detailed';

interface UserPreferencesData {
  // Categorias
  categories: string[];
  
  // Tags
  tags: string[];
  customTags: string[];
  
  // Feed
  feedLayout: FeedLayout;
  feedSort: FeedSort;
  contentDensity: ContentDensity;
  articlesPerPage: number;
  
  // Filtros
  hideReadArticles: boolean;
  showOnlyPreferred: boolean;
  highlightBreaking: boolean;
  
  // Horários de notificação
  notificationSchedule: {
    morning: boolean;
    afternoon: boolean;
    evening: boolean;
  };
  quietHoursStart: string;
  quietHoursEnd: string;
  
  // Interações
  autoBookmarkOnLike: boolean;
  shareToSocial: boolean;
  commentNotifications: boolean;
  
  // Idiomas de conteúdo
  contentLanguages: string[];
  
  // Modo Foco
  focusMode: boolean;
  focusModeSettings: {
    hideSidebar: boolean;
    hideComments: boolean;
    hideRelated: boolean;
    readerView: boolean;
  };
}

export default function PreferenciasPage() {
  const { user, updatePreferences } = useAuth();
  const [activeTab, setActiveTab] = useState('interesses');
  const [isSaving, setIsSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [showResetDialog, setShowResetDialog] = useState(false);
  const [newTagInput, setNewTagInput] = useState('');
  
  const [preferences, setPreferences] = useState<UserPreferencesData>({
    // Categorias
    categories: user?.preferences?.categories || [],
    
    // Tags
    tags: user?.preferences?.tags || [],
    customTags: user?.preferences?.customTags || [],
    
    // Feed
    feedLayout: (user?.preferences?.feedLayout as FeedLayout) || 'grid',
    feedSort: (user?.preferences?.feedSort as FeedSort) || 'date',
    contentDensity: (user?.preferences?.contentDensity as ContentDensity) || 'balanced',
    articlesPerPage: user?.preferences?.articlesPerPage || 10,
    
    // Filtros
    hideReadArticles: user?.preferences?.hideReadArticles || false,
    showOnlyPreferred: user?.preferences?.showOnlyPreferred || false,
    highlightBreaking: user?.preferences?.highlightBreaking ?? true,
    
    // Horários
    notificationSchedule: user?.preferences?.notificationSchedule || {
      morning: true,
      afternoon: false,
      evening: true,
    },
    quietHoursStart: user?.preferences?.quietHoursStart || '22:00',
    quietHoursEnd: user?.preferences?.quietHoursEnd || '07:00',
    
    // Interações
    autoBookmarkOnLike: user?.preferences?.autoBookmarkOnLike || false,
    shareToSocial: user?.preferences?.shareToSocial ?? true,
    commentNotifications: user?.preferences?.commentNotifications ?? true,
    
    // Idiomas
    contentLanguages: user?.preferences?.contentLanguages || ['pt-BR'],
    
    // Modo Foco
    focusMode: user?.preferences?.focusMode || false,
    focusModeSettings: user?.preferences?.focusModeSettings || {
      hideSidebar: true,
      hideComments: false,
      hideRelated: true,
      readerView: true,
    },
  });

  const handlePreferenceChange = <K extends keyof UserPreferencesData>(
    key: K,
    value: UserPreferencesData[K]
  ) => {
    setPreferences(prev => ({ ...prev, [key]: value }));
    setHasChanges(true);
  };

  const toggleCategory = (slug: string) => {
    setPreferences(prev => ({
      ...prev,
      categories: prev.categories.includes(slug)
        ? prev.categories.filter(c => c !== slug)
        : [...prev.categories, slug]
    }));
    setHasChanges(true);
  };

  const toggleTag = (tag: string) => {
    setPreferences(prev => ({
      ...prev,
      tags: prev.tags.includes(tag)
        ? prev.tags.filter(t => t !== tag)
        : [...prev.tags, tag]
    }));
    setHasChanges(true);
  };

  const addCustomTag = () => {
    if (!newTagInput.trim()) return;
    if (preferences.customTags.includes(newTagInput.trim())) {
      toast.error('Esta tag já existe');
      return;
    }
    setPreferences(prev => ({
      ...prev,
      customTags: [...prev.customTags, newTagInput.trim()]
    }));
    setNewTagInput('');
    setHasChanges(true);
  };

  const removeCustomTag = (tag: string) => {
    setPreferences(prev => ({
      ...prev,
      customTags: prev.customTags.filter(t => t !== tag)
    }));
    setHasChanges(true);
  };

  const handleSave = async () => {
    setIsSaving(true);
    await new Promise(resolve => setTimeout(resolve, 600));
    
    updatePreferences({ ...preferences });
    
    setIsSaving(false);
    setHasChanges(false);
    toast.success('Preferências salvas! Suas recomendações serão atualizadas.');
  };

  const resetPreferences = () => {
    setPreferences({
      categories: [],
      tags: [],
      customTags: [],
      feedLayout: 'grid',
      feedSort: 'date',
      contentDensity: 'balanced',
      articlesPerPage: 10,
      hideReadArticles: false,
      showOnlyPreferred: false,
      highlightBreaking: true,
      notificationSchedule: {
        morning: true,
        afternoon: false,
        evening: true,
      },
      quietHoursStart: '22:00',
      quietHoursEnd: '07:00',
      autoBookmarkOnLike: false,
      shareToSocial: true,
      commentNotifications: true,
      contentLanguages: ['pt-BR'],
      focusMode: false,
      focusModeSettings: {
        hideSidebar: true,
        hideComments: false,
        hideRelated: true,
        readerView: true,
      },
    });
    setHasChanges(true);
    setShowResetDialog(false);
    toast.success('Preferências restauradas para o padrão');
  };

  const allTags = [...new Set([...CONTENT_CONFIG.tags.popular, ...CONTENT_CONFIG.tags.trending])];

  return (
    <>
      <main className="max-w-[1024px] mx-auto px-4 py-6 sm:py-8">
        <header className="mb-6 sm:mb-8 flex items-start justify-between">
          <section>
            <h1 className="text-2xl sm:text-3xl font-bold text-[#111111]">Preferências</h1>
            <p className="text-sm sm:text-base text-[#6b6b6b] mt-1">
              Personalize sua experiência de leitura
            </p>
          </section>
          {hasChanges && (
            <Button 
              onClick={handleSave}
              disabled={isSaving}
              className="bg-[#c40000] hover:bg-[#a00000]"
            >
              {isSaving ? (
                <>
                  <span className="w-4 h-4 mr-2 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Salvando...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  Salvar
                </>
              )}
            </Button>
          )}
        </header>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-2 sm:grid-cols-4 gap-2">
            <TabsTrigger value="interesses" className="gap-2">
              <Heart className="w-4 h-4" />
              <span className="hidden sm:inline">Interesses</span>
            </TabsTrigger>
            <TabsTrigger value="feed" className="gap-2">
              <Newspaper className="w-4 h-4" />
              <span className="hidden sm:inline">Feed</span>
            </TabsTrigger>
            <TabsTrigger value="notificacoes" className="gap-2">
              <Bell className="w-4 h-4" />
              <span className="hidden sm:inline">Notificações</span>
            </TabsTrigger>
            <TabsTrigger value="avancado" className="gap-2">
              <Sliders className="w-4 h-4" />
              <span className="hidden sm:inline">Avançado</span>
            </TabsTrigger>
          </TabsList>

          {/* ABA INTERESSES */}
          <TabsContent value="interesses" className="space-y-6">
            {/* Categorias */}
            <article className="bg-white border border-[#e5e5e5] rounded-lg p-4 sm:p-6">
              <header className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-[#fef2f2] rounded-lg">
                  <Heart className="w-5 h-5 text-[#c40000]" />
                </div>
                <section>
                  <h2 className="text-lg font-semibold text-[#111111]">Categorias de Interesse</h2>
                  <p className="text-xs text-[#6b6b6b]">
                    Selecione as categorias que você mais gosta de ler ({preferences.categories.length} selecionadas)
                  </p>
                </section>
              </header>
              
              <section className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {CATEGORIES.map(cat => (
                  <label
                    key={cat.slug}
                    className={`flex items-center gap-3 p-4 border rounded-lg cursor-pointer transition-all tap-feedback ${
                      preferences.categories.includes(cat.slug)
                        ? 'border-[#c40000] bg-[#fef2f2]'
                        : 'border-[#e5e5e5] hover:border-[#c40000]/50'
                    }`}
                  >
                    <Checkbox
                      checked={preferences.categories.includes(cat.slug)}
                      onCheckedChange={() => toggleCategory(cat.slug)}
                    />
                    <section className="flex-1">
                      <p className={`text-sm font-medium ${preferences.categories.includes(cat.slug) ? 'text-[#c40000]' : 'text-[#111111]'}`}>
                        {cat.name}
                      </p>
                      <p className="text-xs text-[#6b6b6b]">{cat.description}</p>
                    </section>
                    {preferences.categories.includes(cat.slug) && (
                      <CheckCircle className="w-4 h-4 text-[#c40000]" />
                    )}
                  </label>
                ))}
              </section>
            </article>

            {/* Tags Populares */}
            <article className="bg-white border border-[#e5e5e5] rounded-lg p-4 sm:p-6">
              <header className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-[#fef2f2] rounded-lg">
                  <Tag className="w-5 h-5 text-[#c40000]" />
                </div>
                <section>
                  <h2 className="text-lg font-semibold text-[#111111]">Tags de Interesse</h2>
                  <p className="text-xs text-[#6b6b6b]">
                    Temas que você acompanha de perto ({preferences.tags.length} selecionadas)
                  </p>
                </section>
              </header>
              
              <section className="flex flex-wrap gap-2">
                {allTags.map(tag => (
                  <button
                    key={tag}
                    type="button"
                    onClick={() => toggleTag(tag)}
                    className={`px-3 py-1.5 rounded-full text-sm transition-colors tap-feedback flex items-center gap-1.5 ${
                      preferences.tags.includes(tag)
                        ? 'bg-[#c40000] text-white'
                        : 'bg-[#f5f5f5] text-[#6b6b6b] hover:bg-[#e5e5e5]'
                    }`}
                  >
                    {preferences.tags.includes(tag) && <CheckCircle className="w-3 h-3" />}
                    {tag}
                  </button>
                ))}
              </section>
            </article>

            {/* Tags Personalizadas */}
            <article className="bg-white border border-[#e5e5e5] rounded-lg p-4 sm:p-6">
              <header className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-[#fef2f2] rounded-lg">
                  <Sparkles className="w-5 h-5 text-[#c40000]" />
                </div>
                <section>
                  <h2 className="text-lg font-semibold text-[#111111]">Tags Personalizadas</h2>
                  <p className="text-xs text-[#6b6b6b]">Adicione seus próprios temas de interesse</p>
                </section>
              </header>
              
              <section className="flex gap-2 mb-4">
                <input
                  type="text"
                  value={newTagInput}
                  onChange={(e) => setNewTagInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && addCustomTag()}
                  placeholder="Digite uma tag e pressione Enter..."
                  className="flex-1 px-4 py-2 border border-[#e5e5e5] rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-[#c40000]"
                />
                <Button onClick={addCustomTag} variant="outline">
                  Adicionar
                </Button>
              </section>
              
              {preferences.customTags.length > 0 && (
                <section className="flex flex-wrap gap-2">
                  {preferences.customTags.map(tag => (
                    <span
                      key={tag}
                      className="inline-flex items-center gap-1 px-3 py-1.5 bg-[#f0f9ff] text-[#0369a1] rounded-full text-sm"
                    >
                      {tag}
                      <button
                        onClick={() => removeCustomTag(tag)}
                        className="hover:text-[#c40000]"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  ))}
                </section>
              )}
            </article>

            {/* Resumo */}
            <aside className="p-4 bg-[#f0fdf4] border border-[#86efac] rounded-lg">
              <h3 className="text-sm font-medium text-[#166534] mb-2">Preview das suas preferências</h3>
              <section className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
                <section>
                  <p className="text-[#166534]">{preferences.categories.length}</p>
                  <p className="text-xs text-[#166534]/70">categorias</p>
                </section>
                <section>
                  <p className="text-[#166534]">{preferences.tags.length}</p>
                  <p className="text-xs text-[#166534]/70">tags populares</p>
                </section>
                <section>
                  <p className="text-[#166534]">{preferences.customTags.length}</p>
                  <p className="text-xs text-[#166534]/70">tags personalizadas</p>
                </section>
                <section>
                  <p className="text-[#166534]">{preferences.contentLanguages.length}</p>
                  <p className="text-xs text-[#166534]/70">idiomas</p>
                </section>
              </section>
            </aside>
          </TabsContent>

          {/* ABA FEED */}
          <TabsContent value="feed" className="space-y-6">
            {/* Layout do Feed */}
            <article className="bg-white border border-[#e5e5e5] rounded-lg p-4 sm:p-6">
              <header className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-[#fef2f2] rounded-lg">
                  <Layout className="w-5 h-5 text-[#c40000]" />
                </div>
                <section>
                  <h2 className="text-lg font-semibold text-[#111111]">Layout do Feed</h2>
                  <p className="text-xs text-[#6b6b6b]">Como os artigos são exibidos</p>
                </section>
              </header>
              
              <section className="grid grid-cols-3 gap-4">
                {[
                  { value: 'grid', label: 'Grade', icon: Layout, desc: 'Visual em cards' },
                  { value: 'list', label: 'Lista', icon: Newspaper, desc: 'Lista vertical' },
                  { value: 'compact', label: 'Compacto', icon: Eye, desc: 'Mais conteúdo' },
                ].map((layout) => (
                  <button
                    key={layout.value}
                    onClick={() => handlePreferenceChange('feedLayout', layout.value as FeedLayout)}
                    className={`flex flex-col items-center gap-2 p-4 border-2 rounded-lg transition-all ${
                      preferences.feedLayout === layout.value
                        ? 'border-[#c40000] bg-[#fef2f2]'
                        : 'border-[#e5e5e5] hover:border-[#c40000]/50'
                    }`}
                  >
                    <layout.icon className={`w-6 h-6 ${preferences.feedLayout === layout.value ? 'text-[#c40000]' : 'text-[#6b6b6b]'}`} />
                    <span className={`text-sm font-medium ${preferences.feedLayout === layout.value ? 'text-[#c40000]' : 'text-[#111111]'}`}>
                      {layout.label}
                    </span>
                    <span className="text-xs text-[#6b6b6b]">{layout.desc}</span>
                  </button>
                ))}
              </section>
            </article>

            {/* Ordenação e Densidade */}
            <section className="grid sm:grid-cols-2 gap-6">
              <article className="bg-white border border-[#e5e5e5] rounded-lg p-4 sm:p-6">
                <header className="flex items-center gap-3 mb-4">
                  <div className="p-2 bg-[#fef2f2] rounded-lg">
                    <TrendingUp className="w-5 h-5 text-[#c40000]" />
                  </div>
                  <section>
                    <h2 className="text-lg font-semibold text-[#111111]">Ordenação</h2>
                  </section>
                </header>
                
                <section className="space-y-2">
                  {[
                    { value: 'date', label: 'Mais recentes', desc: 'Notícias mais novas primeiro' },
                    { value: 'relevance', label: 'Relevância', desc: 'Baseado nos seus interesses' },
                    { value: 'popular', label: 'Mais populares', desc: 'Mais lidas e comentadas' },
                  ].map((sort) => (
                    <label
                      key={sort.value}
                      className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-all ${
                        preferences.feedSort === sort.value
                          ? 'border-[#c40000] bg-[#fef2f2]'
                          : 'border-[#e5e5e5] hover:border-[#c40000]/50'
                      }`}
                    >
                      <input
                        type="radio"
                        name="sort"
                        value={sort.value}
                        checked={preferences.feedSort === sort.value}
                        onChange={(e) => handlePreferenceChange('feedSort', e.target.value as FeedSort)}
                        className="accent-[#c40000]"
                      />
                      <section>
                        <p className={`text-sm font-medium ${preferences.feedSort === sort.value ? 'text-[#c40000]' : 'text-[#111111]'}`}>
                          {sort.label}
                        </p>
                        <p className="text-xs text-[#6b6b6b]">{sort.desc}</p>
                      </section>
                    </label>
                  ))}
                </section>
              </article>

              <article className="bg-white border border-[#e5e5e5] rounded-lg p-4 sm:p-6">
                <header className="flex items-center gap-3 mb-4">
                  <div className="p-2 bg-[#fef2f2] rounded-lg">
                    <BarChart3 className="w-5 h-5 text-[#c40000]" />
                  </div>
                  <section>
                    <h2 className="text-lg font-semibold text-[#111111]">Densidade do Conteúdo</h2>
                  </section>
                </header>
                
                <section className="space-y-2">
                  {[
                    { value: 'minimal', label: 'Mínima', desc: 'Apenas título e resumo' },
                    { value: 'balanced', label: 'Equilibrada', desc: 'Informações essenciais' },
                    { value: 'detailed', label: 'Detalhada', desc: 'Todas as informações' },
                  ].map((density) => (
                    <label
                      key={density.value}
                      className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-all ${
                        preferences.contentDensity === density.value
                          ? 'border-[#c40000] bg-[#fef2f2]'
                          : 'border-[#e5e5e5] hover:border-[#c40000]/50'
                      }`}
                    >
                      <input
                        type="radio"
                        name="density"
                        value={density.value}
                        checked={preferences.contentDensity === density.value}
                        onChange={(e) => handlePreferenceChange('contentDensity', e.target.value as ContentDensity)}
                        className="accent-[#c40000]"
                      />
                      <section>
                        <p className={`text-sm font-medium ${preferences.contentDensity === density.value ? 'text-[#c40000]' : 'text-[#111111]'}`}>
                          {density.label}
                        </p>
                        <p className="text-xs text-[#6b6b6b]">{density.desc}</p>
                      </section>
                    </label>
                  ))}
                </section>
              </article>
            </section>

            {/* Artigos por Página */}
            <article className="bg-white border border-[#e5e5e5] rounded-lg p-4 sm:p-6">
              <header className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-[#fef2f2] rounded-lg">
                  <Newspaper className="w-5 h-5 text-[#c40000]" />
                </div>
                <section>
                  <h2 className="text-lg font-semibold text-[#111111]">Artigos por Página</h2>
                  <p className="text-xs text-[#6b6b6b]">Quantidade de notícias exibidas de uma vez</p>
                </section>
              </header>
              
              <section className="space-y-4">
                <Slider
                  value={[preferences.articlesPerPage]}
                  onValueChange={([v]) => handlePreferenceChange('articlesPerPage', v)}
                  min={5}
                  max={50}
                  step={5}
                />
                <section className="flex justify-between text-sm text-[#6b6b6b]">
                  <span>5 artigos</span>
                  <span className="font-medium text-[#111111]">{preferences.articlesPerPage} artigos</span>
                  <span>50 artigos</span>
                </section>
              </section>
            </article>

            {/* Filtros */}
            <article className="bg-white border border-[#e5e5e5] rounded-lg p-4 sm:p-6">
              <header className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-[#fef2f2] rounded-lg">
                  <Filter className="w-5 h-5 text-[#c40000]" />
                </div>
                <section>
                  <h2 className="text-lg font-semibold text-[#111111]">Filtros de Conteúdo</h2>
                </section>
              </header>
              
              <ul className="space-y-4">
                <li className="flex items-center justify-between">
                  <section>
                    <p className="text-sm font-medium text-[#111111]">Destacar notícias urgentes</p>
                    <p className="text-xs text-[#6b6b6b]">Notícias breaking news em destaque no topo</p>
                  </section>
                  <Switch
                    checked={preferences.highlightBreaking}
                    onCheckedChange={(checked) => handlePreferenceChange('highlightBreaking', checked)}
                  />
                </li>
                <li className="flex items-center justify-between">
                  <section>
                    <p className="text-sm font-medium text-[#111111]">Ocultar artigos já lidos</p>
                    <p className="text-xs text-[#6b6b6b]">Não mostrar artigos que você já leu</p>
                  </section>
                  <Switch
                    checked={preferences.hideReadArticles}
                    onCheckedChange={(checked) => handlePreferenceChange('hideReadArticles', checked)}
                  />
                </li>
                <li className="flex items-center justify-between">
                  <section>
                    <p className="text-sm font-medium text-[#111111]">Apenas conteúdo preferido</p>
                    <p className="text-xs text-[#6b6b6b]">Mostrar apenas artigos das suas categorias favoritas</p>
                  </section>
                  <Switch
                    checked={preferences.showOnlyPreferred}
                    onCheckedChange={(checked) => handlePreferenceChange('showOnlyPreferred', checked)}
                  />
                </li>
              </ul>
            </article>
          </TabsContent>

          {/* ABA NOTIFICAÇÕES */}
          <TabsContent value="notificacoes" className="space-y-6">
            {/* Horários */}
            <article className="bg-white border border-[#e5e5e5] rounded-lg p-4 sm:p-6">
              <header className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-[#fef2f2] rounded-lg">
                  <Clock className="w-5 h-5 text-[#c40000]" />
                </div>
                <section>
                  <h2 className="text-lg font-semibold text-[#111111]">Horários de Notificação</h2>
                  <p className="text-xs text-[#6b6b6b]">Quando você deseja receber alertas</p>
                </section>
              </header>
              
              <ul className="space-y-3">
                <li className="flex items-center justify-between p-3 bg-[#f8fafc] rounded-lg">
                  <section className="flex items-center gap-3">
                    <section className="p-2 bg-[#fef2f2] rounded">
                      <Zap className="w-4 h-4 text-[#c40000]" />
                    </section>
                    <section>
                      <p className="text-sm font-medium text-[#111111]">Manhã (08:00)</p>
                      <p className="text-xs text-[#6b6b6b]">Resumo das notícias da manhã</p>
                    </section>
                  </section>
                  <Switch
                    checked={preferences.notificationSchedule.morning}
                    onCheckedChange={(checked) => 
                      handlePreferenceChange('notificationSchedule', { ...preferences.notificationSchedule, morning: checked })
                    }
                  />
                </li>
                <li className="flex items-center justify-between p-3 bg-[#f8fafc] rounded-lg">
                  <section className="flex items-center gap-3">
                    <section className="p-2 bg-[#fef2f2] rounded">
                      <Sun className="w-4 h-4 text-[#c40000]" />
                    </section>
                    <section>
                      <p className="text-sm font-medium text-[#111111]">Tarde (14:00)</p>
                      <p className="text-xs text-[#6b6b6b]">Atualizações do meio do dia</p>
                    </section>
                  </section>
                  <Switch
                    checked={preferences.notificationSchedule.afternoon}
                    onCheckedChange={(checked) => 
                      handlePreferenceChange('notificationSchedule', { ...preferences.notificationSchedule, afternoon: checked })
                    }
                  />
                </li>
                <li className="flex items-center justify-between p-3 bg-[#f8fafc] rounded-lg">
                  <section className="flex items-center gap-3">
                    <section className="p-2 bg-[#fef2f2] rounded">
                      <Moon className="w-4 h-4 text-[#c40000]" />
                    </section>
                    <section>
                      <p className="text-sm font-medium text-[#111111]">Noite (20:00)</p>
                      <p className="text-xs text-[#6b6b6b]">Resumo do dia</p>
                    </section>
                  </section>
                  <Switch
                    checked={preferences.notificationSchedule.evening}
                    onCheckedChange={(checked) => 
                      handlePreferenceChange('notificationSchedule', { ...preferences.notificationSchedule, evening: checked })
                    }
                  />
                </li>
              </ul>
            </article>

            {/* Horário de Silêncio */}
            <article className="bg-white border border-[#e5e5e5] rounded-lg p-4 sm:p-6">
              <header className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-[#fef2f2] rounded-lg">
                  <Moon className="w-5 h-5 text-[#c40000]" />
                </div>
                <section>
                  <h2 className="text-lg font-semibold text-[#111111]">Horário de Silêncio</h2>
                  <p className="text-xs text-[#6b6b6b]">Não enviar notificações durante este período</p>
                </section>
              </header>
              
              <section className="grid grid-cols-2 gap-4">
                <fieldset>
                  <Label className="text-sm text-[#111111]">Início</Label>
                  <input
                    type="time"
                    value={preferences.quietHoursStart}
                    onChange={(e) => handlePreferenceChange('quietHoursStart', e.target.value)}
                    className="w-full mt-1.5 px-4 py-2 border border-[#e5e5e5] rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-[#c40000]"
                  />
                </fieldset>
                <fieldset>
                  <Label className="text-sm text-[#111111]">Fim</Label>
                  <input
                    type="time"
                    value={preferences.quietHoursEnd}
                    onChange={(e) => handlePreferenceChange('quietHoursEnd', e.target.value)}
                    className="w-full mt-1.5 px-4 py-2 border border-[#e5e5e5] rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-[#c40000]"
                  />
                </fieldset>
              </section>
            </article>

            {/* Interações */}
            <article className="bg-white border border-[#e5e5e5] rounded-lg p-4 sm:p-6">
              <header className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-[#fef2f2] rounded-lg">
                  <MessageCircle className="w-5 h-5 text-[#c40000]" />
                </div>
                <section>
                  <h2 className="text-lg font-semibold text-[#111111]">Notificações de Interação</h2>
                </section>
              </header>
              
              <ul className="space-y-4">
                <li className="flex items-center justify-between">
                  <section>
                    <p className="text-sm font-medium text-[#111111]">Respostas aos comentários</p>
                    <p className="text-xs text-[#6b6b6b]">Notificar quando alguém responder seus comentários</p>
                  </section>
                  <Switch
                    checked={preferences.commentNotifications}
                    onCheckedChange={(checked) => handlePreferenceChange('commentNotifications', checked)}
                  />
                </li>
                <li className="flex items-center justify-between">
                  <section>
                    <p className="text-sm font-medium text-[#111111]">Auto-favoritar ao curtir</p>
                    <p className="text-xs text-[#6b6b6b]">Adicionar aos favoritos automaticamente ao curtir</p>
                  </section>
                  <Switch
                    checked={preferences.autoBookmarkOnLike}
                    onCheckedChange={(checked) => handlePreferenceChange('autoBookmarkOnLike', checked)}
                  />
                </li>
              </ul>
            </article>
          </TabsContent>

          {/* ABA AVANÇADO */}
          <TabsContent value="avancado" className="space-y-6">
            {/* Modo Foco */}
            <article className="bg-white border border-[#e5e5e5] rounded-lg p-4 sm:p-6">
              <header className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-[#fef2f2] rounded-lg">
                  <Target className="w-5 h-5 text-[#c40000]" />
                </div>
                <section>
                  <h2 className="text-lg font-semibold text-[#111111]">Modo Foco</h2>
                  <p className="text-xs text-[#6b6b6b]">Ambiente de leitura sem distrações</p>
                </section>
              </header>
              
              <section className="space-y-4">
                <section className="flex items-center justify-between">
                  <section>
                    <p className="text-sm font-medium text-[#111111]">Ativar Modo Foco</p>
                    <p className="text-xs text-[#6b6b6b]">Leitura imersiva sem elementos distrativos</p>
                  </section>
                  <Switch
                    checked={preferences.focusMode}
                    onCheckedChange={(checked) => handlePreferenceChange('focusMode', checked)}
                  />
                </section>
                
                {preferences.focusMode && (
                  <section className="p-4 bg-[#f8fafc] rounded-lg space-y-3">
                    <label className="flex items-center gap-2">
                      <Checkbox
                        checked={preferences.focusModeSettings.hideSidebar}
                        onCheckedChange={(checked) => 
                          handlePreferenceChange('focusModeSettings', { 
                            ...preferences.focusModeSettings, 
                            hideSidebar: checked as boolean 
                          })
                        }
                      />
                      <span className="text-sm text-[#111111]">Ocultar barra lateral</span>
                    </label>
                    <label className="flex items-center gap-2">
                      <Checkbox
                        checked={preferences.focusModeSettings.hideComments}
                        onCheckedChange={(checked) => 
                          handlePreferenceChange('focusModeSettings', { 
                            ...preferences.focusModeSettings, 
                            hideComments: checked as boolean 
                          })
                        }
                      />
                      <span className="text-sm text-[#111111]">Ocultar comentários</span>
                    </label>
                    <label className="flex items-center gap-2">
                      <Checkbox
                        checked={preferences.focusModeSettings.hideRelated}
                        onCheckedChange={(checked) => 
                          handlePreferenceChange('focusModeSettings', { 
                            ...preferences.focusModeSettings, 
                            hideRelated: checked as boolean 
                          })
                        }
                      />
                      <span className="text-sm text-[#111111]">Ocultar artigos relacionados</span>
                    </label>
                    <label className="flex items-center gap-2">
                      <Checkbox
                        checked={preferences.focusModeSettings.readerView}
                        onCheckedChange={(checked) => 
                          handlePreferenceChange('focusModeSettings', { 
                            ...preferences.focusModeSettings, 
                            readerView: checked as boolean 
                          })
                        }
                      />
                      <span className="text-sm text-[#111111]">Ativar visual de leitura</span>
                    </label>
                  </section>
                )}
              </section>
            </article>

            {/* Idiomas de Conteúdo */}
            <article className="bg-white border border-[#e5e5e5] rounded-lg p-4 sm:p-6">
              <header className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-[#fef2f2] rounded-lg">
                  <Globe className="w-5 h-5 text-[#c40000]" />
                </div>
                <section>
                  <h2 className="text-lg font-semibold text-[#111111]">Idiomas de Conteúdo</h2>
                  <p className="text-xs text-[#6b6b6b]">Quais idiomas você deseja ver no feed</p>
                </section>
              </header>
              
              <section className="space-y-2">
                {[
                  { code: 'pt-BR', label: 'Português (Brasil)' },
                  { code: 'pt-PT', label: 'Português (Portugal)' },
                  { code: 'en', label: 'English' },
                  { code: 'es', label: 'Español' },
                ].map((lang) => (
                  <label
                    key={lang.code}
                    className="flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-all hover:border-[#c40000]/50"
                  >
                    <Checkbox
                      checked={preferences.contentLanguages.includes(lang.code)}
                      onCheckedChange={(checked) => {
                        if (checked) {
                          handlePreferenceChange('contentLanguages', [...preferences.contentLanguages, lang.code]);
                        } else {
                          handlePreferenceChange('contentLanguages', preferences.contentLanguages.filter(l => l !== lang.code));
                        }
                      }}
                    />
                    <span className="text-sm text-[#111111]">{lang.label}</span>
                  </label>
                ))}
              </section>
            </article>

            {/* Restaurar Padrões */}
            <article className="bg-white border border-[#e5e5e5] rounded-lg p-4 sm:p-6">
              <header className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-[#fef2f2] rounded-lg">
                  <RotateCcw className="w-5 h-5 text-[#c40000]" />
                </div>
                <section>
                  <h2 className="text-lg font-semibold text-[#111111]">Restaurar Padrões</h2>
                  <p className="text-xs text-[#6b6b6b]">Voltar todas as preferências ao estado inicial</p>
                </section>
              </header>
              
              <Button
                variant="outline"
                onClick={() => setShowResetDialog(true)}
                className="w-full justify-center gap-2"
              >
                <RotateCcw className="w-4 h-4" />
                Restaurar preferências padrão
              </Button>
            </article>
          </TabsContent>
        </Tabs>

        {/* Botão flutuante para salvar em mobile */}
        {hasChanges && (
          <section className="fixed bottom-6 right-6 sm:hidden">
            <Button 
              onClick={handleSave}
              disabled={isSaving}
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
              <DialogTitle>Restaurar preferências padrão?</DialogTitle>
              <DialogDescription>
                Todas as suas preferências personalizadas serão perdidas e restauradas para o estado inicial.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowResetDialog(false)}>
                Cancelar
              </Button>
              <Button onClick={resetPreferences} className="bg-[#c40000] hover:bg-[#a00000]">
                Restaurar
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </main>
    </>
  );
}
