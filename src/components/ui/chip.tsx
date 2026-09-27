'use client';

import React from 'react';
import { cn } from '@/lib/utils';
import { X } from 'lucide-react';

export type ChipTone = 'approved' | 'pending' | 'denied' | 'information' | 'disable' | 'primary' | 'neutral';
export type ChipStyle = 'soft' | 'solid' | 'outline';

export interface ChipProps extends React.HTMLAttributes<HTMLSpanElement> {
  label?: React.ReactNode;
  tone?: ChipTone;
  variantStyle?: ChipStyle;
  icon?: React.ReactNode;
  onDismiss?: () => void;
  interactive?: boolean;
  selected?: boolean;
}

export const Chip: React.FC<ChipProps> = ({
  className,
  label,
  children,
  tone = 'information',
  variantStyle = 'soft',
  icon,
  onDismiss,
  interactive = false,
  selected = false,
  ...props
}) => {
  const content = label || children;

  // Base styles matching Figma Chip component
  const baseStyles =
    'inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full text-xs font-semibold select-none transition-all duration-150 leading-tight';

  // Soft Tint Variant (Figma Row 1)
  const softStyles: Record<ChipTone, string> = {
    approved: 'bg-[#D1F4E0] text-[#0F6B43] hover:bg-[#C2EED4]',
    pending: 'bg-[#FEF1DC] text-[#9A6216] hover:bg-[#FDE7C4]',
    denied: 'bg-[#FCE8E8] text-[#C43636] hover:bg-[#F9D5D5]',
    information: 'bg-[#DCEAF7] text-[#175CD3] hover:bg-[#CDE1F4]',
    disable: 'bg-[#EAECF0] text-[#475467] hover:bg-[#E4E7EC]',
    primary: 'bg-[#E0E7FF] text-[#4F46E5] hover:bg-[#C7D2FE]',
    neutral: 'bg-[#F2F4F7] text-[#344054] hover:bg-[#EAECF0]',
  };

  // Solid Vibrant Variant (Figma Row 2)
  const solidStyles: Record<ChipTone, string> = {
    approved: 'bg-[#22C55E] text-white shadow-2xs hover:bg-[#16A34A]',
    pending: 'bg-[#F59E0B] text-white shadow-2xs hover:bg-[#D97706]',
    denied: 'bg-[#EF4444] text-white shadow-2xs hover:bg-[#DC2626]',
    information: 'bg-[#3B82F6] text-white shadow-2xs hover:bg-[#2563EB]',
    disable: 'bg-[#98A2B3] text-white hover:bg-[#667085]',
    primary: 'bg-[#4F46E5] text-white shadow-2xs hover:bg-[#4338CA]',
    neutral: 'bg-[#344054] text-white hover:bg-[#1D2939]',
  };

  // Outline / Bordered Variant (Figma Row 3)
  const outlineStyles: Record<ChipTone, string> = {
    approved: 'border border-[#22C55E] text-[#16A34A] bg-[#22C55E]/10 hover:bg-[#22C55E]/15',
    pending: 'border border-[#F59E0B] text-[#D97706] bg-[#F59E0B]/10 hover:bg-[#F59E0B]/15',
    denied: 'border border-[#EF4444] text-[#DC2626] bg-[#EF4444]/10 hover:bg-[#EF4444]/15',
    information: 'border border-[#3B82F6] text-[#2563EB] bg-[#3B82F6]/10 hover:bg-[#3B82F6]/15',
    disable: 'border border-[#98A2B3] text-[#667085] bg-[#98A2B3]/10 hover:bg-[#98A2B3]/15',
    primary: 'border border-[#4F46E5] text-[#4F46E5] bg-[#4F46E5]/10 hover:bg-[#4F46E5]/15',
    neutral: 'border border-[#D0D5DD] text-[#344054] bg-white hover:bg-[#F9FAFB]',
  };

  const getVariantClass = () => {
    switch (variantStyle) {
      case 'solid':
        return solidStyles[tone] || solidStyles.information;
      case 'outline':
        return outlineStyles[tone] || outlineStyles.information;
      case 'soft':
      default:
        return softStyles[tone] || softStyles.information;
    }
  };

  const interactiveStyles = interactive
    ? 'cursor-pointer active:scale-95 ' + (selected ? 'ring-2 ring-offset-1 ring-[#4F46E5]' : '')
    : '';

  return (
    <span className={cn(baseStyles, getVariantClass(), interactiveStyles, className)} {...props}>
      {icon && <span className="shrink-0">{icon}</span>}
      <span className="truncate">{content}</span>
      {onDismiss && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onDismiss();
          }}
          className="p-0.5 rounded-full hover:bg-black/10 text-current transition-colors ml-0.5"
          title="Remove"
        >
          <X className="w-3 h-3" />
        </button>
      )}
    </span>
  );
};
