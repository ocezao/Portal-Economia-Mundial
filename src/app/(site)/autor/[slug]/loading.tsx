/**
 * Loading Autor
 * Componente de loading para páginas de autor
 */

import { Skeleton } from "@/components/ui/skeleton";
import { HeaderSkeleton, NewsCardGridSkeleton } from "@/components/skeletons";

export default function Loading() {
  return (
    <div className="min-h-screen bg-white">
      {/* Header Skeleton */}
      <HeaderSkeleton />

      <section className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-10">
        {/* Author Profile Header */}
        <header className="mb-10 p-6 sm:p-8 bg-[#f6f3ef] rounded-lg">
          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6">
            {/* Avatar */}
            <Skeleton className="h-24 w-24 sm:h-32 sm:w-32 rounded-full flex-shrink-0" />
            
            {/* Info */}
            <div className="flex-1 text-center sm:text-left space-y-3">
              <Skeleton className="h-8 w-48 sm:mx-0 mx-auto" />
              <Skeleton className="h-5 w-32 sm:mx-0 mx-auto" />
              <Skeleton className="h-4 w-full max-w-lg sm:mx-0 mx-auto" />
              <Skeleton className="h-4 w-5/6 max-w-md sm:mx-0 mx-auto" />
              
              {/* Social Links */}
              <div className="flex items-center justify-center sm:justify-start gap-3 pt-2">
                {Array.from({ length: 4 }).map((_, i) => (
                  <Skeleton key={i} className="h-9 w-9 rounded-full" />
                ))}
              </div>
            </div>

            {/* Stats */}
            <div className="flex sm:flex-col gap-4 sm:gap-2">
              <div className="text-center sm:text-right">
                <Skeleton className="h-8 w-16 sm:ml-auto" />
                <Skeleton className="h-4 w-20 sm:ml-auto mt-1" />
              </div>
              <div className="text-center sm:text-right">
                <Skeleton className="h-8 w-16 sm:ml-auto" />
                <Skeleton className="h-4 w-20 sm:ml-auto mt-1" />
              </div>
            </div>
          </div>
        </header>

        {/* Section Title */}
        <div className="flex items-center justify-between mb-6">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-5 w-24" />
        </div>

        {/* News Grid */}
        <NewsCardGridSkeleton count={9} columns={3} />

        {/* Pagination Skeleton */}
        <nav className="mt-10 flex items-center justify-center gap-4">
          <Skeleton className="h-9 w-24 rounded" />
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-9 w-24 rounded" />
        </nav>
      </section>
    </div>
  );
}
