/**
 * Loading Busca
 * Componente de loading para página de busca
 */

import { Skeleton } from "@/components/ui/skeleton";
import { HeaderSkeleton, NewsCardGridSkeleton } from "@/components/skeletons";

export default function Loading() {
  return (
    <div className="min-h-screen bg-white">
      {/* Header Skeleton */}
      <HeaderSkeleton />

      <section className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-10">
        {/* Search Header */}
        <header className="mb-8 space-y-4">
          <Skeleton className="h-10 sm:h-12 w-48" />
          
          {/* Search Input */}
          <div className="flex gap-2 max-w-2xl">
            <Skeleton className="h-12 flex-1 rounded-full" />
            <Skeleton className="h-12 w-24 rounded-full" />
          </div>

          <Skeleton className="h-4 w-64" />
        </header>

        {/* Filters Skeleton */}
        <div className="flex flex-wrap items-center gap-2 mb-6">
          <Skeleton className="h-9 w-20 rounded-full" />
          <Skeleton className="h-9 w-24 rounded-full" />
          <Skeleton className="h-9 w-28 rounded-full" />
          <Skeleton className="h-9 w-20 rounded-full" />
        </div>

        {/* Results Grid */}
        <NewsCardGridSkeleton count={9} columns={3} />

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
