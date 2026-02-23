/**
 * Admin - Nova Noticia
 * Formulario completo com editor rich text, upload de imagens, auto-save e agendamento
 */

'use client';

import { useState, useEffect, useRef } from 'react';

import { useRouter } from 'next/navigation';
import { 
  Save, 
  Eye, 
  ArrowLeft, 
  AlertCircle,
  Image as ImageIcon,
  Tag,
  Type,
  Bold,
  Italic,
  List,
  Heading1,
  Heading2,
  Quote,
  Link as LinkIcon,
  Clock,
  Check,
  X,
  Trash2,
  Upload,
  Globe,
  FileText,
  Calendar,
  User,
  Clock3,
  Play
} from 'lucide-react';

import { 
  generateSlug, 
  isSlugAvailable,
  scheduleArticle,
} from '@/services/newsManager';
import { createArticleApi } from '@/services/articleApi';
import { listAdminAuthors } from '@/services/adminAuthors';
import { CONTENT_CONFIG } from '@/config/content';
import { ALL_CATEGORIES } from '@/config/routes';
import type { Author } from '@/config/authors';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
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
import { Progress } from '@/components/ui/progress';
import { sanitizeHtml } from '@/lib/sanitize';
import { secureStorage } from '@/config/storage';

export default function AdminNewsNewPage() {
  const router = useRouter();
  const contentRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const autoSaveRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  
  // Modo de publicacao
  const [publishMode, setPublishMode] = useState<'now' | 'schedule'>('now');
  const [authors, setAuthors] = useState<Author[]>([]);
  
  // Dados do formulario
  const [formData, setFormData] = useState({
    title: '',
    slug: '',
    excerpt: '',
    content: '',
    category: 'economia',
    author: '',
    authorId: '',
    tags: [] as string[],
    tagInput: '',
    coverImage: '',
    seoTitle: '',
    seoDescription: '',
    breaking: false,
    featured: false,
    // FAQ
    faqs: [] as Array<{ question: string; answer: string }>,
    // Agendamento
    scheduledDate: '',
    scheduledTime: '',
    timezone: 'America/Sao_Paulo',
  });
  
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSaving, setIsSaving] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [hasChanges, setHasChanges] = useState(false);
  const [showExitDialog, setShowExitDialog] = useState(false);
  const [activeTab, setActiveTab] = useState('content');

  // Inicializar dados padrao para nova noticia
  useEffect(() => {
    let isMounted = true;

    const load = async () => {
      try {
        const allAuthors = await listAdminAuthors();
        if (!isMounted) return;

        const activeAuthors = (allAuthors ?? []).filter((author) => author.isActive);
        setAuthors(activeAuthors);

        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        const defaultAuthor = activeAuthors.find((author) => author.editor) ?? activeAuthors[0];

        setFormData((prev) => ({
          ...prev,
          author: defaultAuthor?.name ?? '',
          authorId: defaultAuthor?.slug ?? '',
          scheduledDate: prev.scheduledDate || tomorrow.toISOString().split('T')[0],
          scheduledTime: prev.scheduledTime || '09:00',
        }));
      } catch {
        if (!isMounted) return;
        setAuthors([]);
        toast.error('Erro ao carregar perfis profissionais');
      }
    };

    void load();
    return () => {
      isMounted = false;
    };
  }, []);

  // Auto-save
  useEffect(() => {
    if (hasChanges && formData.title) {
      autoSaveRef.current = setTimeout(() => {
        secureStorage.set('cin_draft_article', formData);
        setLastSaved(new Date());
      }, 30000);
    }
    
    return () => {
      if (autoSaveRef.current) {
        clearTimeout(autoSaveRef.current);
      }
    };
  }, [formData, hasChanges]);

  // Alertar ao sair com alteracoes
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (hasChanges) {
        e.preventDefault();
        e.returnValue = '';
      }
    };
    
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [hasChanges]);

  const handleTitleChange = (title: string) => {
    setFormData(prev => {
      const newSlug = prev.slug || generateSlug(title);
      return {
        ...prev,
        title,
        slug: newSlug,
        seoTitle: title,
      };
    });
    setHasChanges(true);
    if (errors.title) setErrors(prev => ({ ...prev, title: '' }));
  };

  const handleSlugChange = (newSlug: string) => {
    setFormData(prev => ({ ...prev, slug: newSlug }));
    setHasChanges(true);
    if (errors.slug) setErrors(prev => ({ ...prev, slug: '' }));
  };

  const handleChange = (field: string, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setHasChanges(true);
    if (errors[field]) setErrors(prev => ({ ...prev, [field]: '' }));
  };

  const addTag = () => {
    const tag = formData.tagInput.trim();
    if (!tag) return;
    if (formData.tags.includes(tag)) {
      toast.error('Esta tag ja existe');
      return;
    }
    setFormData(prev => ({
      ...prev,
      tags: [...prev.tags, tag],
      tagInput: ''
    }));
    setHasChanges(true);
  };

  const removeTag = (tagToRemove: string) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.filter(t => t !== tagToRemove)
    }));
    setHasChanges(true);
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    if (!file.type.startsWith('image/')) {
      toast.error('Por favor, selecione uma imagem valida');
      return;
    }
    
    if (file.size > 5 * 1024 * 1024) {
      toast.error('A imagem deve ter no maximo 5MB');
      return;
    }
    
    const reader = new FileReader();
    reader.onload = (event) => {
      const result = event.target?.result as string;
      setFormData(prev => ({ ...prev, coverImage: result }));
      setHasChanges(true);
      toast.success('Imagem carregada com sucesso!');
    };
    reader.readAsDataURL(file);
  };

  const insertFormat = (format: string) => {
    const textarea = contentRef.current;
    if (!textarea) return;
    
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const text = formData.content;
    const selectedText = text.substring(start, end);
    
    let formattedText = '';
    switch (format) {
      case 'bold':
        formattedText = `<strong>${selectedText || 'texto em negrito'}</strong>`;
        break;
      case 'italic':
        formattedText = `<em>${selectedText || 'texto em italico'}</em>`;
        break;
      case 'h2':
        formattedText = `<h2>${selectedText || 'Titulo'}</h2>`;
        break;
      case 'h3':
        formattedText = `<h3>${selectedText || 'Subtitulo'}</h3>`;
        break;
      case 'quote':
        formattedText = `<blockquote>${selectedText || 'Citacao'}</blockquote>`;
        break;
      case 'list':
        formattedText = `<ul>\n  <li>${selectedText || 'Item'}</li>\n</ul>`;
        break;
      case 'link':
        formattedText = `<a href="https://">${selectedText || 'link'}</a>`;
        break;
      default:
        formattedText = selectedText;
    }
    
    const newContent = text.substring(0, start) + formattedText + text.substring(end);
    setFormData(prev => ({ ...prev, content: newContent }));
    setHasChanges(true);
    
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + formattedText.length, start + formattedText.length);
    }, 0);
  };

  const validate = async (): Promise<boolean> => {
    const newErrors: Record<string, string> = {};
    
    if (!formData.title.trim()) newErrors.title = 'Titulo e obrigatorio';
    else if (formData.title.length < 10) newErrors.title = 'Titulo deve ter pelo menos 10 caracteres';
    
    if (!formData.slug.trim()) newErrors.slug = 'Slug e obrigatorio';
    else if (!isSlugAvailable(formData.slug, undefined)) newErrors.slug = 'Este slug ja esta em uso';
    
    if (!formData.excerpt.trim()) newErrors.excerpt = 'Resumo e obrigatorio';
    else if (formData.excerpt.length < 50) newErrors.excerpt = 'Resumo deve ter pelo menos 50 caracteres';
    else if (formData.excerpt.length > 300) newErrors.excerpt = 'Resumo deve ter no maximo 300 caracteres';
    
    if (!formData.content.trim()) newErrors.content = 'Conteudo e obrigatorio';
    else if (formData.content.length < 200) newErrors.content = 'Conteudo deve ter pelo menos 200 caracteres';
    
    if (!formData.authorId.trim()) newErrors.author = 'Perfil profissional obrigatório';
    
    if (!formData.coverImage.trim()) newErrors.coverImage = 'Imagem de capa e obrigatoria';
    
    // Validar agendamento
    if (publishMode === 'schedule') {
      if (!formData.scheduledDate) {
        newErrors.scheduledDate = 'Data de agendamento e obrigatoria';
      }
      if (!formData.scheduledTime) {
        newErrors.scheduledTime = 'Hora de agendamento e obrigatoria';
      }
      
      if (formData.scheduledDate && formData.scheduledTime) {
        const scheduledDateTime = new Date(`${formData.scheduledDate}T${formData.scheduledTime}`);
        if (scheduledDateTime <= new Date()) {
          newErrors.scheduledDate = 'A data/hora deve ser no futuro';
        }
      }
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async () => {
    if (!(await validate())) {
      toast.error('Por favor, corrija os erros antes de salvar');
      return;
    }
    
    setIsSaving(true);
    
    try {
      const selectedAuthor = authors.find((author) => author.slug === formData.authorId);
      if (!selectedAuthor) {
        toast.error('Selecione um perfil profissional ativo');
        setIsSaving(false);
        return;
      }

      const articleData = {
        title: formData.title,
        slug: formData.slug,
        excerpt: formData.excerpt,
        content: formData.content,
        category: formData.category as 'economia' | 'geopolitica' | 'tecnologia',
        author: selectedAuthor.name,
        authorId: selectedAuthor.slug,
        tags: formData.tags,
        coverImage: formData.coverImage,
        featured: formData.featured,
        breaking: formData.breaking,
        readingTime: Math.ceil(formData.content.split(/\s+/).length / 200),
        views: 0,
        likes: 0,
        shares: 0,
        comments: 0,
      };
      
      if (publishMode === 'schedule') {
        await scheduleArticle(
          articleData,
          formData.scheduledDate,
          formData.scheduledTime,
          formData.timezone
        );
        toast.success(`Artigo agendado para ${formData.scheduledDate} às ${formData.scheduledTime}!`);
      } else {
        // Publicar imediatamente via API (bypass RLS)
        await createArticleApi(articleData);
        toast.success('Artigo publicado com sucesso!');
      }
       
      secureStorage.remove('cin_draft_article');
      setHasChanges(false);
      router.push('/admin#noticias');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro desconhecido';
      toast.error(`Erro ao salvar artigo: ${message}`);
    } finally {
      setIsSaving(false);
    }
  };

  const handleExit = () => {
    if (hasChanges) {
      setShowExitDialog(true);
    } else {
      router.push('/admin#noticias');
    }
  };

  const getCategoryColor = (cat: string) => {
    return CONTENT_CONFIG.categories[cat as keyof typeof CONTENT_CONFIG.categories]?.color || '#6b6b6b';
  };

  const getCategoryName = (cat: string) => {
    return CONTENT_CONFIG.categories[cat as keyof typeof CONTENT_CONFIG.categories]?.name || cat;
  };

  // Gerar datas sugeridas para agendamento
  const getSuggestedDates = () => {
    const dates = [];
    const today = new Date();
    
    for (let i = 1; i <= 7; i++) {
      const date = new Date(today);
      date.setDate(date.getDate() + i);
      dates.push({
        label: i === 1 ? 'Amanha' : i === 2 ? 'Depois de amanha' : date.toLocaleDateString('pt-BR', { weekday: 'long' }),
        value: date.toISOString().split('T')[0],
      });
    }
    
    return dates;
  };

  return (
    <>
      <main className="max-w-[1280px] mx-auto px-4 py-6 sm:py-8">
        {/* Header */}
        <header className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <section className="flex items-center gap-3">
            <Button 
              variant="ghost" 
              size="icon"
              onClick={handleExit}
              className="shrink-0"
            >
              <ArrowLeft className="w-5 h-5 text-[#6b6b6b]" />
            </Button>
            <section>
              <h1 className="text-2xl sm:text-3xl font-bold text-[#111111]">
                Nova Noticia
              </h1>
              <p className="text-sm text-[#6b6b6b]">
                Crie um novo artigo ou agende para depois
                {lastSaved && (
                  <span className="ml-2 text-xs text-[#6b6b6b]">
                    - Auto-salvo A s {lastSaved.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                  </span>
                )}
              </p>
            </section>
          </section>
          <section className="flex gap-2">
            <Button 
              variant="outline"
              onClick={() => setShowPreview(!showPreview)}
              className="gap-2"
            >
              <Eye className="w-4 h-4" />
              {showPreview ? 'Editar' : 'Preview'}
            </Button>
<Button 
              onClick={handleSave}
              disabled={isSaving}
              className={`gap-2 ${publishMode === 'schedule' ? 'bg-blue-600 hover:bg-blue-700' : 'bg-[#c40000] hover:bg-[#a00000]'}`}
            >
              {isSaving ? (
                <>
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  {publishMode === 'schedule' ? 'Agendando...' : 'Salvando...'}
                </>
              ) : (
                <>
                  {publishMode === 'schedule' ? <Clock3 className="w-4 h-4" /> : <Save className="w-4 h-4" />}
                  {publishMode === 'schedule' ? 'Agendar' : 'Publicar'}
                </>
              )}
            </Button>
          </section>
        </header>

        {showPreview ? (
          <section className="bg-white border border-[#e5e5e5] rounded-lg p-6 sm:p-8 max-w-4xl mx-auto">
            <section className="flex items-center gap-2 mb-4">
              <Badge 
                style={{ backgroundColor: getCategoryColor(formData.category) }}
                className="text-white"
              >
                {getCategoryName(formData.category)}
              </Badge>
              {formData.breaking && (
                <Badge className="bg-[#c40000] text-white">URGENTE</Badge>
              )}
              {formData.featured && (
                <Badge className="bg-[#a16207] text-white">DESTAQUE</Badge>
              )}
              {publishMode === 'schedule' && (
                <Badge className="bg-blue-100 text-blue-600">
                  <Clock className="w-3 h-3 mr-1" />
                  Agendado: {formData.scheduledDate} {formData.scheduledTime}
                </Badge>
              )}
            </section>
            
            <h1 className="text-2xl sm:text-3xl font-bold text-[#111111] mb-4">
              {formData.title || 'Titulo do Artigo'}
            </h1>
            
            <section className="flex items-center gap-4 text-sm text-[#6b6b6b] mb-6">
              <span className="flex items-center gap-1">
                <User className="w-4 h-4" />
                {formData.author || 'Autor'}
              </span>
              <span className="flex items-center gap-1">
                <Calendar className="w-4 h-4" />
                {publishMode === 'schedule' 
                  ? `${formData.scheduledDate} ${formData.scheduledTime}`
                  : new Date().toLocaleDateString('pt-BR')
                }
              </span>
              {formData.tags.length > 0 && (
                <span className="flex items-center gap-1">
                  <Tag className="w-4 h-4" />
                  {formData.tags.join(', ')}
                </span>
              )}
            </section>
            
            <p className="text-lg text-[#6b6b6b] mb-6 leading-relaxed">
              {formData.excerpt || 'Resumo do artigo...'}
            </p>
            
            {formData.coverImage && (
              <img 
                src={formData.coverImage} 
                alt="" 
                className="w-full aspect-video object-cover rounded-lg mb-6"
              />
            )}
            
            {/* SECURITY: Preview do conteudo sanitizado com DOMPurify */}
            <section 
              className="prose max-w-none prose-headings:text-[#111111] prose-p:text-[#333]"
              dangerouslySetInnerHTML={{ 
                __html: sanitizeHtml(formData.content || '<p>Conteudo do artigo...</p>')
              }}
            />
          </section>
        ) : (
          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
            <TabsList className="grid w-full grid-cols-3 lg:w-fit">
              <TabsTrigger value="content" className="gap-2">
                <FileText className="w-4 h-4" />
                Conteudo
              </TabsTrigger>
              <TabsTrigger value="publish" className="gap-2">
                <Clock className="w-4 h-4" />
                Publicacao
              </TabsTrigger>
              <TabsTrigger value="seo" className="gap-2">
                <Globe className="w-4 h-4" />
                SEO
              </TabsTrigger>
            </TabsList>

            <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Coluna Principal */}
              <section className="lg:col-span-2 space-y-6">
                <TabsContent value="content" className="mt-0 space-y-6">
                  {/* Titulo */}
                  <article className="bg-white border border-[#e5e5e5] rounded-lg p-4 sm:p-6">
                    <fieldset>
                      <Label htmlFor="title" className="text-sm font-medium text-[#111111]">
                        Titulo *
                      </Label>
                      <Input
                        id="title"
                        value={formData.title}
                        onChange={(e) => handleTitleChange(e.target.value)}
                        placeholder="Digite um titulo impactante..."
                        className={`mt-1.5 text-lg ${errors.title ? 'border-[#ef4444]' : ''}`}
                      />
                      {errors.title ? (
                        <p className="mt-1 text-xs text-[#ef4444] flex items-center gap-1">
                          <AlertCircle className="w-3 h-3" />
                          {errors.title}
                        </p>
                      ) : (
                        <p className="mt-1 text-xs text-[#6b6b6b]">
                          {formData.title.length} caracteres - Ideal: 50-60 caracteres
                        </p>
                      )}
                    </fieldset>

                    <fieldset className="mt-4">
                      <Label htmlFor="slug" className="text-sm font-medium text-[#111111]">
                        Slug *
                      </Label>
                      <section className="relative mt-1.5">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#6b6b6b] text-sm">
                          /noticias/
                        </span>
                        <Input
                          id="slug"
                          value={formData.slug}
                          onChange={(e) => handleSlugChange(e.target.value)}
                          placeholder="url-amigavel-do-artigo"
                          className={`pl-[72px] ${errors.slug ? 'border-[#ef4444]' : ''}`}
                        />
                      </section>
                      {errors.slug && (
                        <p className="mt-1 text-xs text-[#ef4444] flex items-center gap-1">
                          <AlertCircle className="w-3 h-3" />
                          {errors.slug}
                        </p>
                      )}
                    </fieldset>

                    {/* Categoria */}
                    <fieldset className="mt-4">
                      <Label htmlFor="category" className="text-sm font-medium text-[#111111]">
                        Categoria *
                      </Label>
                      <select
                        id="category"
                        value={formData.category}
                        onChange={(e) => {
                          handleChange('category', e.target.value);
                          setHasChanges(true);
                        }}
                        className="w-full mt-1.5 px-4 py-2.5 border border-[#e5e5e5] rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-[#c40000] bg-white"
                      >
                        <optgroup label="Categorias Principais">
                          {ALL_CATEGORIES.filter(c => ['geopolitica', 'economia', 'tecnologia'].includes(c.slug)).map((cat) => (
                            <option key={cat.slug} value={cat.slug}>{cat.name}</option>
                          ))}
                        </optgroup>
                        <optgroup label="Subcategorias">
                          {ALL_CATEGORIES.filter(c => !['geopolitica', 'economia', 'tecnologia'].includes(c.slug)).map((cat) => (
                            <option key={cat.slug} value={cat.slug}>{cat.name}</option>
                          ))}
                        </optgroup>
                      </select>
                      <p className="mt-1 text-xs text-[#6b6b6b]">
                        Categoria: {ALL_CATEGORIES.find(c => c.slug === formData.category)?.name || 'Selecione'}
                      </p>
                    </fieldset>
                  </article>

                  {/* Resumo */}
                  <article className="bg-white border border-[#e5e5e5] rounded-lg p-4 sm:p-6">
                    <fieldset>
                      <Label htmlFor="excerpt" className="text-sm font-medium text-[#111111]">
                        Resumo *
                      </Label>
                      <Textarea
                        id="excerpt"
                        value={formData.excerpt}
                        onChange={(e) => handleChange('excerpt', e.target.value)}
                        placeholder="Breve resumo do artigo que sera exibido nas listagens..."
                        rows={3}
                        className={`mt-1.5 resize-none ${errors.excerpt ? 'border-[#ef4444]' : ''}`}
                      />
                      <section className="flex justify-between mt-1">
                        {errors.excerpt ? (
                          <p className="text-xs text-[#ef4444]">{errors.excerpt}</p>
                        ) : (
                          <span />
                        )}
                        <p className={`text-xs ${formData.excerpt.length > 300 ? 'text-[#ef4444]' : 'text-[#6b6b6b]'}`}>
                          {formData.excerpt.length}/300 caracteres
                        </p>
                      </section>
                    </fieldset>
                  </article>

                  {/* Conteudo */}
                  <article className="bg-white border border-[#e5e5e5] rounded-lg p-4 sm:p-6">
                    <section className="flex items-center justify-between mb-4">
                      <Label htmlFor="content" className="text-sm font-medium text-[#111111]">
                        Conteudo *
                      </Label>
</section>
                    
                    {/* Toolbar */}
                    <section className="flex flex-wrap gap-1 p-2 bg-[#f8fafc] rounded-t-lg border border-[#e5e5e5] border-b-0">
                      <Button type="button" variant="ghost" size="sm" onClick={() => insertFormat('h2')} className="h-8 w-8 p-0" title="Titulo H2">
                        <Heading1 className="w-4 h-4" />
                      </Button>
                      <Button type="button" variant="ghost" size="sm" onClick={() => insertFormat('h3')} className="h-8 w-8 p-0" title="Subtitulo H3">
                        <Heading2 className="w-4 h-4" />
                      </Button>
                      <section className="w-px h-6 bg-[#e5e5e5] mx-1 self-center" />
                      <Button type="button" variant="ghost" size="sm" onClick={() => insertFormat('bold')} className="h-8 w-8 p-0" title="Negrito">
                        <Bold className="w-4 h-4" />
                      </Button>
                      <Button type="button" variant="ghost" size="sm" onClick={() => insertFormat('italic')} className="h-8 w-8 p-0" title="Italico">
                        <Italic className="w-4 h-4" />
                      </Button>
                      <section className="w-px h-6 bg-[#e5e5e5] mx-1 self-center" />
                      <Button type="button" variant="ghost" size="sm" onClick={() => insertFormat('quote')} className="h-8 w-8 p-0" title="Citacao">
                        <Quote className="w-4 h-4" />
                      </Button>
                      <Button type="button" variant="ghost" size="sm" onClick={() => insertFormat('list')} className="h-8 w-8 p-0" title="Lista">
                        <List className="w-4 h-4" />
                      </Button>
                      <Button type="button" variant="ghost" size="sm" onClick={() => insertFormat('link')} className="h-8 w-8 p-0" title="Link">
                        <LinkIcon className="w-4 h-4" />
                      </Button>
                    </section>
                    
                    <Textarea
                      ref={contentRef}
                      id="content"
                      value={formData.content}
                      onChange={(e) => handleChange('content', e.target.value)}
                      placeholder="Escreva o conteudo completo do artigo aqui..."
                      rows={20}
                      className={`resize-none rounded-t-none ${errors.content ? 'border-[#ef4444]' : ''}`}
                    />
                    <section className="flex justify-between mt-2">
                      {errors.content ? (
                        <p className="text-xs text-[#ef4444] flex items-center gap-1">
                          <AlertCircle className="w-3 h-3" />
                          {errors.content}
                        </p>
                      ) : (
                        <span />
                      )}
                      <p className="text-xs text-[#6b6b6b]">
                        {formData.content.length} caracteres - 
                        Tempo de leitura estimado: {Math.ceil(formData.content.split(/\s+/).length / 200)} min
                      </p>
                    </section>
                  </article>
                </TabsContent>

                <TabsContent value="publish" className="mt-0 space-y-6">
                  {/* Modo de Publicacao */}
                  <article className="bg-white border border-[#e5e5e5] rounded-lg p-4 sm:p-6">
                    <header className="flex items-center gap-3 mb-4">
                      <section className="p-2 bg-blue-100 rounded-lg">
                        <Clock className="w-5 h-5 text-blue-600" />
                      </section>
                      <section>
                        <h2 className="text-lg font-semibold text-[#111111]">Quando Publicar?</h2>
                        <p className="text-xs text-[#6b6b6b]">Escolha quando o artigo sera publicado</p>
                      </section>
                    </header>
                    
                    <section className="space-y-4">
                      <section className="grid grid-cols-2 gap-4">
                        <button
                          type="button"
                          onClick={() => setPublishMode('now')}
                          className={`flex flex-col items-center gap-2 p-4 border-2 rounded-lg transition-all ${
                            publishMode === 'now'
                              ? 'border-[#c40000] bg-[#fef2f2]'
                              : 'border-[#e5e5e5] hover:border-[#c40000]/50'
                          }`}
                        >
                          <Play className={`w-6 h-6 ${publishMode === 'now' ? 'text-[#c40000]' : 'text-[#6b6b6b]'}`} />
                          <span className={`text-sm font-medium ${publishMode === 'now' ? 'text-[#c40000]' : 'text-[#111111]'}`}>
                            Publicar Agora
                          </span>
                          <span className="text-xs text-[#6b6b6b]">Disponivel imediatamente</span>
                        </button>
                        
                        <button
                          type="button"
                          onClick={() => setPublishMode('schedule')}
                          className={`flex flex-col items-center gap-2 p-4 border-2 rounded-lg transition-all ${
                            publishMode === 'schedule'
                              ? 'border-blue-500 bg-blue-50'
                              : 'border-[#e5e5e5] hover:border-blue-300'
                          }`}
                        >
                          <Clock3 className={`w-6 h-6 ${publishMode === 'schedule' ? 'text-blue-600' : 'text-[#6b6b6b]'}`} />
                          <span className={`text-sm font-medium ${publishMode === 'schedule' ? 'text-blue-600' : 'text-[#111111]'}`}>
                            Agendar
                          </span>
                          <span className="text-xs text-[#6b6b6b]">Defina data e hora</span>
                        </button>
                      </section>
                      
                      {publishMode === 'schedule' && (
                        <section className="p-4 bg-blue-50 rounded-lg border border-blue-200 space-y-4">
                          <section className="grid grid-cols-2 gap-4">
                            <fieldset>
                              <Label className="text-sm text-[#111111]">Data *</Label>
                              <Input
                                type="date"
                                value={formData.scheduledDate}
                                onChange={(e) => handleChange('scheduledDate', e.target.value)}
                                min={new Date().toISOString().split('T')[0]}
                                className={`mt-1.5 ${errors.scheduledDate ? 'border-[#ef4444]' : ''}`}
                              />
                              {errors.scheduledDate && (
                                <p className="mt-1 text-xs text-[#ef4444]">{errors.scheduledDate}</p>
                              )}
                            </fieldset>
                            
                            <fieldset>
                              <Label className="text-sm text-[#111111]">Hora *</Label>
                              <Input
                                type="time"
                                value={formData.scheduledTime}
                                onChange={(e) => handleChange('scheduledTime', e.target.value)}
                                className={`mt-1.5 ${errors.scheduledTime ? 'border-[#ef4444]' : ''}`}
                              />
                              {errors.scheduledTime && (
                                <p className="mt-1 text-xs text-[#ef4444]">{errors.scheduledTime}</p>
                              )}
                            </fieldset>
                          </section>
                          
                          <fieldset>
                            <Label className="text-sm text-[#111111]">Fuso Horario</Label>
                            <select
                              value={formData.timezone}
                              onChange={(e) => handleChange('timezone', e.target.value)}
                              className="w-full mt-1.5 px-4 py-2.5 border border-[#e5e5e5] rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                            >
                              <option value="America/Sao_Paulo">America/Sao_Paulo (GMT-3)</option>
                              <option value="America/New_York">America/New_York (GMT-5)</option>
                              <option value="Europe/London">Europe/London (GMT+0)</option>
                              <option value="Europe/Paris">Europe/Paris (GMT+1)</option>
                              <option value="Asia/Tokyo">Asia/Tokyo (GMT+9)</option>
                            </select>
                          </fieldset>
                          
                          {/* Sugestoes rapidas */}
                          <section>
                            <p className="text-xs text-[#6b6b6b] mb-2">Sugestoes rapidas:</p>
                            <section className="flex flex-wrap gap-2">
                              {getSuggestedDates().map((date) => (
                                <button
                                  key={date.value}
                                  type="button"
                                  onClick={() => {
                                    handleChange('scheduledDate', date.value);
                                    handleChange('scheduledTime', '09:00');
                                  }}
                                  className="px-3 py-1.5 bg-white border border-blue-200 rounded-full text-xs hover:bg-blue-100 transition-colors"
                                >
                                  {date.label} 9h
                                </button>
                              ))}
                            </section>
                          </section>
                          
                          {formData.scheduledDate && formData.scheduledTime && (
                            <section className="p-3 bg-white rounded-lg border border-blue-200">
                              <p className="text-sm text-blue-800">
                                <strong>Sera publicado em:</strong><br />
                                {new Date(`${formData.scheduledDate}T${formData.scheduledTime}`).toLocaleString('pt-BR', {
                                  weekday: 'long',
                                  year: 'numeric',
                                  month: 'long',
                                  day: 'numeric',
                                  hour: '2-digit',
                                  minute: '2-digit',
                                })}
                              </p>
                            </section>
                          )}
                        </section>
                      )}
                    </section>
                  </article>

                  {/* Configuracoes */}
                  <article className="bg-white border border-[#e5e5e5] rounded-lg p-4 sm:p-6">
                    <header className="flex items-center gap-3 mb-4">
                      <section className="p-2 bg-[#fef2f2] rounded-lg">
                        <Type className="w-5 h-5 text-[#c40000]" />
                      </section>
                      <section>
                        <h2 className="text-lg font-semibold text-[#111111]">Configuracoes de Publicacao</h2>
                      </section>
                    </header>

                    <section className="space-y-4">
                      <section className="flex items-center justify-between p-3 bg-[#f8fafc] rounded-lg">
                        <section>
                          <p className="text-sm font-medium text-[#111111]">Destacar na home</p>
                          <p className="text-xs text-[#6b6b6b]">Aparece em destaque na pagina inicial</p>
                        </section>
                        <Switch
                          checked={formData.featured}
                          onCheckedChange={(checked) => handleChange('featured', checked)}
                        />
                      </section>
                      
                      <section className="flex items-center justify-between p-3 bg-[#f8fafc] rounded-lg">
                        <section>
                          <p className="text-sm font-medium text-[#111111]">Marcar como urgente</p>
                          <p className="text-xs text-[#6b6b6b]">Destaca o artigo como breaking news</p>
                        </section>
                        <Switch
                          checked={formData.breaking}
                          onCheckedChange={(checked) => handleChange('breaking', checked)}
                        />
                      </section>
                    </section>
                  </article>
                </TabsContent>

                <TabsContent value="seo" className="mt-0 space-y-6">
                  <article className="bg-white border border-[#e5e5e5] rounded-lg p-4 sm:p-6">
                    <header className="flex items-center gap-2 mb-4">
                      <Globe className="w-5 h-5 text-[#c40000]" />
                      <h2 className="text-lg font-semibold text-[#111111]">Otimizacao para Buscas (SEO)</h2>
                    </header>

                    <fieldset className="mb-4">
                      <Label htmlFor="seoTitle" className="text-sm font-medium text-[#111111]">
                        Titulo SEO
                      </Label>
                      <Input
                        id="seoTitle"
                        value={formData.seoTitle}
                        onChange={(e) => handleChange('seoTitle', e.target.value)}
                        placeholder="Titulo otimizado para SEO"
                        className="mt-1.5"
                      />
                      <p className="mt-1 text-xs text-[#6b6b6b]">
                        {formData.seoTitle.length}/60 caracteres (ideal)
                      </p>
                    </fieldset>

                    <fieldset>
                      <Label htmlFor="seoDescription" className="text-sm font-medium text-[#111111]">
                        Descricao SEO (Meta Description)
                      </Label>
                      <Textarea
                        id="seoDescription"
                        value={formData.seoDescription}
                        onChange={(e) => handleChange('seoDescription', e.target.value)}
                        placeholder="Descricao que aparecera nos resultados de busca..."
                        rows={3}
                        className="mt-1.5 resize-none"
                      />
                      <p className={`mt-1 text-xs ${formData.seoDescription.length > 160 ? 'text-[#ef4444]' : 'text-[#6b6b6b]'}`}>
                        {formData.seoDescription.length}/160 caracteres (ideal)
                      </p>
                    </fieldset>

                    {/* Tags/Keywords */}
                    <fieldset className="mt-4">
                      <Label className="text-sm font-medium text-[#111111]">
                        Palavras-chave (Tags)
                      </Label>
                      <section className="mt-1.5 space-y-2">
                        <section className="flex flex-wrap gap-2">
                          {formData.tags.map((tag, index) => (
                            <Badge key={index} variant="secondary" className="gap-1 pr-1">
                              {tag}
                              <button
                                type="button"
                                onClick={() => {
                                  const newTags = formData.tags.filter((_, i) => i !== index);
                                  setFormData(prev => ({ ...prev, tags: newTags }));
                                  setHasChanges(true);
                                }}
                                className="ml-1 hover:text-[#ef4444]"
                              >
                                <X className="w-3 h-3" />
                              </button>
                            </Badge>
                          ))}
                        </section>
                        <section className="flex gap-2">
                          <Input
                            id="tagInput"
                            value={formData.tagInput}
                            onChange={(e) => handleChange('tagInput', e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter' && formData.tagInput.trim()) {
                                e.preventDefault();
                                if (!formData.tags.includes(formData.tagInput.trim())) {
                                  setFormData(prev => ({ 
                                    ...prev, 
                                    tags: [...prev.tags, prev.tagInput.trim()],
                                    tagInput: ''
                                  }));
                                  setHasChanges(true);
                                }
                              }
                            }}
                            placeholder="Digite uma tag e pressione Enter"
                            className="flex-1"
                          />
                        </section>
                        <p className="text-xs text-[#6b6b6b]">
                          Tags sugeridas: 
                          {CONTENT_CONFIG.tags.popular.slice(0, 8).map(tag => (
                            <button
                              key={tag}
                              type="button"
                              onClick={() => {
                                if (!formData.tags.includes(tag)) {
                                  setFormData(prev => ({ 
                                    ...prev, 
                                    tags: [...prev.tags, tag]
                                  }));
                                  setHasChanges(true);
                                }
                              }}
                              className="ml-1 text-[#c40000] hover:underline"
                            >
                              {tag}
                            </button>
                          ))}
                        </p>
                      </section>
                    </fieldset>

                    {/* Análise de SEO */}
                    <fieldset className="mt-6 p-4 bg-[#f8fafc] rounded-lg">
                      <h3 className="text-sm font-medium text-[#111111] mb-3">Análise de SEO</h3>
                      <section className="space-y-2 text-xs">
                        <section className="flex items-center justify-between">
                          <span className="text-[#6b6b6b]">Título SEO</span>
                          <span className={formData.seoTitle.length >= 50 && formData.seoTitle.length <= 60 ? 'text-[#22c55e]' : 'text-[#ef4444]'}>
                            {formData.seoTitle.length}/60 {formData.seoTitle.length >= 50 && formData.seoTitle.length <= 60 ? '✓' : '✗'}
                          </span>
                        </section>
                        <section className="flex items-center justify-between">
                          <span className="text-[#6b6b6b]">Descrição SEO</span>
                          <span className={formData.seoDescription.length >= 150 && formData.seoDescription.length <= 160 ? 'text-[#22c55e]' : 'text-[#ef4444]'}>
                            {formData.seoDescription.length}/160 {formData.seoDescription.length >= 150 && formData.seoDescription.length <= 160 ? '✓' : '✗'}
                          </span>
                        </section>
                        <section className="flex items-center justify-between">
                          <span className="text-[#6b6b6b]">Palavras-chave</span>
                          <span className={formData.tags.length >= 3 ? 'text-[#22c55e]' : 'text-[#ef4444]'}>
                            {formData.tags.length} tags {formData.tags.length >= 3 ? '✓' : '✗'}
                          </span>
                        </section>
                        <section className="flex items-center justify-between">
                          <span className="text-[#6b6b6b]">Conteúdo</span>
                          <span className={formData.content.length >= 1000 ? 'text-[#22c55e]' : 'text-[#ef4444]'}>
                            {formData.content.length} chars {formData.content.length >= 1000 ? '✓' : '✗'}
                          </span>
                        </section>
                      </section>
                    </fieldset>

                    {/* Preview OpenGraph */}
                    <fieldset className="mt-6">
                      <h3 className="text-sm font-medium text-[#111111] mb-3">Preview OpenGraph (Facebook/Twitter)</h3>
                      <section className="border border-[#e5e5e5] rounded-lg overflow-hidden">
                        {formData.coverImage ? (
                          <img src={formData.coverImage} alt="" className="w-full aspect-video object-cover" />
                        ) : (
                          <section className="w-full aspect-video bg-[#f0f0f0] flex items-center justify-center">
                            <ImageIcon className="w-8 h-8 text-[#6b6b6b]" />
                          </section>
                        )}
                        <section className="p-3 bg-white">
                          <p className="text-xs text-[#6b6b6b] uppercase">cenariointernacional.com.br</p>
                          <p className="text-sm font-medium text-[#1a0dab] line-clamp-1">
                            {formData.seoTitle || formData.title || 'Título do Artigo'}
                          </p>
                          <p className="text-xs text-[#545454] line-clamp-2">
                            {formData.seoDescription || formData.excerpt || 'Descrição do artigo...'}
                          </p>
                        </section>
                      </section>
                    </fieldset>

                    {/* Schema FAQ */}
                    <fieldset className="mt-6 p-4 bg-[#f8fafc] rounded-lg">
                      <section className="flex items-center justify-between mb-3">
                        <h3 className="text-sm font-medium text-[#111111]">Perguntas Frequentes (FAQ)</h3>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setFormData(prev => ({
                              ...prev,
                              faqs: [...prev.faqs, { question: '', answer: '' }]
                            }));
                            setHasChanges(true);
                          }}
                        >
                          + Adicionar FAQ
                        </Button>
                      </section>
                      {formData.faqs.length > 0 && (
                        <section className="space-y-3">
                          {formData.faqs.map((faq, index) => (
                            <section key={index} className="p-3 bg-white rounded-lg border border-[#e5e5e5]">
                              <section className="flex items-center justify-between mb-2">
                                <span className="text-xs font-medium text-[#6b6b6b]">FAQ #{index + 1}</span>
                                <button
                                  type="button"
                                  onClick={() => {
                                    const newFaqs = formData.faqs.filter((_, i) => i !== index);
                                    setFormData(prev => ({ ...prev, faqs: newFaqs }));
                                    setHasChanges(true);
                                  }}
                                  className="text-[#ef4444] hover:text-[#dc2626]"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </section>
                              <Input
                                value={faq.question}
                                onChange={(e) => {
                                  const newFaqs = [...formData.faqs];
                                  newFaqs[index].question = e.target.value;
                                  setFormData(prev => ({ ...prev, faqs: newFaqs }));
                                  setHasChanges(true);
                                }}
                                placeholder="Pergunta"
                                className="mb-2"
                              />
                              <Textarea
                                value={faq.answer}
                                onChange={(e) => {
                                  const newFaqs = [...formData.faqs];
                                  newFaqs[index].answer = e.target.value;
                                  setFormData(prev => ({ ...prev, faqs: newFaqs }));
                                  setHasChanges(true);
                                }}
                                placeholder="Resposta"
                                rows={2}
                                className="resize-none"
                              />
                            </section>
                          ))}
                        </section>
                      )}
                      {formData.faqs.length === 0 && (
                        <p className="text-xs text-[#6b6b6b]">
                          Adicione perguntas e respostas frequentes para melhorar o SEO com schema FAQPage.
                        </p>
                      )}
                    </fieldset>

                    <section className="mt-6 p-4 bg-[#f8fafc] rounded-lg">
                      <p className="text-xs text-[#6b6b6b] mb-2">Preview nos resultados de busca:</p>
                      <section className="max-w-[600px]">
                        <p className="text-sm text-[#1a0dab] truncate">
                          {formData.seoTitle || formData.title || 'Titulo do Artigo'}
                        </p>
                        <p className="text-xs text-[#006621]">
                          cenariointernacional.com.br/noticias/{formData.slug || 'url-do-artigo'}
                        </p>
                        <p className="text-sm text-[#545454] line-clamp-2">
                          {formData.seoDescription || formData.excerpt || 'Descricao do artigo...'}
                        </p>
                      </section>
                    </section>
                  </article>
                </TabsContent>
              </section>

              {/* Sidebar */}
              <aside className="space-y-6">
                {/* Status */}
                <article className="bg-white border border-[#e5e5e5] rounded-lg p-4 sm:p-6">
                  <h2 className="text-lg font-semibold text-[#111111] mb-4">Status</h2>
                  
                  <section className="space-y-3">
                    <section className="flex items-center justify-between text-sm">
                      <span className="text-[#6b6b6b]">Progresso:</span>
                      <span className="font-medium text-[#111111]">
                        {Math.round(
                          (Number(!!formData.title) + 
                           Number(!!formData.slug) + 
                           Number(!!formData.excerpt) + 
                           Number(!!formData.content) + 
                           Number(!!formData.author) + 
                           Number(!!formData.coverImage)) / 6 * 100
                        )}%
                      </span>
                    </section>
                    <Progress 
                      value={
                        (Number(!!formData.title) + 
                         Number(!!formData.slug) + 
                         Number(!!formData.excerpt) + 
                         Number(!!formData.content) + 
                         Number(!!formData.author) + 
                         Number(!!formData.coverImage)) / 6 * 100
                      } 
                      className="h-2"
                    />
                    
                    <ul className="space-y-2 mt-4">
                      {[
                        { label: 'Titulo', value: !!formData.title },
                        { label: 'Slug', value: !!formData.slug },
                        { label: 'Resumo', value: !!formData.excerpt },
                        { label: 'Conteudo', value: !!formData.content },
                        { label: 'Autor', value: !!formData.author },
                        { label: 'Imagem de capa', value: !!formData.coverImage },
                      ].map((item) => (
                        <li key={item.label} className="flex items-center gap-2 text-sm">
                          {item.value ? (
                            <Check className="w-4 h-4 text-[#22c55e]" />
                          ) : (
                            <X className="w-4 h-4 text-[#ef4444]" />
                          )}
                          <span className={item.value ? 'text-[#166534]' : 'text-[#6b6b6b]'}>
                            {item.label}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </section>
                </article>

                {/* Categoria */}
                <article className="bg-white border border-[#e5e5e5] rounded-lg p-4 sm:p-6">
                  <h2 className="text-lg font-semibold text-[#111111] mb-4">Categoria *</h2>
                  <select
                    value={formData.category}
                    onChange={(e) => handleChange('category', e.target.value)}
                    className="w-full px-3 py-2.5 border border-[#e5e5e5] rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-[#c40000]"
                  >
                    {Object.values(CONTENT_CONFIG.categories).map(cat => (
                      <option key={cat.slug} value={cat.slug}>{cat.name}</option>
                    ))}
                  </select>
                </article>

                {/* Imagem */}
                <article className="bg-white border border-[#e5e5e5] rounded-lg p-4 sm:p-6">
                  <header className="flex items-center gap-2 mb-4">
                    <ImageIcon className="w-5 h-5 text-[#c40000]" />
                    <h2 className="text-lg font-semibold text-[#111111]">Imagem de Capa *</h2>
                  </header>
                  
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="hidden"
                  />
                  
                  {formData.coverImage ? (
                    <section className="space-y-3">
                      <img 
                        src={formData.coverImage} 
                        alt="" 
                        className="w-full aspect-video object-cover rounded-lg"
                      />
                      <section className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => fileInputRef.current?.click()}
                          className="flex-1 gap-2"
                        >
                          <Upload className="w-4 h-4" />
                          Alterar
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleChange('coverImage', '')}
                          className="text-[#ef4444] hover:text-[#ef4444]"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </section>
                    </section>
                  ) : (
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      className="w-full aspect-video border-2 border-dashed border-[#e5e5e5] rounded-lg flex flex-col items-center justify-center gap-2 hover:border-[#c40000] hover:bg-[#fef2f2] transition-colors"
                    >
                      <Upload className="w-8 h-8 text-[#6b6b6b]" />
                      <span className="text-sm text-[#6b6b6b]">Clique para fazer upload</span>
                      <span className="text-xs text-[#6b6b6b]">JPG, PNG ate 5MB</span>
                    </button>
                  )}
                  {errors.coverImage && (
                    <p className="mt-2 text-xs text-[#ef4444] flex items-center gap-1">
                      <AlertCircle className="w-3 h-3" />
                      {errors.coverImage}
                    </p>
                  )}
                </article>

                {/* Tags */}
                <article className="bg-white border border-[#e5e5e5] rounded-lg p-4 sm:p-6">
                  <header className="flex items-center gap-2 mb-4">
                    <Tag className="w-5 h-5 text-[#c40000]" />
                    <h2 className="text-lg font-semibold text-[#111111]">Tags</h2>
                  </header>
                  
                  {/* Tags Rapidas / Sugeridas */}
                  <section className="mb-4">
                    <p className="text-xs text-[#6b6b6b] mb-2">Tags sugeridas:</p>
                    <div className="flex flex-wrap gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          const specialTag = 'Publicacao Patrocinada';
                          if (!formData.tags.includes(specialTag)) {
                            setFormData(prev => ({ ...prev, tags: [...prev.tags, specialTag] }));
                            setHasChanges(true);
                            toast.success('Tag "Publicacao Patrocinada" adicionada');
                          } else {
                            toast.error('Esta tag ja existe');
                          }
                        }}
                        className={`text-xs rounded-full ${
                          formData.tags.includes('Publicacao Patrocinada')
                            ? 'bg-[#fef2f2] border-[#c40000] text-[#c40000]'
                            : 'border-[#e6e1d8] hover:border-[#c40000] hover:text-[#c40000]'
                        }`}
                      >
                        ðŸ’Ž Publicacao Patrocinada
                      </Button>
                      
                      {['Destaque', 'Urgente', 'Analise', 'Opiniao'].map((quickTag) => (
                        <Button
                          key={quickTag}
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            if (!formData.tags.includes(quickTag)) {
                              setFormData(prev => ({ ...prev, tags: [...prev.tags, quickTag] }));
                              setHasChanges(true);
                            } else {
                              toast.error('Esta tag ja existe');
                            }
                          }}
                          className={`text-xs rounded-full ${
                            formData.tags.includes(quickTag)
                              ? 'bg-[#f6f3ef] border-[#111111]'
                              : 'border-[#e6e1d8] hover:border-[#111111]'
                          }`}
                        >
                          {quickTag}
                        </Button>
                      ))}
                    </div>
                  </section>
                  
                  <section className="flex gap-2 mb-3">
                    <Input
                      value={formData.tagInput}
                      onChange={(e) => handleChange('tagInput', e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
                      placeholder="Adicionar tag personalizada..."
                      className="flex-1"
                    />
                    <Button type="button" onClick={addTag} variant="outline">
                      Add
                    </Button>
                  </section>
                  
                  {formData.tags.length > 0 && (
                    <section className="flex flex-wrap gap-2">
                      {formData.tags.map(tag => (
                        <Badge 
                          key={tag} 
                          variant="secondary"
                          className={`gap-1 cursor-pointer hover:bg-[#fef2f2] ${
                            tag === 'Publicacao Patrocinada' 
                              ? 'bg-[#fef2f2] text-[#c40000] border border-[#c40000]' 
                              : ''
                          }`}
                          onClick={() => removeTag(tag)}
                        >
                          {tag}
                          <X className="w-3 h-3" />
                        </Badge>
                      ))}
                    </section>
                  )}
                  <p className="mt-2 text-xs text-[#6b6b6b]">
                    Clique em uma tag para remover
                  </p>
                </article>

                {/* Autor */}
                <article className="bg-white border border-[#e5e5e5] rounded-lg p-4 sm:p-6">
                  <h2 className="text-lg font-semibold text-[#111111] mb-4">Perfil Profissional *</h2>
                  <select
                    value={formData.authorId}
                    onChange={(e) => {
                      const selected = authors.find((author) => author.slug === e.target.value);
                      setFormData((prev) => ({
                        ...prev,
                        authorId: e.target.value,
                        author: selected?.name ?? '',
                      }));
                      setHasChanges(true);
                      if (errors.author) setErrors((prev) => ({ ...prev, author: '' }));
                    }}
                    className={`w-full px-3 py-2.5 border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-[#c40000] ${errors.author ? 'border-[#ef4444]' : 'border-[#e5e5e5]'}`}
                  >
                    <option value="">Selecione um perfil</option>
                    {authors.filter((author) => author.isActive).map((author) => (
                      <option key={author.slug} value={author.slug}>
                        {author.name} - {author.title}
                      </option>
                    ))}
                  </select>
                  {errors.author && (
                    <p className="mt-1 text-xs text-[#ef4444]">{errors.author}</p>
                  )}
                </article>
              </aside>
            </section>
          </Tabs>
        )}

        {/* Dialog de Confirmacao de Saida */}
        <Dialog open={showExitDialog} onOpenChange={setShowExitDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Sair sem salvar?</DialogTitle>
              <DialogDescription>
                Voce tem alteracoes nao salvas. Deseja realmente sair?
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowExitDialog(false)}>
                Continuar editando
              </Button>
              <Button 
                onClick={() => router.push('/admin#noticias')}
                variant="destructive"
              >
                Sair sem salvar
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </main>
    </>
  );
}




