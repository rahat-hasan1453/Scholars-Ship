// Batch 01 (Step 8–9): flagship government scholarships, the ones students search for most.
// Fill by following docs/SCHOLARSHIP-VERIFICATION.md, then run `npm run data:scholarships:check`.
// Skip anything already in _curated.ts (Chevening, Gates Cambridge, Eiffel, MEXT Research …):
// the checker fails on a repeated officialUrl.
import type { ScholarshipSeed } from './schema';

export const BATCH_01: ScholarshipSeed[] = [];
