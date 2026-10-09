// Prints what students searched for and found nothing, so we know which data sources to add next.
// Run: npm run data:misses            (last 30 days)
//      npm run data:misses -- 7       (last 7 days)
import { prisma } from '@/lib/prisma';

const days = Number(process.argv[2] ?? 30);

function top(values: string[], n = 15): [string, number][] {
  const counts = new Map<string, number>();
  for (const v of values) counts.set(v, (counts.get(v) ?? 0) + 1);
  return [...counts].sort((a, b) => b[1] - a[1]).slice(0, n);
}

async function main() {
  const since = new Date(Date.now() - days * 86_400_000);
  const rows = await prisma.searchMiss.findMany({ where: { createdAt: { gte: since } } });
  console.log(`${rows.length} empty searches in the last ${days} days`);
  const show = (title: string, values: string[]) => {
    console.log(`\n${title}`);
    for (const [v, c] of top(values)) console.log(`  ${String(c).padStart(5)}  ${v}`);
  };
  show('By page', rows.map((r) => r.page));
  show('Subjects', rows.flatMap((r) => r.subjects));
  show('Countries', rows.flatMap((r) => r.countries));
  show('Degrees', rows.flatMap((r) => r.degrees));
  show('Search words', rows.map((r) => r.query.toLowerCase()).filter(Boolean));
  show('Subject × country', rows.flatMap((r) => r.subjects.flatMap((s) => (r.countries.length ? r.countries : ['any country']).map((c) => `${s} — ${c}`))));
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
