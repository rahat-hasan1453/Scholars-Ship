import { redirect } from 'next/navigation';
import { PasswordReset } from '@/components/auth/password-reset';
import { AUTH_METHOD } from '@/lib/authMethod';

export default function ForgotPasswordPage() {
  if (AUTH_METHOD === 'code') redirect('/login');
  return <PasswordReset />;
}
