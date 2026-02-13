/**
 * Loading Dados Econômicos
 * Componente de loading para página de dados econômicos
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

        {/* Economic Indicators Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 mb-10">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="p-4 border border-[#e5e5e5] rounded-lg">
              <div className="flex items-center justify-between mb-3">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-6 w-12 rounded" />
              </div>
              <Skeleton className="h-8 w-32 mb-1" />
              <Skeleton className="h-3 w-20" />
            </div>
          ))}
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Main Chart */}
          <div className="lg:col-span-2 p-6 border border-[#e5e5e5] rounded-lg">
            <div className="flex items-center justify-between mb-6">
              <Skeleton className="h-6 w-40" />
              <Skeleton className="h-9 w-32 rounded-md" />
            </div>
            <Skeleton className="h-[300px] w-full rounded-lg" />
          </div>

          {/* Side Charts */}
          {Array.from({ length: 2 }).map((_, i) => (
            <div key={i} className="p-6 border border-[#e5e5e5] rounded-lg">
              <Skeleton className="h-6 w-32 mb-4" />
              <Skeleton className="h-[200px] w-full rounded-lg" />
            </div>
          ))}
        </div>

        {/* Data Table */}
        <div className="mt-8 border border-[#e5e5e5] rounded-lg overflow-hidden">
          <div className="p-4 border-b border-[#e5e5e5]">
            <Skeleton className="h-6 w-48" />
          </div>
          <div className="divide-y divide-[#e5e5e5]">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="grid grid-cols-4 gap-4 p-4">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-4 w-16" />
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
