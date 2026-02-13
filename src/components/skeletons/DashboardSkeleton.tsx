/**
 * Dashboard Skeleton Component
 * Skeleton para o painel administrativo
 */

import { Skeleton } from "@/components/ui/skeleton";

export function DashboardSkeleton() {
  return (
    <div className="min-h-screen bg-white">
      {/* Mobile Header Skeleton */}
      <header className="lg:hidden sticky top-0 z-50 bg-white border-b border-[#e5e5e5]">
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-2">
            <Skeleton className="h-8 w-8 rounded-lg" />
            <Skeleton className="h-5 w-24" />
          </div>
          <div className="flex items-center gap-2">
            <Skeleton className="h-9 w-9 rounded-full" />
            <Skeleton className="h-9 w-9 rounded-full" />
          </div>
        </div>
      </header>

      <main className="max-w-[1400px] mx-auto px-3 sm:px-4 py-4 sm:py-6 lg:py-8">
        {/* Desktop Header Skeleton */}
        <header className="hidden lg:flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-6">
          <div className="flex items-center gap-3">
            <Skeleton className="h-12 w-12 rounded-lg" />
            <div className="space-y-1">
              <Skeleton className="h-8 w-48" />
              <Skeleton className="h-4 w-64" />
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Skeleton className="h-9 w-28 rounded-md" />
            <Skeleton className="h-9 w-20 rounded-md" />
          </div>
        </header>

        {/* Stats Cards Skeleton */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="p-4 border border-[#e5e5e5] rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-8 w-8 rounded-lg" />
              </div>
              <Skeleton className="h-8 w-16 mb-1" />
              <Skeleton className="h-3 w-20" />
            </div>
          ))}
        </div>

        {/* Tabs Skeleton */}
        <div className="hidden lg:block mb-6">
          <div className="flex gap-1 p-1 bg-[#f5f5f5] rounded-lg">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-9 flex-1 rounded-md" />
            ))}
          </div>
        </div>

        {/* Table Skeleton */}
        <div className="border border-[#e5e5e5] rounded-lg overflow-hidden">
          {/* Table Header */}
          <div className="hidden sm:grid grid-cols-12 gap-4 p-4 border-b border-[#e5e5e5] bg-[#fafafa]">
            <Skeleton className="h-4 w-4 col-span-1" />
            <Skeleton className="h-4 w-32 col-span-5" />
            <Skeleton className="h-4 w-20 col-span-2" />
            <Skeleton className="h-4 w-16 col-span-2" />
            <Skeleton className="h-4 w-20 col-span-2" />
          </div>

          {/* Table Rows */}
          {Array.from({ length: 8 }).map((_, i) => (
            <div
              key={i}
              className="grid grid-cols-1 sm:grid-cols-12 gap-2 sm:gap-4 p-4 border-b border-[#e5e5e5] last:border-b-0"
            >
              <div className="hidden sm:block col-span-1">
                <Skeleton className="h-4 w-4" />
              </div>
              <div className="col-span-1 sm:col-span-5 space-y-2">
                <Skeleton className="h-5 w-full" />
                <Skeleton className="h-3 w-32 sm:hidden" />
              </div>
              <div className="hidden sm:block col-span-2">
                <Skeleton className="h-6 w-20 rounded-full" />
              </div>
              <div className="hidden sm:block col-span-2">
                <Skeleton className="h-4 w-16" />
              </div>
              <div className="hidden sm:flex col-span-2 gap-2">
                <Skeleton className="h-8 w-8 rounded-md" />
                <Skeleton className="h-8 w-8 rounded-md" />
                <Skeleton className="h-8 w-8 rounded-md" />
              </div>
            </div>
          ))}
        </div>

        {/* Pagination Skeleton */}
        <div className="flex items-center justify-between gap-4 mt-6">
          <Skeleton className="h-9 w-24 rounded-md" />
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-9 w-24 rounded-md" />
        </div>
      </main>
    </div>
  );
}

export function AdminSidebarSkeleton() {
  return (
    <aside className="w-64 bg-white border-r border-[#e5e5e5] min-h-screen p-4">
      <Skeleton className="h-8 w-32 mb-8" />
      <nav className="space-y-2">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="h-10 w-full rounded-lg" />
        ))}
      </nav>
    </aside>
  );
}
