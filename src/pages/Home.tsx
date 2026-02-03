/**
 * Página Inicial
 * Destaques, últimas notícias e trending
 */

import { Link } from 'react-router-dom';
import { ArrowRight, TrendingUp, Clock } from 'lucide-react';
import { NewsCard } from '@/components/news/NewsCard';
import { TensionMap } from '@/components/geoEcon/TensionMap';
import { EconomicAgenda } from '@/components/geoEcon/EconomicAgenda';
import { RiskThermometer } from '@/components/geoEcon/RiskThermometer';
import { EconomicComparator } from '@/components/geoEcon/EconomicComparator';
import { ROUTES, CATEGORIES } from '@/config/routes';
import { APP_CONFIG } from '@/config/app';
import { CONTENT_CONFIG } from '@/config/content';
import { getFeaturedArticles, getLatestArticles, getTrendingArticles, getBreakingNews } from '@/services/newsManager';

export function Home() {
  const featured = getFeaturedArticles(3);
  const latest = getLatestArticles(6);
  const trending = getTrendingArticles(5);
  const breaking = getBreakingNews();

  return (
    <>
      {/* SEO Meta */}
      <title>{APP_CONFIG.brand.name} - {APP_CONFIG.brand.tagline}</title>
      <meta name="description" content="Portal de notícias especializado em geopolítica, economia global e tecnologia. Análises aprofundadas e cobertura em tempo real." />
      
      <section className="max-w-[1280px] mx-auto px-4 py-8">
        {/* Breaking News Banner */}
        {breaking.length > 0 && (
          <aside className="mb-8 p-4 bg-[#c40000] text-white rounded-lg">
            <header className="flex items-center gap-2 mb-2">
              <span className="px-2 py-0.5 bg-white text-[#c40000] text-xs font-bold uppercase">
                Urgente
              </span>
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

        {/* Hero Section - Featured Article */}
        {featured[0] && (
          <section className="mb-12">
            <NewsCard article={featured[0]} variant="featured" />
          </section>
        )}

        {/* Secondary Featured */}
        {featured.length > 1 && (
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

        {/* Main Content Grid */}
        <section className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Latest News - 2/3 */}
          <section className="lg:col-span-2">
            <header className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-[#111111]">Últimas Notícias</h2>
            </header>
            
            <ul className="space-y-6">
              {latest.map(article => {
                const category = CONTENT_CONFIG.categories[article.category];
                const publishedDate = new Date(article.publishedAt).toLocaleDateString('pt-BR', {
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
                          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                        />
                      </figure>
                      <section className="flex-1 min-w-0">
                        <span 
                          className="text-xs font-semibold uppercase tracking-wider"
                          style={{ color: category.color }}
                        >
                          {category.name}
                        </span>
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
                        </footer>
                      </section>
                    </article>
                  </li>
                );
              })}
            </ul>

            {/* Load More */}
            <footer className="mt-8 text-center">
              <Link
                to={ROUTES.categoria('economia')}
                className="inline-flex items-center gap-2 px-6 py-3 border border-[#111111] text-[#111111] font-medium hover:bg-[#111111] hover:text-white transition-colors"
              >
                Ver mais notícias
                <ArrowRight className="w-4 h-4" />
              </Link>
            </footer>
          </section>

          {/* Sidebar - 1/3 */}
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
                      <span className="text-2xl font-black text-[#e5e5e5] group-hover:text-[#c40000] transition-colors">
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

            {/* Categories */}
            <nav aria-label="Categorias">
              <h3 className="text-lg font-bold text-[#111111] mb-4">Categorias</h3>
              <ul className="space-y-2">
                {CATEGORIES.map(cat => {
                  const count = latest.filter(a => a.category === cat.slug).length;
                  return (
                    <li key={cat.slug}>
                      <Link
                        to={ROUTES.categoria(cat.slug)}
                        className="flex items-center justify-between p-3 bg-white border border-[#e5e5e5] rounded-lg hover:border-[#c40000] transition-colors"
                      >
                        <span className="font-medium text-[#111111]">{cat.name}</span>
                        <span className="text-sm text-[#6b6b6b]">{count} artigos</span>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </nav>

            {/* Newsletter */}
            <section className="p-6 bg-[#111111] text-white rounded-lg">
              <h3 className="text-lg font-bold mb-2">Newsletter PEM</h3>
              <p className="text-sm text-[#9ca3af] mb-4">
                Receba as principais notícias diretamente no seu e-mail.
              </p>
              <form className="space-y-2" onSubmit={(e) => e.preventDefault()}>
                <input
                  type="email"
                  placeholder="Seu e-mail"
                  className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded text-sm placeholder:text-white/50 focus:outline-none focus:border-[#c40000]"
                />
                <button
                  type="submit"
                  className="w-full px-4 py-2 bg-[#c40000] hover:bg-[#a00000] text-sm font-medium rounded transition-colors tap-feedback"
                >
                  Inscrever-se
                </button>
              </form>
            </section>

            {/* Módulos Geo/Econômicos */}
            <TensionMap />
            <EconomicAgenda />
            <RiskThermometer />
            <EconomicComparator />
          </aside>
        </section>
      </section>
    </>
  );
}
