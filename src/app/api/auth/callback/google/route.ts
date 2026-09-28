import { NextRequest, NextResponse } from 'next/server';
import { upsertGoogleUser, setSessionCookie } from '@/lib/auth';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const code = searchParams.get('code');
  const error = searchParams.get('error');

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || request.nextUrl.origin || 'http://localhost:3000';

  if (error || !code) {
    const loginUrl = new URL('/login', appUrl);
    loginUrl.searchParams.set('error', error || 'authorization_failed');
    return NextResponse.redirect(loginUrl);
  }

  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  const redirectUri = `${appUrl}/api/auth/callback/google`;

  if (!clientId || !clientSecret) {
    const loginUrl = new URL('/login', appUrl);
    loginUrl.searchParams.set('error', 'google_config_missing');
    return NextResponse.redirect(loginUrl);
  }

  try {
    // 1. Exchange authorization code for tokens
    const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        code,
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: redirectUri,
        grant_type: 'authorization_code',
      }),
    });

    if (!tokenResponse.ok) {
      const errBody = await tokenResponse.text();
      console.error('[Google OAuth] Token exchange error:', errBody);
      const loginUrl = new URL('/login', appUrl);
      loginUrl.searchParams.set('error', 'token_exchange_failed');
      return NextResponse.redirect(loginUrl);
    }

    const tokenData = await tokenResponse.json();
    const accessToken = tokenData.access_token;

    // 2. Fetch authenticated user profile from Google UserInfo endpoint
    const profileResponse = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    if (!profileResponse.ok) {
      console.error('[Google OAuth] Failed to fetch userinfo');
      const loginUrl = new URL('/login', appUrl);
      loginUrl.searchParams.set('error', 'profile_fetch_failed');
      return NextResponse.redirect(loginUrl);
    }

    const googleUser = await profileResponse.json();
    // Fields: sub, name, given_name, family_name, picture, email, email_verified
    const googleId = googleUser.sub;
    const email = googleUser.email;
    const name = googleUser.name || googleUser.given_name || 'Scholar User';
    const avatar = googleUser.picture;

    // 3. Upsert user into database via Prisma / persistent store
    const sessionUser = await upsertGoogleUser({
      email,
      name,
      avatar,
      googleId,
    });

    // 4. Set secure session cookie
    await setSessionCookie(sessionUser);

    // 5. Redirect user to home dashboard with success query params
    const homeUrl = new URL('/', appUrl);
    homeUrl.searchParams.set('auth_provider', 'google');
    homeUrl.searchParams.set('user_name', encodeURIComponent(sessionUser.name));
    homeUrl.searchParams.set('user_email', encodeURIComponent(sessionUser.email));
    if (sessionUser.avatar) {
      homeUrl.searchParams.set('user_avatar', encodeURIComponent(sessionUser.avatar));
    }

    return NextResponse.redirect(homeUrl);
  } catch (err) {
    console.error('[Google OAuth] Callback exception:', err);
    const loginUrl = new URL('/login', appUrl);
    loginUrl.searchParams.set('error', 'server_error');
    return NextResponse.redirect(loginUrl);
  }
}
