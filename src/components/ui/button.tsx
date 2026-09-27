'use client';

import React from 'react';
import { cn } from '@/lib/utils';
import { Loader2 } from 'lucide-react';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'success' | 'urgent' | 'outline' | 'ghost';
  size?: 'sm' | 'default' | 'lg' | 'icon';
  isLoading?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size = 'default', isLoading = false, children, disabled, ...props }, ref) => {
    const baseStyles =
      'inline-flex items-center justify-center font-semibold rounded-xl transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none active:scale-[0.98] select-none';

    const variants = {
      // Primary Deep Indigo (#1E3A8A)
      primary:
        'bg-[#1E3A8A] text-white hover:bg-[#172554] shadow-sm hover:shadow focus-visible:ring-[#1E3A8A]',
      // Secondary Soft Slate (#64748B)
      secondary:
        'bg-[#64748B] text-white hover:bg-[#475569] shadow-sm hover:shadow focus-visible:ring-[#64748B]',
      // Success Sage Green (#059669)
      success:
        'bg-[#059669] text-white hover:bg-[#047857] shadow-sm hover:shadow focus-visible:ring-[#059669]',
      // Urgent / Danger Red (#DC2626)
      urgent:
        'bg-[#DC2626] text-white hover:bg-[#B91C1C] shadow-sm hover:shadow focus-visible:ring-[#DC2626]',
      // Bordered / Outline
      outline:
        'border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 hover:border-slate-300 focus-visible:ring-slate-400',
      // Borderless / Ghost
      ghost:
        'text-slate-600 hover:text-slate-900 hover:bg-slate-100/80 focus-visible:ring-slate-300',
    };

    const sizes = {
      sm: 'text-xs px-2.5 py-1.5 gap-1.5',
      default: 'text-xs px-4 py-2 gap-2',
      lg: 'text-sm px-5 py-2.5 gap-2.5',
      icon: 'p-2',
    };

    return (
      <button
        ref={ref}
        disabled={disabled || isLoading}
        className={cn(baseStyles, variants[variant], sizes[size], className)}
        {...props}
      >
        {isLoading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
        {children}
      </button>
    );
  }
);

Button.displayName = 'Button';
