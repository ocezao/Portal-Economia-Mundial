import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  test: {
    environment: 'jsdom',
    setupFiles: ['./tests/setup.ts'],
    include: ['tests/unit/**/*.{test,spec}.{ts,tsx}', 'tests/integration/**/*.{test,spec}.{ts,tsx}', 'src/**/*.{test,spec}.{ts,tsx}'],
    coverage: {
      reporter: ['text', 'json', 'html'],
      lines: 60,
      functions: 60,
      branches: 50,
      statements: 60,
      exclude: [
        'node_modules/',
        'tests/',
        'tests/e2e/',
        '**/*.d.ts',
        '**/*.config.*',
        '**/mcp-server/**',
        '**/collector/**',
      ],
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
});
