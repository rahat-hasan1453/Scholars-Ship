import { redirect } from 'next/navigation';
import { PasswordSignup } from '@/components/auth/password-signup';
import { AUTH_METHOD } from '@/lib/authMethod';

// With AUTH_METHOD=code, sign-up and sign-in are one flow on /login.
export default function SignupPage() {
  if (AUTH_METHOD === 'code') redirect('/login');
  return <PasswordSignup />;
}
