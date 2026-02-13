/**
 * News Card Skeleton Component
 * Skeleton para cards de notícias
 */

import { Skeleton } from "@/components/ui/skeleton";

interface NewsCardSkeletonProps {
  variant?: "default" | "featured" | "compact";
}

export function NewsCardSkeleton({ variant = "default" }: NewsCardSkeletonProps) {
  if (variant === "featured") {
    return (
      <div className="space-y-4">
        <Skeleton className="h-[300px] sm:h-[400px] w-full rounded-lg" />
        <div className="space-y-2">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-8 w-full" />
          <Skeleton className="h-6 w-3/4" />
        </div>
        <div className="flex items-center gap-2">
          <Skeleton className="h-8 w-8 rounded-full" />
          <Skeleton className="h-4 w-32" />
        </div>
      </div>
    );
  }

  if (variant === "compact") {
    return (
      <div className="flex gap-4">
        <Skeleton className="h-24 w-24 flex-shrink-0 rounded-lg" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-3 w-16" />
          <Skeleton className="h-5 w-full" />
          <Skeleton className="h-4 w-3/4" />
        </div>
      </div>
    );
  }

  // Default variant
  return (
    <div className="space-y-3">
      <Skeleton className="h-48 w-full rounded-lg" />
      <div className="space-y-2">
        <Skeleton className="h-3 w-20" />
        <Skeleton className="h-6 w-full" />
        <Skeleton className="h-4 w-5/6" />
      </div>
      <div className="flex items-center gap-2 pt-1">
        <Skeleton className="h-6 w-6 rounded-full" />
        <Skeleton className="h-3 w-24" />
      </div>
    </div>
  );
}

interface NewsCardGridSkeletonProps {
  count?: number;
  columns?: 1 | 2 | 3 | 4;
}

export function NewsCardGridSkeleton({ count = 6, columns = 3 }: NewsCardGridSkeletonProps) {
  const gridClasses = {
    1: "grid-cols-1",
    2: "grid-cols-1 sm:grid-cols-2",
    3: "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3",
    4: "grid-cols-1 sm:grid-cols-2 lg:grid-cols-4",
  };

  return (
    <div className={`grid ${gridClasses[columns]} gap-6`}>
      {Array.from({ length: count }).map((_, i) => (
        <NewsCardSkeleton key={i} />
      ))}
    </div>
  );
}
