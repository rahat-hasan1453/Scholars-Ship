// Every scholarship the seed writes. Each batch file is reviewed in its own PR; reverting one file
// removes its entries on the next seed (seedScholarships deletes rows that are no longer here).
// A new batch: add the file, then one line to BATCHES.
import { CURATED } from './_curated';
import { BATCH_01 } from './batch-01-flagship';
import type { ScholarshipSeed } from './schema';

export { ALL_FIELDS, type ScholarshipSeed } from './schema';

/** Day the 24 curated entries were checked against their sources */
export const CURATED_VERIFIED_ON = '2026-10-09';

export const CURATED_SCHOLARSHIPS: ScholarshipSeed[] = CURATED.map((s) => ({ ...s, verifiedOn: CURATED_VERIFIED_ON }));

/** File name → entries, so the checker can say where a problem is */
export const BATCHES: Record<string, ScholarshipSeed[]> = {
  'batch-01-flagship.ts': BATCH_01,
};

export const SCHOLARSHIPS: ScholarshipSeed[] = [...CURATED_SCHOLARSHIPS, ...Object.values(BATCHES).flat()];
