/**
 * Loading Fale Conosco
 * Componente de loading para página de contato
 */

import { Skeleton } from "@/components/ui/skeleton";
import { HeaderSkeleton } from "@/components/skeletons";

export default function Loading() {
  return (
    <div className="min-h-screen bg-white">
      {/* Header Skeleton */}
      <HeaderSkeleton />

      <section className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 max-w-5xl mx-auto">
          {/* Contact Info */}
          <div className="space-y-8">
            <div>
              <Skeleton className="h-10 w-48 mb-4" />
              <Skeleton className="h-5 w-full" />
              <Skeleton className="h-5 w-5/6 mt-2" />
            </div>

            {/* Contact Methods */}
            <div className="space-y-4">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="flex items-center gap-4">
                  <Skeleton className="h-12 w-12 rounded-lg" />
                  <div className="space-y-1">
                    <Skeleton className="h-5 w-32" />
                    <Skeleton className="h-4 w-48" />
                  </div>
                </div>
              ))}
            </div>

            {/* Social Links */}
            <div>
              <Skeleton className="h-6 w-32 mb-4" />
              <div className="flex gap-3">
                {Array.from({ length: 4 }).map((_, i) => (
                  <Skeleton key={i} className="h-10 w-10 rounded-full" />
                ))}
              </div>
            </div>
          </div>

          {/* Contact Form */}
          <div className="bg-[#f6f3ef] rounded-2xl p-6 sm:p-8 space-y-6">
            <Skeleton className="h-8 w-40" />
            
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <Skeleton className="h-4 w-16" />
                  <Skeleton className="h-12 w-full rounded-lg" />
                </div>
                <div className="space-y-1">
                  <Skeleton className="h-4 w-20" />
                  <Skeleton className="h-12 w-full rounded-lg" />
                </div>
              </div>
              <div className="space-y-1">
                <Skeleton className="h-4 w-16" />
                <Skeleton className="h-12 w-full rounded-lg" />
              </div>
              <div className="space-y-1">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-12 w-full rounded-lg" />
              </div>
              <div className="space-y-1">
                <Skeleton className="h-4 w-16" />
                <Skeleton className="h-32 w-full rounded-lg" />
              </div>
            </div>

            <Skeleton className="h-12 w-full rounded-full" />
          </div>
        </div>
      </section>
    </div>
  );
}
