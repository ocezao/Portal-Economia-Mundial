/**
 * Loading Destaque
 * Componente de loading para página de destaques
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
          <Skeleton className="h-10 sm:h-12 w-48" />
          <Skeleton className="h-5 w-full max-w-2xl" />
          <Skeleton className="h-4 w-48" />
        </header>

        {/* Featured Hero */}
        <div className="mb-10 space-y-6">
          <Skeleton className="h-[400px] sm:h-[500px] w-full rounded-lg" />
          <div className="max-w-3xl space-y-3">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-8 sm:h-10 w-full" />
            <Skeleton className="h-6 w-5/6" />
            <div className="flex items-center gap-2 pt-2">
              <Skeleton className="h-8 w-8 rounded-full" />
              <Skeleton className="h-4 w-32" />
            </div>
          </div>
        </div>

        {/* Section Title */}
        <div className="flex items-center justify-between mb-6">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-5 w-24" />
        </div>

        {/* News Grid */}
        <NewsCardGridSkeleton count={9} columns={3} />

        {/* Load More */}
        <div className="mt-10 text-center">
          <Skeleton className="h-12 w-40 mx-auto rounded-full" />
        </div>
      </section>
    </div>
  );
}
