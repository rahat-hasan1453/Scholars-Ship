'use client';

import React from 'react';
import { Toggle } from '@/components/shadcn/toggle';
import { cn } from '@/lib/utils';

export interface SegmentedOption<T extends string> {
  value: T;
  /** Text shown in the segment. Icon-only segments need `ariaLabel`. */
  label?: string;
  icon?: React.ReactNode;
  ariaLabel?: string;
  /** Optional count chip after the label (Pipeline toolbar, Figma 315:5268) */
  count?: number;
}

interface SegmentedToggleProps<T extends string> {
  value: T;
  onValueChange: (value: T) => void;
  options: SegmentedOption<T>[];
  /** Accessible name of the group, e.g. "View mode" */
  label: string;
  className?: string;
  /** Extra classes for each segment (e.g. the Pipeline's roomier 12px padding) */
  segmentClassName?: string;
}

// Segmented control used above every feed: "All / Eligible Now" and the grid / list switch.
// Figma 295:5057 / 188:7362: no stroke, brand-light fill when on, subtle neutral fill when off.
// Each segment is a shadcn Toggle, so it reads as a pressed / not-pressed button to assistive tech.
export function SegmentedToggle<T extends string>({ value, onValueChange, options, label, className, segmentClassName }: SegmentedToggleProps<T>) {
  return (
    <div role="group" aria-label={label} className={cn('flex items-center shrink-0', className)}>
      {options.map((o) => (
        <Toggle
          key={o.value}
          pressed={value === o.value}
          onPressedChange={() => onValueChange(o.value)}
          aria-label={o.ariaLabel}
          className={cn(
            'h-8 min-w-0 gap-1 rounded-none border-0 bg-[#f8fafc] px-[10px] shadow-none',
            'font-[family-name:var(--font-inter)] text-[14px] leading-5 font-medium text-text-secondary cursor-pointer',
            'hover:bg-[#ede9fc]/60 hover:text-text-secondary',
            // #7150e7 on #ede9fc is 4.4:1; this shade passes WCAG AA for the label text
            'data-[state=on]:bg-[#ede9fc] data-[state=on]:text-[#6f4fe4]',
            'first:rounded-l-[10px] last:rounded-r-[10px]',
            segmentClassName,
          )}
        >
          {o.icon}
          {o.label}
          {o.count !== undefined && (
            <span
              className={cn(
                'rounded-[6px] px-[6px] text-[12px] leading-[18px] font-medium text-[#344054]',
                value === o.value ? 'bg-white' : 'bg-[#eef2f6]',
              )}
            >
              {o.count}
            </span>
          )}
        </Toggle>
      ))}
    </div>
  );
}
