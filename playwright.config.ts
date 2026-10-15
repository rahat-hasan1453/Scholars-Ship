import { existsSync, readFileSync } from 'node:fs';
import { parseEnv } from 'node:util';
import { defineConfig, devices } from '@playwright/test';

// The test database (never the dev or production one): from the shell/CI, else from .env.local. See docs/TECH-GUIDE.md "e2e tests".
process.env.E2E_DATABASE_URL ??= existsSync('.env.local') ? parseEnv(readFileSync('.env.local', 'utf8')).E2E_DATABASE_URL : undefined;
if (!process.env.E2E_DATABASE_URL) {
  throw new Error('E2E_DATABASE_URL is not set. Start the test database with `npm run test:e2e:db` and add its URL to .env.local (docs/TECH-GUIDE.md, "e2e tests").');
}

// E2E_PORT lets parallel worktrees run their own dev server instead of reusing another checkout's
const PORT = Number(process.env.E2E_PORT ?? 3100);
const desktop = { viewport: { width: 1728, height: 1117 } };

export default defineConfig({
  testDir: 'tests/e2e',
  globalSetup: './tests/e2e/global-setup.ts',
  fullyParallel: true,
  // Dev server compiles pages on first hit, which occasionally races in Firefox; one retry absorbs that. Flaky = reported.
  retries: 1,
  reporter: [['list'], ['html', { open: 'never', outputFolder: 'playwright-report' }]],
  use: { baseURL: `http://localhost:${PORT}`, trace: 'retain-on-failure', screenshot: 'only-on-failure' },
  projects: [
    { name: 'chromium-desktop', use: { ...devices['Desktop Chrome'], ...desktop } },
    { name: 'chromium-mobile', use: { ...devices['Pixel 7'], viewport: { width: 375, height: 812 } } },
    { name: 'firefox-desktop', use: { ...devices['Desktop Firefox'], ...desktop } },
    { name: 'webkit-desktop', use: { ...devices['Desktop Safari'], ...desktop } },
  ],
  webServer: {
    command: `npx next dev --webpack -p ${PORT}`,
    url: `http://localhost:${PORT}/login`,
    timeout: 180_000,
    // Locally a running server is reused; it must have been started against the test database too
    reuseExistingServer: !process.env.CI,
    // Test-only values; all /api/auth calls are mocked in the browser, so no email or Google is used.
    // Server-rendered pages read the e2e test database (seeded by tests/e2e/global-setup.ts).
    // NEXT_PUBLIC_AUTH_METHOD=code: tests/e2e/auth.spec.ts covers the emailed-code sign-in. Password mode is covered by tests/api.
    env: { SESSION_SECRET: 'test-only-session-secret-0123456789abcdef', NEXT_PUBLIC_APP_URL: `http://localhost:${PORT}`, NEXT_PUBLIC_AUTH_METHOD: 'code', DATABASE_URL: process.env.E2E_DATABASE_URL },
  },
});
