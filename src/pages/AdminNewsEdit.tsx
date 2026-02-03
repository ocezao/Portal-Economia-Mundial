/**
 * Admin - Criar/Editar Notícia - Versão com Agendamento
 * Formulário completo com editor rich text, upload de imagens, auto-save e agendamento
 */

import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
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
  Sparkles,
  FileText,
  Calendar,
  User,
  Clock3,
  Play
} from 'lucide-react';

import { 
  createArticle, 
  updateArticle, 
  getArticleBySlug, 
  generateSlug, 
  isSlugAvailable,
  scheduleArticle,
  updateScheduledArticle,
  getScheduledArticles,
  type ScheduledArticle
} from '@/services/newsManager';
import { CONTENT_CONFIG } from '@/config/content';
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

export function AdminNewsEdit() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const isEditing = !!slug;
  const contentRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const autoSaveRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  
  // Modo de publicação
  const [publishMode, setPublishMode] = useState<'now' | 'schedule'>('now');
  const [scheduledInfo, setScheduledInfo] = useState<ScheduledArticle | null>(null);
  
  // Dados do formulário
  const [formData, setFormData] = useState({
    title: '',
    slug: '',
    excerpt: '',
    content: '',
    category: 'economia',
    author: '',
    tags: [] as string[],
    tagInput: '',
    coverImage: '',
    seoTitle: '',
    seoDescription: '',
    breaking: false,
    featured: false,
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
  const [isGeneratingContent, setIsGeneratingContent] = useState(false);

  // Carregar dados se estiver editando
  useEffect(() => {
    if (isEditing && slug) {
      const article = getArticleBySlug(slug);
      if (article) {
        setFormData({
          title: article.title,
          slug: article.slug,
          excerpt: article.excerpt,
          content: article.content.replace(/<[^>]*>/g, ''),
          category: article.category,
          author: article.author,
          tags: article.tags,
          tagInput: '',
          coverImage: article.coverImage,
          seoTitle: article.title,
          seoDescription: article.excerpt.slice(0, 160),
          breaking: article.breaking,
          featured: article.featured,
          scheduledDate: '',
          scheduledTime: '',
          timezone: 'America/Sao_Paulo',
        });
        setPublishMode('now');
      } else {
        // Verificar se é um artigo agendado sendo editado
        const scheduled = getScheduledArticles().find(s => s.articleData.slug === slug);
        if (scheduled) {
          setScheduledInfo(scheduled);
          setFormData({
            title: scheduled.articleData.title,
            slug: scheduled.articleData.slug,
            excerpt: scheduled.articleData.excerpt,
            content: scheduled.articleData.content.replace(/<[^>]*>/g, ''),
            category: scheduled.articleData.category,
            author: scheduled.articleData.author,
            tags: scheduled.articleData.tags,
            tagInput: '',
            coverImage: scheduled.articleData.coverImage,
            seoTitle: scheduled.articleData.title,
            seoDescription: scheduled.articleData.excerpt.slice(0, 160),
            breaking: scheduled.articleData.breaking,
            featured: scheduled.articleData.featured,
            scheduledDate: scheduled.scheduledDate,
            scheduledTime: scheduled.scheduledTime,
            timezone: scheduled.timezone,
          });
          setPublishMode('schedule');
        }
      }
    } else {
      // Novo artigo - definir data mínima como amanhã para agendamento
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      setFormData(prev => ({
        ...prev,
        scheduledDate: tomorrow.toISOString().split('T')[0],
        scheduledTime: '09:00',
      }));
    }
  }, [isEditing, slug]);

  // Auto-save
  useEffect(() => {
    if (hasChanges && formData.title) {
      autoSaveRef.current = setTimeout(() => {
        localStorage.setItem('pem_draft_article', JSON.stringify(formData));
        setLastSaved(new Date());
      }, 30000);
    }
    
    return () => {
      if (autoSaveRef.current) {
        clearTimeout(autoSaveRef.current);
      }
    };
  }, [formData, hasChanges]);

  // Alertar ao sair com alterações
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
      toast.error('Esta tag já existe');
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
      toast.error('Por favor, selecione uma imagem válida');
      return;
    }
    
    if (file.size > 5 * 1024 * 1024) {
      toast.error('A imagem deve ter no máximo 5MB');
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
        formattedText = `<em>${selectedText || 'texto em itálico'}</em>`;
        break;
      case 'h2':
        formattedText = `<h2>${selectedText || 'Título'}</h2>`;
        break;
      case 'h3':
        formattedText = `<h3>${selectedText || 'Subtítulo'}</h3>`;
        break;
      case 'quote':
        formattedText = `<blockquote>${selectedText || 'Citação'}</blockquote>`;
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

  const generateContent = async () => {
    if (!formData.title) {
      toast.error('Digite um título primeiro');
      return;
    }
    
    setIsGeneratingContent(true);
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    const generatedExcerpt = `Análise aprofundada sobre ${formData.title.toLowerCase()}. Este artigo explora os principais aspectos e implicações do tema, trazendo dados atualizados e perspectivas de especialistas do setor.`;
    
    const generatedContent = `<h2>Contexto e Panorama Atual</h2>
<p>O cenário atual de ${formData.title.toLowerCase()} apresenta desenvolvimentos significativos que merecem atenção especial. Especialistas acompanham de perto as mudanças e seus possíveis impactos.</p>

<h2>Principais Desenvolvimentos</h2>
<p>Os últimos acontecimentos demonstram uma aceleração nas mudanças relacionadas ao tema. Autoridades e especialistas têm monitorado a situação com atenção redobrada.</p>

<blockquote>
"Este é um momento crucial para compreendermos as implicações de longo prazo destas mudanças."
</blockquote>

<h2>Impacto e Projeções</h2>
<p>Analistas projetam que os efeitos destes desenvolvimentos se estenderão pelos próximos meses, influenciando diversos setores da economia e sociedade.</p>

<h2>Conclusão</h2>
<p>O acompanhamento contínuo desta situação é fundamental para compreender as tendências futuras e se preparar adequadamente para os cenários possíveis.</p>`;
    
    setFormData(prev => ({
      ...prev,
      excerpt: generatedExcerpt,
      content: generatedContent,
      seoDescription: generatedExcerpt.slice(0, 160),
    }));
    setHasChanges(true);
    setIsGeneratingContent(false);
    toast.success('Conteúdo gerado! Revise e ajuste conforme necessário.');
  };

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};
    
    if (!formData.title.trim()) newErrors.title = 'Título é obrigatório';
    else if (formData.title.length < 10) newErrors.title = 'Título deve ter pelo menos 10 caracteres';
    
    if (!formData.slug.trim()) newErrors.slug = 'Slug é obrigatório';
    else if (!isSlugAvailable(formData.slug, slug)) newErrors.slug = 'Este slug já está em uso';
    
    if (!formData.excerpt.trim()) newErrors.excerpt = 'Resumo é obrigatório';
    else if (formData.excerpt.length < 50) newErrors.excerpt = 'Resumo deve ter pelo menos 50 caracteres';
    else if (formData.excerpt.length > 300) newErrors.excerpt = 'Resumo deve ter no máximo 300 caracteres';
    
    if (!formData.content.trim()) newErrors.content = 'Conteúdo é obrigatório';
    else if (formData.content.length < 200) newErrors.content = 'Conteúdo deve ter pelo menos 200 caracteres';
    
    if (!formData.author.trim()) newErrors.author = 'Autor é obrigatório';
    
    if (!formData.coverImage.trim()) newErrors.coverImage = 'Imagem de capa é obrigatória';
    
    // Validar agendamento
    if (publishMode === 'schedule') {
      if (!formData.scheduledDate) {
        newErrors.scheduledDate = 'Data de agendamento é obrigatória';
      }
      if (!formData.scheduledTime) {
        newErrors.scheduledTime = 'Hora de agendamento é obrigatória';
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
    if (!validate()) {
      toast.error('Por favor, corrija os erros antes de salvar');
      return;
    }
    
    setIsSaving(true);
    
    try {
      const articleData = {
        title: formData.title,
        slug: formData.slug,
        excerpt: formData.excerpt,
        content: formData.content,
        category: formData.category as 'economia' | 'geopolitica' | 'tecnologia',
        author: formData.author,
        authorId: formData.author.toLowerCase().replace(/\s+/g, '-'),
        tags: formData.tags,
        coverImage: formData.coverImage,
        featured: formData.featured,
        breaking: formData.breaking,
        readingTime: Math.ceil(formData.content.split(/\s+/).length / 200),
      };
      
      if (publishMode === 'schedule') {
        // Agendar publicação
        if (scheduledInfo) {
          // Atualizar agendamento existente
          updateScheduledArticle(scheduledInfo.id, {
            articleData,
            scheduledDate: formData.scheduledDate,
            scheduledTime: formData.scheduledTime,
            timezone: formData.timezone,
          });
          toast.success('Agendamento atualizado com sucesso!');
        } else {
          // Criar novo agendamento
          scheduleArticle(
            articleData,
            formData.scheduledDate,
            formData.scheduledTime,
            formData.timezone
          );
          toast.success(`Artigo agendado para ${formData.scheduledDate} às ${formData.scheduledTime}!`);
        }
      } else {
        // Publicar imediatamente
        if (isEditing && slug) {
          updateArticle(slug, articleData);
          toast.success('Artigo atualizado com sucesso!');
        } else {
          createArticle(articleData);
          toast.success('Artigo publicado com sucesso!');
        }
      }
      
      localStorage.removeItem('pem_draft_article');
      setHasChanges(false);
      navigate('/admin#noticias');
    } catch (error) {
      toast.error('Erro ao salvar artigo');
    } finally {
      setIsSaving(false);
    }
  };

  const handleExit = () => {
    if (hasChanges) {
      setShowExitDialog(true);
    } else {
      navigate('/admin#noticias');
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
        label: i === 1 ? 'Amanhã' : i === 2 ? 'Depois de amanhã' : date.toLocaleDateString('pt-BR', { weekday: 'long' }),
        value: date.toISOString().split('T')[0],
      });
    }
    
    return dates;
  };

  return (
    <>
      <title>{isEditing ? 'Editar' : 'Nova'} Notícia - Admin PEM</title>

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
                {isEditing ? (scheduledInfo ? 'Editar Agendamento' : 'Editar Notícia') : 'Nova Notícia'}
              </h1>
              <p className="text-sm text-[#6b6b6b]">
                {isEditing 
                  ? (scheduledInfo 
                    ? `Agendado para: ${formData.scheduledDate} às ${formData.scheduledTime}` 
                    : `Editando: ${formData.title}`)
                  : 'Crie um novo artigo ou agende para depois'}
                {lastSaved && (
                  <span className="ml-2 text-xs text-[#6b6b6b]">
                    • Auto-salvo às {lastSaved.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
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
                  {publishMode === 'schedule' ? 'Agendar' : (isEditing ? 'Atualizar' : 'Publicar')}
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
              {formData.title || 'Título do Artigo'}
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
            
            <section 
              className="prose max-w-none prose-headings:text-[#111111] prose-p:text-[#333]"
              dangerouslySetInnerHTML={{ 
                __html: formData.content || '<p>Conteúdo do artigo...</p>' 
              }}
            />
          </section>
        ) : (
          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
            <TabsList className="grid w-full grid-cols-3 lg:w-fit">
              <TabsTrigger value="content" className="gap-2">
                <FileText className="w-4 h-4" />
                Conteúdo
              </TabsTrigger>
              <TabsTrigger value="publish" className="gap-2">
                <Clock className="w-4 h-4" />
                Publicação
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
                        placeholder="Digite um título impactante..."
                        className={`mt-1.5 text-lg ${errors.title ? 'border-[#ef4444]' : ''}`}
                      />
                      {errors.title ? (
                        <p className="mt-1 text-xs text-[#ef4444] flex items-center gap-1">
                          <AlertCircle className="w-3 h-3" />
                          {errors.title}
                        </p>
                      ) : (
                        <p className="mt-1 text-xs text-[#6b6b6b]">
                          {formData.title.length} caracteres • Ideal: 50-60 caracteres
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
                        placeholder="Breve resumo do artigo que será exibido nas listagens..."
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

                  {/* Conteúdo */}
                  <article className="bg-white border border-[#e5e5e5] rounded-lg p-4 sm:p-6">
                    <section className="flex items-center justify-between mb-4">
                      <Label htmlFor="content" className="text-sm font-medium text-[#111111]">
                        Conteúdo *
                      </Label>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={generateContent}
                        disabled={isGeneratingContent || !formData.title}
                        className="gap-2"
                      >
                        <Sparkles className="w-4 h-4" />
                        {isGeneratingContent ? 'Gerando...' : 'Gerar com IA'}
                      </Button>
                    </section>
                    
                    {/* Toolbar */}
                    <section className="flex flex-wrap gap-1 p-2 bg-[#f8fafc] rounded-t-lg border border-[#e5e5e5] border-b-0">
                      <Button type="button" variant="ghost" size="sm" onClick={() => insertFormat('h2')} className="h-8 w-8 p-0" title="Título H2">
                        <Heading1 className="w-4 h-4" />
                      </Button>
                      <Button type="button" variant="ghost" size="sm" onClick={() => insertFormat('h3')} className="h-8 w-8 p-0" title="Subtítulo H3">
                        <Heading2 className="w-4 h-4" />
                      </Button>
                      <section className="w-px h-6 bg-[#e5e5e5] mx-1 self-center" />
                      <Button type="button" variant="ghost" size="sm" onClick={() => insertFormat('bold')} className="h-8 w-8 p-0" title="Negrito">
                        <Bold className="w-4 h-4" />
                      </Button>
                      <Button type="button" variant="ghost" size="sm" onClick={() => insertFormat('italic')} className="h-8 w-8 p-0" title="Itálico">
                        <Italic className="w-4 h-4" />
                      </Button>
                      <section className="w-px h-6 bg-[#e5e5e5] mx-1 self-center" />
                      <Button type="button" variant="ghost" size="sm" onClick={() => insertFormat('quote')} className="h-8 w-8 p-0" title="Citação">
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
                      placeholder="Escreva o conteúdo completo do artigo aqui..."
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
                        {formData.content.length} caracteres • 
                        Tempo de leitura estimado: {Math.ceil(formData.content.split(/\s+/).length / 200)} min
                      </p>
                    </section>
                  </article>
                </TabsContent>

                <TabsContent value="publish" className="mt-0 space-y-6">
                  {/* Modo de Publicação */}
                  <article className="bg-white border border-[#e5e5e5] rounded-lg p-4 sm:p-6">
                    <header className="flex items-center gap-3 mb-4">
                      <section className="p-2 bg-blue-100 rounded-lg">
                        <Clock className="w-5 h-5 text-blue-600" />
                      </section>
                      <section>
                        <h2 className="text-lg font-semibold text-[#111111]">Quando Publicar?</h2>
                        <p className="text-xs text-[#6b6b6b]">Escolha quando o artigo será publicado</p>
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
                          <span className="text-xs text-[#6b6b6b]">Disponível imediatamente</span>
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
                            <Label className="text-sm text-[#111111]">Fuso Horário</Label>
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
                          
                          {/* Sugestões rápidas */}
                          <section>
                            <p className="text-xs text-[#6b6b6b] mb-2">Sugestões rápidas:</p>
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
                                <strong>Será publicado em:</strong><br />
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

                  {/* Configurações */}
                  <article className="bg-white border border-[#e5e5e5] rounded-lg p-4 sm:p-6">
                    <header className="flex items-center gap-3 mb-4">
                      <section className="p-2 bg-[#fef2f2] rounded-lg">
                        <Type className="w-5 h-5 text-[#c40000]" />
                      </section>
                      <section>
                        <h2 className="text-lg font-semibold text-[#111111]">Configurações de Publicação</h2>
                      </section>
                    </header>

                    <section className="space-y-4">
                      <section className="flex items-center justify-between p-3 bg-[#f8fafc] rounded-lg">
                        <section>
                          <p className="text-sm font-medium text-[#111111]">Destacar na home</p>
                          <p className="text-xs text-[#6b6b6b]">Aparece em destaque na página inicial</p>
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
                      <h2 className="text-lg font-semibold text-[#111111]">Otimização para Buscas (SEO)</h2>
                    </header>

                    <fieldset className="mb-4">
                      <Label htmlFor="seoTitle" className="text-sm font-medium text-[#111111]">
                        Título SEO
                      </Label>
                      <Input
                        id="seoTitle"
                        value={formData.seoTitle}
                        onChange={(e) => handleChange('seoTitle', e.target.value)}
                        placeholder="Título otimizado para SEO"
                        className="mt-1.5"
                      />
                      <p className="mt-1 text-xs text-[#6b6b6b]">
                        {formData.seoTitle.length}/60 caracteres (ideal)
                      </p>
                    </fieldset>

                    <fieldset>
                      <Label htmlFor="seoDescription" className="text-sm font-medium text-[#111111]">
                        Descrição SEO (Meta Description)
                      </Label>
                      <Textarea
                        id="seoDescription"
                        value={formData.seoDescription}
                        onChange={(e) => handleChange('seoDescription', e.target.value)}
                        placeholder="Descrição que aparecerá nos resultados de busca..."
                        rows={3}
                        className="mt-1.5 resize-none"
                      />
                      <p className={`mt-1 text-xs ${formData.seoDescription.length > 160 ? 'text-[#ef4444]' : 'text-[#6b6b6b]'}`}>
                        {formData.seoDescription.length}/160 caracteres (ideal)
                      </p>
                    </fieldset>

                    <section className="mt-6 p-4 bg-[#f8fafc] rounded-lg">
                      <p className="text-xs text-[#6b6b6b] mb-2">Preview nos resultados de busca:</p>
                      <section className="max-w-[600px]">
                        <p className="text-sm text-[#1a0dab] truncate">
                          {formData.seoTitle || formData.title || 'Título do Artigo'}
                        </p>
                        <p className="text-xs text-[#006621]">
                          portaleconomicomundial.com/noticias/{formData.slug || 'url-do-artigo'}
                        </p>
                        <p className="text-sm text-[#545454] line-clamp-2">
                          {formData.seoDescription || formData.excerpt || 'Descrição do artigo...'}
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
                        { label: 'Título', value: !!formData.title },
                        { label: 'Slug', value: !!formData.slug },
                        { label: 'Resumo', value: !!formData.excerpt },
                        { label: 'Conteúdo', value: !!formData.content },
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
                      <span className="text-xs text-[#6b6b6b]">JPG, PNG até 5MB</span>
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
                  
                  <section className="flex gap-2 mb-3">
                    <Input
                      value={formData.tagInput}
                      onChange={(e) => handleChange('tagInput', e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
                      placeholder="Adicionar tag..."
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
                          className="gap-1 cursor-pointer hover:bg-[#fef2f2]"
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
                  <h2 className="text-lg font-semibold text-[#111111] mb-4">Autor *</h2>
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
          </Tabs>
        )}

        {/* Dialog de Confirmação de Saída */}
        <Dialog open={showExitDialog} onOpenChange={setShowExitDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Sair sem salvar?</DialogTitle>
              <DialogDescription>
                Você tem alterações não salvas. Deseja realmente sair?
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowExitDialog(false)}>
                Continuar editando
              </Button>
              <Button 
                onClick={() => navigate('/admin#noticias')}
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
