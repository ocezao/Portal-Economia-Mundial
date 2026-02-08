/**
 * Wrapper com Dynamic Import para EarningsCalendar
 * Reduz o tamanho do bundle inicial
 */

'use client';

import dynamic from 'next/dynamic';
import { Skeleton } from '@/components/ui/skeleton';
import type { EarningsCalendarProps } from './EarningsCalendar';

// Dynamic import com loading skeleton
const EarningsCalendar = dynamic(
  () => import('./EarningsCalendar').then((mod) => mod.EarningsCalendar),
  {
    loading: () => (
      <div className="bg-white border border-[#e5e5e5] rounded-xl p-4 sm:p-6">
        <div className="flex items-center gap-2 mb-4">
          <Skeleton className="w-5 h-5 rounded" />
          <Skeleton className="h-5 w-32" />
        </div>
        <div className="space-y-4">
          <Skeleton className="h-20 w-full" />
          <Skeleton className="h-20 w-full" />
          <Skeleton className="h-20 w-full" />
        </div>
      </div>
    ),
    ssr: false, // Desabilitar SSR para reduzir carga no servidor
  }
);

export { EarningsCalendar };
export type { EarningsCalendarProps };
