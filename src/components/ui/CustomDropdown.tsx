'use client';

import React, { useState, useRef, useEffect, useMemo } from 'react';
import { ChevronDown, Search, Check, X } from 'lucide-react';

export interface DropdownOption {
  label: string;
  value: string;
  icon?: React.ReactNode;
  category?: string;
}

export interface CustomDropdownProps {
  label?: string;
  options: (string | DropdownOption)[];
  value: string | string[];
  onChange: (value: any) => void;
  isMulti?: boolean;
  placeholder?: string;
  searchPlaceholder?: string;
  showSearch?: boolean;
  className?: string;
  buttonClassName?: string;
  menuClassName?: string;
  variant?: 'card' | 'pill' | 'default';
  disabled?: boolean;
  align?: 'left' | 'right';
}

export const CustomDropdown: React.FC<CustomDropdownProps> = ({
  label,
  options,
  value,
  onChange,
  isMulti = false,
  placeholder = 'Select...',
  searchPlaceholder = 'Search...',
  showSearch = true,
  className = '',
  buttonClassName = '',
  menuClassName = '',
  variant = 'default',
  disabled = false,
  align = 'left',
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);

  // Normalize options
  const normalizedOptions = useMemo<DropdownOption[]>(() => {
    return options.map((opt) =>
      typeof opt === 'string' ? { label: opt, value: opt } : opt
    );
  }, [options]);

  // Click outside listener
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  // Escape key listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        setIsOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  // Filtered options based on search
  const filteredOptions = useMemo(() => {
    if (!searchQuery.trim()) return normalizedOptions;
    const q = searchQuery.toLowerCase();
    return normalizedOptions.filter(
      (opt) =>
        opt.label.toLowerCase().includes(q) ||
        opt.value.toLowerCase().includes(q) ||
        (opt.category && opt.category.toLowerCase().includes(q))
    );
  }, [normalizedOptions, searchQuery]);

  // Current display text or selection
  const selectedValues = useMemo<string[]>(() => {
    if (Array.isArray(value)) return value;
    return value ? [value] : [];
  }, [value]);

  const currentSelectedOption = useMemo(() => {
    return normalizedOptions.find((opt) => opt.value === value);
  }, [normalizedOptions, value]);

  const selectedOptions = useMemo(() => {
    return normalizedOptions.filter((opt) => selectedValues.includes(opt.value));
  }, [normalizedOptions, selectedValues]);

  const handleSelect = (optValue: string) => {
    if (isMulti) {
      if (optValue === 'ALL') {
        // If clicking 'ALL', reset selection to ['ALL']
        onChange(['ALL']);
        return;
      }

      // If clicking a specific item, remove 'ALL' if it was present
      const withoutAll = selectedValues.filter((v) => v !== 'ALL');
      const exists = withoutAll.includes(optValue);
      const next = exists
        ? withoutAll.filter((v) => v !== optValue)
        : [...withoutAll, optValue];

      // If user unchecks everything, fall back to ['ALL'] if 'ALL' option exists, or []
      if (next.length === 0 && normalizedOptions.some((o) => o.value === 'ALL')) {
        onChange(['ALL']);
      } else {
        onChange(next);
      }
    } else {
      onChange(optValue);
      setIsOpen(false);
    }
  };

  const handleSelectAll = () => {
    const nonAllOptions = normalizedOptions
      .filter((o) => o.value !== 'ALL')
      .map((o) => o.value);
    onChange(nonAllOptions.length > 0 ? nonAllOptions : normalizedOptions.map((o) => o.value));
  };

  const handleClearAll = () => {
    if (normalizedOptions.some((o) => o.value === 'ALL')) {
      onChange(['ALL']);
    } else {
      onChange([]);
    }
  };

  // Determine button styles by variant
  let baseButtonStyles = '';
  if (variant === 'card') {
    baseButtonStyles =
      'h-[48px] rounded-2xl border-2 border-[#7150E7] bg-[#F0EEFA] px-4 py-1.5 flex items-center justify-between cursor-pointer hover:border-[#6039DB] transition-all shadow-2xs select-none';
  } else if (variant === 'pill') {
    baseButtonStyles =
      'h-9 bg-white border border-[#D0D5DD] hover:border-slate-400 text-[#344054] text-xs font-medium rounded-full px-4 flex items-center justify-between gap-2 shadow-2xs transition-colors cursor-pointer select-none';
  } else {
    baseButtonStyles =
      'h-9 bg-white border border-[#d0d5dd] hover:border-slate-400 text-[#344054] text-xs font-medium rounded-xl px-3 flex items-center justify-between gap-2 shadow-2xs transition-colors cursor-pointer select-none';
  }

  // Multi-select display helper
  const renderMultiContent = () => {
    if (selectedValues.length === 0) {
      return <span className="text-text-secondary">{placeholder}</span>;
    }
    if (selectedValues.includes('ALL')) {
      const allOpt = normalizedOptions.find((o) => o.value === 'ALL');
      return (
        <span className="inline-flex items-center gap-1.5 truncate">
          {allOpt?.icon}
          <span>{allOpt?.label || 'All'}</span>
        </span>
      );
    }
    if (selectedValues.length === 1) {
      const single = selectedOptions[0] || normalizedOptions.find((o) => o.value === selectedValues[0]);
      return (
        <span className="inline-flex items-center gap-1.5 truncate">
          {single?.icon}
          <span className="truncate">{single?.label || selectedValues[0]}</span>
        </span>
      );
    }
    // More than 1 item selected
    const first = selectedOptions[0] || normalizedOptions.find((o) => o.value === selectedValues[0]);
    return (
      <span className="inline-flex items-center gap-1.5 truncate min-w-0">
        {first?.icon}
        <span className="truncate font-semibold text-[#101828]">
          {first?.label || selectedValues[0]}
        </span>
        <span className="shrink-0 bg-[#EDE9FC] text-[#7150E7] text-[10px] font-bold px-1.5 py-0.5 rounded-full">
          +{selectedValues.length - 1}
        </span>
      </span>
    );
  };

  return (
    <div ref={containerRef} className={`relative ${className} ${isOpen ? 'z-[100]' : 'z-10'}`}>
      {/* Trigger Button */}
      <button
        type="button"
        disabled={disabled}
        onClick={() => setIsOpen((prev) => !prev)}
        className={`w-full text-left ${baseButtonStyles} ${buttonClassName} ${
          disabled ? 'opacity-50 cursor-not-allowed' : ''
        }`}
      >
        {variant === 'card' ? (
          <div className="min-w-0 pr-2 flex-1">
            {label && (
              <div className="text-[11px] text-[#667085] leading-none mb-1 font-medium">
                {label}
              </div>
            )}
            <div className="text-sm font-semibold text-[#101828] leading-tight truncate">
              {isMulti ? renderMultiContent() : currentSelectedOption ? currentSelectedOption.label : placeholder}
            </div>
          </div>
        ) : (
          <div className="min-w-0 flex-1 truncate">
            {isMulti ? (
              renderMultiContent()
            ) : currentSelectedOption ? (
              <span className="inline-flex items-center gap-1.5 truncate">
                {currentSelectedOption.icon}
                <span>{currentSelectedOption.label}</span>
              </span>
            ) : (
              <span className="text-text-secondary">{placeholder}</span>
            )}
          </div>
        )}

        <ChevronDown
          strokeWidth={1.5}
          className={`w-4 h-4 shrink-0 ${
            variant === 'card' ? 'text-[#7150E7]' : 'text-[#667085]'
          } transition-transform duration-200 ${
            isOpen ? 'rotate-180' : ''
          }`}
        />
      </button>

      {/* Popover Dropdown Menu */}
      {isOpen && (
        <div
          className={`absolute ${align === 'right' ? 'right-0' : 'left-0'} top-full mt-2 min-w-[250px] w-full bg-white rounded-2xl border border-[#D0D5DD] shadow-2xl z-[100] p-3 animate-in fade-in slide-in-from-top-2 duration-150 cursor-default ring-1 ring-black/5 ${menuClassName}`}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Search Bar */}
          {showSearch && normalizedOptions.length > 5 && (
            <div className="relative mb-2">
              <Search strokeWidth={1.5} className="w-3.5 h-3.5 text-text-secondary absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={searchPlaceholder}
                className="w-full bg-[#F8FAFC] border border-[#E4E7EC] rounded-xl pl-8 pr-7 py-1.5 text-xs text-[#101828] placeholder-text-secondary focus:outline-hidden focus:border-[#7150E7]"
                autoFocus
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-text-secondary hover:text-text-primary cursor-pointer"
                >
                  <X strokeWidth={1.5} className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          )}

          {/* Multi-select Header actions */}
          {isMulti && (
            <div className="flex items-center justify-between px-1 pb-2 border-b border-[#F2F4F7] text-[11px] mb-1">
              <span className="text-[#667085] font-medium">
                {selectedValues.includes('ALL') ? (
                  <span>All selected</span>
                ) : (
                  <span>{selectedValues.length} selected</span>
                )}
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleSelectAll}
                  className="text-[#7150E7] hover:underline font-semibold cursor-pointer"
                >
                  Select all
                </button>
                <span className="text-[#D0D5DD]">•</span>
                <button
                  type="button"
                  onClick={handleClearAll}
                  className="text-[#667085] hover:text-[#101828] hover:underline cursor-pointer"
                >
                  Reset
                </button>
              </div>
            </div>
          )}

          {/* Options List */}
          <div className="max-h-72 overflow-y-auto space-y-1 pr-0.5 custom-scrollbar">
            {filteredOptions.map((opt, idx) => {
              const isSelected = selectedValues.includes(opt.value);
              const prevOpt = idx > 0 ? filteredOptions[idx - 1] : null;
              const isNewCategory = opt.category && (!prevOpt || prevOpt.category !== opt.category);

              return (
                <React.Fragment key={opt.value}>
                  {isNewCategory && (
                    <div className="px-2.5 pt-2 pb-1 text-[10px] font-bold uppercase tracking-wider text-[#7150E7] bg-[#EDE9FC]/50 rounded-lg my-1 select-none flex items-center justify-between border-l-2 border-[#7150E7]">
                      <span>{opt.category}</span>
                    </div>
                  )}
                  <button
                    type="button"
                    onClick={() => handleSelect(opt.value)}
                    className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs transition-colors cursor-pointer text-left ${
                      isSelected
                        ? 'bg-[#F4F3FE] text-[#7150E7] font-semibold'
                        : 'text-text-secondary hover:bg-[#F8FAFC]'
                    }`}
                  >
                    <span className="inline-flex items-center gap-2 truncate">
                      {opt.icon}
                      <span className="truncate">{opt.label}</span>
                    </span>

                    {isMulti ? (
                      <div
                        className={`w-4 h-4 rounded-md border flex items-center justify-center transition-colors shrink-0 ml-2 ${
                          isSelected
                            ? 'bg-[#7150E7] border-[#7150E7] text-white'
                            : 'border-[#D0D5DD] bg-white'
                        }`}
                      >
                        {isSelected && <Check strokeWidth={1.5} className="w-3 h-3" />}
                      </div>
                    ) : (
                      isSelected && (
                        <Check strokeWidth={1.5} className="w-4 h-4 text-[#7150E7] shrink-0 ml-2" />
                      )
                    )}
                  </button>
                </React.Fragment>
              );
            })}

            {filteredOptions.length === 0 && (
              <div className="py-4 text-center text-xs text-text-secondary">
                No options found
              </div>
            )}
          </div>

          {/* Multi-select Footer Done / Apply button */}
          {isMulti && (
            <div className="pt-2 mt-2 border-t border-[#F2F4F7] flex items-center justify-between">
              <span className="text-[11px] text-[#667085]">
                {selectedValues.includes('ALL') ? 'All selected' : `${selectedValues.length} selected`}
              </span>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="bg-[#7150E7] hover:bg-[#6039DB] text-white text-xs font-semibold px-3 py-1 rounded-xl transition-all shadow-2xs cursor-pointer"
              >
                Done
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
