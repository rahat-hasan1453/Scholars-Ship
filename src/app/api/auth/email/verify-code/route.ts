import { NextResponse } from 'next/server';
import { setSessionCookie } from '@/lib/auth';
import { verifyLoginCode } from '@/lib/loginCodes';
import { clientIp, rateLimitHit, waitText } from '@/lib/rateLimit';
import { findOrCreateUser, toSessionUser } from '@/lib/users';

const MAX_VERIFIES_PER_IP_PER_HOUR = 30;

const MESSAGES = {
  missing: 'No code found for this email. Please request a new code.',
  expired: 'This code has expired. Please request a new code.',
  too_many_attempts: 'Too many incorrect attempts. Please request a new code.',
  invalid: 'Incorrect code. Please check your email and try again.',
} as const;

export async function POST(req: Request) {
  try {
    const { email, code } = await req.json();
    if (typeof email !== 'string' || typeof code !== 'string' || !/^\d{5}$/.test(code.trim())) {
      return NextResponse.json({ success: false, error: 'Please enter the 5-digit code.' }, { status: 400 });
    }

    const ip = await rateLimitHit(`verify:ip:${clientIp(req)}`, MAX_VERIFIES_PER_IP_PER_HOUR, 3600);
    if (!ip.allowed) {
      return NextResponse.json(
        { success: false, error: `Too many attempts. Please try again in ${waitText(ip.retryAfterSeconds)}.`, reason: 'locked', retryAfterSeconds: ip.retryAfterSeconds },
        { status: 429, headers: { 'Retry-After': String(ip.retryAfterSeconds) } }
      );
    }

    const result = await verifyLoginCode(email, code);
    if (!result.ok && result.reason === 'locked') {
      return NextResponse.json(
        { success: false, error: `Too many incorrect attempts. Please try again in ${waitText(result.retryAfterSeconds)}.`, reason: 'locked', retryAfterSeconds: result.retryAfterSeconds },
        { status: 429, headers: { 'Retry-After': String(result.retryAfterSeconds) } }
      );
    }
    if (!result.ok) {
      return NextResponse.json({ success: false, error: MESSAGES[result.reason], reason: result.reason }, { status: 400 });
    }

    const user = await findOrCreateUser({ email, verified: true });
    const sessionUser = toSessionUser(user);
    await setSessionCookie(sessionUser);

    return NextResponse.json({ success: true, user: sessionUser, profileData: user.profileData ?? undefined });
  } catch (error) {
    console.error('[HighScholar Auth] Verify code error:', error);
    return NextResponse.json({ success: false, error: 'Something went wrong. Please try again.' }, { status: 500 });
  }
}
