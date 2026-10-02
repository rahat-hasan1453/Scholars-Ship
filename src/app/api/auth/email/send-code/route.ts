import { NextResponse } from 'next/server';
import { issueLoginCode } from '@/lib/loginCodes';
import { sendOtpEmail } from '@/lib/email';
import { clientIp, rateLimitHit, waitText } from '@/lib/rateLimit';
import { getUserByEmail, normalizeEmail } from '@/lib/users';

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MAX_SENDS_PER_IP_PER_HOUR = 10;

export async function POST(req: Request) {
  try {
    // purpose: 'login' (code sign-in, default) | 'signup' (verify a new account) | 'reset' (forgot password)
    const { email, purpose } = await req.json();
    if (typeof email !== 'string' || !EMAIL_PATTERN.test(email.trim())) {
      return NextResponse.json({ success: false, error: 'Please enter a valid email address.' }, { status: 400 });
    }
    const normalizedEmail = normalizeEmail(email);

    // One client can't trigger codes to unlimited addresses (email bombing / SMTP quota).
    const ip = await rateLimitHit(`send:ip:${clientIp(req)}`, MAX_SENDS_PER_IP_PER_HOUR, 3600);
    if (!ip.allowed) {
      return NextResponse.json(
        { success: false, error: `Too many requests. Please try again in ${waitText(ip.retryAfterSeconds)}.`, retryAfterSeconds: ip.retryAfterSeconds, rateLimited: true },
        { status: 429, headers: { 'Retry-After': String(ip.retryAfterSeconds) } }
      );
    }

    if (purpose === 'signup' || purpose === 'reset') {
      const existing = await getUserByEmail(normalizedEmail);
      if (purpose === 'signup' && existing?.passwordHash) {
        return NextResponse.json(
          { success: false, accountExists: true, error: 'An account with this email already exists. Please log in.' },
          { status: 409 }
        );
      }
      // Same answer whether or not the account exists, and nothing is sent to unknown addresses.
      if (purpose === 'reset' && !existing) {
        return NextResponse.json({ success: true, message: `If an account exists for ${normalizedEmail}, we sent a 5-digit code.` });
      }
    }

    const issued = await issueLoginCode(normalizedEmail);
    if (!issued.ok) {
      const error = issued.rateLimited
        ? `Too many codes requested for this email. Please try again in ${waitText(issued.retryAfterSeconds)}.`
        : `Please wait ${issued.retryAfterSeconds}s before requesting a new code.`;
      return NextResponse.json(
        { success: false, error, retryAfterSeconds: issued.retryAfterSeconds, rateLimited: issued.rateLimited === true },
        { status: 429, headers: { 'Retry-After': String(issued.retryAfterSeconds) } }
      );
    }

    if (process.env.NODE_ENV !== 'production') {
      console.log(`[HighScholar Auth] Sign-in code for ${normalizedEmail}: ${issued.code}`);
    }

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || new URL(req.url).origin;
    const emailResult = await sendOtpEmail(normalizedEmail, issued.code, appUrl);
    // Local dev without email credentials: the code is already printed to the server log above.
    if (!emailResult.success && emailResult.notConfigured && process.env.NODE_ENV === 'development') {
      return NextResponse.json({ success: true, message: 'Email is not configured locally — the code is in the dev server log.' });
    }
    if (!emailResult.success) {
      console.warn(`[HighScholar Auth] Sign-in code delivery failed for ${normalizedEmail}: ${emailResult.error}`);
      return NextResponse.json(
        { success: false, error: 'We could not send the code. Please try again in a moment.' },
        { status: 500 }
      );
    }

    const message = purpose === 'reset'
      ? `If an account exists for ${normalizedEmail}, we sent a 5-digit code.`
      : `We sent a 5-digit code to ${normalizedEmail}.`;
    return NextResponse.json({ success: true, message });
  } catch (error) {
    console.error('[HighScholar Auth] Send code error:', error);
    return NextResponse.json({ success: false, error: 'Failed to send the code. Please try again.' }, { status: 500 });
  }
}
