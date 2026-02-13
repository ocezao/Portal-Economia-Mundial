/**
 * Loading Termos/Políticas
 * Componente de loading para páginas de termos, privacidade, cookies
 */

import { Skeleton } from "@/components/ui/skeleton";
import { HeaderSkeleton } from "@/components/skeletons";

export default function Loading() {
  return (
    <div className="min-h-screen bg-white">
      {/* Header Skeleton */}
      <HeaderSkeleton />

      <section className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="max-w-3xl mx-auto">
          {/* Page Header */}
          <header className="mb-10 text-center">
            <Skeleton className="h-10 sm:h-12 w-64 mx-auto mb-4" />
            <Skeleton className="h-5 w-full max-w-xl mx-auto" />
            <Skeleton className="h-4 w-48 mx-auto mt-4" />
          </header>

          {/* Last Updated */}
          <Skeleton className="h-4 w-48 mb-8" />

          {/* Content Sections */}
          <div className="space-y-8">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="space-y-3">
                <Skeleton className="h-7 w-48" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-5/6" />
                
                {/* Sub-items for some sections */}
                {i % 2 === 0 && (
                  <ul className="space-y-2 pl-5 mt-3">
                    {Array.from({ length: 3 }).map((_, j) => (
                      <li key={j}>
                        <Skeleton className="h-4 w-3/4" />
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            ))}
          </div>

          {/* Contact Section */}
          <div className="mt-12 pt-8 border-t border-[#e5e5e5]">
            <Skeleton className="h-6 w-40 mb-3" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-48 mt-2" />
          </div>
        </div>
      </section>
    </div>
  );
}
