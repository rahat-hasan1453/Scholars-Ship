'use client';

import React, { useEffect, useId, useRef, useState } from 'react';
import { ChevronDown, X } from 'lucide-react';
import { Badge } from '@/components/shadcn/badge';
import { Checkbox } from '@/components/shadcn/checkbox';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/shadcn/command';
import { Popover, PopoverAnchor, PopoverContent, PopoverTrigger } from '@/components/shadcn/popover';
import { cn } from '@/lib/utils';

const CHIP_GAP = 4;
// Figma "+2" chip is 29px wide; a two-digit count needs a little more
const MORE_CHIP_WIDTH = 36;

interface MultiSelectFieldProps {
  label: string;
  options: string[];
  selected: string[];
  onChange: (next: string[]) => void;
  /** Shows a search box inside the dropdown */
  searchable?: boolean;
  placeholder?: string;
  /** Optional image shown before an option (e.g. a country flag) */
  optionIcons?: Record<string, string>;
  /** Optional one-line explanation shown under an option */
  optionDescriptions?: Record<string, string>;
}

const chipClass =
  'h-[22px] gap-1 rounded-full border-0 bg-[#f0f3f4] px-2 py-[5px] font-figtree text-[12px] leading-[18px] font-medium text-[#212b36]';

// Figma "Input" field with chips (212:6352) + shadcn Popover/Command dropdown.
export function MultiSelectField({
  label,
  options,
  selected,
  onChange,
  searchable = false,
  placeholder = 'Select...',
  optionIcons,
  optionDescriptions,
}: MultiSelectFieldProps) {
  const [open, setOpen] = useState(false);
  const [visibleCount, setVisibleCount] = useState(selected.length);
  const anchorRef = useRef<HTMLDivElement>(null);
  const chipAreaRef = useRef<HTMLDivElement>(null);
  const measureRef = useRef<HTMLDivElement>(null);
  const labelId = useId();

  const toggle = (value: string) =>
    onChange(selected.includes(value) ? selected.filter((v) => v !== value) : [...selected, value]);
  const remove = (value: string) => onChange(selected.filter((v) => v !== value));

  // Show as many chips as fit; the rest collapse into a "+N" chip
  useEffect(() => {
    const area = chipAreaRef.current;
    const measure = measureRef.current;
    if (!area || !measure) return;
    const recompute = () => {
      const available = area.offsetWidth;
      const widths = Array.from(measure.children, (el) => (el as HTMLElement).offsetWidth);
      let used = 0;
      let count = 0;
      for (let i = 0; i < widths.length; i++) {
        const next = used + (count > 0 ? CHIP_GAP : 0) + widths[i];
        const needsMore = i < widths.length - 1;
        if (next + (needsMore ? CHIP_GAP + MORE_CHIP_WIDTH : 0) > available) break;
        used = next;
        count++;
      }
      setVisibleCount(count);
    };
    const observer = new ResizeObserver(recompute);
    observer.observe(area);
    observer.observe(measure);
    return () => observer.disconnect();
  }, [selected]);

  const hiddenCount = selected.length - Math.min(visibleCount, selected.length);

  return (
    <div className="flex min-w-0 flex-col gap-1">
      <span
        id={labelId}
        className="text-[12px] leading-[18px] font-medium italic text-text-secondary whitespace-nowrap"
      >
        {label}
      </span>

      <Popover open={open} onOpenChange={setOpen}>
        <PopoverAnchor asChild>
          <div
            ref={anchorRef}
            onClick={() => setOpen((o) => !o)}
            className={cn(
              'relative flex h-11 w-full cursor-pointer items-center gap-2 overflow-clip rounded-[10px] border bg-white px-[10px] py-1 transition-colors',
              open ? 'border-[#7150e7] ring-[3px] ring-[#7150e7]/15' : 'border-[#e5e5e5] hover:border-[#d0d5dd]'
            )}
          >
            <div ref={chipAreaRef} className="flex min-w-0 flex-1 items-start gap-1">
              {selected.length === 0 ? (
                <span className="truncate text-[12px] leading-[18px] italic text-[#627181]">{placeholder}</span>
              ) : (
                <>
                  {selected.slice(0, visibleCount).map((value) => (
                    <Badge key={value} variant="secondary" className={chipClass}>
                      {value}
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          remove(value);
                        }}
                        aria-label={`Remove ${value}`}
                        className="flex size-4 cursor-pointer items-center justify-center rounded-full hover:bg-black/5"
                      >
                        <X aria-hidden strokeWidth={1.5} className="size-3 text-text-secondary" />
                      </button>
                    </Badge>
                  ))}
                  {hiddenCount > 0 && (
                    <Badge variant="secondary" className={cn(chipClass, 'min-w-[29px] gap-0 italic')}>
                      +{hiddenCount}
                    </Badge>
                  )}
                </>
              )}
            </div>

            <PopoverTrigger asChild>
              <button
                type="button"
                onClick={(e) => e.stopPropagation()}
                aria-label={`${label} options`}
                className="flex size-4 shrink-0 cursor-pointer items-center justify-center"
              >
                <ChevronDown
                  aria-hidden
                  strokeWidth={1.5}
                  className={cn('size-4 text-text-secondary transition-transform', open && 'rotate-180')}
                />
              </button>
            </PopoverTrigger>

            {/* Off-screen copy of every chip, used only to measure widths */}
            <div
              ref={measureRef}
              aria-hidden
              className="pointer-events-none invisible absolute left-0 top-0 flex gap-1"
            >
              {selected.map((value) => (
                <span key={value} className={cn('inline-flex shrink-0 items-center', chipClass)}>
                  {value}
                  <span className="size-4" />
                </span>
              ))}
            </div>
          </div>
        </PopoverAnchor>

        <PopoverContent
          align="start"
          sideOffset={6}
          className="w-(--radix-popover-trigger-width) min-w-[220px] rounded-[10px] border-[#e5e5e5] p-0 shadow-lg"
          onInteractOutside={(e) => {
            // Clicks on the field itself toggle the dropdown; don't let them also dismiss it
            if (anchorRef.current?.contains(e.target as Node)) e.preventDefault();
          }}
        >
          <Command>
            {searchable && (
              <CommandInput placeholder={`Search ${label.toLowerCase()}...`} className="text-[13px]" />
            )}
            <CommandList className="max-h-60">
              <CommandEmpty className="py-4 text-center text-[12px] text-text-secondary">No match found.</CommandEmpty>
              <CommandGroup>
                {options.map((option) => {
                  const checked = selected.includes(option);
                  return (
                    <CommandItem
                      key={option}
                      value={option}
                      onSelect={() => toggle(option)}
                      className={cn(
                        'cursor-pointer gap-2 rounded-md px-2 py-1.5 text-[13px] text-text-secondary data-[selected=true]:bg-[#f4f2fd]',
                        optionDescriptions?.[option] && 'items-start [&>[data-slot=checkbox]]:mt-0.5'
                      )}
                    >
                      <Checkbox
                        checked={checked}
                        tabIndex={-1}
                        aria-hidden
                        // CommandItem greys out un-coloured svgs; keep the tick white on brand purple
                        className="pointer-events-none border-[#d0d5dd] bg-white data-[state=checked]:border-[#7150e7] data-[state=checked]:bg-[#7150e7] [&_svg]:!text-white"
                      />
                      {optionIcons?.[option] && (
                        <img src={optionIcons[option]} alt="" width={20} height={20} className="size-5 shrink-0 rounded-full" />
                      )}
                      <span className="flex min-w-0 flex-col">
                        <span className={cn('truncate', checked && 'font-medium text-[#7150e7]')}>{option}</span>
                        {optionDescriptions?.[option] && (
                          <span className="text-[12px] leading-4 text-text-secondary">{optionDescriptions[option]}</span>
                        )}
                      </span>
                    </CommandItem>
                  );
                })}
              </CommandGroup>
            </CommandList>
            {selected.length > 0 && (
              <div className="flex items-center justify-between border-t border-[#f1f1f1] px-3 py-2">
                <span className="text-[12px] text-text-secondary">{selected.length} selected</span>
                <button
                  type="button"
                  onClick={() => onChange([])}
                  className="cursor-pointer text-[12px] font-medium text-[#7150e7] hover:underline"
                >
                  Clear all
                </button>
              </div>
            )}
          </Command>
        </PopoverContent>
      </Popover>
    </div>
  );
}
