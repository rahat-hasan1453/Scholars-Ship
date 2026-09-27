'use client';

import React from 'react';
import { cn } from '@/lib/utils';

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: 'default' | 'approved' | 'pending' | 'denied' | 'information' | 'solid-approved' | 'solid-pending' | 'solid-denied' | 'solid-information' | 'indigo' | 'slate' | 'sage' | 'gold' | 'crimson' | 'outline';
}

export const Badge: React.FC<BadgeProps> = ({ className, variant = 'default', children, ...props }) => {
  const baseStyles = 'inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full text-xs font-semibold select-none transition-colors';

  const variants = {
    // Figma Soft Row
    default: 'bg-[#EAECF0] text-[#475467]',
    approved: 'bg-[#D1F4E0] text-[#0F6B43]',
    pending: 'bg-[#FEF1DC] text-[#9A6216]',
    denied: 'bg-[#FCE8E8] text-[#C43636]',
    information: 'bg-[#DCEAF7] text-[#175CD3]',
    
    // Figma Solid Row
    'solid-approved': 'bg-[#22C55E] text-white shadow-2xs',
    'solid-pending': 'bg-[#F59E0B] text-white shadow-2xs',
    'solid-denied': 'bg-[#EF4444] text-white shadow-2xs',
    'solid-information': 'bg-[#3B82F6] text-white shadow-2xs',

    // Legacy Aliases with Figma Colors
    indigo: 'bg-[#E0E7FF] text-[#4F46E5]',
    slate: 'bg-[#EAECF0] text-[#475467]',
    sage: 'bg-[#D1F4E0] text-[#0F6B43]',
    gold: 'bg-[#FEF1DC] text-[#9A6216]',
    crimson: 'bg-[#FCE8E8] text-[#C43636]',
    outline: 'border border-[#D0D5DD] text-[#344054] bg-white',
  };

  return (
    <span className={cn(baseStyles, variants[variant], className)} {...props}>
      {children}
    </span>
  );
};
