// Every scholarship the seed writes. Each batch file is reviewed in its own PR; reverting one file
// removes its entries on the next seed (seedScholarships deletes rows that are no longer here).
// A new batch: add the file, then one line to BATCHES.
import { CURATED } from './_curated';
import { BATCH_01 } from './batch-01-flagship';
import { BATCH_02 } from './batch-02-europe';
import { BATCH_04 } from './batch-04-americas-africa-intl';
import type { ScholarshipSeed } from './schema';

export { ALL_FIELDS, type ScholarshipSeed } from './schema';

/** Day the curated entries were checked against their sources, unless an entry has its own verifiedOn */
export const CURATED_VERIFIED_ON = '2026-10-09';

export const CURATED_SCHOLARSHIPS: ScholarshipSeed[] = CURATED.map((s) => ({ ...s, verifiedOn: s.verifiedOn ?? CURATED_VERIFIED_ON }));

/** File name → entries, so the checker can say where a problem is */
export const BATCHES: Record<string, ScholarshipSeed[]> = {
  'batch-01-flagship.ts': BATCH_01,
  'batch-02-europe.ts': BATCH_02,
  'batch-04-americas-africa-intl.ts': BATCH_04,
};

export const SCHOLARSHIPS: ScholarshipSeed[] = [...CURATED_SCHOLARSHIPS, ...Object.values(BATCHES).flat()];
