import { CodeLogin } from '@/components/auth/code-login';
import { PasswordLogin } from '@/components/auth/password-login';
import { AUTH_METHOD } from '@/lib/authMethod';

export default function LoginPage() {
  return AUTH_METHOD === 'code' ? <CodeLogin /> : <PasswordLogin />;
}
