import { afterEach, describe, expect, it, vi } from 'vitest';
import { decodeSession, encodeSession } from '@/lib/auth';

const user = { id: 'u1', email: 'student@example.test', name: 'Test Student', onboardingCompleted: false };

describe('session cookie signing', () => {
  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllEnvs();
  });

  it('round-trips a signed session', () => {
    expect(decodeSession(encodeSession(user))).toEqual(user);
  });
  it('rejects a tampered payload (e.g. switching email)', () => {
    const [, sig] = encodeSession(user).split('.');
    const forged = Buffer.from(JSON.stringify({ ...user, email: 'admin@example.test', exp: Date.now() + 1e6 })).toString('base64url');
    expect(decodeSession(`${forged}.${sig}`)).toBeNull();
  });
  it('rejects the old unsigned base64 format', () => {
    expect(decodeSession(Buffer.from(JSON.stringify(user)).toString('base64'))).toBeNull();
  });
  it('rejects garbage and empty values', () => {
    expect(decodeSession('')).toBeNull();
    expect(decodeSession('a.b')).toBeNull();
    expect(decodeSession('...')).toBeNull();
  });
  it('rejects a token signed with another secret', () => {
    const token = encodeSession(user);
    vi.stubEnv('SESSION_SECRET', 'a-different-test-secret-0123456789abcdef');
    expect(decodeSession(token)).toBeNull();
  });
  it('expires after 30 days', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-10-01T00:00:00Z'));
    const token = encodeSession(user);
    vi.setSystemTime(new Date('2026-10-30T23:00:00Z'));
    expect(decodeSession(token)).not.toBeNull();
    vi.setSystemTime(new Date('2026-11-01T00:00:01Z'));
    expect(decodeSession(token)).toBeNull();
  });
  it('refuses to sign in production without a strong SESSION_SECRET', () => {
    vi.stubEnv('NODE_ENV', 'production');
    vi.stubEnv('SESSION_SECRET', 'short');
    expect(() => encodeSession(user)).toThrow(/SESSION_SECRET/);
  });
});
