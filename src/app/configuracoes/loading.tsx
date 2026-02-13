/**
 * Loading Configurações
 * Componente de loading para página de configurações
 */

import { Skeleton } from "@/components/ui/skeleton";
import { HeaderSkeleton } from "@/components/skeletons";

export default function Loading() {
  return (
    <div className="min-h-screen bg-white">
      {/* Header Skeleton */}
      <HeaderSkeleton />

      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Page Header */}
        <header className="mb-8">
          <Skeleton className="h-10 w-48 mb-2" />
          <Skeleton className="h-5 w-64" />
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Sidebar Tabs */}
          <aside className="lg:col-span-1">
            <div className="space-y-1">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-10 w-full rounded-lg" />
              ))}
            </div>
          </aside>

          {/* Main Content */}
          <main className="lg:col-span-3 space-y-6">
            {/* Section */}
            <div className="border border-[#e5e5e5] rounded-lg p-6 space-y-6">
              <Skeleton className="h-7 w-40" />
              
              <div className="space-y-4">
                <div className="space-y-1">
                  <Skeleton className="h-4 w-16" />
                  <Skeleton className="h-12 w-full rounded-lg" />
                </div>
                <div className="space-y-1">
                  <Skeleton className="h-4 w-20" />
                  <Skeleton className="h-12 w-full rounded-lg" />
                </div>
                <div className="space-y-1">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-32 w-full rounded-lg" />
                </div>
              </div>

              <div className="pt-4 border-t border-[#e5e5e5]">
                <Skeleton className="h-10 w-32 rounded-md" />
              </div>
            </div>

            {/* Another Section */}
            <div className="border border-[#e5e5e5] rounded-lg p-6 space-y-6">
              <Skeleton className="h-7 w-48" />
              
              <div className="space-y-4">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="flex items-center justify-between py-3 border-b border-[#e5e5e5] last:border-b-0">
                    <div className="space-y-1">
                      <Skeleton className="h-5 w-32" />
                      <Skeleton className="h-4 w-48" />
                    </div>
                    <Skeleton className="h-6 w-11 rounded-full" />
                  </div>
                ))}
              </div>
            </div>

            {/* Preferences Section */}
            <div className="border border-[#e5e5e5] rounded-lg p-6 space-y-6">
              <Skeleton className="h-7 w-40" />
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <Skeleton className="h-5 w-5 rounded" />
                    <Skeleton className="h-5 w-32" />
                  </div>
                ))}
              </div>
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}
