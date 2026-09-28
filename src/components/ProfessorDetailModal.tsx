'use client';

import React from 'react';
import { Professor, HiringOpportunity } from '@/types';
import { useApp } from '@/context/AppContext';
import { 
  X, 
  Sparkles, 
  Building2, 
  MapPin, 
  Mail, 
  Globe, 
  GraduationCap, 
  ArrowUpRight, 
  FlaskConical, 
  Award,
  CheckCircle2
} from 'lucide-react';

interface ProfessorDetailModalProps {
  professor: Professor | null;
  onClose: () => void;
}

export const ProfessorDetailModal: React.FC<ProfessorDetailModalProps> = ({ professor, onClose }) => {
  const { openColdEmailModal } = useApp();

  if (!professor) return null;

  const handleOpenColdEmail = () => {
    onClose();
    const fakeOpp: HiringOpportunity = {
      id: `prof-opp-${professor.id}`,
      authorName: professor.name,
      authorTitle: professor.title || 'Principal Investigator',
      institution: professor.university,
      labName: professor.labName || `${professor.department} Laboratory`,
      source: 'web',
      sourceUrl: professor.labWebsite || 'https://google.com',
      postedAgo: 'Active Recruitment',
      postedDate: new Date().toISOString(),
      title: `Graduate Research Assistantship in ${professor.researchTags[0] || professor.department}`,
      content: professor.bio || `Active recruitment for motivated Graduate Research Assistants (GRA) at ${professor.university}. Specialization in ${professor.researchTags.join(', ')}.`,
      funding: professor.recentGrants || 'Full Tuition Waiver + Living Stipend',
      degrees: ['Masters', 'PhD'],
      fieldTags: professor.researchTags.length > 0 ? professor.researchTags : [professor.department],
      matchType: 'exact',
      country: professor.country,
      contactEmail: professor.email
    };
    openColdEmailModal(fakeOpp);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div 
        className="relative w-full max-w-2xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-5 border-b border-slate-100 flex items-start justify-between bg-slate-50/70">
          <div className="flex items-start gap-4 min-w-0">
            <img
              src={professor.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80'}
              alt={professor.name}
              className="w-14 h-14 rounded-2xl object-cover border-2 border-white shadow-sm shrink-0"
            />
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2 mb-1">
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-purple-50 text-[#7150E7] border border-purple-200">
                  <GraduationCap className="w-3.5 h-3.5 text-[#7150E7]" />
                  Faculty &amp; PI
                </span>
                {professor.openPositions && (
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200 flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                    Accepting Students ({professor.acceptingTerms?.join(', ') || 'Fall 2026'})
                  </span>
                )}
              </div>
              <h2 className="text-xl font-bold text-slate-900 leading-snug truncate">{professor.name}</h2>
              <p className="text-xs text-slate-600 font-medium mt-0.5 flex flex-wrap items-center gap-1.5">
                <span>{professor.title}</span>
                <span>•</span>
                <span className="text-[#101828] font-semibold">{professor.university}</span>
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-5 text-sm text-slate-600">
          
          {/* Quick Metrics Bar */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-3.5 bg-[#F9F5FF] border border-[#F4EBFF] rounded-xl text-xs">
            <div>
              <p className="text-[11px] text-[#7150E7] font-semibold uppercase tracking-wider">Department</p>
              <p className="font-bold text-slate-900 mt-0.5 truncate">{professor.department}</p>
            </div>
            <div>
              <p className="text-[11px] text-[#7150E7] font-semibold uppercase tracking-wider">Location</p>
              <p className="font-bold text-slate-900 mt-0.5 flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5 text-slate-400" />
                <span>{professor.country}</span>
              </p>
            </div>
            <div>
              <p className="text-[11px] text-[#7150E7] font-semibold uppercase tracking-wider">Lab Name</p>
              <p className="font-bold text-slate-900 mt-0.5 truncate">{professor.labName || 'Research Group'}</p>
            </div>
          </div>

          {/* Research Focus & Tags */}
          <div className="space-y-2">
            <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
              <FlaskConical className="w-3.5 h-3.5 text-[#7150E7]" />
              Research Areas &amp; Specializations
            </h4>
            <div className="flex flex-wrap gap-1.5">
              {professor.researchTags.map((tag, idx) => (
                <span
                  key={idx}
                  className="px-2.5 py-1 bg-white border border-slate-200 text-slate-700 text-xs rounded-lg font-medium shadow-2xs hover:border-[#7150E7] transition-colors"
                >
                  {tag}
                </span>
              ))}
            </div>
          </div>

          {/* Biography & Research Overview */}
          <div className="space-y-2">
            <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
              Research Overview &amp; Lab Mission
            </h4>
            <div className="p-4 bg-slate-50 border border-slate-100 rounded-xl leading-relaxed text-slate-700 text-xs sm:text-sm">
              {professor.bio || `Dr. ${professor.name} directs computational and interdisciplinary research at ${professor.university}, focusing on ${professor.researchTags.join(', ')}. Actively seeking self-motivated graduate students and postdocs with strong analytical foundations.`}
            </div>
          </div>

          {/* Funding & Grants */}
          {professor.recentGrants && (
            <div className="space-y-2">
              <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                <Award className="w-3.5 h-3.5 text-emerald-600" />
                Active Grants &amp; Funding Support
              </h4>
              <p className="p-3 bg-emerald-50/70 border border-emerald-200 rounded-xl text-xs text-emerald-900 font-medium">
                {professor.recentGrants}
              </p>
            </div>
          )}

          {/* External Links & Profiles */}
          <div className="flex flex-wrap gap-2 pt-1">
            {professor.labWebsite && (
              <a
                href={professor.labWebsite}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold transition-colors cursor-pointer"
              >
                <Globe className="w-3.5 h-3.5 text-[#7150E7]" />
                <span>Lab Website</span>
                <ArrowUpRight className="w-3.5 h-3.5 text-slate-400" />
              </a>
            )}
            {professor.googleScholar && (
              <a
                href={professor.googleScholar}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold transition-colors cursor-pointer"
              >
                <GraduationCap className="w-3.5 h-3.5 text-purple-600" />
                <span>Google Scholar</span>
                <ArrowUpRight className="w-3.5 h-3.5 text-slate-400" />
              </a>
            )}
            {professor.email && (
              <a
                href={`mailto:${professor.email}`}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold transition-colors cursor-pointer"
              >
                <Mail className="w-3.5 h-3.5 text-emerald-600" />
                <span>{professor.email}</span>
              </a>
            )}
          </div>
        </div>

        {/* Footer Actions */}
        <div className="px-6 py-4 border-t border-slate-100 flex items-center justify-between gap-3 bg-slate-50/70">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-bold text-slate-600 hover:text-slate-800 transition-colors cursor-pointer"
          >
            Close
          </button>
          
          <button
            type="button"
            onClick={handleOpenColdEmail}
            className="px-5 py-2 rounded-full text-xs font-bold bg-[#7150E7] hover:bg-[#5E3CD4] text-white shadow-md inline-flex items-center gap-2 transition-all cursor-pointer"
          >
            <Sparkles className="w-4 h-4 text-amber-300 fill-amber-300" />
            <span>Draft AI Cold Email</span>
          </button>
        </div>
      </div>
    </div>
  );
};
