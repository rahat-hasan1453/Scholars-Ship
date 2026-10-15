// Before the e2e run: push the Prisma schema to the test database, then fill it with the e2e seed.
// The dev server (playwright.config.ts webServer) reads the same E2E_DATABASE_URL.
import { execFileSync } from 'node:child_process';
import { assertSafeE2eDatabase } from './seed/seed-guard';
import { devDatabaseUrl, seedE2e } from './seed/seed-e2e';

export default async function globalSetup() {
  const url = process.env.E2E_DATABASE_URL;
  const env = { ...process.env, E2E_DB: '1' };
  // Check before db push too: a push to the wrong database can drop columns
  assertSafeE2eDatabase(url, env, devDatabaseUrl());

  execFileSync('npx', ['prisma', 'db', 'push', '--skip-generate', '--accept-data-loss'], {
    env: { ...env, DATABASE_URL: url },
    stdio: 'inherit',
  });
  const counts = await seedE2e(url, env);
  console.log('[e2e] test database seeded:', counts);
}
