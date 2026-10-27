// Regenerate tests/fixtures/ror-golden-index.json from the full ROR index.
// Keeps every ROR record whose name, alias or acronym appears in a golden post, so the matcher
// (including its "is this acronym shared?" checks) behaves exactly as it would on the full index.
// Run after `npm run data:ror:build`: npx tsx tests/helpers/buildRorGoldenFixture.ts
import { writeFileSync } from 'node:fs';
import path from 'node:path';
import { loadRorIndex, normName, tokens } from '../../src/lib/ingest/ror';
import { ROR_GOLDEN_POSTS } from '../fixtures/rorGolden';

const texts = ROR_GOLDEN_POSTS.map((p) => ({ norm: ` ${normName(p.text)} `, words: new Set(tokens(p.text)) }));
const records = loadRorIndex().filter((r) =>
  [r.name, ...r.aliases].some((n) => {
    const key = normName(n);
    return key.includes(' ') && texts.some((t) => t.norm.includes(` ${key} `));
  }) || r.acronyms.some((a) => texts.some((t) => t.words.has(a))),
);

const out = path.join(process.cwd(), 'tests/fixtures/ror-golden-index.json');
writeFileSync(out, `${JSON.stringify(records, null, 1)}\n`);
console.log(`Wrote ${records.length} records to ${path.relative(process.cwd(), out)}`);
