import Link from 'next/link';
import type { ReactNode } from 'react';

/* Placeholder layout for /terms and /privacy until the real legal text is written */
export function LegalPage({ title, children }: { title: string; children: ReactNode }) {
  return (
    <main className="mx-auto flex w-full max-w-[720px] flex-1 flex-col gap-6 px-4 py-12">
      <Link href="/login" className="self-start text-sm leading-5 text-text-secondary hover:text-brand-primary">
        ← Back
      </Link>
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-medium leading-8 text-text-primary">{title}</h1>
        <p className="text-sm leading-5 text-text-secondary">Draft — this page will be updated before launch.</p>
      </div>
      <div className="flex flex-col gap-4 text-sm leading-6 text-text-body">{children}</div>
    </main>
  );
}
