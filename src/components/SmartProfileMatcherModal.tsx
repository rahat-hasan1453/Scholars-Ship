'use client';

import React, { useState } from 'react';
import { 
  X, 
  Sparkles, 
  GraduationCap, 
  CheckCircle2, 
  AlertCircle, 
  Award, 
  ArrowRight, 
  ExternalLink, 
  Globe2, 
  DollarSign, 
  Mail,
  ShieldCheck,
  Compass
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useApp } from '@/context/AppContext';
import { WORLD_COUNTRIES, getCountryOptions } from '@/data/countries';
import { CustomDropdown } from './ui/CustomDropdown';

interface SmartProfileMatcherModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectScholarship?: (scholarshipId: string) => void;
}

export const SmartProfileMatcherModal: React.FC<SmartProfileMatcherModalProps> = ({
  isOpen,
  onClose,
  onSelectScholarship,
}) => {
  const { scholarships, professors } = useApp();
  // Step: 'FORM' | 'RESULTS'
  const [step, setStep] = useState<'FORM' | 'RESULTS'>('FORM');

  // Student Input States
  const [degree, setDegree] = useState<'Masters' | 'PhD' | 'Bachelors'>('Masters');
  const [field, setField] = useState('UX Design');
  const [cgpa, setCgpa] = useState('3.10');
  const [studyGap, setStudyGap] = useState('1-3 years');
  const [englishTest, setEnglishTest] = useState('IELTS 6.5 (or Duolingo / MOI)');
  const [greStatus, setGreStatus] = useState('No GRE / Waived');
  const [strategy, setStrategy] = useState<'SAFE_GEMS' | 'MID_TIER' | 'TOP_TIER'>('SAFE_GEMS');
  const [priority, setPriority] = useState<'ZERO_TUITION' | 'LIVING_STIPEND'>('ZERO_TUITION');
  const [preferredCountry, setPreferredCountry] = useState('ALL');

  if (!isOpen) return null;

  // Compute Personalized Recommendations
  const matchingScholarships = scholarships.filter((s) => {
    const text = (s.title + ' ' + s.specializations.join(' ') + ' ' + s.tags.join(' ')).toLowerCase();
    const matchesField = text.includes('all fields') || text.includes(field.toLowerCase()) || text.includes('design') || text.includes('tech') || text.includes('inclusive');
    const matchesCountry = preferredCountry === 'ALL' || s.countries.includes(preferredCountry);
    return matchesField && matchesCountry;
  }).slice(0, 4);

  const matchingProfessors = professors.filter((p) => {
    const text = (p.researchTags.join(' ') + ' ' + p.department + ' ' + (p.bio || '')).toLowerCase();
    const matchesField = text.includes(field.toLowerCase()) || text.includes('design') || text.includes('interaction') || text.includes('computing');
    const matchesCountry = preferredCountry === 'ALL' || p.country === preferredCountry;
    return matchesField && matchesCountry;
  }).slice(0, 3);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/65 backdrop-blur-xs animate-in fade-in duration-200">
      <div 
        className="bg-white rounded-3xl max-w-3xl w-full shadow-2xl overflow-hidden border border-slate-100 flex flex-col max-h-[92vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-6 sm:p-7 border-b border-slate-100 flex items-center justify-between bg-gradient-to-r from-[#EDE9FC]/70 via-purple-50/50 to-white">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-[#7150E7] text-white flex items-center justify-center shadow-md shadow-purple-200">
              <Sparkles className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-semibold uppercase tracking-wider text-[#7150E7] bg-[#EDE9FC] px-2.5 py-0.5 rounded-full">
                  Higher Study AI Matcher
                </span>
                <span className="text-xs text-slate-500 font-medium">Personalized Evaluation</span>
              </div>
              <h2 className="text-xl sm:text-2xl font-semibold text-slate-900 tracking-tight mt-0.5">
                Find Your Ideal Scholarship & Safe Universities
              </h2>
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
        <div className="p-6 sm:p-8 overflow-y-auto flex-1 space-y-6">
          {step === 'FORM' ? (
            <div className="space-y-6">
              <div className="bg-amber-50/80 border border-amber-200 rounded-2xl p-4 flex items-start gap-3">
                <ShieldCheck className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                <p className="text-xs text-amber-900 leading-relaxed">
                  <strong>আপনার স্বপ্নের স্কলারশিপ ও উচ্চশিক্ষা নিশ্চিত করতে:</strong> আপনার বর্তমান প্রোফাইল ও প্রত্যাশা নির্বাচন করুন। আমাদের অ্যালগরিদম টপ র‍্যাংক ছাড়াও সহজে ফুল ফান্ডিং ও ভিসা পাওয়ার জন্য ১০০% ফ্রি টিউশন বিশ্ববিদ্যালয় খুঁজে দেবে।
                </p>
              </div>

              {/* Row 1: Target Degree & Discipline */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-700">Target Degree Level</label>
                  <div className="grid grid-cols-3 gap-2">
                    {(['Masters', 'PhD', 'Bachelors'] as const).map((d) => (
                      <button
                        key={d}
                        type="button"
                        onClick={() => setDegree(d)}
                        className={`h-10 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
                          degree === d
                            ? 'border-[#7150E7] bg-[#EDE9FC] text-[#7150E7]'
                            : 'border-slate-200 hover:border-slate-300 bg-white text-slate-700'
                        }`}
                      >
                        {d}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-700">Intended Field / Subject</label>
                  <CustomDropdown
                    variant="pill"
                    align="left"
                    value={field}
                    onChange={(val) => setField(val)}
                    buttonClassName="!h-10 !bg-white border !border-slate-200 hover:!border-[#7150E7] !rounded-xl text-xs sm:text-sm font-medium text-slate-800 px-3.5 shadow-2xs"
                    placeholder="Select Field"
                    showSearch={false}
                    options={[
                      { label: '🎨 UX Design & Interaction Design', value: 'UX Design' },
                      { label: '💻 Human-Computer Interaction (HCI)', value: 'Human-Computer Interaction (HCI)' },
                      { label: '🤖 Computer Science & AI / ML', value: 'Computer Science' },
                      { label: '📊 Data Science & Big Data', value: 'Data Science & Analytics' },
                      { label: '🧬 Biotechnology & Genomics', value: 'Biotechnology' },
                      { label: '⚡ Mechanical / Robotics Engineering', value: 'Mechanical Engineering' },
                      { label: '💼 Economics, Business & Management', value: 'Economics' },
                    ]}
                  />
                </div>
              </div>

              {/* Row 2: CGPA & Study Gap */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-700">Your Bachelor / Master CGPA</label>
                  <CustomDropdown
                    variant="pill"
                    align="left"
                    value={cgpa}
                    onChange={(val) => setCgpa(val)}
                    buttonClassName="!h-10 !bg-white border !border-slate-200 hover:!border-[#7150E7] !rounded-xl text-xs sm:text-sm font-medium text-slate-800 px-3.5 shadow-2xs"
                    placeholder="Select CGPA"
                    showSearch={false}
                    options={[
                      { label: '2.50 – 2.85 (Low CGPA • Safe Bet Strategy)', value: '2.50 - 2.85' },
                      { label: '2.86 – 3.20 (Average CGPA • Good Funding Fit)', value: '2.86 - 3.20' },
                      { label: '3.21 – 3.60 (Strong CGPA • Target & Top Fit)', value: '3.21 - 3.60' },
                      { label: '3.61 – 4.00 (High CGPA • Elite & Fellowship Fit)', value: '3.61 - 4.00' },
                    ]}
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-700">Study / Career Gap</label>
                  <CustomDropdown
                    variant="pill"
                    align="left"
                    value={studyGap}
                    onChange={(val) => setStudyGap(val)}
                    buttonClassName="!h-10 !bg-white border !border-slate-200 hover:!border-[#7150E7] !rounded-xl text-xs sm:text-sm font-medium text-slate-800 px-3.5 shadow-2xs"
                    placeholder="Select Study Gap"
                    showSearch={false}
                    options={[
                      { label: 'Fresh Graduate (0 years gap)', value: '0 years' },
                      { label: '1 – 3 Years Gap (With job/internship)', value: '1-3 years' },
                      { label: '4+ Years Gap (High gap friendly programs)', value: '4+ years' },
                    ]}
                  />
                </div>
              </div>

              {/* Row 3: Tests & Waivers */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-700">English Test Status</label>
                  <CustomDropdown
                    variant="pill"
                    align="left"
                    value={englishTest}
                    onChange={(val) => setEnglishTest(val)}
                    buttonClassName="!h-10 !bg-white border !border-slate-200 hover:!border-[#7150E7] !rounded-xl text-xs sm:text-sm font-medium text-slate-800 px-3.5 shadow-2xs"
                    placeholder="Select English Test"
                    showSearch={false}
                    options={[
                      { label: 'IELTS 6.5 or Duolingo 115+', value: 'IELTS 6.5 (or Duolingo / MOI)' },
                      { label: 'IELTS 7.0+ / TOEFL 100+', value: 'IELTS 7.0+' },
                      { label: 'No IELTS yet (English Medium MOI / Duolingo)', value: 'No IELTS / MOI Only' },
                    ]}
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-700">GRE Status</label>
                  <CustomDropdown
                    variant="pill"
                    align="left"
                    value={greStatus}
                    onChange={(val) => setGreStatus(val)}
                    buttonClassName="!h-10 !bg-white border !border-slate-200 hover:!border-[#7150E7] !rounded-xl text-xs sm:text-sm font-medium text-slate-800 px-3.5 shadow-2xs"
                    placeholder="Select GRE Status"
                    showSearch={false}
                    options={[
                      { label: '🚫 No GRE / GRE Waived Programs Only', value: 'No GRE / Waived' },
                      { label: 'Have GRE (Score 310 - 325+)', value: 'Have GRE 310+' },
                    ]}
                  />
                </div>
              </div>

              {/* Row 4: University Ranking Strategy */}
              <div className="space-y-2 pt-1">
                <label className="text-xs font-semibold text-slate-800 flex items-center justify-between">
                  <span>University Strategy & Risk Tolerance</span>
                  <span className="text-[11px] text-[#7150E7] font-semibold">Recommended for High Funding Success</span>
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                  {[
                    {
                      id: 'SAFE_GEMS',
                      title: '🌟 Safe Regional Gems',
                      rank: 'Rank 1,000 – 5,000+',
                      desc: 'Highest chance of 100% Free Tuition + TA/RA assistantship & fast visa.',
                    },
                    {
                      id: 'MID_TIER',
                      title: '⚖️ Mid-Tier Public',
                      rank: 'Rank 300 – 1,000',
                      desc: 'Balanced competition with good departmental funding.',
                    },
                    {
                      id: 'TOP_TIER',
                      title: '🏛️ Top 300 Global',
                      rank: 'Top Tier Global',
                      desc: 'Prestigious fellowships (DAAD, Fulbright, Chevening, R1).',
                    },
                  ].map((s) => (
                    <button
                      key={s.id}
                      type="button"
                      onClick={() => setStrategy(s.id as any)}
                      className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                        strategy === s.id
                          ? 'border-[#7150E7] bg-[#EDE9FC]/60 ring-2 ring-[#7150E7]/25 shadow-xs'
                          : 'border-slate-200 hover:border-slate-300 bg-white'
                      }`}
                    >
                      <div>
                        <div className="text-xs font-semibold text-slate-900">{s.title}</div>
                        <div className="text-[10px] font-semibold text-[#7150E7] mt-0.5">{s.rank}</div>
                      </div>
                      <p className="text-[11px] text-slate-500 mt-2 leading-relaxed">{s.desc}</p>
                    </button>
                  ))}
                </div>
              </div>

              {/* Target Country Preference */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700">Preferred Country (Optional)</label>
                <CustomDropdown
                  variant="pill"
                  align="left"
                  value={preferredCountry}
                  onChange={(val) => setPreferredCountry(val)}
                  buttonClassName="!h-10 !bg-white border !border-slate-200 hover:!border-[#7150E7] !rounded-xl text-xs sm:text-sm font-medium text-slate-800 px-3.5 shadow-2xs"
                  placeholder="🌐 All Countries"
                  searchPlaceholder="Search 50+ countries..."
                  options={getCountryOptions()}
                  showSearch={true}
                />
              </div>

            </div>
          ) : (
            /* RESULTS VIEW */
            <div className="space-y-7 animate-in fade-in slide-in-from-bottom-2 duration-300">
              
              {/* Match Summary Banner */}
              <div className="p-5 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-600 text-white shadow-md">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-5 h-5" />
                    <span className="text-xs uppercase font-semibold tracking-wider bg-white/20 px-2.5 py-0.5 rounded-full">
                      Match Ready
                    </span>
                  </div>
                  <span className="text-xs font-medium text-emerald-100">
                    Strategy: {strategy === 'SAFE_GEMS' ? 'Rank 1,000–5,000+ Safe Gems' : 'Comprehensive Target'}
                  </span>
                </div>
                <h3 className="text-lg sm:text-xl font-semibold mt-2">
                  Your High-Probability Higher Study & Scholarship Roadmap
                </h3>
                <p className="text-xs text-emerald-50 mt-1 leading-relaxed">
                  Tailored for <strong>{degree} in {field}</strong> with CGPA {cgpa}, {englishTest}, and {greStatus}.
                </p>
              </div>

              {/* Section 2: Top Matched Scholarships with 100% Free Tuition */}
              {matchingScholarships.length > 0 && (
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-slate-700">
                    <Award className="w-4 h-4 text-[#7150E7]" />
                    <span>🏆 Matched 100% Free Scholarships for {field}</span>
                  </div>

                  <div className="space-y-2.5">
                    {matchingScholarships.map((sch) => (
                      <div 
                        key={sch.id}
                        className="p-4 rounded-2xl border border-purple-100 bg-[#EDE9FC]/20 hover:bg-[#EDE9FC]/40 transition-all flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3"
                      >
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-semibold text-slate-900">{sch.title}</span>
                            <span className="text-[10px] font-semibold text-[#7150E7] bg-[#EDE9FC] px-2 py-0.5 rounded-full">
                              {sch.countries.join(', ')}
                            </span>
                          </div>
                          <p className="text-xs text-slate-600 font-medium">{sch.fundingAmount}</p>
                          <p className="text-[11px] text-slate-500">
                            Notes: {sch.requirements.notes || 'Full tuition and living grant'}
                          </p>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          <a
                            href={sch.officialUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="h-8 px-3.5 rounded-full text-xs font-semibold bg-[#7150E7] hover:bg-[#5e3cd4] text-white inline-flex items-center gap-1 shadow-xs transition-all"
                          >
                            <span>Apply</span>
                            <ExternalLink className="w-3 h-3" />
                          </a>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Section 3: Recommended Professors in Field currently hiring */}
              {matchingProfessors.length > 0 && (
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-slate-700">
                    <GraduationCap className="w-4 h-4 text-purple-600" />
                    <span>👨‍🏫 Recommended Professors & Labs in {field} (Open Positions)</span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    {matchingProfessors.map((p) => (
                      <div key={p.id} className="p-3.5 rounded-2xl border border-slate-200 bg-white space-y-2 flex flex-col justify-between">
                        <div>
                          <div className="text-xs font-semibold text-slate-900">{p.name}</div>
                          <div className="text-[11px] text-slate-500">{p.university} • {p.country}</div>
                          <div className="text-[10px] text-purple-700 font-semibold bg-purple-50 px-2 py-0.5 rounded-full inline-block mt-1">
                            {p.labName}
                          </div>
                        </div>

                        {p.email && (
                          <a
                            href={`mailto:${p.email}?subject=Prospective ${degree} Student Inquiry - ${field}`}
                            className="text-[11px] font-semibold text-purple-700 hover:text-purple-900 flex items-center gap-1.5 pt-1"
                          >
                            <Mail className="w-3 h-3" />
                            <span>Contact: {p.email}</span>
                          </a>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-5 sm:p-6 border-t border-slate-100 bg-slate-50 flex items-center justify-between gap-3">
          {step === 'FORM' ? (
            <>
              <button
                onClick={onClose}
                className="text-xs text-slate-500 hover:text-slate-800 font-semibold cursor-pointer"
              >
                Close
              </button>
              <Button
                variant="primary"
                size="sm"
                onClick={() => setStep('RESULTS')}
                className="rounded-full px-6 bg-[#7150E7] hover:bg-[#5b38d6] text-white shadow-xs font-semibold inline-flex items-center gap-2"
              >
                <span>Generate Tailored Study Plan</span>
                <ArrowRight className="w-4 h-4" />
              </Button>
            </>
          ) : (
            <>
              <button
                onClick={() => setStep('FORM')}
                className="text-xs text-slate-600 hover:text-slate-900 font-semibold flex items-center gap-1.5 cursor-pointer"
              >
                <span>← Adjust Profile Inputs</span>
              </button>
              <Button
                variant="primary"
                size="sm"
                onClick={onClose}
                className="rounded-full px-6 bg-slate-900 hover:bg-slate-800 text-white font-semibold"
              >
                Done
              </Button>
            </>
          )}
        </div>

      </div>
    </div>
  );
};
