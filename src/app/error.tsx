'use client';

import { useEffect } from 'react';
import { logger } from '@/lib/logger';

export default function ErrorPage({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    logger.error('[AppError]', error?.message);

    // Best-effort reporting (does not throw).
    try {
      void fetch('/api/telemetry/error', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          message: error?.message || 'Unknown error',
          stack: error?.stack,
          digest: error?.digest,
          url: typeof window !== 'undefined' ? window.location.href : undefined,
          pathname: typeof window !== 'undefined' ? window.location.pathname : undefined,
        }),
      });
    } catch {
      // ignore
    }
  }, [error]);

  return (
    <main className="min-h-screen flex items-center justify-center px-4">
      <section className="max-w-md w-full border rounded-xl p-6 bg-white">
        <h1 className="text-xl font-bold text-[#111111]">Algo deu errado</h1>
        <p className="mt-2 text-sm text-[#6b6b6b]">
          Tente recarregar a página. Se o erro persistir, volte mais tarde.
        </p>
        <button
          type="button"
          onClick={() => reset()}
          className="mt-4 inline-flex items-center justify-center px-4 py-2 bg-[#111111] text-white rounded"
        >
          Tentar novamente
        </button>
      </section>
    </main>
  );
}
