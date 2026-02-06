import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, TrendingUp, Clock, Zap, Flame, Mail, MessageSquareText } from 'lucide-react';
import { TooltipProvider } from '@/components/ui/tooltip';

import { HeroSection } from '@/components/home/HeroSection';
import type { NewsArticle } from '@/types';
import { TensionMap } from '@/components/geoEcon/TensionMap';
import { EconomicAgenda } from '@/components/geoEcon/EconomicAgenda';
import { RiskThermometer } from '@/components/geoEcon/RiskThermometer';
import { EarningsCalendar } from '@/components/economics/EarningsCalendar';
import { ROUTES, CATEGORIES } from '@/config/routes';
import { APP_CONFIG } from '@/config/app';
import { CONTENT_CONFIG } from '@/config/content';
import {
  getFeaturedArticles,
  getLatestArticles,
  getTrendingArticles,
  getBreakingNews,
  getAllArticles,
} from '@/services/newsManager';
import { useMarketNews } from '@/hooks/economics';
import { getEarningsCalendar } from '@/services/economics/finnhubService';
import type { EarningsEvent } from '@/services/economics/finnhubService';

export function Home() {
  const [activeCategory, setActiveCategory] = useState('all');

  const [featured, setFeatured] = useState<NewsArticle[]>([]);
  const [latest, setLatest] = useState<NewsArticle[]>([]);
  const [trending, setTrending] = useState<NewsArticle[]>([]);
  const [breaking, setBreaking] = useState<NewsArticle[]>([]);
  const [allArticles, setAllArticles] = useState<NewsArticle[]>([]);
  const [earnings, setEarnings] = useState<EarningsEvent[]>([]);
  const [pollVote, setPollVote] = useState<string | null>(null);
  const [pollSubmitted, setPollSubmitted] = useState(false);
  const { news: marketNews, isLoading: marketNewsLoading, error: marketNewsError } = useMarketNews('general');

  useEffect(() => {
    let isMounted = true;

    const load = async () => {
      try {
        // Datas para earnings (hoje até 7 dias)
        const today = new Date().toISOString().split('T')[0];
        const nextWeek = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

        const [
          featuredData,
          latestData,
          trendingData,
          breakingData,
          allData,
          earningsData,
        ] = await Promise.all([
          getFeaturedArticles(3),
          getLatestArticles(12),
          getTrendingArticles(5),
          getBreakingNews(),
          getAllArticles(),
          getEarningsCalendar(today, nextWeek).then(data => data.slice(0, 5)).catch(() => []),
        ]);

        if (!isMounted) return;

        setFeatured(featuredData);
        setLatest(latestData);
        setTrending(trendingData);
        setBreaking(breakingData);
        setAllArticles(allData);
        setEarnings(earningsData);
      } catch (error) {
        // Erro silenciado em produção
        if (import.meta.env.DEV) {
          // eslint-disable-next-line no-console
          console.error('Erro ao carregar notícias:', error);
        }
      }
    };

    load();
    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    const saved = localStorage.getItem('pem_home_poll_vote');
    if (saved) {
      setPollVote(saved);
      setPollSubmitted(true);
    }
  }, []);
  
  const filteredArticles = activeCategory === 'all'
    ? latest
    : latest.filter(a => a.category === activeCategory);

  const handlePollVote = (value: string) => {
    setPollVote(value);
  };

  const submitPoll = () => {
    if (!pollVote) return;
    localStorage.setItem('pem_home_poll_vote', pollVote);
    setPollSubmitted(true);
  };

  const topByCategory = CATEGORIES.map(cat => {
    const items = allArticles.filter(a => a.category === cat.slug).slice(0, 3);
    return { ...cat, items };
  }).filter(cat => cat.items.length > 0);

  return (
    <TooltipProvider delayDuration={200}>
      <title>{APP_CONFIG.brand.name} - {APP_CONFIG.brand.tagline}</title>
      
      <section className="max-w-[1280px] mx-auto px-4 py-6">
        {/* Breaking News */}
        {breaking.length > 0 && (
          <aside className="mb-8 p-4 bg-[#c40000] text-white rounded-lg">
            <header className="flex items-center gap-2 mb-2">
              <Zap className="w-4 h-4" />
              <span className="text-xs font-bold uppercase">Urgente</span>
              <time className="text-xs opacity-90">
                {new Date(breaking[0].publishedAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
              </time>
            </header>
            <Link 
              to={ROUTES.noticia(breaking[0].slug)}
              className="block text-lg md:text-xl font-bold hover:underline"
            >
              {breaking[0].title}
            </Link>
          </aside>
        )}

        {/* Hero Section - Novo Layout Editorial */}
        {featured[0] && (
          <HeroSection 
            mainArticle={featured[0]} 
            secondaryArticles={featured.slice(1)}
          />
        )}

        {/* Category Filter */}
        <div className="flex items-center gap-2 overflow-x-auto py-3 mb-6">
          <button
            onClick={() => setActiveCategory('all')}
            className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap ${
              activeCategory === 'all' ? 'bg-[#c40000] text-white' : 'bg-[#f5f5f5] text-[#111111]'
            }`}
          >
            Todas
          </button>
          {CATEGORIES.map(cat => (
            <button
              key={cat.slug}
              onClick={() => setActiveCategory(cat.slug)}
              className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap ${
                activeCategory === cat.slug ? 'bg-[#c40000] text-white' : 'bg-[#f5f5f5] text-[#111111]'
              }`}
            >
              {cat.name}
            </button>
          ))}
        </div>

        {/* Engagement Row */}
        <section className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-10">
          <article className="p-5 border rounded-xl bg-white">
            <header className="flex items-center gap-2 mb-3">
              <Flame className="w-5 h-5 text-[#c40000]" />
              <h3 className="text-lg font-bold">Briefing de Hoje</h3>
            </header>
            <p className="text-sm text-[#6b6b6b] mb-4">
              Resumo rápido com o que mais importa agora.
            </p>
            <ul className="space-y-3">
              {latest.slice(0, 3).map((article) => (
                <li key={article.slug} className="flex items-start gap-2">
                  <span className="mt-1 h-2 w-2 rounded-full bg-[#c40000]" />
                  <Link
                    to={ROUTES.noticia(article.slug)}
                    className="text-sm font-medium text-[#111111] hover:text-[#c40000] line-clamp-2"
                  >
                    {article.title}
                  </Link>
                </li>
              ))}
            </ul>

            <div className="mt-4 pt-4 border-t border-[#e5e5e5]">
              <p className="text-xs font-semibold uppercase text-[#6b6b6b] mb-2">Mercado agora (Finnhub)</p>
              {marketNewsLoading && (
                <p className="text-xs text-[#6b6b6b]">Carregando destaques...</p>
              )}
              {marketNewsError && !marketNewsLoading && (
                <p className="text-xs text-[#6b6b6b]">Sem dados no momento.</p>
              )}
              {!marketNewsLoading && !marketNewsError && (
                <ul className="space-y-2">
                  {marketNews.slice(0, 3).map((item) => (
                    <li key={item.id} className="text-xs text-[#111111] line-clamp-2">
                      {item.headline}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </article>

          <article className="p-5 border rounded-xl bg-[#111111] text-white">
            <header className="flex items-center gap-2 mb-3">
              <Mail className="w-5 h-5" />
              <h3 className="text-lg font-bold">Newsletter PEM</h3>
            </header>
            <p className="text-sm text-white/80 mb-4">
              Receba análises exclusivas e alertas de mercado.
            </p>
            <form className="space-y-2" onSubmit={(e) => e.preventDefault()}>
              <input
                type="email"
                placeholder="Seu e-mail"
                className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded text-sm placeholder:text-white/50 focus:outline-none focus:border-[#c40000]"
              />
              <button
                type="submit"
                className="w-full px-4 py-2 bg-[#c40000] hover:bg-[#a00000] text-sm font-medium rounded transition-colors"
              >
                Quero receber
              </button>
            </form>
          </article>

          <article className="p-5 border rounded-xl bg-white">
            <header className="flex items-center gap-2 mb-3">
              <MessageSquareText className="w-5 h-5 text-[#c40000]" />
              <h3 className="text-lg font-bold">Enquete Rápida</h3>
            </header>
            <p className="text-sm text-[#6b6b6b] mb-4">
              Qual tema você quer ver mais esta semana?
            </p>
            <div className="space-y-2">
              {['Economia', 'Geopolítica', 'Tecnologia'].map((option) => (
                <button
                  key={option}
                  onClick={() => handlePollVote(option)}
                  className={`w-full text-left px-3 py-2 rounded border text-sm ${
                    pollVote === option ? 'border-[#c40000] text-[#c40000]' : 'border-[#e5e5e5]'
                  }`}
                >
                  {option}
                </button>
              ))}
            </div>
            <button
              onClick={submitPoll}
              disabled={!pollVote || pollSubmitted}
              className="mt-3 w-full px-4 py-2 bg-[#111111] text-white text-sm rounded disabled:opacity-60"
            >
              {pollSubmitted ? 'Obrigado por votar!' : 'Enviar voto'}
            </button>
          </article>
        </section>

        {/* Main Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Articles */}
          <section className="lg:col-span-2">
            <h2 className="text-2xl font-bold mb-6">Últimas Notícias</h2>
            
            <ul className="space-y-6">
              {filteredArticles.map((article) => {
                const category = CONTENT_CONFIG.categories[article.category as keyof typeof CONTENT_CONFIG.categories];
                const date = new Date(article.publishedAt).toLocaleDateString('pt-BR', {
                  day: '2-digit',
                  month: 'short',
                });
                
                return (
                  <li key={article.slug}>
                    <article className="group flex gap-4">
                      <figure className="w-32 h-24 md:w-48 md:h-32 flex-shrink-0 overflow-hidden rounded-lg">
                        <img
                          src={article.coverImage}
                          alt={article.title}
                          loading="lazy"
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                        />
                      </figure>
                      <div className="flex-1 min-w-0">
                        <span 
                          className="text-xs font-semibold uppercase"
                          style={{ color: category?.color || '#6b6b6b' }}
                        >
                          {category?.name || article.category}
                        </span>
                        <Link to={ROUTES.noticia(article.slug)}>
                          <h3 className="text-base md:text-lg font-bold text-[#111111] line-clamp-2 group-hover:text-[#c40000]">
                            {article.title}
                          </h3>
                        </Link>
                        <p className="hidden md:block text-sm text-[#6b6b6b] line-clamp-2 mt-1">
                          {article.excerpt}
                        </p>
                        <footer className="flex items-center gap-3 mt-2 text-xs text-[#6b6b6b]">
                          <time>{date}</time>
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {article.readingTime} min
                          </span>
                        </footer>
                      </div>
                    </article>
                  </li>
                );
              })}
            </ul>

            <div className="mt-8 text-center">
              <Link
                to={ROUTES.categoria('economia')}
                className="inline-flex items-center gap-2 px-6 py-3 border border-[#111111] text-[#111111] font-medium hover:bg-[#111111] hover:text-white transition-colors"
              >
                Ver mais notícias
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </section>

          {/* Sidebar */}
          <aside className="space-y-8">
            {/* Trending */}
            <section className="p-6 bg-[#f5f5f5] rounded-lg">
              <header className="flex items-center gap-2 mb-4">
                <TrendingUp className="w-5 h-5 text-[#c40000]" />
                <h3 className="text-lg font-bold">Mais Lidas</h3>
              </header>
              <ol className="space-y-4">
                {trending.map((article, index) => (
                  <li key={article.slug}>
                    <Link to={ROUTES.noticia(article.slug)} className="group flex gap-3">
                      <span className="text-2xl font-black text-[#e5e5e5] group-hover:text-[#c40000]">
                        {String(index + 1).padStart(2, '0')}
                      </span>
                      <div className="flex-1 min-w-0">
                        <h4 className="text-sm font-medium text-[#111111] line-clamp-2 group-hover:text-[#c40000]">
                          {article.title}
                        </h4>
                        <span className="text-xs text-[#6b6b6b]">
                          {article.views.toLocaleString('pt-BR')} leituras
                        </span>
                      </div>
                    </Link>
                  </li>
                ))}
              </ol>
            </section>

            {/* Categories */}
            <nav>
              <h3 className="text-lg font-bold mb-4">Explorar</h3>
              <ul className="space-y-2">
                {CATEGORIES.map(cat => {
                  const count = allArticles.filter(a => a.category === cat.slug).length;
                  return (
                    <li key={cat.slug}>
                      <Link
                        to={ROUTES.categoria(cat.slug)}
                        className="flex items-center justify-between p-3 bg-white border border-[#e5e5e5] rounded-lg hover:border-[#c40000]"
                      >
                        <span className="font-medium">{cat.name}</span>
                        <span className="text-sm text-[#6b6b6b]">{count}</span>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </nav>

            {/* Earnings da Semana */}
            <EarningsCalendar earnings={earnings} />

            <TensionMap />
            <EconomicAgenda />
            <RiskThermometer />
          </aside>
        </div>

        {/* Destaques por categoria */}
        {topByCategory.length > 0 && (
          <section className="mt-12">
            <h2 className="text-2xl font-bold mb-6">Destaques por Categoria</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {topByCategory.map((cat) => (
                <article key={cat.slug} className="border rounded-xl p-4 bg-white">
                  <header className="flex items-center justify-between mb-3">
                    <h3 className="text-lg font-bold">{cat.name}</h3>
                    <Link to={ROUTES.categoria(cat.slug)} className="text-xs text-[#6b6b6b] hover:text-[#c40000]">
                      Ver tudo
                    </Link>
                  </header>
                  <ul className="space-y-3">
                    {cat.items.map((article) => (
                      <li key={article.slug}>
                        <Link
                          to={ROUTES.noticia(article.slug)}
                          className="text-sm font-medium text-[#111111] hover:text-[#c40000] line-clamp-2"
                        >
                          {article.title}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </article>
              ))}
            </div>
          </section>
        )}

        {/* Adsens e slots de publicidade devem ser inseridos quando estiverem ativos */}
      </section>
    </TooltipProvider>
  );
}
