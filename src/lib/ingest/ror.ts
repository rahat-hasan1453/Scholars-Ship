// Find the institution (and its country) a post names, using the ROR registry (https://ror.org).
// Data comes from prisma/data/ror-index.json.gz, built by `npm run data:ror:build`. No network calls.
// The rules are strict on purpose: an empty country is fine, a wrong one is not.
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { gunzipSync } from 'node:zlib';

export interface RorRecord {
  /** Full ROR id, e.g. https://ror.org/04ers2y35 */
  id: string;
  name: string;
  /** Country value as used in src/data/countries.ts (e.g. "USA", "United Kingdom") */
  country: string;
  city: string;
  /** Labels and aliases other than the main name */
  aliases: string[];
  acronyms: string[];
}

export interface RorMatch {
  rorId: string;
  name: string;
  /** Empty when the post names institutions in different countries */
  country?: string;
  city: string;
}

/** Compact on-disk row: [id suffix, name, country, city, aliases, acronyms] */
export type RorIndexRow = [string, string, string, string, string[], string[]];

export interface RorIndexFile {
  source: string;
  version: string;
  generatedAt: string;
  records: RorIndexRow[];
}

// Words that never identify an institution on their own ("Institute", "Graduate School", "University of Science")
const GENERIC = new Set(
  ('university universitat universite universiteit universidad universidade universita universitet uniwersytet '
    + 'institute institut instituto istituto college school center centre academy laboratory laboratories lab faculty '
    + 'department research science sciences technology national international state graduate medical medicine hospital '
    + 'foundation society council agency office technical applied polytechnic open free public federal central royal new '
    + 'city community global studies advanced higher education ministry association organization organisation programme '
    + 'program group network museum library observatory team unit division project consortium initiative systems data '
    + 'health energy environment engineering business management arts art design law economics')
    .split(' '),
);
// Small words allowed to be lowercase inside a name ("University of Bremen", "King's College")
const FILLER = new Set('of the and for in at on de du des la le les fur und di del della y et e van von der den do da s'.split(' '));

/** Lowercase, strip accents, keep letters/digits: "Universität" → "universitat" */
export function normToken(t: string): string {
  return t.normalize('NFD').replace(/\p{M}/gu, '').replace(/ß/g, 'ss').toLowerCase().replace(/[^\p{L}\p{N}]/gu, '');
}

export function tokens(text: string): string[] {
  return text.split(/[^\p{L}\p{N}]+/u).filter(Boolean);
}

export function normName(name: string): string {
  // "The University of Melbourne" is written "University of Melbourne" just as often
  return tokens(name).map(normToken).filter(Boolean).join(' ').replace(/^the /, '');
}

const isCapitalised = (t: string) => /^[\p{Lu}\p{N}]/u.test(t);

// Capitals that are degree or job words, not institutions
const COMMON_CAPS = new Set('PHD MSC BSC MBA DPHIL POSTDOC CEO USA NEW AND THE FOR ALL JOB JOBS HIRING OPEN APPLY NOW CV FAQ STEM HCI'.split(' '));
// Well-known acronyms trusted on their own. Any other acronym needs the institution's city or country
// in the post too: "NERC E5 DTP" is a UK Doctoral Training Partnership, not Australia's Department of Transport
const KNOWN_ACRONYMS = new Set('MIT KTH EPFL RWTH KAUST KAIST UNIGE INRIA'.split(' '));
const isAllCaps = (t: string) => t === t.toUpperCase() && /\p{Lu}/u.test(t);
/** "FULLY FUNDED PHD AT ..." is shouting, not acronyms: a long all-caps neighbour gives it away */
function shouted(orig: string[], i: number): boolean {
  return [orig[i - 1], orig[i + 1]].some((t) => t !== undefined && t.length >= 5 && isAllCaps(t));
}

export function rowToRecord([id, name, country, city, aliases, acronyms]: RorIndexRow): RorRecord {
  return { id: `https://ror.org/${id}`, name, country, city, aliases, acronyms };
}

interface Hit {
  start: number;
  end: number;
  record: RorRecord;
}

export function createRorMatcher(records: RorRecord[]): (text: string) => RorMatch | undefined {
  // normalised full name → records that carry it; whether it is someone's main name
  const byName = new Map<string, { record: RorRecord; main: boolean }[]>();
  const byAcronym = new Map<string, RorRecord[]>();
  let maxWords = 1;

  for (const record of records) {
    const seen = new Set<string>();
    for (const [i, raw] of [record.name, ...record.aliases].entries()) {
      const key = normName(raw);
      if (!key || seen.has(key)) continue;
      seen.add(key);
      const words = key.split(' ');
      // One-word names ("Focus", "Zero", "Interaction") are too often ordinary words
      if (words.length < 2) continue;
      // Rule 5: names made only of generic words never match
      if (words.every((w) => GENERIC.has(w) || FILLER.has(w))) continue;
      maxWords = Math.max(maxWords, words.length);
      const list = byName.get(key) ?? [];
      list.push({ record, main: i === 0 });
      byName.set(key, list);
    }
    for (const acr of new Set(record.acronyms)) {
      const list = byAcronym.get(acr) ?? [];
      if (!list.includes(record)) list.push(record);
      byAcronym.set(acr, list);
    }
  }

  /** One record for a name, or undefined when it is shared by several institutions */
  function pickByName(key: string): RorRecord | undefined {
    const list = byName.get(key);
    if (!list) return undefined;
    if (list.length === 1) return list[0].record;
    const main = list.filter((e) => e.main);
    return main.length === 1 ? main[0].record : undefined;
  }

  return (text: string) => {
    const words = [...text.matchAll(/[\p{L}\p{N}]+/gu)];
    const orig = words.map((m) => m[0]);
    const norm = orig.map(normToken);
    // "#ZMB" and "@DIFFER" are hashtags and handles, not institutions
    const tagged = words.map((m) => m.index > 0 && '#@'.includes(text[m.index - 1]));
    const normText = ` ${norm.join(' ')} `;
    const mentions = (place: string) => !!normName(place) && normText.includes(` ${normName(place)} `);
    let hits: Hit[] = [];

    for (let i = 0; i < orig.length; i++) {
      // Rule 2: full names and aliases, on word boundaries
      for (let n = Math.min(maxWords, orig.length - i); n >= 2; n--) {
        const key = norm.slice(i, i + n).join(' ');
        const record = pickByName(key);
        if (!record) continue;
        const span = orig.slice(i, i + n);
        // Real names are written capitalised; "open university position" is not a name
        if (!span.every((t, k) => FILLER.has(norm[i + k]) || isCapitalised(t))) continue;
        hits.push({ start: i, end: i + n, record });
        break; // longest at this start position
      }
      // Rule 3: acronyms only in capitals, 3+ letters, owned by exactly one institution, not a hashtag
      const t = orig[i];
      if (t.length >= 3 && isAllCaps(t) && !COMMON_CAPS.has(t) && !tagged[i] && !shouted(orig, i)) {
        const owners = byAcronym.get(t);
        if (owners?.length === 1) hits.push({ start: i, end: i + 1, record: owners[0] });
      }
    }
    // A full name is stronger evidence than an acronym: once any full name matched, keep only
    // acronyms of those same institutions ("SAIL" for a Stanford lab is also an Indian steel company)
    const named = new Set(hits.filter((h) => h.end - h.start > 1).map((h) => h.record));
    if (named.size) hits = hits.filter((h) => h.end - h.start > 1 || named.has(h.record));
    // An acronym alone counts only if well known or backed by the institution's city or country
    hits = hits.filter((h) => h.end - h.start > 1 || named.has(h.record) || KNOWN_ACRONYMS.has(orig[h.start])
      || mentions(h.record.city) || mentions(h.record.country));
    if (!hits.length) return undefined; // Rule 6

    // Longest match wins; drop matches inside it ("University of Munich" inside "Technical University of Munich")
    hits.sort((a, b) => b.end - b.start - (a.end - a.start) || a.start - b.start);
    const kept: Hit[] = [];
    for (const h of hits) {
      if (!kept.some((k) => h.start < k.end && k.start < h.end)) kept.push(h);
    }
    kept.sort((a, b) => a.start - b.start);

    // Rule 4: first institution mentioned; country only if every named institution agrees
    const first = kept[0].record;
    const countries = new Set(kept.map((h) => h.record.country).filter(Boolean));
    return {
      rorId: first.id,
      name: first.name,
      country: countries.size === 1 && first.country ? first.country : undefined,
      city: first.city,
    };
  };
}

/**
 * Which country to store: the one the post states wins; ROR's only fills a gap.
 * countrySource records where it came from, so ROR-derived values can be redone later.
 */
export function resolveCountry(
  postCountry: string | undefined,
  match: RorMatch | undefined,
): { country?: string; countrySource?: 'post' | 'ror' } {
  if (postCountry) return { country: postCountry, countrySource: 'post' };
  if (match?.country) return { country: match.country, countrySource: 'ror' };
  return {};
}

export const ROR_INDEX_PATH = path.join(process.cwd(), 'prisma/data/ror-index.json.gz');

let defaultMatcher: ((text: string) => RorMatch | undefined) | undefined;

export function loadRorIndex(file = ROR_INDEX_PATH): RorRecord[] {
  const data = JSON.parse(gunzipSync(readFileSync(file)).toString('utf8')) as RorIndexFile;
  return data.records.map(rowToRecord);
}

/** Match against the bundled ROR index (loaded once, then kept in memory) */
export function matchInstitution(text: string): RorMatch | undefined {
  defaultMatcher ??= createRorMatcher(loadRorIndex());
  return defaultMatcher(text);
}
