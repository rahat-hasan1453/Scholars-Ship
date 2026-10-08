'use client';

import React from 'react';
import { X, Check, SlidersHorizontal, Sparkles, RotateCcw, Building2, DollarSign, Award, GraduationCap } from 'lucide-react';
import { Button } from '@/components/ui/button';

export interface FilterState {
  rankScope: 'ALL' | 'ACCESSIBLE' | 'MID' | 'TOP';
  freeTuitionOnly: boolean;
  lowCostLiving: boolean;
  noGreOnly: boolean;
  lowCgpaFriendly: boolean;
  studyGapFriendly: boolean;
  intakeTerm: 'ALL' | 'FALL_2026' | 'SPRING_2027' | 'ROLLING';
}

export const initialFilterState: FilterState = {
  rankScope: 'ALL',
  freeTuitionOnly: false,
  lowCostLiving: false,
  noGreOnly: false,
  lowCgpaFriendly: false,
  studyGapFriendly: false,
  intakeTerm: 'ALL',
};

interface AdvancedFilterModalProps {
  isOpen: boolean;
  onClose: () => void;
  filters: FilterState;
  onApply: (newFilters: FilterState) => void;
  onReset: () => void;
  activeCount: number;
}

export const AdvancedFilterModal: React.FC<AdvancedFilterModalProps> = ({
  isOpen,
  onClose,
  filters,
  onApply,
  onReset,
  activeCount,
}) => {
  const [localFilters, setLocalFilters] = React.useState<FilterState>(filters);

  React.useEffect(() => {
    setLocalFilters(filters);
  }, [filters, isOpen]);

  if (!isOpen) return null;

  const handleToggle = (key: keyof FilterState) => {
    setLocalFilters((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  const handleApply = () => {
    onApply(localFilters);
    onClose();
  };

  const handleReset = () => {
    setLocalFilters(initialFilterState);
    onReset();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div 
        className="bg-white rounded-3xl max-w-2xl w-full shadow-2xl overflow-hidden border border-slate-100 flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="p-6 sm:p-7 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#EDE9FC] text-[#7150E7] flex items-center justify-center shadow-xs">
              <SlidersHorizontal className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-slate-900 tracking-tight flex items-center gap-2">
                Advanced Admission & Funding Filters
                {activeCount > 0 && (
                  <span className="text-xs bg-[#7150E7] text-white px-2.5 py-0.5 rounded-full font-semibold">
                    {activeCount} active
                  </span>
                )}
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Target safe admissions, 100% free tuition, and low-competition universities.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-9 h-9 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-500 hover:text-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 sm:p-8 space-y-7 overflow-y-auto flex-1">
          
          {/* Section 1: University Ranking & Accessibility Scope */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-slate-400">
              <Building2 className="w-4 h-4 text-[#7150E7]" />
              <span>University Rank & Admission Ease (Rank 1 – 5,000+)</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {[
                { 
                  id: 'ALL', 
                  title: 'All Universities', 
                  desc: 'Global spectrum from Rank 1 to 5,000+', 
                  badge: 'Broad' 
                },
                { 
                  id: 'ACCESSIBLE', 
                  title: '🌟 Safe & Regional (Rank 1,000 – 5,000+)', 
                  desc: 'High acceptance (85%+), fast admission & high funding chances', 
                  badge: 'Highest Chance' 
                },
                { 
                  id: 'MID', 
                  title: 'Mid-Tier Public (Rank 300 – 1,000)', 
                  desc: 'Great balance of reputation & assistantships', 
                  badge: 'Target Fit' 
                },
                { 
                  id: 'TOP', 
                  title: 'Top Tier Global (Rank 1 – 300)', 
                  desc: 'Highly competitive elite institutions', 
                  badge: 'Selective' 
                },
              ].map((opt) => (
                <button
                  key={opt.id}
                  onClick={() => setLocalFilters(prev => ({ ...prev, rankScope: opt.id as any }))}
                  className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer select-none flex flex-col justify-between ${
                    localFilters.rankScope === opt.id
                      ? 'border-[#7150E7] bg-[#EDE9FC]/50 ring-2 ring-[#7150E7]/20 shadow-xs'
                      : 'border-slate-200 hover:border-slate-300 bg-white'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className={`text-xs font-semibold ${localFilters.rankScope === opt.id ? 'text-[#7150E7]' : 'text-slate-800'}`}>
                      {opt.title}
                    </span>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 font-semibold">
                      {opt.badge}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 mt-1 leading-snug">
                    {opt.desc}
                  </p>
                </button>
              ))}
            </div>
          </div>

          {/* Section 2: Tuition & Cost Strategy */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-slate-400">
              <DollarSign className="w-4 h-4 text-emerald-600" />
              <span>Financial Security & Cost Reduction</span>
            </div>
            <div className="space-y-2">
              <label 
                onClick={() => handleToggle('freeTuitionOnly')}
                className={`flex items-start gap-3 p-3.5 rounded-2xl border transition-all cursor-pointer select-none ${
                  localFilters.freeTuitionOnly ? 'border-emerald-500 bg-emerald-50/50' : 'border-slate-200 hover:border-slate-300 bg-white'
                }`}
              >
                <div className={`w-5 h-5 rounded-md flex items-center justify-center mt-0.5 shrink-0 ${
                  localFilters.freeTuitionOnly ? 'bg-emerald-600 text-white' : 'border border-slate-300 bg-white'
                }`}>
                  {localFilters.freeTuitionOnly && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                </div>
                <div>
                  <span className="text-xs sm:text-sm font-semibold text-slate-900 flex items-center gap-2">
                    🎯 100% Free Tuition Fee Only (Zero Tuition Out-of-Pocket)
                  </span>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Filters only opportunities with full tuition waivers, assistantships (TA/RA), or full scholarships.
                  </p>
                </div>
              </label>

              <label 
                onClick={() => handleToggle('lowCostLiving')}
                className={`flex items-start gap-3 p-3.5 rounded-2xl border transition-all cursor-pointer select-none ${
                  localFilters.lowCostLiving ? 'border-emerald-500 bg-emerald-50/50' : 'border-slate-200 hover:border-slate-300 bg-white'
                }`}
              >
                <div className={`w-5 h-5 rounded-md flex items-center justify-center mt-0.5 shrink-0 ${
                  localFilters.lowCostLiving ? 'bg-emerald-600 text-white' : 'border border-slate-300 bg-white'
                }`}>
                  {localFilters.lowCostLiving && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                </div>
                <div>
                  <span className="text-xs sm:text-sm font-semibold text-slate-900 flex items-center gap-2">
                    🏡 Affordable College Towns & Regional Zones (&lt; $800/month living cost)
                  </span>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Exclude high-rent metro cities (London, New York, Munich) and prioritize low-cost areas where on-campus jobs easily cover all expenses.
                  </p>
                </div>
              </label>
            </div>
          </div>

          {/* Section 3: Low Barrier & Admission Friendly Features */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-slate-400">
              <Award className="w-4 h-4 text-amber-500" />
              <span>Low-Barrier / Profile-Friendly Criteria</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              <button
                type="button"
                onClick={() => handleToggle('noGreOnly')}
                className={`p-3 rounded-2xl border text-left transition-all cursor-pointer select-none flex flex-col justify-between ${
                  localFilters.noGreOnly ? 'border-amber-500 bg-amber-50/50 ring-1 ring-amber-300' : 'border-slate-200 hover:border-slate-300 bg-white'
                }`}
              >
                <span className="text-xs font-semibold text-slate-800">🚫 No GRE / Waived</span>
                <span className="text-[10px] text-slate-500 mt-1">GRE not required or waived for admission</span>
              </button>

              <button
                type="button"
                onClick={() => handleToggle('lowCgpaFriendly')}
                className={`p-3 rounded-2xl border text-left transition-all cursor-pointer select-none flex flex-col justify-between ${
                  localFilters.lowCgpaFriendly ? 'border-amber-500 bg-amber-50/50 ring-1 ring-amber-300' : 'border-slate-200 hover:border-slate-300 bg-white'
                }`}
              >
                <span className="text-xs font-semibold text-slate-800">🎓 Low CGPA Friendly</span>
                <span className="text-[10px] text-slate-500 mt-1">Accepts 2.50 – 3.00 CGPA with holistic evaluation</span>
              </button>

              <button
                type="button"
                onClick={() => handleToggle('studyGapFriendly')}
                className={`p-3 rounded-2xl border text-left transition-all cursor-pointer select-none flex flex-col justify-between ${
                  localFilters.studyGapFriendly ? 'border-amber-500 bg-amber-50/50 ring-1 ring-amber-300' : 'border-slate-200 hover:border-slate-300 bg-white'
                }`}
              >
                <span className="text-xs font-semibold text-slate-800">⏳ Study Gap Friendly</span>
                <span className="text-[10px] text-slate-500 mt-1">Accepts 2–6+ years of career gap</span>
              </button>
            </div>
          </div>

          {/* Section 4: Target Intake Term */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-slate-400">
              <GraduationCap className="w-4 h-4 text-sky-600" />
              <span>Target Intake Term</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {[
                { id: 'ALL', label: 'All Terms' },
                { id: 'FALL_2026', label: '🍁 Fall 2026' },
                { id: 'SPRING_2027', label: '🌸 Spring 2027' },
                { id: 'ROLLING', label: '🔄 Rolling Admissions' },
              ].map((term) => (
                <button
                  key={term.id}
                  onClick={() => setLocalFilters(prev => ({ ...prev, intakeTerm: term.id as any }))}
                  className={`h-9 px-4 rounded-full text-xs font-medium transition-all cursor-pointer select-none ${
                    localFilters.intakeTerm === term.id
                      ? 'bg-slate-900 text-white font-semibold shadow-xs'
                      : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                  }`}
                >
                  {term.label}
                </button>
              ))}
            </div>
          </div>

        </div>

        {/* Modal Footer */}
        <div className="p-5 sm:p-6 border-t border-slate-100 bg-slate-50 flex items-center justify-between gap-3">
          <button
            onClick={handleReset}
            className="text-xs text-slate-500 hover:text-rose-600 font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset All Filters</span>
          </button>

          <div className="flex items-center gap-3">
            <Button variant="outline" size="sm" onClick={onClose} className="rounded-full px-5">
              Cancel
            </Button>
            <Button 
              variant="primary" 
              size="sm" 
              onClick={handleApply}
              className="rounded-full px-6 bg-[#7150E7] hover:bg-[#5b38d6] text-white shadow-xs font-semibold"
            >
              Apply Filter Strategy
            </Button>
          </div>
        </div>

      </div>
    </div>
  );
};
