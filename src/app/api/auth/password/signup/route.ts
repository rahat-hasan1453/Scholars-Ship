import { NextResponse } from 'next/server';
import { codeFailure, signedIn, tooManyRequests } from '@/lib/authResponses';
import { verifyLoginCode } from '@/lib/loginCodes';
import { hashPassword, passwordProblem } from '@/lib/password';
import { clientIp, rateLimitHit, waitText } from '@/lib/rateLimit';
import { findOrCreateUser, getUserByEmail, setPasswordHash } from '@/lib/users';

/* Step 2 of sign-up: the emailed code proves the address, then the account is created with its password. */
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

    if ((await getUserByEmail(email))?.passwordHash) {
      return NextResponse.json(
        { success: false, accountExists: true, error: 'An account with this email already exists. Please log in.' },
        { status: 409 }
      );
    }

    const result = await verifyLoginCode(email, code);
    if (!result.ok) return codeFailure(result);

    const user = await findOrCreateUser({ email, verified: true });
    return signedIn(await setPasswordHash(user.email, await hashPassword(password)));
  } catch (error) {
    console.error('[HighScholar Auth] Sign-up error:', error);
    return NextResponse.json({ success: false, error: 'Something went wrong. Please try again.' }, { status: 500 });
  }
}
