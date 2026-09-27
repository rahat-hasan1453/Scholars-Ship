'use client';

import React, { useState } from 'react';
import { useApp } from '@/context/AppContext';
import { 
  X, 
  Sparkles, 
  Link as LinkIcon, 
  FileText, 
  CheckCircle2, 
  AlertCircle, 
  Loader2,
  Globe,
  Share2
} from 'lucide-react';
import { Button } from './ui/button';
import { CustomDropdown } from './ui/CustomDropdown';

interface ImportPostModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ImportPostModal: React.FC<ImportPostModalProps> = ({ isOpen, onClose }) => {
  const { importOpportunityManual } = useApp();
  const [sourceUrl, setSourceUrl] = useState('');
  const [rawText, setRawText] = useState('');
  const [authorName, setAuthorName] = useState('');
  const [institution, setInstitution] = useState('');
  const [country, setCountry] = useState('USA');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rawText.trim() && !sourceUrl.trim()) {
      setError('Please paste the post text or provide a post URL.');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      await importOpportunityManual({
        rawText,
        sourceUrl,
        authorName: authorName.trim() || undefined,
        institution: institution.trim() || undefined,
        country: country !== 'ALL' ? country : undefined,
      });

      setSuccess(true);
      setTimeout(() => {
        setSuccess(false);
        setRawText('');
        setSourceUrl('');
        setAuthorName('');
        setInstitution('');
        onClose();
      }, 1400);
    } catch (err: any) {
      setError(err.message || 'Failed to extract opportunity. Please check the text and try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSamplePaste = () => {
    setAuthorName('Dr. Cynthia Breazeal');
    setInstitution('MIT Media Lab');
    setSourceUrl('https://www.linkedin.com/posts/cynthia-breazeal');
    setRawText('Exciting news! The Personal Robots Group at MIT Media Lab has 2 open fully funded graduate research assistantships (PhD) starting Fall. We are exploring socially assistive AI, developmental robotics, and human-robot companion interaction. Students receive 100% tuition remission and $4,200/mo research stipend. Reach out with your CV and portfolio!');
    setCountry('USA');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs transition-opacity duration-200">
      <div 
        className="bg-white rounded-3xl border border-[#eaecf0] shadow-2xl max-w-xl w-full p-6 md:p-8 relative overflow-hidden transition-all duration-300"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 text-slate-400 hover:text-slate-700 p-2 rounded-full hover:bg-slate-100 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="flex items-center gap-3 mb-4">
          <div className="w-11 h-11 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-[#4f46e5]">
            <Share2 className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-xl font-extrabold text-[#101828]">
              Import Opportunity from Social Media
            </h3>
            <p className="text-xs text-[#667085] mt-0.5">
              Paste any professor's hiring post from LinkedIn, 𝕏, or Web. AI will parse it automatically.
            </p>
          </div>
        </div>

        {error && (
          <div className="mb-4 p-3 rounded-xl bg-red-50 border border-red-200 flex items-center gap-2 text-xs text-red-700">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {success ? (
          <div className="py-12 flex flex-col items-center justify-center text-center">
            <div className="w-14 h-14 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mb-3 animate-bounce">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <h4 className="text-lg font-extrabold text-[#101828]">Opportunity Imported!</h4>
            <p className="text-xs text-[#667085] mt-1">
              Parsed and added to your live feed with AI cold email capability.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Quick Sample Button */}
            <div className="flex justify-end">
              <button
                type="button"
                onClick={handleSamplePaste}
                className="text-[11px] font-semibold text-[#4f46e5] hover:underline flex items-center gap-1"
              >
                <Sparkles className="w-3 h-3" />
                Fill with Sample Post
              </button>
            </div>

            {/* Post Content / Announcement Text */}
            <div>
              <label className="block text-xs font-bold text-[#344054] mb-1.5 flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5 text-[#4f46e5]" />
                Post Announcement Text <span className="text-red-500">*</span>
              </label>
              <textarea
                value={rawText}
                onChange={(e) => setRawText(e.target.value)}
                placeholder="Paste the LinkedIn post, 𝕏 tweet, or email text (e.g. 'Looking for 2 PhD students in HCI & AI...')"
                className="w-full text-xs p-3.5 rounded-2xl border border-[#d0d5dd] focus:outline-none focus:ring-2 focus:ring-[#4f46e5] focus:border-transparent min-h-[110px] resize-y placeholder:text-slate-400"
                required
              />
            </div>

            {/* Source URL */}
            <div>
              <label className="block text-xs font-bold text-[#344054] mb-1.5 flex items-center gap-1.5">
                <LinkIcon className="w-3.5 h-3.5 text-[#4f46e5]" />
                Post URL (Optional)
              </label>
              <input
                type="url"
                value={sourceUrl}
                onChange={(e) => setSourceUrl(e.target.value)}
                placeholder="https://www.linkedin.com/posts/... or https://x.com/..."
                className="w-full text-xs p-2.5 rounded-xl border border-[#d0d5dd] focus:outline-none focus:ring-2 focus:ring-[#4f46e5] focus:border-transparent placeholder:text-slate-400"
              />
            </div>

            {/* Quick Details (Optional Helper) */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-[11px] font-bold text-[#344054] mb-1">
                  Professor Name
                </label>
                <input
                  type="text"
                  value={authorName}
                  onChange={(e) => setAuthorName(e.target.value)}
                  placeholder="e.g. Dr. Cynthia Breazeal"
                  className="w-full text-xs p-2 rounded-xl border border-[#d0d5dd] focus:outline-none focus:ring-2 focus:ring-[#4f46e5]"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-[#344054] mb-1">
                  University / Lab
                </label>
                <input
                  type="text"
                  value={institution}
                  onChange={(e) => setInstitution(e.target.value)}
                  placeholder="e.g. MIT Media Lab"
                  className="w-full text-xs p-2 rounded-xl border border-[#d0d5dd] focus:outline-none focus:ring-2 focus:ring-[#4f46e5]"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-[#344054] mb-1">
                  Country
                </label>
                <CustomDropdown
                  value={country}
                  onChange={(val) => setCountry(val)}
                  options={[
                    'USA',
                    'Canada',
                    'United Kingdom',
                    'Germany',
                    'Switzerland',
                    'Sweden',
                    'Singapore',
                    'Australia',
                    'International'
                  ]}
                />
              </div>
            </div>

            {/* Modal Actions */}
            <div className="pt-3 border-t border-[#eaecf0] flex items-center justify-end gap-2.5">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={onClose}
                className="rounded-xl border-[#d0d5dd] text-slate-700"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                variant="primary"
                size="sm"
                disabled={isLoading}
                className="rounded-xl bg-[#4f46e5] hover:bg-[#4338ca] text-white font-bold flex items-center gap-1.5 px-4 shadow-sm"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Extracting Details...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    Import & Parse with AI
                  </>
                )}
              </Button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
