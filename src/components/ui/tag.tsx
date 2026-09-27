'use client';

import React from 'react';
import { cn } from '@/lib/utils';
import { X } from 'lucide-react';

export interface TagProps extends React.HTMLAttributes<HTMLSpanElement> {
  label: string;
  onDismiss?: () => void;
  variant?: 'default' | 'approved' | 'pending' | 'denied' | 'information' | 'indigo' | 'sage' | 'gold';
}

export const Tag: React.FC<TagProps> = ({ className, label, onDismiss, variant = 'default', ...props }) => {
  const baseStyles =
    'inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold transition-all duration-150 select-none';

  const variants = {
    default: 'bg-[#EAECF0] text-[#475467] hover:bg-[#E4E7EC]',
    approved: 'bg-[#D1F4E0] text-[#0F6B43] hover:bg-[#C2EED4]',
    pending: 'bg-[#FEF1DC] text-[#9A6216] hover:bg-[#FDE7C4]',
    denied: 'bg-[#FCE8E8] text-[#C43636] hover:bg-[#F9D5D5]',
    information: 'bg-[#DCEAF7] text-[#175CD3] hover:bg-[#CDE1F4]',
    indigo: 'bg-[#E0E7FF] text-[#4F46E5] hover:bg-[#C7D2FE]',
    sage: 'bg-[#D1F4E0] text-[#0F6B43] hover:bg-[#C2EED4]',
    gold: 'bg-[#FEF1DC] text-[#9A6216] hover:bg-[#FDE7C4]',
  };

  return (
    <span className={cn(baseStyles, variants[variant], className)} {...props}>
      <span className="truncate">{label}</span>
      {onDismiss && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onDismiss();
          }}
          className="p-0.5 rounded-full hover:bg-black/10 text-current transition-colors ml-0.5"
          title="Remove tag"
        >
          <X className="w-3 h-3" />
        </button>
      )}
    </span>
  );
};
