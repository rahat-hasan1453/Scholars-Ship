// Fills empty country / institution / rorId on existing opportunities from the ROR index (src/lib/ingest/ror.ts).
// Only empty fields are filled; a value already there is never changed.
//
// Run: npm run data:ror:backfill -- --dry-run   (writes nothing, prints what would change)
//      npm run data:ror:backfill                (writes)
//      npm run data:ror:backfill -- --undo      (countrySource = 'ror' rows: country back to "not stated", rorId cleared)
import { prisma } from '@/lib/prisma';
import { matchInstitution } from '@/lib/ingest/ror';
import { INSTITUTION_NOT_STATED, LOCATION_NOT_STATED } from '@/lib/opportunityDetails';
import { rorFill } from './rorBackfill';

async function undo() {
  const { count } = await prisma.opportunity.updateMany({
    where: { countrySource: 'ror' },
    data: { country: LOCATION_NOT_STATED, countrySource: null, rorId: null },
  });
  console.log(`Undo: reset ${count} rows whose country came from ROR.`);
}

async function main() {
  if (process.argv.includes('--undo')) return undo();
  const dryRun = process.argv.includes('--dry-run');

  const rows = await prisma.opportunity.findMany({
    select: { id: true, title: true, content: true, country: true, institution: true, rorId: true },
    orderBy: { postedAt: 'desc' },
  });
  let countries = 0;
  let institutions = 0;
  let rorIds = 0;
  for (const row of rows) {
    const change = rorFill(row, matchInstitution(row.content));
    if (!change) continue;
    if (change.country) countries++;
    if (change.institution) institutions++;
    if (change.rorId) rorIds++;
    const parts = [
      change.country && `country: ${row.country} → ${change.country}`,
      change.institution && `institution: ${row.institution} → ${change.institution}`,
      change.rorId && !change.institution && `rorId → ${change.rorId}`,
    ].filter(Boolean);
    console.log(`${row.id}  ${row.title.slice(0, 50).padEnd(50)}  ${parts.join('; ')}`);
    if (!dryRun) await prisma.opportunity.update({ where: { id: row.id }, data: change });
  }

  const emptyCountry = rows.filter((r) => r.country === LOCATION_NOT_STATED).length;
  const emptyInstitution = rows.filter((r) => r.institution === INSTITUTION_NOT_STATED).length;
  console.log(`\n${dryRun ? 'Dry run (nothing written)' : 'Written'}: ${rows.length} opportunities`);
  console.log(`  country filled      ${countries} / ${emptyCountry} empty`);
  console.log(`  institution filled  ${institutions} / ${emptyInstitution} empty`);
  console.log(`  rorId set           ${rorIds}`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
