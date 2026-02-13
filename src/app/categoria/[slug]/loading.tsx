/**
 * Loading Categoria
 * Componente de loading para páginas de categoria
 */

import { Skeleton } from "@/components/ui/skeleton";
import { HeaderSkeleton, NewsCardGridSkeleton } from "@/components/skeletons";

export default function Loading() {
  return (
    <div className="min-h-screen bg-white">
      {/* Header Skeleton */}
      <HeaderSkeleton />

      <section className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-10">
        {/* Category Header */}
        <header className="mb-8 space-y-3">
          <div className="flex items-center gap-2">
            <Skeleton className="h-4 w-12" />
            <Skeleton className="h-4 w-4" />
            <Skeleton className="h-4 w-20" />
          </div>
          <Skeleton className="h-10 sm:h-12 w-56" />
          <Skeleton className="h-5 w-full max-w-xl" />
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
      </section>
    </div>
  );
}
