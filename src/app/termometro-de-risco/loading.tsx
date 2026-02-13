/**
 * Loading Termômetro de Risco / Mapa de Tensões
 * Componente de loading para páginas de análise geopolítica
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

        {/* Risk Indicators */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="p-4 border border-[#e5e5e5] rounded-lg text-center">
              <Skeleton className="h-8 w-16 mx-auto mb-2" />
              <Skeleton className="h-4 w-24 mx-auto" />
              <Skeleton className="h-3 w-16 mx-auto mt-1" />
            </div>
          ))}
        </div>

        {/* Main Visualization */}
        <div className="mb-8 p-6 border border-[#e5e5e5] rounded-lg">
          <Skeleton className="h-6 w-48 mb-4" />
          <Skeleton className="h-[400px] w-full rounded-lg" />
        </div>

        {/* Regions List */}
        <div className="space-y-4">
          <Skeleton className="h-8 w-40" />
          {Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              className="flex items-center justify-between p-4 border border-[#e5e5e5] rounded-lg"
            >
              <div className="flex items-center gap-4">
                <Skeleton className="h-10 w-10 rounded-lg" />
                <div>
                  <Skeleton className="h-5 w-32" />
                  <Skeleton className="h-4 w-48 mt-1" />
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Skeleton className="h-6 w-20 rounded-full" />
                <Skeleton className="h-8 w-8 rounded-md" />
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
