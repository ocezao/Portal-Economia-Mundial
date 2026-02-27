/**
 * PÃ¡gina de Artigo Individual (UI)
 * O artigo Ã© carregado no servidor e passado como props para melhorar SEO.
 */

'use client';

import Image from 'next/image';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import {
  Clock,
  Calendar,
  User,
  Bookmark,
  Facebook,
  Twitter,
  Linkedin,
  Link as LinkIcon,
  ShieldCheck,
  ExternalLink,
  Gem,
} from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { FactCheckBadge, ReviewedByBadge } from '@/components/news/FactCheckBadge';
import { ReadingProgress } from '@/components/news/ReadingProgress';
import { ArticleContent } from '@/components/news/ArticleContent';
import { RelatedArticles } from '@/components/news/RelatedArticles';
import { AdUnit } from '@/components/ads/AdUnit';
import { CONTENT_CONFIG } from '@/config/content';
import { useBookmarks } from '@/hooks/useBookmarks';
import type { NewsArticle } from '@/types';
import type { Author } from '@/config/authors';

const CommentSection = dynamic(
  () => import('@/components/interactive/CommentSection').then((mod) => mod.CommentSection),
  { ssr: false, loading: () => <div className="animate-pulse h-64 bg-gray-100 rounded-lg" /> }
);

interface NoticiaPageClientProps {
  article: NewsArticle;
  reviewedBy?: { name: string; slug: string } | null;
  authorProfile?: Author;
};

const ADSENSE_SLOT_ARTICLE_INLINE =
  process.env.NEXT_PUBLIC_ADSENSE_SLOT_ARTICLE_INLINE || process.env.NEXT_PUBLIC_ADSENSE_SLOT_INARTICLE;
const ADSENSE_SLOT_ARTICLE_BOTTOM =
  process.env.NEXT_PUBLIC_ADSENSE_SLOT_ARTICLE_BOTTOM || process.env.NEXT_PUBLIC_ADSENSE_SLOT_INARTICLE;

export default function NoticiaPageClient({ article, reviewedBy, authorProfile }: NoticiaPageClientProps) {
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

  const authorUrl = authorProfile ? `/autor/${authorProfile.slug}/` : (article.authorId ? `/autor/${article.authorId}/` : undefined);
  const topicTags = (article.tags ?? []).filter(Boolean).slice(0, 8);

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
        toast.success('Link copiado para a Ã¡rea de transferÃªncia!');
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
          {/* ConteÃºdo Principal */}
          <article className="lg:col-span-2">
            {/* Header */}
            <header className="mb-8">
              {/* Badges de VerificaÃ§Ã£o */}
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
                
                {article.tags?.includes('PublicaÃ§Ã£o Patrocinada') && (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 text-xs font-bold uppercase tracking-wider text-amber-800 bg-gradient-to-r from-amber-100 to-yellow-100 rounded-full border border-amber-200">
                    <Gem className="w-3.5 h-3.5" />
                    PublicaÃ§Ã£o Patrocinada
                  </span>
                )}
              </div>

              {/* TÃ­tulo com classe para Speakable */}
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
                  {authorUrl ? (
                    <Link href={authorUrl} className="hover:text-[#c40000] hover:underline">
                      {article.author}
                    </Link>
                  ) : (
                    <span>{article.author}</span>
                  )}
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
            <figure className="mb-8 relative aspect-video rounded-lg overflow-hidden">
              <Image
                src={article.coverImage}
                alt={article.title}
                fill
                sizes="(max-width: 1024px) 100vw, 66vw"
                priority
                className="object-cover"
              />
            </figure>

            {/* Ad (inline, abaixo da imagem para não competir com LCP) */}
            <aside className="my-8" aria-label="Publicidade">
              <div className="max-w-[720px] mx-auto">
                <AdUnit slot={ADSENSE_SLOT_ARTICLE_INLINE} format="auto" className="mx-auto" />
              </div>
            </aside>

            {/* Tópicos e interlinking (sem conteúdo inventado) */}
            {topicTags.length > 0 && (
              <aside className="mb-8 p-4 sm:p-6 bg-[#f8fafc] border border-[#e5e5e5] rounded-lg">
                <header className="flex items-center justify-between gap-3 mb-3">
                  <h2 className="text-sm font-bold text-[#111111] uppercase tracking-wider">Tópicos</h2>
                  <Link href={`/categoria/${article.category}/`} className="text-sm text-[#c40000] hover:underline">
                    Mais em {category.name}
                  </Link>
                </header>
                <div className="flex flex-wrap gap-2">
                  {topicTags.map((tag) => (
                    <Link
                      key={tag}
                      href={`/busca/?q=${encodeURIComponent(tag)}`}
                      className="px-3 py-1.5 bg-white text-[#374151] text-sm rounded-full border border-[#e5e5e5] hover:border-[#c40000] hover:text-[#c40000] transition-colors"
                    >
                      {tag}
                    </Link>
                  ))}
                </div>
              </aside>
            )}

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

            {/* ConteÃºdo Principal */}
            <ArticleContent article={article} />

            {/* Ad (near-end) */}
            <aside className="my-10" aria-label="Publicidade">
              <div className="max-w-[720px] mx-auto">
                <AdUnit slot={ADSENSE_SLOT_ARTICLE_BOTTOM} format="auto" className="mx-auto" />
              </div>
            </aside>

            {/* Sinal de confiança: sobre o autor */}
            {authorUrl && (
              <aside className="my-10 p-6 bg-[#111111] text-white rounded-lg">
                <header className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-xs text-white/70 uppercase tracking-wider mb-1">Sobre o autor</p>
                    <h2 className="text-lg font-bold">{article.author}</h2>
                    <p className="text-sm text-white/70">
                      Transparência editorial, credenciais e publicações recentes no perfil.
                    </p>
                  </div>
                  <Link
                    href={authorUrl}
                    className="inline-flex items-center gap-2 px-3 py-2 rounded bg-white/10 hover:bg-white/15 transition-colors text-sm"
                  >
                    Ver perfil <ExternalLink className="w-4 h-4" />
                  </Link>
                </header>
                <p className="mt-4 text-xs text-white/60 flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4" />
                  Conteúdo editorial. Não constitui recomendação individual de investimento.
                </p>
              </aside>
            )}

            {/* Tags */}
            <footer className="mt-8 pt-8 border-t border-[#e5e5e5]">
              <h3 className="text-sm font-semibold text-[#111111] mb-3">Tags:</h3>
              <ul className="flex flex-wrap gap-2">
                {article.tags.map((tag) => (
                  <li key={tag}>
                    <Link
                      href={`/busca/?q=${encodeURIComponent(tag)}`}
                      className="inline-block px-3 py-1 bg-[#f5f5f5] text-xs sm:text-sm text-[#6b6b6b] rounded-full hover:text-[#c40000] hover:bg-white border border-transparent hover:border-[#c40000] transition-colors"
                    >
                      {tag}
                    </Link>
                  </li>
                ))}
              </ul>
            </footer>

            {/* Related Articles */}
            <RelatedArticles currentArticle={article} limit={4} />

            {/* ComentÃ¡rios */}
            <CommentSection articleSlug={article.slug} />
          </article>

          {/* Sidebar */}
          <aside className="lg:col-span-1 space-y-6">
            {/* Newsletter */}
            <section className="p-4 sm:p-6 bg-[#111111] text-white rounded-lg">
              <h3 className="text-lg font-bold mb-2">Newsletter CIN</h3>
              <p className="text-sm text-[#9ca3af] mb-4">
                Receba anÃ¡lises exclusivas diretamente no seu e-mail.
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
          </aside>
        </section>
      </main>
    </>
  );
}



