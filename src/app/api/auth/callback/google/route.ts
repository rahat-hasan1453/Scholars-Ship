import { timingSafeEqual } from 'crypto';
import { NextRequest, NextResponse } from 'next/server';
import { OAUTH_STATE_COOKIE, setSessionCookie } from '@/lib/auth';
import { findOrCreateUser, toSessionUser } from '@/lib/users';

function statesMatch(a: string | null | undefined, b: string | null | undefined): boolean {
  if (!a || !b) return false;
  const x = Buffer.from(a);
  const y = Buffer.from(b);
  return x.length === y.length && timingSafeEqual(x, y);
}

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const code = searchParams.get('code');
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || request.nextUrl.origin;

  const fail = (reason: string) => {
    const loginUrl = new URL('/login', appUrl);
    loginUrl.searchParams.set('error', reason);
    const response = NextResponse.redirect(loginUrl);
    response.cookies.delete({ name: OAUTH_STATE_COOKIE, path: '/api/auth/callback/google' });
    return response;
  };

  const oauthError = searchParams.get('error');
  if (oauthError || !code) return fail(oauthError || 'authorization_failed');

  if (!statesMatch(searchParams.get('state'), request.cookies.get(OAUTH_STATE_COOKIE)?.value)) {
    return fail('invalid_state');
  }

  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  if (!clientId || !clientSecret) return fail('google_config_missing');

  try {
    const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        code,
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: `${appUrl}/api/auth/callback/google`,
        grant_type: 'authorization_code',
      }),
    });
    if (!tokenResponse.ok) {
      console.error('[Google OAuth] Token exchange error:', await tokenResponse.text());
      return fail('token_exchange_failed');
    }
    const { access_token: accessToken } = await tokenResponse.json();

    const profileResponse = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    if (!profileResponse.ok) return fail('profile_fetch_failed');

    const googleUser = await profileResponse.json();
    if (!googleUser.email || googleUser.email_verified !== true) return fail('email_not_verified');

    const user = await findOrCreateUser({
      email: googleUser.email,
      name: googleUser.name || googleUser.given_name,
      avatar: googleUser.picture,
      googleId: googleUser.sub,
      verified: true,
    });
    await setSessionCookie(toSessionUser(user));

    const response = NextResponse.redirect(new URL(user.onboardingCompleted ? '/' : '/onboarding', appUrl));
    response.cookies.delete({ name: OAUTH_STATE_COOKIE, path: '/api/auth/callback/google' });
    return response;
  } catch (err) {
    console.error('[Google OAuth] Callback exception:', err);
    return fail('server_error');
  }
}
