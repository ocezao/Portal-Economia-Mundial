/**
 * Article Skeleton Component
 * Skeleton para página de artigo individual
 */

import { Skeleton } from "@/components/ui/skeleton";

export function ArticleSkeleton() {
  return (
    <article className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Breadcrumb Skeleton */}
      <div className="flex items-center gap-2 mb-6">
        <Skeleton className="h-4 w-12" />
        <Skeleton className="h-4 w-4" />
        <Skeleton className="h-4 w-20" />
        <Skeleton className="h-4 w-4" />
        <Skeleton className="h-4 w-32" />
      </div>

      {/* Header Skeleton */}
      <header className="max-w-4xl mb-8">
        {/* Category */}
        <Skeleton className="h-5 w-24 mb-4" />
        
        {/* Title */}
        <div className="space-y-2 mb-6">
          <Skeleton className="h-10 sm:h-12 w-full" />
          <Skeleton className="h-10 sm:h-12 w-5/6" />
        </div>

        {/* Excerpt */}
        <div className="space-y-2 mb-6">
          <Skeleton className="h-5 w-full" />
          <Skeleton className="h-5 w-4/5" />
        </div>

        {/* Author & Date */}
        <div className="flex items-center gap-3">
          <Skeleton className="h-12 w-12 rounded-full" />
          <div className="space-y-1">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-3 w-24" />
          </div>
        </div>
      </header>

      {/* Cover Image Skeleton */}
      <Skeleton className="h-[300px] sm:h-[400px] lg:h-[500px] w-full max-w-5xl rounded-lg mb-8" />

      {/* Article Content Skeleton */}
      <div className="max-w-3xl mx-auto space-y-4">
        {/* Paragraphs */}
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="space-y-2">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-4/5" />
          </div>
        ))}

        {/* Subheading */}
        <Skeleton className="h-8 w-48 mt-8 mb-4" />

        {/* More paragraphs */}
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={`p2-${i}`} className="space-y-2">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-3/4" />
          </div>
        ))}

        {/* Quote Block */}
        <div className="my-8 pl-6 border-l-4 border-[#e5e5e5]">
          <Skeleton className="h-6 w-full mb-2" />
          <Skeleton className="h-6 w-5/6" />
        </div>

        {/* More content */}
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={`p3-${i}`} className="space-y-2">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-2/3" />
          </div>
        ))}

        {/* Tags */}
        <div className="flex flex-wrap gap-2 pt-6">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-7 w-20 rounded-full" />
          ))}
        </div>
      </div>

      {/* Author Box Skeleton */}
      <div className="max-w-3xl mx-auto mt-12 p-6 bg-[#f6f3ef] rounded-lg">
        <div className="flex items-start gap-4">
          <Skeleton className="h-16 w-16 rounded-full flex-shrink-0" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-5 w-40" />
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-5/6" />
          </div>
        </div>
      </div>
    </article>
  );
}
