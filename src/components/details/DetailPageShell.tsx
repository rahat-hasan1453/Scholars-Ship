'use client';

import React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { AppLayout, type AppTab } from '@/components/layout/AppLayout';
import { useAuthGuard } from '@/hooks/useAuthGuard';
import { TopBarIcon, topBarButtonClass, useShareLink } from '@/components/details/DetailParts';

export interface DetailPageShellProps {
  /** Sidebar tab to highlight; clicking another tab goes back to `/?tab=<tab>` */
  activeTab: AppTab;
  back: { href: string; label: string };
  /** Top bar Save button. Omit to hide it. */
  onSave?: () => void;
  saved?: boolean;
  main: React.ReactNode;
  sidebar: React.ReactNode;
}

// Figma: details page frame (249:2596) — app sidebar + white content panel with a top bar and two columns
export const DetailPageShell: React.FC<DetailPageShellProps> = ({ activeTab, back, onSave, saved, main, sidebar }) => {
  useAuthGuard();
  const router = useRouter();
  const { copied, share } = useShareLink();

  return (
    <AppLayout
      activeTab={activeTab}
      setActiveTab={(tab) => router.push(`/?tab=${tab}`)}
      onOpenExtension={() => router.push('/')}
    >
      <div className="relative h-scaled-screen flex flex-col min-w-0 lg:py-5 lg:pl-5 lg:pr-[30px]">
        {/* Top bar stays put; on xl only the main column scrolls and the sidebar stays fixed (Figma 270:3942) */}
        <div className="flex-1 min-h-0 flex flex-col overflow-hidden bg-white lg:rounded-[16px]">
            {/* Top bar */}
            <div className="shrink-0 flex items-center justify-between gap-3 px-4 pt-6 pb-6 lg:px-8">
              <Link
                href={back.href}
                className="text-[14px] leading-5 font-medium text-[#64748b] hover:text-[#344054] transition-colors whitespace-pre"
              >
                {`←  ${back.label}`}
              </Link>
              <div className="flex items-start gap-2">
                {onSave && (
                  <button type="button" onClick={onSave} aria-pressed={saved} className={topBarButtonClass}>
                    {saved ? 'Saved' : 'Save'}
                    <TopBarIcon src="/details/bookmark.svg" width={11.6667} height={14.3333} />
                  </button>
                )}
                <button type="button" onClick={() => share()} className={topBarButtonClass}>
                  <span aria-live="polite">{copied ? 'Link copied' : 'Share'}</span>
                  <TopBarIcon src="/details/share.svg" width={16} height={16} />
                </button>
                <button type="button" disabled title="Reporting is coming soon" className={topBarButtonClass}>
                  Report
                  <TopBarIcon src="/details/flag.svg" width={16} height={16} />
                </button>
              </div>
            </div>

            <div className="flex-1 min-h-0 overflow-y-auto xl:overflow-hidden flex flex-col xl:flex-row items-start gap-8 px-4 lg:px-8">
              <div className="flex flex-1 min-w-0 w-full flex-col gap-6 pb-8 xl:h-full xl:overflow-y-auto">{main}</div>
              <aside className="flex w-full xl:w-[380px] shrink-0 flex-col gap-4 pb-8 xl:h-full xl:overflow-y-auto">{sidebar}</aside>
            </div>
        </div>
      </div>
    </AppLayout>
  );
};
