/**
 * Página de Artigo Individual (UI)
 * O artigo é carregado no servidor e passado como props para melhorar SEO.
 */

'use client';

import Link from 'next/link';
import {
  Clock,
  Calendar,
  User,
  Bookmark,
  Facebook,
  Twitter,
  Linkedin,
  Link as LinkIcon,
  AlertTriangle,
  TrendingUp,
  BookOpen,
  FileText,
  Gem,
} from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { FactCheckBadge, ReviewedByBadge } from '@/components/news/FactCheckBadge';
import { ReadingProgress } from '@/components/news/ReadingProgress';
import { ArticleContent } from '@/components/news/ArticleContent';
import { RelatedArticles } from '@/components/news/RelatedArticles';
import { CommentSection } from '@/components/interactive/CommentSection';
import { CONTENT_CONFIG } from '@/config/content';
import { useAuth } from '@/hooks/useAuth';
import { useBookmarks } from '@/hooks/useBookmarks';
import type { NewsArticle } from '@/types';

type NoticiaPageClientProps = {
  article: NewsArticle;
  reviewedBy?: { name: string; slug: string } | null;
};

export default function NoticiaPageClient({ article, reviewedBy }: NoticiaPageClientProps) {
  const { isAuthenticated: isLoggedIn } = useAuth();
  const { isBookmarked, toggleBookmark } = useBookmarks();
  const bookmarked = isBookmarked(article.slug);

  const category =
    (CONTENT_CONFIG.categories as Record<string, { name: string; color: string; description: string }>)[
      article.category
    ] ?? { name: article.category, color: '#6b6b6b', description: '' };

  const publishedDate = new Date(article.publishedAt).toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  });

  const updatedDate = new Date(article.updatedAt).toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  });

  // Mock data para módulos contextuais
  const contexto = article.excerpt;

  const impacto = [
    'Mercados financeiros reagem com volatilidade aumentada',
    'Política monetária pode sofrer ajustes nos próximos meses',
    'Investidores devem monitorar indicadores de perto',
  ];

  const timeline = [
    { date: article.publishedAt, evento: 'Publicação original' },
    { date: article.updatedAt, evento: 'Atualização com novos dados' },
  ];

  const termosChave = article.tags.slice(0, 5).map((tag) => ({
    termo: tag,
    definicao: `Termo relacionado a ${category.name.toLowerCase()} mencionado neste artigo.`,
  }));

  const fontes = [
    'Agências de notícias internacionais',
    'Relatórios oficiais de instituições financeiras',
    'Análises de especialistas do setor',
  ];

  const handleShare = (platform: string) => {
    const url =
      typeof window !== 'undefined'
        ? `${window.location.origin}/noticias/${article.slug}/`
        : `/noticias/${article.slug}/`;

    const text = encodeURIComponent(article.title);

    let shareUrl = '';
    switch (platform) {
      case 'twitter':
        shareUrl = `https://twitter.com/intent/tweet?url=${encodeURIComponent(url)}&text=${text}`;
        break;
      case 'facebook':
        shareUrl = `https://facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`;
        break;
      case 'linkedin':
        shareUrl = `https://linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`;
        break;
      default:
        navigator.clipboard.writeText(url);
        toast.success('Link copiado para a área de transferência!');
        return;
    }

    window.open(shareUrl, '_blank', 'width=600,height=400');
  };

  const handleBookmark = () => {
    toggleBookmark({
      articleSlug: article.slug,
      title: article.title,
      category: article.category,
      excerpt: article.excerpt,
      coverImage: article.coverImage,
    });

    if (bookmarked) {
      toast.success('Removido dos favoritos');
    } else {
      toast.success('Adicionado aos favoritos');
    }
  };

  return (
    <>
      {/* Progress Bar */}
      <ReadingProgress articleSlug={article.slug} />

      {/* Breadcrumb */}
      <nav aria-label="Breadcrumb" className="max-w-[1280px] mx-auto px-4 pt-4">
        <ol className="flex items-center gap-2 text-sm text-[#6b6b6b]">
          <li>
            <Link href="/" className="hover:text-[#c40000]">
              Home
            </Link>
          </li>
          <li aria-hidden="true">/</li>
          <li>
            <Link href={`/categoria/${article.category}/`} className="hover:text-[#c40000]">
              {category.name}
            </Link>
          </li>
          <li aria-hidden="true">/</li>
          <li className="text-[#111111] truncate max-w-[200px]" aria-current="page">
            {article.title}
          </li>
        </ol>
      </nav>

      <main className="max-w-[1280px] mx-auto px-4 py-8">
        <section className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Conteúdo Principal */}
          <article className="lg:col-span-2">
            {/* Header */}
            <header className="mb-8">
              {/* Badges de Verificação */}
              <div className="flex flex-wrap items-center gap-2 mb-4">
                <span
                  className="inline-block px-3 py-1 text-xs font-bold uppercase tracking-wider text-white rounded"
                  style={{ backgroundColor: category.color }}
                >
                  {category.name}
                </span>
                
                {/* Badges E-E-A-T */}
                {article.breaking ? (
                  <FactCheckBadge status="breaking" />
                ) : (
                  <FactCheckBadge status="verified" />
                )}
                
                {article.updatedAt !== article.publishedAt && (
                  <FactCheckBadge status="updated" />
                )}
                
                {article.tags?.includes('Publicação Patrocinada') && (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 text-xs font-bold uppercase tracking-wider text-amber-800 bg-gradient-to-r from-amber-100 to-yellow-100 rounded-full border border-amber-200">
                    <Gem className="w-3.5 h-3.5" />
                    Publicação Patrocinada
                  </span>
                )}
              </div>

              {/* Título com classe para Speakable */}
              <h1 className="article-headline text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-[#111111] leading-tight mb-4">
                {article.title}
              </h1>
              
              {/* ReviewedBy Badge */}
              {reviewedBy && (
                <ReviewedByBadge
                  reviewerName={reviewedBy.name}
                  reviewerSlug={reviewedBy.slug}
                  reviewDate={article.updatedAt}
                  className="mb-4"
                />
              )}

              <p className="article-summary text-base sm:text-lg md:text-xl text-[#6b6b6b] leading-relaxed mb-6">
                {article.excerpt}
              </p>

              <section className="flex flex-wrap items-center gap-3 sm:gap-4 text-xs sm:text-sm text-[#6b6b6b] border-y border-[#e5e5e5] py-4">
                <span className="flex items-center gap-1.5 sm:gap-2">
                  <User className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                  {article.author}
                </span>
                <span className="flex items-center gap-1.5 sm:gap-2">
                  <Calendar className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                  <time dateTime={article.publishedAt}>{publishedDate}</time>
                </span>
                <span className="flex items-center gap-1.5 sm:gap-2">
                  <Clock className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                  {article.readingTime} min
                </span>
                {article.updatedAt !== article.publishedAt && (
                  <span className="text-xs">
                    Atualizado: <time dateTime={article.updatedAt}>{updatedDate}</time>
                  </span>
                )}
              </section>
            </header>

            {/* Cover Image */}
            <figure className="mb-8">
              <img
                src={article.coverImage}
                alt={article.title}
                className="w-full aspect-video object-cover rounded-lg"
                loading="eager"
              />
            </figure>

            {/* Actions */}
            <section className="flex items-center justify-between mb-8 pb-8 border-b border-[#e5e5e5]">
              <section className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleBookmark}
                  className={bookmarked ? 'bg-[#c40000] text-white border-[#c40000]' : ''}
                >
                  <Bookmark className={`w-4 h-4 mr-2 ${bookmarked ? 'fill-current' : ''}`} />
                  <span className="hidden sm:inline">{bookmarked ? 'Salvo' : 'Salvar'}</span>
                </Button>
              </section>

              <nav aria-label="Compartilhar">
                <ul className="flex items-center gap-1 sm:gap-2">
                  {['twitter', 'facebook', 'linkedin', 'copy'].map((platform) => (
                    <li key={platform}>
                      <button
                        onClick={() => handleShare(platform)}
                        className="p-2 rounded-full hover:bg-[#f5f5f5] transition-colors tap-feedback"
                        aria-label={`Compartilhar ${platform}`}
                      >
                        {platform === 'twitter' && <Twitter className="w-4 h-4 sm:w-5 sm:h-5 text-[#6b6b6b]" />}
                        {platform === 'facebook' && <Facebook className="w-4 h-4 sm:w-5 sm:h-5 text-[#6b6b6b]" />}
                        {platform === 'linkedin' && <Linkedin className="w-4 h-4 sm:w-5 sm:h-5 text-[#6b6b6b]" />}
                        {platform === 'copy' && <LinkIcon className="w-4 h-4 sm:w-5 sm:h-5 text-[#6b6b6b]" />}
                      </button>
                    </li>
                  ))}
                </ul>
              </nav>
            </section>

            {/* Módulo: Contexto */}
            <aside className="mb-8 p-4 sm:p-6 bg-[#f8fafc] border-l-4 border-[#c40000] rounded-r-lg">
              <header className="flex items-center gap-2 mb-3">
                <BookOpen className="w-5 h-5 text-[#c40000]" />
                <h2 className="text-lg font-bold text-[#111111]">Contexto</h2>
              </header>
              <p className="text-sm sm:text-base text-[#6b6b6b] leading-relaxed">{contexto}</p>
            </aside>

            {/* Conteúdo Principal */}
            <ArticleContent article={article} isLoggedIn={isLoggedIn} />

            {/* Módulo: Impacto */}
            <aside className="my-8 p-4 sm:p-6 bg-[#fefce8] border border-[#fde047] rounded-lg">
              <header className="flex items-center gap-2 mb-4">
                <TrendingUp className="w-5 h-5 text-[#ca8a04]" />
                <h2 className="text-lg font-bold text-[#111111]">Impacto</h2>
              </header>
              <ul className="space-y-2">
                {impacto.map((item, index) => (
                  <li key={index} className="flex items-start gap-2 text-sm sm:text-base text-[#713f12]">
                    <span className="text-[#ca8a04] mt-1">•</span>
                    {item}
                  </li>
                ))}
              </ul>
            </aside>

            {/* Módulo: Linha do Tempo */}
            <aside className="my-8">
              <h2 className="text-lg font-bold text-[#111111] mb-4">Linha do Tempo</h2>
              <ul className="space-y-3">
                {timeline.map((item, index) => (
                  <li key={index} className="flex items-start gap-3">
                    <time
                      dateTime={item.date}
                      className="text-xs sm:text-sm text-[#6b6b6b] min-w-[100px] sm:min-w-[140px]"
                    >
                      {new Date(item.date).toLocaleDateString('pt-BR', {
                        day: '2-digit',
                        month: 'short',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </time>
                    <span className="text-sm sm:text-base text-[#111111]">{item.evento}</span>
                  </li>
                ))}
              </ul>
            </aside>

            {/* Módulo: Termos-chave */}
            <aside className="my-8">
              <h2 className="text-lg font-bold text-[#111111] mb-4">Termos-chave</h2>
              <dl className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {termosChave.map((item, index) => (
                  <section key={index} className="p-3 bg-[#f5f5f5] rounded-lg">
                    <dt className="font-semibold text-[#111111] text-sm">{item.termo}</dt>
                    <dd className="text-xs text-[#6b6b6b] mt-1">{item.definicao}</dd>
                  </section>
                ))}
              </dl>
            </aside>

            {/* Módulo: Fontes */}
            <aside className="my-8 p-4 bg-[#f8fafc] rounded-lg">
              <header className="flex items-center gap-2 mb-3">
                <FileText className="w-4 h-4 text-[#6b6b6b]" />
                <h2 className="text-sm font-semibold text-[#111111]">Fontes</h2>
              </header>
              <ul className="space-y-1">
                {fontes.map((fonte, index) => (
                  <li key={index} className="text-xs text-[#6b6b6b]">
                    • {fonte}
                  </li>
                ))}
              </ul>
            </aside>

            {/* Tags */}
            <footer className="mt-8 pt-8 border-t border-[#e5e5e5]">
              <h3 className="text-sm font-semibold text-[#111111] mb-3">Tags:</h3>
              <ul className="flex flex-wrap gap-2">
                {article.tags.map((tag) => (
                  <li key={tag}>
                    <span className="px-3 py-1 bg-[#f5f5f5] text-xs sm:text-sm text-[#6b6b6b] rounded-full">
                      {tag}
                    </span>
                  </li>
                ))}
              </ul>
            </footer>

            {/* Related Articles */}
            <RelatedArticles currentArticle={article} limit={4} />

            {/* Comentários */}
            <CommentSection articleSlug={article.slug} />
          </article>

          {/* Sidebar */}
          <aside className="lg:col-span-1 space-y-6">
            {/* Newsletter */}
            <section className="p-4 sm:p-6 bg-[#111111] text-white rounded-lg">
              <h3 className="text-lg font-bold mb-2">Newsletter PEM</h3>
              <p className="text-sm text-[#9ca3af] mb-4">
                Receba análises exclusivas diretamente no seu e-mail.
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

            {/* Aviso */}
            <section className="p-4 bg-[#fef2f2] border border-[#fecaca] rounded-lg">
              <header className="flex items-center gap-2 mb-2">
                <AlertTriangle className="w-4 h-4 text-[#dc2626]" />
                <h3 className="text-sm font-semibold text-[#dc2626]">Aviso</h3>
              </header>
              <p className="text-xs text-[#7f1d1d]">
                Este conteúdo é informativo e não constitui recomendação de investimento.
              </p>
            </section>
          </aside>
        </section>
      </main>
    </>
  );
}

