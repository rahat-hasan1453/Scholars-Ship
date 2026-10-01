'use client';

import type { ComponentProps, ReactNode } from 'react';
import Link from 'next/link';
import { Button } from '@/components/shadcn/button';
import { Checkbox } from '@/components/shadcn/checkbox';
import { Input } from '@/components/shadcn/input';
import { Label } from '@/components/shadcn/label';
import { cn } from '@/lib/utils';

// Shared shell for the auth screens — Figma: Signup 167:2884, OTP 179:5183, Login 179:1438.
// Radii are explicit because the app's legacy :root --radius-* tokens override Tailwind's rounded-* scale.

/* Input 184:5103 — 44px, radius-lg 10, px 10, text-sm, muted-foreground placeholder */
const fieldClass = 'h-11 rounded-[10px] bg-background shadow-none';

export function AuthInput({ className, ...props }: ComponentProps<typeof Input>) {
  return <Input className={cn(fieldClass, 'px-2.5', className)} {...props} />;
}

/* Button 185:6449 — 36px, radius-sm 6, Brand/Primary, Body/2 M */
export function AuthSubmitButton({ className, ...props }: ComponentProps<typeof Button>) {
  return <Button type="submit" className={cn('h-9 w-full rounded-[6px] px-2 font-[510] leading-5', className)} {...props} />;
}

/* Terms checkbox 185:6594 */
export function TermsCheckbox({ checked, onCheckedChange }: { checked: boolean; onCheckedChange: (v: boolean) => void }) {
  return (
    <div className="flex items-center gap-2">
      <Checkbox id="terms" checked={checked} onCheckedChange={(v) => onCheckedChange(v === true)} className="shadow-none" />
      <Label htmlFor="terms" className="text-xs font-normal italic leading-4 text-text-body">
        <span>
          I agree to Scholars&apos;ship&apos;s <span className="text-brand-primary">Terms of Service</span> and{' '}
          <span className="text-brand-primary">Privacy Policy</span>.
        </span>
      </Label>
    </div>
  );
}

export function AuthMessage({ error, success }: { error?: string; success?: string }) {
  if (error) {
    return (
      <p role="alert" className="mt-2 text-xs leading-4 text-destructive">
        {error}
      </p>
    );
  }
  if (success) {
    return <p className="mt-2 text-xs leading-4 text-success-main">{success}</p>;
  }
  return null;
}

/* Scholars'ship wordmark (Title Area 167:2890) */
export function BrandLogo() {
  return (
    <div className="flex items-center gap-2" aria-label="Scholars'ship">
      <div className="relative h-[35.635px] w-[45.68px] shrink-0">
        <img src="/signup/logo-mark-back.svg" alt="" className="absolute left-0 top-[1.69px] h-[34.313px] w-[17.77px]" />
        <img src="/signup/logo-mark-front.svg" alt="" className="absolute left-[16.58px] top-0 h-[35.635px] w-[29.1px]" />
      </div>
      <div className="relative h-[47.963px] w-[186.329px] shrink-0">
        <img src="/signup/logo-scholars.svg" alt="" className="absolute left-0 top-[9.82px] h-[23.576px] w-[125.897px]" />
        <img src="/signup/logo-ship.svg" alt="" className="absolute left-[127.44px] top-0 h-[47.963px] w-[58.889px]" />
      </div>
    </div>
  );
}

/* Title/2 + Body/2 R, followed by optional status messages */
export function AuthHeading({ title, subtitle, children }: { title: string; subtitle: string; children?: ReactNode }) {
  return (
    <div className="flex flex-col gap-1">
      <h1 className="text-2xl font-[510] leading-8 text-text-primary">{title}</h1>
      <p className="text-sm leading-[18px] text-text-secondary">{subtitle}</p>
      {children}
    </div>
  );
}

/* Google pill 179:5161 — outline button, Stroke/Default border */
export function GoogleButton({
  onClick,
  disabled,
  isLoading,
  caption,
}: {
  onClick: () => void;
  disabled?: boolean;
  isLoading?: boolean;
  caption?: string;
}) {
  return (
    <Button
      type="button"
      variant="outline"
      onClick={onClick}
      disabled={disabled}
      className="h-auto gap-3 rounded-full border-stroke-default py-2 pl-2 pr-[15px] font-normal shadow-none hover:bg-brand-soft"
    >
      <img src="/signup/google.svg" alt="" className="size-[31px]" />
      <span className="flex flex-col items-start gap-0.5">
        {caption && <span className="text-[10px] italic leading-4 text-text-caption">{caption}</span>}
        <span className="text-sm leading-[18px] text-text-secondary">{isLoading ? 'Connecting...' : 'Continue with Google'}</span>
      </span>
    </Button>
  );
}

/* Caption/1 It — prompt + link */
export function AuthFooterLink({ prompt, href, label }: { prompt: string; href: string; label: string }) {
  return (
    <div className="flex items-center text-xs italic leading-[18px]">
      <span className="flex w-[158px] justify-center whitespace-nowrap font-normal text-text-secondary">{prompt}&nbsp;</span>
      <Link href={href} className="font-[508] text-text-primary hover:text-brand-primary">
        {label}
      </Link>
    </div>
  );
}

export function AuthLayout({ children, footer }: { children: ReactNode; footer: ReactNode }) {
  return (
    <div className="relative flex min-h-screen w-full flex-col bg-surface-bg tracking-normal lg:flex-row">
      {/* Image Container — 810 × 883 at 1728 × 883 */}
      <div className="relative h-[240px] w-full shrink-0 select-none overflow-hidden sm:h-[320px] lg:sticky lg:top-0 lg:h-screen lg:w-[46.875%]">
        <img
          src="/login-figma-banner.jpg"
          alt="Graduate celebrating with a purple cap"
          className="h-full w-full object-cover object-center"
        />
      </div>

      {/* Right canvas — card centred at x = 1280 of 1728 */}
      <div className="flex flex-1 items-center justify-center px-4 py-8 lg:pl-[22px] lg:pr-0 lg:py-10">
        <div className="w-full max-w-[472px] overflow-hidden">
          <div className="flex w-full flex-col gap-2.5 rounded-t-[24px] bg-surface-white px-6 py-9">
            <BrandLogo />
            {children}
          </div>

          {/* Dashed divider: 6px dash, 6px gap (a CSS dashed border can't set the gap) */}
          <div className="w-full rounded-b-[24px] bg-surface-white bg-[linear-gradient(to_right,var(--color-stroke-default)_50%,transparent_50%)] bg-[length:12px_1px] bg-top bg-repeat-x pb-3 pt-[13px]">
            <div className="relative flex w-full flex-col items-center gap-2">
              {footer}

              {/* Corner decoration — anchored to the footer content's bottom edge (Figma Login 179:5177) */}
              <div aria-hidden="true" className="pointer-events-none absolute bottom-0 left-full size-0">
                <div className="absolute left-[-37.1px] top-[-6.8px] flex h-[39.6px] w-[33.5px] items-center justify-center">
                  <img src="/signup/deco-back.svg" alt="" className="h-[35.1954px] w-[18.2291px] max-w-none rotate-[-30.16deg]" />
                </div>
                <div className="absolute left-[-23.3px] top-[-22.7px] flex h-[46.6px] w-[44.2px] items-center justify-center">
                  <img src="/signup/deco-front.svg" alt="" className="h-[36.5512px] w-[29.8519px] max-w-none rotate-[-30.16deg]" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
