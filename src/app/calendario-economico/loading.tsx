/**
 * Loading Calendário Econômico
 * Componente de loading para página de calendário econômico
 */

import { Skeleton } from "@/components/ui/skeleton";
import { HeaderSkeleton } from "@/components/skeletons";

export default function Loading() {
  return (
    <div className="min-h-screen bg-white">
      {/* Header Skeleton */}
      <HeaderSkeleton />

      <section className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-10">
        {/* Page Header */}
        <header className="mb-8 space-y-3">
          <Skeleton className="h-10 sm:h-12 w-64" />
          <Skeleton className="h-5 w-full max-w-2xl" />
          <Skeleton className="h-4 w-48" />
        </header>

        {/* Calendar Filters */}
        <div className="flex flex-wrap items-center gap-3 mb-6">
          <Skeleton className="h-10 w-32 rounded-md" />
          <Skeleton className="h-10 w-24 rounded-md" />
          <Skeleton className="h-10 w-28 rounded-md" />
          <Skeleton className="h-10 w-36 rounded-md" />
        </div>

        {/* Events Table */}
        <div className="border border-[#e5e5e5] rounded-lg overflow-hidden">
          {/* Table Header */}
          <div className="grid grid-cols-12 gap-4 p-4 bg-[#fafafa] border-b border-[#e5e5e5] text-sm font-medium text-[#6b6b6b]">
            <Skeleton className="h-4 w-full col-span-2" />
            <Skeleton className="h-4 w-full col-span-2" />
            <Skeleton className="h-4 w-full col-span-4" />
            <Skeleton className="h-4 w-full col-span-2" />
            <Skeleton className="h-4 w-full col-span-2" />
          </div>

          {/* Table Rows */}
          {Array.from({ length: 10 }).map((_, i) => (
            <div
              key={i}
              className="grid grid-cols-12 gap-4 p-4 border-b border-[#e5e5e5] last:border-b-0 items-center"
            >
              <div className="col-span-2">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-3 w-12 mt-1" />
              </div>
              <div className="col-span-2">
                <Skeleton className="h-5 w-8 rounded" />
              </div>
              <div className="col-span-4">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-3 w-24 mt-1" />
              </div>
              <div className="col-span-2">
                <Skeleton className="h-4 w-full" />
              </div>
              <div className="col-span-2">
                <Skeleton className="h-6 w-16 rounded-full" />
              </div>
            </div>
          ))}
        </div>

        {/* Pagination */}
        <nav className="mt-6 flex items-center justify-between">
          <Skeleton className="h-9 w-24 rounded" />
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-9 w-24 rounded" />
        </nav>

        {/* Legend */}
        <div className="mt-8 flex flex-wrap items-center gap-4">
          <Skeleton className="h-4 w-16" />
          <Skeleton className="h-6 w-20 rounded-full" />
          <Skeleton className="h-6 w-20 rounded-full" />
          <Skeleton className="h-6 w-20 rounded-full" />
        </div>
      </section>
    </div>
  );
}
