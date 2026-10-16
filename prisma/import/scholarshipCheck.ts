// The checks behind `npm run data:scholarships:check` (check-scholarships.ts). Kept apart from the CLI so
// tests can run them with a fake fetch.
import { curatedSchema, offCatalogSubjects, scholarshipSchema, type ScholarshipSeed } from '../data/scholarships/schema';

export const USER_AGENT = 'ScholarsShip/1.0 (+https://github.com/rahat-hasan1453/Scholars-Ship; scholarship link check)';
/** robots.txt group we look for before falling back to `*` */
const ROBOTS_AGENT = 'scholarsship';
const STALE_DAYS = 365;

export type Problem = { level: 'error' | 'warning'; where: string; message: string };

type Source = { file: string; entries: unknown[]; legacyIds?: boolean };

/** Same page even if written with a trailing slash, a #fragment or a capital letter in the host */
export function normalizeUrl(url: string): string {
  try {
    const u = new URL(url);
    u.hash = '';
    return `${u.protocol}//${u.host.toLowerCase()}${u.pathname.replace(/\/+$/, '')}${u.search}`;
  } catch {
    return url;
  }
}

/** zod rules, unique ids, unique officialUrl, stale verifiedOn, off-catalog subjects */
export function checkEntries(sources: Source[], now = new Date()): { problems: Problem[]; valid: ScholarshipSeed[] } {
  const problems: Problem[] = [];
  const valid: ScholarshipSeed[] = [];
  const ids = new Map<string, string>();
  const urls = new Map<string, string>();

  for (const { file, entries, legacyIds } of sources) {
    const schema = legacyIds ? curatedSchema : scholarshipSchema;
    entries.forEach((raw, i) => {
      const label = (raw as { id?: unknown })?.id;
      const where = `${file} › ${typeof label === 'string' ? label : `#${i + 1}`}`;
      const parsed = schema.safeParse(raw);
      if (!parsed.success) {
        for (const issue of parsed.error.issues) {
          problems.push({ level: 'error', where, message: `${issue.path.join('.') || '(entry)'}: ${issue.message}` });
        }
        return;
      }
      const s = parsed.data;
      valid.push(s);

      const seenId = ids.get(s.id);
      if (seenId) problems.push({ level: 'error', where, message: `id is already used in ${seenId}` });
      else ids.set(s.id, where);

      const url = normalizeUrl(s.officialUrl);
      const seenUrl = urls.get(url);
      if (seenUrl) problems.push({ level: 'error', where, message: `officialUrl is already used by ${seenUrl}` });
      else urls.set(url, where);

      const ageDays = (now.getTime() - Date.parse(s.verifiedOn)) / 86_400_000;
      if (ageDays > STALE_DAYS) {
        problems.push({ level: 'warning', where, message: `verifiedOn ${s.verifiedOn} is over a year old: re-check sourceUrl` });
      }

      const off = offCatalogSubjects(s);
      if (off.length) {
        problems.push({ level: 'warning', where, message: `specializations not in the subject catalog: ${off.join(', ')}` });
      }
    });
  }
  return { problems, valid };
}

/** Allow/Disallow rules for our bot from a robots.txt (our own group if present, else `*`) */
export function parseRobots(text: string): { allow: string[]; disallow: string[] } {
  const groups: { agents: string[]; allow: string[]; disallow: string[] }[] = [];
  let current: (typeof groups)[number] | undefined;
  let lastWasAgent = false;
  for (const rawLine of text.split(/\r?\n/)) {
    const line = rawLine.replace(/#.*/, '').trim();
    const m = /^([a-z-]+)\s*:\s*(.*)$/i.exec(line);
    if (!m) continue;
    const key = m[1].toLowerCase();
    const value = m[2].trim();
    if (key === 'user-agent') {
      if (!current || !lastWasAgent) groups.push((current = { agents: [], allow: [], disallow: [] }));
      current.agents.push(value.toLowerCase());
      lastWasAgent = true;
      continue;
    }
    lastWasAgent = false;
    if (!current) continue;
    if (key === 'allow' && value) current.allow.push(value);
    if (key === 'disallow' && value) current.disallow.push(value);
  }
  const ours = groups.filter((g) => g.agents.some((a) => a.replace(/\/.*$/, '') === ROBOTS_AGENT));
  const chosen = ours.length ? ours : groups.filter((g) => g.agents.includes('*'));
  return { allow: chosen.flatMap((g) => g.allow), disallow: chosen.flatMap((g) => g.disallow) };
}

const ruleMatches = (rule: string, path: string) => {
  const re = new RegExp(
    `^${rule
      .split('*')
      .map((part) => part.replace(/[.+?^${}()|[\]\\]/g, '\\$&'))
      .join('.*')
      .replace(/\\\$$/, '$')}`,
  );
  return re.test(path);
};

/** Longest matching rule wins; Allow wins a tie */
export function robotsAllows(rules: { allow: string[]; disallow: string[] }, path: string): boolean {
  const best = (list: string[]) => Math.max(-1, ...list.filter((r) => ruleMatches(r, path)).map((r) => r.length));
  return best(rules.allow) >= best(rules.disallow);
}

export type LinkCheckOptions = {
  fetch?: typeof fetch;
  sleep?: (ms: number) => Promise<void>;
  /** Pause between any two requests (robots.txt included) */
  delayMs?: number;
  timeoutMs?: number;
  log?: (line: string) => void;
};

/** One request per second, robots.txt first, HEAD then GET. Each URL is checked once */
export async function checkLinks(
  entries: Pick<ScholarshipSeed, 'id' | 'officialUrl' | 'sourceUrl'>[],
  opts: LinkCheckOptions = {},
): Promise<Problem[]> {
  const doFetch = opts.fetch ?? fetch;
  const sleep = opts.sleep ?? ((ms: number) => new Promise<void>((r) => setTimeout(r, ms)));
  const delayMs = opts.delayMs ?? 1000;
  const timeoutMs = opts.timeoutMs ?? 15_000;
  const headers = { 'User-Agent': USER_AGENT };

  let first = true;
  const request = async (url: string, method: 'HEAD' | 'GET') => {
    if (!first) await sleep(delayMs);
    first = false;
    return doFetch(url, { method, headers, redirect: 'follow', signal: AbortSignal.timeout(timeoutMs) });
  };

  const robots = new Map<string, { allow: string[]; disallow: string[] }>();
  const robotsFor = async (origin: string) => {
    let rules = robots.get(origin);
    if (rules) return rules;
    try {
      const res = await request(`${origin}/robots.txt`, 'GET');
      rules = res.ok ? parseRobots(await res.text()) : { allow: [], disallow: [] };
    } catch {
      rules = { allow: [], disallow: [] };
    }
    robots.set(origin, rules);
    return rules;
  };

  const users = new Map<string, string[]>();
  for (const e of entries) {
    for (const url of new Set([e.officialUrl, e.sourceUrl])) users.set(url, [...(users.get(url) ?? []), e.id]);
  }

  const problems: Problem[] = [];
  for (const [url, ids] of users) {
    const where = ids.join(', ');
    const u = new URL(url);
    if (!robotsAllows(await robotsFor(u.origin), u.pathname + u.search)) {
      problems.push({ level: 'warning', where, message: `${url}: robots.txt asks bots not to open it (not checked; open it in a browser)` });
      continue;
    }
    try {
      let res = await request(url, 'HEAD');
      // Many sites don't answer HEAD properly; ask for the page itself before calling it broken
      if (!res.ok) res = await request(url, 'GET');
      opts.log?.(`${res.status} ${url}`);
      if (res.ok) continue;
      // Bot protection, not a dead page (412: some CDNs' challenge page, e.g. campuschina.org)
      const blocked = [401, 403, 412, 429].includes(res.status);
      problems.push({
        level: blocked ? 'warning' : 'error',
        where,
        message: blocked ? `${url}: site refused the checker (${res.status}); open it in a browser` : `${url}: HTTP ${res.status}`,
      });
    } catch (e) {
      opts.log?.(`ERR ${url}`);
      problems.push({ level: 'error', where, message: `${url}: ${e instanceof Error ? e.message : String(e)}` });
    }
  }
  return problems;
}
