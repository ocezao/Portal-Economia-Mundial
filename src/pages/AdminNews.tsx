/**
 * Admin - Gerenciamento de Notícias - Versão com Agendamento
 * Lista, filtros, paginação, ações CRUD e agendamento de posts
 */

import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { 
  Plus, 
  Search, 
  Edit2, 
  Trash2, 
  Copy, 
  Eye,
  CheckCircle,
  FileText,
  Filter,
  ChevronLeft,
  ChevronRight,
  BarChart3,
  RefreshCw,
  AlertTriangle,
  MoreHorizontal,
  Star,
  Zap,
  TrendingUp,
  Calendar,
  Download,
  Clock,
  X
} from 'lucide-react';
import { ROUTES } from '@/config/routes';
import { 
  getAllArticles, 
  deleteArticle, 
  duplicateArticle, 
  getArticleStats,
  getArticlesPaginated,
  getScheduledArticles,
  cancelScheduledArticle,
  deleteScheduledArticle,
  checkAndPublishScheduled,
  type ArticleFilters,
  type ScheduledArticle,
  resetToDefault
} from '@/services/newsManager';
import { CONTENT_CONFIG } from '@/config/content';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import type { NewsArticle } from '@/types';

export function AdminNews() {
  const [activeTab, setActiveTab] = useState('published');
  
  // Artigos publicados
  const [articles, setArticles] = useState<NewsArticle[]>([]);
  const [stats, setStats] = useState({
    total: 0,
    published: 0,
    breaking: 0,
    featured: 0,
    scheduled: 0,
    totalViews: 0,
    totalLikes: 0,
    byCategory: { economia: 0, geopolitica: 0, tecnologia: 0 },
  });
  const [isLoading, setIsLoading] = useState(true);
  
  // Artigos agendados
  const [scheduledArticles, setScheduledArticles] = useState<ScheduledArticle[]>([]);
  
  // Filtros
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<ArticleFilters['status']>('all');
  const [sortBy, setSortBy] = useState<ArticleFilters['sortBy']>('date');
  const [sortOrder, setSortOrder] = useState<ArticleFilters['sortOrder']>('desc');
  
  // Paginação
  const [currentPage, setCurrentPage] = useState(1);
  const [perPage, setPerPage] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  const [, setTotalItems] = useState(0);
  
  // Dialogs
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [articleToDelete, setArticleToDelete] = useState<NewsArticle | null>(null);
  const [scheduledToCancel, setScheduledToCancel] = useState<ScheduledArticle | null>(null);
  const [statsDialogOpen, setStatsDialogOpen] = useState(false);
  const [showFilters, setShowFilters] = useState(false);

  // Verificar publicações agendadas periodicamente
  useEffect(() => {
    const interval = setInterval(() => {
      const published = checkAndPublishScheduled();
      if (published > 0) {
        toast.success(`${published} artigo(s) agendado(s) publicado(s) automaticamente!`);
        loadData();
      }
    }, 60000); // Verifica a cada minuto
    
    return () => clearInterval(interval);
  }, []);

  const loadData = useCallback(() => {
    setIsLoading(true);
    
    // Carregar artigos publicados
    const filters: ArticleFilters = {
      search: searchTerm,
      category: categoryFilter,
      status: statusFilter,
      sortBy,
      sortOrder,
    };
    
    const result = getArticlesPaginated(filters, currentPage, perPage);
    setArticles(result.items);
    setTotalPages(result.totalPages);
    setTotalItems(result.total);
    
    // Carregar estatísticas
    setStats(getArticleStats());
    
    // Carregar artigos agendados
    setScheduledArticles(getScheduledArticles().filter(s => s.status === 'pending'));
    
    setIsLoading(false);
  }, [searchTerm, categoryFilter, statusFilter, sortBy, sortOrder, currentPage, perPage]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, categoryFilter, statusFilter]);

  const handleDelete = (article: NewsArticle) => {
    setArticleToDelete(article);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = () => {
    if (!articleToDelete) return;
    
    const success = deleteArticle(articleToDelete.slug);
    if (success) {
      toast.success(`Artigo "${articleToDelete.title}" excluído com sucesso!`);
      loadData();
    } else {
      toast.error('Erro ao excluir artigo');
    }
    setDeleteDialogOpen(false);
    setArticleToDelete(null);
  };

  const handleDuplicate = (article: NewsArticle) => {
    const newArticle = duplicateArticle(article.slug);
    if (newArticle) {
      toast.success(`Artigo "${article.title}" duplicado!`);
      loadData();
    } else {
      toast.error('Erro ao duplicar artigo');
    }
  };

  const handleCancelScheduled = (scheduled: ScheduledArticle) => {
    setScheduledToCancel(scheduled);
  };

  const confirmCancelScheduled = () => {
    if (!scheduledToCancel) return;
    
    const success = cancelScheduledArticle(scheduledToCancel.id);
    if (success) {
      toast.success('Agendamento cancelado com sucesso!');
      loadData();
    } else {
      toast.error('Erro ao cancelar agendamento');
    }
    setScheduledToCancel(null);
  };

  const handleDeleteScheduled = (id: string) => {
    if (confirm('Tem certeza que deseja excluir este agendamento permanentemente?')) {
      const success = deleteScheduledArticle(id);
      if (success) {
        toast.success('Agendamento excluído!');
        loadData();
      }
    }
  };

  const handleResetData = () => {
    if (confirm('ATENÇÃO: Isso restaurará todos os artigos para o estado inicial. Todas as alterações serão perdidas. Deseja continuar?')) {
      resetToDefault();
      toast.success('Dados restaurados para o padrão');
      loadData();
    }
  };

  const exportArticles = () => {
    const allArticles = getAllArticles();
    const allScheduled = getScheduledArticles();
    const data = {
      articles: allArticles,
      scheduled: allScheduled,
      exportedAt: new Date().toISOString(),
    };
    
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `pem-artigos-${Date.now()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success('Artigos exportados com sucesso!');
  };

  const getStatusBadge = (article: NewsArticle) => {
    if (article.breaking) {
      return (
        <Badge className="bg-[#fef2f2] text-[#c40000] hover:bg-[#fef2f2]">
          <Zap className="w-3 h-3 mr-1" />
          Urgente
        </Badge>
      );
    }
    if (article.featured) {
      return (
        <Badge className="bg-[#fefce8] text-[#a16207] hover:bg-[#fefce8]">
          <Star className="w-3 h-3 mr-1" />
          Destaque
        </Badge>
      );
    }
    return (
      <Badge className="bg-[#f0fdf4] text-[#166534] hover:bg-[#f0fdf4]">
        <CheckCircle className="w-3 h-3 mr-1" />
        Publicado
      </Badge>
    );
  };

  const formatScheduledDateTime = (date: string, time: string) => {
    const dateTime = new Date(`${date}T${time}`);
    return dateTime.toLocaleString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const isScheduledInPast = (date: string, time: string) => {
    const scheduled = new Date(`${date}T${time}`);
    return scheduled < new Date();
  };

  return (
    <>
      <title>Gerenciar Notícias - Admin PEM</title>

      <main className="max-w-[1400px] mx-auto px-4 py-6 sm:py-8">
        {/* Header */}
        <header className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-6">
          <section>
            <h1 className="text-2xl sm:text-3xl font-bold text-[#111111]">Gerenciar Notícias</h1>
            <p className="text-sm text-[#6b6b6b]">
              {stats.total} publicados • {stats.scheduled} agendados
            </p>
          </section>
          <section className="flex flex-wrap items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setStatsDialogOpen(true)}
              className="gap-2"
            >
              <BarChart3 className="w-4 h-4" />
              Estatísticas
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={exportArticles}
              className="gap-2"
            >
              <Download className="w-4 h-4" />
              Exportar
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleResetData}
              className="gap-2 text-[#ef4444] hover:text-[#ef4444]"
            >
              <RefreshCw className="w-4 h-4" />
              Reset
            </Button>
            <Link to={ROUTES.admin.novaNoticia}>
              <Button className="bg-[#c40000] hover:bg-[#a00000] gap-2">
                <Plus className="w-4 h-4" />
                Nova Notícia
              </Button>
            </Link>
          </section>
        </header>

        {/* Stats Cards */}
        <section className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-4 mb-6">
          <article className="bg-white border border-[#e5e5e5] rounded-lg p-4">
            <p className="text-2xl font-bold text-[#111111]">{stats.total}</p>
            <p className="text-xs text-[#6b6b6b]">Total</p>
          </article>
          <article className="bg-white border border-[#e5e5e5] rounded-lg p-4">
            <p className="text-2xl font-bold text-[#166534]">{stats.published}</p>
            <p className="text-xs text-[#6b6b6b]">Publicados</p>
          </article>
          <article className="bg-white border border-[#e5e5e5] rounded-lg p-4">
            <p className="text-2xl font-bold text-[#c40000]">{stats.breaking}</p>
            <p className="text-xs text-[#6b6b6b]">Urgentes</p>
          </article>
          <article className="bg-white border border-[#e5e5e5] rounded-lg p-4">
            <p className="text-2xl font-bold text-[#a16207]">{stats.featured}</p>
            <p className="text-xs text-[#6b6b6b]">Destaques</p>
          </article>
          <article className="bg-white border border-[#e5e5e5] rounded-lg p-4">
            <p className="text-2xl font-bold text-blue-600">{stats.scheduled}</p>
            <p className="text-xs text-[#6b6b6b]">Agendados</p>
          </article>
          <article className="bg-white border border-[#e5e5e5] rounded-lg p-4">
            <p className="text-2xl font-bold text-[#111111]">{(stats.totalViews / 1000).toFixed(1)}k</p>
            <p className="text-xs text-[#6b6b6b]">Views</p>
          </article>
          <article className="bg-white border border-[#e5e5e5] rounded-lg p-4">
            <p className="text-2xl font-bold text-[#111111]">{(stats.totalLikes / 1000).toFixed(1)}k</p>
            <p className="text-xs text-[#6b6b6b]">Curtidas</p>
          </article>
        </section>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-2 lg:w-fit">
            <TabsTrigger value="published" className="gap-2">
              <CheckCircle className="w-4 h-4" />
              Publicados
              <Badge variant="secondary" className="ml-1">{stats.total}</Badge>
            </TabsTrigger>
            <TabsTrigger value="scheduled" className="gap-2">
              <Clock className="w-4 h-4" />
              Agendados
              <Badge variant="secondary" className="ml-1">{stats.scheduled}</Badge>
            </TabsTrigger>
          </TabsList>

          {/* Tab Publicados */}
          <TabsContent value="published" className="space-y-6">
            {/* Filtros */}
            <section className="bg-white border border-[#e5e5e5] rounded-lg p-4">
              <section className="flex flex-col gap-4">
                <section className="flex flex-col sm:flex-row gap-3">
                  <section className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[#6b6b6b]" />
                    <Input
                      type="text"
                      placeholder="Buscar por título, slug ou tag..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </section>
                  <Button
                    variant="outline"
                    onClick={() => setShowFilters(!showFilters)}
                    className="gap-2"
                  >
                    <Filter className="w-4 h-4" />
                    Filtros
                  </Button>
                </section>
                
                {showFilters && (
                  <section className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-3 border-t border-[#e5e5e5]">
                    <select
                      value={categoryFilter}
                      onChange={(e) => setCategoryFilter(e.target.value)}
                      className="px-4 py-2 border border-[#e5e5e5] rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-[#c40000]"
                    >
                      <option value="all">Todas as categorias</option>
                      {Object.values(CONTENT_CONFIG.categories).map(cat => (
                        <option key={cat.slug} value={cat.slug}>{cat.name}</option>
                      ))}
                    </select>
                    
                    <select
                      value={statusFilter}
                      onChange={(e) => setStatusFilter(e.target.value as ArticleFilters['status'])}
                      className="px-4 py-2 border border-[#e5e5e5] rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-[#c40000]"
                    >
                      <option value="all">Todos os status</option>
                      <option value="published">Publicado</option>
                      <option value="breaking">Urgente</option>
                      <option value="featured">Destaque</option>
                    </select>
                    
                    <select
                      value={sortBy}
                      onChange={(e) => setSortBy(e.target.value as ArticleFilters['sortBy'])}
                      className="px-4 py-2 border border-[#e5e5e5] rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-[#c40000]"
                    >
                      <option value="date">Ordenar por data</option>
                      <option value="views">Ordenar por views</option>
                      <option value="likes">Ordenar por curtidas</option>
                    </select>
                    
                    <select
                      value={sortOrder}
                      onChange={(e) => setSortOrder(e.target.value as ArticleFilters['sortOrder'])}
                      className="px-4 py-2 border border-[#e5e5e5] rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-[#c40000]"
                    >
                      <option value="desc">Maior para menor</option>
                      <option value="asc">Menor para maior</option>
                    </select>
                  </section>
                )}
              </section>
            </section>

            {/* Lista de Artigos */}
            <section className="bg-white border border-[#e5e5e5] rounded-lg overflow-hidden">
              {isLoading ? (
                <section className="p-12 text-center">
                  <section className="w-8 h-8 border-2 border-[#e5e5e5] border-t-[#c40000] rounded-full animate-spin mx-auto mb-4" />
                  <p className="text-[#6b6b6b]">Carregando artigos...</p>
                </section>
              ) : (
                <>
                  <section className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-[#f9fafb] border-b border-[#e5e5e5]">
                        <tr>
                          <th className="px-4 py-3 text-left text-xs font-semibold text-[#6b6b6b] uppercase">Artigo</th>
                          <th className="px-4 py-3 text-left text-xs font-semibold text-[#6b6b6b] uppercase">Categoria</th>
                          <th className="px-4 py-3 text-left text-xs font-semibold text-[#6b6b6b] uppercase">Status</th>
                          <th className="px-4 py-3 text-left text-xs font-semibold text-[#6b6b6b] uppercase">Engajamento</th>
                          <th className="px-4 py-3 text-left text-xs font-semibold text-[#6b6b6b] uppercase">Data</th>
                          <th className="px-4 py-3 text-left text-xs font-semibold text-[#6b6b6b] uppercase">Ações</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#e5e5e5]">
                        {articles.map((article) => (
                          <tr key={article.slug} className="hover:bg-[#f9fafb]">
                            <td className="px-4 py-3">
                              <section className="flex items-center gap-3">
                                <img 
                                  src={article.coverImage} 
                                  alt="" 
                                  className="w-12 h-12 rounded object-cover flex-shrink-0"
                                />
                                <section className="min-w-0">
                                  <p className="font-medium text-[#111111] text-sm truncate max-w-[250px]">
                                    {article.title}
                                  </p>
                                  <p className="text-xs text-[#6b6b6b]">/{article.slug}</p>
                                  <p className="text-xs text-[#6b6b6b]">por {article.author}</p>
                                </section>
                              </section>
                            </td>
                            <td className="px-4 py-3">
                              <Badge 
                                variant="secondary"
                                style={{ 
                                  backgroundColor: `${CONTENT_CONFIG.categories[article.category as keyof typeof CONTENT_CONFIG.categories]?.color}20`,
                                  color: CONTENT_CONFIG.categories[article.category as keyof typeof CONTENT_CONFIG.categories]?.color 
                                }}
                              >
                                {CONTENT_CONFIG.categories[article.category as keyof typeof CONTENT_CONFIG.categories]?.name || article.category}
                              </Badge>
                            </td>
                            <td className="px-4 py-3">
                              {getStatusBadge(article)}
                            </td>
                            <td className="px-4 py-3">
                              <section className="text-sm">
                                <p className="text-[#111111]">
                                  <Eye className="w-3.5 h-3.5 inline mr-1 text-[#6b6b6b]" />
                                  {article.views.toLocaleString('pt-BR')}
                                </p>
                                <p className="text-[#6b6b6b] text-xs">
                                  <TrendingUp className="w-3 h-3 inline mr-1" />
                                  {article.likes} curtidas
                                </p>
                              </section>
                            </td>
                            <td className="px-4 py-3 text-sm text-[#6b6b6b]">
                              <section className="flex items-center gap-1">
                                <Calendar className="w-3.5 h-3.5" />
                                {new Date(article.publishedAt).toLocaleDateString('pt-BR')}
                              </section>
                              <p className="text-xs text-[#6b6b6b]">
                                {article.readingTime} min de leitura
                              </p>
                            </td>
                            <td className="px-4 py-3">
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                                    <MoreHorizontal className="w-4 h-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  <DropdownMenuItem asChild>
                                    <Link to={`/noticias/${article.slug}`} target="_blank">
                                      <Eye className="w-4 h-4 mr-2" />
                                      Visualizar
                                    </Link>
                                  </DropdownMenuItem>
                                  <DropdownMenuItem asChild>
                                    <Link to={`/admin/noticias/editar/${article.slug}`}>
                                      <Edit2 className="w-4 h-4 mr-2" />
                                      Editar
                                    </Link>
                                  </DropdownMenuItem>
                                  <DropdownMenuItem onClick={() => handleDuplicate(article)}>
                                    <Copy className="w-4 h-4 mr-2" />
                                    Duplicar
                                  </DropdownMenuItem>
                                  <DropdownMenuSeparator />
                                  <DropdownMenuItem 
                                    onClick={() => handleDelete(article)}
                                    className="text-[#ef4444] focus:text-[#ef4444]"
                                  >
                                    <Trash2 className="w-4 h-4 mr-2" />
                                    Excluir
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </section>
                  
                  {articles.length === 0 && (
                    <section className="p-12 text-center">
                      <FileText className="w-12 h-12 mx-auto text-[#e5e5e5] mb-3" />
                      <p className="text-[#6b6b6b]">Nenhum artigo encontrado</p>
                      <Button 
                        variant="outline" 
                        onClick={() => {
                          setSearchTerm('');
                          setCategoryFilter('all');
                          setStatusFilter('all');
                        }}
                        className="mt-4"
                      >
                        Limpar filtros
                      </Button>
                    </section>
                  )}
                  
                  {/* Paginação */}
                  {totalPages > 1 && (
                    <section className="flex items-center justify-between px-4 py-4 border-t border-[#e5e5e5]">
                      <section className="flex items-center gap-2">
                        <span className="text-sm text-[#6b6b6b]">Itens por página:</span>
                        <select
                          value={perPage}
                          onChange={(e) => setPerPage(Number(e.target.value))}
                          className="px-2 py-1 border border-[#e5e5e5] rounded text-sm"
                        >
                          <option value={5}>5</option>
                          <option value={10}>10</option>
                          <option value={25}>25</option>
                          <option value={50}>50</option>
                        </select>
                      </section>
                      
                      <section className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                          disabled={currentPage === 1}
                        >
                          <ChevronLeft className="w-4 h-4" />
                        </Button>
                        
                        <section className="flex items-center gap-1">
                          {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                            let page;
                            if (totalPages <= 5) {
                              page = i + 1;
                            } else if (currentPage <= 3) {
                              page = i + 1;
                            } else if (currentPage >= totalPages - 2) {
                              page = totalPages - 4 + i;
                            } else {
                              page = currentPage - 2 + i;
                            }
                            
                            return (
                              <Button
                                key={page}
                                variant={currentPage === page ? 'default' : 'outline'}
                                size="sm"
                                onClick={() => setCurrentPage(page)}
                                className={currentPage === page ? 'bg-[#c40000] hover:bg-[#a00000]' : ''}
                              >
                                {page}
                              </Button>
                            );
                          })}
                        </section>
                        
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                          disabled={currentPage === totalPages}
                        >
                          <ChevronRight className="w-4 h-4" />
                        </Button>
                      </section>
                    </section>
                  )}
                </>
              )}
            </section>
          </TabsContent>

          {/* Tab Agendados */}
          <TabsContent value="scheduled" className="space-y-6">
            <section className="bg-white border border-[#e5e5e5] rounded-lg p-4">
              <section className="flex items-center justify-between">
                <section>
                  <h3 className="font-semibold text-[#111111]">Artigos Agendados</h3>
                  <p className="text-sm text-[#6b6b6b]">
                    {scheduledArticles.length} artigo(s) agendado(s) para publicação automática
                  </p>
                </section>
                <Link to={ROUTES.admin.novaNoticia}>
                  <Button className="bg-blue-600 hover:bg-blue-700 gap-2">
                    <Plus className="w-4 h-4" />
                    Agendar Novo
                  </Button>
                </Link>
              </section>
            </section>

            <section className="bg-white border border-[#e5e5e5] rounded-lg overflow-hidden">
              {scheduledArticles.length > 0 ? (
                <section className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-[#f9fafb] border-b border-[#e5e5e5]">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-[#6b6b6b] uppercase">Artigo</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-[#6b6b6b] uppercase">Categoria</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-[#6b6b6b] uppercase">Data de Publicação</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-[#6b6b6b] uppercase">Status</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-[#6b6b6b] uppercase">Ações</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#e5e5e5]">
                      {scheduledArticles.map((scheduled) => (
                        <tr key={scheduled.id} className="hover:bg-[#f9fafb]">
                          <td className="px-4 py-3">
                            <section className="flex items-center gap-3">
                              <section className="w-12 h-12 rounded bg-blue-100 flex items-center justify-center">
                                <Clock className="w-6 h-6 text-blue-600" />
                              </section>
                              <section className="min-w-0">
                                <p className="font-medium text-[#111111] text-sm truncate max-w-[300px]">
                                  {scheduled.articleData.title}
                                </p>
                                <p className="text-xs text-[#6b6b6b]">/{scheduled.articleData.slug}</p>
                                <p className="text-xs text-[#6b6b6b]">por {scheduled.articleData.author}</p>
                              </section>
                            </section>
                          </td>
                          <td className="px-4 py-3">
                            <Badge 
                              variant="secondary"
                              style={{ 
                                backgroundColor: `${CONTENT_CONFIG.categories[scheduled.articleData.category as keyof typeof CONTENT_CONFIG.categories]?.color}20`,
                                color: CONTENT_CONFIG.categories[scheduled.articleData.category as keyof typeof CONTENT_CONFIG.categories]?.color 
                              }}
                            >
                              {CONTENT_CONFIG.categories[scheduled.articleData.category as keyof typeof CONTENT_CONFIG.categories]?.name || scheduled.articleData.category}
                            </Badge>
                          </td>
                          <td className="px-4 py-3">
                            <section className="text-sm">
                              <section className="flex items-center gap-2 text-[#111111]">
                                <Calendar className="w-4 h-4 text-blue-600" />
                                {formatScheduledDateTime(scheduled.scheduledDate, scheduled.scheduledTime)}
                              </section>
                              <p className="text-xs text-[#6b6b6b] mt-1">
                                Fuso: {scheduled.timezone}
                              </p>
                              {isScheduledInPast(scheduled.scheduledDate, scheduled.scheduledTime) && (
                                <Badge className="mt-2 bg-orange-100 text-orange-600">
                                  Será publicado em breve
                                </Badge>
                              )}
                            </section>
                          </td>
                          <td className="px-4 py-3">
                            <Badge className="bg-blue-100 text-blue-600">
                              <Clock className="w-3 h-3 mr-1" />
                              Agendado
                            </Badge>
                          </td>
                          <td className="px-4 py-3">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                                  <MoreHorizontal className="w-4 h-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem 
                                  onClick={() => handleCancelScheduled(scheduled)}
                                  className="text-orange-600"
                                >
                                  <X className="w-4 h-4 mr-2" />
                                  Cancelar Agendamento
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem 
                                  onClick={() => handleDeleteScheduled(scheduled.id)}
                                  className="text-[#ef4444]"
                                >
                                  <Trash2 className="w-4 h-4 mr-2" />
                                  Excluir
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </section>
              ) : (
                <section className="p-12 text-center">
                  <Clock className="w-12 h-12 mx-auto text-[#e5e5e5] mb-3" />
                  <p className="text-[#6b6b6b]">Nenhum artigo agendado</p>
                  <p className="text-sm text-[#6b6b6b] mt-2">
                    Ao criar um novo artigo, você pode agendar sua publicação para uma data futura.
                  </p>
                  <Link to={ROUTES.admin.novaNoticia}>
                    <Button className="mt-4 bg-blue-600 hover:bg-blue-700">
                      Criar Agendamento
                    </Button>
                  </Link>
                </section>
              )}
            </section>
          </TabsContent>
        </Tabs>

        {/* Dialog de Estatísticas */}
        <Dialog open={statsDialogOpen} onOpenChange={setStatsDialogOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Estatísticas de Conteúdo</DialogTitle>
              <DialogDescription>
                Visão geral do desempenho dos artigos
              </DialogDescription>
            </DialogHeader>
            
            <section className="grid grid-cols-2 gap-4 py-4">
              <article className="p-4 bg-[#f8fafc] rounded-lg">
                <p className="text-3xl font-bold text-[#111111]">{stats.total}</p>
                <p className="text-sm text-[#6b6b6b]">Total de Artigos</p>
              </article>
              <article className="p-4 bg-[#f8fafc] rounded-lg">
                <p className="text-3xl font-bold text-[#166534]">{stats.published}</p>
                <p className="text-sm text-[#6b6b6b]">Publicados</p>
              </article>
              <article className="p-4 bg-[#f8fafc] rounded-lg">
                <p className="text-3xl font-bold text-[#c40000]">{stats.breaking}</p>
                <p className="text-sm text-[#6b6b6b]">Urgentes</p>
              </article>
              <article className="p-4 bg-[#f8fafc] rounded-lg">
                <p className="text-3xl font-bold text-[#a16207]">{stats.featured}</p>
                <p className="text-sm text-[#6b6b6b]">Destaques</p>
              </article>
              <article className="p-4 bg-[#f8fafc] rounded-lg">
                <p className="text-3xl font-bold text-blue-600">{stats.scheduled}</p>
                <p className="text-sm text-[#6b6b6b]">Agendados</p>
              </article>
            </section>
            
            <section className="space-y-4">
              <h4 className="font-medium text-[#111111]">Por Categoria</h4>
              <section className="space-y-2">
                {Object.entries(stats.byCategory).map(([category, count]) => (
                  <section key={category} className="flex items-center justify-between p-2 bg-[#f8fafc] rounded">
                    <span className="text-sm text-[#111111] capitalize">{category}</span>
                    <section className="flex items-center gap-2">
                      <section 
                        className="h-2 rounded-full"
                        style={{ 
                          width: `${(count / stats.total) * 100}px`,
                          backgroundColor: CONTENT_CONFIG.categories[category as keyof typeof CONTENT_CONFIG.categories]?.color || '#6b6b6b',
                          minWidth: count > 0 ? '20px' : '0'
                        }}
                      />
                      <span className="text-sm text-[#6b6b6b] w-8">{count}</span>
                    </section>
                  </section>
                ))}
              </section>
            </section>
            
            <section className="grid grid-cols-2 gap-4 pt-4 border-t">
              <article>
                <p className="text-2xl font-bold text-[#111111]">{stats.totalViews.toLocaleString('pt-BR')}</p>
                <p className="text-sm text-[#6b6b6b]">Total de Visualizações</p>
              </article>
              <article>
                <p className="text-2xl font-bold text-[#111111]">{stats.totalLikes.toLocaleString('pt-BR')}</p>
                <p className="text-sm text-[#6b6b6b]">Total de Curtidas</p>
              </article>
            </section>
            
            <DialogFooter>
              <Button onClick={() => setStatsDialogOpen(false)}>Fechar</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Dialog de Confirmação de Exclusão */}
        <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-[#ef4444]">
                <AlertTriangle className="w-5 h-5" />
                Confirmar Exclusão
              </DialogTitle>
              <DialogDescription>
                Tem certeza que deseja excluir o artigo <strong>"{articleToDelete?.title}"</strong>?
                <br /><br />
                Esta ação não pode ser desfeita.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>
                Cancelar
              </Button>
              <Button 
                onClick={confirmDelete}
                className="bg-[#ef4444] hover:bg-[#dc2626]"
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Excluir Permanentemente
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Dialog de Cancelar Agendamento */}
        <Dialog open={!!scheduledToCancel} onOpenChange={() => setScheduledToCancel(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-orange-600">
                <X className="w-5 h-5" />
                Cancelar Agendamento
              </DialogTitle>
              <DialogDescription>
                Deseja cancelar a publicação agendada de <strong>"{scheduledToCancel?.articleData.title}"</strong>?
                <br /><br />
                O artigo não será publicado automaticamente.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button variant="outline" onClick={() => setScheduledToCancel(null)}>
                Voltar
              </Button>
              <Button 
                onClick={confirmCancelScheduled}
                className="bg-orange-600 hover:bg-orange-700"
              >
                <X className="w-4 h-4 mr-2" />
                Cancelar Agendamento
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </main>
    </>
  );
}
