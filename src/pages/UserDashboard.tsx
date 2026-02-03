/**
 * Dashboard do Usuário - Página Principal
 * Visão geral com estatísticas e recomendações
 */

import { Link } from 'react-router-dom';
import { 
  BookOpen, 
  Clock, 
  Bookmark, 
  MessageSquare, 
  User, 
  Settings, 
  Heart,
  ArrowRight,
  Calendar
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { storage } from '@/config/storage';
import { ROUTES } from '@/config/routes';
import { mockArticles } from '@/services/newsService';
import { NewsCard } from '@/components/news/NewsCard';
import { Button } from '@/components/ui/button';

export function UserDashboard() {
  const { user } = useAuth();
  
  // Estatísticas
  const bookmarks = storage.getBookmarks();
  const readingHistory = storage.getReadingHistory();
  const dailyStats = storage.getDailyStats();
  const comments = storage.get<Array<{ articleSlug: string }>>('pem_comments') || [];
  const userComments = comments.filter(c => readingHistory.some(h => h.articleSlug === c.articleSlug));
  
  // Recomendações baseadas em preferências
  const userPrefs = user?.preferences;
  const recommendedArticles = mockArticles
    .filter(article => {
      if (!userPrefs?.categories?.length) return true;
      return userPrefs.categories.includes(article.category);
    })
    .slice(0, 3);

  const stats = [
    { 
      icon: BookOpen, 
      label: 'Lidos hoje', 
      value: dailyStats.articlesRead,
      color: 'text-[#22c55e]',
      bg: 'bg-[#dcfce7]'
    },
    { 
      icon: Clock, 
      label: 'Tempo de leitura', 
      value: `${Math.floor(dailyStats.timeSpent / 60)}h ${dailyStats.timeSpent % 60}m`,
      color: 'text-[#3b82f6]',
      bg: 'bg-[#dbeafe]'
    },
    { 
      icon: Bookmark, 
      label: 'Favoritos', 
      value: bookmarks.length,
      color: 'text-[#f59e0b]',
      bg: 'bg-[#fef3c7]'
    },
    { 
      icon: MessageSquare, 
      label: 'Comentários', 
      value: userComments.length,
      color: 'text-[#8b5cf6]',
      bg: 'bg-[#ede9fe]'
    },
  ];

  const quickActions = [
    { icon: User, label: 'Meu Perfil', href: ROUTES.app.perfil, color: 'text-[#111111]' },
    { icon: Heart, label: 'Preferências', href: ROUTES.app.preferencias, color: 'text-[#c40000]' },
    { icon: Settings, label: 'Configurações', href: ROUTES.app.configuracoes, color: 'text-[#6b6b6b]' },
  ];

  return (
    <>
      <title>Minha Conta - Portal Econômico Mundial</title>

      <main className="max-w-[1280px] mx-auto px-4 py-6 sm:py-8">
        {/* Header */}
        <header className="mb-6 sm:mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-[#111111]">
            Olá, {user?.name.split(' ')[0]}!
          </h1>
          <p className="text-sm sm:text-base text-[#6b6b6b] mt-1">
            Bem-vindo à sua área pessoal
          </p>
        </header>

        {/* Estatísticas */}
        <section className="mb-6 sm:mb-8">
          <ul className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            {stats.map((stat, index) => (
              <li key={index}>
                <article className={`p-3 sm:p-4 ${stat.bg} rounded-lg`}>
                  <stat.icon className={`w-6 h-6 sm:w-8 sm:h-8 ${stat.color} mb-2`} />
                  <p className="text-xl sm:text-2xl font-bold text-[#111111]">{stat.value}</p>
                  <p className="text-xs sm:text-sm text-[#6b6b6b]">{stat.label}</p>
                </article>
              </li>
            ))}
          </ul>
        </section>

        <section className="grid grid-cols-1 lg:grid-cols-3 gap-6 sm:gap-8">
          {/* Coluna Principal */}
          <section className="lg:col-span-2 space-y-6 sm:space-y-8">
            {/* Recomendações */}
            <section>
              <header className="flex items-center justify-between mb-4">
                <h2 className="text-lg sm:text-xl font-bold text-[#111111]">
                  Recomendado para você
                </h2>
                <Link 
                  to={ROUTES.home}
                  className="text-sm text-[#c40000] hover:underline flex items-center gap-1"
                >
                  Ver mais <ArrowRight className="w-4 h-4" />
                </Link>
              </header>
              
              {recommendedArticles.length > 0 ? (
                <ul className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {recommendedArticles.map(article => (
                    <li key={article.slug}>
                      <NewsCard article={article} variant="compact" />
                    </li>
                  ))}
                </ul>
              ) : (
                <section className="p-6 bg-[#f5f5f5] rounded-lg text-center">
                  <p className="text-[#6b6b6b]">
                    Configure suas preferências para receber recomendações personalizadas.
                  </p>
                  <Link to={ROUTES.app.preferencias}>
                    <Button className="mt-4 bg-[#c40000] hover:bg-[#a00000]">
                      Configurar preferências
                    </Button>
                  </Link>
                </section>
              )}
            </section>

            {/* Atividades Recentes */}
            <section>
              <h2 className="text-lg sm:text-xl font-bold text-[#111111] mb-4">
                Atividades Recentes
              </h2>
              
              {readingHistory.length > 0 ? (
                <ul className="space-y-3">
                  {readingHistory.slice(0, 5).map((entry, index) => (
                    <li key={index}>
                      <article className="flex items-center justify-between p-3 bg-white border border-[#e5e5e5] rounded-lg hover:border-[#c40000] transition-colors">
                        <section className="flex-1 min-w-0">
                          <Link 
                            to={`/noticias/${entry.articleSlug}`}
                            className="font-medium text-[#111111] hover:text-[#c40000] transition-colors truncate block"
                          >
                            {entry.title}
                          </Link>
                          <p className="text-xs text-[#6b6b6b] flex items-center gap-2 mt-1">
                            <Calendar className="w-3 h-3" />
                            {new Date(entry.readAt).toLocaleDateString('pt-BR')}
                            <span className="capitalize">• {entry.category}</span>
                          </p>
                        </section>
                      </article>
                    </li>
                  ))}
                </ul>
              ) : (
                <section className="p-6 bg-[#f5f5f5] rounded-lg text-center">
                  <p className="text-[#6b6b6b]">Você ainda não leu nenhum artigo.</p>
                  <Link to={ROUTES.home}>
                    <Button className="mt-4 bg-[#c40000] hover:bg-[#a00000]">
                      Explorar notícias
                    </Button>
                  </Link>
                </section>
              )}
            </section>
          </section>

          {/* Sidebar */}
          <aside className="space-y-6">
            {/* Ações Rápidas */}
            <section className="bg-white border border-[#e5e5e5] rounded-lg p-4 sm:p-6">
              <h3 className="font-bold text-[#111111] mb-4">Ações Rápidas</h3>
              <nav>
                <ul className="space-y-2">
                  {quickActions.map((action, index) => (
                    <li key={index}>
                      <Link
                        to={action.href}
                        className="flex items-center gap-3 p-3 rounded-lg hover:bg-[#f5f5f5] transition-colors tap-feedback"
                      >
                        <action.icon className={`w-5 h-5 ${action.color}`} />
                        <span className="text-[#111111]">{action.label}</span>
                        <ArrowRight className="w-4 h-4 text-[#6b6b6b] ml-auto" />
                      </Link>
                    </li>
                  ))}
                </ul>
              </nav>
            </section>

            {/* Favoritos Recentes */}
            <section className="bg-white border border-[#e5e5e5] rounded-lg p-4 sm:p-6">
              <header className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-[#111111]">Favoritos Recentes</h3>
                {bookmarks.length > 0 && (
                  <span className="text-xs text-[#6b6b6b]">{bookmarks.length} total</span>
                )}
              </header>
              
              {bookmarks.length > 0 ? (
                <ul className="space-y-3">
                  {bookmarks.slice(0, 3).map((bookmark, index) => (
                    <li key={index}>
                      <Link 
                        to={`/noticias/${bookmark.articleSlug}`}
                        className="block p-2 rounded hover:bg-[#f5f5f5] transition-colors"
                      >
                        <p className="text-sm text-[#111111] line-clamp-2">{bookmark.title}</p>
                        <p className="text-xs text-[#6b6b6b] mt-1 capitalize">{bookmark.category}</p>
                      </Link>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-[#6b6b6b]">Nenhum favorito ainda.</p>
              )}
            </section>

            {/* Newsletter */}
            <section className="bg-[#111111] text-white rounded-lg p-4 sm:p-6">
              <h3 className="font-bold mb-2">Newsletter PEM</h3>
              <p className="text-sm text-[#9ca3af] mb-4">
                Receba análises exclusivas no seu e-mail.
              </p>
              <Button className="w-full bg-[#c40000] hover:bg-[#a00000]">
                Gerenciar inscrição
              </Button>
            </section>
          </aside>
        </section>
      </main>
    </>
  );
}
