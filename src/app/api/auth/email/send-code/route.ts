import { NextResponse } from 'next/server';
import { issueLoginCode } from '@/lib/loginCodes';
import { sendOtpEmail } from '@/lib/email';
import { normalizeEmail } from '@/lib/users';

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(req: Request) {
  try {
    const { email } = await req.json();
    if (typeof email !== 'string' || !EMAIL_PATTERN.test(email.trim())) {
      return NextResponse.json({ success: false, error: 'Please enter a valid email address.' }, { status: 400 });
    }
    const normalizedEmail = normalizeEmail(email);

    const issued = await issueLoginCode(normalizedEmail);
    if (!issued.ok) {
      return NextResponse.json(
        { success: false, error: `Please wait ${issued.retryAfterSeconds}s before requesting a new code.`, retryAfterSeconds: issued.retryAfterSeconds },
        { status: 429 }
      );
    }

    if (process.env.NODE_ENV !== 'production') {
      console.log(`[HighScholar Auth] Sign-in code for ${normalizedEmail}: ${issued.code}`);
    }

    const emailResult = await sendOtpEmail(normalizedEmail, issued.code);
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
