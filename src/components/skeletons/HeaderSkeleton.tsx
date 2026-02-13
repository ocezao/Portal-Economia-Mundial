/**
 * Header Skeleton Component
 * Skeleton para o header durante loading
 */

import { Skeleton } from "@/components/ui/skeleton";

export function HeaderSkeleton() {
  return (
    <header className="sticky top-0 z-[200] bg-white/95 backdrop-blur border-b border-[#e6e1d8]">
      <nav className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between min-h-[72px]">
          {/* Logo Skeleton */}
          <Skeleton className="h-8 w-24" />

          {/* Menu Desktop Skeleton */}
          <div className="hidden lg:flex items-center justify-center flex-1 mx-8">
            <div className="flex items-center justify-between w-full max-w-4xl gap-2">
              {Array.from({ length: 6 }).map((_, i) => (
                <Skeleton key={i} className="h-4 w-20" />
              ))}
            </div>
          </div>

          {/* Actions Skeleton */}
          <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
            <Skeleton className="h-10 w-10 rounded-full" />
            <Skeleton className="hidden sm:block h-9 w-20 rounded-full" />
            <Skeleton className="hidden lg:block h-9 w-24 rounded-full" />
            <Skeleton className="lg:hidden h-10 w-10 rounded-full" />
          </div>
        </div>
      </nav>
    </header>
  );
}
