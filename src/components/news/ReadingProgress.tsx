/**
 * Barra de Progresso de Leitura
 * Fixada no topo da página
 */

import { useReadingProgress } from '@/hooks/useReadingProgress';

interface ReadingProgressProps {
  articleSlug: string;
}

export function ReadingProgress({ articleSlug }: ReadingProgressProps) {
  const { progress } = useReadingProgress(articleSlug);

  return (
    <aside 
      className="fixed top-0 left-0 right-0 h-[3px] bg-[#e5e5e5] z-[300]"
      aria-label="Progresso de leitura"
      role="progressbar"
      aria-valuenow={progress}
      aria-valuemin={0}
      aria-valuemax={100}
    >
      <span 
        className="block h-full bg-[#c40000] transition-all duration-100"
        style={{ width: `${progress}%` }}
      />
    </aside>
  );
}
