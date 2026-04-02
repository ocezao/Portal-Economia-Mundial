/**
 * Admin - Editar Noticia
 * Formulario completo com editor rich text, upload de imagens, auto-save e agendamento
 */

'use client';

import { use, useState, useEffect, useRef } from 'react';

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
} from '@/services/newsManager';
import {
  getEditorialArticleApi,
  type ArticleSource,
  uploadEditorialImageApi,
  updateArticleApi,
} from '@/services/articleApi';
import { listAdminAuthors } from '@/services/adminAuthors';
import { CONTENT_CONFIG } from '@/config/content';
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
import {
  buildScheduledAtIso,
  getLocalScheduleParts,
  isEditorialSlugAvailable,
  normalizeSources,
  persistEditorialArticle,
} from '@/app/admin/noticias/editorialForm';

interface PageProps {
  params: Promise<{
    slug: string;
  }>;
}

export default function AdminNewsEditPage({ params }: PageProps) {
  const router = useRouter();
  const { slug } = use(params);

  const contentRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const autoSaveRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  
  // Modo de publicacao
  const [publishMode, setPublishMode] = useState<'now' | 'schedule'>('now');
  const [articleStatus, setArticleStatus] = useState<'draft' | 'scheduled' | 'published'>('draft');
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
    sources: [] as ArticleSource[],
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
  const [isLoading, setIsLoading] = useState(true);

  // Carregar dados da noticia existente
  useEffect(() => {
    let isMounted = true;

    const load = async () => {
      setIsLoading(true);
      const allAuthors = await listAdminAuthors().catch(() => []);
      const activeAuthors = (allAuthors ?? []).filter((author) => author.isActive);
      if (isMounted) {
        setAuthors(activeAuthors);
      }

      if (slug) {
        const article = await getEditorialArticleApi(slug).catch(() => null);
        if (article && isMounted) {
          const nextStatus = article.status === 'published' || article.status === 'scheduled'
            ? article.status
            : 'draft';
          const selectedAuthor =
            activeAuthors.find((author) => author.slug === article.authorId) ??
            activeAuthors.find((author) => author.name === article.author);
          const publishedAt = article.publishedAt ?? article.published_at ?? null;
          const scheduleParts = publishedAt ? getLocalScheduleParts(publishedAt, 'America/Sao_Paulo') : null;

          setArticleStatus(nextStatus);
          setFormData({
            title: article.title ?? '',
            slug: article.slug ?? '',
            excerpt: article.excerpt ?? '',
            content: article.content ?? '',
            category: (article.category as 'economia' | 'geopolitica' | 'tecnologia') ?? 'economia',
            author: selectedAuthor?.name ?? article.author ?? '',
            authorId: selectedAuthor?.slug ?? article.authorId ?? '',
            tags: article.tags ?? [],
            tagInput: '',
            coverImage: article.coverImage ?? '',
            seoTitle: article.seoTitle ?? article.title ?? '',
            seoDescription: article.metaDescription ?? article.excerpt?.slice(0, 160) ?? '',
            breaking: article.breaking ?? false,
            featured: article.featured ?? false,
            sources: normalizeSources(
              Array.isArray(article.sources)
                ? article.sources
                : Array.isArray(article.article_sources)
                  ? article.article_sources
                  : [],
            ),
            scheduledDate: scheduleParts?.date ?? '',
            scheduledTime: scheduleParts?.time ?? '',
            timezone: 'America/Sao_Paulo',
          });
          setPublishMode(nextStatus === 'scheduled' ? 'schedule' : 'now');
          setIsLoading(false);
          return;
        }
      }
      setIsLoading(false);
    };

    load();
    return () => {
      isMounted = false;
    };
  }, [slug]);

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

  const addSource = () => {
    setFormData((prev) => ({
      ...prev,
      sources: [
        ...prev.sources,
        { sourceType: 'reference', sourceName: '', sourceUrl: '', publisher: '' },
      ],
    }));
    setHasChanges(true);
    if (errors.sources) setErrors((prev) => ({ ...prev, sources: '' }));
  };

  const updateSource = (index: number, field: keyof ArticleSource, value: string) => {
    setFormData((prev) => {
      const sources = [...prev.sources];
      sources[index] = { ...sources[index], [field]: value };
      return { ...prev, sources };
    });
    setHasChanges(true);
    if (errors.sources) setErrors((prev) => ({ ...prev, sources: '' }));
  };

  const removeSource = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      sources: prev.sources.filter((_, sourceIndex) => sourceIndex !== index),
    }));
    setHasChanges(true);
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
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

    try {
      const payload = new FormData();
      payload.append('file', file);
      const result = await uploadEditorialImageApi(payload) as { file?: { url?: string } };
      const imageUrl = result.file?.url;
      if (!imageUrl) throw new Error('URL da imagem nao retornada');

      setFormData(prev => ({ ...prev, coverImage: imageUrl }));
      setHasChanges(true);
      toast.success('Imagem carregada com sucesso!');
      if (errors.coverImage) setErrors((prev) => ({ ...prev, coverImage: '' }));
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Erro no upload da imagem';
      toast.error(message);
    } finally {
      e.target.value = '';
    }
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
    const normalizedSources = normalizeSources(formData.sources);
    
    if (!formData.title.trim()) newErrors.title = 'Titulo e obrigatorio';
    else if (formData.title.length < 10) newErrors.title = 'Titulo deve ter pelo menos 10 caracteres';
    
    if (!formData.slug.trim()) newErrors.slug = 'Slug e obrigatorio';
    else if (!(await isEditorialSlugAvailable(formData.slug, slug))) newErrors.slug = 'Este slug ja esta em uso';
    
    if (!formData.excerpt.trim()) newErrors.excerpt = 'Resumo e obrigatorio';
    else if (formData.excerpt.length < 50) newErrors.excerpt = 'Resumo deve ter pelo menos 50 caracteres';
    else if (formData.excerpt.length > 300) newErrors.excerpt = 'Resumo deve ter no maximo 300 caracteres';
    
    if (!formData.content.trim()) newErrors.content = 'Conteudo e obrigatorio';
    else if (formData.content.length < 200) newErrors.content = 'Conteudo deve ter pelo menos 200 caracteres';
    
    if (!formData.authorId.trim()) newErrors.author = 'Perfil profissional obrigatório';
    
    if (!formData.coverImage.trim()) newErrors.coverImage = 'Imagem de capa e obrigatoria';
    if ((publishMode === 'schedule' || articleStatus !== 'published') && normalizedSources.length === 0) {
      newErrors.sources = 'Adicione pelo menos uma fonte editorial';
    }
    
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
        seoTitle: formData.seoTitle.trim() || undefined,
        excerpt: formData.excerpt,
        metaDescription: formData.seoDescription.trim() || undefined,
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
        sources: normalizeSources(formData.sources),
      };
      
      if (publishMode === 'schedule') {
        const publishedAt = buildScheduledAtIso(formData.scheduledDate, formData.scheduledTime, formData.timezone);
        await persistEditorialArticle({
          currentSlug: slug,
          articleData,
          mode: 'schedule',
          publishedAt,
        });
        toast.success('Agendamento atualizado com sucesso!');
      } else {
        if (articleStatus === 'published') {
          await updateArticleApi(slug, articleData);
          toast.success('Artigo atualizado com sucesso!');
        } else {
          await persistEditorialArticle({
            currentSlug: slug,
            articleData,
            mode: 'publish',
          });
          toast.success('Artigo publicado com sucesso!');
        }
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

  if (isLoading) {
    return (
      <main className="max-w-[1280px] mx-auto px-4 py-6 sm:py-8">
        <section className="flex items-center justify-center h-64">
          <section className="w-8 h-8 border-2 border-[#e5e5e5] border-t-[#c40000] rounded-full animate-spin" />
        </section>
      </main>
    );
  }

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
                {publishMode === 'schedule' ? 'Editar Agendamento' : 'Editar Noticia'}
              </h1>
              <p className="text-sm text-[#6b6b6b]">
                {publishMode === 'schedule' 
                  ? `Agendado para: ${formData.scheduledDate} as ${formData.scheduledTime}` 
                  : `Editando: ${formData.title}`}
                {lastSaved && (
                  <span className="ml-2 text-xs text-[#6b6b6b]">
                    - Auto-salvo as {lastSaved.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
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
                  {publishMode === 'schedule' ? 'Agendar' : 'Atualizar'}
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
                PublicaÃ§ao
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
                  {/* Modo de PublicaÃ§ao */}
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

                  {/* ConfiguraÃ§oes */}
                  <article className="bg-white border border-[#e5e5e5] rounded-lg p-4 sm:p-6">
                    <header className="flex items-center gap-3 mb-4">
                      <section className="p-2 bg-[#fef2f2] rounded-lg">
                        <Type className="w-5 h-5 text-[#c40000]" />
                      </section>
                      <section>
                        <h2 className="text-lg font-semibold text-[#111111]">ConfiguraÃ§oes de PublicaÃ§ao</h2>
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
                      <h2 className="text-lg font-semibold text-[#111111]">OtimizaÃ§ao para Buscas (SEO)</h2>
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
                        DescriÃ§ao SEO (Meta Description)
                      </Label>
                      <Textarea
                        id="seoDescription"
                        value={formData.seoDescription}
                        onChange={(e) => handleChange('seoDescription', e.target.value)}
                        placeholder="DescriÃ§ao que aparecera nos resultados de busca..."
                        rows={3}
                        className="mt-1.5 resize-none"
                      />
                      <p className={`mt-1 text-xs ${formData.seoDescription.length > 160 ? 'text-[#ef4444]' : 'text-[#6b6b6b]'}`}>
                        {formData.seoDescription.length}/160 caracteres (ideal)
                      </p>
                    </fieldset>

                    <fieldset className="mt-6 p-4 bg-[#f8fafc] rounded-lg">
                      <section className="flex items-center justify-between mb-3">
                        <section>
                          <h3 className="text-sm font-medium text-[#111111]">Fontes Editoriais</h3>
                          <p className="text-xs text-[#6b6b6b]">Pelo menos uma fonte e obrigatoria para publicar ou agendar.</p>
                        </section>
                        <Button type="button" variant="outline" size="sm" onClick={addSource}>
                          + Adicionar fonte
                        </Button>
                      </section>
                      {formData.sources.length > 0 ? (
                        <section className="space-y-3">
                          {formData.sources.map((source, index) => (
                            <section key={`${source.sourceName}-${index}`} className="p-3 bg-white rounded-lg border border-[#e5e5e5]">
                              <section className="flex items-center justify-between mb-2">
                                <span className="text-xs font-medium text-[#6b6b6b]">Fonte #{index + 1}</span>
                                <button
                                  type="button"
                                  onClick={() => removeSource(index)}
                                  className="text-[#ef4444] hover:text-[#dc2626]"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </section>
                              <Input
                                value={source.sourceName}
                                onChange={(e) => updateSource(index, 'sourceName', e.target.value)}
                                placeholder="Nome da fonte"
                                className="mb-2"
                              />
                              <Input
                                value={source.sourceUrl ?? ''}
                                onChange={(e) => updateSource(index, 'sourceUrl', e.target.value)}
                                placeholder="https://fonte.com/materia"
                                className="mb-2"
                              />
                              <Input
                                value={source.publisher ?? ''}
                                onChange={(e) => updateSource(index, 'publisher', e.target.value)}
                                placeholder="Veiculo / publisher"
                              />
                            </section>
                          ))}
                        </section>
                      ) : (
                        <p className="text-xs text-[#6b6b6b]">
                          Adicione as referencias usadas para embasar a publicacao.
                        </p>
                      )}
                      {errors.sources && (
                        <p className="mt-2 text-xs text-[#ef4444] flex items-center gap-1">
                          <AlertCircle className="w-3 h-3" />
                          {errors.sources}
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
                          {formData.seoDescription || formData.excerpt || 'DescriÃ§ao do artigo...'}
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
                          const specialTag = 'PublicaÃ§ao Patrocinada';
                          if (!formData.tags.includes(specialTag)) {
                            setFormData(prev => ({ ...prev, tags: [...prev.tags, specialTag] }));
                            setHasChanges(true);
                            toast.success('Tag "PublicaÃ§ao Patrocinada" adicionada');
                          } else {
                            toast.error('Esta tag ja existe');
                          }
                        }}
                        className={`text-xs rounded-full ${
                          formData.tags.includes('PublicaÃ§ao Patrocinada')
                            ? 'bg-[#fef2f2] border-[#c40000] text-[#c40000]'
                            : 'border-[#e6e1d8] hover:border-[#c40000] hover:text-[#c40000]'
                        }`}
                      >
                        ðŸ’Ž PublicaÃ§ao Patrocinada
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
                            tag === 'PublicaÃ§ao Patrocinada' 
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

        {/* Dialog de ConfirmaÃ§ao de Saida */}
        <Dialog open={showExitDialog} onOpenChange={setShowExitDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Sair sem salvar?</DialogTitle>
              <DialogDescription>
                VocÃª tem alteracoes nao salvas. Deseja realmente sair?
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
