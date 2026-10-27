'use client';

import React, { useId, useState } from 'react';
import { Check, ChevronDown } from 'lucide-react';
import { Command, CommandEmpty, CommandGroup, CommandItem, CommandInput, CommandList } from '@/components/shadcn/command';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/shadcn/popover';
import { cn } from '@/lib/utils';

export interface SingleSelectOption {
  value: string;
  label: string;
}

interface SingleSelectFieldProps {
  label: string;
  options: SingleSelectOption[];
  value: string;
  onChange: (next: string) => void;
  /** Shows a search box inside the dropdown */
  searchable?: boolean;
}

// One-choice twin of MultiSelectField: same shadcn Popover + Command dropdown, same field look, tick on the chosen row.
export function SingleSelectField({ label, options, value, onChange, searchable = false }: SingleSelectFieldProps) {
  const [open, setOpen] = useState(false);
  const labelId = useId();
  const listId = useId();
  const current = options.find((o) => o.value === value);

  return (
    <div className="flex min-w-0 flex-col gap-1">
      <span id={labelId} className="text-[12px] leading-4 font-medium text-[#344054]">
        {label}
      </span>

      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <button
            type="button"
            role="combobox"
            aria-expanded={open}
            aria-controls={listId}
            aria-labelledby={labelId}
            className={cn(
              'flex h-9 w-full cursor-pointer items-center justify-between gap-2 rounded-[10px] border bg-white px-[10px] text-left text-[14px] leading-5 font-normal text-[#101828] transition-colors',
              open ? 'border-[#7150e7] ring-[3px] ring-[#7150e7]/15' : 'border-[#e5e5e5] hover:border-[#d0d5dd]',
            )}
          >
            <span className="truncate">{current?.label ?? ''}</span>
            <ChevronDown aria-hidden strokeWidth={1.5} className={cn('size-4 shrink-0 text-text-secondary transition-transform', open && 'rotate-180')} />
          </button>
        </PopoverTrigger>

        <PopoverContent
          id={listId}
          align="start"
          sideOffset={6}
          className="w-(--radix-popover-trigger-width) min-w-[200px] rounded-[10px] border-[#e5e5e5] p-0 shadow-lg"
        >
          <Command>
            {searchable && <CommandInput placeholder={`Search ${label.toLowerCase()}...`} className="text-[13px]" />}
            <CommandList className="max-h-60">
              <CommandEmpty className="py-4 text-center text-[12px] text-text-secondary">No match found.</CommandEmpty>
              <CommandGroup>
                {options.map((option) => {
                  const chosen = option.value === value;
                  return (
                    <CommandItem
                      key={option.value}
                      value={option.label}
                      onSelect={() => {
                        onChange(option.value);
                        setOpen(false);
                      }}
                      className="cursor-pointer gap-2 rounded-md px-2 py-1.5 text-[13px] text-text-secondary data-[selected=true]:bg-[#f4f2fd]"
                    >
                      <span className={cn('flex-1 truncate', chosen && 'font-medium text-[#7150e7]')}>{option.label}</span>
                      {chosen && <Check aria-hidden strokeWidth={2} className="size-4 shrink-0 text-[#7150e7]" />}
                    </CommandItem>
                  );
                })}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
    </div>
  );
}
