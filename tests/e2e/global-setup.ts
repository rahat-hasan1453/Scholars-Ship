// Before the e2e run: push the Prisma schema to the test database, then fill it with the e2e seed.
// The dev server (playwright.config.ts webServer) reads the same E2E_DATABASE_URL.
import { execFileSync } from 'node:child_process';
import { assertSafeE2eDatabase } from './seed/seed-guard';
import { devDatabaseUrl, seedE2e } from './seed/seed-e2e';
import { E2E_IDS } from './ids';

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

  // The dev server compiles a page the first time it is opened, which made first visits slow and flaky.
  // Open every kind of page once now, so the specs start against compiled pages. Failures here don't matter.
  const base = `http://localhost:${process.env.E2E_PORT ?? 3100}`;
  const paths = ['/login', '/onboarding', '/', `/scholarships/${E2E_IDS.scholarship}`, `/opportunities/${E2E_IDS.opportunity}`, `/professors/${E2E_IDS.professor}`,
    '/api/scholarships', '/api/opportunities', '/api/professors', '/api/research/papers'];
  await Promise.all(paths.map((p) => fetch(base + p).catch(() => undefined)));
}
