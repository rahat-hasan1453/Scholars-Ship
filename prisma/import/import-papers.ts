// Builds prisma/data/papers.json: recent, most-cited papers written by the faculty in prisma/data/professors.json.
// Source: OpenAlex works API (filtered by the professors' OpenAlex author ids). Authors who are in our
// faculty list are linked by professorId so the paper shows up on their profile.
//
// Run after import-professors: npx tsx prisma/import/import-papers.ts
import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fetchWorks, workToPaper } from '../../src/lib/papers/openalex';

const PROFESSORS = path.join(process.cwd(), 'prisma', 'data', 'professors.json');
const OUT = path.join(process.cwd(), 'prisma', 'data', 'papers.json');
const FROM_DATE = '2025-01-01';
const PER_BATCH = 12;

async function main() {
  const { professors } = JSON.parse(await readFile(PROFESSORS, 'utf8')) as {
    professors: { id: string; openAlexId: string | null }[];
  };
  const profByAuthor = new Map(professors.filter((p) => p.openAlexId).map((p) => [p.openAlexId!, p.id]));

  const works = await fetchWorks([...profByAuthor.keys()], { fromDate: FROM_DATE, perPage: PER_BATCH });
  const papers = [...works.values()].flatMap((w) => workToPaper(w, profByAuthor) ?? []);
  papers.sort((a, b) => b.citationCount - a.citationCount);

  await writeFile(OUT, JSON.stringify({ generatedAt: new Date().toISOString(), sources: ['OpenAlex'], papers }, null, 1));
  console.log(`wrote ${papers.length} papers → ${path.relative(process.cwd(), OUT)}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
