import type { Metadata } from 'next';
import { Figtree, Inter } from 'next/font/google';
import './globals.css';
import { Providers } from '@/components/Providers';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter', display: 'swap' });
// Figma: sidebar menu + filter chips use Figtree
const figtree = Figtree({ subsets: ['latin'], variable: '--font-figtree-loaded', display: 'swap' });

export const metadata: Metadata = {
  title: 'HighScholar | Global Scholarship & Professor Finder Portal',
  description: 'Personalized higher-education discovery engine for global scholarships, graduate research labs, and application tracking.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="h-full antialiased" suppressHydrationWarning>
      <body 
        className={`${inter.variable} ${figtree.variable} min-h-full flex flex-col bg-slate-50 text-slate-900 selection:bg-indigo-100 selection:text-indigo-900`}
        suppressHydrationWarning
      >
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
