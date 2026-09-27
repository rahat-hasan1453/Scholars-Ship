'use client';

import React from 'react';
import { Scholarship } from '@/types';
import { useApp } from '@/context/AppContext';
import { calculateCountdown, calculateMatchScore, formatFunding } from '@/lib/utils';
import { 
  X, 
  Clock, 
  MapPin, 
  Sparkles, 
  Bookmark, 
  CheckCircle2, 
  ExternalLink, 
  Award, 
  FileText,
  AlertCircle
} from 'lucide-react';

interface ScholarshipDetailModalProps {
  scholarship: Scholarship | null;
  onClose: () => void;
}

export const ScholarshipDetailModal: React.FC<ScholarshipDetailModalProps> = ({ scholarship, onClose }) => {
  const { profile, applications, saveScholarshipToTracker } = useApp();

  if (!scholarship) return null;

  const countdown = calculateCountdown(scholarship.deadline);
  const matchScore = calculateMatchScore(scholarship, profile);
  const isSaved = applications.some((app) => app.scholarshipId === scholarship.id);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-start justify-between bg-slate-50/70">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">
                <Sparkles className="w-3 h-3 text-amber-500" />
                {matchScore}% Profile Match
              </span>
              <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200">
                {formatFunding(scholarship.fundingType)}
              </span>
            </div>
            <h2 className="text-lg font-bold text-slate-900 leading-snug">{scholarship.title}</h2>
            <p className="text-xs text-slate-500 mt-0.5 flex items-center gap-1">
              <Award className="w-3.5 h-3.5 text-slate-400" />
              <span>{scholarship.provider}</span>
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-5">
          {/* Urgency & Deadline Banner */}
          <div className="flex flex-wrap items-center justify-between p-3.5 bg-indigo-50/60 border border-indigo-100 rounded-xl gap-2">
            <div className="flex items-center gap-2" suppressHydrationWarning>
              <Clock className="w-4 h-4 text-indigo-700" />
              <div>
                <div className="text-xs font-bold text-indigo-950">
                  Application Deadline: {new Date(scholarship.deadline).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                </div>
                <div className="text-[11px] text-indigo-700 font-medium">{countdown.formatted}</div>
              </div>
            </div>
            <div className="text-xs font-semibold text-slate-600 flex items-center gap-1">
              <MapPin className="w-3.5 h-3.5 text-slate-400" />
              <span>{scholarship.countries.join(', ')}</span>
            </div>
          </div>

          {/* Description */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">Overview</h4>
            <p className="text-sm text-slate-700 leading-relaxed">{scholarship.description}</p>
          </div>

          {/* Funding Breakdown */}
          <div className="p-4 bg-emerald-50/50 border border-emerald-200/80 rounded-xl space-y-1">
            <div className="text-xs font-bold text-emerald-900 flex items-center gap-1.5">
              <span>Financial Coverage Details</span>
            </div>
            <p className="text-sm font-semibold text-emerald-950">{scholarship.fundingAmount}</p>
          </div>

          {/* Eligibility Matrix */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">Eligibility Criteria & Cut-offs</h4>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs">
                <span className="text-slate-500 block">Min. CGPA</span>
                <span className="font-bold text-slate-900 text-sm">
                  {scholarship.requirements?.minCgpa ? `${scholarship.requirements.minCgpa} / 4.0` : 'Not Specified'}
                </span>
                {profile.cgpa >= (scholarship.requirements?.minCgpa || 0) && (
                  <span className="text-[10px] text-emerald-600 font-semibold flex items-center gap-0.5 mt-0.5">
                    <CheckCircle2 className="w-3 h-3" /> You qualify ({profile.cgpa})
                  </span>
                )}
              </div>

              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs">
                <span className="text-slate-500 block">Min. IELTS / English</span>
                <span className="font-bold text-slate-900 text-sm">
                  {scholarship.requirements?.minIelts ? `Band ${scholarship.requirements.minIelts}` : 'Flexible'}
                </span>
                {profile.testScores?.ielts && profile.testScores.ielts >= (scholarship.requirements?.minIelts || 0) && (
                  <span className="text-[10px] text-emerald-600 font-semibold flex items-center gap-0.5 mt-0.5">
                    <CheckCircle2 className="w-3 h-3" /> You qualify ({profile.testScores.ielts})
                  </span>
                )}
              </div>

              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs">
                <span className="text-slate-500 block">Eligible Degrees</span>
                <span className="font-bold text-slate-900 text-sm">
                  {scholarship.degreeLevels.join(', ')}
                </span>
              </div>
            </div>

            {scholarship.requirements?.notes && (
              <div className="mt-3 p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs text-slate-600 flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
                <span>{scholarship.requirements.notes}</span>
              </div>
            )}
          </div>

          {/* Specialization Tags */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">Subject Coverage</h4>
            <div className="flex flex-wrap gap-1.5">
              {scholarship.specializations.map((spec) => (
                <span key={spec} className="px-2.5 py-1 bg-slate-100 rounded-lg text-xs font-medium text-slate-700">
                  {spec}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between gap-3">
          <a
            href={scholarship.officialUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 px-4 py-2 border border-slate-200 hover:border-slate-300 bg-white text-slate-700 font-semibold rounded-xl text-xs hover:bg-slate-50 transition-colors shadow-2xs"
          >
            <span>Official Portal Link</span>
            <ExternalLink className="w-3.5 h-3.5 text-slate-500" />
          </a>

          <button
            onClick={() => {
              saveScholarshipToTracker(scholarship);
            }}
            disabled={isSaved}
            className={`flex items-center gap-1.5 px-5 py-2.5 rounded-xl text-xs font-bold transition-all ${
              isSaved
                ? 'bg-emerald-100 text-emerald-800 border border-emerald-200 cursor-default'
                : 'bg-indigo-900 hover:bg-indigo-800 text-white shadow-md shadow-indigo-900/20'
            }`}
          >
            {isSaved ? (
              <>
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>Tracked in Application Board</span>
              </>
            ) : (
              <>
                <Bookmark className="w-4 h-4 text-amber-300" />
                <span>Add to My Applications Tracker</span>
              </>
            )}
          </button>
        </div>

      </div>
    </div>
  );
};
