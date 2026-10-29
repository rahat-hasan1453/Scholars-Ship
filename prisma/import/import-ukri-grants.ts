// Latest UKRI grant (EPSRC, BBSRC, MRC, ...) for our UK faculty → prisma/data/grants-ukri.json ("Recently funded").
// Source: UKRI Gateway to Research API (public, no key). At most 1 request a second, cached.
// A professor gets a grant only when last name, start of first name and employer all match (ukriMatch.ts).
//
// Run: npx tsx prisma/import/import-ukri-grants.ts [--limit 30]
import { createHash } from 'node:crypto';
import { existsSync } from 'node:fs';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fundStart, idOf, latestProject, linksOf, namedLike, sameInstitution, toGrant, type GtrPerson, type GtrProject, type UkriGrantSeed } from './ukriMatch';

const DATA = path.join(process.cwd(), 'prisma', 'data');
const CACHE = path.join(process.cwd(), '.data-cache', 'ukri-grants');
const OUT = path.join(DATA, 'grants-ukri.json');
const API = 'https://gtr.ukri.org/gtr/api';
const FROM_YEAR = new Date().getFullYear() - 4;
const GAP_MS = 1100;
const MAX_PROJECTS_PER_PERSON = 8;
const UA = 'ScholarsShip/1.0 (xyz.brothers99@gmail.com)';

interface Prof {
  id: string;
  name: string;
  university: string;
  country: string;
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

async function get<T>(url: string): Promise<T | null> {
  const key = path.join(CACHE, createHash('sha1').update(url).digest('hex') + '.json');
  if (existsSync(key)) return JSON.parse(await readFile(key, 'utf8')) as T;
  for (let attempt = 0; attempt < 3; attempt++) {
    await sleep(GAP_MS);
    try {
      const res = await fetch(url, { headers: { Accept: 'application/json', 'User-Agent': UA } });
      if (res.status === 429 || res.status >= 500) {
        await sleep(5000 * (attempt + 1));
        continue;
      }
      if (!res.ok) return null;
      const json = (await res.json()) as T;
      await mkdir(CACHE, { recursive: true });
      await writeFile(key, JSON.stringify(json));
      return json;
    } catch {
      await sleep(3000);
    }
  }
  return null;
}

const orgNames = new Map<string, string | undefined>();
async function orgName(id: string) {
  if (!orgNames.has(id)) orgNames.set(id, (await get<{ name?: string }>(`${API}/organisations/${id}`))?.name);
  return orgNames.get(id);
}

async function grantFor(p: Prof): Promise<UkriGrantSeed | undefined> {
  const found = await get<{ person?: GtrPerson[] }>(`${API}/persons?q=${encodeURIComponent(p.name)}&s=25`);
  const people = namedLike(p, found?.person ?? []);
  const projects: GtrProject[] = [];
  for (const person of people) {
    const employer = linksOf(person, 'EMPLOYED')[0];
    if (!employer || !sameInstitution(p, await orgName(idOf(employer)))) continue;
    for (const href of linksOf(person, 'PI_PER').slice(0, MAX_PROJECTS_PER_PERSON)) {
      const project = await get<GtrProject>(`${API}/projects/${idOf(href)}`);
      if (project) projects.push(project);
    }
  }
  const best = latestProject(projects, FROM_YEAR);
  if (!best) return undefined;
  const fundHref = (best.links?.link ?? []).find((l) => l.rel === 'FUND' && l.start === fundStart(best))?.href;
  const fund = fundHref ? await get<{ valuePounds?: { amount?: number } | string }>(fundHref) : null;
  const amount = typeof fund?.valuePounds === 'object' ? fund.valuePounds?.amount : undefined;
  return amount ? toGrant(p.id, best, amount) : undefined;
}

async function main() {
  const limitArg = process.argv.indexOf('--limit');
  const limit = limitArg > -1 ? Number(process.argv[limitArg + 1]) : Infinity;
  const all: Prof[] = [];
  for (const f of ['professors.json', 'professors-openalex.json']) all.push(...(JSON.parse(await readFile(path.join(DATA, f), 'utf8')) as { professors: Prof[] }).professors);
  const todo = all.filter((p) => p.country === 'United Kingdom').slice(0, limit);
  console.log(`Searching UKRI for ${todo.length} UK faculty (projects from ${FROM_YEAR})...`);
  const grants: UkriGrantSeed[] = [];
  let done = 0;
  for (const p of todo) {
    const g = await grantFor(p);
    if (g) grants.push(g);
    if (++done % 25 === 0) console.log(`  ${done}/${todo.length}, ${grants.length} grants so far`);
  }
  await writeFile(OUT, JSON.stringify({ generatedAt: new Date().toISOString(), source: 'UKRI Gateway to Research', grants }, null, 1) + '\n');
  console.log(`Wrote ${grants.length} grants for ${todo.length} faculty to ${path.relative(process.cwd(), OUT)}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
