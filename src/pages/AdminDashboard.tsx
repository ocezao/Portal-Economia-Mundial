/**
 * Admin Dashboard - Painel Administrativo Completo
 * Todas as funções de administração em um único lugar
 */

import { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  FileText, 
  Users, 
  TrendingUp, 
  AlertTriangle, 
  ArrowRight,
  Plus,
  Edit2,
  Trash2,
  Copy,
  Eye,
  CheckCircle,
  Clock,
  Calendar,
  RefreshCw,
  Search,
  MoreHorizontal,
  Star,
  Zap,
  ChevronLeft,
  ChevronRight,
  Settings,
  LogOut,
  X,
  LayoutDashboard,
  Newspaper,
  UserCog,
  PieChart,
  Bell,
  Check,
  User,
  Shield,
  Download,
  ChevronLeft as ChevronLeftIcon,
  ChevronRight as ChevronRightIcon,
  Save
} from 'lucide-react';
import { useAuth, type UserRole } from '@/contexts/AuthContext';
import { storage } from '@/config/storage';
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
import { Label } from '@/components/ui/label';
import { 
  getAllArticles, 
  deleteArticle, 
  duplicateArticle, 
  getArticleStats,
  getArticlesPaginated,
  getScheduledArticles,
  cancelScheduledArticle,
  deleteScheduledArticle,
  updateScheduledArticle,
  checkAndPublishScheduled,
  type ArticleFilters,
  type ScheduledArticle,
  resetToDefault
} from '@/services/newsManager';
import type { NewsArticle } from '@/types';

// Interface para usuários do sistema
interface SystemUser {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  createdAt: string;
  lastLogin: string;
  isActive: boolean;
  region?: string;
  bio?: string;
  profession?: string;
  company?: string;
}

export function AdminDashboard() {
  const { user: currentUser, logout } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('dashboard');
  
  // Estados para gerenciamento de artigos
  const [articles, setArticles] = useState<NewsArticle[]>([]);
  const [scheduledArticles, setScheduledArticles] = useState<ScheduledArticle[]>([]);
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
  
  // Estados para usuários
  const [users, setUsers] = useState<SystemUser[]>([]);
  const [userSearch, setUserSearch] = useState('');
  const [userToDelete, setUserToDelete] = useState<SystemUser | null>(null);
  const [userToEdit, setUserToEdit] = useState<SystemUser | null>(null);
  const [showUserForm, setShowUserForm] = useState(false);
  const [isEditingUser, setIsEditingUser] = useState(false);
  
  // Form de usuário
  const [userFormData, setUserFormData] = useState<Partial<SystemUser>>({
    name: '',
    email: '',
    role: 'user',
    region: '',
    bio: '',
    profession: '',
    company: '',
    isActive: true,
  });
  
  // Filtros de artigos
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<ArticleFilters['status']>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [perPage, setPerPage] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  const [selectedArticles, setSelectedArticles] = useState<string[]>([]);
  
  // Calendário
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  
  // Dialogs
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [articleToDelete, setArticleToDelete] = useState<NewsArticle | null>(null);
  const [showStatsDialog, setShowStatsDialog] = useState(false);
  const [editScheduledOpen, setEditScheduledOpen] = useState(false);
  const [scheduledToEdit, setScheduledToEdit] = useState<ScheduledArticle | null>(null);
  const [bulkActionDialog, setBulkActionDialog] = useState(false);
  const [dateDetailsOpen, setDateDetailsOpen] = useState(false);

  // Verificar publicações agendadas periodicamente
  useEffect(() => {
    const interval = setInterval(() => {
      const published = checkAndPublishScheduled();
      if (published > 0) {
        toast.success(`${published} artigo(s) agendado(s) publicado(s)!`);
        loadData();
      }
    }, 60000);
    
    return () => clearInterval(interval);
  }, []);

  const loadData = useCallback(() => {
    setIsLoading(true);
    
    const filters: ArticleFilters = {
      search: searchTerm,
      category: categoryFilter,
      status: statusFilter,
    };
    
    const result = getArticlesPaginated(filters, currentPage, perPage);
    setArticles(result.items);
    setTotalPages(result.totalPages);
    
    setStats(getArticleStats());
    setScheduledArticles(getScheduledArticles().filter(s => s.status === 'pending'));
    
    loadUsers();
    
    setIsLoading(false);
  }, [searchTerm, categoryFilter, statusFilter, currentPage, perPage]);

  const loadUsers = () => {
    const registeredUsers = storage.get<Array<{id: string; email: string; name?: string; createdAt?: string}>>('pem_registered_users') || [];
    const allUsers: SystemUser[] = [
      {
        id: 'admin-001',
        name: 'Administrador PEM',
        email: 'admin@pem.com',
        role: 'admin',
        createdAt: '2024-01-01T00:00:00Z',
        lastLogin: new Date().toISOString(),
        isActive: true,
        region: 'BR',
        bio: 'Administrador do sistema',
        profession: 'Administrador',
        company: 'Portal Econômico Mundial',
      },
      {
        id: 'user-001',
        name: 'Usuário Demo',
        email: 'usuario@exemplo.com',
        role: 'user',
        createdAt: '2024-01-15T00:00:00Z',
        lastLogin: new Date().toISOString(),
        isActive: true,
        region: 'BR',
        bio: '',
        profession: 'Estudante',
        company: '',
      },
      ...registeredUsers.map((u, index) => ({
        id: u.id,
        name: u.name || `Usuário ${index + 1}`,
        email: u.email,
        role: 'user' as UserRole,
        createdAt: u.createdAt || new Date().toISOString(),
        lastLogin: new Date().toISOString(),
        isActive: true,
        region: '',
        bio: '',
        profession: '',
        company: '',
      })),
    ];
    setUsers(allUsers);
  };

  useEffect(() => {
    loadData();
  }, [loadData]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, categoryFilter, statusFilter]);

  // Funções do calendário
  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDay = firstDay.getDay();
    
    const days = [];
    
    // Dias vazios antes do início do mês
    for (let i = 0; i < startingDay; i++) {
      days.push(null);
    }
    
    // Dias do mês
    for (let i = 1; i <= daysInMonth; i++) {
      days.push(i);
    }
    
    return days;
  };

  const getScheduledForDate = (day: number) => {
    const dateStr = `${currentMonth.getFullYear()}-${String(currentMonth.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    return scheduledArticles.filter(s => s.scheduledDate === dateStr);
  };

  const monthNames = [
    'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
    'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
  ];

  const prevMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1));
  };

  const nextMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1));
  };

  const handleDateClick = (day: number) => {
    const dateStr = `${currentMonth.getFullYear()}-${String(currentMonth.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    setSelectedDate(dateStr);
    setDateDetailsOpen(true);
  };

  const handleDelete = (article: NewsArticle) => {
    setArticleToDelete(article);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = () => {
    if (!articleToDelete) return;
    
    const success = deleteArticle(articleToDelete.slug);
    if (success) {
      toast.success(`Artigo "${articleToDelete.title}" excluído!`);
      loadData();
    }
    setDeleteDialogOpen(false);
  };

  const handleDuplicate = (article: NewsArticle) => {
    const newArticle = duplicateArticle(article.slug);
    if (newArticle) {
      toast.success(`Artigo "${article.title}" duplicado!`);
      loadData();
    }
  };

  const handleCancelScheduled = (id: string) => {
    cancelScheduledArticle(id);
    toast.success('Agendamento cancelado!');
    loadData();
  };

  const handleDeleteScheduled = (id: string) => {
    if (confirm('Excluir agendamento permanentemente?')) {
      deleteScheduledArticle(id);
      toast.success('Agendamento excluído!');
      loadData();
    }
  };

  const handleEditScheduled = (scheduled: ScheduledArticle) => {
    setScheduledToEdit(scheduled);
    setEditScheduledOpen(true);
  };

  const saveScheduledChanges = () => {
    if (!scheduledToEdit) return;
    
    updateScheduledArticle(scheduledToEdit.id, {
      scheduledDate: scheduledToEdit.scheduledDate,
      scheduledTime: scheduledToEdit.scheduledTime,
    });
    
    toast.success('Agendamento atualizado!');
    setEditScheduledOpen(false);
    loadData();
  };

  // Funções de usuários
  const handleAddUser = () => {
    setIsEditingUser(false);
    setUserFormData({
      name: '',
      email: '',
      role: 'user',
      region: '',
      bio: '',
      profession: '',
      company: '',
      isActive: true,
    });
    setShowUserForm(true);
  };

  const handleEditUser = (user: SystemUser) => {
    setIsEditingUser(true);
    setUserToEdit(user);
    setUserFormData({
      name: user.name,
      email: user.email,
      role: user.role,
      region: user.region,
      bio: user.bio,
      profession: user.profession,
      company: user.company,
      isActive: user.isActive,
    });
    setShowUserForm(true);
  };

  const saveUser = () => {
    if (!userFormData.name || !userFormData.email) {
      toast.error('Nome e email são obrigatórios!');
      return;
    }

    if (isEditingUser && userToEdit) {
      // Editar usuário existente
      if (userToEdit.id === 'admin-001' || userToEdit.id === 'user-001') {
        // Usuários mock - apenas atualiza na lista local
        const updatedUsers = users.map(u => 
          u.id === userToEdit.id ? { ...u, ...userFormData } as SystemUser : u
        );
        setUsers(updatedUsers);
      } else {
        // Usuário registrado - atualiza no storage
        const registeredUsers = storage.get<Array<any>>('pem_registered_users') || [];
        const updated = registeredUsers.map(u => 
          u.id === userToEdit.id ? { ...u, ...userFormData } : u
        );
        storage.set('pem_registered_users', updated);
      }
      toast.success('Usuário atualizado com sucesso!');
    } else {
      // Criar novo usuário
      const newUser = {
        id: `user_${Date.now()}`,
        ...userFormData,
        createdAt: new Date().toISOString(),
        lastLogin: new Date().toISOString(),
      };
      
      const registeredUsers = storage.get<Array<any>>('pem_registered_users') || [];
      registeredUsers.push(newUser);
      storage.set('pem_registered_users', registeredUsers);
      
      toast.success('Usuário criado com sucesso!');
    }
    
    setShowUserForm(false);
    loadUsers();
  };

  const handleDeleteUser = (user: SystemUser) => {
    setUserToDelete(user);
  };

  const confirmDeleteUser = () => {
    if (!userToDelete) return;
    
    if (userToDelete.id === currentUser?.id) {
      toast.error('Você não pode excluir sua própria conta!');
      setUserToDelete(null);
      return;
    }
    
    if (userToDelete.id === 'admin-001' || userToDelete.id === 'user-001') {
      toast.error('Não é possível excluir usuários de demonstração!');
      setUserToDelete(null);
      return;
    }
    
    const registeredUsers = storage.get<Array<{id: string}>>('pem_registered_users') || [];
    const updated = registeredUsers.filter(u => u.id !== userToDelete.id);
    storage.set('pem_registered_users', updated);
    
    toast.success(`Usuário "${userToDelete.name}" excluído!`);
    setUserToDelete(null);
    loadUsers();
  };

  const toggleArticleSelection = (slug: string) => {
    setSelectedArticles(prev => 
      prev.includes(slug) 
        ? prev.filter(s => s !== slug)
        : [...prev, slug]
    );
  };

  const selectAllArticles = () => {
    if (selectedArticles.length === articles.length) {
      setSelectedArticles([]);
    } else {
      setSelectedArticles(articles.map(a => a.slug));
    }
  };

  const handleBulkDelete = () => {
    if (selectedArticles.length === 0) return;
    
    let deleted = 0;
    selectedArticles.forEach(slug => {
      if (deleteArticle(slug)) deleted++;
    });
    
    toast.success(`${deleted} artigo(s) excluído(s)!`);
    setSelectedArticles([]);
    setBulkActionDialog(false);
    loadData();
  };

  const exportData = () => {
    const data = {
      articles: getAllArticles(),
      scheduled: getScheduledArticles(),
      exportedAt: new Date().toISOString(),
    };
    
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `pem-backup-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('Backup exportado!');
  };

  const exportUsersCSV = () => {
    const csv = [
      ['ID', 'Nome', 'Email', 'Tipo', 'Região', 'Profissão', 'Empresa', 'Data de Cadastro', 'Último Login', 'Status'].join(','),
      ...users.map(u => [
        u.id,
        `"${u.name}"`,
        u.email,
        u.role,
        u.region || '',
        u.profession || '',
        u.company || '',
        new Date(u.createdAt).toLocaleDateString('pt-BR'),
        new Date(u.lastLogin).toLocaleDateString('pt-BR'),
        u.isActive ? 'Ativo' : 'Inativo',
      ].join(',')),
    ].join('\n');
    
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `pem-usuarios-${Date.now()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('Usuários exportados!');
  };

  const filteredUsers = users.filter(u => 
    u.name.toLowerCase().includes(userSearch.toLowerCase()) ||
    u.email.toLowerCase().includes(userSearch.toLowerCase())
  );

  const topArticles = [...articles]
    .sort((a, b) => b.views - a.views)
    .slice(0, 5);

  const alerts = [];
  if (stats.scheduled > 0) {
    alerts.push({ type: 'info', message: `${stats.scheduled} artigo(s) agendado(s) para publicação` });
  }
  if (selectedArticles.length > 0) {
    alerts.push({ type: 'warning', message: `${selectedArticles.length} artigo(s) selecionado(s)` });
  }

  const calendarDays = getDaysInMonth(currentMonth);
  const weekDays = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

  return (
    <>
      <title>Painel Administrativo - Portal Econômico Mundial</title>

      <main className="max-w-[1400px] mx-auto px-4 py-6 sm:py-8">
        {/* Header */}
        <header className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-6">
          <section className="flex items-center gap-3">
            <section className="p-2 bg-[#c40000] rounded-lg">
              <LayoutDashboard className="w-6 h-6 text-white" />
            </section>
            <section>
              <h1 className="text-2xl sm:text-3xl font-bold text-[#111111]">Painel Administrativo</h1>
              <p className="text-sm text-[#6b6b6b]">
                Bem-vindo, {currentUser?.name} • Acesso total ao sistema
              </p>
            </section>
          </section>
          
          <section className="flex items-center gap-2">
            <Button variant="outline" onClick={exportData} className="gap-2">
              <Download className="w-4 h-4" />
              Exportar Dados
            </Button>
            <Button variant="outline" onClick={logout} className="gap-2 text-[#ef4444]">
              <LogOut className="w-4 h-4" />
              Sair
            </Button>
          </section>
        </header>

        {/* Alertas */}
        {alerts.length > 0 && (
          <section className="space-y-2 mb-6">
            {alerts.map((alert, index) => (
              <aside key={index} className={`p-3 rounded-lg flex items-center gap-2 ${
                alert.type === 'warning' 
                  ? 'bg-orange-50 border border-orange-200' 
                  : 'bg-blue-50 border border-blue-200'
              }`}>
                {alert.type === 'warning' ? (
                  <AlertTriangle className="w-5 h-5 text-orange-600" />
                ) : (
                  <Bell className="w-5 h-5 text-blue-600" />
                )}
                <p className={`text-sm ${alert.type === 'warning' ? 'text-orange-800' : 'text-blue-800'}`}>
                  {alert.message}
                </p>
                {selectedArticles.length > 0 && (
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="ml-auto text-orange-600"
                    onClick={() => setBulkActionDialog(true)}
                  >
                    Ações
                  </Button>
                )}
              </aside>
            ))}
          </section>
        )}

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-2 lg:grid-cols-5 gap-2">
            <TabsTrigger value="dashboard" className="gap-2">
              <PieChart className="w-4 h-4" />
              Dashboard
            </TabsTrigger>
            <TabsTrigger value="articles" className="gap-2">
              <Newspaper className="w-4 h-4" />
              Artigos
              <Badge variant="secondary" className="ml-1">{stats.total}</Badge>
            </TabsTrigger>
            <TabsTrigger value="scheduled" className="gap-2">
              <Calendar className="w-4 h-4" />
              Calendário
              <Badge variant="secondary" className="ml-1">{stats.scheduled}</Badge>
            </TabsTrigger>
            <TabsTrigger value="users" className="gap-2">
              <UserCog className="w-4 h-4" />
              Usuários
              <Badge variant="secondary" className="ml-1">{users.length}</Badge>
            </TabsTrigger>
            <TabsTrigger value="settings" className="gap-2">
              <Settings className="w-4 h-4" />
              Configurações
            </TabsTrigger>
          </TabsList>

          {/* TAB DASHBOARD */}
          <TabsContent value="dashboard" className="space-y-6">
            <section className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
              {[
                { icon: FileText, label: 'Total', value: stats.total, color: 'text-[#3b82f6]', bg: 'bg-[#dbeafe]' },
                { icon: CheckCircle, label: 'Publicados', value: stats.published, color: 'text-[#22c55e]', bg: 'bg-[#dcfce7]' },
                { icon: Zap, label: 'Urgentes', value: stats.breaking, color: 'text-[#c40000]', bg: 'bg-[#fef2f2]' },
                { icon: Star, label: 'Destaques', value: stats.featured, color: 'text-[#a16207]', bg: 'bg-[#fef3c7]' },
                { icon: Clock, label: 'Agendados', value: stats.scheduled, color: 'text-blue-600', bg: 'bg-blue-50' },
                { icon: TrendingUp, label: 'Views', value: (stats.totalViews / 1000).toFixed(1) + 'k', color: 'text-[#111111]', bg: 'bg-gray-100' },
              ].map((stat, index) => (
                <article key={index} className={`p-4 ${stat.bg} rounded-xl`}>
                  <stat.icon className={`w-6 h-6 ${stat.color} mb-2`} />
                  <p className="text-2xl font-bold text-[#111111]">{stat.value}</p>
                  <p className="text-xs text-[#6b6b6b]">{stat.label}</p>
                </article>
              ))}
            </section>

            <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <article className="bg-white border border-[#e5e5e5] rounded-xl p-6">
                <h2 className="text-lg font-bold text-[#111111] mb-4">Ações Rápidas</h2>
                <ul className="space-y-2">
                  <li>
                    <Link to="/admin/noticias/novo">
                      <Button className="w-full bg-[#c40000] hover:bg-[#a00000] gap-2">
                        <Plus className="w-4 h-4" />
                        Nova Notícia
                      </Button>
                    </Link>
                  </li>
                  <li>
                    <Button variant="outline" className="w-full gap-2" onClick={() => setActiveTab('articles')}>
                      <FileText className="w-4 h-4" />
                      Gerenciar Artigos
                    </Button>
                  </li>
                  <li>
                    <Button variant="outline" className="w-full gap-2" onClick={() => setActiveTab('scheduled')}>
                      <Calendar className="w-4 h-4" />
                      Ver Calendário
                    </Button>
                  </li>
                  <li>
                    <Button variant="outline" className="w-full gap-2" onClick={() => setActiveTab('users')}>
                      <Users className="w-4 h-4" />
                      Gerenciar Usuários
                    </Button>
                  </li>
                </ul>
              </article>

              <article className="lg:col-span-2 bg-white border border-[#e5e5e5] rounded-xl p-6">
                <header className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-bold text-[#111111]">Artigos Mais Lidos</h2>
                  <Button variant="ghost" size="sm" onClick={() => setActiveTab('articles')}>
                    Ver todos <ArrowRight className="w-4 h-4 ml-1" />
                  </Button>
                </header>
                
                {topArticles.length > 0 ? (
                  <ul className="space-y-3">
                    {topArticles.map((article, index) => (
                      <li key={article.slug}>
                        <article className="flex items-center justify-between p-3 bg-[#f8fafb] rounded-lg group">
                          <section className="flex items-center gap-3">
                            <span className="w-8 h-8 rounded-full bg-[#c40000] text-white flex items-center justify-center text-sm font-bold">
                              {index + 1}
                            </span>
                            <section>
                              <p className="text-sm font-medium text-[#111111]">{article.title}</p>
                              <p className="text-xs text-[#6b6b6b]">
                                {article.views.toLocaleString('pt-BR')} visualizações
                              </p>
                            </section>
                          </section>
                          <section className="flex items-center gap-2">
                            <Link to={`/noticias/${article.slug}`} target="_blank">
                              <Button variant="ghost" size="sm"><Eye className="w-4 h-4" /></Button>
                            </Link>
                            <Link to={`/admin/noticias/editar/${article.slug}`}>
                              <Button variant="ghost" size="sm"><Edit2 className="w-4 h-4" /></Button>
                            </Link>
                          </section>
                        </article>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-center text-[#6b6b6b] py-8">Nenhum artigo encontrado</p>
                )}
              </article>
            </section>
          </TabsContent>

          {/* TAB ARTIGOS */}
          <TabsContent value="articles" className="space-y-6">
            <section className="flex flex-col sm:flex-row gap-3">
              <section className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[#6b6b6b]" />
                <Input
                  placeholder="Buscar artigos..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </section>
              <select value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)} className="px-4 py-2 border rounded-md text-sm">
                <option value="all">Todas categorias</option>
                {Object.values(CONTENT_CONFIG.categories).map(cat => (
                  <option key={cat.slug} value={cat.slug}>{cat.name}</option>
                ))}
              </select>
              <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value as ArticleFilters['status'])} className="px-4 py-2 border rounded-md text-sm">
                <option value="all">Todos status</option>
                <option value="published">Publicado</option>
                <option value="breaking">Urgente</option>
                <option value="featured">Destaque</option>
              </select>
              <Link to="/admin/noticias/novo">
                <Button className="bg-[#c40000] hover:bg-[#a00000] gap-2">
                  <Plus className="w-4 h-4" /> Novo
                </Button>
              </Link>
            </section>

            <section className="bg-white border rounded-xl overflow-hidden">
              {isLoading ? (
                <section className="p-12 text-center">
                  <section className="w-8 h-8 border-2 border-[#e5e5e5] border-t-[#c40000] rounded-full animate-spin mx-auto" />
                </section>
              ) : (
                <>
                  <table className="w-full">
                    <thead className="bg-[#f9fafb] border-b">
                      <tr>
                        <th className="px-4 py-3 w-10">
                          <input type="checkbox" checked={selectedArticles.length === articles.length && articles.length > 0} onChange={selectAllArticles} />
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-semibold uppercase">Artigo</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold uppercase">Categoria</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold uppercase">Status</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold uppercase">Views</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold uppercase">Ações</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {articles.map((article) => (
                        <tr key={article.slug} className={`hover:bg-[#f9fafb] ${selectedArticles.includes(article.slug) ? 'bg-[#fef2f2]' : ''}`}>
                          <td className="px-4 py-3">
                            <input type="checkbox" checked={selectedArticles.includes(article.slug)} onChange={() => toggleArticleSelection(article.slug)} />
                          </td>
                          <td className="px-4 py-3">
                            <section className="flex items-center gap-3">
                              <img src={article.coverImage} alt="" className="w-12 h-12 rounded object-cover" />
                              <section>
                                <p className="font-medium text-sm">{article.title}</p>
                                <p className="text-xs text-[#6b6b6b]">por {article.author}</p>
                              </section>
                            </section>
                          </td>
                          <td className="px-4 py-3">
                            <Badge variant="secondary">{CONTENT_CONFIG.categories[article.category as keyof typeof CONTENT_CONFIG.categories]?.name}</Badge>
                          </td>
                          <td className="px-4 py-3">
                            {article.breaking ? (
                              <Badge className="bg-[#fef2f2] text-[#c40000]"><Zap className="w-3 h-3 mr-1" />Urgente</Badge>
                            ) : article.featured ? (
                              <Badge className="bg-[#fefce8] text-[#a16207]"><Star className="w-3 h-3 mr-1" />Destaque</Badge>
                            ) : (
                              <Badge className="bg-[#f0fdf4] text-[#166534]">Publicado</Badge>
                            )}
                          </td>
                          <td className="px-4 py-3 text-sm text-[#6b6b6b]">{article.views.toLocaleString('pt-BR')}</td>
                          <td className="px-4 py-3">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="sm" className="h-8 w-8 p-0"><MoreHorizontal className="w-4 h-4" /></Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem asChild>
                                  <Link to={`/noticias/${article.slug}`} target="_blank"><Eye className="w-4 h-4 mr-2" /> Visualizar</Link>
                                </DropdownMenuItem>
                                <DropdownMenuItem asChild>
                                  <Link to={`/admin/noticias/editar/${article.slug}`}><Edit2 className="w-4 h-4 mr-2" /> Editar</Link>
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => handleDuplicate(article)}><Copy className="w-4 h-4 mr-2" /> Duplicar</DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem onClick={() => handleDelete(article)} className="text-[#ef4444]"><Trash2 className="w-4 h-4 mr-2" /> Excluir</DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>

                  {totalPages > 1 && (
                    <section className="flex items-center justify-between px-4 py-4 border-t">
                      <section className="flex items-center gap-2">
                        <span className="text-sm text-[#6b6b6b]">Itens:</span>
                        <select value={perPage} onChange={(e) => setPerPage(Number(e.target.value))} className="px-2 py-1 border rounded text-sm">
                          <option value={5}>5</option>
                          <option value={10}>10</option>
                          <option value={25}>25</option>
                          <option value={50}>50</option>
                        </select>
                      </section>
                      <section className="flex items-center gap-2">
                        <Button variant="outline" size="sm" onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1}><ChevronLeft className="w-4 h-4" /></Button>
                        <span className="text-sm text-[#6b6b6b]">Página {currentPage} de {totalPages}</span>
                        <Button variant="outline" size="sm" onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages}><ChevronRight className="w-4 h-4" /></Button>
                      </section>
                    </section>
                  )}
                </>
              )}
            </section>
          </TabsContent>

          {/* TAB CALENDÁRIO (Agendamentos) */}
          <TabsContent value="scheduled" className="space-y-6">
            <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Calendário */}
              <article className="lg:col-span-2 bg-white border rounded-xl p-6">
                <header className="flex items-center justify-between mb-6">
                  <h2 className="text-lg font-bold text-[#111111]">
                    {monthNames[currentMonth.getMonth()]} {currentMonth.getFullYear()}
                  </h2>
                  <section className="flex items-center gap-2">
                    <Button variant="outline" size="sm" onClick={prevMonth}><ChevronLeftIcon className="w-4 h-4" /></Button>
                    <Button variant="outline" size="sm" onClick={nextMonth}><ChevronRightIcon className="w-4 h-4" /></Button>
                  </section>
                </header>

                {/* Dias da semana */}
                <section className="grid grid-cols-7 gap-1 mb-2">
                  {weekDays.map(day => (
                    <section key={day} className="text-center text-sm font-medium text-[#6b6b6b] py-2">
                      {day}
                    </section>
                  ))}
                </section>

                {/* Dias do mês */}
                <section className="grid grid-cols-7 gap-1">
                  {calendarDays.map((day, index) => {
                    if (day === null) {
                      return <section key={`empty-${index}`} className="aspect-square" />;
                    }

                    const scheduledForDay = getScheduledForDate(day);
                    const hasScheduled = scheduledForDay.length > 0;

                    return (
                      <button
                        key={day}
                        onClick={() => hasScheduled && handleDateClick(day)}
                        className={`aspect-square p-2 rounded-lg border transition-all relative ${
                          hasScheduled 
                            ? 'bg-blue-50 border-blue-300 hover:bg-blue-100 cursor-pointer' 
                            : 'bg-white border-gray-100 hover:bg-gray-50'
                        }`}
                      >
                        <span className="text-sm font-medium">{day}</span>
                        {hasScheduled && (
                          <section className="absolute bottom-1 right-1 left-1">
                            <Badge className="w-full justify-center text-xs bg-blue-600 text-white">
                              {scheduledForDay.length} post{scheduledForDay.length > 1 ? 's' : ''}
                            </Badge>
                          </section>
                        )}
                      </button>
                    );
                  })}
                </section>

                {/* Legenda */}
                <section className="flex items-center gap-4 mt-4 text-sm text-[#6b6b6b]">
                  <section className="flex items-center gap-2">
                    <section className="w-4 h-4 bg-blue-50 border border-blue-300 rounded" />
                    <span>Com agendamentos</span>
                  </section>
                  <section className="flex items-center gap-2">
                    <section className="w-4 h-4 bg-white border border-gray-100 rounded" />
                    <span>Sem agendamentos</span>
                  </section>
                </section>
              </article>

              {/* Lista de Agendados */}
              <article className="bg-white border rounded-xl p-6">
                <header className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-bold text-[#111111]">Agendamentos</h2>
                  <Badge variant="secondary">{scheduledArticles.length}</Badge>
                </header>

                <section className="space-y-3 max-h-[500px] overflow-y-auto">
                  {scheduledArticles.length > 0 ? (
                    scheduledArticles.map((scheduled) => (
                      <article key={scheduled.id} className="p-3 bg-[#f8fafb] rounded-lg border">
                        <p className="font-medium text-sm line-clamp-1">{scheduled.articleData.title}</p>
                        <p className="text-xs text-[#6b6b6b] mt-1">
                          <Clock className="w-3 h-3 inline mr-1" />
                          {new Date(`${scheduled.scheduledDate}T${scheduled.scheduledTime}`).toLocaleString('pt-BR')}
                        </p>
                        <section className="flex items-center gap-2 mt-2">
                          <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => handleEditScheduled(scheduled)}>Editar</Button>
                          <Button size="sm" variant="outline" className="h-7 text-xs text-orange-600" onClick={() => handleCancelScheduled(scheduled.id)}>Cancelar</Button>
                        </section>
                      </article>
                    ))
                  ) : (
                    <p className="text-center text-[#6b6b6b] py-8">Nenhum agendamento</p>
                  )}
                </section>

                <Button 
                  className="w-full bg-blue-600 hover:bg-blue-700 gap-2 mt-4"
                  onClick={() => navigate('/admin/noticias/novo')}
                >
                  <Plus className="w-4 h-4" /> Agendar Novo
                </Button>
              </article>
            </section>
          </TabsContent>

          {/* TAB USUÁRIOS */}
          <TabsContent value="users" className="space-y-6">
            <section className="flex items-center justify-between">
              <section>
                <h2 className="text-lg font-bold text-[#111111]">Gerenciamento de Usuários</h2>
                <p className="text-sm text-[#6b6b6b]">{users.length} usuário(s) no sistema</p>
              </section>
              <section className="flex items-center gap-2">
                <Button variant="outline" onClick={exportUsersCSV} className="gap-2">
                  <Download className="w-4 h-4" /> Exportar CSV
                </Button>
                <Button onClick={handleAddUser} className="bg-[#c40000] hover:bg-[#a00000] gap-2">
                  <Plus className="w-4 h-4" /> Novo Usuário
                </Button>
              </section>
            </section>

            <section className="flex gap-3">
              <section className="relative flex-1 max-w-sm">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[#6b6b6b]" />
                <Input placeholder="Buscar usuários..." value={userSearch} onChange={(e) => setUserSearch(e.target.value)} className="pl-10" />
              </section>
            </section>

            <section className="bg-white border rounded-xl overflow-hidden">
              <table className="w-full">
                <thead className="bg-[#f9fafb] border-b">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase">Usuário</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase">Tipo</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase">Profissão</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase">Status</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {filteredUsers.map((user) => (
                    <tr key={user.id} className="hover:bg-[#f9fafb]">
                      <td className="px-4 py-3">
                        <section className="flex items-center gap-3">
                          <section className="w-10 h-10 rounded-full bg-[#e5e5e5] flex items-center justify-center">
                            <User className="w-5 h-5 text-[#6b6b6b]" />
                          </section>
                          <section>
                            <p className="font-medium text-sm">{user.name}</p>
                            <p className="text-xs text-[#6b6b6b]">{user.email}</p>
                          </section>
                        </section>
                      </td>
                      <td className="px-4 py-3">
                        <Badge className={user.role === 'admin' ? 'bg-[#fef2f2] text-[#c40000]' : 'bg-[#f0fdf4] text-[#166534]'}>
                          {user.role === 'admin' ? <><Shield className="w-3 h-3 mr-1" /> Admin</> : 'Usuário'}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 text-sm text-[#6b6b6b]">{user.profession || '-'}</td>
                      <td className="px-4 py-3">
                        <Badge variant={user.isActive ? 'default' : 'secondary'}>
                          {user.isActive ? 'Ativo' : 'Inativo'}
                        </Badge>
                      </td>
                      <td className="px-4 py-3">
                        <section className="flex items-center gap-2">
                          <Button variant="ghost" size="sm" onClick={() => handleEditUser(user)}><Edit2 className="w-4 h-4" /></Button>
                          <Button variant="ghost" size="sm" onClick={() => handleDeleteUser(user)} disabled={user.id === currentUser?.id} className="text-[#ef4444]"><Trash2 className="w-4 h-4" /></Button>
                        </section>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {filteredUsers.length === 0 && (
                <section className="p-12 text-center text-[#6b6b6b]">
                  <Users className="w-12 h-12 mx-auto mb-3 text-[#e5e5e5]" />
                  <p>Nenhum usuário encontrado</p>
                </section>
              )}
            </section>
          </TabsContent>

          {/* TAB CONFIGURAÇÕES */}
          <TabsContent value="settings" className="space-y-6">
            <section className="bg-white border rounded-xl p-6">
              <h2 className="text-lg font-bold text-[#111111] mb-4">Configurações do Sistema</h2>
              <section className="space-y-4">
                <section className="flex items-center justify-between p-4 bg-[#f8fafc] rounded-lg">
                  <section>
                    <p className="font-medium">Resetar Dados</p>
                    <p className="text-sm text-[#6b6b6b]">Restaura artigos para estado inicial</p>
                  </section>
                  <Button variant="outline" onClick={() => { if (confirm('ATENÇÃO: Isso apagará todas as alterações. Continuar?')) { resetToDefault(); toast.success('Dados resetados!'); loadData(); }}} className="text-[#ef4444]">
                    <RefreshCw className="w-4 h-4 mr-2" /> Resetar
                  </Button>
                </section>
                <section className="flex items-center justify-between p-4 bg-[#f8fafc] rounded-lg">
                  <section>
                    <p className="font-medium">Exportar Backup</p>
                    <p className="text-sm text-[#6b6b6b]">Download de todos os dados</p>
                  </section>
                  <Button variant="outline" onClick={exportData}><Download className="w-4 h-4 mr-2" /> Exportar</Button>
                </section>
                <section className="flex items-center justify-between p-4 bg-[#f8fafc] rounded-lg">
                  <section>
                    <p className="font-medium">Verificar Agendamentos</p>
                    <p className="text-sm text-[#6b6b6b]">Força verificação manual</p>
                  </section>
                  <Button variant="outline" onClick={() => { const published = checkAndPublishScheduled(); if (published > 0) { toast.success(`${published} artigo(s) publicado(s)!`); loadData(); } else { toast.info('Nenhum artigo para publicar'); }}}>
                    <Check className="w-4 h-4 mr-2" /> Verificar Agora
                  </Button>
                </section>
              </section>
            </section>
          </TabsContent>
        </Tabs>

        {/* Dialog de Exclusão de Artigo */}
        <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-[#ef4444]"><AlertTriangle className="w-5 h-5" /> Confirmar Exclusão</DialogTitle>
              <DialogDescription>Tem certeza que deseja excluir <strong>"{articleToDelete?.title}"</strong>? Esta ação não pode ser desfeita.</DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>Cancelar</Button>
              <Button onClick={confirmDelete} className="bg-[#ef4444] hover:bg-[#dc2626]"><Trash2 className="w-4 h-4 mr-2" /> Excluir</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Dialog de Edição de Agendamento */}
        <Dialog open={editScheduledOpen} onOpenChange={setEditScheduledOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Editar Agendamento</DialogTitle>
              <DialogDescription>Altere a data/hora de <strong>"{scheduledToEdit?.articleData.title}"</strong></DialogDescription>
            </DialogHeader>
            <section className="space-y-4 py-4">
              <section className="grid grid-cols-2 gap-4">
                <fieldset><Label>Data</Label><Input type="date" value={scheduledToEdit?.scheduledDate} onChange={(e) => setScheduledToEdit(prev => prev ? {...prev, scheduledDate: e.target.value} : null)} /></fieldset>
                <fieldset><Label>Hora</Label><Input type="time" value={scheduledToEdit?.scheduledTime} onChange={(e) => setScheduledToEdit(prev => prev ? {...prev, scheduledTime: e.target.value} : null)} /></fieldset>
              </section>
            </section>
            <DialogFooter>
              <Button variant="outline" onClick={() => setEditScheduledOpen(false)}>Cancelar</Button>
              <Button onClick={saveScheduledChanges} className="bg-blue-600 hover:bg-blue-700"><Check className="w-4 h-4 mr-2" /> Salvar</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Dialog de Formulário de Usuário (Add/Edit) */}
        <Dialog open={showUserForm} onOpenChange={setShowUserForm}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{isEditingUser ? 'Editar Usuário' : 'Novo Usuário'}</DialogTitle>
              <DialogDescription>{isEditingUser ? 'Atualize as informações do usuário' : 'Preencha os dados do novo usuário'}</DialogDescription>
            </DialogHeader>
            <section className="space-y-4 py-4">
              <section className="grid grid-cols-2 gap-4">
                <fieldset>
                  <Label>Nome *</Label>
                  <Input value={userFormData.name} onChange={(e) => setUserFormData({...userFormData, name: e.target.value})} placeholder="Nome completo" />
                </fieldset>
                <fieldset>
                  <Label>Email *</Label>
                  <Input type="email" value={userFormData.email} onChange={(e) => setUserFormData({...userFormData, email: e.target.value})} placeholder="email@exemplo.com" />
                </fieldset>
              </section>
              <section className="grid grid-cols-2 gap-4">
                <fieldset>
                  <Label>Tipo de Usuário</Label>
                  <select value={userFormData.role} onChange={(e) => setUserFormData({...userFormData, role: e.target.value as UserRole})} className="w-full px-3 py-2 border rounded-md">
                    <option value="user">Usuário</option>
                    <option value="admin">Administrador</option>
                  </select>
                </fieldset>
                <fieldset>
                  <Label>Status</Label>
                  <select value={userFormData.isActive ? 'true' : 'false'} onChange={(e) => setUserFormData({...userFormData, isActive: e.target.value === 'true'})} className="w-full px-3 py-2 border rounded-md">
                    <option value="true">Ativo</option>
                    <option value="false">Inativo</option>
                  </select>
                </fieldset>
              </section>
              <section className="grid grid-cols-2 gap-4">
                <fieldset>
                  <Label>Profissão</Label>
                  <Input value={userFormData.profession} onChange={(e) => setUserFormData({...userFormData, profession: e.target.value})} placeholder="Ex: Jornalista" />
                </fieldset>
                <fieldset>
                  <Label>Empresa</Label>
                  <Input value={userFormData.company} onChange={(e) => setUserFormData({...userFormData, company: e.target.value})} placeholder="Ex: Empresa XYZ" />
                </fieldset>
              </section>
              <fieldset>
                <Label>Região</Label>
                <select value={userFormData.region} onChange={(e) => setUserFormData({...userFormData, region: e.target.value})} className="w-full px-3 py-2 border rounded-md">
                  <option value="">Selecione...</option>
                  <option value="BR">Brasil</option>
                  <option value="NA">América do Norte</option>
                  <option value="EU">Europa</option>
                  <option value="AS">Ásia</option>
                  <option value="AF">África</option>
                  <option value="SA">América do Sul</option>
                  <option value="ME">Oriente Médio</option>
                  <option value="OC">Oceania</option>
                </select>
              </fieldset>
              <fieldset>
                <Label>Biografia</Label>
                <textarea value={userFormData.bio} onChange={(e) => setUserFormData({...userFormData, bio: e.target.value})} placeholder="Breve descrição do usuário..." rows={3} className="w-full px-3 py-2 border rounded-md" />
              </fieldset>
            </section>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowUserForm(false)}>Cancelar</Button>
              <Button onClick={saveUser} className="bg-[#c40000] hover:bg-[#a00000]"><Save className="w-4 h-4 mr-2" /> {isEditingUser ? 'Atualizar' : 'Criar'} Usuário</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Dialog de Exclusão de Usuário */}
        <Dialog open={!!userToDelete} onOpenChange={() => setUserToDelete(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-[#ef4444]"><AlertTriangle className="w-5 h-5" /> Excluir Usuário</DialogTitle>
              <DialogDescription>Tem certeza que deseja excluir <strong>"{userToDelete?.name}"</strong>?<br />Email: {userToDelete?.email}</DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button variant="outline" onClick={() => setUserToDelete(null)}>Cancelar</Button>
              <Button onClick={confirmDeleteUser} className="bg-[#ef4444] hover:bg-[#dc2626]"><Trash2 className="w-4 h-4 mr-2" /> Excluir</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Dialog de Detalhes da Data */}
        <Dialog open={dateDetailsOpen} onOpenChange={setDateDetailsOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Agendamentos para {selectedDate ? new Date(selectedDate).toLocaleDateString('pt-BR') : ''}</DialogTitle>
            </DialogHeader>
            <section className="space-y-3 py-4 max-h-[400px] overflow-y-auto">
              {selectedDate && getScheduledForDate(parseInt(selectedDate.split('-')[2])).map((scheduled) => (
                <article key={scheduled.id} className="p-3 bg-[#f8fafb] rounded-lg border">
                  <p className="font-medium text-sm">{scheduled.articleData.title}</p>
                  <p className="text-xs text-[#6b6b6b]">
                    <Clock className="w-3 h-3 inline mr-1" />
                    {scheduled.scheduledTime}
                  </p>
                  <section className="flex items-center gap-2 mt-2">
                    <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => { setDateDetailsOpen(false); handleEditScheduled(scheduled); }}>Editar</Button>
                    <Button size="sm" variant="outline" className="h-7 text-xs text-orange-600" onClick={() => { handleCancelScheduled(scheduled.id); setDateDetailsOpen(false); }}>Cancelar</Button>
                    <Button size="sm" variant="outline" className="h-7 text-xs text-red-600" onClick={() => { handleDeleteScheduled(scheduled.id); setDateDetailsOpen(false); }}>Excluir</Button>
                  </section>
                </article>
              ))}
              {selectedDate && getScheduledForDate(parseInt(selectedDate.split('-')[2])).length === 0 && (
                <p className="text-center text-[#6b6b6b]">Nenhum agendamento para este dia</p>
              )}
            </section>
            <DialogFooter>
              <Button onClick={() => setDateDetailsOpen(false)}>Fechar</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Dialog de Ações em Massa */}
        <Dialog open={bulkActionDialog} onOpenChange={setBulkActionDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Ações em Massa</DialogTitle>
              <DialogDescription>{selectedArticles.length} artigo(s) selecionado(s)</DialogDescription>
            </DialogHeader>
            <section className="space-y-3 py-4">
              <Button variant="outline" className="w-full justify-start text-[#ef4444]" onClick={handleBulkDelete}><Trash2 className="w-4 h-4 mr-2" /> Excluir Selecionados</Button>
              <Button variant="outline" className="w-full justify-start" onClick={() => setSelectedArticles([])}><X className="w-4 h-4 mr-2" /> Limpar Seleção</Button>
            </section>
          </DialogContent>
        </Dialog>

        {/* Dialog de Estatísticas */}
        <Dialog open={showStatsDialog} onOpenChange={setShowStatsDialog}>
          <DialogContent className="max-w-2xl">
            <DialogHeader><DialogTitle>Estatísticas Detalhadas</DialogTitle></DialogHeader>
            <section className="grid grid-cols-2 gap-4 py-4">
              <article className="p-4 bg-[#f8fafc] rounded-lg"><p className="text-3xl font-bold">{stats.total}</p><p className="text-sm text-[#6b6b6b]">Total</p></article>
              <article className="p-4 bg-[#f8fafc] rounded-lg"><p className="text-3xl font-bold text-blue-600">{stats.scheduled}</p><p className="text-sm text-[#6b6b6b]">Agendados</p></article>
            </section>
            <section className="space-y-2">
              <h4 className="font-medium">Por Categoria</h4>
              {Object.entries(stats.byCategory).map(([category, count]) => (
                <section key={category} className="flex items-center justify-between p-2 bg-[#f8fafc] rounded">
                  <span className="text-sm capitalize">{category}</span>
                  <section className="flex items-center gap-2">
                    <section className="h-2 rounded-full" style={{ width: `${Math.max(20, (count / Math.max(stats.total, 1)) * 200)}px`, backgroundColor: CONTENT_CONFIG.categories[category as keyof typeof CONTENT_CONFIG.categories]?.color || '#6b6b6b' }} />
                    <span className="text-sm text-[#6b6b6b] w-8">{count}</span>
                  </section>
                </section>
              ))}
            </section>
            <DialogFooter><Button onClick={() => setShowStatsDialog(false)}>Fechar</Button></DialogFooter>
          </DialogContent>
        </Dialog>
      </main>
    </>
  );
}
