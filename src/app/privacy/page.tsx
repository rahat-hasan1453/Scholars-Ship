import type { Metadata } from 'next';
import { LegalPage } from '@/components/LegalPage';

export const metadata: Metadata = { title: "Privacy Policy | Scholars'ship" };

export default function PrivacyPage() {
  return (
    <LegalPage title="Privacy Policy">
      <p>
        We store the details you give us — your email, name, profile photo and study preferences — to personalise the
        opportunities we show you. Passwords are stored only as secure hashes.
      </p>
      <p>
        If you sign in with Google we receive your name, email and profile photo from Google. For other accounts we may
        show your public Gravatar photo.
      </p>
      <p>We do not sell your data. To delete your account or ask a question, contact us from Help &amp; Feedback.</p>
    </LegalPage>
  );
}
