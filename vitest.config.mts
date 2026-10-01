import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  resolve: {
    alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) },
  },
  test: {
    include: ['tests/unit/**/*.test.{ts,tsx}', 'tests/api/**/*.test.ts'],
    environment: 'node',
    setupFiles: ['tests/setup.ts'],
    env: {
      SESSION_SECRET: 'test-only-session-secret-0123456789abcdef',
      NEXT_PUBLIC_APP_URL: 'http://localhost:3000',
    },
  },
});
