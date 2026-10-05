import type { Metadata } from 'next';
import { LegalPage } from '@/components/LegalPage';

export const metadata: Metadata = { title: "Terms of Service | Scholars'ship" };

export default function TermsPage() {
  return (
    <LegalPage title="Terms of Service">
      <p>
        Scholars&apos;ship helps you discover scholarships, professors and research opportunities. By using the service you
        agree to use it lawfully and to keep your account details accurate.
      </p>
      <p>
        Opportunity information is collected from public sources and may change. Always confirm deadlines and requirements
        with the official provider before applying.
      </p>
      <p>We may update these terms as the product grows. Continued use after an update means you accept the new terms.</p>
    </LegalPage>
  );
}
