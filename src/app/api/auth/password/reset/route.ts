import { NextResponse } from 'next/server';
import { codeFailure, signedIn, tooManyRequests } from '@/lib/authResponses';
import { verifyLoginCode } from '@/lib/loginCodes';
import { hashPassword, passwordProblem } from '@/lib/password';
import { clientIp, rateLimitHit, rateLimitReset, waitText } from '@/lib/rateLimit';
import { getUserByEmail, normalizeEmail, setPasswordHash } from '@/lib/users';

/* Forgot password: the emailed code proves the address, then the new password replaces the old one. */
export async function POST(req: Request) {
  try {
    const { email, code, password } = await req.json();
    if (typeof email !== 'string' || typeof code !== 'string' || !/^\d{5}$/.test(code.trim())) {
      return NextResponse.json({ success: false, error: 'Please enter the 5-digit code.' }, { status: 400 });
    }
    const problem = passwordProblem(password);
    if (problem) return NextResponse.json({ success: false, error: problem }, { status: 400 });

    const ip = await rateLimitHit(`verify:ip:${clientIp(req)}`, 30, 3600);
    if (!ip.allowed) return tooManyRequests(`Too many attempts. Please try again in ${waitText(ip.retryAfterSeconds)}.`, ip.retryAfterSeconds, { reason: 'locked' });

    const result = await verifyLoginCode(email, code);
    if (!result.ok) return codeFailure(result);

    if (!(await getUserByEmail(email))) {
      return NextResponse.json({ success: false, error: 'No account found for this email. Please sign up.' }, { status: 400 });
    }

    const user = await setPasswordHash(email, await hashPassword(password));
    await rateLimitReset(`login:email:${normalizeEmail(email)}`);
    return signedIn(user);
  } catch (error) {
    console.error('[HighScholar Auth] Password reset error:', error);
    return NextResponse.json({ success: false, error: 'Something went wrong. Please try again.' }, { status: 500 });
  }
}
