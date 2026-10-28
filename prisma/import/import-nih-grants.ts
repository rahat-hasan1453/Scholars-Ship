// Latest NIH award for our US faculty → prisma/data/grants-nih.json (the "Recently funded" signal, like the NSF one).
// Source: NIH RePORTER API (public, no key). One request per professor, at most 1 a second.
// A professor gets a grant only when last name, start of first name and institution all match (see nihMatch.ts).
//
// Run: npx tsx prisma/import/import-nih-grants.ts [--limit 50]
import { createHash } from 'node:crypto';
import { existsSync } from 'node:fs';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { latestAward, toGrant, type NihGrantSeed, type NihProject } from './nihMatch';

const DATA = path.join(process.cwd(), 'prisma', 'data');
const CACHE = path.join(process.cwd(), '.data-cache', 'nih-grants');
const OUT = path.join(DATA, 'grants-nih.json');
const API = 'https://api.reporter.nih.gov/v2/projects/search';
const FROM_YEAR = new Date().getFullYear() - 3;
const GAP_MS = 1100;

interface Prof {
  id: string;
  name: string;
  university: string;
  country: string;
  grant?: unknown;
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

async function search(lastName: string): Promise<NihProject[]> {
  const body = {
    criteria: { pi_names: [{ last_name: lastName }], fiscal_years: Array.from({ length: new Date().getFullYear() - FROM_YEAR + 1 }, (_, i) => FROM_YEAR + i) },
    include_fields: ['ProjectTitle', 'PrincipalInvestigators', 'Organization', 'AwardAmount', 'FiscalYear', 'ProjectDetailUrl', 'ProjectNum'],
    limit: 500,
    sort_field: 'fiscal_year',
    sort_order: 'desc',
  };
  const key = path.join(CACHE, createHash('sha1').update(JSON.stringify(body)).digest('hex') + '.json');
  if (existsSync(key)) return JSON.parse(await readFile(key, 'utf8')) as NihProject[];
  for (let attempt = 0; attempt < 3; attempt++) {
    await sleep(GAP_MS);
    try {
      const res = await fetch(API, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
      if (res.status === 429 || res.status >= 500) {
        await sleep(5000 * (attempt + 1));
        continue;
      }
      if (!res.ok) return [];
      const json = (await res.json()) as { results?: NihProject[] };
      const results = json.results ?? [];
      await mkdir(CACHE, { recursive: true });
      await writeFile(key, JSON.stringify(results));
      return results;
    } catch {
      await sleep(3000);
    }
  }
  return [];
}

async function main() {
  const limitArg = process.argv.indexOf('--limit');
  const limit = limitArg > -1 ? Number(process.argv[limitArg + 1]) : Infinity;
  const files = ['professors.json', 'professors-openalex.json'];
  const all: Prof[] = [];
  for (const f of files) all.push(...(JSON.parse(await readFile(path.join(DATA, f), 'utf8')) as { professors: Prof[] }).professors);
  // US faculty that don't already have an NSF award
  const todo = all.filter((p) => p.country === 'USA' && !p.grant).slice(0, limit);
  console.log(`Searching NIH for ${todo.length} US faculty (${FROM_YEAR} onwards)...`);

  const grants: NihGrantSeed[] = [];
  const byLast = new Map<string, NihProject[]>();
  let done = 0;
  for (const p of todo) {
    const last = p.name.trim().split(/\s+/).slice(-1)[0];
    if (!byLast.has(last)) byLast.set(last, await search(last));
    const award = latestAward(p, byLast.get(last)!);
    if (award) grants.push(toGrant(p.id, award));
    if (++done % 100 === 0) console.log(`  ${done}/${todo.length}, ${grants.length} grants so far`);
  }
  await writeFile(OUT, JSON.stringify({ generatedAt: new Date().toISOString(), source: 'NIH RePORTER', grants }, null, 1) + '\n');
  console.log(`Wrote ${grants.length} grants for ${todo.length} faculty to ${path.relative(process.cwd(), OUT)}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
