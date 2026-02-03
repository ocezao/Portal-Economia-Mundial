/**
 * Página Inicial - Otimizada para Retenção
 * Destaques, últimas notícias, personalização e CTAs estratégicos
 */

import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  ArrowRight, 
  TrendingUp, 
  Clock, 
  Zap,
  BookOpen,
  Mail,
  ChevronRight,
  Flame,
  Bookmark,
  Play,
  Eye
} from 'lucide-react';
import { NewsCard } from '@/components/news/NewsCard';
import { TensionMap } from '@/components/geoEcon/TensionMap';
import { EconomicAgenda } from '@/components/geoEcon/EconomicAgenda';
import { RiskThermometer } from '@/components/geoEcon/RiskThermometer';
import { ROUTES, CATEGORIES } from '@/config/routes';
import { APP_CONFIG } from '@/config/app';
import { CONTENT_CONFIG } from '@/config/content';
import { storage } from '@/config/storage';
import { 
  getFeaturedArticles, 
  getLatestArticles, 
  getTrendingArticles, 
  getBreakingNews,
  getAllArticles
} from '@/services/newsManager';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

// Hook para detectar scroll
function useScrollProgress() {
  const [progress, setProgress] = useState(0);
  
  useEffect(() => {
    const handleScroll = () => {
      const windowHeight = window.innerHeight;
      const docHeight = document.documentElement.scrollHeight;
      const scrollTop = window.scrollY;
      const trackLength = docHeight - windowHeight;
      const pct = Math.min((scrollTop / trackLength) * 100, 100);
      setProgress(pct);
    };
    
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);
  
  return progress;
}

export function Home() {
  const navigate = useNavigate();
  const scrollProgress = useScrollProgress();
  const [email, setEmail] = useState('');
  const [showStickyCTA, setShowStickyCTA] = useState(false);
  const [activeCategory, setActiveCategory] = useState('all');
  const [visibleCount, setVisibleCount] = useState(6);
  
  const heroRef = useRef<HTMLDivElement>(null);
  
  // Dados com fallback seguro
  const featured = getFeaturedArticles(3) || [];
  const latest = getLatestArticles(12) || [];
  const trending = getTrendingArticles(5) || [];
  const breaking = getBreakingNews() || [];
  const allArticles = getAllArticles() || [];
  
  // Artigos filtrados por categoria
  const filteredArticles = activeCategory === 'all' 
    ? latest 
    : latest.filter(a => a.category === activeCategory);
  
  // Quick reads (artigos curtos - leitura < 3 min)
  const quickReads = allArticles
    .filter(a => a.readingTime && a.readingTime <= 3)
    .slice(0, 4);
  
  // Mostrar sticky CTA após scroll
  useEffect(() => {
    const handleScroll = () => {
      setShowStickyCTA(window.scrollY > 500);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);
  
  // Verificar se usuário já leu algo (para personalização)
  let personalizedArticles: typeof allArticles = [];
  let recommendedCategory: string | null = null;
  
  try {
    const readingHistory = storage.get<Array<{slug: string; category: string}>>('pem_reading_history') || [];
    recommendedCategory = readingHistory.length > 0 
      ? readingHistory[readingHistory.length - 1].category 
      : null;
    personalizedArticles = recommendedCategory 
      ? allArticles.filter(a => a.category === recommendedCategory).slice(0, 3)
      : [];
  } catch {
    // Ignora erro de storage
  }
  
  const handleNewsletterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      toast.error('Digite seu e-mail');
      return;
    }
    
    try {
      const subscribers = storage.get<string[]>('pem_newsletter_subscribers') || [];
      if (!subscribers.includes(email)) {
        subscribers.push(email);
        storage.set('pem_newsletter_subscribers', subscribers);
        toast.success('Inscrição realizada! Confira seu e-mail.');
        setEmail('');
      } else {
        toast.info('Este e-mail já está inscrito.');
      }
    } catch {
      toast.error('Erro ao salvar inscrição');
    }
  };
  
  const loadMore = () => {
    setVisibleCount(prev => Math.min(prev + 3, filteredArticles.length));
  };

  // Verificação de segurança
  if (!latest || latest.length === 0) {
    return (
      <section className="max-w-[1280px] mx-auto px-4 py-8 text-center">
        <h1 className="text-2xl font-bold mb-4">Carregando...</h1>
        <p className="text-gray-600">Aguarde enquanto carregamos as notícias.</p>
      </section>
    );
  }

  return (
    <>
      {/* SEO Meta */}
      <title>{APP_CONFIG.brand.name} - {APP_CONFIG.brand.tagline}</title>
      <meta name="description" content="Portal de notícias especializado em geopolítica, economia global e tecnologia. Análises aprofundadas e cobertura em tempo real." />
      
      {/* Progress Bar */}
      <div 
        className="fixed top-0 left-0 h-1 bg-[#c40000] z-[300] transition-all duration-150"
        style={{ width: `${scrollProgress}%` }}
      />
      
      {/* Sticky Newsletter CTA */}
      {showStickyCTA && (
        <div className="fixed bottom-0 left-0 right-0 bg-[#111111] text-white p-4 z-[250] animate-in slide-in-from-bottom">
          <div className="max-w-[1280px] mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <Mail className="w-5 h-5 text-[#c40000]" />
              <span className="text-sm">Receba análises exclusivas toda manhã às 7h</span>
            </div>
            <form onSubmit={handleNewsletterSubmit} className="flex gap-2 w-full sm:w-auto">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="seu@email.com"
                className="flex-1 sm:w-64 px-3 py-2 bg-white/10 border border-white/20 rounded text-sm"
              />
              <Button type="submit" className="bg-[#c40000] hover:bg-[#a00000]">
                Inscrever
              </Button>
            </form>
          </div>
        </div>
      )}
      
      <section className="max-w-[1280px] mx-auto px-4 py-6">
        {/* Breaking News Banner */}
        {breaking && breaking.length > 0 && (
          <aside className="mb-8 relative overflow-hidden">
            <div className="absolute inset-0 bg-[#c40000] animate-pulse" />
            <div className="relative p-4 bg-[#c40000] text-white rounded-lg border-2 border-[#c40000]">
              <header className="flex items-center gap-2 mb-2">
                <span className="flex items-center gap-1 px-2 py-0.5 bg-white text-[#c40000] text-xs font-bold uppercase animate-pulse">
                  <Zap className="w-3 h-3" />
                  Urgente
                </span>
                <span className="text-xs opacity-90 flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  {new Date(breaking[0].publishedAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                </span>
              </header>
              <Link 
                to={ROUTES.noticia(breaking[0].slug)}
                className="block text-lg md:text-xl font-bold hover:underline line-clamp-2"
              >
                {breaking[0].title}
              </Link>
              <p className="mt-2 text-sm opacity-90 line-clamp-1">
                {breaking[0].excerpt}
              </p>
            </div>
          </aside>
        )}

        {/* Hero Section */}
        <section ref={heroRef} className="mb-10">
          {featured && featured[0] && (
            <div className="relative">
              <NewsCard article={featured[0]} variant="featured" />
              
              <div className="absolute top-4 left-4 flex gap-2">
                {featured[0].breaking && (
                  <span className="px-2 py-1 bg-[#c40000] text-white text-xs font-bold rounded">
                    BREAKING
                  </span>
                )}
                {featured[0].featured && (
                  <span className="px-2 py-1 bg-[#a16207] text-white text-xs font-bold rounded flex items-center gap-1">
                    <Flame className="w-3 h-3" />
                    DESTAQUE
                  </span>
                )}
              </div>
            </div>
          )}
        </section>

        {/* Secondary Featured */}
        {featured && featured.length > 1 && (
          <section className="mb-12">
            <ul className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {featured.slice(1).map(article => (
                <li key={article.slug}>
                  <NewsCard article={article} variant="default" />
                </li>
              ))}
            </ul>
          </section>
        )}

        {/* Quick Reads */}
        {quickReads.length > 0 && (
          <section className="mb-10 p-6 bg-gradient-to-r from-[#fef2f2] to-white rounded-xl border border-[#fecaca]">
            <header className="flex items-center gap-2 mb-4">
              <BookOpen className="w-5 h-5 text-[#c40000]" />
              <h2 className="text-lg font-bold text-[#111111]">Leitura Rápida</h2>
              <span className="text-xs text-[#6b6b6b]">Artigos de até 3 minutos</span>
            </header>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {quickReads.map(article => {
                const quickCat = CONTENT_CONFIG.categories[article.category as keyof typeof CONTENT_CONFIG.categories];
                return (
                  <Link 
                    key={article.slug}
                    to={ROUTES.noticia(article.slug)}
                    className="group p-4 bg-white rounded-lg border border-[#e5e5e5] hover:border-[#c40000] transition-all hover:shadow-md"
                  >
                    <span className="text-xs text-[#c40000] font-medium">
                      {quickCat?.name || article.category}
                    </span>
                    <h3 className="text-sm font-bold text-[#111111] line-clamp-2 group-hover:text-[#c40000] mt-1">
                      {article.title}
                    </h3>
                    <span className="text-xs text-[#6b6b6b] flex items-center gap-1 mt-2">
                      <Clock className="w-3 h-3" />
                      {article.readingTime} min
                    </span>
                  </Link>
                );
              })}
            </div>
          </section>
        )}

        {/* Seção "Para Você" */}
        {personalizedArticles.length > 0 && (
          <section className="mb-10">
            <header className="flex items-center gap-2 mb-4">
              <Bookmark className="w-5 h-5 text-[#c40000]" />
              <h2 className="text-lg font-bold text-[#111111]">Para Você</h2>
              <span className="text-xs text-[#6b6b6b]">
                Baseado em {CONTENT_CONFIG.categories[recommendedCategory as keyof typeof CONTENT_CONFIG.categories]?.name}
              </span>
            </header>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {personalizedArticles.map(article => (
                <NewsCard key={article.slug} article={article} variant="compact" />
              ))}
            </div>
          </section>
        )}

        {/* CTA Newsletter Principal */}
        <section className="mb-12 p-8 bg-[#111111] text-white rounded-2xl text-center">
          <Mail className="w-12 h-12 text-[#c40000] mx-auto mb-4" />
          <h2 className="text-2xl md:text-3xl font-bold mb-2">
            Análise de Mercado todas as manhãs
          </h2>
          <p className="text-[#9ca3af] mb-6 max-w-md mx-auto">
            +15.000 investidores recebem nossa newsletter diária. 
            Junte-se a eles e tome decisões mais inteligentes.
          </p>
          <form onSubmit={handleNewsletterSubmit} className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Digite seu melhor e-mail"
              className="flex-1 px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder:text-white/50 focus:outline-none focus:border-[#c40000]"
            />
            <Button 
              type="submit" 
              className="bg-[#c40000] hover:bg-[#a00000] px-8 py-3 h-auto"
            >
              Quero Receber
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </form>
          <p className="text-xs text-[#6b6b6b] mt-4">
            Gratuito. Cancele quando quiser.
          </p>
        </section>

        {/* Filtro de Categorias Sticky */}
        <div className="sticky top-16 z-40 bg-white/95 backdrop-blur border-b border-[#e5e5e5] py-3 mb-6 -mx-4 px-4">
          <div className="flex items-center gap-2 overflow-x-auto scrollbar-hide">
            <button
              onClick={() => setActiveCategory('all')}
              className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
                activeCategory === 'all'
                  ? 'bg-[#c40000] text-white'
                  : 'bg-[#f5f5f5] text-[#111111] hover:bg-[#e5e5e5]'
              }`}
            >
              Todas
            </button>
            {CATEGORIES.map(cat => (
              <button
                key={cat.slug}
                onClick={() => setActiveCategory(cat.slug)}
                className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
                  activeCategory === cat.slug
                    ? 'bg-[#c40000] text-white'
                    : 'bg-[#f5f5f5] text-[#111111] hover:bg-[#e5e5e5]'
                }`}
              >
                {cat.name}
              </button>
            ))}
          </div>
        </div>

        {/* Main Content Grid */}
        <section className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Latest News */}
          <section className="lg:col-span-2">
            <header className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-[#111111]">
                {activeCategory === 'all' ? 'Últimas Notícias' : CATEGORIES.find(c => c.slug === activeCategory)?.name}
              </h2>
              <span className="text-sm text-[#6b6b6b]">
                {filteredArticles.length} artigos
              </span>
            </header>
            
            <ul className="space-y-6">
              {filteredArticles.slice(0, visibleCount).map((article, index) => {
                const category = CONTENT_CONFIG.categories[article.category as keyof typeof CONTENT_CONFIG.categories];
                const publishedDate = new Date(article.publishedAt).toLocaleDateString('pt-BR', {
                  day: '2-digit',
                  month: 'short',
                });
                
                return (
                  <li key={article.slug}>
                    {/* Ad a cada 3 artigos */}
                    {index === 3 && (
                      <div className="mb-6 p-4 bg-gradient-to-r from-[#fef2f2] to-[#fff5f5] rounded-lg border border-[#fecaca]">
                        <p className="text-xs text-[#c40000] font-medium mb-1">RECOMENDADO</p>
                        <p className="text-sm text-[#111111] font-medium">
                          Acompanhe os indicadores econômicos em tempo real no nosso dashboard
                        </p>
                        <Button 
                          variant="link" 
                          className="text-[#c40000] p-0 h-auto text-sm"
                          onClick={() => navigate('/app')}
                        >
                          Acessar área do usuário <ChevronRight className="w-4 h-4" />
                        </Button>
                      </div>
                    )}
                    
                    <article className="group flex gap-4">
                      <figure className="w-32 h-24 md:w-48 md:h-32 flex-shrink-0 overflow-hidden rounded-lg">
                        <img
                          src={article.coverImage}
                          alt={article.title}
                          loading="lazy"
                          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                        />
                      </figure>
                      <section className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span 
                            className="text-xs font-semibold uppercase tracking-wider"
                            style={{ color: category?.color || '#6b6b6b' }}
                          >
                            {category?.name || article.category}
                          </span>
                          {article.views > 1000 && (
                            <span className="text-xs text-[#6b6b6b] flex items-center gap-0.5">
                              <Flame className="w-3 h-3 text-orange-500" />
                              {Math.floor(article.views / 1000)}k
                            </span>
                          )}
                        </div>
                        <Link to={ROUTES.noticia(article.slug)}>
                          <h3 className="text-base md:text-lg font-bold text-[#111111] line-clamp-2 group-hover:text-[#c40000] transition-colors">
                            {article.title}
                          </h3>
                        </Link>
                        <p className="hidden md:block text-sm text-[#6b6b6b] line-clamp-2 mt-1">
                          {article.excerpt}
                        </p>
                        <footer className="flex items-center gap-3 mt-2 text-xs text-[#6b6b6b]">
                          <time dateTime={article.publishedAt}>{publishedDate}</time>
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {article.readingTime} min
                          </span>
                          <span className="flex items-center gap-1">
                            <Eye className="w-3 h-3" />
                            {article.views.toLocaleString('pt-BR')}
                          </span>
                        </footer>
                      </section>
                    </article>
                  </li>
                );
              })}
            </ul>

            {/* Load More */}
            {visibleCount < filteredArticles.length && (
              <footer className="mt-8 text-center">
                <Button
                  onClick={loadMore}
                  variant="outline"
                  className="px-8 py-3 h-auto"
                >
                  Carregar mais ({filteredArticles.length - visibleCount} restantes)
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </footer>
            )}
          </section>

          {/* Sidebar */}
          <aside className="space-y-8">
            {/* Trending */}
            <section className="p-6 bg-[#f5f5f5] rounded-lg">
              <header className="flex items-center gap-2 mb-4">
                <TrendingUp className="w-5 h-5 text-[#c40000]" />
                <h3 className="text-lg font-bold text-[#111111]">Mais Lidas</h3>
              </header>
              <ol className="space-y-4">
                {trending.map((article, index) => (
                  <li key={article.slug}>
                    <article className="group flex gap-3">
                      <span className={`text-2xl font-black transition-colors ${
                        index < 3 ? 'text-[#c40000]' : 'text-[#e5e5e5]'
                      } group-hover:text-[#c40000]`}>
                        {String(index + 1).padStart(2, '0')}
                      </span>
                      <section className="flex-1 min-w-0">
                        <Link to={ROUTES.noticia(article.slug)}>
                          <h4 className="text-sm font-medium text-[#111111] line-clamp-2 group-hover:text-[#c40000] transition-colors">
                            {article.title}
                          </h4>
                        </Link>
                        <span className="text-xs text-[#6b6b6b]">
                          {article.views.toLocaleString('pt-BR')} leituras
                        </span>
                      </section>
                    </article>
                  </li>
                ))}
              </ol>
            </section>

            {/* Video Teaser */}
            <section className="p-6 bg-[#111111] text-white rounded-lg">
              <div className="flex items-center gap-2 mb-3">
                <Play className="w-5 h-5 text-[#c40000]" />
                <h3 className="text-lg font-bold">Vídeos</h3>
              </div>
              <p className="text-sm text-[#9ca3af] mb-4">
                Análises em vídeo dos nossos especialistas
              </p>
              <div className="aspect-video bg-[#222] rounded-lg flex items-center justify-center mb-3">
                <div className="w-12 h-12 rounded-full bg-[#c40000] flex items-center justify-center">
                  <Play className="w-5 h-5 text-white ml-0.5" />
                </div>
              </div>
              <p className="text-sm font-medium">Em breve: Análise Semanal</p>
            </section>

            {/* Categories */}
            <nav aria-label="Categorias">
              <h3 className="text-lg font-bold text-[#111111] mb-4">Explorar</h3>
              <ul className="space-y-2">
                {CATEGORIES.map(cat => {
                  const count = allArticles.filter(a => a.category === cat.slug).length;
                  return (
                    <li key={cat.slug}>
                      <Link
                        to={ROUTES.categoria(cat.slug)}
                        className="flex items-center justify-between p-3 bg-white border border-[#e5e5e5] rounded-lg hover:border-[#c40000] transition-colors group"
                      >
                        <span className="font-medium text-[#111111] group-hover:text-[#c40000]">
                          {cat.name}
                        </span>
                        <span className="text-sm text-[#6b6b6b]">{count}</span>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </nav>

            {/* Módulos Geo/Econômicos */}
            <TensionMap />
            <EconomicAgenda />
            <RiskThermometer />
          </aside>
        </section>
      </section>
    </>
  );
}
