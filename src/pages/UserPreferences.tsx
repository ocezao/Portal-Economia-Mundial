/**
 * Preferências do Usuário
 * Configuração de categorias, tags e recomendações
 */

import { useState } from 'react';
import { Heart, Tag, Sliders, Save, CheckCircle } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { toast } from 'sonner';
import { CATEGORIES } from '@/config/routes';
import { CONTENT_CONFIG } from '@/config/content';

export function UserPreferences() {
  const { user, updatePreferences } = useAuth();
  
  const [selectedCategories, setSelectedCategories] = useState<string[]>(
    user?.preferences?.categories || []
  );
  const [selectedTags, setSelectedTags] = useState<string[]>(
    user?.preferences?.tags || []
  );
  const [isSaving, setIsSaving] = useState(false);

  const toggleCategory = (slug: string) => {
    setSelectedCategories(prev => 
      prev.includes(slug) 
        ? prev.filter(c => c !== slug)
        : [...prev, slug]
    );
  };

  const toggleTag = (tag: string) => {
    setSelectedTags(prev => 
      prev.includes(tag) 
        ? prev.filter(t => t !== tag)
        : [...prev, tag]
    );
  };

  const handleSave = async () => {
    setIsSaving(true);
    
    // Simular delay de API
    await new Promise(resolve => setTimeout(resolve, 600));
    
    updatePreferences({
      categories: selectedCategories,
      tags: selectedTags,
    });
    
    setIsSaving(false);
    toast.success('Preferências salvas! Suas recomendações serão atualizadas.');
  };

  return (
    <>
      <title>Preferências - Portal Econômico Mundial</title>

      <main className="max-w-[768px] mx-auto px-4 py-6 sm:py-8">
        <header className="mb-6 sm:mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-[#111111]">Preferências</h1>
          <p className="text-sm sm:text-base text-[#6b6b6b] mt-1">
            Personalize seu feed de notícias
          </p>
        </header>

        <section className="space-y-6">
          {/* Categorias */}
          <article className="bg-white border border-[#e5e5e5] rounded-lg p-4 sm:p-6">
            <header className="flex items-center gap-2 mb-4">
              <Heart className="w-5 h-5 text-[#c40000]" />
              <h2 className="text-lg font-semibold text-[#111111]">Categorias de interesse</h2>
            </header>
            <p className="text-sm text-[#6b6b6b] mb-4">
              Selecione as categorias que você mais gosta de ler.
            </p>
            
            <ul className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {CATEGORIES.map(cat => (
                <li key={cat.slug}>
                  <label className="flex items-center gap-2 p-3 border border-[#e5e5e5] rounded-lg cursor-pointer hover:border-[#c40000] transition-colors tap-feedback">
                    <Checkbox
                      checked={selectedCategories.includes(cat.slug)}
                      onCheckedChange={() => toggleCategory(cat.slug)}
                    />
                    <span className="text-sm text-[#111111]">{cat.name}</span>
                  </label>
                </li>
              ))}
            </ul>
          </article>

          {/* Tags */}
          <article className="bg-white border border-[#e5e5e5] rounded-lg p-4 sm:p-6">
            <header className="flex items-center gap-2 mb-4">
              <Tag className="w-5 h-5 text-[#c40000]" />
              <h2 className="text-lg font-semibold text-[#111111]">Tags de interesse</h2>
            </header>
            <p className="text-sm text-[#6b6b6b] mb-4">
              Selecione os temas que você acompanha de perto.
            </p>
            
            <ul className="flex flex-wrap gap-2">
              {CONTENT_CONFIG.tags.popular.map(tag => (
                <li key={tag}>
                  <button
                    type="button"
                    onClick={() => toggleTag(tag)}
                    className={`px-3 py-1.5 rounded-full text-sm transition-colors tap-feedback ${
                      selectedTags.includes(tag)
                        ? 'bg-[#c40000] text-white'
                        : 'bg-[#f5f5f5] text-[#6b6b6b] hover:bg-[#e5e5e5]'
                    }`}
                  >
                    {selectedTags.includes(tag) && (
                      <CheckCircle className="w-3 h-3 inline mr-1" />
                    )}
                    {tag}
                  </button>
                </li>
              ))}
            </ul>
          </article>

          {/* Intensidade de recomendação */}
          <article className="bg-white border border-[#e5e5e5] rounded-lg p-4 sm:p-6">
            <header className="flex items-center gap-2 mb-4">
              <Sliders className="w-5 h-5 text-[#c40000]" />
              <h2 className="text-lg font-semibold text-[#111111]">Intensidade das recomendações</h2>
            </header>
            <p className="text-sm text-[#6b6b6b] mb-4">
              Quão personalizado você quer que seu feed seja?
            </p>
            
            <section className="space-y-3">
              <input
                type="range"
                min="1"
                max="3"
                defaultValue="2"
                className="w-full accent-[#c40000]"
              />
              <section className="flex justify-between text-xs text-[#6b6b6b]">
                <span>Equilibrado</span>
                <span>Personalizado</span>
                <span>Apenas meus temas</span>
              </section>
            </section>
          </article>

          {/* Preview */}
          <aside className="p-4 bg-[#f0fdf4] border border-[#22c55e] rounded-lg">
            <h3 className="text-sm font-medium text-[#166534] mb-2">Preview das suas preferências</h3>
            <ul className="space-y-1 text-sm text-[#166534]">
              <li>• {selectedCategories.length} categorias selecionadas</li>
              <li>• {selectedTags.length} tags de interesse</li>
            </ul>
          </aside>

          {/* Ações */}
          <footer className="flex justify-end">
            <Button
              onClick={handleSave}
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
                  Salvar preferências
                </>
              )}
            </Button>
          </footer>
        </section>
      </main>
    </>
  );
}
