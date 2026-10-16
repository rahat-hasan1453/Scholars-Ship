// Checks every scholarship in prisma/data/scholarships before a batch PR: zod rules, duplicate ids and
// officialUrls, verifiedOn older than a year, then every officialUrl/sourceUrl (robots.txt respected,
// one request per second). Exits 1 on any error; warnings only print.
//
// Run: npm run data:scholarships:check            (all checks, ~2 s per link)
//      npm run data:scholarships:check -- --offline  (skip the link check)
import { BATCHES, CURATED_SCHOLARSHIPS } from '../data/scholarships';
import { checkEntries, checkLinks, type Problem } from './scholarshipCheck';

async function main() {
  const offline = process.argv.includes('--offline');
  const sources = [
    { file: '_curated.ts', entries: CURATED_SCHOLARSHIPS, legacyIds: true },
    ...Object.entries(BATCHES).map(([file, entries]) => ({ file, entries })),
  ];
  const { problems, valid } = checkEntries(sources);
  console.log(`${valid.length} scholarships pass the rules (${sources.map((s) => `${s.file}: ${s.entries.length}`).join(', ')})`);

  if (offline) console.log('Link check skipped (--offline).');
  else {
    console.log('Checking links, one request per second …');
    problems.push(...(await checkLinks(valid, { log: (line) => console.log(`  ${line}`) })));
  }

  const show = (level: Problem['level']) => problems.filter((p) => p.level === level);
  for (const p of show('warning')) console.warn(`⚠️  ${p.where}: ${p.message}`);
  for (const p of show('error')) console.error(`❌ ${p.where}: ${p.message}`);
  const errors = show('error').length;
  console.log(errors ? `\n${errors} error(s), ${show('warning').length} warning(s).` : `\nAll good (${show('warning').length} warning(s)).`);
  if (errors) process.exitCode = 1;
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
