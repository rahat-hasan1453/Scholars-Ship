// The e2e seed empties every table, so it must only ever touch a throwaway test database.
// Three locks, all required: E2E_DB=1, a local host, and not the dev DATABASE_URL. Never on Vercel or in production.

const LOCAL_HOSTS = new Set(['localhost', '127.0.0.1', '[::1]', '::1']);

/** host:port/database, so two URLs with different query strings still compare equal */
function dbKey(url: URL) {
  return `${url.hostname}:${url.port || '5432'}${url.pathname}`;
}

function parse(raw: string, name: string) {
  try {
    return new URL(raw);
  } catch {
    throw new Error(`[e2e seed] ${name} is not a valid URL.`);
  }
}

/**
 * Throws unless `url` is a safe e2e test database.
 * `devUrl` is the normal DATABASE_URL (from .env.local); the test database must be a different one.
 */
export function assertSafeE2eDatabase(url: string | undefined, env: Record<string, string | undefined>, devUrl?: string) {
  if (env.E2E_DB !== '1') throw new Error('[e2e seed] Refusing to run: E2E_DB=1 is not set.');
  if (env.VERCEL || env.NODE_ENV === 'production') throw new Error('[e2e seed] Refusing to run on Vercel or with NODE_ENV=production.');
  if (!url) throw new Error('[e2e seed] Refusing to run: E2E_DATABASE_URL is not set. See docs/TECH-GUIDE.md, "e2e tests".');

  const target = parse(url, 'E2E_DATABASE_URL');
  if (!/^postgres(ql)?:$/.test(target.protocol)) throw new Error('[e2e seed] E2E_DATABASE_URL must be a postgres:// URL.');
  if (target.hostname.includes('neon.tech')) throw new Error('[e2e seed] Refusing to run against Neon (production).');
  if (!LOCAL_HOSTS.has(target.hostname)) throw new Error(`[e2e seed] Refusing to run: host "${target.hostname}" is not local.`);
  if (devUrl && dbKey(target) === dbKey(parse(devUrl, 'DATABASE_URL'))) {
    throw new Error('[e2e seed] Refusing to run: E2E_DATABASE_URL points at the same database as DATABASE_URL (your dev data).');
  }
  return target;
}
