/**
 * Barra de progresso de rolagem
 * Exibe uma barra vermelha no topo da página indicando o progresso da leitura
 */

'use client';

import { useEffect, useState } from 'react';
import { useScrollProgress } from '@/hooks/useScrollProgress';

export function ScrollProgress() {
  // Avoid hydration mismatch by rendering nothing on the server/first paint.
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const progress = useScrollProgress();

  if (!mounted) return null;

  return (
    <div 
      className="fixed top-0 left-0 right-0 h-[3px] bg-[#e5e5e5] z-[300]"
      role="progressbar"
      aria-valuenow={Math.round(progress)}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label="Progresso de leitura da página"
    >
      <div 
        className="h-full bg-[#c40000] transition-all duration-150 ease-out"
        style={{ width: `${progress}%` }}
      />
    </div>
  );
}
