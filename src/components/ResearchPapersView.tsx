'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { ResearchPaper } from '@/types';
import { initialResearchPapers } from '@/data/researchPapers';
import { useApp } from '@/context/AppContext';
import { ResearchBotModal } from '@/components/ResearchBotModal';
import { 
  Search, 
  Sparkles, 
  BookOpen, 
  Download, 
  ExternalLink, 
  Bot, 
  Bookmark, 
  BookmarkCheck, 
  Globe2, 
  SlidersHorizontal, 
  RotateCcw, 
  X, 
  Loader2, 
  ChevronDown, 
  ChevronUp,
  FileText,
  CheckCircle2,
  Share2
} from 'lucide-react';

export const ResearchPapersView: React.FC = () => {
  const { savedPaperIds, toggleSavePaper, isPaperSaved } = useApp();

  const [papers, setPapers] = useState<ResearchPaper[]>(initialResearchPapers);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDiscipline, setSelectedDiscipline] = useState<'ALL' | 'UX' | 'AI' | 'Biotech' | 'Robotics' | 'Economics'>('ALL');
  const [openAccessOnly, setOpenAccessOnly] = useState(false);
  const [activeTab, setActiveTab] = useState<'all' | 'saved'>('all');
  const [expandedAbstracts, setExpandedAbstracts] = useState<Record<string, boolean>>({});

  // Live OpenAlex search states
  const [isSearchingLive, setIsSearchingLive] = useState(false);
  const [liveSearchError, setLiveSearchError] = useState('');

  // AI Bot Modal state
  const [selectedPaperForBot, setSelectedPaperForBot] = useState<ResearchPaper | null>(null);
  const [isBotModalOpen, setIsBotModalOpen] = useState(false);

  // Auto-fetch live papers from OpenAlex on initial mount to expand dataset
  useEffect(() => {
    let isSubscribed = true;
    const autoFetchLivePapers = async () => {
      try {
        const res = await fetch('/api/research/search?query=Computer Science AI Human Computer Interaction Biotech Robotics Economics');
        const data = await res.json();
        if (isSubscribed && data.success && data.papers?.length > 0) {
          setPapers((prev) => {
            const existingIds = new Set(prev.map((p) => p.id));
            const newItems = data.papers.filter((p: ResearchPaper) => !existingIds.has(p.id));
            return [...prev, ...newItems];
          });
        }
      } catch {
        // Fallback silently to initial dataset
      }
    };
    autoFetchLivePapers();
    return () => { isSubscribed = false; };
  }, []);

  // Live OpenAlex / Semantic Scholar API Search Handler
  const handleLiveSearch = async () => {
    const query = searchQuery.trim() || (selectedDiscipline !== 'ALL' ? selectedDiscipline : 'Human Computer Interaction UX AI');
    setIsSearchingLive(true);
    setLiveSearchError('');
    try {
      const res = await fetch(`/api/research/search?query=${encodeURIComponent(query)}`);
      const data = await res.json();
      if (data.success && data.papers?.length > 0) {
        setPapers((prev) => {
          const existingIds = new Set(prev.map((p) => p.id));
          const newItems = data.papers.filter((p: ResearchPaper) => !existingIds.has(p.id));
          return [...newItems, ...prev];
        });
      } else {
        setLiveSearchError('No papers found for this query in the global repository.');
      }
    } catch {
      setLiveSearchError('Unable to fetch live papers from global academic database.');
    } finally {
      setIsSearchingLive(false);
    }
  };

  const toggleAbstractExpand = (id: string) => {
    setExpandedAbstracts((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const handleOpenBot = (paper: ResearchPaper) => {
    setSelectedPaperForBot(paper);
    setIsBotModalOpen(true);
  };

  // Filtered papers list
  const filteredPapers = useMemo(() => {
    return papers.filter((paper) => {
      // Saved tab filter
      if (activeTab === 'saved' && !isPaperSaved(paper.id)) {
        return false;
      }

      // Open access filter
      if (openAccessOnly && !paper.pdfUrl && !paper.isOpenAccess) {
        return false;
      }

      // Discipline filter
      if (selectedDiscipline !== 'ALL') {
        const text = (paper.fieldsOfStudy.join(' ') + ' ' + paper.tags.join(' ') + ' ' + paper.title + ' ' + paper.abstract).toLowerCase();
        if (selectedDiscipline === 'UX' && !text.includes('ux') && !text.includes('hci') && !text.includes('design') && !text.includes('human')) return false;
        if (selectedDiscipline === 'AI' && !text.includes('ai') && !text.includes('learning') && !text.includes('intelligence') && !text.includes('transformer')) return false;
        if (selectedDiscipline === 'Biotech' && !text.includes('bio') && !text.includes('crispr') && !text.includes('gene') && !text.includes('stem')) return false;
        if (selectedDiscipline === 'Robotics' && !text.includes('robot') && !text.includes('navigation') && !text.includes('hardware')) return false;
        if (selectedDiscipline === 'Economics' && !text.includes('econ') && !text.includes('fellowship') && !text.includes('policy') && !text.includes('social')) return false;
      }

      // Keyword Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchTitle = paper.title.toLowerCase().includes(q);
        const matchAbstract = paper.abstract.toLowerCase().includes(q);
        const matchVenue = paper.venue.toLowerCase().includes(q);
        const matchAuthors = paper.authors.some((a) => a.name.toLowerCase().includes(q) || (a.institution && a.institution.toLowerCase().includes(q)));
        const matchTags = paper.tags.some((t) => t.toLowerCase().includes(q));
        const matchFields = paper.fieldsOfStudy.some((f) => f.toLowerCase().includes(q));

        if (!matchTitle && !matchAbstract && !matchVenue && !matchAuthors && !matchTags && !matchFields) {
          return false;
        }
      }

      return true;
    });
  }, [papers, activeTab, openAccessOnly, selectedDiscipline, searchQuery, savedPaperIds]);

  const activeFilterCount = (selectedDiscipline !== 'ALL' ? 1 : 0) + (openAccessOnly ? 1 : 0) + (searchQuery ? 1 : 0);

  const resetFilters = () => {
    setSearchQuery('');
    setSelectedDiscipline('ALL');
    setOpenAccessOnly(false);
  };

  return (
    <div className="space-y-6">
      
      {/* Hero Banner Header */}
      <div className="bg-white rounded-2xl border border-[#EAECF0] shadow-2xs relative z-20">
        <div className="p-6 sm:p-7 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2.5">
              <span className="px-3 py-1 rounded-full text-xs font-semibold bg-[#EDE9FC] text-[#7150E7] inline-flex items-center gap-1.5">
                <BookOpen className="w-3.5 h-3.5 text-[#7150E7]" />
                <span>Scholar Research Explorer</span>
              </span>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                250M+ Works Indexed
              </span>
            </div>

            <h1 className="text-2xl sm:text-[28px] font-bold text-[#101828] tracking-tight">
              Global Research Papers & AI Assistant Hub
            </h1>
            <p className="text-xs sm:text-sm text-[#475467] mt-1 max-w-2xl">
              Search papers across major disciplines, download full-text PDFs, export citations, and query our AI Assistant to break down complex papers.
            </p>
          </div>

          {/* AI Bot Quick Launch CTA */}
          {papers.length > 0 && (
            <button
              type="button"
              onClick={() => handleOpenBot(papers[0])}
              className="h-11 px-5 rounded-full bg-gradient-to-r from-[#7150E7] via-purple-600 to-[#5b38d6] hover:from-[#5e3cd4] hover:to-purple-700 text-white font-semibold text-xs sm:text-sm shadow-md shadow-purple-200 inline-flex items-center gap-2.5 transition-all cursor-pointer shrink-0"
            >
              <Bot className="w-4 h-4 text-amber-300" />
              <span>Launch AI Research Bot</span>
            </button>
          )}
        </div>

        {/* Filter Section */}
        <div className="bg-[#EDE9FC] px-6 sm:px-7 py-5 border-t border-[#E4DEF7] rounded-b-2xl space-y-4">
          
          {/* Row 1: Search Input & Action Buttons */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-[#98A2B3] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search papers by title, author, keyword, DOI, or abstract (e.g. UX Design, Transformers, CRISPR, HCI)..."
                className="w-full h-10 bg-white border-0 focus:ring-2 focus:ring-[#7150E7] text-[#101828] text-xs sm:text-sm rounded-full pl-10 pr-4 placeholder:text-[#98A2B3] placeholder:italic shadow-2xs focus:outline-hidden transition-all"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs text-[#98A2B3] hover:text-[#344054] cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Live OpenAlex Search Button */}
            <button
              onClick={handleLiveSearch}
              disabled={isSearchingLive}
              className="h-10 px-4 rounded-full text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs transition-all cursor-pointer inline-flex items-center gap-2 disabled:opacity-60 shrink-0"
            >
              {isSearchingLive ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Globe2 className="w-4 h-4" />
              )}
              <span>{isSearchingLive ? 'Searching...' : '🌐 Search Live DB'}</span>
            </button>
          </div>

          {/* Row 2: Discipline Filter Chips & Saved Tabs */}
          <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={() => setSelectedDiscipline('ALL')}
                className={`h-8 px-4 rounded-full text-xs font-semibold transition-all cursor-pointer ${
                  selectedDiscipline === 'ALL'
                    ? 'bg-[#6941C6] text-white shadow-xs'
                    : 'bg-white text-[#344054] hover:bg-slate-50 font-medium shadow-2xs'
                }`}
              >
                ALL
              </button>

              <button
                onClick={() => setSelectedDiscipline(selectedDiscipline === 'UX' ? 'ALL' : 'UX')}
                className={`h-8 px-3.5 rounded-full text-xs transition-all cursor-pointer inline-flex items-center gap-1.5 ${
                  selectedDiscipline === 'UX'
                    ? 'bg-[#6941C6] text-white font-semibold shadow-xs ring-2 ring-purple-300'
                    : 'bg-white text-[#344054] hover:bg-purple-50 font-medium shadow-2xs'
                }`}
              >
                <span>🎨 UX & HCI</span>
              </button>

              <button
                onClick={() => setSelectedDiscipline(selectedDiscipline === 'AI' ? 'ALL' : 'AI')}
                className={`h-8 px-3.5 rounded-full text-xs transition-all cursor-pointer inline-flex items-center gap-1.5 ${
                  selectedDiscipline === 'AI'
                    ? 'bg-[#6941C6] text-white font-semibold shadow-xs ring-2 ring-purple-300'
                    : 'bg-white text-[#344054] hover:bg-purple-50 font-medium shadow-2xs'
                }`}
              >
                <span>🤖 AI & ML</span>
              </button>

              <button
                onClick={() => setSelectedDiscipline(selectedDiscipline === 'Biotech' ? 'ALL' : 'Biotech')}
                className={`h-8 px-3.5 rounded-full text-xs transition-all cursor-pointer inline-flex items-center gap-1.5 ${
                  selectedDiscipline === 'Biotech'
                    ? 'bg-[#6941C6] text-white font-semibold shadow-xs ring-2 ring-purple-300'
                    : 'bg-white text-[#344054] hover:bg-purple-50 font-medium shadow-2xs'
                }`}
              >
                <span>🧬 Biotech</span>
              </button>

              <button
                onClick={() => setSelectedDiscipline(selectedDiscipline === 'Robotics' ? 'ALL' : 'Robotics')}
                className={`h-8 px-3.5 rounded-full text-xs transition-all cursor-pointer inline-flex items-center gap-1.5 ${
                  selectedDiscipline === 'Robotics'
                    ? 'bg-[#6941C6] text-white font-semibold shadow-xs ring-2 ring-purple-300'
                    : 'bg-white text-[#344054] hover:bg-purple-50 font-medium shadow-2xs'
                }`}
              >
                <span>⚡ Robotics</span>
              </button>

              <button
                onClick={() => setSelectedDiscipline(selectedDiscipline === 'Economics' ? 'ALL' : 'Economics')}
                className={`h-8 px-3.5 rounded-full text-xs transition-all cursor-pointer inline-flex items-center gap-1.5 ${
                  selectedDiscipline === 'Economics'
                    ? 'bg-[#6941C6] text-white font-semibold shadow-xs ring-2 ring-purple-300'
                    : 'bg-white text-[#344054] hover:bg-purple-50 font-medium shadow-2xs'
                }`}
              >
                <span>📈 Economics</span>
              </button>

              {/* Open access filter toggle */}
              <button
                onClick={() => setOpenAccessOnly(!openAccessOnly)}
                className={`h-8 px-3.5 rounded-full text-xs font-medium transition-all cursor-pointer inline-flex items-center gap-1.5 ${
                  openAccessOnly
                    ? 'bg-emerald-700 text-white shadow-xs font-bold'
                    : 'bg-white text-slate-700 hover:bg-slate-50 shadow-2xs'
                }`}
              >
                <Download className="w-3.5 h-3.5 text-emerald-400" />
                <span>PDF Downloadable Only</span>
              </button>
            </div>

            {/* Saved Library Toggle Pill */}
            <div className="flex items-center gap-1 p-1 bg-white rounded-full border border-slate-200 shadow-2xs">
              <button
                onClick={() => setActiveTab('all')}
                className={`px-3 py-1 rounded-full text-xs font-bold transition-all cursor-pointer ${
                  activeTab === 'all'
                    ? 'bg-[#7150E7] text-white shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                All Papers ({papers.length})
              </button>
              <button
                onClick={() => setActiveTab('saved')}
                className={`px-3 py-1 rounded-full text-xs font-bold transition-all cursor-pointer inline-flex items-center gap-1.5 ${
                  activeTab === 'saved'
                    ? 'bg-[#7150E7] text-white shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <BookmarkCheck className="w-3.5 h-3.5" />
                <span>Saved Library ({savedPaperIds.length})</span>
              </button>
            </div>
          </div>

          {liveSearchError && (
            <div className="text-xs bg-rose-50 text-rose-700 border border-rose-200 rounded-xl px-4 py-2">
              {liveSearchError}
            </div>
          )}
        </div>
      </div>

      {/* Research Papers Grid List */}
      {filteredPapers.length === 0 ? (
        <div className="bg-white rounded-2xl p-12 text-center border border-slate-200 space-y-3 shadow-2xs">
          <div className="w-12 h-12 bg-slate-100 text-slate-400 rounded-2xl flex items-center justify-center mx-auto">
            <BookOpen className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-slate-900">No research papers matched your search</h3>
          <p className="text-xs text-slate-500 max-w-md mx-auto">
            {activeTab === 'saved'
              ? 'You have not saved any research papers to your library yet. Click the bookmark icon on any paper to save it.'
              : 'Try resetting your keywords or click "Search Live DB" to query OpenAlex & Semantic Scholar.'}
          </p>
          <button
            onClick={resetFilters}
            className="px-4 py-2 rounded-xl bg-[#7150E7] text-white text-xs font-bold shadow-xs hover:bg-[#5e3cd4] transition-all cursor-pointer inline-flex items-center gap-2"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset All Filters</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {filteredPapers.map((paper) => {
            const isSaved = isPaperSaved(paper.id);
            const isExpanded = Boolean(expandedAbstracts[paper.id]);

            return (
              <div
                key={paper.id}
                className="bg-white rounded-2xl border border-slate-200 hover:border-[#7150E7]/40 transition-all shadow-xs hover:shadow-md p-6 flex flex-col justify-between group"
              >
                <div>
                  {/* Top Badges Row */}
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-[#EDE9FC] text-[#7150E7] border border-[#DDD7FA]">
                        {paper.venue} ({paper.year})
                      </span>
                      {paper.isOpenAccess && (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                          <span>Open Access PDF</span>
                        </span>
                      )}
                    </div>

                    {/* Bookmark Toggle Button */}
                    <button
                      onClick={() => toggleSavePaper(paper.id)}
                      className={`p-2 rounded-xl transition-all cursor-pointer ${
                        isSaved
                          ? 'bg-[#7150E7] text-white shadow-2xs'
                          : 'bg-slate-100 text-slate-400 hover:text-[#7150E7] hover:bg-[#EDE9FC]'
                      }`}
                      title={isSaved ? 'Remove from Saved Library' : 'Save Paper to Library'}
                    >
                      {isSaved ? <BookmarkCheck className="w-4 h-4" /> : <Bookmark className="w-4 h-4" />}
                    </button>
                  </div>

                  {/* Title */}
                  <h3 className="text-base font-bold text-slate-900 group-hover:text-[#7150E7] transition-colors leading-snug mb-2">
                    {paper.title}
                  </h3>

                  {/* Authors List with Google Scholar URL */}
                  <div className="text-xs text-slate-600 mb-3 flex flex-wrap items-center gap-x-2 gap-y-1">
                    <span className="font-semibold text-slate-400">Authors:</span>
                    {paper.authors.map((author, aIdx) => (
                      <a
                        key={aIdx}
                        href={author.googleScholarUrl || `https://scholar.google.com/scholar?q=${encodeURIComponent(author.name)}`}
                        target="_blank"
                        rel="noreferrer"
                        className="hover:text-[#7150E7] hover:underline font-medium flex items-center gap-1 text-slate-700"
                      >
                        <span>{author.name}</span>
                        {aIdx < paper.authors.length - 1 && <span className="text-slate-300">•</span>}
                      </a>
                    ))}
                  </div>

                  {/* Abstract Snippet with Expand */}
                  <div className="text-xs text-slate-600 leading-relaxed bg-slate-50 p-3.5 rounded-xl border border-slate-100 mb-4 relative">
                    <p className={isExpanded ? '' : 'line-clamp-3'}>
                      {paper.abstract}
                    </p>
                    {paper.abstract.length > 150 && (
                      <button
                        onClick={() => toggleAbstractExpand(paper.id)}
                        className="text-[11px] font-bold text-[#7150E7] hover:underline mt-1 flex items-center gap-1 cursor-pointer"
                      >
                        <span>{isExpanded ? 'Show less' : 'Read full abstract'}</span>
                        {isExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                      </button>
                    )}
                  </div>

                  {/* Tags & Citations */}
                  <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
                    <div className="flex flex-wrap gap-1.5">
                      {paper.fieldsOfStudy.slice(0, 3).map((f, fIdx) => (
                        <span key={fIdx} className="px-2 py-0.5 rounded-md text-[10px] font-semibold bg-slate-100 text-slate-600">
                          #{f}
                        </span>
                      ))}
                    </div>
                    <span className="text-[11px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200">
                      📊 {paper.citationCount.toLocaleString()} Citations
                    </span>
                  </div>
                </div>

                {/* Footer Action Buttons */}
                <div className="pt-4 border-t border-slate-100 flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    {/* PDF Download Link */}
                    {paper.pdfUrl ? (
                      <a
                        href={paper.pdfUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="h-9 px-3.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-xs inline-flex items-center gap-1.5 transition-all cursor-pointer"
                      >
                        <Download className="w-3.5 h-3.5" />
                        <span>Download PDF</span>
                      </a>
                    ) : (
                      <a
                        href={paper.googleScholarUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="h-9 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium text-xs inline-flex items-center gap-1.5 transition-all"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                        <span>Find PDF</span>
                      </a>
                    )}

                    {/* Google Scholar Button */}
                    <a
                      href={paper.googleScholarUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="h-9 px-3 rounded-xl bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 font-semibold text-xs inline-flex items-center gap-1.5 transition-all shadow-2xs"
                      title="View paper citations on Google Scholar"
                    >
                      <Globe2 className="w-3.5 h-3.5 text-blue-600" />
                      <span className="hidden sm:inline">Google Scholar</span>
                    </a>
                  </div>

                  {/* Ask AI Bot Button */}
                  <button
                    onClick={() => handleOpenBot(paper)}
                    className="h-9 px-3.5 rounded-xl bg-[#EDE9FC] hover:bg-[#7150E7] text-[#7150E7] hover:text-white font-bold text-xs inline-flex items-center gap-1.5 transition-all cursor-pointer border border-[#DDD7FA]"
                  >
                    <Bot className="w-3.5 h-3.5" />
                    <span>Ask AI Bot</span>
                  </button>
                </div>

              </div>
            );
          })}
        </div>
      )}

      {/* AI Bot Slide-Over Modal */}
      <ResearchBotModal
        isOpen={isBotModalOpen}
        onClose={() => setIsBotModalOpen(false)}
        paper={selectedPaperForBot}
      />
    </div>
  );
};
