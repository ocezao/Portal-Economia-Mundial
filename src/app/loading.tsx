/**
 * Loading Locale
 * Componente de loading para rotas com locale
 * Inclui skeleton do header e conteúdo genérico
 */

import { Skeleton } from "@/components/ui/skeleton";
import { HeaderSkeleton } from "@/components/skeletons";

export default function Loading() {
  return (
    <div className="min-h-screen bg-white">
      {/* Header Skeleton */}
      <HeaderSkeleton />

      {/* Hero Section Skeleton */}
      <section className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Hero Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-10">
          {/* Main Featured */}
          <div className="lg:col-span-2 space-y-4">
            <Skeleton className="h-[300px] sm:h-[400px] w-full rounded-lg" />
            <Skeleton className="h-8 w-3/4" />
            <Skeleton className="h-5 w-1/2" />
            <div className="flex items-center gap-2">
              <Skeleton className="h-8 w-8 rounded-full" />
              <Skeleton className="h-4 w-32" />
            </div>
          </div>

          {/* Side Featured */}
          <div className="space-y-4">
            <Skeleton className="h-[180px] w-full rounded-lg" />
            <Skeleton className="h-6 w-full" />
            <Skeleton className="h-4 w-2/3" />
            <div className="pt-4 border-t border-[#e5e5e5]">
              <Skeleton className="h-[180px] w-full rounded-lg mb-3" />
              <Skeleton className="h-6 w-full" />
              <Skeleton className="h-4 w-2/3" />
            </div>
          </div>
        </div>

        {/* Breaking News Ticker Skeleton */}
        <div className="flex items-center gap-3 mb-8 p-4 bg-[#fff5f5] border border-[#ffcdd2] rounded-lg">
          <Skeleton className="h-6 w-24 rounded" />
          <Skeleton className="h-5 flex-1" />
        </div>

        {/* Section Title */}
        <div className="flex items-center justify-between mb-6">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-5 w-24" />
        </div>

        {/* News Grid Skeleton */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-10">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="space-y-3">
              <Skeleton className="h-48 w-full rounded-lg" />
              <Skeleton className="h-3 w-20" />
              <Skeleton className="h-6 w-full" />
              <Skeleton className="h-4 w-5/6" />
              <div className="flex items-center gap-2 pt-1">
                <Skeleton className="h-6 w-6 rounded-full" />
                <Skeleton className="h-3 w-24" />
              </div>
            </div>
          ))}
        </div>

        {/* Trending Section Skeleton */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Trending List */}
          <div className="lg:col-span-2 space-y-4">
            <Skeleton className="h-8 w-40 mb-4" />
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex items-start gap-4 p-4 border-b border-[#e5e5e5]">
                <Skeleton className="h-8 w-8 rounded flex-shrink-0" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-5 w-full" />
                  <Skeleton className="h-4 w-32" />
                </div>
              </div>
            ))}
          </div>

          {/* Sidebar Skeleton */}
          <div className="space-y-6">
            <Skeleton className="h-8 w-40" />
            <div className="space-y-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="flex items-center gap-3">
                  <Skeleton className="h-16 w-16 rounded-lg flex-shrink-0" />
                  <div className="flex-1 space-y-1">
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-3 w-20" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
