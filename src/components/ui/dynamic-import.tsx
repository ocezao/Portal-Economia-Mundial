/**
 * Componentes com Dynamic Import otimizados
 * Reduzem o tamanho do bundle inicial
 */

import dynamic from 'next/dynamic';
import { Skeleton } from './skeleton';

// Recharts - Componentes de gráficos (pesados)
export const DynamicChart = dynamic(
  () => import('recharts').then((mod) => mod.ResponsiveContainer),
  {
    loading: () => <Skeleton className="h-[300px] w-full rounded-lg" />,
    ssr: false,
  }
);

// Survey Form (médio, usado em dialogs)
export const DynamicSurveyForm = dynamic(
  () => import('@/components/interactive/SurveyForm').then((mod) => mod.SurveyForm),
  {
    loading: () => <Skeleton className="h-[200px] w-full rounded-lg" />,
    ssr: false,
  }
);

// Admin Dashboard (muito pesado)
export const DynamicAdminDashboard = dynamic(
  () => import('@/app/(site)/admin/page').then((mod) => mod.default),
  {
    loading: () => (
      <div className="p-6 space-y-4">
        <Skeleton className="h-12 w-full" />
        <div className="grid grid-cols-4 gap-4">
          <Skeleton className="h-24" />
          <Skeleton className="h-24" />
          <Skeleton className="h-24" />
          <Skeleton className="h-24" />
        </div>
        <Skeleton className="h-[400px] w-full" />
      </div>
    ),
    ssr: false,
  }
);

// Intersection Observer Lazy Wrapper
export { LazyLoad } from '@/hooks/useIntersectionObserver';
