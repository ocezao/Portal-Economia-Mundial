/**
 * Loading Notícias List
 * Componente de loading para a listagem de notícias
 */

import { Skeleton } from "@/components/ui/skeleton";
import { HeaderSkeleton, NewsCardGridSkeleton } from "@/components/skeletons";

export default function Loading() {
  return (
    <div className="min-h-screen bg-white">
      {/* Header Skeleton */}
      <HeaderSkeleton />

      <section className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-10">
        {/* Page Header */}
        <header className="mb-8 space-y-3">
          <Skeleton className="h-10 sm:h-12 w-40" />
          <Skeleton className="h-5 w-full max-w-2xl" />
          <Skeleton className="h-4 w-48" />
        </header>

        {/* News Grid */}
        <NewsCardGridSkeleton count={12} columns={3} />

        {/* Pagination Skeleton */}
        <nav className="mt-10 flex items-center justify-between gap-4">
          <Skeleton className="h-9 w-24 rounded" />
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-9 w-24 rounded" />
        </nav>

        {/* Footer Link */}
        <footer className="mt-10">
          <Skeleton className="h-4 w-64" />
        </footer>
      </section>
    </div>
  );
}
