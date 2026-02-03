/**
 * Admin Dashboard - Visão Geral
 * Métricas e alertas para administradores
 */

import { Link } from 'react-router-dom';
import { 
  FileText, 
  Users, 
  MessageSquare, 
  TrendingUp, 
  AlertTriangle, 
  ArrowRight,
  Activity
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { ROUTES } from '@/config/routes';
import { mockArticles } from '@/services/newsService';
import { storage } from '@/config/storage';
import { Button } from '@/components/ui/button';

export function AdminDashboard() {
  const { user } = useAuth();
  
  // Métricas
  const totalArticles = mockArticles.length;
  const registeredUsers = storage.get<Array<{ id: string; email: string }>>('pem_registered_users') || [];
  const totalUsers = registeredUsers.length + 2; // +2 mock users
  const comments = storage.get<Array<unknown>>('pem_comments') || [];
  const totalComments = comments.length;
  
  // Artigos mais lidos
  const topArticles = [...mockArticles]
    .sort((a, b) => b.views - a.views)
    .slice(0, 5);
  
  // Verificações de integridade
  const articlesWithoutCover = mockArticles.filter(a => !a.coverImage || a.coverImage.includes('placeholder')).length;
  const articlesWithoutExcerpt = mockArticles.filter(a => !a.excerpt || a.excerpt.length < 50).length;
  const articlesWithoutSEO = mockArticles.filter(a => !a.title || !a.excerpt).length;
  
  const alerts = [
    ...(articlesWithoutCover > 0 ? [{ type: 'warning', message: `${articlesWithoutCover} artigos sem imagem de capa` }] : []),
    ...(articlesWithoutExcerpt > 0 ? [{ type: 'warning', message: `${articlesWithoutExcerpt} artigos com excerpt curto` }] : []),
    ...(articlesWithoutSEO > 0 ? [{ type: 'error', message: `${articlesWithoutSEO} artigos com SEO incompleto` }] : []),
  ];

  const stats = [
    { 
      icon: FileText, 
      label: 'Total de Artigos', 
      value: totalArticles,
      color: 'text-[#3b82f6]',
      bg: 'bg-[#dbeafe]',
      href: ROUTES.admin.noticias
    },
    { 
      icon: Users, 
      label: 'Usuários Registrados', 
      value: totalUsers,
      color: 'text-[#22c55e]',
      bg: 'bg-[#dcfce7]',
      href: ROUTES.admin.usuarios
    },
    { 
      icon: MessageSquare, 
      label: 'Comentários', 
      value: totalComments,
      color: 'text-[#8b5cf6]',
      bg: 'bg-[#ede9fe]',
      href: '#'
    },
    { 
      icon: TrendingUp, 
      label: 'Visualizações Totais', 
      value: mockArticles.reduce((acc, a) => acc + a.views, 0).toLocaleString('pt-BR'),
      color: 'text-[#f59e0b]',
      bg: 'bg-[#fef3c7]',
      href: '#'
    },
  ];

  const quickActions = [
    { label: 'Nova Notícia', href: ROUTES.admin.novaNoticia, color: 'bg-[#c40000]' },
    { label: 'Gerenciar Notícias', href: ROUTES.admin.noticias, color: 'bg-[#111111]' },
    { label: 'Gerenciar Usuários', href: ROUTES.admin.usuarios, color: 'bg-[#6b6b6b]' },
    { label: 'Diagnóstico', href: '/admin/diagnostico', color: 'bg-[#22c55e]' },
  ];

  return (
    <>
      <title>Admin - Portal Econômico Mundial</title>

      <main className="max-w-[1280px] mx-auto px-4 py-6 sm:py-8">
        {/* Header */}
        <header className="mb-6 sm:mb-8">
          <section className="flex items-center gap-2 mb-2">
            <Activity className="w-6 h-6 text-[#c40000]" />
            <h1 className="text-2xl sm:text-3xl font-bold text-[#111111]">Painel Administrativo</h1>
          </section>
          <p className="text-sm sm:text-base text-[#6b6b6b]">
            Bem-vindo, {user?.name}. Aqui você gerencia o portal.
          </p>
        </header>

        {/* Alertas */}
        {alerts.length > 0 && (
          <section className="mb-6">
            <h2 className="text-sm font-semibold text-[#111111] mb-3">Alertas do Sistema</h2>
            <ul className="space-y-2">
              {alerts.map((alert, index) => (
                <li key={index}>
                  <aside className={`p-3 rounded-lg flex items-start gap-2 ${
                    alert.type === 'error' ? 'bg-[#fef2f2] border border-[#fecaca]' : 'bg-[#fffbeb] border border-[#fcd34d]'
                  }`}>
                    <AlertTriangle className={`w-5 h-5 flex-shrink-0 ${
                      alert.type === 'error' ? 'text-[#dc2626]' : 'text-[#f59e0b]'
                    }`} />
                    <p className={`text-sm ${alert.type === 'error' ? 'text-[#dc2626]' : 'text-[#92400e]'}`}>
                      {alert.message}
                    </p>
                  </aside>
                </li>
              ))}
            </ul>
          </section>
        )}

        {/* Estatísticas */}
        <section className="mb-6 sm:mb-8">
          <ul className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            {stats.map((stat, index) => (
              <li key={index}>
                <Link to={stat.href}>
                  <article className={`p-4 ${stat.bg} rounded-lg hover:shadow-md transition-shadow`}>
                    <stat.icon className={`w-6 h-6 sm:w-8 sm:h-8 ${stat.color} mb-2`} />
                    <p className="text-xl sm:text-2xl font-bold text-[#111111]">{stat.value}</p>
                    <p className="text-xs sm:text-sm text-[#6b6b6b]">{stat.label}</p>
                  </article>
                </Link>
              </li>
            ))}
          </ul>
        </section>

        <section className="grid grid-cols-1 lg:grid-cols-3 gap-6 sm:gap-8">
          {/* Ações Rápidas */}
          <section className="lg:col-span-1">
            <article className="bg-white border border-[#e5e5e5] rounded-lg p-4 sm:p-6">
              <h2 className="text-lg font-semibold text-[#111111] mb-4">Ações Rápidas</h2>
              <ul className="space-y-2">
                {quickActions.map((action, index) => (
                  <li key={index}>
                    <Link to={action.href}>
                      <Button 
                        className={`w-full ${action.color} hover:opacity-90`}
                      >
                        {action.label}
                      </Button>
                    </Link>
                  </li>
                ))}
              </ul>
            </article>
          </section>

          {/* Artigos Mais Lidos */}
          <section className="lg:col-span-2">
            <article className="bg-white border border-[#e5e5e5] rounded-lg p-4 sm:p-6">
              <header className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-[#111111]">Artigos Mais Lidos</h2>
                <Link 
                  to={ROUTES.admin.noticias}
                  className="text-sm text-[#c40000] hover:underline flex items-center gap-1"
                >
                  Ver todos <ArrowRight className="w-4 h-4" />
                </Link>
              </header>
              
              <ul className="space-y-3">
                {topArticles.map((article, index) => (
                  <li key={article.slug}>
                    <article className="flex items-center justify-between p-3 bg-[#f9fafb] rounded-lg">
                      <section className="flex items-center gap-3">
                        <span className="w-6 h-6 rounded-full bg-[#e5e5e5] flex items-center justify-center text-xs font-semibold text-[#6b6b6b]">
                          {index + 1}
                        </span>
                        <section>
                          <Link 
                            to={`/noticias/${article.slug}`}
                            className="text-sm font-medium text-[#111111] hover:text-[#c40000] transition-colors line-clamp-1"
                          >
                            {article.title}
                          </Link>
                          <p className="text-xs text-[#6b6b6b] capitalize">
                            {article.category} • {article.views.toLocaleString('pt-BR')} visualizações
                          </p>
                        </section>
                      </section>
                      <Link 
                        to={`/admin/noticias/editar/${article.slug}`}
                        className="text-xs text-[#c40000] hover:underline flex-shrink-0"
                      >
                        Editar
                      </Link>
                    </article>
                  </li>
                ))}
              </ul>
            </article>
          </section>
        </section>
      </main>
    </>
  );
}
