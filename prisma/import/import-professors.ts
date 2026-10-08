// Builds prisma/data/professors.json from real, public sources:
//   - CSRankings (github.com/emeryberger/CSrankings): CS faculty, affiliation, homepage, Google Scholar id, ORCID
//   - OpenAlex (batch ORCID lookup): h-index, works count, OpenAlex id, research topics
//   - NSF Award Search API (US faculty only): latest NSF award as the "recent grant" signal
// Nothing is guessed: a value the sources don't give is left out (null) and the UI hides that row.
//
// Run: npx tsx prisma/import/import-professors.ts
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';

const CACHE = path.join(process.cwd(), '.data-cache', 'csrankings');
const OUT = path.join(process.cwd(), 'prisma', 'data', 'professors.json');
const RAW = 'https://raw.githubusercontent.com/emeryberger/CSrankings/gh-pages';
const MAILTO = 'xyz.brothers99@gmail.com';
const RECENT_FROM = 2019;

// How many institutions per country, ranked by recent CSRankings publication output
const COUNTRY_QUOTA: Record<string, [name: string, institutions: number]> = {
  us: ['USA', 25], gb: ['United Kingdom', 6], de: ['Germany', 6], ca: ['Canada', 5], au: ['Australia', 4],
  nl: ['Netherlands', 4], ch: ['Switzerland', 3], se: ['Sweden', 3], dk: ['Denmark', 2], no: ['Norway', 2],
  fi: ['Finland', 2], at: ['Austria', 2], ie: ['Ireland', 2], be: ['Belgium', 2], fr: ['France', 3],
  it: ['Italy', 2], es: ['Spain', 2], sg: ['Singapore', 2], kr: ['South Korea', 3], jp: ['Japan', 2],
  hk: ['Hong Kong', 2], tw: ['Taiwan', 1], cn: ['China', 3], in: ['India', 2], bd: ['Bangladesh', 3],
  nz: ['New Zealand', 1], pt: ['Portugal', 1], pl: ['Poland', 1], cz: ['Czech Republic', 1],
};
const TOP_PER_INSTITUTION = 12;
const EXTRA_HCI_PER_INSTITUTION = 6;

// CSRankings venue → our Subject filter value (src/data/subjects.ts)
const VENUE_SUBJECT: Record<string, string> = {
  chiconf: 'Human-Computer Interaction (HCI)', uist: 'Human-Computer Interaction (HCI)', ubicomp: 'Human-Computer Interaction (HCI)',
  vis: 'Human-Computer Interaction (HCI)', vr: 'Human-Computer Interaction (HCI)',
  nips: 'Artificial Intelligence', icml: 'Artificial Intelligence', iclr: 'Artificial Intelligence', aaai: 'Artificial Intelligence',
  ijcai: 'Artificial Intelligence', cvpr: 'Artificial Intelligence', iccv: 'Artificial Intelligence', eccv: 'Artificial Intelligence',
  acl: 'Artificial Intelligence', emnlp: 'Artificial Intelligence', naacl: 'Artificial Intelligence',
  kdd: 'Data Science', sigmod: 'Data Science', vldb: 'Data Science', icde: 'Data Science', pods: 'Data Science',
  www: 'Data Science', sigir: 'Data Science',
  ccs: 'Cybersecurity', oakland: 'Cybersecurity', usenixsec: 'Cybersecurity', ndss: 'Cybersecurity', pets: 'Cybersecurity',
  crypto: 'Cybersecurity', eurocrypt: 'Cybersecurity',
  icse: 'Software Engineering', fse: 'Software Engineering', ase: 'Software Engineering', issta: 'Software Engineering',
  pldi: 'Software Engineering', popl: 'Software Engineering', oopsla: 'Software Engineering', icfp: 'Software Engineering',
  icra: 'Robotics', iros: 'Robotics', rss: 'Robotics',
  ismb: 'Biotechnology', recomb: 'Biotechnology',
  ec: 'Economics', wine: 'Economics',
  dac: 'Electrical Engineering', iccad: 'Electrical Engineering', isca: 'Electrical Engineering', micro: 'Electrical Engineering',
  hpca: 'Electrical Engineering', asplos: 'Electrical Engineering',
};
const HCI_VENUES = new Set(['chiconf', 'uist', 'ubicomp']);

type Row = Record<string, string>;

function parseCsv(text: string): Row[] {
  const lines = text.trim().split(/\r?\n/);
  const split = (line: string) => {
    const out: string[] = [];
    let cur = '';
    let q = false;
    for (const ch of line) {
      if (ch === '"') q = !q;
      else if (ch === ',' && !q) {
        out.push(cur);
        cur = '';
      } else cur += ch;
    }
    out.push(cur);
    return out;
  };
  const head = split(lines[0]);
  return lines.slice(1).map((l) => Object.fromEntries(split(l).map((v, i) => [head[i], v])));
}

async function cached(file: string): Promise<string> {
  const p = path.join(CACHE, file);
  if (existsSync(p)) return readFile(p, 'utf8');
  const res = await fetch(`${RAW}/${file}`);
  if (!res.ok) throw new Error(`${file}: HTTP ${res.status}`);
  const text = await res.text();
  await mkdir(CACHE, { recursive: true });
  await writeFile(p, text);
  return text;
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

/** "Jodi Forlizzi 0001" (DBLP disambiguation suffix) → "Jodi Forlizzi" */
const cleanName = (n: string) => n.replace(/\s+\d{4}$/, '').trim();

const slug = (s: string) =>
  s
    .normalize('NFKD')
    .replace(/[^\w\s-]/g, '')
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '-')
    .slice(0, 60);

type OpenAlexAuthor = {
  id: string;
  orcid: string | null;
  works_count: number;
  summary_stats: { h_index: number };
  topics?: { display_name: string }[];
};

async function openAlexByOrcid(orcids: string[]): Promise<Map<string, OpenAlexAuthor>> {
  const found = new Map<string, OpenAlexAuthor>();
  for (let i = 0; i < orcids.length; i += 50) {
    const batch = orcids.slice(i, i + 50);
    const url = `https://api.openalex.org/authors?filter=orcid:${batch.join('|')}&per_page=50&select=id,orcid,works_count,summary_stats,topics&mailto=${MAILTO}`;
    const res = await fetch(url);
    if (!res.ok) {
      console.warn(`[openalex] batch ${i / 50}: HTTP ${res.status}`);
      continue;
    }
    const json = (await res.json()) as { results: OpenAlexAuthor[] };
    for (const a of json.results) if (a.orcid) found.set(a.orcid.replace('https://orcid.org/', ''), a);
    await sleep(150);
  }
  return found;
}

type NsfAward = {
  id: string;
  title: string;
  fundsObligatedAmt?: string;
  estimatedTotalAmt?: string;
  startDate?: string;
  awardeeName?: string;
  piFirstName?: string;
  piLastName?: string;
  piEmail?: string;
};

/** NSF awards where this person is the lead PI at this institution, newest first */
async function nsfAwards(name: string, institution: string): Promise<NsfAward[]> {
  const parts = name.split(' ');
  const last = parts[parts.length - 1];
  const first = parts[0];
  // The API matches pdPIName loosely; a last-name query plus our own first-name/institution check is the reliable form
  const url = `https://api.nsf.gov/services/v1/awards.json?pdPIName=${encodeURIComponent(last)}&rpp=25`;
  try {
    const res = await fetch(url);
    if (!res.ok) return [];
    const json = (await res.json()) as { response?: { award?: NsfAward[] } };
    const inst = institution
      .toLowerCase()
      .split(/[\s,()-]+/)
      .filter((w) => w.length > 3 && !['university', 'institute', 'college', 'technology'].includes(w));
    return (json.response?.award ?? [])
      .filter(
        (a) =>
          a.piLastName?.toLowerCase() === last.toLowerCase() &&
          a.piFirstName?.toLowerCase().slice(0, 3) === first.toLowerCase().slice(0, 3) &&
          (inst.length === 0 || inst.some((w) => a.awardeeName?.toLowerCase().includes(w))),
      )
      .sort((a, b) => toIso(b.startDate).localeCompare(toIso(a.startDate)));
  } catch {
    return [];
  }
}

/** NSF dates are MM/DD/YYYY */
const toIso = (d?: string) => (d ? `${d.slice(6, 10)}-${d.slice(0, 2)}-${d.slice(3, 5)}` : '');

function formatUsd(v?: string): string | null {
  const n = Number(v);
  if (!n) return null;
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1).replace(/\.0$/, '')}M`;
  return `$${Math.round(n / 1000)}K`;
}

async function main() {
  const faculty: Row[] = [];
  for (const c of 'abcdefghijklmnopqrstuvwxyz') faculty.push(...parseCsv(await cached(`csrankings-${c}.csv`)));
  const institutions = parseCsv(await cached('institutions.csv'));
  const pubs = parseCsv(await cached('generated-author-info.csv'));

  const instInfo = new Map(institutions.map((r) => [r.institution, r]));

  // Recent output per author and per (author, subject)
  const score = new Map<string, number>();
  const hci = new Map<string, number>();
  const subjects = new Map<string, Map<string, number>>();
  for (const p of pubs) {
    if (Number(p.year) < RECENT_FROM) continue;
    const key = `${p.name}|${p.dept}`;
    const adj = Number(p.adjustedcount) || 0;
    score.set(key, (score.get(key) ?? 0) + adj);
    if (HCI_VENUES.has(p.area)) hci.set(key, (hci.get(key) ?? 0) + adj);
    const subj = VENUE_SUBJECT[p.area] ?? 'Computer Science';
    const m = subjects.get(key) ?? new Map<string, number>();
    m.set(subj, (m.get(subj) ?? 0) + adj);
    subjects.set(key, m);
  }

  // Rank institutions within each country by total recent output
  const instScore = new Map<string, number>();
  for (const f of faculty) instScore.set(f.affiliation, (instScore.get(f.affiliation) ?? 0) + (score.get(`${f.name}|${f.affiliation}`) ?? 0));
  const chosen = new Set<string>();
  for (const [cc, [, quota]] of Object.entries(COUNTRY_QUOTA)) {
    const ranked = institutions
      .filter((i) => i.countryabbrv === cc)
      .sort((a, b) => (instScore.get(b.institution) ?? 0) - (instScore.get(a.institution) ?? 0))
      .slice(0, quota);
    ranked.forEach((i) => chosen.add(i.institution));
  }

  // Pick the most active faculty per institution, plus extra HCI faculty (the app's core audience)
  const byInst = new Map<string, Row[]>();
  for (const f of faculty) {
    if (!chosen.has(f.affiliation)) continue;
    if (!score.get(`${f.name}|${f.affiliation}`)) continue;
    byInst.set(f.affiliation, [...(byInst.get(f.affiliation) ?? []), f]);
  }
  const picked: Row[] = [];
  for (const list of byInst.values()) {
    const key = (f: Row) => `${f.name}|${f.affiliation}`;
    const top = [...list].sort((a, b) => (score.get(key(b)) ?? 0) - (score.get(key(a)) ?? 0)).slice(0, TOP_PER_INSTITUTION);
    const hciExtra = list
      .filter((f) => !top.includes(f) && (hci.get(key(f)) ?? 0) > 0)
      .sort((a, b) => (hci.get(key(b)) ?? 0) - (hci.get(key(a)) ?? 0))
      .slice(0, EXTRA_HCI_PER_INSTITUTION);
    picked.push(...top, ...hciExtra);
  }
  console.log(`[csrankings] ${chosen.size} institutions, ${picked.length} faculty`);

  const validOrcid = (o: string) => /^\d{4}-\d{4}-\d{4}-\d{3}[\dX]$/.test(o) && o !== '0000-0000-0000-0000';
  const oa = await openAlexByOrcid([...new Set(picked.map((f) => f.orcid).filter(validOrcid))]);
  console.log(`[openalex] matched ${oa.size} authors by ORCID`);

  const out = [];
  let grants = 0;
  for (const f of picked) {
    const info = instInfo.get(f.affiliation)!;
    const country = COUNTRY_QUOTA[info.countryabbrv][0];
    const name = cleanName(f.name);
    const key = `${f.name}|${f.affiliation}`;
    const subj = [...(subjects.get(key) ?? new Map()).entries()].sort((a, b) => b[1] - a[1]).map(([s]) => s);
    const author = validOrcid(f.orcid) ? oa.get(f.orcid) : undefined;
    const topics = (author?.topics ?? []).slice(0, 3).map((t) => t.display_name);

    let grant: { title: string; amount: string; year: number; funder: string; url: string } | null = null;
    let email: string | null = null;
    if (country === 'USA') {
      const awards = await nsfAwards(name, f.affiliation);
      // The PI email on the newest award is the public contact NSF lists for them
      email = awards.find((x) => x.piEmail)?.piEmail?.toLowerCase() ?? null;
      const a = awards[0];
      const amount = formatUsd(a?.fundsObligatedAmt) ?? formatUsd(a?.estimatedTotalAmt);
      // Only a grant that started in the last ~3 years counts as a "recently funded" signal
      if (a && amount && Number(toIso(a.startDate).slice(0, 4)) >= 2023) {
        grant = {
          title: a.title,
          amount,
          year: Number(toIso(a.startDate).slice(0, 4)),
          funder: 'U.S. National Science Foundation (NSF)',
          url: `https://www.nsf.gov/awardsearch/showAward?AWD_ID=${a.id}`,
        };
        grants++;
      }
      await sleep(120);
    }

    out.push({
      id: `prof_${slug(name)}_${slug(f.affiliation).slice(0, 20)}`,
      name,
      university: f.affiliation,
      universityWebsite: info.homepage || null,
      country,
      department: 'Computer Science',
      researchTags: [...new Set([...subj.slice(0, 3), ...topics])].slice(0, 5),
      homepage: f.homepage && f.homepage !== 'NOSCHOLARPAGE' ? f.homepage : null,
      googleScholar: f.scholarid && f.scholarid !== 'NOSCHOLARPAGE' ? `https://scholar.google.com/citations?user=${f.scholarid}` : null,
      orcid: validOrcid(f.orcid) ? f.orcid : null,
      openAlexId: author?.id.replace('https://openalex.org/', '') ?? null,
      hIndex: author?.summary_stats.h_index ?? null,
      publicationCount: author?.works_count ?? null,
      email,
      grant,
    });
  }
  console.log(`[nsf] ${grants} US faculty with an NSF award since 2023`);

  // Same name at the same institution twice (DBLP duplicates): keep the first
  const seen = new Set<string>();
  const unique = out.filter((p) => (seen.has(p.id) ? false : (seen.add(p.id), true)));

  await mkdir(path.dirname(OUT), { recursive: true });
  await writeFile(
    OUT,
    JSON.stringify({ generatedAt: new Date().toISOString(), sources: ['CSRankings', 'OpenAlex', 'NSF Award Search API'], professors: unique }, null, 1),
  );
  console.log(`wrote ${unique.length} professors → ${path.relative(process.cwd(), OUT)}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
