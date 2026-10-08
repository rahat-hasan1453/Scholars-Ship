'use client';

import React, { useState, useMemo } from 'react';
import { useApp } from '@/context/AppContext';
import { 
  Sparkles, 
  X, 
  Copy, 
  Check, 
  Mail, 
  Bookmark, 
  Bot,
  GraduationCap
} from 'lucide-react';

export const ColdEmailModal: React.FC = () => {
  const { 
    isColdEmailModalOpen, 
    setIsColdEmailModalOpen, 
    selectedOpportunityForEmail, 
    profile,
    saveOpportunityToOutreach
  } = useApp();

  const [activeTab, setActiveTab] = useState<'initial' | 'followup'>('initial');
  const [copiedSubject, setCopiedSubject] = useState(false);
  const [copiedBody, setCopiedBody] = useState(false);
  const [isSaved, setIsSaved] = useState(false);

  const opp = selectedOpportunityForEmail;

  const generatedSubject = useMemo(() => {
    if (!opp) return '';
    const degree = profile.degreeLevel || 'Graduate';
    const field = opp.fieldTags[0] || 'HCI';
    return `Prospective ${degree} Research Assistant (${field} & ${opp.labName || 'Research'}) — Fall 2027`;
  }, [opp, profile]);

  const generatedBody = useMemo(() => {
    if (!opp) return '';
    const studentName = profile.name || 'Rahat Chowdhury';
    const degree = profile.degreeLevel || 'Masters';
    const cgpa = profile.cgpa ? `CGPA: ${profile.cgpa}/4.0` : '';
    const targetField = opp.fieldTags[0] || 'Human-Computer Interaction';
    const recentTopic = opp.recentPaperTopic || opp.title;

    return `Dear ${opp.authorName},

I hope this email finds you well.

I came across your recent announcement regarding the open funded ${degree} position at the ${opp.labName || opp.institution}. I have been closely following your lab's publications, particularly your work on "${recentTopic}", and was deeply inspired by your methodology in human-centered system design.

A brief background on me: I am preparing to apply for a ${degree} in ${targetField} for the upcoming term. I have a strong foundation in interactive prototyping, design research, and computing (${cgpa}). My previous projects focused on user behavior modeling and intuitive user interfaces, which I believe closely align with your lab's mission.

Given your active recruitment for the ${opp.labName || 'lab'}, I would be thrilled to contribute to your research as a Graduate Research Assistant. Would you be available for a brief 10-minute virtual conversation in the coming weeks to discuss potential mutual fit?

I have attached my academic CV, portfolio, and research statement for your review. Thank you very much for your time and consideration.

Warm regards,

${studentName}
${degree} Applicant | HighScholar Verified Profile
${profile.email || 'candidate@university.edu'}`;
  }, [opp, profile]);

  const followUpBody = useMemo(() => {
    if (!opp) return '';
    const studentName = profile.name || 'Rahat Chowdhury';
    return `Dear ${opp.authorName},

I hope you are having a productive week.

I am gently following up on my previous note regarding the open ${profile.degreeLevel || 'Graduate'} position in the ${opp.labName || opp.institution}. I understand how demanding academic schedules are, and wanted to reiterate my enthusiastic interest in your ongoing projects.

If your schedule permits a brief conversation, I would be grateful for the opportunity. Otherwise, I will proceed with my formal departmental application.

Thank you once again for your time!

Best regards,
${studentName}`;
  }, [opp, profile]);

  if (!isColdEmailModalOpen || !opp) return null;

  const handleCopySubject = () => {
    navigator.clipboard.writeText(generatedSubject);
    setCopiedSubject(true);
    setTimeout(() => setCopiedSubject(false), 2000);
  };

  const handleCopyBody = () => {
    const textToCopy = activeTab === 'initial' ? generatedBody : followUpBody;
    navigator.clipboard.writeText(textToCopy);
    setCopiedBody(true);
    setTimeout(() => setCopiedBody(false), 2000);
  };

  const handleSaveOutreach = () => {
    saveOpportunityToOutreach(opp, 'Drafting');
    setIsSaved(true);
  };

  const mailtoHref = `mailto:${opp.contactEmail || ''}?subject=${encodeURIComponent(generatedSubject)}&body=${encodeURIComponent(activeTab === 'initial' ? generatedBody : followUpBody)}`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
      <div 
        className="w-full max-w-2xl bg-white border border-[#eaecf0] rounded-3xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Uxcel Modal Header */}
        <div className="px-6 py-5 border-b border-[#f2f4f7] flex items-center justify-between bg-white">
          <div className="flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-2xl bg-[#eef2ff] border border-[#c7d2fe] flex items-center justify-center text-[#4f46e5] shadow-xs">
              <Sparkles className="w-5 h-5 text-[#4f46e5]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-semibold text-[#101828]">AI Academic Cold Email Drafter</h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                  Ready to send
                </span>
              </div>
              <p className="text-xs text-[#667085] mt-0.5">
                Tailored for {opp.authorName} ({opp.institution})
              </p>
            </div>
          </div>

          <button
            onClick={() => setIsColdEmailModalOpen(false)}
            className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-[#667085] hover:text-[#101828] transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tab switcher */}
        <div className="px-6 pt-3 pb-3 border-b border-[#f2f4f7] flex items-center justify-between bg-[#f8fafc]">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveTab('initial')}
              className={`px-4 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                activeTab === 'initial'
                  ? 'bg-white text-[#4f46e5] shadow-xs border border-[#eaecf0]'
                  : 'text-[#667085] hover:text-[#101828]'
              }`}
            >
              Initial Outreach Email
            </button>
            <button
              onClick={() => setActiveTab('followup')}
              className={`px-4 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                activeTab === 'followup'
                  ? 'bg-white text-[#4f46e5] shadow-xs border border-[#eaecf0]'
                  : 'text-[#667085] hover:text-[#101828]'
              }`}
            >
              7-Day Follow-Up Template
            </button>
          </div>

          <div className="text-xs text-[#065f46] bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 rounded-full font-semibold">
            98% High Precision
          </div>
        </div>

        {/* Body Content */}
        <div className="p-6 overflow-y-auto space-y-4 text-xs">
          {/* Subject Line */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-xs font-semibold text-[#344054] uppercase tracking-wider">
                Subject Line
              </span>
              <button
                onClick={handleCopySubject}
                className="inline-flex items-center gap-1 text-xs text-[#4f46e5] hover:text-[#4338ca] font-semibold cursor-pointer"
              >
                {copiedSubject ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedSubject ? 'Copied!' : 'Copy Subject'}</span>
              </button>
            </div>
            <div className="p-3 rounded-xl bg-[#f8fafc] border border-[#eaecf0] text-[#101828] font-mono text-xs select-all">
              {generatedSubject}
            </div>
          </div>

          {/* Email Body */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-xs font-semibold text-[#344054] uppercase tracking-wider">
                Email Body
              </span>
              <button
                onClick={handleCopyBody}
                className="inline-flex items-center gap-1 text-xs text-[#4f46e5] hover:text-[#4338ca] font-semibold cursor-pointer"
              >
                {copiedBody ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedBody ? 'Copied Full Body!' : 'Copy Body'}</span>
              </button>
            </div>
            <pre className="p-4 rounded-xl bg-[#f8fafc] border border-[#eaecf0] text-[#101828] font-sans text-xs whitespace-pre-wrap leading-relaxed select-all">
              {activeTab === 'initial' ? generatedBody : followUpBody}
            </pre>
          </div>

          {/* Why this converts note */}
          <div className="p-3.5 rounded-xl bg-[#eef2ff] border border-[#c7d2fe] text-[#344054] text-xs flex items-start gap-2.5">
            <Bot className="w-4 h-4 text-[#4f46e5] shrink-0 mt-0.5" />
            <div>
              <span className="font-semibold text-[#4338ca]">Why this converts:</span> Mentions Dr. {opp.authorName.split(' ').slice(-1)[0]}'s lab methodology in "{opp.recentPaperTopic || opp.title}" and highlights your background in {opp.fieldTags[0] || 'HCI'} while maintaining ideal academic brevity (&lt;200 words).
            </div>
          </div>
        </div>

        {/* Modal Footer Actions (Uxcel Style) */}
        <div className="p-5 border-t border-[#f2f4f7] bg-white flex flex-wrap items-center justify-between gap-3">
          <button
            onClick={handleSaveOutreach}
            className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
              isSaved
                ? 'bg-emerald-50 text-emerald-700 border-emerald-300'
                : 'bg-white hover:bg-slate-50 text-[#344054] border-[#d0d5dd]'
            }`}
          >
            {isSaved ? <Check className="w-4 h-4 text-emerald-600" /> : <Bookmark className="w-4 h-4" />}
            <span>{isSaved ? 'In Outreach Pipeline' : 'Save to Pipeline'}</span>
          </button>

          <div className="flex items-center gap-2.5">
            <button
              onClick={handleCopyBody}
              className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-semibold bg-white hover:bg-slate-50 text-[#344054] transition-colors border border-[#d0d5dd] cursor-pointer shadow-2xs"
            >
              {copiedBody ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
              <span>Copy All</span>
            </button>

            <a
              href={mailtoHref}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-semibold text-white bg-[#4f46e5] hover:bg-[#4338ca] transition-all shadow-sm shadow-indigo-500/25 cursor-pointer"
            >
              <Mail className="w-4 h-4" />
              <span>Open in Mail</span>
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};
