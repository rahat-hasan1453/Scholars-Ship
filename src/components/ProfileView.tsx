'use client';

import React, { useState } from 'react';
import { useApp } from '@/context/AppContext';
import { 
  User, 
  Mail, 
  GraduationCap, 
  Award, 
  MapPin, 
  Sparkles, 
  SlidersHorizontal, 
  FileText, 
  Globe, 
  CheckCircle2, 
  Edit3, 
  Save, 
  RotateCcw,
  BookOpen,
  ArrowRight,
  KanbanSquare,
  ShieldCheck,
  Zap,
  X,
  Plus
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CustomDropdown } from '@/components/ui/CustomDropdown';
import { calculateCountdown } from '@/lib/utils';

export const ProfileView: React.FC<{ onNavigateToTracker: () => void }> = ({ onNavigateToTracker }) => {
  const { profile, updateProfile, setIsOnboardingOpen, applications } = useApp();

  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    name: profile.name,
    email: profile.email,
    degreeLevel: profile.degreeLevel,
    cgpa: profile.cgpa,
    ielts: profile.testScores?.ielts || 7.5,
    gre: profile.testScores?.gre || 320,
    avatar: profile.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=250&q=80',
    newTag: '',
  });

  const [saveSuccess, setSaveSuccess] = useState(false);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    updateProfile({
      name: formData.name,
      email: formData.email,
      degreeLevel: formData.degreeLevel,
      cgpa: Number(formData.cgpa),
      avatar: formData.avatar,
      testScores: {
        ielts: Number(formData.ielts),
        gre: Number(formData.gre),
      },
    });
    setIsEditing(false);
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 3000);
  };

  const handleAddTag = () => {
    if (!formData.newTag.trim()) return;
    if (!profile.specializations.includes(formData.newTag.trim())) {
      updateProfile({
        specializations: [...profile.specializations, formData.newTag.trim()],
      });
    }
    setFormData((prev) => ({ ...prev, newTag: '' }));
  };

  const handleRemoveTag = (tagToRemove: string) => {
    updateProfile({
      specializations: profile.specializations.filter((t) => t !== tagToRemove),
    });
  };

  const handleRemoveCountry = (countryToRemove: string) => {
    updateProfile({
      targetCountries: profile.targetCountries.filter((c) => c !== countryToRemove),
    });
  };

  // Readiness Score calculation
  const readinessScore = Math.min(
    Math.round(
      (profile.cgpa / 4.0) * 40 +
      ((profile.testScores?.ielts || 6.5) / 9.0) * 30 +
      ((profile.testScores?.gre || 300) / 340) * 30
    ),
    99
  );

  return (
    <div className="space-y-6">
      
      {/* Unified Hero Banner Card (Matches Scholarships & Faculty Design System) */}
      <div className="bg-white rounded-2xl border border-[#EAECF0] shadow-2xs relative z-20">
        {/* Top White Section */}
        <div className="p-6 sm:p-7">
          <div className="flex items-center gap-2.5 mb-2.5">
            <span className="px-3 py-1 rounded-full text-xs font-semibold bg-[#EDE9FC] text-[#7150E7]">
              Graduate Scholar Profile
            </span>
            <span className="text-xs sm:text-sm text-[#475467] font-normal">
              {profile.degreeLevel} Track • GPA {profile.cgpa.toFixed(2)}
            </span>
          </div>
          <h1 className="text-2xl sm:text-[28px] font-bold text-[#101828] tracking-tight">
            Scholar Profile & Academic Matrix
          </h1>
        </div>

        {/* Bottom Lavender Profile Showcase Section */}
        <div className="bg-[#EDE9FC] px-6 sm:px-7 py-5 border-t border-[#E4DEF7] rounded-b-2xl">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-5">
            {/* Identity Info */}
            <div className="flex items-center gap-4">
              <div className="relative shrink-0">
                <img
                  src={formData.avatar}
                  alt={profile.name}
                  className="w-16 h-16 sm:w-18 sm:h-18 rounded-2xl object-cover border-2 border-white shadow-sm bg-white"
                />
                <span className="absolute -bottom-1 -right-1 w-5 h-5 bg-[#12B76A] border-2 border-white rounded-full flex items-center justify-center text-white text-[10px] font-bold" title="Profile Verified">
                  ✓
                </span>
              </div>

              <div className="space-y-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <h2 className="text-lg sm:text-xl font-bold text-[#101828]">{profile.name}</h2>
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-white text-[#7150E7] border border-[#DDD6FE] shadow-2xs uppercase">
                    {profile.degreeLevel} Aspirant
                  </span>
                </div>
                <div className="text-xs text-[#475467] flex items-center gap-2 flex-wrap">
                  <span className="flex items-center gap-1.5">
                    <Mail className="w-3.5 h-3.5 text-[#667085]" />
                    {profile.email}
                  </span>
                  <span>•</span>
                  <span className="text-[#027A48] font-semibold flex items-center gap-1">
                    <ShieldCheck className="w-3.5 h-3.5" /> HighScholar Verified Profile
                  </span>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-2.5 self-start md:self-center shrink-0">
              <button
                type="button"
                onClick={() => setIsOnboardingOpen(true)}
                className="h-10 px-4 rounded-full text-xs font-semibold bg-white hover:bg-slate-50 text-[#344054] border border-[#D0D5DD] shadow-2xs inline-flex items-center gap-1.5 cursor-pointer transition-colors"
              >
                <RotateCcw className="w-3.5 h-3.5 text-[#667085]" />
                <span>Restart Onboarding</span>
              </button>

              <button
                type="button"
                onClick={() => setIsEditing(!isEditing)}
                className="h-10 px-5 rounded-full text-xs font-semibold bg-[#7150E7] hover:bg-[#5E3FD1] text-white shadow-2xs inline-flex items-center gap-1.5 cursor-pointer transition-colors"
              >
                <Edit3 className="w-3.5 h-3.5 text-white" />
                <span>{isEditing ? 'Cancel Editing' : 'Edit Profile Details'}</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {saveSuccess && (
        <div className="p-3.5 bg-[#ECFDF3] border border-[#A6F4C5] rounded-xl text-xs font-semibold text-[#027A48] flex items-center gap-2 animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 text-[#12B76A]" />
          <span>Profile details updated and synchronized with recommendation engine!</span>
        </div>
      )}

      {/* Profile Overview or Editing Form */}
      {isEditing ? (
        /* EDIT FORM */
        <div className="bg-white rounded-2xl border border-[#EAECF0] p-6 sm:p-7 shadow-2xs">
          <div className="mb-5 pb-4 border-b border-[#EAECF0]">
            <h3 className="text-base font-bold text-[#101828]">Edit Academic & Personal Credentials</h3>
            <p className="text-xs text-[#667085] mt-1">Update your background so that scholarships and professors are filtered accurately.</p>
          </div>
          
          <form onSubmit={handleSave} className="space-y-5">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-bold text-[#344054] block mb-1.5">Full Name</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full h-10 px-3.5 rounded-xl border border-[#D0D5DD] text-xs sm:text-sm text-[#101828] focus:outline-hidden focus:ring-2 focus:ring-[#7150E7]"
                  required
                />
              </div>

              <div>
                <label className="text-xs font-bold text-[#344054] block mb-1.5">Email Address</label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full h-10 px-3.5 rounded-xl border border-[#D0D5DD] text-xs sm:text-sm text-[#101828] focus:outline-hidden focus:ring-2 focus:ring-[#7150E7]"
                  required
                />
              </div>

              <div>
                <label className="text-xs font-bold text-[#344054] block mb-1.5">Target Degree</label>
                <CustomDropdown
                  value={formData.degreeLevel}
                  onChange={(val) => setFormData({ ...formData, degreeLevel: val as any })}
                  options={[
                    { label: 'Bachelor’s Degree', value: 'Bachelors' },
                    { label: 'Master’s Degree', value: 'Masters' },
                    { label: 'Doctoral / PhD', value: 'PhD' },
                  ]}
                  showSearch={false}
                />
              </div>

              <div>
                <label className="text-xs font-bold text-[#344054] block mb-1.5">Avatar Image URL</label>
                <input
                  type="url"
                  value={formData.avatar}
                  onChange={(e) => setFormData({ ...formData, avatar: e.target.value })}
                  className="w-full h-10 px-3.5 rounded-xl border border-[#D0D5DD] text-xs sm:text-sm text-[#101828] focus:outline-hidden focus:ring-2 focus:ring-[#7150E7]"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-[#344054] block mb-1.5">Normalized CGPA (4.0 scale)</label>
                <input
                  type="number"
                  step="0.01"
                  min="2.0"
                  max="4.0"
                  value={formData.cgpa}
                  onChange={(e) => setFormData({ ...formData, cgpa: parseFloat(e.target.value) || 0 })}
                  className="w-full h-10 px-3.5 rounded-xl border border-[#D0D5DD] text-xs sm:text-sm text-[#101828] focus:outline-hidden focus:ring-2 focus:ring-[#7150E7]"
                  required
                />
              </div>

              <div>
                <label className="text-xs font-bold text-[#344054] block mb-1.5">IELTS / English Band</label>
                <input
                  type="number"
                  step="0.5"
                  min="5.0"
                  max="9.0"
                  value={formData.ielts}
                  onChange={(e) => setFormData({ ...formData, ielts: parseFloat(e.target.value) || 0 })}
                  className="w-full h-10 px-3.5 rounded-xl border border-[#D0D5DD] text-xs sm:text-sm text-[#101828] focus:outline-hidden focus:ring-2 focus:ring-[#7150E7]"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-[#344054] block mb-1.5">GRE / GMAT Total</label>
                <input
                  type="number"
                  step="1"
                  min="260"
                  max="340"
                  value={formData.gre}
                  onChange={(e) => setFormData({ ...formData, gre: parseInt(e.target.value) || 0 })}
                  className="w-full h-10 px-3.5 rounded-xl border border-[#D0D5DD] text-xs sm:text-sm text-[#101828] focus:outline-hidden focus:ring-2 focus:ring-[#7150E7]"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2.5 pt-4 border-t border-[#EAECF0]">
              <button
                type="button"
                onClick={() => setIsEditing(false)}
                className="h-9 px-4 rounded-full text-xs font-semibold text-[#344054] hover:bg-slate-50 border border-[#D0D5DD] transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="h-9 px-5 rounded-full text-xs font-semibold text-white bg-[#7150E7] hover:bg-[#5E3FD1] transition-colors inline-flex items-center gap-1.5 shadow-2xs cursor-pointer"
              >
                <Save className="w-3.5 h-3.5" />
                <span>Save Changes</span>
              </button>
            </div>
          </form>
        </div>
      ) : (
        /* DISPLAY VIEW */
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Left Column: Academic Credentials Matrix */}
          <div className="space-y-6 lg:col-span-2">
            
            {/* Academic Scores Row */}
            <div className="bg-white rounded-2xl border border-[#EAECF0] p-6 shadow-2xs">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
                <div>
                  <h3 className="text-sm font-bold text-[#101828]">Academic Background & Test Scores</h3>
                  <p className="text-xs text-[#667085]">Verified scores matched against admission cutoffs</p>
                </div>
                <span className="self-start sm:self-auto px-3 py-1 rounded-full text-xs font-semibold bg-[#ECFDF3] text-[#027A48] border border-[#A6F4C5]">
                  {readinessScore}% Competitive Index
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
                <div className="p-4 bg-[#F9FAFB] rounded-xl border border-[#EAECF0]">
                  <span className="text-[11px] font-bold text-[#667085] uppercase tracking-wider block">Normalized CGPA</span>
                  <div className="text-xl font-bold text-[#101828] mt-1.5">
                    {profile.cgpa.toFixed(2)} <span className="text-xs text-[#98A2B3] font-normal">/ 4.00</span>
                  </div>
                  <span className="text-[11px] text-[#027A48] font-semibold block mt-1">Top 5% Percentile</span>
                </div>

                <div className="p-4 bg-[#F9FAFB] rounded-xl border border-[#EAECF0]">
                  <span className="text-[11px] font-bold text-[#667085] uppercase tracking-wider block">English Proficiency</span>
                  <div className="text-xl font-bold text-[#101828] mt-1.5">
                    Band {profile.testScores?.ielts || 7.5} <span className="text-xs text-[#98A2B3] font-normal">IELTS</span>
                  </div>
                  <span className="text-[11px] text-[#027A48] font-semibold block mt-1">Meets Oxbridge & US Cutoffs</span>
                </div>

                <div className="p-4 bg-[#F9FAFB] rounded-xl border border-[#EAECF0]">
                  <span className="text-[11px] font-bold text-[#667085] uppercase tracking-wider block">Standardized GRE</span>
                  <div className="text-xl font-bold text-[#101828] mt-1.5">
                    {profile.testScores?.gre || 320} <span className="text-xs text-[#98A2B3] font-normal">/ 340</span>
                  </div>
                  <span className="text-[11px] text-[#7150E7] font-semibold block mt-1">High Quant Score</span>
                </div>
              </div>
            </div>

            {/* Specializations & Subject Coverage */}
            <div className="bg-white rounded-2xl border border-[#EAECF0] p-6 shadow-2xs">
              <div className="mb-4">
                <h3 className="text-sm font-bold text-[#101828]">Fields of Study & Research Interests</h3>
                <p className="text-xs text-[#667085] mt-0.5">The recommendation algorithm prioritizes scholarship & lab opportunities in these disciplines</p>
              </div>

              <div className="flex flex-wrap gap-2 mb-4">
                {profile.specializations.map((spec) => (
                  <span
                    key={spec}
                    className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-[#EDE9FC] text-[#7150E7] border border-[#DDD6FE]"
                  >
                    <span>{spec}</span>
                    <button
                      type="button"
                      onClick={() => handleRemoveTag(spec)}
                      className="text-[#7150E7] hover:text-[#5E3FD1] cursor-pointer"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}
              </div>

              {/* Add Tag Row */}
              <div className="flex items-center gap-2 pt-3 border-t border-[#EAECF0]">
                <input
                  type="text"
                  placeholder="Add specialization tag (e.g. Interaction Design, Generative AI, Bioinformatics)..."
                  value={formData.newTag}
                  onChange={(e) => setFormData({ ...formData, newTag: e.target.value })}
                  onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddTag())}
                  className="flex-1 h-9 px-3.5 bg-[#F9FAFB] rounded-full border border-[#D0D5DD] text-xs text-[#101828] placeholder:text-[#98A2B3] focus:outline-hidden focus:ring-2 focus:ring-[#7150E7]"
                />
                <button
                  type="button"
                  onClick={handleAddTag}
                  className="h-9 px-4 rounded-full text-xs font-semibold bg-[#7150E7] hover:bg-[#5E3FD1] text-white shadow-2xs transition-colors cursor-pointer shrink-0"
                >
                  Add Tag
                </button>
              </div>
            </div>

            {/* Target Destination Countries */}
            <div className="bg-white rounded-2xl border border-[#EAECF0] p-6 shadow-2xs">
              <div className="mb-4">
                <h3 className="text-sm font-bold text-[#101828]">Target Countries for Higher Education</h3>
                <p className="text-xs text-[#667085] mt-0.5">Filtered countries for study visas and research funding</p>
              </div>

              <div className="flex flex-wrap gap-2">
                {profile.targetCountries.map((country) => (
                  <span
                    key={country}
                    className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-[#F2F4F7] text-[#344054] border border-[#EAECF0]"
                  >
                    <span>{country}</span>
                    <button
                      type="button"
                      onClick={() => handleRemoveCountry(country)}
                      className="text-[#667085] hover:text-[#344054] cursor-pointer"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}
              </div>
            </div>

          </div>

          {/* Right Column: Applications Pipeline & Quick Actions */}
          <div className="space-y-6">
            
            {/* Pipeline Overview Card */}
            <div className="bg-white rounded-2xl border border-[#EAECF0] p-6 shadow-2xs">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-bold text-[#101828] flex items-center gap-2">
                  <KanbanSquare className="w-4 h-4 text-[#7150E7]" />
                  <span>My Target Pipeline</span>
                </h3>
                <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-[#EDE9FC] text-[#7150E7]">
                  {applications.length} Active
                </span>
              </div>

              <div className="space-y-2.5 my-3">
                {applications.slice(0, 3).map((app) => {
                  const countdown = calculateCountdown(app.deadline);
                  return (
                    <div key={app.id} className="p-3 bg-[#F9FAFB] rounded-xl border border-[#EAECF0] text-xs space-y-1.5">
                      <div className="font-bold text-[#101828] line-clamp-1">{app.scholarship.title}</div>
                      <div className="flex items-center justify-between text-[11px] text-[#667085]">
                        <span className="font-semibold text-[#7150E7]">{app.status}</span>
                        <span>{countdown.formatted}</span>
                      </div>
                    </div>
                  );
                })}
              </div>

              <button
                type="button"
                onClick={onNavigateToTracker}
                className="w-full mt-3 h-10 rounded-xl text-xs font-semibold bg-[#7150E7] hover:bg-[#5E3FD1] text-white shadow-2xs inline-flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
              >
                <span>Open Kanban Board</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Application Readiness Card */}
            <div className="bg-white rounded-2xl border border-[#EAECF0] p-6 shadow-2xs">
              <div className="flex items-center gap-2 mb-4">
                <Zap className="w-4 h-4 text-[#F79009]" />
                <h3 className="text-sm font-bold text-[#101828]">Application Readiness</h3>
              </div>

              <div className="space-y-3.5 text-xs text-[#344054]">
                <div className="flex items-center justify-between">
                  <span>Statement of Purpose (SOP)</span>
                  <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-[#ECFDF3] text-[#027A48] border border-[#A6F4C5]">
                    Ready
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Letters of Recommendation (LOR)</span>
                  <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-[#FEF0C7] text-[#B54708] border border-[#FEDF89]">
                    2 / 3 Confirmed
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Certified Academic Transcripts</span>
                  <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-[#ECFDF3] text-[#027A48] border border-[#A6F4C5]">
                    Uploaded
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Academic CV & Research Portfolio</span>
                  <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-[#ECFDF3] text-[#027A48] border border-[#A6F4C5]">
                    Ready (PDF)
                  </span>
                </div>
              </div>
            </div>

          </div>

        </div>
      )}

    </div>
  );
};
