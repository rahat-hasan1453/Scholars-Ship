import { NextResponse } from 'next/server';
import { signedIn, tooManyRequests } from '@/lib/authResponses';
import { burnPasswordCheck, verifyPassword } from '@/lib/password';
import { clientIp, rateLimitHit, rateLimitReset, waitText } from '@/lib/rateLimit';
import { getUserByEmail, normalizeEmail } from '@/lib/users';

const MAX_ATTEMPTS_PER_EMAIL_PER_HOUR = 10;
const MAX_ATTEMPTS_PER_IP_PER_HOUR = 30;
const WRONG = 'Incorrect email or password.';

export async function POST(req: Request) {
  try {
    const { email, password } = await req.json();
    if (typeof email !== 'string' || typeof password !== 'string' || !email.includes('@') || !password) {
      return NextResponse.json({ success: false, error: 'Please enter your email and password.' }, { status: 400 });
    }
    const normalizedEmail = normalizeEmail(email);

    const ip = await rateLimitHit(`login:ip:${clientIp(req)}`, MAX_ATTEMPTS_PER_IP_PER_HOUR, 3600);
    if (!ip.allowed) return tooManyRequests(`Too many attempts. Please try again in ${waitText(ip.retryAfterSeconds)}.`, ip.retryAfterSeconds);

    // Counted per email so a 6-digit PIN can't be guessed: 10 tries an hour against 1,000,000 possibilities.
    const tries = await rateLimitHit(`login:email:${normalizedEmail}`, MAX_ATTEMPTS_PER_EMAIL_PER_HOUR, 3600);
    if (!tries.allowed) {
      return tooManyRequests(`Too many incorrect attempts. Please try again in ${waitText(tries.retryAfterSeconds)}, or reset your password.`, tries.retryAfterSeconds, { reason: 'locked' });
    }

    const user = await getUserByEmail(normalizedEmail);
    if (!user?.passwordHash) {
      await burnPasswordCheck(password);
      if (user) {
        return NextResponse.json(
          { success: false, reason: 'no_password', error: "This account doesn't have a password yet. Use \"Forgot password?\" to set one, or continue with Google." },
          { status: 400 }
        );
      }
      return NextResponse.json({ success: false, error: WRONG }, { status: 401 });
    }

    if (!(await verifyPassword(password, user.passwordHash))) {
      return NextResponse.json({ success: false, error: WRONG }, { status: 401 });
    }

    await rateLimitReset(`login:email:${normalizedEmail}`);
    return signedIn(user);
  } catch (error) {
    console.error('[HighScholar Auth] Password login error:', error);
    return NextResponse.json({ success: false, error: 'Something went wrong. Please try again.' }, { status: 500 });
  }
}
