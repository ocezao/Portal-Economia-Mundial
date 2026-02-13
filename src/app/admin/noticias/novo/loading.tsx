/**
 * Loading Novo Artigo
 * Componente de loading para a página de criação de artigo
 */

import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white border-b border-[#e5e5e5]">
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Skeleton className="h-8 w-8 rounded-lg" />
              <Skeleton className="h-6 w-40" />
            </div>
            <div className="flex items-center gap-2">
              <Skeleton className="h-9 w-24 rounded-md" />
              <Skeleton className="h-9 w-28 rounded-md" />
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-[1400px] mx-auto px-4 sm:px-6 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Form */}
          <div className="lg:col-span-2 space-y-6">
            {/* Title Field */}
            <div className="space-y-1">
              <Skeleton className="h-4 w-12" />
              <Skeleton className="h-12 w-full rounded-lg" />
              <Skeleton className="h-3 w-48" />
            </div>

            {/* Excerpt Field */}
            <div className="space-y-1">
              <Skeleton className="h-4 w-16" />
              <Skeleton className="h-24 w-full rounded-lg" />
            </div>

            {/* Editor */}
            <div className="space-y-1">
              <Skeleton className="h-4 w-16" />
              <Skeleton className="h-[400px] w-full rounded-lg" />
            </div>

            {/* Cover Image */}
            <div className="space-y-1">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-48 w-full rounded-lg" />
            </div>
          </div>

          {/* Sidebar */}
          <aside className="space-y-6">
            {/* Publish Card */}
            <div className="border border-[#e5e5e5] rounded-lg p-4 space-y-4">
              <Skeleton className="h-6 w-24" />
              <Skeleton className="h-10 w-full rounded-md" />
              <Skeleton className="h-10 w-full rounded-md" />
            </div>

            {/* Category Card */}
            <div className="border border-[#e5e5e5] rounded-lg p-4 space-y-4">
              <Skeleton className="h-6 w-20" />
              <Skeleton className="h-10 w-full rounded-md" />
            </div>

            {/* Tags Card */}
            <div className="border border-[#e5e5e5] rounded-lg p-4 space-y-4">
              <Skeleton className="h-6 w-16" />
              <Skeleton className="h-10 w-full rounded-md" />
              <div className="flex flex-wrap gap-2">
                {Array.from({ length: 4 }).map((_, i) => (
                  <Skeleton key={i} className="h-7 w-20 rounded-full" />
                ))}
              </div>
            </div>

            {/* Author Card */}
            <div className="border border-[#e5e5e5] rounded-lg p-4 space-y-4">
              <Skeleton className="h-6 w-16" />
              <Skeleton className="h-10 w-full rounded-md" />
            </div>

            {/* SEO Card */}
            <div className="border border-[#e5e5e5] rounded-lg p-4 space-y-4">
              <Skeleton className="h-6 w-32" />
              <div className="space-y-2">
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-10 w-full rounded-md" />
              </div>
              <div className="space-y-2">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-20 w-full rounded-md" />
              </div>
            </div>
          </aside>
        </div>
      </main>
    </div>
  );
}
