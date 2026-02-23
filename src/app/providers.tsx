'use client';

import type { ReactNode } from 'react';
import { ThemeProvider } from 'next-themes';

import { AuthProvider } from '@/contexts/AuthContext';
import { SearchProvider } from '@/contexts/SearchContext';
import { Toaster } from '@/components/ui/sonner';

interface ProvidersProps {
  children: ReactNode;
}

export function Providers({ children }: ProvidersProps) {
  return (
    <ThemeProvider attribute="class" defaultTheme="light" enableSystem>
      <AuthProvider>
        <SearchProvider>
          {children}
          <Toaster position="top-right" richColors />
        </SearchProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}
