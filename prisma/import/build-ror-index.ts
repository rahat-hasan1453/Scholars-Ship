// Build prisma/data/ror-index.json.gz from the latest ROR data dump on Zenodo (CC0).
// Keeps only active education / facility / government / nonprofit organisations (companies dropped),
// with the fields the matcher needs. Run: npm run data:ror:build  (or -- --zip <file> to skip the download)
import { execFileSync } from 'node:child_process';
import { existsSync, mkdirSync, readdirSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { gzipSync } from 'node:zlib';
import { WORLD_COUNTRIES } from '../../src/data/countries';
import type { RorIndexFile, RorIndexRow } from '../../src/lib/ingest/ror';

// Zenodo "concept" record for ROR Data; /versions/latest always points at the newest release
const CONCEPT_RECORD = 'https://zenodo.org/api/records/6347574/versions/latest';
const OUT = path.join(process.cwd(), 'prisma/data/ror-index.json.gz');
const CACHE = path.join(os.tmpdir(), 'ror-dump-cache');
// Zenodo refuses requests without a recognisable User-Agent
const HEADERS = { 'User-Agent': 'ScholarsShip-ror-index/1.0 (+https://ror.org)', Accept: 'application/json' };
const KEEP_TYPES = new Set(['education', 'facility', 'government', 'nonprofit']);

interface RorName {
  value: string;
  types: string[];
}
interface RorDumpRecord {
  id: string;
  status: string;
  types: string[];
  names: RorName[];
  locations: { geonames_details: { country_code: string; country_name: string; name: string } }[];
}

// ROR country code → the country value the app uses ("US" → "USA"); other countries keep ROR's name
const COUNTRY_BY_CODE = new Map(WORLD_COUNTRIES.filter((c) => c.value !== 'ALL').map((c) => [c.code, c.value]));

async function downloadLatest(): Promise<{ zip: string; version: string }> {
  const res = await fetch(CONCEPT_RECORD, { headers: HEADERS });
  if (!res.ok) throw new Error(`Zenodo lookup failed: ${res.status}`);
  const rec = (await res.json()) as { files: { key: string; links: { self: string } }[] };
  const file = rec.files.find((f) => f.key.endsWith('.zip'));
  if (!file) throw new Error('No zip file in the latest ROR release');
  mkdirSync(CACHE, { recursive: true });
  const zip = path.join(CACHE, file.key);
  if (!existsSync(zip)) {
    console.log(`Downloading ${file.key} …`);
    let dl = await fetch(file.links.self, { headers: { 'User-Agent': HEADERS['User-Agent'] } });
    // Zenodo sometimes answers 5xx for big files; a short wait usually fixes it
    for (let attempt = 1; dl.status >= 500 && attempt < 3; attempt++) {
      console.log(`Zenodo answered ${dl.status}, retrying …`);
      await new Promise((r) => setTimeout(r, 5000 * attempt));
      dl = await fetch(file.links.self, { headers: { 'User-Agent': HEADERS['User-Agent'] } });
    }
    if (!dl.ok) throw new Error(`Download failed: ${dl.status}`);
    writeFileSync(zip, Buffer.from(await dl.arrayBuffer()));
  }
  return { zip, version: file.key.replace(/-ror-data\.zip$/, '') };
}

function readDump(zip: string): RorDumpRecord[] {
  const dir = path.join(CACHE, path.basename(zip, '.zip'));
  mkdirSync(dir, { recursive: true });
  execFileSync('unzip', ['-o', '-q', zip, '*.json', '-d', dir]);
  const json = readdirSync(dir).find((f) => f.endsWith('.json'));
  if (!json) throw new Error('No JSON file inside the ROR zip');
  return JSON.parse(readFileSync(path.join(dir, json), 'utf8')) as RorDumpRecord[];
}

function toRow(r: RorDumpRecord): RorIndexRow | undefined {
  const display = r.names.find((n) => n.types.includes('ror_display'))?.value;
  const loc = r.locations[0]?.geonames_details;
  if (!display || !loc) return undefined;
  const aliases = r.names
    .filter((n) => !n.types.includes('ror_display') && (n.types.includes('label') || n.types.includes('alias')))
    .map((n) => n.value);
  const acronyms = r.names.filter((n) => n.types.includes('acronym')).map((n) => n.value);
  const country = COUNTRY_BY_CODE.get(loc.country_code) ?? loc.country_name;
  return [r.id.replace('https://ror.org/', ''), display, country, loc.name ?? '', [...new Set(aliases)], [...new Set(acronyms)]];
}

async function main() {
  const zipArg = process.argv.indexOf('--zip');
  const { zip, version } =
    zipArg > -1
      ? { zip: process.argv[zipArg + 1], version: path.basename(process.argv[zipArg + 1]).replace(/-ror-data\.zip$/, '') }
      : await downloadLatest();

  const dump = readDump(zip);
  const records = dump
    .filter((r) => r.status === 'active' && r.types.some((t) => KEEP_TYPES.has(t)))
    .map(toRow)
    .filter((r): r is RorIndexRow => !!r);

  const file: RorIndexFile = {
    source: 'ROR Data (https://ror.org), CC0, via Zenodo',
    version,
    generatedAt: new Date().toISOString(),
    records,
  };
  writeFileSync(OUT, gzipSync(JSON.stringify(file), { level: 9 }));
  const mb = (statSync(OUT).size / 1024 / 1024).toFixed(1);
  console.log(`ROR ${version}: ${dump.length} in dump → ${records.length} kept. Wrote ${path.relative(process.cwd(), OUT)} (${mb} MB)`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
