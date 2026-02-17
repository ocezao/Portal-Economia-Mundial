/**
 * Loading Perfil
 * Componente de loading para página de perfil do usuário
 */

import { Skeleton } from "@/components/ui/skeleton";
import { HeaderSkeleton } from "@/components/skeletons";

export default function Loading() {
  return (
    <div className="min-h-screen bg-white">
      {/* Header Skeleton */}
      <HeaderSkeleton />

      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Profile Header */}
        <div className="mb-8 p-6 sm:p-8 bg-[#f6f3ef] rounded-lg">
          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6">
            <Skeleton className="h-24 w-24 sm:h-32 sm:w-32 rounded-full flex-shrink-0" />
            <div className="flex-1 text-center sm:text-left space-y-3">
              <Skeleton className="h-8 w-48 sm:mx-0 mx-auto" />
              <Skeleton className="h-5 w-32 sm:mx-0 mx-auto" />
              <Skeleton className="h-4 w-full max-w-md sm:mx-0 mx-auto" />
              <div className="flex items-center justify-center sm:justify-start gap-2 pt-2">
                <Skeleton className="h-9 w-24 rounded-full" />
                <Skeleton className="h-9 w-28 rounded-full" />
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Sidebar */}
          <aside className="lg:col-span-1 space-y-6">
            <div className="border border-[#e5e5e5] rounded-lg p-4 space-y-3">
              <Skeleton className="h-5 w-32" />
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="flex items-center justify-between py-2">
                  <Skeleton className="h-4 w-20" />
                  <Skeleton className="h-4 w-32" />
                </div>
              ))}
            </div>

            <div className="border border-[#e5e5e5] rounded-lg p-4 space-y-3">
              <Skeleton className="h-5 w-24" />
              <Skeleton className="h-10 w-full rounded-lg" />
              <Skeleton className="h-10 w-full rounded-lg" />
            </div>
          </aside>

          {/* Main Form */}
          <main className="lg:col-span-2">
            <div className="border border-[#e5e5e5] rounded-lg p-6 space-y-6">
              <Skeleton className="h-7 w-40" />
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <Skeleton className="h-4 w-16" />
                  <Skeleton className="h-12 w-full rounded-lg" />
                </div>
                <div className="space-y-1">
                  <Skeleton className="h-4 w-20" />
                  <Skeleton className="h-12 w-full rounded-lg" />
                </div>
                <div className="space-y-1">
                  <Skeleton className="h-4 w-16" />
                  <Skeleton className="h-12 w-full rounded-lg" />
                </div>
                <div className="space-y-1">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-12 w-full rounded-lg" />
                </div>
              </div>

              <div className="space-y-1">
                <Skeleton className="h-4 w-16" />
                <Skeleton className="h-12 w-full sm:w-1/2 rounded-lg" />
              </div>

              <div className="space-y-1">
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-32 w-full rounded-lg" />
              </div>

              <div className="pt-4 border-t border-[#e5e5e5]">
                <Skeleton className="h-10 w-32 rounded-md" />
              </div>
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}
