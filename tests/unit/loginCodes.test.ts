/* eslint-disable @typescript-eslint/no-explicit-any -- loose typing for test doubles */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createFakePrisma } from '../helpers/fakePrisma';

const db = vi.hoisted(() => ({ current: null as any }));
vi.mock('@/lib/prisma', () => ({ get prisma() { return db.current; } }));

import { issueLoginCode, verifyLoginCode } from '@/lib/loginCodes';

const EMAIL = 'student@example.test';

describe('login codes', () => {
  beforeEach(() => {
    db.current = createFakePrisma();
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-10-01T00:00:00Z'));
  });
  afterEach(() => vi.useRealTimers());

  it('issues a 5-digit numeric code and stores only its hash', async () => {
    const r = await issueLoginCode(EMAIL);
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.code).toMatch(/^\d{5}$/);
    const row = db.current._loginCodes.get(EMAIL);
    expect(row.codeHash).not.toContain(r.code);
    expect(row.codeHash).toMatch(/^[0-9a-f]{64}$/);
  });
  it('normalizes the email (case/whitespace)', async () => {
    const r = await issueLoginCode('  Student@Example.TEST ');
    expect(db.current._loginCodes.has(EMAIL)).toBe(true);
    if (r.ok) expect(await verifyLoginCode('STUDENT@example.test', r.code)).toEqual({ ok: true });
  });
  it('enforces a 60s resend cooldown', async () => {
    await issueLoginCode(EMAIL);
    vi.advanceTimersByTime(20_000);
    expect(await issueLoginCode(EMAIL)).toEqual({ ok: false, retryAfterSeconds: 40 });
    vi.advanceTimersByTime(40_001);
    expect((await issueLoginCode(EMAIL)).ok).toBe(true);
  });
  it('accepts the right code once (single use)', async () => {
    const r = await issueLoginCode(EMAIL);
    if (!r.ok) throw new Error('not issued');
    expect(await verifyLoginCode(EMAIL, ` ${r.code} `)).toEqual({ ok: true });
    expect(await verifyLoginCode(EMAIL, r.code)).toEqual({ ok: false, reason: 'missing' });
  });
  it('rejects a wrong code', async () => {
    const r = await issueLoginCode(EMAIL);
    if (!r.ok) throw new Error('not issued');
    const wrong = r.code === '00000' ? '00001' : '00000';
    expect(await verifyLoginCode(EMAIL, wrong)).toEqual({ ok: false, reason: 'invalid' });
  });
  it('expires after 10 minutes and deletes the record', async () => {
    const r = await issueLoginCode(EMAIL);
    if (!r.ok) throw new Error('not issued');
    vi.advanceTimersByTime(10 * 60 * 1000 + 1);
    expect(await verifyLoginCode(EMAIL, r.code)).toEqual({ ok: false, reason: 'expired' });
    expect(db.current._loginCodes.has(EMAIL)).toBe(false);
  });
  it('locks the code after 5 wrong attempts, even if the 6th is correct', async () => {
    const r = await issueLoginCode(EMAIL);
    if (!r.ok) throw new Error('not issued');
    const wrong = r.code === '00000' ? '00001' : '00000';
    const reasons = [];
    for (let i = 0; i < 5; i++) reasons.push((await verifyLoginCode(EMAIL, wrong) as any).reason);
    expect(reasons).toEqual(['invalid', 'invalid', 'invalid', 'invalid', 'too_many_attempts']);
    expect(await verifyLoginCode(EMAIL, r.code)).toEqual({ ok: false, reason: 'too_many_attempts' });
  });
  it('counts parallel guesses atomically (no more than 5 compared)', async () => {
    const r = await issueLoginCode(EMAIL);
    if (!r.ok) throw new Error('not issued');
    const wrong = r.code === '00000' ? '00001' : '00000';
    const results = await Promise.all(Array.from({ length: 20 }, () => verifyLoginCode(EMAIL, wrong)));
    // Never more than 5 compared; since PR #5 the per-email hourly limit may refuse even more ('locked'), which is fail-safe.
    expect(db.current._loginCodes.get(EMAIL).attempts).toBeLessThanOrEqual(5);
    expect(results.some((x) => x.ok)).toBe(false);
  });
  // BUG-02 (fixed in PR #5): a fresh code used to reset the guess budget; now 10 guesses/hour per email across all codes.
  it('limits total wrong guesses per email across re-issued codes', async () => {
    let total = 0;
    for (let round = 0; round < 3; round++) {
      const r = await issueLoginCode(EMAIL);
      if (!r.ok) break;
      const wrong = r.code === '00000' ? '00001' : '00000';
      for (let i = 0; i < 5; i++) await verifyLoginCode(EMAIL, wrong);
      total += db.current._loginCodes.get(EMAIL).attempts;
      vi.advanceTimersByTime(61_000);
    }
    expect(total).toBeLessThanOrEqual(10);
  });

  it('locks the email after 10 wrong guesses in an hour, even with a fresh code', async () => {
    const wrongFor = (code: string) => (code === '00000' ? '00001' : '00000');
    let r = await issueLoginCode(EMAIL);
    if (!r.ok) throw new Error('not issued');
    for (let i = 0; i < 5; i++) await verifyLoginCode(EMAIL, wrongFor(r.code));
    vi.advanceTimersByTime(61_000);
    r = await issueLoginCode(EMAIL);
    if (!r.ok) throw new Error('not issued');
    for (let i = 0; i < 5; i++) await verifyLoginCode(EMAIL, wrongFor(r.code));
    vi.advanceTimersByTime(61_000);
    r = await issueLoginCode(EMAIL);
    if (!r.ok) throw new Error('not issued');
    const locked = await verifyLoginCode(EMAIL, r.code); // even the right code is refused while locked
    expect(locked).toMatchObject({ ok: false, reason: 'locked' });
    expect((locked as any).retryAfterSeconds).toBeGreaterThan(0);
  });
  it('unlocks after the hour window passes', async () => {
    let r = await issueLoginCode(EMAIL);
    if (!r.ok) throw new Error('not issued');
    for (let i = 0; i < 10; i++) await verifyLoginCode(EMAIL, '99999');
    vi.advanceTimersByTime(3600 * 1000 + 1000);
    r = await issueLoginCode(EMAIL);
    if (!r.ok) throw new Error('not issued');
    expect(await verifyLoginCode(EMAIL, r.code)).toEqual({ ok: true });
  });
  it('a successful sign-in resets the guess counter', async () => {
    const r = await issueLoginCode(EMAIL);
    if (!r.ok) throw new Error('not issued');
    await verifyLoginCode(EMAIL, r.code === '00000' ? '00001' : '00000');
    await verifyLoginCode(EMAIL, r.code);
    expect(db.current._rateLimits.has(`verify:email:${EMAIL}`)).toBe(false);
  });
  it('sends at most 5 codes per email per hour', async () => {
    const results = [];
    for (let i = 0; i < 6; i++) {
      results.push(await issueLoginCode(EMAIL));
      vi.advanceTimersByTime(61_000);
    }
    expect(results.slice(0, 5).every((x) => x.ok)).toBe(true);
    expect(results[5]).toMatchObject({ ok: false, rateLimited: true });
  });
});
