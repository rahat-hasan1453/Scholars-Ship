/* eslint-disable @typescript-eslint/no-explicit-any -- loose typing for test doubles */
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createFakePrisma } from '../helpers/fakePrisma';
import { createCookieJar } from '../helpers/fakeCookies';

const h = vi.hoisted(() => ({ db: null as any, jar: null as any, sendOtpEmail: null as any }));
vi.mock('@/lib/prisma', () => ({ get prisma() { return h.db; } }));
vi.mock('next/headers', () => ({ cookies: async () => h.jar.api }));
vi.mock('@/lib/email', () => ({ sendOtpEmail: (...a: unknown[]) => h.sendOtpEmail(...a) }));

import { POST as sendCode } from '@/app/api/auth/email/send-code/route';
import { POST as signup } from '@/app/api/auth/password/signup/route';
import { POST as login } from '@/app/api/auth/password/login/route';
import { POST as reset } from '@/app/api/auth/password/reset/route';
import { decodeSession, SESSION_COOKIE_NAME } from '@/lib/auth';
import { hashPassword, verifyPassword } from '@/lib/password';

const EMAIL = 'student@example.test';
const PIN = '123456';
const post = (url: string, body: unknown, ip = '203.0.113.1') =>
  new Request(`http://localhost:3000${url}`, {
    method: 'POST',
    headers: { 'content-type': 'application/json', 'x-forwarded-for': ip },
    body: JSON.stringify(body),
  });
const lastCode = () => h.sendOtpEmail.mock.calls.at(-1)[1];
const signedInEmail = () => decodeSession(h.jar.store.get(SESSION_COOKIE_NAME)?.value ?? '')?.email;

async function createAccount(email = EMAIL, password = PIN) {
  await sendCode(post('/api/auth/email/send-code', { email, purpose: 'signup' }));
  return signup(post('/api/auth/password/signup', { email, code: lastCode(), password }));
}

beforeEach(() => {
  h.db = createFakePrisma();
  h.jar = createCookieJar();
  h.sendOtpEmail = vi.fn(async () => ({ success: true }));
  vi.spyOn(console, 'log').mockImplementation(() => {});
  vi.spyOn(console, 'warn').mockImplementation(() => {});
  vi.spyOn(console, 'error').mockImplementation(() => {});
});

describe('password hashing', () => {
  it('stores a salted scrypt hash, never the password', async () => {
    const a = await hashPassword(PIN);
    const b = await hashPassword(PIN);
    expect(a).toMatch(/^scrypt\$/);
    expect(a).not.toContain(PIN);
    expect(a).not.toBe(b);
    expect(await verifyPassword(PIN, a)).toBe(true);
    expect(await verifyPassword('654321', a)).toBe(false);
  });
});

describe('sign-up with password', () => {
  it('verifies the email with a code, then creates the account and signs in', async () => {
    const res = await createAccount();
    expect(res.status).toBe(200);
    expect(await res.json()).toMatchObject({ success: true, user: { email: EMAIL } });
    expect(signedInEmail()).toBe(EMAIL);
    expect(h.db._users.get(EMAIL).passwordHash).toMatch(/^scrypt\$/);
  });
  it('accepts a numbers-only 6-digit password and rejects shorter ones', async () => {
    await sendCode(post('/api/auth/email/send-code', { email: EMAIL, purpose: 'signup' }));
    const short = await signup(post('/api/auth/password/signup', { email: EMAIL, code: lastCode(), password: '12345' }));
    expect(short.status).toBe(400);
    expect(h.db._users.has(EMAIL)).toBe(false);
  });
  it('needs the right code', async () => {
    await sendCode(post('/api/auth/email/send-code', { email: EMAIL, purpose: 'signup' }));
    const wrong = lastCode() === '00000' ? '00001' : '00000';
    const res = await signup(post('/api/auth/password/signup', { email: EMAIL, code: wrong, password: PIN }));
    expect(res.status).toBe(400);
    expect(h.db._users.has(EMAIL)).toBe(false);
    expect(h.jar.store.has(SESSION_COOKIE_NAME)).toBe(false);
  });
  it('refuses a second sign-up for an email that already has a password (no code sent)', async () => {
    await createAccount();
    h.sendOtpEmail.mockClear();
    const res = await sendCode(post('/api/auth/email/send-code', { email: EMAIL, purpose: 'signup' }, '203.0.113.2'));
    expect(res.status).toBe(409);
    expect(await res.json()).toMatchObject({ accountExists: true });
    expect(h.sendOtpEmail).not.toHaveBeenCalled();
  });
});

describe('login with password', () => {
  it('signs in with the right password', async () => {
    await createAccount();
    h.jar = createCookieJar();
    const res = await login(post('/api/auth/password/login', { email: 'Student@Example.test', password: PIN }));
    expect(res.status).toBe(200);
    expect(signedInEmail()).toBe(EMAIL);
  });
  it('gives the same answer for a wrong password and an unknown email', async () => {
    await createAccount();
    h.jar = createCookieJar();
    const wrong = await login(post('/api/auth/password/login', { email: EMAIL, password: '000000' }));
    const unknown = await login(post('/api/auth/password/login', { email: 'nobody@example.test', password: PIN }));
    expect(wrong.status).toBe(401);
    expect(unknown.status).toBe(401);
    expect((await wrong.json()).error).toBe((await unknown.json()).error);
    expect(h.jar.store.has(SESSION_COOKIE_NAME)).toBe(false);
  });
  it('locks an email after 10 wrong passwords in an hour, even for the right one', async () => {
    await createAccount();
    h.jar = createCookieJar();
    for (let i = 0; i < 10; i++) await login(post('/api/auth/password/login', { email: EMAIL, password: `00000${i}` }, `198.51.100.${i}`));
    const res = await login(post('/api/auth/password/login', { email: EMAIL, password: PIN }, '198.51.100.99'));
    expect(res.status).toBe(429);
    expect(h.jar.store.has(SESSION_COOKIE_NAME)).toBe(false);
  });
  it('limits one IP to 30 attempts an hour', async () => {
    let last;
    for (let i = 0; i < 31; i++) last = await login(post('/api/auth/password/login', { email: `x${i}@example.test`, password: PIN }));
    expect(last!.status).toBe(429);
  });
  it('tells a Google-only account to set a password', async () => {
    h.db._users.set(EMAIL, { id: 'u1', email: EMAIL, name: 'S', passwordHash: null, onboardingCompleted: false });
    const res = await login(post('/api/auth/password/login', { email: EMAIL, password: PIN }));
    expect(res.status).toBe(400);
    expect(await res.json()).toMatchObject({ reason: 'no_password' });
  });
});

describe('forgot password', () => {
  it('sends nothing to an unknown email but answers the same way', async () => {
    const res = await sendCode(post('/api/auth/email/send-code', { email: 'nobody@example.test', purpose: 'reset' }));
    expect(res.status).toBe(200);
    expect((await res.json()).message).toMatch(/If an account exists/);
    expect(h.sendOtpEmail).not.toHaveBeenCalled();
  });
  it('sets a new password with the emailed code; the old one stops working', async () => {
    await createAccount();
    h.jar = createCookieJar();
    await sendCode(post('/api/auth/email/send-code', { email: EMAIL, purpose: 'reset' }, '203.0.113.3'));
    const res = await reset(post('/api/auth/password/reset', { email: EMAIL, code: lastCode(), password: '987654' }, '203.0.113.3'));
    expect(res.status).toBe(200);
    expect(signedInEmail()).toBe(EMAIL);
    h.jar = createCookieJar();
    expect((await login(post('/api/auth/password/login', { email: EMAIL, password: PIN }, '203.0.113.4'))).status).toBe(401);
    expect((await login(post('/api/auth/password/login', { email: EMAIL, password: '987654' }, '203.0.113.5'))).status).toBe(200);
  });
});
