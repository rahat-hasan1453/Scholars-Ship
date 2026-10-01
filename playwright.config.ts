import { defineConfig, devices } from '@playwright/test';

const PORT = 3100;
const desktop = { viewport: { width: 1728, height: 1117 } };

export default defineConfig({
  testDir: 'tests/e2e',
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
    reuseExistingServer: true,
    // Test-only values; all /api/auth calls are mocked in the browser, so no DB, email or Google is used.
    env: { SESSION_SECRET: 'test-only-session-secret-0123456789abcdef', NEXT_PUBLIC_APP_URL: `http://localhost:${PORT}` },
  },
});
