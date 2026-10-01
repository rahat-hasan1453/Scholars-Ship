import { NextResponse } from 'next/server';
import { issueLoginCode } from '@/lib/loginCodes';
import { sendOtpEmail } from '@/lib/email';
import { clientIp, rateLimitHit, waitText } from '@/lib/rateLimit';
import { normalizeEmail } from '@/lib/users';

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MAX_SENDS_PER_IP_PER_HOUR = 10;

export async function POST(req: Request) {
  try {
    const { email } = await req.json();
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
    if (!emailResult.success) {
      console.warn(`[HighScholar Auth] Sign-in code delivery failed for ${normalizedEmail}: ${emailResult.error}`);
      return NextResponse.json(
        { success: false, error: 'We could not send the code. Please try again in a moment.' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, message: `We sent a 5-digit code to ${normalizedEmail}.` });
  } catch (error) {
    console.error('[HighScholar Auth] Send code error:', error);
    return NextResponse.json({ success: false, error: 'Failed to send the code. Please try again.' }, { status: 500 });
  }
}
