// Prints how much data the catalogue holds and how complete it is. Read-only: it never writes.
// Use it before and after a data task and put both numbers in the PR.
// Run: npm run data:stats
import { prisma } from '@/lib/prisma';
import { INSTITUTION_NOT_STATED, LOCATION_NOT_STATED } from '@/lib/opportunityDetails';

const STALE_DAYS = 180;

const line = (label: string, value: number | string) => console.log(`  ${label.padEnd(34)} ${String(value).padStart(6)}`);
const heading = (title: string) => console.log(`\n${title}`);

async function main() {
  const staleBefore = new Date(Date.now() - STALE_DAYS * 86_400_000);

  heading('Opportunities');
  const [total, bySource, noCountry, noInstitution, noDeadline, noSubject] = await Promise.all([
    prisma.opportunity.count(),
    prisma.opportunity.groupBy({ by: ['source'], _count: { _all: true } }),
    prisma.opportunity.count({ where: { country: LOCATION_NOT_STATED } }),
    prisma.opportunity.count({ where: { institution: INSTITUTION_NOT_STATED } }),
    prisma.opportunity.count({ where: { deadline: null } }),
    prisma.opportunity.count({ where: { subjectTags: { isEmpty: true } } }),
  ]);
  line('total', total);
  for (const row of bySource.sort((a, b) => b._count._all - a._count._all)) line(`  source: ${row.source}`, row._count._all);
  line('country not stated', noCountry);
  line('institution not stated', noInstitution);
  line('no deadline', noDeadline);
  line('no subject tag', noSubject);

  heading('Scholarships');
  const [schTotal, schStale, schNeverChecked] = await Promise.all([
    prisma.scholarship.count(),
    prisma.scholarship.count({ where: { verifiedAt: { lt: staleBefore } } }),
    prisma.scholarship.count({ where: { verifiedAt: null } }),
  ]);
  line('total', schTotal);
  line(`verified more than ${STALE_DAYS} days ago`, schStale);
  line('never verified', schNeverChecked);

  heading('Faculty');
  line('professors', await prisma.professor.count());
  line('universities', await prisma.university.count());

  heading('Research papers');
  const [paperTotal, byYear] = await Promise.all([
    prisma.researchPaper.count(),
    prisma.researchPaper.groupBy({ by: ['year'], _count: { _all: true }, orderBy: { year: 'desc' } }),
  ]);
  line('total', paperTotal);
  for (const row of byYear) line(`  year: ${row.year ?? 'unknown'}`, row._count._all);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
