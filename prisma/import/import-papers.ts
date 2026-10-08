// Builds prisma/data/papers.json: recent, most-cited papers written by the faculty in prisma/data/professors.json.
// Source: OpenAlex works API (filtered by the professors' OpenAlex author ids). Authors who are in our
// faculty list are linked by professorId so the paper shows up on their profile.
//
// Run after import-professors: npx tsx prisma/import/import-papers.ts
import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';

const PROFESSORS = path.join(process.cwd(), 'prisma', 'data', 'professors.json');
const OUT = path.join(process.cwd(), 'prisma', 'data', 'papers.json');
const MAILTO = 'xyz.brothers99@gmail.com';
const FROM_DATE = '2024-01-01';
const PER_BATCH = 12;

type Work = {
  id: string;
  doi: string | null;
  title: string | null;
  publication_date: string | null;
  publication_year: number | null;
  type: string | null;
  cited_by_count: number;
  abstract_inverted_index: Record<string, number[]> | null;
  primary_location: { source: { display_name: string | null } | null } | null;
  best_oa_location: { pdf_url: string | null; landing_page_url: string | null } | null;
  open_access: { is_oa: boolean; oa_url: string | null } | null;
  primary_topic: { display_name: string; subfield?: { display_name: string }; field?: { display_name: string } } | null;
  keywords?: { display_name: string }[];
  authorships: { author: { id: string | null; display_name: string }; institutions: { display_name: string }[] }[];
  grants?: { funder_display_name: string; award_id: string | null }[];
};

/** OpenAlex stores abstracts as word → positions; rebuild the plain text */
function abstractText(index: Record<string, number[]> | null): string | null {
  if (!index) return null;
  const words: string[] = [];
  for (const [w, positions] of Object.entries(index)) for (const p of positions) words[p] = w;
  const text = words.filter(Boolean).join(' ').replace(/\s+/g, ' ').trim();
  return text.length >= 80 ? text : null;
}

const PAPER_TYPE: Record<string, string> = {
  article: 'Journal article',
  'proceedings-article': 'Conference paper',
  preprint: 'Preprint',
  review: 'Review',
  'book-chapter': 'Book chapter',
};

async function main() {
  const { professors } = JSON.parse(await readFile(PROFESSORS, 'utf8')) as {
    professors: { id: string; openAlexId: string | null }[];
  };
  const profByAuthor = new Map(professors.filter((p) => p.openAlexId).map((p) => [p.openAlexId!, p.id]));
  const authorIds = [...profByAuthor.keys()];

  const works = new Map<string, Work>();
  for (let i = 0; i < authorIds.length; i += 50) {
    const batch = authorIds.slice(i, i + 50);
    const url =
      `https://api.openalex.org/works?filter=author.id:${batch.join('|')},from_publication_date:${FROM_DATE},has_abstract:true` +
      `&sort=cited_by_count:desc&per_page=${PER_BATCH}&mailto=${MAILTO}`;
    const res = await fetch(url);
    if (!res.ok) {
      console.warn(`[openalex] batch ${i / 50}: HTTP ${res.status}`);
      continue;
    }
    const json = (await res.json()) as { results: Work[] };
    for (const w of json.results) works.set(w.id, w);
    await new Promise((r) => setTimeout(r, 150));
  }

  const papers = [];
  for (const w of works.values()) {
    const abstract = abstractText(w.abstract_inverted_index);
    if (!w.title || !abstract) continue;
    const doi = w.doi?.replace('https://doi.org/', '') ?? null;
    const fields = [w.primary_topic?.field?.display_name, w.primary_topic?.subfield?.display_name].filter(
      (x): x is string => !!x,
    );
    const grant = w.grants?.find((g) => g.funder_display_name);
    papers.push({
      id: `paper_${w.id.split('/').pop()}`,
      openAlexId: w.id.split('/').pop(),
      title: w.title.replace(/<[^>]+>/g, ''),
      abstract,
      year: w.publication_year,
      publishedAt: w.publication_date,
      venue: w.primary_location?.source?.display_name ?? null,
      citationCount: w.cited_by_count,
      doi,
      pdfUrl: w.best_oa_location?.pdf_url ?? null,
      isOpenAccess: !!w.open_access?.is_oa,
      paperType: (w.type && PAPER_TYPE[w.type]) ?? null,
      fieldsOfStudy: [...new Set(fields)],
      tags: [w.primary_topic?.display_name, ...(w.keywords ?? []).slice(0, 3).map((k) => k.display_name)].filter(
        (x): x is string => !!x,
      ),
      funding: grant ? [grant.funder_display_name, grant.award_id].filter(Boolean).join(' ') : null,
      institution: w.authorships[0]?.institutions[0]?.display_name ?? null,
      authors: w.authorships.slice(0, 12).map((a, position) => ({
        position,
        name: a.author.display_name,
        institution: a.institutions[0]?.display_name ?? null,
        professorId: (a.author.id && profByAuthor.get(a.author.id.split('/').pop()!)) || null,
      })),
    });
  }
  papers.sort((a, b) => b.citationCount - a.citationCount);

  await writeFile(OUT, JSON.stringify({ generatedAt: new Date().toISOString(), sources: ['OpenAlex'], papers }, null, 1));
  console.log(`wrote ${papers.length} papers → ${path.relative(process.cwd(), OUT)}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
