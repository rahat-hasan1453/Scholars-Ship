import { redirect } from 'next/navigation';

// Sign-up and sign-in are one passwordless flow now; keep this route so old links still work.
export default function SignupPage() {
  redirect('/login');
}
