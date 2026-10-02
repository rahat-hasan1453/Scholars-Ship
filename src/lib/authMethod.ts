// Site-wide sign-in method, switched in Vercel env (redeploy to apply). Google sign-in is available in both.
//   password (default): email + password; the email is verified once with a code at sign-up
//   code:               a 5-digit code is emailed on every sign-in, no passwords
export const AUTH_METHOD: 'password' | 'code' = process.env.NEXT_PUBLIC_AUTH_METHOD === 'code' ? 'code' : 'password';
