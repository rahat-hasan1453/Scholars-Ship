/* eslint-disable @typescript-eslint/no-explicit-any -- loose typing for test doubles */
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';
import { createFakePrisma } from '../helpers/fakePrisma';
import { createCookieJar } from '../helpers/fakeCookies';

const h = vi.hoisted(() => ({ db: null as any, jar: null as any, sendOtpEmail: null as any }));
vi.mock('@/lib/prisma', () => ({ get prisma() { return h.db; } }));
vi.mock('next/headers', () => ({ cookies: async () => h.jar.api }));
vi.mock('@/lib/email', () => ({ sendOtpEmail: (...a: unknown[]) => h.sendOtpEmail(...a) }));

import { POST as sendCode } from '@/app/api/auth/email/send-code/route';
import { POST as verifyCode } from '@/app/api/auth/email/verify-code/route';
import { GET as me } from '@/app/api/auth/me/route';
import { POST as logout } from '@/app/api/auth/logout/route';
import { POST as completeOnboarding } from '@/app/api/auth/complete-onboarding/route';
import { GET as googleStart } from '@/app/api/auth/google/route';
import { GET as googleCallback } from '@/app/api/auth/callback/google/route';
import { decodeSession, encodeSession, OAUTH_STATE_COOKIE, SESSION_COOKIE_NAME } from '@/lib/auth';

const EMAIL = 'student@example.test';
const post = (url: string, body: unknown) =>
  new Request(`http://localhost:3000${url}`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: typeof body === 'string' ? body : JSON.stringify(body) });
const sessionUser = () => decodeSession(h.jar.store.get(SESSION_COOKIE_NAME)?.value ?? '');

async function signIn(email = EMAIL) {
  await sendCode(post('/api/auth/email/send-code', { email }));
  const code = h.sendOtpEmail.mock.calls.at(-1)[1];
  return verifyCode(post('/api/auth/email/verify-code', { email, code }));
}

beforeEach(() => {
  h.db = createFakePrisma();
  h.jar = createCookieJar();
  h.sendOtpEmail = vi.fn(async () => ({ success: true }));
  vi.spyOn(console, 'log').mockImplementation(() => {});
  vi.spyOn(console, 'warn').mockImplementation(() => {});
  vi.spyOn(console, 'error').mockImplementation(() => {});
});

describe('POST /api/auth/email/send-code', () => {
  it.each([{}, { email: '' }, { email: 'not-an-email' }, { email: 42 }])('400 for invalid email %j', async (body) => {
    const res = await sendCode(post('/api/auth/email/send-code', body));
    expect(res.status).toBe(400);
    expect(h.sendOtpEmail).not.toHaveBeenCalled();
  });
  it('500 (not a crash) for a non-JSON body', async () => {
    expect((await sendCode(post('/api/auth/email/send-code', '{oops'))).status).toBe(500);
  });
  it('sends a 5-digit code to the normalized email (mocked, no real email)', async () => {
    const res = await sendCode(post('/api/auth/email/send-code', { email: ' Student@Example.test ' }));
    expect(res.status).toBe(200);
    expect(h.sendOtpEmail).toHaveBeenCalledWith(EMAIL, expect.stringMatching(/^\d{5}$/), 'http://localhost:3000');
  });
  it('never returns the code in the response body', async () => {
    const res = await sendCode(post('/api/auth/email/send-code', { email: EMAIL }));
    const code = h.sendOtpEmail.mock.calls[0][1];
    expect(JSON.stringify(await res.json())).not.toContain(code);
  });
  it('429 with retryAfterSeconds on a second request within 60s', async () => {
    await sendCode(post('/api/auth/email/send-code', { email: EMAIL }));
    const res = await sendCode(post('/api/auth/email/send-code', { email: EMAIL }));
    expect(res.status).toBe(429);
    expect((await res.json()).retryAfterSeconds).toBeGreaterThan(0);
  });
  it('500 with a generic message when email delivery fails', async () => {
    h.sendOtpEmail.mockResolvedValueOnce({ success: false, error: 'SMTP auth failed: secret detail' });
    const res = await sendCode(post('/api/auth/email/send-code', { email: EMAIL }));
    expect(res.status).toBe(500);
    expect(JSON.stringify(await res.json())).not.toContain('secret detail');
  });
  // BUG-03 (fixed in PR #5): 10 sends per IP per hour.
  it('rate-limits one client sending codes to many addresses (10/hour per IP)', async () => {
    const statuses = [];
    for (let i = 0; i < 12; i++) statuses.push((await sendCode(post('/api/auth/email/send-code', { email: `victim${i}@example.test` }))).status);
    expect(statuses.slice(0, 10).every((x) => x === 200)).toBe(true);
    expect(statuses.slice(10)).toEqual([429, 429]);
    expect(h.sendOtpEmail).toHaveBeenCalledTimes(10);
  });
  it('per-IP limit is keyed on x-forwarded-for: another IP is not blocked', async () => {
    const from = (ip: string, email: string) =>
      new Request('http://localhost:3000/api/auth/email/send-code', { method: 'POST', headers: { 'content-type': 'application/json', 'x-forwarded-for': ip }, body: JSON.stringify({ email }) });
    for (let i = 0; i < 10; i++) await sendCode(from('203.0.113.1', `a${i}@example.test`));
    const blocked = await sendCode(from('203.0.113.1', 'b@example.test'));
    expect(blocked.status).toBe(429);
    expect(blocked.headers.get('retry-after')).toMatch(/^\d+$/);
    expect(await blocked.json()).toMatchObject({ rateLimited: true });
    expect((await sendCode(from('198.51.100.7', 'c@example.test'))).status).toBe(200);
  });
});

describe('POST /api/auth/email/verify-code', () => {
  it.each([{ email: EMAIL }, { email: EMAIL, code: '123' }, { email: EMAIL, code: 'abcde' }, { email: EMAIL, code: 12345 }])('400 for malformed %j', async (body) => {
    expect((await verifyCode(post('/api/auth/email/verify-code', body))).status).toBe(400);
  });
  it('400 "missing" when no code was requested', async () => {
    const res = await verifyCode(post('/api/auth/email/verify-code', { email: EMAIL, code: '12345' }));
    expect(await res.json()).toMatchObject({ success: false, reason: 'missing' });
    expect(h.jar.store.has(SESSION_COOKIE_NAME)).toBe(false);
  });
  it('400 "invalid" for a wrong code and sets no cookie', async () => {
    await sendCode(post('/api/auth/email/send-code', { email: EMAIL }));
    const code = h.sendOtpEmail.mock.calls[0][1];
    const wrong = code === '00000' ? '00001' : '00000';
    const res = await verifyCode(post('/api/auth/email/verify-code', { email: EMAIL, code: wrong }));
    expect(await res.json()).toMatchObject({ reason: 'invalid' });
    expect(h.jar.store.has(SESSION_COOKIE_NAME)).toBe(false);
  });
  it('creates the user and sets a signed httpOnly session cookie', async () => {
    const res = await signIn();
    expect(res.status).toBe(200);
    expect(await res.json()).toMatchObject({ success: true, user: { email: EMAIL, onboardingCompleted: false } });
    const cookie = h.jar.store.get(SESSION_COOKIE_NAME);
    expect(cookie.options).toMatchObject({ httpOnly: true, sameSite: 'lax', path: '/' });
    expect(sessionUser()).toMatchObject({ email: EMAIL });
    expect(h.db._users.get(EMAIL).emailVerifiedAt).toBeInstanceOf(Date);
  });
  it('429 "locked" after 10 wrong guesses for one email across codes', async () => {
    await sendCode(post('/api/auth/email/send-code', { email: EMAIL }));
    const code = h.sendOtpEmail.mock.calls[0][1];
    const wrong = code === '00000' ? '00001' : '00000';
    for (let i = 0; i < 10; i++) await verifyCode(post('/api/auth/email/verify-code', { email: EMAIL, code: wrong }));
    // the first code is used up after 5; a lock on the email must hold for the right code too
    h.db._loginCodes.get(EMAIL).attempts = 0;
    const res = await verifyCode(post('/api/auth/email/verify-code', { email: EMAIL, code }));
    expect(res.status).toBe(429);
    expect(await res.json()).toMatchObject({ reason: 'locked' });
    expect(h.jar.store.has(SESSION_COOKIE_NAME)).toBe(false);
  });
  it('429 after 30 verify attempts from one IP (any emails)', async () => {
    let last;
    for (let i = 0; i < 31; i++) last = await verifyCode(post('/api/auth/email/verify-code', { email: `x${i}@example.test`, code: '12345' }));
    expect(last!.status).toBe(429);
  });
  it('a code issued for one email cannot sign in another email', async () => {
    await sendCode(post('/api/auth/email/send-code', { email: EMAIL }));
    const code = h.sendOtpEmail.mock.calls[0][1];
    const res = await verifyCode(post('/api/auth/email/verify-code', { email: 'other@example.test', code }));
    expect(res.status).toBe(400);
  });
});

describe('GET /api/auth/me and POST /api/auth/logout', () => {
  it('unauthenticated without a cookie', async () => {
    expect(await (await me()).json()).toEqual({ authenticated: false, user: null });
  });
  it('unauthenticated with a forged cookie', async () => {
    h.jar.api.set(SESSION_COOKIE_NAME, Buffer.from(JSON.stringify({ id: 'x', email: EMAIL })).toString('base64'));
    expect((await (await me()).json()).authenticated).toBe(false);
  });
  it('authenticated after sign-in, then logged out', async () => {
    await signIn();
    expect(await (await me()).json()).toMatchObject({ authenticated: true, user: { email: EMAIL } });
    await logout();
    expect(h.jar.store.has(SESSION_COOKIE_NAME)).toBe(false);
    expect((await (await me()).json()).authenticated).toBe(false);
  });
  it('unauthenticated if the user row no longer exists', async () => {
    h.jar.api.set(SESSION_COOKIE_NAME, encodeSession({ id: 'gone', email: 'gone@example.test', name: 'Gone' }));
    expect((await (await me()).json()).authenticated).toBe(false);
  });
});

describe('POST /api/auth/complete-onboarding', () => {
  it('401 without a session', async () => {
    expect((await completeOnboarding(post('/api/auth/complete-onboarding', { name: 'X' }))).status).toBe(401);
  });
  it('saves profile for the session email and ignores email/onboardingCompleted from the body', async () => {
    await signIn();
    const res = await completeOnboarding(post('/api/auth/complete-onboarding', { name: '  Rahim  ', email: 'attacker@example.test', onboardingCompleted: false, degreeLevel: 'Masters', specializations: ['HCI'] }));
    expect(res.status).toBe(200);
    const row = h.db._users.get(EMAIL);
    expect(row).toMatchObject({ onboardingCompleted: true, name: 'Rahim' });
    expect(row.profileData).toEqual({ name: 'Rahim', degreeLevel: 'Masters', specializations: ['HCI'] });
    expect(h.db._users.has('attacker@example.test')).toBe(false);
    expect(sessionUser()).toMatchObject({ onboardingCompleted: true });
    // also written to the UserProfile table
    const profile = await h.db.userProfile.findUnique({ where: { userId: row.id } });
    expect(profile).toMatchObject({ degreeLevel: 'MASTERS', specializations: ['HCI'] });
  });
  // BUG-09 (fixed): the body is validated with a schema and a size limit
  it('rejects an oversized / unexpected profile payload', async () => {
    await signIn();
    const res = await completeOnboarding(post('/api/auth/complete-onboarding', { name: 'x'.repeat(100_000), junk: 'y'.repeat(500_000) }));
    expect(res.status).toBe(400);
  });
  it.each([
    { degreeLevel: 'Masters', junk: 1 },
    { degreeLevel: 'Wizard' },
    { degreeLevel: 'Masters', cgpa: 99 },
    { degreeLevel: 'Masters', specializations: 'HCI' },
  ])('400 for invalid onboarding body %j', async (body) => {
    await signIn();
    expect((await completeOnboarding(post('/api/auth/complete-onboarding', body))).status).toBe(400);
    expect(h.db._users.get(EMAIL).onboardingCompleted).toBe(false);
  });
});

describe('Google OAuth', () => {
  it('start: redirects to /login?error=google_config_missing without a client id', async () => {
    vi.stubEnv('GOOGLE_CLIENT_ID', '');
    const res = await googleStart(new NextRequest('http://localhost:3000/api/auth/google'));
    expect(res.headers.get('location')).toBe('http://localhost:3000/login?error=google_config_missing');
    vi.unstubAllEnvs();
  });
  it('start: redirects to Google with a state that matches the state cookie', async () => {
    vi.stubEnv('GOOGLE_CLIENT_ID', 'test-client-id.apps.googleusercontent.com');
    const res = await googleStart(new NextRequest('http://localhost:3000/api/auth/google'));
    const loc = new URL(res.headers.get('location')!);
    expect(loc.origin).toBe('https://accounts.google.com');
    expect(loc.searchParams.get('redirect_uri')).toBe('http://localhost:3000/api/auth/callback/google');
    const stateCookie = res.cookies.get(OAUTH_STATE_COOKIE);
    expect(stateCookie?.value).toBe(loc.searchParams.get('state'));
    expect(stateCookie).toMatchObject({ httpOnly: true, path: '/api/auth/callback/google' });
    vi.unstubAllEnvs();
  });

  const callback = (qs: string, stateCookie?: string) => {
    const req = new NextRequest(`http://localhost:3000/api/auth/callback/google?${qs}`);
    if (stateCookie) req.cookies.set(OAUTH_STATE_COOKIE, stateCookie);
    return googleCallback(req);
  };
  const errorOf = (res: Response) => new URL(res.headers.get('location')!).searchParams.get('error');

  it('callback: provider error -> /login?error=access_denied', async () => {
    expect(errorOf(await callback('error=access_denied'))).toBe('access_denied');
  });
  it('callback: missing or mismatched state -> invalid_state (CSRF)', async () => {
    expect(errorOf(await callback('code=abc&state=s1'))).toBe('invalid_state');
    expect(errorOf(await callback('code=abc&state=s1', 's2'))).toBe('invalid_state');
  });
  it('callback: always redirects to the app origin, never an attacker URL', async () => {
    const res = await callback('error=x&redirect=https://evil.example&next=//evil.example');
    expect(new URL(res.headers.get('location')!).origin).toBe('http://localhost:3000');
  });

  describe('with mocked Google token + userinfo', () => {
    const mockGoogle = (userinfo: Record<string, unknown>, tokenOk = true) =>
      vi.spyOn(globalThis, 'fetch').mockImplementation(async (url) =>
        String(url).includes('oauth2.googleapis.com/token')
          ? new Response(JSON.stringify({ access_token: 'test-token' }), { status: tokenOk ? 200 : 400 })
          : new Response(JSON.stringify(userinfo), { status: 200 }));
    beforeEach(() => {
      vi.stubEnv('GOOGLE_CLIENT_ID', 'test-client-id');
      vi.stubEnv('GOOGLE_CLIENT_SECRET', 'test-client-secret');
      return () => { vi.unstubAllEnvs(); vi.restoreAllMocks(); };
    });

    it('token exchange failure -> token_exchange_failed', async () => {
      mockGoogle({}, false);
      expect(errorOf(await callback('code=c&state=s', 's'))).toBe('token_exchange_failed');
    });
    it('unverified Google email -> email_not_verified, no session', async () => {
      mockGoogle({ email: EMAIL, email_verified: false, sub: 'g1' });
      expect(errorOf(await callback('code=c&state=s', 's'))).toBe('email_not_verified');
      expect(h.jar.store.has(SESSION_COOKIE_NAME)).toBe(false);
    });
    it('new user -> session + redirect to /onboarding; returning onboarded user -> /', async () => {
      mockGoogle({ email: EMAIL, email_verified: true, sub: 'g1', name: 'Test Student' });
      const first = await callback('code=c&state=s', 's');
      expect(first.headers.get('location')).toBe('http://localhost:3000/onboarding');
      expect(sessionUser()).toMatchObject({ email: EMAIL, googleId: 'g1' });
      h.db._users.get(EMAIL).onboardingCompleted = true;
      const second = await callback('code=c&state=s', 's');
      expect(second.headers.get('location')).toBe('http://localhost:3000/');
    });
  });
});
