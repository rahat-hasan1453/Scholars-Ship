// Snapshots current student position ads from Mastodon and Bluesky into prisma/data/opportunities.json,
// so a fresh database is seeded with real listings. /api/cron/opportunities keeps them fresh after that.
//
// Run: npx tsx prisma/import/import-opportunities.ts
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fetchAllOpportunities } from '@/lib/ingest';

const OUT = path.join(process.cwd(), 'prisma', 'data', 'opportunities.json');

async function main() {
  const opportunities = await fetchAllOpportunities();
  await mkdir(path.dirname(OUT), { recursive: true });
  await writeFile(
    OUT,
    JSON.stringify({ generatedAt: new Date().toISOString(), sources: ['Mastodon public tag timelines', 'Bluesky public search'], opportunities }, null, 1),
  );
  console.log(`wrote ${opportunities.length} opportunities → ${path.relative(process.cwd(), OUT)}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
