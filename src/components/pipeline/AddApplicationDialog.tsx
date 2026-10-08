'use client';

import React, { useMemo } from 'react';
import { useApp } from '@/context/AppContext';
import type { ApplicationStatus, OutreachStatus } from '@/types';
import type { PipelineMode } from '@/lib/pipeline';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/shadcn/dialog';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/shadcn/command';

interface AddApplicationDialogProps {
  mode: PipelineMode;
  /** Column the new card goes into; null = closed */
  status: string | null;
  onClose: () => void;
}

// "+ Add application" / column "+" / "Add new": search scholarships (or professors) from the context and track one.
export function AddApplicationDialog({ mode, status, onClose }: AddApplicationDialogProps) {
  const { scholarships, professors, applications, outreachRecords, saveScholarshipToTracker, saveProfessorToOutreach } = useApp();

  const options = useMemo(() => {
    if (mode === 'scholarships') {
      const tracked = new Set(applications.map((a) => a.scholarshipId));
      return scholarships
        .filter((s) => !tracked.has(s.id))
        .map((s) => ({ id: s.id, title: s.title, sub: s.provider, keywords: [s.provider, ...(s.countries ?? [])] }));
    }
    const tracked = new Set(outreachRecords.map((r) => r.professorId).filter(Boolean));
    return professors
      .filter((p) => !tracked.has(p.id))
      .map((p) => ({ id: p.id, title: p.name, sub: `${p.university}${p.labName ? ` · ${p.labName}` : ''}`, keywords: [p.university, p.labName ?? '', p.country] }));
  }, [mode, scholarships, professors, applications, outreachRecords]);

  const add = (id: string) => {
    if (!status) return;
    if (mode === 'scholarships') {
      const s = scholarships.find((x) => x.id === id);
      if (s) saveScholarshipToTracker(s, status as ApplicationStatus);
    } else {
      const p = professors.find((x) => x.id === id);
      if (p) saveProfessorToOutreach(p, status as OutreachStatus);
    }
    onClose();
  };

  const noun = mode === 'scholarships' ? 'scholarship' : 'professor';

  return (
    <Dialog open={status !== null} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="grid-cols-[minmax(0,1fr)] gap-0 overflow-hidden rounded-[16px] p-0 sm:max-w-[520px]">
        <DialogHeader className="gap-1 px-5 pt-5 pb-4 text-left">
          <DialogTitle className="text-[18px] leading-7 font-[590] text-[#101828]">
            {mode === 'scholarships' ? 'Add application' : 'Add professor'}
          </DialogTitle>
          <DialogDescription className="text-[14px] leading-5 text-[#627181]">
            Pick a {noun} to add to <span className="font-[510] text-[#344054]">{status}</span>.
          </DialogDescription>
        </DialogHeader>
        <Command className="rounded-none border-t border-[#e4e7ec]">
          <CommandInput placeholder={mode === 'scholarships' ? 'Search scholarships…' : 'Search professors…'} aria-label={`Search ${noun}s`} className="h-11" />
          <CommandList className="max-h-[340px] p-1">
            <CommandEmpty className="py-8 text-center text-[14px] text-[#627181]">
              {options.length ? `No ${noun}s match.` : `Every ${noun} is already in your pipeline.`}
            </CommandEmpty>
            <CommandGroup>
              {options.map((o) => (
                <CommandItem key={o.id} value={`${o.title} ${o.id}`} keywords={o.keywords} onSelect={() => add(o.id)} className="flex min-w-0 cursor-pointer flex-col items-stretch gap-0 rounded-[8px] px-3 py-2">
                  <span className="truncate text-[14px] leading-5 font-[510] text-[#101828]">{o.title}</span>
                  <span className="truncate text-[12px] leading-4 text-[#627181]">{o.sub}</span>
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </DialogContent>
    </Dialog>
  );
}
