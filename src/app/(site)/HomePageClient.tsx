'use client';

/**
 * Home UI (client)
 * Recebe dados pre-carregados no servidor para reduzir custo por visita
 * e permitir ISR/cache.
 */

import { useEffect, useMemo, useState, type FormEvent } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { ArrowRight, TrendingUp, Clock, Zap, Flame, Mail, MessageSquareText } from 'lucide-react';
import { TooltipProvider } from '@/components/ui/tooltip';

import { HeroSection } from '@/components/home/HeroSection';
import type { NewsArticle } from '@/types';
import { AdUnit } from '@/components/ads/AdUnit';
import { AdAboveFold } from '@/components/ads/AdAboveFold';
import { AdSidebar } from '@/components/ads/AdSidebar';
import { AdFeed } from '@/components/ads/AdFeed';
import dynamic from 'next/dynamic';
import { Skeleton } from '@/components/ui/skeleton';
import { EarningsCalendar } from '@/components/economics/EarningsCalendarWrapper';
import { ROUTES, CATEGORIES } from '@/config/routes';
import { CONTENT_CONFIG } from '@/config/content';
import type { EarningsEvent, MarketNews } from '@/services/economics/finnhubService';
import { publicStorage } from '@/config/storage';
import { subscribeNewsletter } from '@/services/newsletterService';

const ADSENSE_SLOT_HOME_INLINE = process.env.NEXT_PUBLIC_ADSENSE_SLOT_INARTICLE;

// Heavy widgets: lazy-load to keep initial JS small.
const TensionMap = dynamic(
  () => import('@/components/geoEcon/TensionMap').then((m) => m.TensionMap),
  { ssr: false, loading: () => <Skeleton className="h-[360px] w-full rounded-lg" /> },
);
const EconomicAgenda = dynamic(
  () => import('@/components/geoEcon/EconomicAgenda').then((m) => m.EconomicAgenda),
  { ssr: false, loading: () => <Skeleton className="h-[260px] w-full rounded-lg" /> },
);
const RiskThermometer = dynamic(
  () => import('@/components/geoEcon/RiskThermometer').then((m) => m.RiskThermometer),
  { ssr: false, loading: () => <Skeleton className="h-[260px] w-full rounded-lg" /> },
);

interface HomePageClientProps {
  featured: NewsArticle[];
  latest: NewsArticle[];
  trending: NewsArticle[];
  breaking: NewsArticle[];
  articlesForCategoryHighlights: NewsArticle[];
  earnings: EarningsEvent[];
  marketNews: MarketNews[];
};

export default function HomePageClient({
  featured,
  latest,
  trending,
  breaking,
  articlesForCategoryHighlights,
  earnings,
  marketNews,
}: HomePageClientProps) {
  const [activeCategory, setActiveCategory] = useState('all');
  const [pollVote, setPollVote] = useState<string | null>(null);
  const [pollSubmitted, setPollSubmitted] = useState(false);
  const [newsletterEmail, setNewsletterEmail] = useState('');
  const [newsletterLoading, setNewsletterLoading] = useState(false);
  const [newsletterFeedback, setNewsletterFeedback] = useState<string | null>(null);
  const [newsletterFeedbackType, setNewsletterFeedbackType] = useState<'success' | 'error' | null>(null);
  const locale = 'pt-BR';

  const pollOptions = useMemo(() => ['Economia', 'Geopolitica', 'Tecnologia'], []);

  useEffect(() => {
    const saved = publicStorage.get<string>('cin_home_poll_vote');
    if (saved) {
      queueMicrotask(() => {
        setPollVote(saved);
        setPollSubmitted(true);
      });
    }
  }, []);

  const filteredArticles =
    activeCategory === 'all' ? latest : latest.filter((a) => a.category === activeCategory);

  const handlePollVote = (value: string) => {
    setPollVote(value);
  };

  const submitPoll = () => {
    if (!pollVote) return;
    publicStorage.set('cin_home_poll_vote', pollVote);
    setPollSubmitted(true);
  };

  const handleNewsletterSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const trimmedEmail = newsletterEmail.trim().toLowerCase();
    if (!trimmedEmail) {
      setNewsletterFeedback('Informe um e-mail valido.');
      setNewsletterFeedbackType('error');
      return;
    }

    setNewsletterLoading(true);
    setNewsletterFeedback(null);
    setNewsletterFeedbackType(null);

    try {
      const result = await subscribeNewsletter({
        email: trimmedEmail,
        source: 'newsletter_home',
        path: typeof window !== 'undefined' ? window.location.pathname : '/',
      });

      if (result.alreadySubscribed) {
        setNewsletterFeedback('Este e-mail ja estava inscrito na newsletter.');
      } else {
        setNewsletterFeedback('Inscricao realizada com sucesso. Confira sua caixa de entrada.');
      }
      setNewsletterFeedbackType('success');
      setNewsletterEmail('');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Erro ao assinar newsletter';
      setNewsletterFeedback(message);
      setNewsletterFeedbackType('error');
    } finally {
      setNewsletterLoading(false);
    }
  };

  const topByCategory = useMemo(() => {
    return CATEGORIES.map((cat) => {
      const items = articlesForCategoryHighlights.filter((a) => a.category === cat.slug).slice(0, 3);
      return { ...cat, items };
    }).filter((cat) => cat.items.length > 0);
  }, [articlesForCategoryHighlights]);

  return (
    <TooltipProvider delayDuration={200}>
      <section className="max-w-[1280px] mx-auto px-4 py-6">
        {/* Breaking News */}
        {breaking.length > 0 && (
          <aside className="mb-8 p-4 bg-[#c40000] text-white rounded-lg">
            <header className="flex items-center gap-2 mb-2">
              <Zap className="w-4 h-4" />
              <span className="text-xs font-bold uppercase">Urgente</span>
              <time className="text-xs opacity-90">
                {new Date(breaking[0].publishedAt).toLocaleTimeString(locale, {
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </time>
            </header>
            <Link
              href={ROUTES.noticia(breaking[0].slug)}
              className="block text-lg md:text-xl font-bold hover:underline"
            >
              {breaking[0].title}
            </Link>
          </aside>
        )}

        {/* Hero Section */}
        {featured[0] && (
          <HeroSection mainArticle={featured[0]} secondaryArticles={featured.slice(1)} />
        )}

        {/* AdAboveFold - Anúncio acima da dobra */}
        <AdAboveFold />

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
          {CATEGORIES.map((cat) => (
            <button
              key={cat.slug}
              onClick={() => setActiveCategory(cat.slug)}
              className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap ${
                activeCategory === cat.slug
                  ? 'bg-[#c40000] text-white'
                  : 'bg-[#f5f5f5] text-[#111111]'
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
              <h3 className="text-lg font-bold">Briefing</h3>
            </header>
            <p className="text-sm text-[#6b6b6b] mb-4">Resumo das principais noticias do dia.</p>
            <ul className="space-y-3">
              {latest.slice(0, 3).map((article) => (
                <li key={article.slug} className="flex items-start gap-2">
                  <span className="mt-1 h-2 w-2 rounded-full bg-[#c40000]" />
                  <Link
                    href={ROUTES.noticia(article.slug)}
                    className="text-sm font-medium text-[#111111] hover:text-[#c40000] line-clamp-2"
                  >
                    {article.title}
                  </Link>
                </li>
              ))}
            </ul>

            <div className="mt-4 pt-4 border-t border-[#e5e5e5]">
              <p className="text-xs font-semibold uppercase text-[#6b6b6b] mb-2">
                Mercado agora
              </p>
              {marketNews.length === 0 ? (
                <p className="text-xs text-[#6b6b6b]">Sem dados no momento.</p>
              ) : (
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
              <h3 className="text-lg font-bold">Newsletter</h3>
            </header>
            <p className="text-sm text-white/80 mb-4">
              Receba as principais noticias no seu email.
            </p>
            <form className="space-y-2" onSubmit={handleNewsletterSubmit}>
              <input
                type="email"
                placeholder="Seu e-mail"
                value={newsletterEmail}
                onChange={(event) => setNewsletterEmail(event.target.value)}
                disabled={newsletterLoading}
                required
                className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded text-sm placeholder:text-white/50 focus:outline-none focus:border-[#c40000]"
              />
              <button
                type="submit"
                disabled={newsletterLoading}
                className="w-full px-4 py-2 bg-[#c40000] hover:bg-[#a00000] text-sm font-medium rounded transition-colors"
              >
                {newsletterLoading ? 'Assinando...' : 'Assinar'}
              </button>
              {newsletterFeedback && (
                <p
                  className={`text-xs ${newsletterFeedbackType === 'error' ? 'text-red-300' : 'text-green-300'}`}
                  role="status"
                >
                  {newsletterFeedback}
                </p>
              )}
            </form>
          </article>

          <article className="p-5 border rounded-xl bg-white">
            <header className="flex items-center gap-2 mb-3">
              <MessageSquareText className="w-5 h-5 text-[#c40000]" />
              <h3 className="text-lg font-bold">Enquete</h3>
            </header>
            <p className="text-sm text-[#6b6b6b] mb-4">Qual tema voce quer ver mais?</p>
            <div className="space-y-2">
              {pollOptions.map((option) => (
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
              {pollSubmitted ? 'Obrigado pelo voto' : 'Enviar voto'}
            </button>
          </article>
        </section>

        {/* Publicidade (Home) */}
        <aside className="my-10 flex justify-center" aria-label="Publicidade">
          <AdUnit slot={ADSENSE_SLOT_HOME_INLINE} format="auto" className="mx-auto" />
        </aside>

        {/* Main Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Articles */}
          <section className="lg:col-span-2">
            <h2 className="text-2xl font-bold mb-6">Ultimas</h2>

            <ul className="space-y-6">
              {filteredArticles.map((article, index) => {
                const category =
                  CONTENT_CONFIG.categories[article.category as keyof typeof CONTENT_CONFIG.categories];
                const date = new Date(article.publishedAt).toLocaleDateString(locale, {
                  day: '2-digit',
                  month: 'short',
                });

                return (
                  <>
                    <li key={article.slug}>
                      <article className="group flex gap-4">
                        <figure className="w-32 h-24 md:w-48 md:h-32 flex-shrink-0 overflow-hidden rounded-lg relative">
                          <Image
                            src={article.coverImage}
                            alt={article.title}
                            fill
                            sizes="(max-width: 768px) 128px, 192px"
                            className="object-cover group-hover:scale-105 transition-transform"
                          />
                        </figure>
                        <div className="flex-1 min-w-0">
                          <span
                            className="text-xs font-semibold uppercase"
                            style={{ color: category?.color || '#6b6b6b' }}
                          >
                            {category?.name || article.category}
                          </span>
                          <Link href={ROUTES.noticia(article.slug)}>
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
                              {article.readingTime} min de leitura
                            </span>
                          </footer>
                        </div>
                      </article>
                    </li>
                    {/* AdFeed - Anúncio entre artigos (a cada 3) */}
                    {(index + 1) % 3 === 0 && (
                      <li key={`ad-${index}`}>
                        <AdFeed className="my-6" />
                      </li>
                    )}
                  </>
                );
              })}
            </ul>

            <div className="mt-8 text-center">
              <Link
                href={ROUTES.categoria('economia')}
                className="inline-flex items-center gap-2 px-6 py-3 border border-[#111111] text-[#111111] font-medium hover:bg-[#111111] hover:text-white transition-colors"
              >
                Ver mais noticias
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </section>

          {/* Sidebar */}
          <aside className="space-y-8">
            {/* AdSidebar - Anúncio na barra lateral */}
            <AdSidebar />
            {/* Trending */}
            <section className="p-6 bg-[#f5f5f5] rounded-lg">
              <header className="flex items-center gap-2 mb-4">
                <TrendingUp className="w-5 h-5 text-[#c40000]" />
                <h3 className="text-lg font-bold">Mais lidas</h3>
              </header>
              <ol className="space-y-4">
                {trending.map((article, index) => (
                  <li key={article.slug}>
                    <Link href={ROUTES.noticia(article.slug)} className="group flex gap-3">
                      <span className="text-2xl font-black text-[#e5e5e5] group-hover:text-[#c40000]">
                        {String(index + 1).padStart(2, '0')}
                      </span>
                      <div className="flex-1 min-w-0">
                        <h4 className="text-sm font-medium text-[#111111] line-clamp-2 group-hover:text-[#c40000]">
                          {article.title}
                        </h4>
                        <span className="text-xs text-[#6b6b6b]">
                          {article.views.toLocaleString(locale)} leituras
                        </span>
                      </div>
                    </Link>
                  </li>
                ))}
              </ol>
            </section>

            {/* Categories */}
            <nav>
              <h3 className="text-lg font-bold mb-4">Explore</h3>
              <ul className="space-y-2">
                {CATEGORIES.map((cat) => {
                  const count = articlesForCategoryHighlights.filter((a) => a.category === cat.slug).length;
                  return (
                    <li key={cat.slug}>
                      <Link
                        href={ROUTES.categoria(cat.slug)}
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
            <h2 className="text-2xl font-bold mb-6">Por categoria</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {topByCategory.map((cat) => (
                <article key={cat.slug} className="border rounded-xl p-4 bg-white">
                  <header className="flex items-center justify-between mb-3">
                    <h3 className="text-lg font-bold">{cat.name}</h3>
                    <Link
                      href={ROUTES.categoria(cat.slug)}
                      className="text-xs text-[#6b6b6b] hover:text-[#c40000]"
                    >
                      Ver tudo
                    </Link>
                  </header>
                  <ul className="space-y-3">
                    {cat.items.map((article) => (
                      <li key={article.slug}>
                        <Link
                          href={ROUTES.noticia(article.slug)}
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
      </section>
    </TooltipProvider>
  );
}

