/**
 * Admin - Criar/Editar Notícia
 * Formulário completo para gerenciamento de artigos
 */

import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Link } from 'react-router-dom';
import { 
  Save, 
  Eye, 
  ArrowLeft, 
  AlertCircle, 
  CheckCircle,
  Image as ImageIcon,
  Tag
} from 'lucide-react';
import { ROUTES } from '@/config/routes';
import { mockArticles, getArticleBySlug } from '@/services/newsService';
import { CONTENT_CONFIG, getCategory } from '@/config/content';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export function AdminNewsEdit() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const isEditing = !!slug;
  
  const [formData, setFormData] = useState({
    title: '',
    slug: '',
    excerpt: '',
    content: '',
    category: 'economia',
    author: '',
    tags: '',
    coverImage: '',
    seoTitle: '',
    seoDescription: '',
    breaking: false,
    featured: false,
  });
  
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSaving, setIsSaving] = useState(false);
  const [showPreview, setShowPreview] = useState(false);

  // Carregar dados se estiver editando
  useEffect(() => {
    if (isEditing && slug) {
      const article = getArticleBySlug(slug);
      if (article) {
        setFormData({
          title: article.title,
          slug: article.slug,
          excerpt: article.excerpt,
          content: article.content.replace(/<[^>]*>/g, ''), // Strip HTML para textarea
          category: article.category,
          author: article.author,
          tags: article.tags.join(', '),
          coverImage: article.coverImage,
          seoTitle: article.title,
          seoDescription: article.excerpt.slice(0, 160),
          breaking: article.breaking,
          featured: article.featured,
        });
      }
    }
  }, [isEditing, slug]);

  // Gerar slug automático
  const generateSlug = (title: string): string => {
    return title
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^\w\s-]/g, '')
      .replace(/\s+/g, '-')
      .slice(0, 60);
  };

  const handleTitleChange = (title: string) => {
    setFormData(prev => ({
      ...prev,
      title,
      slug: prev.slug || generateSlug(title),
      seoTitle: title,
    }));
  };

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};
    
    if (!formData.title.trim()) newErrors.title = 'Título é obrigatório';
    if (!formData.slug.trim()) newErrors.slug = 'Slug é obrigatório';
    if (!formData.excerpt.trim()) newErrors.excerpt = 'Resumo é obrigatório';
    if (formData.excerpt.length < 50) newErrors.excerpt = 'Resumo deve ter pelo menos 50 caracteres';
    if (!formData.content.trim()) newErrors.content = 'Conteúdo é obrigatório';
    if (!formData.author.trim()) newErrors.author = 'Autor é obrigatório';
    
    // Verificar slug duplicado
    const existing = mockArticles.find(a => a.slug === formData.slug && a.slug !== slug);
    if (existing) newErrors.slug = 'Este slug já está em uso';
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async () => {
    if (!validate()) return;
    
    setIsSaving(true);
    
    // Simular delay de API
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Em produção: salvar no backend
    // Aqui apenas simulamos
    
    setIsSaving(false);
    alert(isEditing ? 'Artigo atualizado!' : 'Artigo criado!');
    navigate(ROUTES.admin.noticias);
  };

  const handleChange = (field: string, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  return (
    <>
      <title>{isEditing ? 'Editar' : 'Nova'} Notícia - Admin PEM</title>

      <main className="max-w-[1280px] mx-auto px-4 py-6 sm:py-8">
        {/* Header */}
        <header className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <section className="flex items-center gap-3">
            <Link 
              to={ROUTES.admin.noticias}
              className="p-2 hover:bg-[#f5f5f5] rounded-lg"
            >
              <ArrowLeft className="w-5 h-5 text-[#6b6b6b]" />
            </Link>
            <section>
              <h1 className="text-2xl sm:text-3xl font-bold text-[#111111]">
                {isEditing ? 'Editar Notícia' : 'Nova Notícia'}
              </h1>
              <p className="text-sm text-[#6b6b6b]">
                {isEditing ? `Editando: ${formData.title}` : 'Crie um novo artigo'}
              </p>
            </section>
          </section>
          <section className="flex gap-2">
            <Button 
              variant="outline"
              onClick={() => setShowPreview(!showPreview)}
            >
              <Eye className="w-4 h-4 mr-2" />
              {showPreview ? 'Editar' : 'Preview'}
            </Button>
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
          </section>
        </header>

        {showPreview ? (
          // Preview
          <section className="bg-white border border-[#e5e5e5] rounded-lg p-6 sm:p-8">
            <span 
              className="inline-block px-3 py-1 text-xs font-bold uppercase tracking-wider text-white rounded mb-4"
              style={{ backgroundColor: getCategory(formData.category)?.color }}
            >
              {getCategory(formData.category)?.name}
            </span>
            <h1 className="text-2xl sm:text-3xl font-bold text-[#111111] mb-4">
              {formData.title || 'Título do Artigo'}
            </h1>
            <p className="text-lg text-[#6b6b6b] mb-6">
              {formData.excerpt || 'Resumo do artigo...'}
            </p>
            {formData.coverImage && (
              <img 
                src={formData.coverImage} 
                alt="" 
                className="w-full aspect-video object-cover rounded-lg mb-6"
              />
            )}
            <section className="prose max-w-none">
              <p>{formData.content || 'Conteúdo do artigo...'}</p>
            </section>
          </section>
        ) : (
          // Formulário
          <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Coluna Principal */}
            <section className="lg:col-span-2 space-y-6">
              {/* Título */}
              <article className="bg-white border border-[#e5e5e5] rounded-lg p-4 sm:p-6">
                <fieldset>
                  <Label htmlFor="title" className="text-sm font-medium text-[#111111]">
                    Título *
                  </Label>
                  <Input
                    id="title"
                    value={formData.title}
                    onChange={(e) => handleTitleChange(e.target.value)}
                    placeholder="Título do artigo"
                    className={`mt-1.5 ${errors.title ? 'border-[#ef4444]' : ''}`}
                  />
                  {errors.title && (
                    <p className="mt-1 text-xs text-[#ef4444] flex items-center gap-1">
                      <AlertCircle className="w-3 h-3" />
                      {errors.title}
                    </p>
                  )}
                </fieldset>

                <fieldset className="mt-4">
                  <Label htmlFor="slug" className="text-sm font-medium text-[#111111]">
                    Slug *
                  </Label>
                  <Input
                    id="slug"
                    value={formData.slug}
                    onChange={(e) => handleChange('slug', e.target.value)}
                    placeholder="url-amigavel-do-artigo"
                    className={`mt-1.5 ${errors.slug ? 'border-[#ef4444]' : ''}`}
                  />
                  {errors.slug && (
                    <p className="mt-1 text-xs text-[#ef4444] flex items-center gap-1">
                      <AlertCircle className="w-3 h-3" />
                      {errors.slug}
                    </p>
                  )}
                </fieldset>

                <fieldset className="mt-4">
                  <Label htmlFor="excerpt" className="text-sm font-medium text-[#111111]">
                    Resumo *
                  </Label>
                  <textarea
                    id="excerpt"
                    value={formData.excerpt}
                    onChange={(e) => handleChange('excerpt', e.target.value)}
                    placeholder="Breve resumo do artigo (será exibido nas listagens)"
                    rows={3}
                    className={`w-full mt-1.5 px-3 py-2 border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-[#c40000] ${errors.excerpt ? 'border-[#ef4444]' : 'border-[#e5e5e5]'}`}
                  />
                  <p className="mt-1 text-xs text-[#6b6b6b]">
                    {formData.excerpt.length}/300 caracteres
                  </p>
                  {errors.excerpt && (
                    <p className="mt-1 text-xs text-[#ef4444] flex items-center gap-1">
                      <AlertCircle className="w-3 h-3" />
                      {errors.excerpt}
                    </p>
                  )}
                </fieldset>

                <fieldset className="mt-4">
                  <Label htmlFor="content" className="text-sm font-medium text-[#111111]">
                    Conteúdo *
                  </Label>
                  <textarea
                    id="content"
                    value={formData.content}
                    onChange={(e) => handleChange('content', e.target.value)}
                    placeholder="Conteúdo completo do artigo"
                    rows={15}
                    className={`w-full mt-1.5 px-3 py-2 border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-[#c40000] ${errors.content ? 'border-[#ef4444]' : 'border-[#e5e5e5]'}`}
                  />
                  {errors.content && (
                    <p className="mt-1 text-xs text-[#ef4444] flex items-center gap-1">
                      <AlertCircle className="w-3 h-3" />
                      {errors.content}
                    </p>
                  )}
                </fieldset>
              </article>

              {/* SEO */}
              <article className="bg-white border border-[#e5e5e5] rounded-lg p-4 sm:p-6">
                <header className="flex items-center gap-2 mb-4">
                  <CheckCircle className="w-5 h-5 text-[#22c55e]" />
                  <h2 className="text-lg font-semibold text-[#111111]">SEO</h2>
                </header>

                <fieldset>
                  <Label htmlFor="seoTitle" className="text-sm font-medium text-[#111111]">
                    Título SEO
                  </Label>
                  <Input
                    id="seoTitle"
                    value={formData.seoTitle}
                    onChange={(e) => handleChange('seoTitle', e.target.value)}
                    placeholder="Título para SEO"
                    className="mt-1.5"
                  />
                </fieldset>

                <fieldset className="mt-4">
                  <Label htmlFor="seoDescription" className="text-sm font-medium text-[#111111]">
                    Descrição SEO
                  </Label>
                  <textarea
                    id="seoDescription"
                    value={formData.seoDescription}
                    onChange={(e) => handleChange('seoDescription', e.target.value)}
                    placeholder="Descrição para SEO (meta description)"
                    rows={2}
                    className="w-full mt-1.5 px-3 py-2 border border-[#e5e5e5] rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-[#c40000]"
                  />
                  <p className="mt-1 text-xs text-[#6b6b6b]">
                    {formData.seoDescription.length}/160 caracteres
                  </p>
                </fieldset>
              </article>
            </section>

            {/* Sidebar */}
            <aside className="space-y-6">
              {/* Publicação */}
              <article className="bg-white border border-[#e5e5e5] rounded-lg p-4 sm:p-6">
                <h2 className="text-lg font-semibold text-[#111111] mb-4">Publicação</h2>
                
                <ul className="space-y-3">
                  <li>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.featured}
                        onChange={(e) => handleChange('featured', e.target.checked)}
                        className="w-4 h-4 accent-[#c40000]"
                      />
                      <span className="text-sm text-[#111111]">Destacar na home</span>
                    </label>
                  </li>
                  <li>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.breaking}
                        onChange={(e) => handleChange('breaking', e.target.checked)}
                        className="w-4 h-4 accent-[#c40000]"
                      />
                      <span className="text-sm text-[#111111]">Marcar como urgente</span>
                    </label>
                  </li>
                </ul>
              </article>

              {/* Categoria */}
              <article className="bg-white border border-[#e5e5e5] rounded-lg p-4 sm:p-6">
                <h2 className="text-lg font-semibold text-[#111111] mb-4">Categoria</h2>
                <select
                  value={formData.category}
                  onChange={(e) => handleChange('category', e.target.value)}
                  className="w-full px-3 py-2 border border-[#e5e5e5] rounded-md text-sm"
                >
                  {Object.values(CONTENT_CONFIG.categories).map(cat => (
                    <option key={cat.slug} value={cat.slug}>{cat.name}</option>
                  ))}
                </select>
              </article>

              {/* Imagem */}
              <article className="bg-white border border-[#e5e5e5] rounded-lg p-4 sm:p-6">
                <header className="flex items-center gap-2 mb-4">
                  <ImageIcon className="w-5 h-5 text-[#6b6b6b]" />
                  <h2 className="text-lg font-semibold text-[#111111]">Imagem de Capa</h2>
                </header>
                <Input
                  value={formData.coverImage}
                  onChange={(e) => handleChange('coverImage', e.target.value)}
                  placeholder="URL da imagem"
                />
                {formData.coverImage && (
                  <img 
                    src={formData.coverImage} 
                    alt="" 
                    className="mt-3 w-full aspect-video object-cover rounded-lg"
                  />
                )}
              </article>

              {/* Tags */}
              <article className="bg-white border border-[#e5e5e5] rounded-lg p-4 sm:p-6">
                <header className="flex items-center gap-2 mb-4">
                  <Tag className="w-5 h-5 text-[#6b6b6b]" />
                  <h2 className="text-lg font-semibold text-[#111111]">Tags</h2>
                </header>
                <Input
                  value={formData.tags}
                  onChange={(e) => handleChange('tags', e.target.value)}
                  placeholder="tag1, tag2, tag3"
                />
                <p className="mt-1 text-xs text-[#6b6b6b]">
                  Separe as tags por vírgula
                </p>
              </article>

              {/* Autor */}
              <article className="bg-white border border-[#e5e5e5] rounded-lg p-4 sm:p-6">
                <h2 className="text-lg font-semibold text-[#111111] mb-4">Autor</h2>
                <Input
                  value={formData.author}
                  onChange={(e) => handleChange('author', e.target.value)}
                  placeholder="Nome do autor"
                  className={errors.author ? 'border-[#ef4444]' : ''}
                />
                {errors.author && (
                  <p className="mt-1 text-xs text-[#ef4444]">{errors.author}</p>
                )}
              </article>
            </aside>
          </section>
        )}
      </main>
    </>
  );
}
