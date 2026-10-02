import { NextResponse } from 'next/server';
import type { User } from '@prisma/client';
import { setSessionCookie } from './auth';
import type { VerifyResult } from './loginCodes';
import { waitText } from './rateLimit';
import { toSessionUser } from './users';

const CODE_MESSAGES = {
  missing: 'No code found for this email. Please request a new code.',
  expired: 'This code has expired. Please request a new code.',
  too_many_attempts: 'Too many incorrect attempts. Please request a new code.',
  invalid: 'Incorrect code. Please check your email and try again.',
} as const;

export function tooManyRequests(error: string, retryAfterSeconds: number, extra: Record<string, unknown> = {}) {
  return NextResponse.json(
    { success: false, error, retryAfterSeconds, ...extra },
    { status: 429, headers: { 'Retry-After': String(retryAfterSeconds) } }
  );
}

export function codeFailure(result: Exclude<VerifyResult, { ok: true }>) {
  if (result.reason === 'locked') {
    return tooManyRequests(`Too many incorrect attempts. Please try again in ${waitText(result.retryAfterSeconds)}.`, result.retryAfterSeconds, { reason: 'locked' });
  }
  return NextResponse.json({ success: false, error: CODE_MESSAGES[result.reason], reason: result.reason }, { status: 400 });
}

export async function signedIn(user: User) {
  const sessionUser = toSessionUser(user);
  await setSessionCookie(sessionUser);
  return NextResponse.json({ success: true, user: sessionUser, profileData: user.profileData ?? undefined });
}
