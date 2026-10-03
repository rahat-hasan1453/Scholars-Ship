'use client';

import React from 'react';

interface HighScholarLogoProps {
  className?: string;
  showSubtitle?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

export const HighScholarLogo: React.FC<HighScholarLogoProps> = ({
  className = '',
  showSubtitle = true,
  size = 'md',
}) => {
  const iconSizes = {
    sm: 'w-7 h-7',
    md: 'w-8 h-8',
    lg: 'w-10 h-10',
  };

  return (
    <div className={`flex items-center gap-2.5 cursor-pointer select-none group ${className}`}>
      {/* Official HighScholar Brand Logo from User Image */}
      <img
        src="/highscholar-logo.png"
        alt="HighScholar Logo"
        className={`${iconSizes[size]} object-contain shrink-0 group-hover:scale-105 transition-transform duration-200`}
      />

      <div>
        <div className="flex items-center gap-1.5 leading-none">
          <span className="font-bold text-sm tracking-tight text-[#101828]">
            HighScholar
          </span>
          <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-[#EDE9FE] text-[#5B3FD1]">
            PRO
          </span>
        </div>
        {showSubtitle && (
          <p className="text-[11px] text-[#64748B] font-normal mt-1 leading-none">
            Academic Discovery
          </p>
        )}
      </div>
    </div>
  );
};
