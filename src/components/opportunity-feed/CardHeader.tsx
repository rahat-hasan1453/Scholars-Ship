import React from 'react';

interface CardHeaderProps {
  title: string;
  subtitle: string;
  /** Round flag image, or undefined to show the country label only */
  flagSrc?: string;
  countryLabel: string;
}

// Shared card title row (Figma: Opportunity card 212:6186, Scholarship Radar 239:10158)
export const CardHeader: React.FC<CardHeaderProps> = ({ title, subtitle, flagSrc, countryLabel }) => (
  <div className="relative flex items-center gap-2 px-4 py-3 bg-white border-b-[0.5px] border-[#f1f1f1] overflow-hidden shrink-0">
    <div aria-hidden className="absolute -right-[0.5px] -top-[0.5px] h-[69px] w-[151px] pointer-events-none overflow-hidden">
      <img
        src="/opportunity-feed/card-deco.png"
        alt=""
        className="absolute max-w-none left-[-0.36%] top-[1.45%] w-[100.73%] h-[98.55%]"
      />
    </div>
    <div className="relative flex flex-1 min-w-0 items-center justify-between gap-2">
      <div className="flex flex-col gap-1 min-w-0">
        <h3 className="truncate text-[16px] leading-[24px] font-semibold text-[#101828]">{title}</h3>
        <p className="truncate text-[14px] leading-5 italic text-[#627181]">{subtitle}</p>
      </div>
      <div className="flex items-center gap-1 shrink-0">
        {flagSrc && <img src={flagSrc} alt="" width={20} height={20} className="size-5 rounded-full" />}
        <span className="text-[12px] leading-[18px] italic font-medium text-[#627181]">{countryLabel}</span>
      </div>
    </div>
  </div>
);
