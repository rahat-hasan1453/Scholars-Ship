// Vercel build: on PRODUCTION deploys, sync the database schema and seed data before building,
// so new tables/columns from merged PRs reach the live DB without manual steps.
// Preview deploys and local builds skip the database and just build.
// - `prisma db push` has no --accept-data-loss, so a destructive change fails instead of deleting data.
// - Seeding is an idempotent upsert. Set SKIP_DB_SEED=1 in Vercel once real (non-mock) data lives in the DB.
// - If the DB step fails the build still runs (the app falls back to mock data); the log shows a warning.
import { spawnSync } from 'node:child_process';

const run = (cmd, args) => spawnSync(cmd, args, { stdio: 'inherit', shell: false }).status === 0;

if (process.env.VERCEL_ENV === 'production' && process.env.DATABASE_URL) {
  console.log('[vercel-build] production: syncing database schema');
  let ok = run('npx', ['prisma', 'db', 'push', '--skip-generate']);
  if (ok && process.env.SKIP_DB_SEED !== '1') {
    console.log('[vercel-build] production: seeding');
    ok = run('npx', ['tsx', 'prisma/seed.ts']);
  }
  if (!ok) console.warn('\n[vercel-build] WARNING: database sync/seed FAILED. Deploying anyway; the app uses mock data until this is fixed.\n');
} else {
  console.log(`[vercel-build] skipping database sync (VERCEL_ENV=${process.env.VERCEL_ENV ?? 'unset'})`);
}

if (!run('npx', ['next', 'build', '--webpack'])) process.exit(1);
