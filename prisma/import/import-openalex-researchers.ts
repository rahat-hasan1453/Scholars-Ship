// Builds prisma/data/professors-openalex.json: researchers outside Computer Science, from OpenAlex (CC0) only.
// Rules and the subject → OpenAlex map live in ./openalexResearchers.ts. professors.json (CSRankings) is not touched.
// Responses are cached in .data-cache/openalex-researchers, so a run stopped by OpenAlex's daily budget resumes where it stopped.
//
// Run: npm run data:researchers:build
import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { MAILTO } from '../../src/lib/papers/openalex';
import { loadRorIndex } from '../../src/lib/ingest/ror';
import { COUNTRY_QUOTA } from './countryQuota';
import {
  type Candidate,
  type OpenAlexAuthor,
  SUBJECT_OPENALEX,
  authorsUrl,
  createOpenAlexClient,
  fromDate,
  groupUrl,
  selectResearchers,
} from './openalexResearchers';

const DATA = path.join(process.cwd(), 'prisma', 'data');
const OUT = path.join(DATA, 'professors-openalex.json');
const CACHE = path.join(process.cwd(), '.data-cache', 'openalex-researchers');
/** Fixed so cached answers stay valid across days; move it forward for a fresh snapshot */
const SNAPSHOT = new Date('2026-10-28T00:00:00Z');

async function main() {
  const getJson = createOpenAlexClient({ cacheDir: CACHE });
  const from = fromDate(SNAPSHOT);

  const { professors } = JSON.parse(await readFile(path.join(DATA, 'professors.json'), 'utf8')) as {
    professors: { openAlexId: string | null; orcid: string | null }[];
  };
  const existing = {
    openAlexIds: new Set(professors.map((p) => p.openAlexId).filter((x): x is string => !!x)),
    orcids: new Set(professors.map((p) => p.orcid).filter((x): x is string => !!x)),
  };
  const rorById = new Map(loadRorIndex().map((r) => [r.id, r]));

  const groups = new Map<string, Map<string, Candidate[]>>();
  for (const subject of Object.keys(SUBJECT_OPENALEX) as (keyof typeof SUBJECT_OPENALEX)[]) {
    const byCountry = new Map<string, Candidate[]>();
    for (const cc of Object.keys(COUNTRY_QUOTA)) {
      const json = await getJson<{ group_by: { key: string; count: number }[] }>(groupUrl(subject, cc, from, MAILTO));
      byCountry.set(cc, json.group_by.filter((g) => g.key.startsWith('https://openalex.org/A')).map((g) => ({ authorId: g.key, recentWorks: g.count })));
    }
    groups.set(subject, byCountry);
    console.log(`[groups] ${subject}`);
  }

  const getAuthors = async (ids: string[]) => {
    const json = await getJson<{ results: OpenAlexAuthor[] }>(authorsUrl(ids, MAILTO));
    return new Map(json.results.map((a) => [a.id.replace('https://openalex.org/', ''), a]));
  };
  const { researchers, counts } = await selectResearchers({ groups, getAuthors, rorById, existing });

  // Subject × country table for the PR
  const names = Object.values(COUNTRY_QUOTA).map(([n]) => n);
  console.log(['subject', ...names, 'total'].join('\t'));
  for (const [subject, row] of counts) {
    const cells = names.map((n) => row.get(n) ?? 0);
    console.log([subject, ...cells, cells.reduce((a, b) => a + b, 0)].join('\t'));
  }

  await writeFile(
    OUT,
    JSON.stringify(
      { generatedAt: new Date().toISOString(), snapshot: SNAPSHOT.toISOString().slice(0, 10), sources: ['OpenAlex', 'ROR'], professors: researchers },
      null,
      1,
    ),
  );
  console.log(`wrote ${researchers.length} researchers → ${path.relative(process.cwd(), OUT)}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
