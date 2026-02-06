/**
 * Admin Dashboard - Painel Administrativo Completo
 * 100% Responsivo - Mobile First
 */

import { useState, useEffect, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
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
  Save,
  Menu
} from 'lucide-react';
import { useAuth, type UserRole } from '@/contexts/AuthContext';
import { CONTENT_CONFIG } from '@/config/content';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
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

  updateScheduledArticle,
  checkAndPublishScheduled,
  assignAllArticlesToAuthor,
  type ArticleFilters,
  type ScheduledArticle,
  resetToDefault
} from '@/services/newsManager';
import { getAppSettings, updateAppSettings } from '@/services/appSettings';
import type { AppSettings } from '@/hooks/useAppSettings';
import type { NewsArticle } from '@/types';
import {
  listAdminUsers,
  createAdminUser,
  updateAdminUser,
  updateAdminUserPassword,
  deleteAdminUser,
  type AdminUser,
} from '@/services/adminUsers';
import { SUPABASE_FREE_LIMITS } from '@/config/supabaseLimits';

// Interface para usuários do sistema
type SystemUser = AdminUser;

export function AdminDashboard() {
  const { user: currentUser, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  
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

  // Configurações globais
  const [appSettings, setAppSettings] = useState<AppSettings>({
    readingLimitEnabled: true,
    readingLimitPercentage: 0.2,
    maxFreeArticles: 3,
    readingLimitScope: 'anon',
  });
  const [isSettingsLoading, setIsSettingsLoading] = useState(true);
  const [isSettingsSaving, setIsSettingsSaving] = useState(false);
  
  // Estados para usuários
  const [users, setUsers] = useState<SystemUser[]>([]);
  const [userSearch, setUserSearch] = useState('');
  const [userToDelete, setUserToDelete] = useState<SystemUser | null>(null);
  const [userToEdit, setUserToEdit] = useState<SystemUser | null>(null);
  const [showUserForm, setShowUserForm] = useState(false);
  const [isEditingUser, setIsEditingUser] = useState(false);
  
  // Form de usuário
  const [userFormData, setUserFormData] = useState<
    Partial<SystemUser> & { password?: string; confirmPassword?: string }
  >({
    name: '',
    email: '',
    role: 'user',
    region: '',
    bio: '',
    profession: '',
    company: '',
    isActive: true,
    password: '',
    confirmPassword: '',
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

  const [editScheduledOpen, setEditScheduledOpen] = useState(false);
  const [scheduledToEdit, setScheduledToEdit] = useState<ScheduledArticle | null>(null);
  const [bulkActionDialog, setBulkActionDialog] = useState(false);
  const [dateDetailsOpen, setDateDetailsOpen] = useState(false);

  // Ler hash da URL
  useEffect(() => {
    const hash = location.hash.replace('#', '');
    if (hash && ['dashboard', 'noticias', 'agendamentos', 'usuarios', 'settings'].includes(hash)) {
      setActiveTab(hash);
    }
  }, [location.hash]);

  // Verificar publicações agendadas periodicamente
  useEffect(() => {
    const interval = setInterval(() => {
    void (async () => {
      const published = await checkAndPublishScheduled();
      if (published > 0) {
        toast.success(`${published} artigo(s) agendado(s) publicado(s)!`);
        await loadData();
      }
    })();
  }, 60000);
    
    return () => clearInterval(interval);
  }, []);

  const loadData = useCallback(async () => {
    setIsLoading(true);
    
    const filters: ArticleFilters = {
      search: searchTerm,
      category: categoryFilter,
      status: statusFilter,
    };
    
    const result = await getArticlesPaginated(filters, currentPage, perPage);
    setArticles(result.items);
    setTotalPages(result.totalPages);
    
    setStats(await getArticleStats());
    setScheduledArticles((await getScheduledArticles()).filter(s => s.status === 'pending'));
    
    loadUsers();
    
    setIsLoading(false);
  }, [searchTerm, categoryFilter, statusFilter, currentPage, perPage]);

  const loadUsers = async () => {
    try {
      const data = await listAdminUsers();
      setUsers(data);
    } catch (error) {
      // Erro silenciado em produção
      if (import.meta.env.DEV) {
        // eslint-disable-next-line no-console
        console.error('Erro ao carregar usuários:', error);
      }
      toast.error('Erro ao carregar usuários');
    }
  };

  useEffect(() => {
    loadData();
  }, [loadData]);

  useEffect(() => {
    let isMounted = true;

    const loadSettings = async () => {
      try {
        const data = await getAppSettings();
        if (isMounted) setAppSettings(data);
      } catch (error) {
        // Erro silenciado em produção
        if (import.meta.env.DEV) {
          // eslint-disable-next-line no-console
          console.error('Erro ao carregar configurações:', error);
        }
      } finally {
        if (isMounted) setIsSettingsLoading(false);
      }
    };

    void loadSettings();
    return () => {
      isMounted = false;
    };
  }, []);

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
    
    for (let i = 0; i < startingDay; i++) {
      days.push(null);
    }
    
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

  const confirmDelete = async () => {
    if (!articleToDelete) return;
    
    const success = await deleteArticle(articleToDelete.slug);
    if (success) {
      toast.success(`Artigo "${articleToDelete.title}" excluído!`);
      loadData();
    }
    setDeleteDialogOpen(false);
  };

  const handleDuplicate = async (article: NewsArticle) => {
    const newArticle = await duplicateArticle(article.slug);
    if (newArticle) {
      toast.success(`Artigo "${article.title}" duplicado!`);
      loadData();
    }
  };

  const handleCancelScheduled = async (id: string) => {
    await cancelScheduledArticle(id);
    toast.success('Agendamento cancelado!');
    loadData();
  };



  const handleEditScheduled = (scheduled: ScheduledArticle) => {
    setScheduledToEdit(scheduled);
    setEditScheduledOpen(true);
  };

  const saveScheduledChanges = async () => {
    if (!scheduledToEdit) return;
    
    await updateScheduledArticle(scheduledToEdit.id, {
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
      password: '',
      confirmPassword: '',
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
      password: '',
      confirmPassword: '',
    });
    setShowUserForm(true);
  };

  const saveUser = async () => {
    if (!userFormData.name || !userFormData.email) {
      toast.error('Nome e email são obrigatórios!');
      return;
    }

    if (!isEditingUser) {
      if (!userFormData.password || !userFormData.confirmPassword) {
        toast.error('Senha é obrigatória para novo usuário');
        return;
      }
      if (userFormData.password !== userFormData.confirmPassword) {
        toast.error('As senhas não conferem');
        return;
      }
    }

    if (userFormData.password && userFormData.confirmPassword) {
      if (userFormData.password !== userFormData.confirmPassword) {
        toast.error('As senhas não conferem');
        return;
      }
      if (userFormData.password.length < 6) {
        toast.error('Senha deve ter pelo menos 6 caracteres');
        return;
      }
    }

    try {
      if (isEditingUser && userToEdit) {
        await updateAdminUser({
          userId: userToEdit.id,
          name: userFormData.name,
          email: userFormData.email,
          role: (userFormData.role as UserRole) ?? 'user',
        });

        if (userFormData.password) {
          await updateAdminUserPassword({
            userId: userToEdit.id,
            password: userFormData.password,
          });
        }

        toast.success('Usuário atualizado com sucesso!');
      } else {
        await createAdminUser({
          name: userFormData.name,
          email: userFormData.email,
          password: userFormData.password ?? '',
          role: (userFormData.role as UserRole) ?? 'user',
        });
        toast.success('Usuário criado com sucesso!');
      }

      setShowUserForm(false);
      loadUsers();
    } catch (error) {
      toast.error('Erro ao salvar usuário');
    }
  };

  const handleDeleteUser = (user: SystemUser) => {
    setUserToDelete(user);
  };

  const confirmDeleteUser = async () => {
    if (!userToDelete) return;
    
    if (userToDelete.id === currentUser?.id) {
      toast.error('Você não pode excluir sua própria conta!');
      setUserToDelete(null);
      return;
    }
    
    try {
      await deleteAdminUser({ userId: userToDelete.id });
      toast.success(`Usuário "${userToDelete.name}" excluído!`);
      setUserToDelete(null);
      loadUsers();
    } catch (error) {
      toast.error('Erro ao excluir usuário');
    }
  };

  const saveAppSettings = async () => {
    setIsSettingsSaving(true);
    try {
      await updateAppSettings(appSettings);
      toast.success('Configurações salvas!');
    } catch (error) {
      toast.error('Erro ao salvar configurações');
    } finally {
      setIsSettingsSaving(false);
    }
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

  const handleBulkDelete = async () => {
    if (selectedArticles.length === 0) return;
    
    let deleted = 0;
    for (const slug of selectedArticles) {
      if (await deleteArticle(slug)) deleted++;
    }
    
    toast.success(`${deleted} artigo(s) excluído(s)!`);
    setSelectedArticles([]);
    setBulkActionDialog(false);
    loadData();
  };

  const exportData = async () => {
    const data = {
      articles: await getAllArticles({ includeDrafts: true }),
      scheduled: await getScheduledArticles(),
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

  const handleAssignPostsToAdmin = async () => {
    if (!currentUser?.id) {
      toast.error('Admin não identificado');
      return;
    }

    if (!confirm('Atribuir todos os posts ao admin atual?')) return;

    try {
      const count = await assignAllArticlesToAuthor(
        currentUser.id,
        currentUser.name || 'Admin PEM'
      );
      toast.success(`${count} post(s) atribuídos ao admin atual`);
      loadData();
    } catch (error) {
      toast.error('Erro ao atribuir posts ao admin');
    }
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

  // Navegação mobile
  const TabButton = ({ value, icon: Icon, label, count }: { value: string; icon: any; label: string; count?: number }) => (
    <button
      onClick={() => {
        setActiveTab(value);
        setMobileMenuOpen(false);
      }}
      className={`flex items-center gap-2 px-4 py-3 rounded-lg text-sm font-medium transition-colors w-full ${
        activeTab === value
          ? 'bg-[#c40000] text-white'
          : 'text-[#6b6b6b] hover:bg-[#f5f5f5]'
      }`}
    >
      <Icon className="w-5 h-5" />
      <span className="flex-1 text-left">{label}</span>
      {count !== undefined && (
        <Badge variant={activeTab === value ? 'secondary' : 'outline'} className="text-xs">
          {count}
        </Badge>
      )}
    </button>
  );

  return (
    <>
      <title>Painel Administrativo - Portal Econômico Mundial</title>

      {/* Mobile Header */}
      <header className="lg:hidden sticky top-0 z-50 bg-white border-b border-[#e5e5e5]">
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-[#c40000] rounded-lg">
              <LayoutDashboard className="w-5 h-5 text-white" />
            </div>
            <span className="font-bold text-[#111111]">Admin PEM</span>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={logout} className="text-[#ef4444]">
              <LogOut className="w-5 h-5" />
            </Button>
            <Button variant="ghost" size="sm" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </Button>
          </div>
        </div>
        
        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="border-t border-[#e5e5e5] p-4 bg-white">
            <nav className="space-y-1">
              <TabButton value="dashboard" icon={PieChart} label="Dashboard" />
              <TabButton value="noticias" icon={Newspaper} label="Notícias" count={stats.total} />
              <TabButton value="agendamentos" icon={Calendar} label="Calendário" count={stats.scheduled} />
              <TabButton value="usuarios" icon={UserCog} label="Usuários" count={users.length} />
              <TabButton value="settings" icon={Settings} label="Configurações" />
            </nav>
          </div>
        )}
      </header>

      <main className="max-w-[1400px] mx-auto px-3 sm:px-4 py-4 sm:py-6 lg:py-8">
        {/* Desktop Header */}
        <header className="hidden lg:flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-6">
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
              <span className="hidden sm:inline">Exportar</span>
            </Button>
            <Button variant="outline" onClick={logout} className="gap-2 text-[#ef4444]">
              <LogOut className="w-4 h-4" />
              <span className="hidden sm:inline">Sair</span>
            </Button>
          </section>
        </header>

        {/* Alertas */}
        {alerts.length > 0 && (
          <section className="space-y-2 mb-4 sm:mb-6">
            {alerts.map((alert, index) => (
              <aside key={index} className={`p-3 rounded-lg flex items-center gap-2 text-sm ${
                alert.type === 'warning' 
                  ? 'bg-orange-50 border border-orange-200' 
                  : 'bg-blue-50 border border-blue-200'
              }`}>
                {alert.type === 'warning' ? (
                  <AlertTriangle className="w-4 h-4 text-orange-600 flex-shrink-0" />
                ) : (
                  <Bell className="w-4 h-4 text-blue-600 flex-shrink-0" />
                )}
                <p className={`flex-1 ${alert.type === 'warning' ? 'text-orange-800' : 'text-blue-800'}`}>
                  {alert.message}
                </p>
                {selectedArticles.length > 0 && (
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="text-orange-600"
                    onClick={() => setBulkActionDialog(true)}
                  >
                    Ações
                  </Button>
                )}
              </aside>
            ))}
          </section>
        )}

        {/* Tabs Desktop */}
        <div className="hidden lg:block mb-6">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-5">
              <TabsTrigger value="dashboard" className="gap-2">
                <PieChart className="w-4 h-4" />
                Dashboard
              </TabsTrigger>
              <TabsTrigger value="noticias" className="gap-2">
                <Newspaper className="w-4 h-4" />
                Notícias
                <Badge variant="secondary" className="ml-1">{stats.total}</Badge>
              </TabsTrigger>
              <TabsTrigger value="agendamentos" className="gap-2">
                <Calendar className="w-4 h-4" />
                Calendário
                <Badge variant="secondary" className="ml-1">{stats.scheduled}</Badge>
              </TabsTrigger>
              <TabsTrigger value="usuarios" className="gap-2">
                <UserCog className="w-4 h-4" />
                Usuários
                <Badge variant="secondary" className="ml-1">{users.length}</Badge>
              </TabsTrigger>
              <TabsTrigger value="settings" className="gap-2">
                <Settings className="w-4 h-4" />
                Configurações
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        {/* Conteúdo das Tabs */}
        <div className="space-y-4">
          {/* TAB DASHBOARD */}
          {activeTab === 'dashboard' && (
            <section className="space-y-4 sm:space-y-6">
              {/* Stats Grid - Responsivo */}
              <section className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 sm:gap-4">
                {[
                  { icon: FileText, label: 'Total', value: stats.total, color: 'text-[#3b82f6]', bg: 'bg-[#dbeafe]' },
                  { icon: CheckCircle, label: 'Publicados', value: stats.published, color: 'text-[#22c55e]', bg: 'bg-[#dcfce7]' },
                  { icon: Zap, label: 'Urgentes', value: stats.breaking, color: 'text-[#c40000]', bg: 'bg-[#fef2f2]' },
                  { icon: Star, label: 'Destaques', value: stats.featured, color: 'text-[#a16207]', bg: 'bg-[#fef3c7]' },
                  { icon: Clock, label: 'Agendados', value: stats.scheduled, color: 'text-blue-600', bg: 'bg-blue-50' },
                  { icon: TrendingUp, label: 'Views', value: (stats.totalViews / 1000).toFixed(1) + 'k', color: 'text-[#111111]', bg: 'bg-gray-100' },
                ].map((stat, index) => (
                  <article key={index} className={`p-3 sm:p-4 ${stat.bg} rounded-xl`}>
                    <stat.icon className={`w-5 h-5 sm:w-6 sm:h-6 ${stat.color} mb-2`} />
                    <p className="text-xl sm:text-2xl font-bold text-[#111111]">{stat.value}</p>
                    <p className="text-xs text-[#6b6b6b]">{stat.label}</p>
                  </article>
                ))}
              </section>

              {/* Grid Principal */}
              <section className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
                {/* Ações Rápidas */}
                <article className="bg-white border border-[#e5e5e5] rounded-xl p-4 sm:p-6">
                  <h2 className="text-lg font-bold text-[#111111] mb-4">Ações Rápidas</h2>
                  <ul className="space-y-2">
                    <li>
                      <Button 
                        className="w-full bg-[#c40000] hover:bg-[#a00000] gap-2"
                        onClick={() => navigate('/admin/noticias/novo')}
                      >
                        <Plus className="w-4 h-4" />
                        Nova Notícia
                      </Button>
                    </li>
                    <li>
                      <Button 
                        variant="outline" 
                        className="w-full gap-2" 
                        onClick={() => setActiveTab('noticias')}
                      >
                        <FileText className="w-4 h-4" />
                        Lista de Notícias
                      </Button>
                    </li>
                    <li>
                      <Button 
                        variant="outline" 
                        className="w-full gap-2" 
                        onClick={() => setActiveTab('agendamentos')}
                      >
                        <Calendar className="w-4 h-4" />
                        Ver Calendário
                      </Button>
                    </li>
                    <li>
                      <Button 
                        variant="outline" 
                        className="w-full gap-2" 
                        onClick={() => setActiveTab('usuarios')}
                      >
                        <Users className="w-4 h-4" />
                        Gerenciar Usuários
                      </Button>
                    </li>
                  </ul>
                </article>

                {/* Artigos Mais Lidos */}
                <article className="lg:col-span-2 bg-white border border-[#e5e5e5] rounded-xl p-4 sm:p-6">
                  <header className="flex items-center justify-between mb-4">
                    <h2 className="text-lg font-bold text-[#111111]">Artigos Mais Lidos</h2>
                    <Button variant="ghost" size="sm" onClick={() => setActiveTab('noticias')}>
                      Ver todos <ArrowRight className="w-4 h-4 ml-1" />
                    </Button>
                  </header>
                  
                  {topArticles.length > 0 ? (
                    <ul className="space-y-3">
                      {topArticles.map((article, index) => (
                        <li key={article.slug}>
                          <article className="flex items-center gap-3 p-3 bg-[#f8fafb] rounded-lg">
                            <span className="w-8 h-8 rounded-full bg-[#c40000] text-white flex items-center justify-center text-sm font-bold flex-shrink-0">
                              {index + 1}
                            </span>
                            <section className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-[#111111] truncate">{article.title}</p>
                              <p className="text-xs text-[#6b6b6b]">
                                {article.views.toLocaleString('pt-BR')} visualizações
                              </p>
                            </section>
                            <section className="flex items-center gap-1">
                              <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={() => window.open(`/noticias/${article.slug}`, '_blank')}>
                                <Eye className="w-4 h-4" />
                              </Button>
                              <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={() => navigate(`/admin/noticias/editar/${article.slug}`)}>
                                <Edit2 className="w-4 h-4" />
                              </Button>
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
            </section>
          )}

          {/* TAB NOTICIAS */}
          {activeTab === 'noticias' && (
            <section className="space-y-4">
              {/* Filtros - Responsivo */}
              <section className="flex flex-col sm:flex-row gap-2 sm:gap-3">
                <section className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[#6b6b6b]" />
                  <Input
                    placeholder="Buscar artigos..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </section>
                
                {/* Filtros em dropdown no mobile */}
                <div className="flex gap-2">
                  <select 
                    value={categoryFilter} 
                    onChange={(e) => setCategoryFilter(e.target.value)} 
                    className="flex-1 sm:flex-none px-3 py-2 border rounded-md text-sm"
                  >
                    <option value="all">Todas categorias</option>
                    {Object.values(CONTENT_CONFIG.categories).map(cat => (
                      <option key={cat.slug} value={cat.slug}>{cat.name}</option>
                    ))}
                  </select>
                  <select 
                    value={statusFilter} 
                    onChange={(e) => setStatusFilter(e.target.value as ArticleFilters['status'])} 
                    className="flex-1 sm:flex-none px-3 py-2 border rounded-md text-sm"
                  >
                    <option value="all">Todos status</option>
                    <option value="published">Publicado</option>
                    <option value="breaking">Urgente</option>
                    <option value="featured">Destaque</option>
                  </select>
                  <Button 
                    className="bg-[#c40000] hover:bg-[#a00000] gap-2 whitespace-nowrap"
                    onClick={() => navigate('/admin/noticias/novo')}
                  >
                    <Plus className="w-4 h-4" />
                    <span className="hidden sm:inline">Novo</span>
                  </Button>
                </div>
              </section>

              {/* Lista de Artigos - Cards no mobile, tabela no desktop */}
              <section className="bg-white border rounded-xl overflow-hidden">
                {isLoading ? (
                  <section className="p-12 text-center">
                    <section className="w-8 h-8 border-2 border-[#e5e5e5] border-t-[#c40000] rounded-full animate-spin mx-auto" />
                  </section>
                ) : (
                  <>
                    {/* Desktop: Tabela */}
                    <div className="hidden md:block">
                      <table className="w-full">
                        <thead className="bg-[#f9fafb] border-b">
                          <tr>
                            <th className="px-4 py-3 w-10">
                              <input 
                                type="checkbox" 
                                checked={selectedArticles.length === articles.length && articles.length > 0} 
                                onChange={selectAllArticles} 
                              />
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
                                <input 
                                  type="checkbox" 
                                  checked={selectedArticles.includes(article.slug)} 
                                  onChange={() => toggleArticleSelection(article.slug)} 
                                />
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
                                    <DropdownMenuItem onClick={() => window.open(`/noticias/${article.slug}`, '_blank')}>
                                      <Eye className="w-4 h-4 mr-2" /> Visualizar
                                    </DropdownMenuItem>
                                    <DropdownMenuItem onClick={() => navigate(`/admin/noticias/editar/${article.slug}`)}>
                                      <Edit2 className="w-4 h-4 mr-2" /> Editar
                                    </DropdownMenuItem>
                                    <DropdownMenuItem onClick={() => handleDuplicate(article)}>
                                      <Copy className="w-4 h-4 mr-2" /> Duplicar
                                    </DropdownMenuItem>
                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem onClick={() => handleDelete(article)} className="text-[#ef4444]">
                                      <Trash2 className="w-4 h-4 mr-2" /> Excluir
                                    </DropdownMenuItem>
                                  </DropdownMenuContent>
                                </DropdownMenu>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>

                    {/* Mobile: Cards */}
                    <div className="md:hidden">
                      {articles.map((article) => (
                        <article key={article.slug} className="p-4 border-b last:border-b-0">
                          <div className="flex gap-3">
                            <input 
                              type="checkbox" 
                              checked={selectedArticles.includes(article.slug)}
                              onChange={() => toggleArticleSelection(article.slug)}
                              className="mt-1"
                            />
                            <img src={article.coverImage} alt="" className="w-20 h-20 rounded object-cover flex-shrink-0" />
                            <div className="flex-1 min-w-0">
                              <h3 className="font-medium text-sm text-[#111111] line-clamp-2">{article.title}</h3>
                              <p className="text-xs text-[#6b6b6b] mt-1">{article.author}</p>
                              <div className="flex items-center gap-2 mt-2">
                                {article.breaking ? (
                                  <Badge className="text-xs bg-[#fef2f2] text-[#c40000]">Urgente</Badge>
                                ) : article.featured ? (
                                  <Badge className="text-xs bg-[#fefce8] text-[#a16207]">Destaque</Badge>
                                ) : (
                                  <Badge className="text-xs bg-[#f0fdf4] text-[#166534]">Publicado</Badge>
                                )}
                                <span className="text-xs text-[#6b6b6b]">{article.views.toLocaleString('pt-BR')} views</span>
                              </div>
                            </div>
                          </div>
                          <div className="flex gap-2 mt-3">
                            <Button variant="outline" size="sm" className="flex-1" onClick={() => window.open(`/noticias/${article.slug}`, '_blank')}>
                              <Eye className="w-4 h-4 mr-1" /> Ver
                            </Button>
                            <Button variant="outline" size="sm" className="flex-1" onClick={() => navigate(`/admin/noticias/editar/${article.slug}`)}>
                              <Edit2 className="w-4 h-4 mr-1" /> Editar
                            </Button>
                            <Button variant="outline" size="sm" className="text-[#ef4444]" onClick={() => handleDelete(article)}>
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </article>
                      ))}
                    </div>

                    {/* Paginação */}
                    {totalPages > 1 && (
                      <section className="flex flex-col sm:flex-row items-center justify-between px-4 py-4 border-t gap-4">
                        <section className="flex items-center gap-2">
                          <span className="text-sm text-[#6b6b6b]">Itens:</span>
                          <select 
                            value={perPage} 
                            onChange={(e) => setPerPage(Number(e.target.value))} 
                            className="px-2 py-1 border rounded text-sm"
                          >
                            <option value={5}>5</option>
                            <option value={10}>10</option>
                            <option value={25}>25</option>
                            <option value={50}>50</option>
                          </select>
                        </section>
                        <section className="flex items-center gap-2">
                          <Button variant="outline" size="sm" onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1}>
                            <ChevronLeft className="w-4 h-4" />
                          </Button>
                          <span className="text-sm text-[#6b6b6b]">Página {currentPage} de {totalPages}</span>
                          <Button variant="outline" size="sm" onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages}>
                            <ChevronRight className="w-4 h-4" />
                          </Button>
                        </section>
                      </section>
                    )}
                  </>
                )}
              </section>
            </section>
          )}

          {/* TAB CALENDÁRIO */}
          {activeTab === 'agendamentos' && (
            <section className="space-y-4">
              <section className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
                {/* Calendário */}
                <article className="lg:col-span-2 bg-white border rounded-xl p-4 sm:p-6">
                  <header className="flex items-center justify-between mb-4 sm:mb-6">
                    <h2 className="text-lg font-bold text-[#111111]">
                      {monthNames[currentMonth.getMonth()]} {currentMonth.getFullYear()}
                    </h2>
                    <section className="flex items-center gap-2">
                      <Button variant="outline" size="sm" onClick={prevMonth}>
                        <ChevronLeftIcon className="w-4 h-4" />
                      </Button>
                      <Button variant="outline" size="sm" onClick={nextMonth}>
                        <ChevronRightIcon className="w-4 h-4" />
                      </Button>
                    </section>
                  </header>

                  {/* Dias da semana */}
                  <section className="grid grid-cols-7 gap-1 mb-2">
                    {weekDays.map(day => (
                      <section key={day} className="text-center text-xs sm:text-sm font-medium text-[#6b6b6b] py-2">
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
                          className={`aspect-square p-1 sm:p-2 rounded-lg border transition-all relative ${
                            hasScheduled 
                              ? 'bg-blue-50 border-blue-300 hover:bg-blue-100 cursor-pointer' 
                              : 'bg-white border-gray-100 hover:bg-gray-50'
                          }`}
                        >
                          <span className="text-xs sm:text-sm font-medium">{day}</span>
                          {hasScheduled && (
                            <section className="absolute bottom-0.5 right-0.5 left-0.5">
                              <Badge className="w-full justify-center text-xs sm:text-xs bg-blue-600 text-white px-0.5">
                                {scheduledForDay.length}
                              </Badge>
                            </section>
                          )}
                        </button>
                      );
                    })}
                  </section>

                  {/* Legenda */}
                  <section className="flex items-center gap-4 mt-4 text-xs sm:text-sm text-[#6b6b6b]">
                    <section className="flex items-center gap-2">
                      <section className="w-4 h-4 bg-blue-50 border border-blue-300 rounded" />
                      <span>Com agendamentos</span>
                    </section>
                  </section>
                </article>

                {/* Lista de Agendados */}
                <article className="bg-white border rounded-xl p-4 sm:p-6">
                  <header className="flex items-center justify-between mb-4">
                    <h2 className="text-lg font-bold text-[#111111]">Agendamentos</h2>
                    <Badge variant="secondary">{scheduledArticles.length}</Badge>
                  </header>

                  <section className="space-y-3 max-h-[400px] sm:max-h-[500px] overflow-y-auto">
                    {scheduledArticles.length > 0 ? (
                      scheduledArticles.map((scheduled) => (
                        <article key={scheduled.id} className="p-3 bg-[#f8fafb] rounded-lg border">
                          <p className="font-medium text-sm line-clamp-1">{scheduled.articleData.title}</p>
                          <p className="text-xs text-[#6b6b6b] mt-1">
                            <Clock className="w-3 h-3 inline mr-1" />
                            {new Date(`${scheduled.scheduledDate}T${scheduled.scheduledTime}`).toLocaleString('pt-BR')}
                          </p>
                          <section className="flex flex-wrap gap-2 mt-2">
                            <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => handleEditScheduled(scheduled)}>
                              Editar
                            </Button>
                            <Button size="sm" variant="outline" className="h-7 text-xs text-orange-600" onClick={() => handleCancelScheduled(scheduled.id)}>
                              Cancelar
                            </Button>
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
            </section>
          )}

          {/* TAB USUÁRIOS */}
          {activeTab === 'usuarios' && (
            <section className="space-y-4">
              <section className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <section>
                  <h2 className="text-lg font-bold text-[#111111]">Gerenciamento de Usuários</h2>
                  <p className="text-sm text-[#6b6b6b]">{users.length} usuário(s) no sistema</p>
                </section>
                <section className="flex items-center gap-2 w-full sm:w-auto">
                  <Button variant="outline" onClick={exportUsersCSV} className="gap-2 flex-1 sm:flex-none">
                    <Download className="w-4 h-4" />
                    <span className="hidden sm:inline">Exportar CSV</span>
                  </Button>
                  <Button onClick={handleAddUser} className="bg-[#c40000] hover:bg-[#a00000] gap-2 flex-1 sm:flex-none">
                    <Plus className="w-4 h-4" />
                    <span className="hidden sm:inline">Novo Usuário</span>
                  </Button>
                </section>
              </section>

              <section className="flex gap-3">
                <section className="relative flex-1 max-w-sm">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[#6b6b6b]" />
                  <Input 
                    placeholder="Buscar usuários..." 
                    value={userSearch} 
                    onChange={(e) => setUserSearch(e.target.value)} 
                    className="pl-10" 
                  />
                </section>
              </section>

              {/* Desktop: Tabela / Mobile: Cards */}
              <section className="bg-white border rounded-xl overflow-hidden">
                {/* Desktop */}
                <div className="hidden md:block">
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
                              <Button variant="ghost" size="sm" onClick={() => handleEditUser(user)}>
                                <Edit2 className="w-4 h-4" />
                              </Button>
                              <Button variant="ghost" size="sm" onClick={() => handleDeleteUser(user)} disabled={user.id === currentUser?.id} className="text-[#ef4444]">
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </section>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Mobile */}
                <div className="md:hidden">
                  {filteredUsers.map((user) => (
                    <article key={user.id} className="p-4 border-b last:border-b-0">
                      <div className="flex items-start gap-3">
                        <section className="w-10 h-10 rounded-full bg-[#e5e5e5] flex items-center justify-center flex-shrink-0">
                          <User className="w-5 h-5 text-[#6b6b6b]" />
                        </section>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm text-[#111111]">{user.name}</p>
                          <p className="text-xs text-[#6b6b6b]">{user.email}</p>
                          <div className="flex flex-wrap items-center gap-2 mt-2">
                            <Badge className={user.role === 'admin' ? 'text-xs bg-[#fef2f2] text-[#c40000]' : 'text-xs bg-[#f0fdf4] text-[#166534]'}>
                              {user.role === 'admin' ? 'Admin' : 'Usuário'}
                            </Badge>
                            <Badge variant={user.isActive ? 'default' : 'secondary'} className="text-xs">
                              {user.isActive ? 'Ativo' : 'Inativo'}
                            </Badge>
                          </div>
                          {user.profession && (
                            <p className="text-xs text-[#6b6b6b] mt-1">{user.profession}</p>
                          )}
                        </div>
                      </div>
                      <div className="flex gap-2 mt-3">
                        <Button variant="outline" size="sm" className="flex-1" onClick={() => handleEditUser(user)}>
                          <Edit2 className="w-4 h-4 mr-1" /> Editar
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="text-[#ef4444]" 
                          onClick={() => handleDeleteUser(user)} 
                          disabled={user.id === currentUser?.id}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </article>
                  ))}
                </div>

                {filteredUsers.length === 0 && (
                  <section className="p-12 text-center text-[#6b6b6b]">
                    <Users className="w-12 h-12 mx-auto mb-3 text-[#e5e5e5]" />
                    <p>Nenhum usuário encontrado</p>
                  </section>
                )}
              </section>
            </section>
          )}

          {/* TAB CONFIGURAÇÕES */}
          {activeTab === 'settings' && (
            <section className="space-y-4">
              <section className="bg-white border rounded-xl p-4 sm:p-6">
                <h2 className="text-lg font-bold text-[#111111] mb-4">Configurações do Sistema</h2>
                <section className="space-y-3">
                  <section className="p-4 bg-[#f8fafc] rounded-lg">
                    <h3 className="font-medium text-sm mb-3">Limite de Leitura</h3>
                    {isSettingsLoading ? (
                      <p className="text-xs text-[#6b6b6b]">Carregando configurações...</p>
                    ) : (
                      <section className="space-y-4">
                        <section className="flex items-center justify-between">
                          <section>
                            <p className="text-sm font-medium text-[#111111]">Ativar limite</p>
                            <p className="text-xs text-[#6b6b6b]">Exibe apenas parte do artigo</p>
                          </section>
                          <Switch
                            checked={appSettings.readingLimitEnabled}
                            onCheckedChange={(checked) =>
                              setAppSettings(prev => ({ ...prev, readingLimitEnabled: checked }))
                            }
                          />
                        </section>

                        <section className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                          <fieldset>
                            <Label>Percentual visível (0–1)</Label>
                            <Input
                              type="number"
                              min="0"
                              max="1"
                              step="0.05"
                              value={appSettings.readingLimitPercentage}
                              onChange={(e) =>
                                setAppSettings(prev => ({
                                  ...prev,
                                  readingLimitPercentage: Number(e.target.value),
                                }))
                              }
                            />
                          </fieldset>
                          <fieldset>
                            <Label>Artigos grátis</Label>
                            <Input
                              type="number"
                              min="0"
                              step="1"
                              value={appSettings.maxFreeArticles}
                              onChange={(e) =>
                                setAppSettings(prev => ({
                                  ...prev,
                                  maxFreeArticles: Number(e.target.value),
                                }))
                              }
                            />
                          </fieldset>
                          <fieldset>
                            <Label>Aplica para</Label>
                            <select
                              value={appSettings.readingLimitScope}
                              onChange={(e) =>
                                setAppSettings(prev => ({
                                  ...prev,
                                  readingLimitScope: e.target.value as AppSettings['readingLimitScope'],
                                }))
                              }
                              className="w-full px-3 py-2 border rounded-md"
                            >
                              <option value="anon">Apenas não logados</option>
                              <option value="all">Todos</option>
                            </select>
                          </fieldset>
                        </section>

                        <Button
                          variant="outline"
                          onClick={saveAppSettings}
                          disabled={isSettingsSaving}
                          className="w-full sm:w-auto"
                        >
                          <Save className="w-4 h-4 mr-2" />
                          {isSettingsSaving ? 'Salvando...' : 'Salvar limite'}
                        </Button>
                      </section>
                    )}
                  </section>

                  <section className="p-4 bg-[#f8fafc] rounded-lg">
                    <h3 className="font-medium text-sm mb-3">Limites do Plano Free (Supabase)</h3>
                    <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 text-sm">
                      <section className="p-3 bg-white border rounded-md">
                        <p className="text-[#6b6b6b]">Banco de dados</p>
                        <p className="font-medium">{SUPABASE_FREE_LIMITS.databaseSizeMb} MB</p>
                      </section>
                      <section className="p-3 bg-white border rounded-md">
                        <p className="text-[#6b6b6b]">Storage</p>
                        <p className="font-medium">{SUPABASE_FREE_LIMITS.fileStorageGb} GB</p>
                      </section>
                      <section className="p-3 bg-white border rounded-md">
                        <p className="text-[#6b6b6b]">Egress</p>
                        <p className="font-medium">{SUPABASE_FREE_LIMITS.egressGb} GB</p>
                      </section>
                      <section className="p-3 bg-white border rounded-md">
                        <p className="text-[#6b6b6b]">Egress cache</p>
                        <p className="font-medium">{SUPABASE_FREE_LIMITS.cachedEgressGb} GB</p>
                      </section>
                      <section className="p-3 bg-white border rounded-md">
                        <p className="text-[#6b6b6b]">Funções (mês)</p>
                        <p className="font-medium">{SUPABASE_FREE_LIMITS.edgeFunctionInvocations.toLocaleString('pt-BR')}</p>
                      </section>
                      <section className="p-3 bg-white border rounded-md">
                        <p className="text-[#6b6b6b]">Tempo máx. função</p>
                        <p className="font-medium">{SUPABASE_FREE_LIMITS.edgeFunctionMaxDurationSeconds}s</p>
                      </section>
                      <section className="p-3 bg-white border rounded-md">
                        <p className="text-[#6b6b6b]">CPU máx. função</p>
                        <p className="font-medium">{SUPABASE_FREE_LIMITS.edgeFunctionMaxCpuSeconds}s</p>
                      </section>
                      <section className="p-3 bg-white border rounded-md">
                        <p className="text-[#6b6b6b]">Memória função</p>
                        <p className="font-medium">{SUPABASE_FREE_LIMITS.edgeFunctionMemoryMb} MB</p>
                      </section>
                      <section className="p-3 bg-white border rounded-md">
                        <p className="text-[#6b6b6b]">Arquivo máx.</p>
                        <p className="font-medium">{SUPABASE_FREE_LIMITS.maxFileSizeMb} MB</p>
                      </section>
                      <section className="p-3 bg-white border rounded-md">
                        <p className="text-[#6b6b6b]">Funções/projeto</p>
                        <p className="font-medium">{SUPABASE_FREE_LIMITS.maxFunctionsPerProject}</p>
                      </section>
                      <section className="p-3 bg-white border rounded-md">
                        <p className="text-[#6b6b6b]">Projetos ativos</p>
                        <p className="font-medium">{SUPABASE_FREE_LIMITS.maxActiveProjects}</p>
                      </section>
                      <section className="p-3 bg-white border rounded-md">
                        <p className="text-[#6b6b6b]">Auto-pause</p>
                        <p className="font-medium">{SUPABASE_FREE_LIMITS.freeProjectAutoPauseDays} dias</p>
                      </section>
                    </section>
                    <p className="text-xs text-[#6b6b6b] mt-3">
                      Valores de referência do plano Free. Verifique no painel do Supabase, pois podem mudar.
                    </p>
                  </section>

                  <section className="flex flex-col sm:flex-row sm:items-center justify-between p-4 bg-[#f8fafc] rounded-lg gap-4">
                    <section>
                      <p className="font-medium text-sm">Resetar Dados</p>
                      <p className="text-xs text-[#6b6b6b]">Restaura artigos para estado inicial</p>
                    </section>
                    <Button 
                      variant="outline" 
                      onClick={async () => { 
                        if (confirm('ATENÇÃO: Isso apagará todas as alterações. Continuar?')) { 
                          await resetToDefault(); 
                          toast.success('Dados resetados!'); 
                          loadData(); 
                        }
                      }} 
                      className="text-[#ef4444] w-full sm:w-auto"
                    >
                      <RefreshCw className="w-4 h-4 mr-2" /> Resetar
                    </Button>
                  </section>

                  <section className="flex flex-col sm:flex-row sm:items-center justify-between p-4 bg-[#f8fafc] rounded-lg gap-4">
                    <section>
                      <p className="font-medium text-sm">Atribuir posts ao admin</p>
                      <p className="text-xs text-[#6b6b6b]">Define o admin atual como autor de todos os posts</p>
                    </section>
                    <Button
                      variant="outline"
                      onClick={handleAssignPostsToAdmin}
                      className="w-full sm:w-auto"
                    >
                      <User className="w-4 h-4 mr-2" /> Atribuir
                    </Button>
                  </section>
                  
                  <section className="flex flex-col sm:flex-row sm:items-center justify-between p-4 bg-[#f8fafc] rounded-lg gap-4">
                    <section>
                      <p className="font-medium text-sm">Exportar Backup</p>
                      <p className="text-xs text-[#6b6b6b]">Download de todos os dados</p>
                    </section>
                    <Button variant="outline" onClick={exportData} className="w-full sm:w-auto">
                      <Download className="w-4 h-4 mr-2" /> Exportar
                    </Button>
                  </section>
                  
                  <section className="flex flex-col sm:flex-row sm:items-center justify-between p-4 bg-[#f8fafc] rounded-lg gap-4">
                    <section>
                      <p className="font-medium text-sm">Verificar Agendamentos</p>
                      <p className="text-xs text-[#6b6b6b]">Força verificação manual</p>
                    </section>
                    <Button 
                      variant="outline" 
                      onClick={async () => { 
                        const published = await checkAndPublishScheduled(); 
                        if (published > 0) { 
                          toast.success(`${published} artigo(s) publicado(s)!`); 
                          loadData(); 
                        } else { 
                          toast.info('Nenhum artigo para publicar'); 
                        }
                      }}
                      className="w-full sm:w-auto"
                    >
                      <Check className="w-4 h-4 mr-2" /> Verificar
                    </Button>
                  </section>
                </section>
              </section>
            </section>
          )}
        </div>

        {/* Dialogs - Todos responsivos */}
        
        {/* Dialog de Exclusão de Artigo */}
        <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
          <DialogContent className="max-w-sm sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-[#ef4444]">
                <AlertTriangle className="w-5 h-5" /> Confirmar Exclusão
              </DialogTitle>
              <DialogDescription>
                Tem certeza que deseja excluir <strong>"{articleToDelete?.title}"</strong>?
              </DialogDescription>
            </DialogHeader>
            <DialogFooter className="flex-col sm:flex-row gap-2">
              <Button variant="outline" onClick={() => setDeleteDialogOpen(false)} className="w-full sm:w-auto">
                Cancelar
              </Button>
              <Button onClick={confirmDelete} className="bg-[#ef4444] hover:bg-[#dc2626] w-full sm:w-auto">
                <Trash2 className="w-4 h-4 mr-2" /> Excluir
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Dialog de Edição de Agendamento */}
        <Dialog open={editScheduledOpen} onOpenChange={setEditScheduledOpen}>
          <DialogContent className="max-w-sm sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Editar Agendamento</DialogTitle>
              <DialogDescription>Altere a data/hora de <strong>"{scheduledToEdit?.articleData.title}"</strong></DialogDescription>
            </DialogHeader>
            <section className="space-y-4 py-4">
              <section className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <fieldset>
                  <Label>Data</Label>
                  <Input 
                    type="date" 
                    value={scheduledToEdit?.scheduledDate} 
                    onChange={(e) => setScheduledToEdit(prev => prev ? {...prev, scheduledDate: e.target.value} : null)} 
                  />
                </fieldset>
                <fieldset>
                  <Label>Hora</Label>
                  <Input 
                    type="time" 
                    value={scheduledToEdit?.scheduledTime} 
                    onChange={(e) => setScheduledToEdit(prev => prev ? {...prev, scheduledTime: e.target.value} : null)} 
                  />
                </fieldset>
              </section>
            </section>
            <DialogFooter className="flex-col sm:flex-row gap-2">
              <Button variant="outline" onClick={() => setEditScheduledOpen(false)} className="w-full sm:w-auto">
                Cancelar
              </Button>
              <Button onClick={saveScheduledChanges} className="bg-blue-600 hover:bg-blue-700 w-full sm:w-auto">
                <Check className="w-4 h-4 mr-2" /> Salvar
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Dialog de Formulário de Usuário */}
        <Dialog open={showUserForm} onOpenChange={setShowUserForm}>
          <DialogContent className="max-w-sm sm:max-w-lg max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{isEditingUser ? 'Editar Usuário' : 'Novo Usuário'}</DialogTitle>
              <DialogDescription>{isEditingUser ? 'Atualize as informações do usuário' : 'Preencha os dados do novo usuário'}</DialogDescription>
            </DialogHeader>
            <section className="space-y-4 py-4">
              <section className="grid grid-cols-1 gap-4">
                <fieldset>
                  <Label>Nome *</Label>
                  <Input 
                    value={userFormData.name} 
                    onChange={(e) => setUserFormData({...userFormData, name: e.target.value})} 
                    placeholder="Nome completo" 
                  />
                </fieldset>
                <fieldset>
                  <Label>Email *</Label>
                  <Input 
                    type="email" 
                    value={userFormData.email} 
                    onChange={(e) => setUserFormData({...userFormData, email: e.target.value})} 
                    placeholder="email@exemplo.com" 
                  />
                </fieldset>
              </section>
              <section className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <fieldset>
                  <Label>{isEditingUser ? 'Nova senha' : 'Senha *'}</Label>
                  <Input
                    type="password"
                    value={userFormData.password || ''}
                    onChange={(e) => setUserFormData({...userFormData, password: e.target.value})}
                    placeholder={isEditingUser ? 'Deixe em branco para manter' : 'Digite a senha'}
                  />
                </fieldset>
                <fieldset>
                  <Label>{isEditingUser ? 'Confirmar nova senha' : 'Confirmar senha *'}</Label>
                  <Input
                    type="password"
                    value={userFormData.confirmPassword || ''}
                    onChange={(e) => setUserFormData({...userFormData, confirmPassword: e.target.value})}
                    placeholder={isEditingUser ? 'Confirme a nova senha' : 'Repita a senha'}
                  />
                </fieldset>
              </section>
              <section className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <fieldset>
                  <Label>Tipo de Usuário</Label>
                  <select 
                    value={userFormData.role} 
                    onChange={(e) => setUserFormData({...userFormData, role: e.target.value as UserRole})} 
                    className="w-full px-3 py-2 border rounded-md"
                  >
                    <option value="user">Usuário</option>
                    <option value="admin">Administrador</option>
                  </select>
                </fieldset>
                <fieldset>
                  <Label>Status</Label>
                  <select 
                    value={userFormData.isActive ? 'true' : 'false'} 
                    onChange={(e) => setUserFormData({...userFormData, isActive: e.target.value === 'true'})} 
                    className="w-full px-3 py-2 border rounded-md"
                  >
                    <option value="true">Ativo</option>
                    <option value="false">Inativo</option>
                  </select>
                </fieldset>
              </section>
              <section className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <fieldset>
                  <Label>Profissão</Label>
                  <Input 
                    value={userFormData.profession ?? ''} 
                    onChange={(e) => setUserFormData({...userFormData, profession: e.target.value})} 
                    placeholder="Ex: Jornalista" 
                  />
                </fieldset>
                <fieldset>
                  <Label>Empresa</Label>
                  <Input 
                    value={userFormData.company ?? ''} 
                    onChange={(e) => setUserFormData({...userFormData, company: e.target.value})} 
                    placeholder="Ex: Empresa XYZ" 
                  />
                </fieldset>
              </section>
              <fieldset>
                <Label>Região</Label>
                <select 
                  value={userFormData.region ?? ''} 
                  onChange={(e) => setUserFormData({...userFormData, region: e.target.value})} 
                  className="w-full px-3 py-2 border rounded-md"
                >
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
                <textarea 
                  value={userFormData.bio ?? ''} 
                  onChange={(e) => setUserFormData({...userFormData, bio: e.target.value})} 
                  placeholder="Breve descrição do usuário..." 
                  rows={3} 
                  className="w-full px-3 py-2 border rounded-md"
                />
              </fieldset>
            </section>
            <DialogFooter className="flex-col sm:flex-row gap-2">
              <Button variant="outline" onClick={() => setShowUserForm(false)} className="w-full sm:w-auto">
                Cancelar
              </Button>
              <Button onClick={saveUser} className="bg-[#c40000] hover:bg-[#a00000] w-full sm:w-auto">
                <Save className="w-4 h-4 mr-2" /> {isEditingUser ? 'Atualizar' : 'Criar'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Dialog de Exclusão de Usuário */}
        <Dialog open={!!userToDelete} onOpenChange={() => setUserToDelete(null)}>
          <DialogContent className="max-w-sm">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-[#ef4444]">
                <AlertTriangle className="w-5 h-5" /> Excluir Usuário
              </DialogTitle>
              <DialogDescription>
                Tem certeza que deseja excluir <strong>"{userToDelete?.name}"</strong>?
              </DialogDescription>
            </DialogHeader>
            <DialogFooter className="flex-col sm:flex-row gap-2">
              <Button variant="outline" onClick={() => setUserToDelete(null)} className="w-full sm:w-auto">
                Cancelar
              </Button>
              <Button onClick={confirmDeleteUser} className="bg-[#ef4444] hover:bg-[#dc2626] w-full sm:w-auto">
                <Trash2 className="w-4 h-4 mr-2" /> Excluir
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Dialog de Detalhes da Data */}
        <Dialog open={dateDetailsOpen} onOpenChange={setDateDetailsOpen}>
          <DialogContent className="max-w-sm">
            <DialogHeader>
              <DialogTitle>Agendamentos para {selectedDate ? new Date(selectedDate).toLocaleDateString('pt-BR') : ''}</DialogTitle>
            </DialogHeader>
            <section className="space-y-3 py-4 max-h-[300px] overflow-y-auto">
              {selectedDate && getScheduledForDate(parseInt(selectedDate.split('-')[2])).map((scheduled) => (
                <article key={scheduled.id} className="p-3 bg-[#f8fafb] rounded-lg border">
                  <p className="font-medium text-sm">{scheduled.articleData.title}</p>
                  <p className="text-xs text-[#6b6b6b]">
                    <Clock className="w-3 h-3 inline mr-1" />
                    {scheduled.scheduledTime}
                  </p>
                  <section className="flex gap-2 mt-2">
                    <Button size="sm" variant="outline" className="h-7 text-xs flex-1" onClick={() => { setDateDetailsOpen(false); handleEditScheduled(scheduled); }}>
                      Editar
                    </Button>
                    <Button size="sm" variant="outline" className="h-7 text-xs text-orange-600 flex-1" onClick={() => { handleCancelScheduled(scheduled.id); setDateDetailsOpen(false); }}>
                      Cancelar
                    </Button>
                  </section>
                </article>
              ))}
            </section>
            <DialogFooter>
              <Button onClick={() => setDateDetailsOpen(false)} className="w-full">Fechar</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Dialog de Ações em Massa */}
        <Dialog open={bulkActionDialog} onOpenChange={setBulkActionDialog}>
          <DialogContent className="max-w-sm">
            <DialogHeader>
              <DialogTitle>Ações em Massa</DialogTitle>
              <DialogDescription>{selectedArticles.length} artigo(s) selecionado(s)</DialogDescription>
            </DialogHeader>
            <section className="space-y-3 py-4">
              <Button variant="outline" className="w-full justify-start text-[#ef4444]" onClick={handleBulkDelete}>
                <Trash2 className="w-4 h-4 mr-2" /> Excluir Selecionados
              </Button>
              <Button variant="outline" className="w-full justify-start" onClick={() => setSelectedArticles([])}>
                <X className="w-4 h-4 mr-2" /> Limpar Seleção
              </Button>
            </section>
          </DialogContent>
        </Dialog>
      </main>
    </>
  );
}
