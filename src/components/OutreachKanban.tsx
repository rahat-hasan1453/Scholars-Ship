'use client';

import React, { useState } from 'react';
import { useApp } from '@/context/AppContext';
import { OutreachStatus, OutreachRecord } from '@/types';
import { 
  Building2, 
  Trash2, 
  Sparkles,
  Edit3,
  Calendar,
  CheckCircle2,
  Mail,
  ArrowRight
} from 'lucide-react';

const STAGES: { status: OutreachStatus; title: string; color: string; badgeBg: string; badgeText: string }[] = [
  { status: 'Prospect', title: 'Prospect', color: '#475467', badgeBg: 'bg-[#EAECF0]', badgeText: 'text-[#475467]' },
  { status: 'Drafting', title: 'Drafting Email', color: '#175CD3', badgeBg: 'bg-[#DCEAF7]', badgeText: 'text-[#175CD3]' },
  { status: 'Email Sent', title: 'Email Sent', color: '#9A6216', badgeBg: 'bg-[#FEF1DC]', badgeText: 'text-[#9A6216]' },
  { status: 'Follow-up Due', title: 'Follow-up Due', color: '#C43636', badgeBg: 'bg-[#FCE8E8]', badgeText: 'text-[#C43636]' },
  { status: 'Interview', title: 'Interviewing', color: '#4F46E5', badgeBg: 'bg-[#E0E7FF]', badgeText: 'text-[#4F46E5]' },
  { status: 'Funded Offer', title: 'Funded Offer 🎉', color: '#0F6B43', badgeBg: 'bg-[#D1F4E0]', badgeText: 'text-[#0F6B43]' },
];

export const OutreachKanban: React.FC = () => {
  const { 
    outreachRecords, 
    updateOutreachStatus, 
    updateOutreachNotes, 
    removeOutreachRecord,
    opportunities,
    openColdEmailModal
  } = useApp();

  const [editingNotesId, setEditingNotesId] = useState<string | null>(null);
  const [tempNotes, setTempNotes] = useState('');

  const getRecordsByStatus = (status: OutreachStatus) => {
    return outreachRecords.filter((r) => r.status === status);
  };

  const handleStartEditNotes = (record: OutreachRecord) => {
    setEditingNotesId(record.id);
    setTempNotes(record.notes || '');
  };

  const handleSaveNotes = (id: string) => {
    updateOutreachNotes(id, tempNotes);
    setEditingNotesId(null);
  };

  return (
    <div className="space-y-5">
      {/* Board Header Bar */}
      <div className="bg-white border border-[#eaecf0] rounded-2xl p-4 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-[#eef2ff] text-[#4f46e5] flex items-center justify-center font-bold">
            <Mail className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-sm font-extrabold text-[#101828]">
              Professor Outreach Pipeline
            </h2>
            <p className="text-xs text-[#667085]">
              Track academic communication from cold inquiry to funded research offer.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-[#4f46e5] bg-[#eef2ff] px-3 py-1 rounded-full border border-[#c7d2fe]">
            {outreachRecords.length} Active Contacts
          </span>
        </div>
      </div>

      {/* Board Columns Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4 overflow-x-auto pb-4">
        {STAGES.map((col) => {
          const columnRecords = getRecordsByStatus(col.status);

          return (
            <div
              key={col.status}
              className="bg-[#f8fafc] border border-[#eaecf0] rounded-2xl flex flex-col min-w-[240px] max-h-[75vh]"
            >
              {/* Column Header */}
              <div className="p-3.5 border-b border-[#eaecf0] flex items-center justify-between bg-white rounded-t-2xl">
                <div className="flex items-center gap-2">
                  <span className={`text-xs font-bold px-2 py-0.5 rounded-lg ${col.badgeBg} ${col.badgeText}`}>
                    {col.title}
                  </span>
                </div>
                <span className="text-xs font-bold text-[#667085] bg-slate-100 px-2 py-0.5 rounded-full">
                  {columnRecords.length}
                </span>
              </div>

              {/* Cards Container */}
              <div className="p-3 space-y-3 flex-1 overflow-y-auto min-h-[160px]">
                {columnRecords.length === 0 ? (
                  <div className="h-28 flex items-center justify-center text-center p-3 text-xs text-[#98a2b3] border border-dashed border-[#eaecf0] rounded-xl bg-white/60">
                    No contacts in this stage
                  </div>
                ) : (
                  columnRecords.map((record) => {
                    const matchedOpp = opportunities.find((o) => o.id === record.opportunityId);

                    return (
                      <div
                        key={record.id}
                        className="group bg-white border border-[#eaecf0] hover:border-[#d0d5dd] hover:shadow-md rounded-xl p-3.5 transition-all flex flex-col justify-between shadow-2xs"
                      >
                        <div>
                          {/* Professor & Role */}
                          <div className="flex items-start justify-between gap-1 mb-1.5">
                            <h4 className="text-xs font-bold text-[#101828] truncate">
                              {record.professorName}
                            </h4>
                            <button
                              onClick={() => removeOutreachRecord(record.id)}
                              className="opacity-0 group-hover:opacity-100 p-1 text-slate-400 hover:text-red-500 transition-opacity cursor-pointer"
                              title="Delete record"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>

                          <div className="text-[11px] text-[#667085] flex items-center gap-1 truncate mb-2.5">
                            <Building2 className="w-3 h-3 text-slate-400 shrink-0" />
                            <span className="truncate">{record.labName || record.institution}</span>
                          </div>

                          {/* Notes */}
                          {editingNotesId === record.id ? (
                            <div className="mb-2.5">
                              <textarea
                                value={tempNotes}
                                onChange={(e) => setTempNotes(e.target.value)}
                                className="w-full bg-[#f8fafc] border border-indigo-500 rounded-lg p-2 text-xs text-[#101828] focus:outline-hidden resize-none"
                                rows={2}
                              />
                              <div className="flex items-center gap-1.5 justify-end mt-1.5">
                                <button
                                  onClick={() => setEditingNotesId(null)}
                                  className="px-2 py-0.5 text-xs text-slate-500 hover:text-slate-800 cursor-pointer"
                                >
                                  Cancel
                                </button>
                                <button
                                  onClick={() => handleSaveNotes(record.id)}
                                  className="px-2.5 py-1 text-xs bg-[#4f46e5] text-white rounded-lg font-bold cursor-pointer"
                                >
                                  Save
                                </button>
                              </div>
                            </div>
                          ) : (
                            <div 
                              onClick={() => handleStartEditNotes(record)}
                              className="mb-3 p-2 rounded-lg bg-[#f8fafc] hover:bg-[#f1f5f9] border border-[#eaecf0] text-xs text-[#475467] leading-snug cursor-pointer flex items-start justify-between gap-1"
                              title="Click to edit notes"
                            >
                              <p className="line-clamp-2">{record.notes || 'Click to add notes...'}</p>
                              <Edit3 className="w-3 h-3 text-slate-400 shrink-0 mt-0.5" />
                            </div>
                          )}
                        </div>

                        {/* Actions */}
                        <div className="pt-2.5 border-t border-[#f2f4f7] flex items-center justify-between gap-1 text-xs">
                          {matchedOpp ? (
                            <button
                              onClick={() => openColdEmailModal(matchedOpp)}
                              className="inline-flex items-center gap-1 text-[11px] font-bold text-[#4f46e5] hover:text-[#4338ca] cursor-pointer"
                            >
                              <Sparkles className="w-3 h-3 text-amber-500" />
                              <span>Email Draft</span>
                            </button>
                          ) : (
                            <span className="text-[10px] text-[#98a2b3]">Manual Contact</span>
                          )}

                          {/* Quick Stage Move Dropdown */}
                          <select
                            value={record.status}
                            onChange={(e) => updateOutreachStatus(record.id, e.target.value as OutreachStatus)}
                            className="bg-[#f8fafc] border border-[#d0d5dd] hover:border-[#4f46e5] rounded-lg px-2 py-1 text-[10px] font-bold text-[#344054] focus:outline-hidden cursor-pointer"
                          >
                            {STAGES.map((s) => (
                              <option key={s.status} value={s.status}>
                                → {s.title}
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
