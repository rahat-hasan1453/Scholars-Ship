// OpenAlex researchers outside Computer Science → prisma/data/professors-openalex.json (run by import-openalex-researchers.ts).
// CSRankings only covers CS, so students searching Biology, Economics or Public Health found nobody. This fills those subjects.
//
// Selection rules (nothing guessed; a value OpenAlex or ROR doesn't give stays empty):
// - In the last RECENT_YEARS years the author has at least MIN_RECENT_WORKS works whose primary topic is in the subject
//   (OpenAlex works, grouped by author, filtered to education institutions in one country).
// - h-index and total works at least MIN_H_INDEX / MIN_WORKS_COUNT, so students and very junior authors drop out.
// - A last known institution is an education institution whose ROR id is in our ROR index; university and country come from ROR.
// - Only the COUNTRY_QUOTA countries; at most cellCap() researchers per subject × country.
// - Already in CSRankings (same OpenAlex id or ORCID) → skipped, CSRankings wins. One person is listed under one subject only.
// OpenAlex doesn't say who is a professor, so the title is "Researcher · <subject>", never "Professor".
import { createHash } from 'node:crypto';
import { existsSync } from 'node:fs';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { SUBJECTS, subjectTagsFor } from '../../src/data/subjectCatalog';
import type { RorRecord } from '../../src/lib/ingest/ror';
import { COUNTRY_QUOTA } from './countryQuota';

export const RECENT_YEARS = 3;
export const MIN_RECENT_WORKS = 5;
export const MIN_H_INDEX = 10;
export const MIN_WORKS_COUNT = 20;
/** Bigger research countries get more room: two researchers per COUNTRY_QUOTA institution, at least two */
export const cellCap = (institutions: number) => Math.max(2, 2 * institutions);
export const AUTHORS_PER_REQUEST = 100;
/** Gap between OpenAlex requests (1 a second at most) */
export const REQUEST_GAP_MS = 1000;
const TOPICS_KEPT = 4;

export type Subject = (typeof SUBJECTS)[number];
type Match = { by: 'subfield' | 'topic'; ids: string[] };

/**
 * Our subject → OpenAlex subfields (or topics where no subfield fits, e.g. there is no "Machine Learning" subfield).
 * Ids from api.openalex.org/subfields and /topics, checked 2026-10-28.
 */
export const SUBJECT_OPENALEX: Record<Exclude<Subject, 'Computer Science'>, Match> = {
  'Software Engineering & Distributed Systems': { by: 'subfield', ids: ['1712'] }, // Software
  'Artificial Intelligence': { by: 'subfield', ids: ['1702'] },
  // Machine Learning and Algorithms, ... and Data Classification, Adversarial Robustness, Multimodal ML Applications
  'Machine Learning': { by: 'topic', ids: ['T12072', 'T12535', 'T11689', 'T11714'] },
  'Data Science & Analytics': { by: 'subfield', ids: ['2613', '1804'] }, // Statistics and Probability; Statistics, Probability and Uncertainty
  'Human-Computer Interaction (HCI)': { by: 'subfield', ids: ['1709'] },
  // Usability and User Interface Design, Innovative Human-Technology Interaction
  'UX & Product Design': { by: 'topic', ids: ['T10470', 'T10803'] },
  'Human Factors': { by: 'subfield', ids: ['3307'] }, // Human Factors and Ergonomics
  'Information Systems': { by: 'subfield', ids: ['1710'] },
  // Network Security and Intrusion Detection, Information and Cyber Security, Cybersecurity and Information Systems, Security in WSNs
  Cybersecurity: { by: 'topic', ids: ['T10400', 'T10734', 'T13983', 'T11498'] },
  // Robotic Mechanisms and Dynamics, Robot Manipulation and Learning, Robotics and Sensor-Based Localization, RL in Robotics
  'Robotics & Autonomous Systems': { by: 'topic', ids: ['T10571', 'T10653', 'T10191', 'T10462'] },
  'Electrical & Computer Engineering': { by: 'subfield', ids: ['2208'] }, // Electrical and Electronic Engineering
  'Mechanical & Aerospace Engineering': { by: 'subfield', ids: ['2210', '2202'] },
  'Materials Science & Nanotechnology': { by: 'subfield', ids: ['2505', '2504'] }, // Materials Chemistry; Electronic, Optical and Magnetic Materials
  'Biomedical Engineering': { by: 'subfield', ids: ['2204'] },
  // Bioinformatics and Genomic Networks, Machine Learning in Bioinformatics, Electronic Health Records Systems
  'Biomedical Informatics': { by: 'topic', ids: ['T10887', 'T12254', 'T10350'] },
  'Biotechnology & Genomics': { by: 'subfield', ids: ['1305', '1311'] }, // Biotechnology; Genetics
  'Neuroscience & Neurotechnology': { by: 'subfield', ids: ['2805', '2804'] }, // Cognitive; Cellular and Molecular Neuroscience
  'Public Health & Epidemiology': { by: 'subfield', ids: ['2739', '2713'] },
  'Economics & Quantitative Finance': { by: 'subfield', ids: ['2002', '2003'] }, // Economics and Econometrics; Finance
  'Public Policy & Governance': { by: 'subfield', ids: ['3321', '3320'] }, // Public Administration; Political Science and IR
};

export type OpenAlexAuthor = {
  id: string;
  orcid: string | null;
  display_name: string;
  works_count: number;
  summary_stats: { h_index: number };
  last_known_institutions?: { ror: string | null; display_name: string; country_code: string | null; type: string | null }[] | null;
  topics?: { display_name: string }[];
};

/** One OpenAlex group_by row: an author and how many recent works in the subject */
export type Candidate = { authorId: string; recentWorks: number };

export type ResearcherSeed = {
  id: string;
  name: string;
  title: string;
  university: string;
  universityWebsite: null;
  country: string;
  department: string;
  researchTags: string[];
  homepage: string;
  googleScholar: null;
  orcid: string | null;
  openAlexId: string;
  hIndex: number;
  publicationCount: number;
  email: null;
  grant: null;
  dataSource: 'OpenAlex';
  /** Works in this subject in the last RECENT_YEARS years (why they were picked) */
  recentSubjectWorks: number;
};

const shortId = (id: string) => id.replace('https://openalex.org/', '');
const shortOrcid = (o: string | null) => o?.replace('https://orcid.org/', '') ?? null;

export function fromDate(today: Date): string {
  const d = new Date(today);
  d.setUTCFullYear(d.getUTCFullYear() - RECENT_YEARS);
  return d.toISOString().slice(0, 10);
}

/** Authors with the most recent works in a subject at education institutions of one country */
export function groupUrl(subject: keyof typeof SUBJECT_OPENALEX, countryCode: string, from: string, mailto: string): string {
  const m = SUBJECT_OPENALEX[subject];
  const key = m.by === 'subfield' ? 'primary_topic.subfield.id' : 'primary_topic.id';
  return (
    `https://api.openalex.org/works?filter=${key}:${m.ids.join('|')},from_publication_date:${from},` +
    `authorships.institutions.country_code:${countryCode},authorships.institutions.type:education` +
    `&group_by=authorships.author.id&per_page=200&mailto=${mailto}`
  );
}

export function authorsUrl(ids: string[], mailto: string): string {
  return (
    `https://api.openalex.org/authors?filter=openalex:${ids.join('|')}&per_page=${AUTHORS_PER_REQUEST}` +
    `&select=id,orcid,display_name,works_count,summary_stats,last_known_institutions,topics&mailto=${mailto}`
  );
}

/** The first last-known education institution that is in our ROR index and one of our countries */
export function pickInstitution(author: OpenAlexAuthor, rorById: Map<string, RorRecord>, countries: Set<string>): RorRecord | null {
  for (const inst of author.last_known_institutions ?? []) {
    if (inst.type !== 'education' || !inst.ror) continue;
    const record = rorById.get(inst.ror);
    if (record && !record.nonHost && countries.has(record.country)) return record;
  }
  return null;
}

/** Passes the h-index / works floor (drops students and very junior authors) */
export const seniorEnough = (a: OpenAlexAuthor) => a.summary_stats.h_index >= MIN_H_INDEX && a.works_count >= MIN_WORKS_COUNT;

export function toResearcher(author: OpenAlexAuthor, subject: string, inst: RorRecord, recentWorks: number): ResearcherSeed {
  const openAlexId = shortId(author.id);
  const orcid = shortOrcid(author.orcid);
  const topics = (author.topics ?? []).slice(0, TOPICS_KEPT).map((t) => t.display_name);
  return {
    id: `oa_${openAlexId}`,
    name: author.display_name,
    title: `Researcher · ${subject}`,
    university: inst.name,
    universityWebsite: null,
    country: inst.country,
    department: subject,
    // The subject first so the Faculty filter always finds them, then their OpenAlex topics and any subject those name
    researchTags: [...new Set([subject, ...topics, ...subjectTagsFor(topics)])],
    homepage: orcid ? `https://orcid.org/${orcid}` : `https://openalex.org/${openAlexId}`,
    googleScholar: null,
    orcid,
    openAlexId,
    hIndex: author.summary_stats.h_index,
    publicationCount: author.works_count,
    email: null,
    grant: null,
    dataSource: 'OpenAlex',
    recentSubjectWorks: recentWorks,
  };
}

export type SelectInput = {
  /** subject → country code → group_by rows, most recent works first */
  groups: Map<string, Map<string, Candidate[]>>;
  /** Looks up authors by short OpenAlex id (A123…); only called for candidates that pass the works rule */
  getAuthors: (ids: string[]) => Promise<Map<string, OpenAlexAuthor>>;
  rorById: Map<string, RorRecord>;
  /** OpenAlex ids and ORCIDs already in professors.json (CSRankings) */
  existing: { openAlexIds: Set<string>; orcids: Set<string> };
};

export type SelectResult = { researchers: ResearcherSeed[]; counts: Map<string, Map<string, number>> };

/** Applies the rules subject by subject, country by country; fetches authors in batches only until each cell is full */
export async function selectResearchers({ groups, getAuthors, rorById, existing }: SelectInput): Promise<SelectResult> {
  const countries = new Set(Object.values(COUNTRY_QUOTA).map(([name]) => name));
  const taken = new Set<string>();
  const researchers: ResearcherSeed[] = [];
  const counts = new Map<string, Map<string, number>>();

  for (const [subject, byCountry] of groups) {
    const row = new Map<string, number>();
    counts.set(subject, row);
    for (const [cc, candidates] of byCountry) {
      const [countryName, institutions] = COUNTRY_QUOTA[cc];
      const cap = cellCap(institutions);
      const eligible = candidates.filter((c) => c.recentWorks >= MIN_RECENT_WORKS && !taken.has(shortId(c.authorId)));
      let picked = 0;
      for (let i = 0; i < eligible.length && picked < cap; i += AUTHORS_PER_REQUEST) {
        const batch = eligible.slice(i, i + AUTHORS_PER_REQUEST);
        const authors = await getAuthors(batch.map((c) => shortId(c.authorId)));
        for (const c of batch) {
          if (picked >= cap) break;
          const id = shortId(c.authorId);
          const a = authors.get(id);
          if (!a || taken.has(id) || !seniorEnough(a)) continue;
          if (existing.openAlexIds.has(id) || (a.orcid && existing.orcids.has(shortOrcid(a.orcid)!))) continue;
          const inst = pickInstitution(a, rorById, countries);
          // Co-authors from abroad show up in a country's group too; they count only where they are based
          if (!inst || inst.country !== countryName) continue;
          taken.add(id);
          researchers.push(toResearcher(a, subject, inst, c.recentWorks));
          picked++;
        }
      }
      row.set(countryName, picked);
    }
  }
  return { researchers, counts };
}

/** OpenAlex JSON with an on-disk cache, at most one request a second, and a retry on 429 */
export function createOpenAlexClient({ cacheDir, gapMs = REQUEST_GAP_MS, retryMs = 5000, fetchFn = fetch, log = console.warn }: {
  cacheDir: string;
  gapMs?: number;
  retryMs?: number;
  fetchFn?: typeof fetch;
  log?: (msg: string) => void;
}) {
  let last = 0;
  const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
  return async function getJson<T>(url: string): Promise<T> {
    // The mailto doesn't change the answer, so it isn't part of the cache key
    const key = createHash('sha1').update(url.replace(/&mailto=[^&]*/, '')).digest('hex');
    const file = path.join(cacheDir, `${key}.json`);
    if (existsSync(file)) return JSON.parse(await readFile(file, 'utf8')) as T;
    for (let attempt = 0; ; attempt++) {
      const wait = last + gapMs - Date.now();
      if (wait > 0) await sleep(wait);
      last = Date.now();
      const res = await fetchFn(url);
      if (res.ok) {
        const json = (await res.json()) as T;
        await mkdir(cacheDir, { recursive: true });
        await writeFile(file, JSON.stringify(json));
        return json;
      }
      // 429 is the rate limit or the day's budget, 5xx a busy server: wait and retry, then stop (the cache keeps what's done for the next run)
      if ((res.status === 429 || res.status >= 500) && attempt < 3) {
        log(`[openalex] ${res.status}, retrying in ${(retryMs * (attempt + 1)) / 1000}s`);
        await sleep(retryMs * (attempt + 1));
        continue;
      }
      throw new Error(`OpenAlex HTTP ${res.status}: ${url.slice(0, 160)}`);
    }
  };
}
