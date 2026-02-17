/**
 * Admin Dashboard - Painel Administrativo Completo
 * 100% Responsivo - Mobile First
 * Refatorado: Componentes divididos para melhor manutenibilidade
 */

'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import {
  Settings,
  LogOut,
  LayoutDashboard,
  Newspaper,
  UserCog,
  Users,
  Calendar,
  Download,
  AlertTriangle,
  Bell,
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
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
  deleteArticle,
  duplicateArticle,
  cancelScheduledArticle,
  updateScheduledArticle,
  resetToDefault,
  assignAllArticlesToAuthor,
  getAllArticles,
  getScheduledArticles,
} from '@/services/newsManager';
import {
  createAdminUser,
  updateAdminUser,
  updateAdminUserPassword,
  deleteAdminUser,
} from '@/services/adminUsers';
import {
  createAdminAuthor,
  updateAdminAuthor,
  deleteAdminAuthor,
  restoreAdminAuthor,
} from '@/services/adminAuthors';
import type { Author } from '@/config/authors';
import type { UserRole } from '@/types/user';


// Componentes divididos
import { DashboardStats } from './components/DashboardStats';
import { ArticleTable } from './components/ArticleTable';
import { UserManagement } from './components/UserManagement';
import { AuthorManagement } from './components/AuthorManagement';
import { CalendarView } from './components/CalendarView';
import { SettingsPanel } from './components/SettingsPanel';
import { useAdminData, getInitialAuthorFormState } from './hooks/useAdminData';
import type { AdminTab, SystemUser, AuthorFormState } from './types';

export default function AdminDashboardClient({ initialTab }: { initialTab?: AdminTab }) {
  const { user: currentUser, logout } = useAuth();
  const router = useRouter();
  const pathname = usePathname() || '';

  // Tabs
  const [activeTab, setActiveTab] = useState<AdminTab>(() => initialTab ?? 'dashboard');

  const routeTab = useMemo<AdminTab>(() => {
    if (pathname === '/admin' || pathname.startsWith('/admin/dashboard')) return 'dashboard';
    if (pathname.startsWith('/admin/noticias')) return 'noticias';
    if (pathname.startsWith('/admin/agendamentos')) return 'agendamentos';
    if (pathname.startsWith('/admin/usuarios')) return 'usuarios';
    if (pathname.startsWith('/admin/autores')) return 'autores';
    if (pathname.startsWith('/admin/settings')) return 'settings';
    return 'dashboard';
  }, [pathname]);

  // CalendÃ¡rio
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  // Dialogs
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [articleToDelete, setArticleToDelete] = useState<{ slug: string; title: string } | null>(null);
  const [editScheduledOpen, setEditScheduledOpen] = useState(false);
  const [scheduledToEdit, setScheduledToEdit] = useState<{ id: string; scheduledDate: string; scheduledTime: string } | null>(null);

  // FormulÃ¡rios
  const [showUserForm, setShowUserForm] = useState(false);
  const [isEditingUser, setIsEditingUser] = useState(false);
  const [userToEdit, setUserToEdit] = useState<SystemUser | null>(null);
  const [userFormData, setUserFormData] = useState<Partial<SystemUser> & { password?: string; confirmPassword?: string }>({
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

  const [showAuthorForm, setShowAuthorForm] = useState(false);
  const [isEditingAuthor, setIsEditingAuthor] = useState(false);
  const [authorToEdit, setAuthorToEdit] = useState<Author | null>(null);
  const [authorFormData, setAuthorFormData] = useState<AuthorFormState>(getInitialAuthorFormState());

  // Hooks de dados
  const {
    articles,
    scheduledArticles,
    stats,
    isLoading,
    analyticsMetrics,
    topContent,
    trafficSources,
    deviceStats,
    recentActivity,
    isAnalyticsLoading,
    refreshAnalytics,
    dateRange,
    setDateRange,
    searchTerm,
    setSearchTerm,
    categoryFilter,
    setCategoryFilter,
    statusFilter,
    setStatusFilter,
    currentPage,
    setCurrentPage,
    perPage,
    setPerPage,
    totalPages,
    selectedArticles,
    toggleArticleSelection,
    selectAllArticles,
    users,
    loadUsers,
    authors,
    loadAuthors,
    loadData,
    checkScheduled,
  } = useAdminData();

  useEffect(() => {
    setActiveTab(initialTab ?? routeTab);
  }, [initialTab, routeTab]);

  const goToTab = useCallback(
    (tab: AdminTab) => {
      const href =
        tab === 'dashboard'
          ? '/admin/dashboard'
          : tab === 'noticias'
            ? '/admin/noticias'
            : tab === 'agendamentos'
              ? '/admin/agendamentos'
              : tab === 'usuarios'
                ? '/admin/usuarios'
                : tab === 'autores'
                  ? '/admin/autores'
                  : '/admin/settings';
      setActiveTab(tab);
      router.push(href);
    },
    [router]
  );

  // Verificar publicaÃ§Ãµes agendadas periodicamente
  useEffect(() => {
    const interval = setInterval(() => {
      void checkScheduled();
    }, 60000);
    return () => clearInterval(interval);
  }, [checkScheduled]);

  // Handlers de artigos
  const handleDelete = useCallback((article: { slug: string; title: string }) => {
    setArticleToDelete(article);
    setDeleteDialogOpen(true);
  }, []);

  const confirmDelete = useCallback(async () => {
    if (!articleToDelete) return;
    const success = await deleteArticle(articleToDelete.slug);
    if (success) {
      toast.success(`Artigo "${articleToDelete.title}" excluÃ­do!`);
      await loadData();
    }
    setDeleteDialogOpen(false);
  }, [articleToDelete, loadData]);

  const handleDuplicate = useCallback(async (article: { slug: string; title: string }) => {
    const newArticle = await duplicateArticle(article.slug);
    if (newArticle) {
      toast.success(`Artigo "${article.title}" duplicado!`);
      await loadData();
    }
  }, [loadData]);

  const handleCancelScheduled = useCallback(async (id: string) => {
    await cancelScheduledArticle(id);
    toast.success('Agendamento cancelado!');
    await loadData();
  }, [loadData]);

  const handleEditScheduled = useCallback((scheduled: { id: string; scheduledDate: string; scheduledTime: string }) => {
    setScheduledToEdit(scheduled);
    setEditScheduledOpen(true);
  }, []);

  const saveScheduledChanges = useCallback(async () => {
    if (!scheduledToEdit) return;
    await updateScheduledArticle(scheduledToEdit.id, {
      scheduledDate: scheduledToEdit.scheduledDate,
      scheduledTime: scheduledToEdit.scheduledTime,
    });
    toast.success('Agendamento atualizado!');
    setEditScheduledOpen(false);
    await loadData();
  }, [scheduledToEdit, loadData]);

  // Handlers de usuÃ¡rios
  const handleAddUser = useCallback(() => {
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
  }, []);

  const handleEditUser = useCallback((user: SystemUser) => {
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
  }, []);

  const saveUser = useCallback(async () => {
    if (!userFormData.name || !userFormData.email) {
      toast.error('Nome e email sÃ£o obrigatÃ³rios!');
      return;
    }

    if (!isEditingUser) {
      if (!userFormData.password || !userFormData.confirmPassword) {
        toast.error('Senha Ã© obrigatÃ³ria para novo usuÃ¡rio');
        return;
      }
      if (userFormData.password !== userFormData.confirmPassword) {
        toast.error('As senhas nÃ£o conferem');
        return;
      }
    }

    if (userFormData.password && userFormData.confirmPassword) {
      if (userFormData.password !== userFormData.confirmPassword) {
        toast.error('As senhas nÃ£o conferem');
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

        toast.success('UsuÃ¡rio atualizado com sucesso!');
      } else {
        await createAdminUser({
          name: userFormData.name,
          email: userFormData.email,
          password: userFormData.password ?? '',
          role: (userFormData.role as UserRole) ?? 'user',
        });
        toast.success('UsuÃ¡rio criado com sucesso!');
      }

      setShowUserForm(false);
      await loadUsers();
    } catch {
      toast.error('Erro ao salvar usuÃ¡rio');
    }
  }, [userFormData, isEditingUser, userToEdit, loadUsers]);

  const handleDeleteUser = useCallback(async (user: SystemUser) => {
    if (user.id === currentUser?.id) {
      toast.error('VocÃª nÃ£o pode excluir sua prÃ³pria conta!');
      return;
    }
    try {
      await deleteAdminUser({ userId: user.id });
      toast.success(`UsuÃ¡rio "${user.name}" excluÃ­do!`);
      await loadUsers();
    } catch {
      toast.error('Erro ao excluir usuÃ¡rio');
    }
  }, [currentUser?.id, loadUsers]);

  // Handlers de autores
  const splitCommaList = useCallback((value: string) =>
    value
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean), []);

  const splitLinesList = useCallback((value: string) =>
    value
      .split(/\r?\n/)
      .map((s) => s.trim())
      .filter(Boolean), []);

  const handleAddAuthor = useCallback(() => {
    setIsEditingAuthor(false);
    setAuthorToEdit(null);
    setAuthorFormData(getInitialAuthorFormState());
    setShowAuthorForm(true);
  }, []);

  const handleEditAuthor = useCallback((author: Author) => {
    setIsEditingAuthor(true);
    setAuthorToEdit(author);
    setAuthorFormData({
      slug: author.slug,
      name: author.name,
      shortName: author.shortName,
      title: author.title,
      bio: author.bio,
      longBio: author.longBio,
      photo: author.photo,
      email: author.email,
      social: author.social ?? {},
      expertise: (author.expertise ?? []).join(', '),
      awards: (author.awards ?? []).join('\n'),
      languages: (author.languages ?? []).join(', '),
      joinedAt: author.joinedAt ?? '',
      isActive: author.isActive,
      factChecker: Boolean(author.factChecker),
      editor: Boolean(author.editor),
      education: author.education ?? [],
    });
    setShowAuthorForm(true);
  }, []);

  const saveAuthor = useCallback(async () => {
    if (!authorFormData.name.trim()) {
      toast.error('Nome Ã© obrigatÃ³rio');
      return;
    }
    if (!authorFormData.slug.trim()) {
      toast.error('Slug Ã© obrigatÃ³rio');
      return;
    }
    if (!authorFormData.shortName.trim()) {
      toast.error('Nome curto Ã© obrigatÃ³rio');
      return;
    }
    if (!authorFormData.title.trim()) {
      toast.error('Cargo/tÃ­tulo Ã© obrigatÃ³rio');
      return;
    }
    if (!authorFormData.bio.trim()) {
      toast.error('Bio curta Ã© obrigatÃ³ria');
      return;
    }

    const longBio = authorFormData.longBio.trim() || authorFormData.bio.trim();

    if (!authorFormData.photo.trim()) {
      toast.error('Foto (caminho em /public) Ã© obrigatÃ³ria');
      return;
    }
    if (!authorFormData.email.trim()) {
      toast.error('Email Ã© obrigatÃ³rio');
      return;
    }

    const payload: Author = {
      slug: authorFormData.slug.trim(),
      name: authorFormData.name.trim(),
      shortName: authorFormData.shortName.trim(),
      title: authorFormData.title.trim(),
      bio: authorFormData.bio.trim(),
      longBio,
      photo: authorFormData.photo.trim(),
      email: authorFormData.email.trim(),
      social: {
        twitter: authorFormData.social.twitter?.trim() || undefined,
        linkedin: authorFormData.social.linkedin?.trim() || undefined,
        facebook: authorFormData.social.facebook?.trim() || undefined,
        instagram: authorFormData.social.instagram?.trim() || undefined,
      },
      expertise: splitCommaList(authorFormData.expertise),
      education: (authorFormData.education ?? [])
        .map((e) => ({
          institution: e.institution?.trim() ?? '',
          degree: e.degree?.trim() ?? '',
          year: e.year?.trim() ?? '',
        }))
        .filter((e) => e.institution && e.degree && e.year),
      awards: splitLinesList(authorFormData.awards),
      languages: splitCommaList(authorFormData.languages),
      joinedAt: authorFormData.joinedAt || new Date().toISOString().split('T')[0],
      isActive: authorFormData.isActive,
      factChecker: authorFormData.factChecker,
      editor: authorFormData.editor,
    };

    try {
      if (isEditingAuthor && authorToEdit) {
        const updates: Partial<Author> = { ...payload };
        delete (updates as Partial<Author> & { slug?: string }).slug;
        await updateAdminAuthor({ slug: authorToEdit.slug, updates });
        toast.success('Autor atualizado com sucesso!');
      } else {
        await createAdminAuthor(payload);
        toast.success('Autor criado com sucesso!');
      }

      setShowAuthorForm(false);
      await loadAuthors();
    } catch {
      toast.error('Erro ao salvar autor');
    }
  }, [authorFormData, isEditingAuthor, authorToEdit, splitCommaList, splitLinesList, loadAuthors]);

  const handleDeleteAuthor = useCallback(async (author: Author) => {
    try {
      await deleteAdminAuthor({ slug: author.slug });
      toast.success(`Autor "${author.name}" desativado!`);
      await loadAuthors();
    } catch {
      toast.error('Erro ao desativar autor');
    }
  }, [loadAuthors]);

  const handleRestoreAuthor = useCallback(async (author: Author) => {
    try {
      await restoreAdminAuthor({ slug: author.slug });
      toast.success(`Autor "${author.name}" reativado!`);
      await loadAuthors();
    } catch {
      toast.error('Erro ao reativar autor');
    }
  }, [loadAuthors]);

  // Handlers de configuraÃ§Ãµes

  const handleReset = useCallback(async () => {
    if (confirm('ATENÃ‡ÃƒO: Isso apagarÃ¡ todas as alteraÃ§Ãµes. Continuar?')) {
      await resetToDefault();
      toast.success('Dados resetados!');
      await loadData();
    }
  }, [loadData]);

  const handleAssignPostsToAdmin = useCallback(async () => {
    if (!currentUser?.id) {
      toast.error('Admin nÃ£o identificado');
      return;
    }
    if (!confirm('Atribuir todos os posts ao admin atual?')) return;
    try {
      const count = await assignAllArticlesToAuthor(currentUser.id, currentUser.name || 'Admin CIN');
      toast.success(`${count} post(s) atribuÃ­dos ao admin atual`);
      await loadData();
    } catch {
      toast.error('Erro ao atribuir posts ao admin');
    }
  }, [currentUser, loadData]);

  const handleExport = useCallback(async () => {
    const data = {
      articles: await getAllArticles({ includeDrafts: true }),
      scheduled: await getScheduledArticles(),
      exportedAt: new Date().toISOString(),
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `cin-backup-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('Backup exportado!');
  }, []);

  const handleCheckScheduled = useCallback(async () => {
    const published = await checkScheduled();
    if (published === 0) {
      toast.info('Nenhum artigo para publicar');
    }
  }, [checkScheduled]);

  const exportUsersCSV = useCallback(() => {
    const csv = [
      ['ID', 'Nome', 'Email', 'Tipo', 'RegiÃ£o', 'ProfissÃ£o', 'Empresa', 'Data de Cadastro', 'Ãšltimo Login', 'Status'].join(','),
      ...users.map((u) =>
        [
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
        ].join(',')
      ),
    ].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `cin-usuarios-${Date.now()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('UsuÃ¡rios exportados!');
  }, [users]);

  // Handlers de calendÃ¡rio
  const prevMonth = useCallback(() => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1));
  }, [currentMonth]);

  const nextMonth = useCallback(() => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1));
  }, [currentMonth]);

  const handleDateClick = useCallback((day: number) => {
    const dateStr = `${currentMonth.getFullYear()}-${String(currentMonth.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    setSelectedDate(dateStr);
  }, [currentMonth]);

  // Alertas
  const alerts = [];
  if (stats.scheduled > 0) {
    alerts.push({ type: 'info' as const, message: `${stats.scheduled} artigo(s) agendado(s) para publicaÃ§Ã£o` });
  }
  if (selectedArticles.length > 0) {
    alerts.push({ type: 'warning' as const, message: `${selectedArticles.length} artigo(s) selecionado(s)` });
  }

  return (
    <>
      <main className="max-w-[1400px] mx-auto">
        <header className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-6">
          <section className="flex items-center gap-3">
            <section className="p-2 bg-[#c40000] rounded-lg">
              <LayoutDashboard className="w-6 h-6 text-white" />
            </section>
            <section>
              <h1 className="text-2xl sm:text-3xl font-bold text-[#111111]">Painel Administrativo</h1>
              <p className="text-sm text-[#6b6b6b]">
                Bem-vindo, {currentUser?.name} â€¢ Acesso total ao sistema
              </p>
            </section>
          </section>

          <section className="flex items-center gap-2">
            <Button variant="outline" onClick={handleExport} className="gap-2">
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
              <aside
                key={index}
                className={`p-3 rounded-lg flex items-center gap-2 text-sm ${
                  alert.type === 'warning'
                    ? 'bg-orange-50 border border-orange-200'
                    : 'bg-blue-50 border border-blue-200'
                }`}
              >
                {alert.type === 'warning' ? (
                  <AlertTriangle className="w-4 h-4 text-orange-600 flex-shrink-0" />
                ) : (
                  <Bell className="w-4 h-4 text-blue-600 flex-shrink-0" />
                )}
                <p className={`flex-1 ${alert.type === 'warning' ? 'text-orange-800' : 'text-blue-800'}`}>
                  {alert.message}
                </p>
              </aside>
            ))}
          </section>
        )}

        {/* ConteÃºdo das Tabs */}
        <div className="space-y-4">
          {activeTab === 'dashboard' && (
            <DashboardStats
              metrics={analyticsMetrics}
              topContent={topContent}
              trafficSources={trafficSources}
              deviceStats={deviceStats}
              recentActivity={recentActivity}
              isLoading={isAnalyticsLoading}
              onRefresh={refreshAnalytics}
              onDateRangeChange={setDateRange}
              currentDateRange={dateRange}
              onNewArticle={() => router.push('/admin/noticias/novo')}
              onViewArticles={() => goToTab('noticias')}
              onViewCalendar={() => goToTab('agendamentos')}
              onManageUsers={() => goToTab('usuarios')}
            />
          )}

          {activeTab === 'noticias' && (
            <ArticleTable
              articles={articles}
              isLoading={isLoading}
              searchTerm={searchTerm}
              categoryFilter={categoryFilter}
              statusFilter={statusFilter}
              currentPage={currentPage}
              perPage={perPage}
              totalPages={totalPages}
              selectedArticles={selectedArticles}
              onSearchChange={setSearchTerm}
              onCategoryChange={setCategoryFilter}
              onStatusChange={setStatusFilter}
              onPageChange={setCurrentPage}
              onPerPageChange={setPerPage}
              onToggleSelection={toggleArticleSelection}
              onSelectAll={selectAllArticles}
              onViewArticle={(slug) => window.open(`/noticias/${slug}`, '_blank')}
              onEditArticle={(slug) => router.push(`/admin/noticias/editar/${slug}`)}
              onDuplicateArticle={(article) => handleDuplicate(article)}
              onDeleteArticle={(article) => handleDelete(article)}
              onNewArticle={() => router.push('/admin/noticias/novo')}
            />
          )}

          {activeTab === 'agendamentos' && (
            <CalendarView
              currentMonth={currentMonth}
              scheduledArticles={scheduledArticles}
              onPrevMonth={prevMonth}
              onNextMonth={nextMonth}
              onDateClick={handleDateClick}
              onEditScheduled={handleEditScheduled}
              onCancelScheduled={handleCancelScheduled}
              onNewScheduled={() => router.push('/admin/noticias/novo')}
            />
          )}

          {activeTab === 'usuarios' && (
            <UserManagement
              users={users}
              currentUserId={currentUser?.id}
              userSearch={searchTerm}
              onSearchChange={setSearchTerm}
              onAddUser={handleAddUser}
              onEditUser={handleEditUser}
              onDeleteUser={handleDeleteUser}
              onExportCSV={exportUsersCSV}
            />
          )}

          {activeTab === 'autores' && (
            <AuthorManagement
              authors={authors}
              authorSearch={searchTerm}
              onSearchChange={setSearchTerm}
              onAddAuthor={handleAddAuthor}
              onEditAuthor={handleEditAuthor}
              onDeleteAuthor={handleDeleteAuthor}
              onRestoreAuthor={handleRestoreAuthor}
            />
          )}

          {activeTab === 'settings' && (
            <SettingsPanel
              onReset={handleReset}
              onAssignPosts={handleAssignPostsToAdmin}
              onExport={handleExport}
              onCheckScheduled={handleCheckScheduled}
            />
          )}
        </div>

        {/* Dialog de ExclusÃ£o de Artigo */}
        <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
          <DialogContent className="max-w-sm sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-[#ef4444]">
                <AlertTriangle className="w-5 h-5" /> Confirmar ExclusÃ£o
              </DialogTitle>
              <DialogDescription>
                Tem certeza que deseja excluir o artigo <strong>&quot;{articleToDelete?.title}&quot;</strong>?
                <br />
                Esta aÃ§Ã£o nÃ£o pode ser desfeita.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>
                Cancelar
              </Button>
              <Button variant="destructive" onClick={confirmDelete}>
                Excluir
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Dialog de EdiÃ§Ã£o de Agendamento */}
        <Dialog open={editScheduledOpen} onOpenChange={setEditScheduledOpen}>
          <DialogContent className="max-w-sm">
            <DialogHeader>
              <DialogTitle>Editar Agendamento</DialogTitle>
            </DialogHeader>
            {scheduledToEdit && (
              <section className="space-y-4 py-4">
                <section>
                  <label className="text-sm font-medium">Data</label>
                  <input
                    type="date"
                    value={scheduledToEdit.scheduledDate}
                    onChange={(e) => setScheduledToEdit({ ...scheduledToEdit, scheduledDate: e.target.value })}
                    className="w-full px-3 py-2 border rounded-md"
                  />
                </section>
                <section>
                  <label className="text-sm font-medium">Hora</label>
                  <input
                    type="time"
                    value={scheduledToEdit.scheduledTime}
                    onChange={(e) => setScheduledToEdit({ ...scheduledToEdit, scheduledTime: e.target.value })}
                    className="w-full px-3 py-2 border rounded-md"
                  />
                </section>
              </section>
            )}
            <DialogFooter>
              <Button variant="outline" onClick={() => setEditScheduledOpen(false)}>
                Cancelar
              </Button>
              <Button onClick={saveScheduledChanges}>Salvar</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Dialog de FormulÃ¡rio de UsuÃ¡rio */}
        <Dialog open={showUserForm} onOpenChange={setShowUserForm}>
          <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{isEditingUser ? 'Editar UsuÃ¡rio' : 'Novo UsuÃ¡rio'}</DialogTitle>
            </DialogHeader>
            <section className="space-y-4 py-4">
              <section>
                <label className="text-sm font-medium">Nome *</label>
                <input
                  type="text"
                  value={userFormData.name}
                  onChange={(e) => setUserFormData({ ...userFormData, name: e.target.value })}
                  className="w-full px-3 py-2 border rounded-md"
                />
              </section>
              <section>
                <label className="text-sm font-medium">Email *</label>
                <input
                  type="email"
                  value={userFormData.email}
                  onChange={(e) => setUserFormData({ ...userFormData, email: e.target.value })}
                  className="w-full px-3 py-2 border rounded-md"
                />
              </section>
              <section>
                <label className="text-sm font-medium">Tipo</label>
                <select
                  value={userFormData.role}
                  onChange={(e) => setUserFormData({ ...userFormData, role: e.target.value as UserRole })}
                  className="w-full px-3 py-2 border rounded-md"
                >
                  <option value="user">UsuÃ¡rio</option>
                  <option value="admin">Admin</option>
                </select>
              </section>
              {!isEditingUser && (
                <>
                  <section>
                    <label className="text-sm font-medium">Senha *</label>
                    <input
                      type="password"
                      value={userFormData.password}
                      onChange={(e) => setUserFormData({ ...userFormData, password: e.target.value })}
                      className="w-full px-3 py-2 border rounded-md"
                    />
                  </section>
                  <section>
                    <label className="text-sm font-medium">Confirmar Senha *</label>
                    <input
                      type="password"
                      value={userFormData.confirmPassword}
                      onChange={(e) => setUserFormData({ ...userFormData, confirmPassword: e.target.value })}
                      className="w-full px-3 py-2 border rounded-md"
                    />
                  </section>
                </>
              )}
              {isEditingUser && (
                <section>
                  <label className="text-sm font-medium">Nova Senha (deixe em branco para nÃ£o alterar)</label>
                  <input
                    type="password"
                    value={userFormData.password}
                    onChange={(e) => setUserFormData({ ...userFormData, password: e.target.value })}
                    className="w-full px-3 py-2 border rounded-md"
                  />
                </section>
              )}
            </section>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowUserForm(false)}>
                Cancelar
              </Button>
              <Button onClick={saveUser}>{isEditingUser ? 'Salvar' : 'Criar'}</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Dialog de FormulÃ¡rio de Autor */}
        <Dialog open={showAuthorForm} onOpenChange={setShowAuthorForm}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{isEditingAuthor ? 'Editar Autor' : 'Novo Autor'}</DialogTitle>
            </DialogHeader>
            <section className="space-y-4 py-4">
              <section className="grid grid-cols-2 gap-4">
                <section>
                  <label className="text-sm font-medium">Nome *</label>
                  <input
                    type="text"
                    value={authorFormData.name}
                    onChange={(e) => setAuthorFormData({ ...authorFormData, name: e.target.value })}
                    className="w-full px-3 py-2 border rounded-md"
                  />
                </section>
                <section>
                  <label className="text-sm font-medium">Slug *</label>
                  <input
                    type="text"
                    value={authorFormData.slug}
                    onChange={(e) => setAuthorFormData({ ...authorFormData, slug: e.target.value })}
                    className="w-full px-3 py-2 border rounded-md"
                    disabled={isEditingAuthor}
                  />
                </section>
              </section>
              <section className="grid grid-cols-2 gap-4">
                <section>
                  <label className="text-sm font-medium">Nome Curto *</label>
                  <input
                    type="text"
                    value={authorFormData.shortName}
                    onChange={(e) => setAuthorFormData({ ...authorFormData, shortName: e.target.value })}
                    className="w-full px-3 py-2 border rounded-md"
                  />
                </section>
                <section>
                  <label className="text-sm font-medium">TÃ­tulo/Cargo *</label>
                  <input
                    type="text"
                    value={authorFormData.title}
                    onChange={(e) => setAuthorFormData({ ...authorFormData, title: e.target.value })}
                    className="w-full px-3 py-2 border rounded-md"
                  />
                </section>
              </section>
              <section>
                <label className="text-sm font-medium">Email *</label>
                <input
                  type="email"
                  value={authorFormData.email}
                  onChange={(e) => setAuthorFormData({ ...authorFormData, email: e.target.value })}
                  className="w-full px-3 py-2 border rounded-md"
                />
              </section>
              <section>
                <label className="text-sm font-medium">Bio Curta *</label>
                <textarea
                  value={authorFormData.bio}
                  onChange={(e) => setAuthorFormData({ ...authorFormData, bio: e.target.value })}
                  className="w-full px-3 py-2 border rounded-md"
                  rows={2}
                />
              </section>
              <section>
                <label className="text-sm font-medium">Bio Longa</label>
                <textarea
                  value={authorFormData.longBio}
                  onChange={(e) => setAuthorFormData({ ...authorFormData, longBio: e.target.value })}
                  className="w-full px-3 py-2 border rounded-md"
                  rows={4}
                />
              </section>
              <section>
                <label className="text-sm font-medium">Foto (caminho em /public) *</label>
                <input
                  type="text"
                  value={authorFormData.photo}
                  onChange={(e) => setAuthorFormData({ ...authorFormData, photo: e.target.value })}
                  className="w-full px-3 py-2 border rounded-md"
                  placeholder="/images/authors/nome.webp"
                />
              </section>
            </section>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowAuthorForm(false)}>
                Cancelar
              </Button>
              <Button onClick={saveAuthor}>{isEditingAuthor ? 'Salvar' : 'Criar'}</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </main>
    </>
  );
}


