import { createHmac, timingSafeEqual } from 'crypto';
import { cookies } from 'next/headers';

export interface AuthSessionUser {
  id: string;
  email: string;
  name: string;
  avatar?: string;
  googleId?: string;
  onboardingCompleted?: boolean;
}

export const SESSION_COOKIE_NAME = 'highscholar_session';
export const OAUTH_STATE_COOKIE = 'highscholar_oauth_state';
const SESSION_MAX_AGE = 60 * 60 * 24 * 30;

function sessionSecret(): string {
  const secret = process.env.SESSION_SECRET;
  if (secret && secret.length >= 32) return secret;
  if (process.env.NODE_ENV === 'production') {
    throw new Error('SESSION_SECRET must be set (at least 32 characters) to sign session cookies.');
  }
  return 'dev-only-insecure-session-secret-change-me';
}

function sign(payload: string): string {
  return createHmac('sha256', sessionSecret()).update(payload).digest('base64url');
}

/* Cookie value = base64url(JSON) + "." + HMAC-SHA256 signature, so it can't be forged or edited. */
export function encodeSession(user: AuthSessionUser): string {
  const payload = Buffer.from(JSON.stringify({ ...user, exp: Date.now() + SESSION_MAX_AGE * 1000 })).toString('base64url');
  return `${payload}.${sign(payload)}`;
}

export function decodeSession(token: string): AuthSessionUser | null {
  const [payload, signature] = token.split('.');
  if (!payload || !signature) return null;

  const expected = Buffer.from(sign(payload));
  const actual = Buffer.from(signature);
  if (expected.length !== actual.length || !timingSafeEqual(expected, actual)) return null;

  try {
    const { exp, ...user } = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8'));
    if (typeof exp !== 'number' || Date.now() > exp || !user.email || !user.id) return null;
    return user as AuthSessionUser;
  } catch {
    return null;
  }
}

export async function setSessionCookie(user: AuthSessionUser) {
  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE_NAME, encodeSession(user), {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: SESSION_MAX_AGE,
  });
}

export async function getSessionUser(): Promise<AuthSessionUser | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;
  if (!token) return null;
  return decodeSession(token);
}

export async function clearSessionCookie() {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE_NAME);
}
