'use client';

import type { ReactNode } from 'react';
import { Button } from '@/components/base/buttons/button';
import { SocialButton } from '@/components/base/buttons/social-button';

// Shared shell for the auth screens — Figma: Signup 167:2884, OTP 179:5183, Login 179:1438.

/* Input field 179:3609 — 44px, radius 8, Figma placeholder Text/Secondary */
export const authInputProps = {
  size: 'lg' as const,
  wrapperClassName: 'shadow-[0_1px_1px_rgba(0,0,0,0.05)]',
  inputClassName: 'py-3 text-sm placeholder:text-secondary',
};

export const authPasswordInputClassName = `${authInputProps.inputClassName} pr-9.5`;

/* Buttons/Button 179:4933 — 36px, Brand/Primary fill, Brand/600 border */
export const authPrimaryButtonClass =
  'w-full font-[Inter,ui-sans-serif,system-ui,sans-serif] leading-[20px] shadow-[0_1px_2px_rgba(0,0,0,0.05)]! ring-brand-600 before:hidden';

/* Terms checkbox 168:3066 — Brand/Primary when checked */
export const authCheckboxBoxClass = (selected: boolean) =>
  `mt-[2px] rounded-[2px] ${selected ? 'bg-brand-solid ring-brand-primary' : 'ring-[#767676]'}`;

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
    <div className="flex flex-col gap-[4px]">
      <h1 className="text-[24px] font-[510] leading-[32px] text-primary">{title}</h1>
      <p className="text-[14px] leading-[18px] text-secondary">{subtitle}</p>
      {children}
    </div>
  );
}

export function GoogleButton({
  onPress,
  isDisabled,
  isLoading,
  caption,
}: {
  onPress: () => void;
  isDisabled?: boolean;
  isLoading?: boolean;
  caption?: string;
}) {
  return (
    <SocialButton
      social="google"
      theme="color"
      size="lg"
      onPress={onPress}
      isDisabled={isDisabled}
      className="gap-[12px] rounded-full py-[9px] pl-[8px] pr-[15px] font-normal shadow-none before:hidden hover:bg-brand-soft [&>svg]:size-[31px] [&>svg]:p-[4px]"
    >
      <span className="flex flex-col items-start gap-[2px]">
        {caption && <span className="text-[10px] italic leading-[16px] text-text-caption">{caption}</span>}
        <span className="text-[14px] leading-[18px] text-secondary">{isLoading ? 'Connecting...' : 'Continue with Google'}</span>
      </span>
    </SocialButton>
  );
}

export function AuthFooterLink({ prompt, href, label }: { prompt: string; href: string; label: string }) {
  return (
    <div className="flex items-center">
      <span className="flex w-[158px] justify-center whitespace-nowrap text-[12px] italic leading-[18px] text-secondary">
        {prompt}&nbsp;
      </span>
      <Button
        href={href}
        color="link-gray"
        size="sm"
        className="text-[12px] font-medium italic leading-[18px] text-primary hover:text-brand-primary"
      >
        {label}
      </Button>
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
          <div className="flex w-full flex-col gap-[10px] rounded-t-[24px] bg-surface-white px-[24px] py-[36px]">
            <BrandLogo />
            {children}
          </div>

          {/* Dashed divider: 6px dash, 6px gap (a CSS dashed border can't set the gap) */}
          <div className="w-full rounded-b-[24px] bg-surface-white bg-[linear-gradient(to_right,var(--color-stroke-default)_50%,transparent_50%)] bg-[length:12px_1px] bg-top bg-repeat-x pb-[12px] pt-[13px]">
            <div className="relative flex w-full flex-col items-center gap-[8px]">
              {footer}

              {/* Corner decoration */}
              <div aria-hidden="true" className="pointer-events-none absolute left-full top-0 h-0 w-0">
                <div className="absolute left-[-37.1px] top-[68.4px] flex h-[39.6px] w-[33.5px] items-center justify-center">
                  <img src="/signup/deco-back.svg" alt="" className="h-[35.1954px] w-[18.2291px] max-w-none rotate-[-30.16deg]" />
                </div>
                <div className="absolute left-[-23.3px] top-[52.5px] flex h-[46.6px] w-[44.2px] items-center justify-center">
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
