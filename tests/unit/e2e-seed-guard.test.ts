import { describe, expect, it } from 'vitest';
import { assertSafeE2eDatabase } from '../e2e/seed/seed-guard';

const LOCAL = 'postgres://postgres:postgres@localhost:51301/template1?sslmode=disable';
const DEV = 'postgres://postgres:postgres@localhost:51214/template1?sslmode=disable&pgbouncer=true';
const ok = { E2E_DB: '1' };

describe('e2e seed guard', () => {
  it('allows a local test database that is not the dev database', () => {
    expect(assertSafeE2eDatabase(LOCAL, ok, DEV).port).toBe('51301');
    expect(() => assertSafeE2eDatabase('postgresql://postgres:postgres@127.0.0.1:5432/e2e', ok)).not.toThrow();
  });

  it('refuses without E2E_DB=1', () => {
    expect(() => assertSafeE2eDatabase(LOCAL, {}, DEV)).toThrow(/E2E_DB=1/);
    expect(() => assertSafeE2eDatabase(LOCAL, { E2E_DB: 'true' }, DEV)).toThrow(/E2E_DB=1/);
  });

  it('refuses the production Neon database, even with E2E_DB=1', () => {
    const neon = 'postgresql://user:pw@ep-cool-123.ap-southeast-1.aws.neon.tech/neondb?sslmode=require';
    expect(() => assertSafeE2eDatabase(neon, ok)).toThrow(/Neon/);
  });

  it('refuses any host that is not local', () => {
    expect(() => assertSafeE2eDatabase('postgres://u:p@db.example.com:5432/e2e', ok)).toThrow(/not local/);
  });

  it('refuses on Vercel or in production', () => {
    expect(() => assertSafeE2eDatabase(LOCAL, { ...ok, VERCEL: '1' })).toThrow(/Vercel/);
    expect(() => assertSafeE2eDatabase(LOCAL, { ...ok, NODE_ENV: 'production' })).toThrow(/production/);
  });

  it('refuses the dev database, even with a different query string', () => {
    expect(() => assertSafeE2eDatabase(DEV.replace('&pgbouncer=true', ''), ok, DEV)).toThrow(/same database/);
  });

  it('refuses a missing or non-postgres URL', () => {
    expect(() => assertSafeE2eDatabase(undefined, ok)).toThrow(/not set/);
    expect(() => assertSafeE2eDatabase('prisma+postgres://localhost:51300/?api_key=x', ok)).toThrow(/postgres:\/\//);
    expect(() => assertSafeE2eDatabase('not a url', ok)).toThrow(/not a valid URL/);
  });
});
