import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src'),
    },
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['src/__tests__/test.setup.ts'],
    include: ['src/**/*.test.{ts,tsx}'],
    // Run tests in-process to avoid worker memory limit issues in CI/local runs
    threads: false,
  },
});
