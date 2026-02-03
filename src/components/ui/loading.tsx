/**
 * Componentes de Loading
 * Global e local, seguindo o design system
 */

import { Loader2 } from 'lucide-react';

interface LoadingProps {
  size?: 'sm' | 'md' | 'lg';
  text?: string;
  fullScreen?: boolean;
}

const sizeMap = {
  sm: 'w-4 h-4',
  md: 'w-8 h-8',
  lg: 'w-12 h-12',
};

/**
 * Spinner de loading simples
 */
export function LoadingSpinner({ size = 'md', text }: LoadingProps) {
  return (
    <section className="flex flex-col items-center justify-center gap-3" role="status" aria-live="polite">
      <Loader2 className={`${sizeMap[size]} text-[#c40000] animate-spin`} />
      {text && <p className="text-sm text-[#6b6b6b]">{text}</p>}
      <span className="sr-only">Carregando...</span>
    </section>
  );
}

/**
 * Loading em tela cheia (para transições de rota)
 */
export function FullScreenLoading({ text = 'Carregando...' }: { text?: string }) {
  return (
    <main className="fixed inset-0 z-[500] bg-white flex items-center justify-center">
      <section className="flex flex-col items-center gap-4" role="status" aria-live="polite">
        <span className="text-3xl font-black text-[#111111]">PEM</span>
        <span className="w-8 h-8 border-2 border-[#e5e5e5] border-t-[#c40000] rounded-full animate-spin" />
        <p className="text-sm text-[#6b6b6b]">{text}</p>
      </section>
    </main>
  );
}

/**
 * Skeleton para cards de notícia
 */
export function NewsCardSkeleton() {
  return (
    <article className="bg-white border border-[#e5e5e5] rounded-lg overflow-hidden animate-pulse">
      <section className="aspect-video bg-[#e5e5e5]" />
      <section className="p-4 space-y-3">
        <section className="h-4 w-20 bg-[#e5e5e5] rounded" />
        <section className="h-6 w-full bg-[#e5e5e5] rounded" />
        <section className="h-4 w-3/4 bg-[#e5e5e5] rounded" />
        <section className="flex gap-2 pt-2">
          <section className="h-3 w-16 bg-[#e5e5e5] rounded" />
          <section className="h-3 w-16 bg-[#e5e5e5] rounded" />
        </section>
      </section>
    </article>
  );
}

/**
 * Skeleton para lista de artigos
 */
export function ArticleListSkeleton({ count = 3 }: { count?: number }) {
  return (
    <ul className="space-y-4">
      {Array.from({ length: count }).map((_, i) => (
        <li key={i}>
          <article className="flex gap-4 animate-pulse">
            <section className="w-24 h-24 sm:w-32 sm:h-24 bg-[#e5e5e5] rounded-md flex-shrink-0" />
            <section className="flex-1 space-y-2">
              <section className="h-4 w-16 bg-[#e5e5e5] rounded" />
              <section className="h-5 w-full bg-[#e5e5e5] rounded" />
              <section className="h-4 w-3/4 bg-[#e5e5e5] rounded" />
              <section className="h-3 w-24 bg-[#e5e5e5] rounded" />
            </section>
          </article>
        </li>
      ))}
    </ul>
  );
}

/**
 * Loading overlay (para ações locais)
 */
export function LoadingOverlay({ text }: { text?: string }) {
  return (
    <section 
      className="absolute inset-0 bg-white/80 backdrop-blur-sm flex items-center justify-center z-10"
      role="status"
      aria-live="polite"
    >
      <LoadingSpinner size="md" text={text} />
    </section>
  );
}

/**
 * Button loading state
 */
export function ButtonLoading({ text = 'Carregando...' }: { text?: string }) {
  return (
    <>
      <span className="w-4 h-4 mr-2 border-2 border-white/30 border-t-white rounded-full animate-spin" />
      {text}
    </>
  );
}
