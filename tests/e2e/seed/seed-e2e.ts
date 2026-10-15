// Empties the e2e test database and fills it with tests/e2e/seed/e2e-data.ts.
// Called by tests/e2e/global-setup.ts; refuses to run unless seed-guard.ts says the database is a safe test one.
import { existsSync, readFileSync } from 'node:fs';
import { parseEnv } from 'node:util';
import { PrismaClient } from '@prisma/client';
import { assertSafeE2eDatabase } from './seed-guard';
import { e2eData } from './e2e-data';

/** DATABASE_URL from .env.local (the dev database), so the guard can refuse to seed over it */
export function devDatabaseUrl(file = '.env.local') {
  if (process.env.DATABASE_URL) return process.env.DATABASE_URL;
  return existsSync(file) ? parseEnv(readFileSync(file, 'utf8')).DATABASE_URL : undefined;
}

export async function seedE2e(url: string | undefined, env: Record<string, string | undefined> = process.env) {
  assertSafeE2eDatabase(url, env, devDatabaseUrl());
  const prisma = new PrismaClient({ datasources: { db: { url } } });
  try {
    // Every table, user data included, so each run starts from the same state
    const tables = await prisma.$queryRaw<{ tablename: string }[]>`SELECT tablename FROM pg_tables WHERE schemaname = 'public' AND tablename <> '_prisma_migrations'`;
    if (tables.length) await prisma.$executeRawUnsafe(`TRUNCATE ${tables.map((t) => `"public"."${t.tablename}"`).join(', ')} CASCADE`);

    const d = e2eData();
    await prisma.scholarship.createMany({ data: d.scholarships });
    await prisma.university.createMany({ data: d.universities });
    await prisma.researchLab.createMany({ data: d.labs });
    await prisma.professor.createMany({ data: d.professors });
    await prisma.grant.createMany({ data: d.grants });
    await prisma.opportunity.createMany({ data: d.opportunities });
    await prisma.researchPaper.createMany({ data: d.papers });
    await prisma.paperAuthor.createMany({ data: d.paperAuthors });
    return { scholarships: d.scholarships.length, professors: d.professors.length, opportunities: d.opportunities.length, papers: d.papers.length };
  } finally {
    await prisma.$disconnect();
  }
}
