// The rule behind `npm run data:ror:backfill` (backfill-ror.ts). Kept apart from the CLI so tests can run it.
import { INSTITUTION_NOT_STATED, LOCATION_NOT_STATED } from '../../src/lib/opportunityDetails';
import type { RorMatch } from '../../src/lib/ingest/ror';

export type BackfillRow = { id: string; country: string; institution: string; rorId: string | null };
export type BackfillChange = { country?: string; countrySource?: 'ror'; institution?: string; rorId?: string };

/** What to write for one row: only empty fields are filled, a value already there is never changed */
export function rorFill(row: BackfillRow, match: RorMatch | undefined): BackfillChange | undefined {
  if (!match) return undefined;
  const change: BackfillChange = {};
  if (row.country === LOCATION_NOT_STATED && match.country) {
    change.country = match.country;
    change.countrySource = 'ror';
  }
  if (row.institution === INSTITUTION_NOT_STATED && match.name) change.institution = match.name;
  if (!row.rorId && match.rorId) change.rorId = match.rorId;
  return Object.keys(change).length ? change : undefined;
}
