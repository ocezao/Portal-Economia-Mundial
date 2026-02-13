/**
 * Loading Auth Pages
 * Componente de loading para páginas de autenticação (login, cadastro)
 */

import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[#f6f3ef] px-4 py-12">
      <div className="w-full max-w-md space-y-8">
        {/* Logo */}
        <div className="text-center">
          <Skeleton className="h-10 w-32 mx-auto mb-2" />
          <Skeleton className="h-4 w-48 mx-auto" />
        </div>

        {/* Form Card */}
        <div className="bg-white p-8 rounded-2xl shadow-sm border border-[#e5e5e5] space-y-6">
          {/* Title */}
          <div className="text-center space-y-2">
            <Skeleton className="h-8 w-40 mx-auto" />
            <Skeleton className="h-4 w-64 mx-auto" />
          </div>

          {/* Form Fields */}
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
              <Skeleton className="h-4 w-16" />
              <Skeleton className="h-12 w-full rounded-lg" />
            </div>
          </div>

          {/* Submit Button */}
          <Skeleton className="h-12 w-full rounded-full" />

          {/* Divider */}
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-[#e5e5e5]" />
            </div>
            <Skeleton className="relative h-4 w-32 mx-auto bg-white" />
          </div>

          {/* Social Login */}
          <Skeleton className="h-12 w-full rounded-full" />

          {/* Footer Links */}
          <div className="flex items-center justify-between pt-2">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-4 w-24" />
          </div>
        </div>
      </div>
    </div>
  );
}
