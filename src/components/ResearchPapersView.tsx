'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { ResearchPaper } from '@/types';
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
  Share2,
  LayoutGrid,
  List,
  Check
} from 'lucide-react';

export const ResearchPapersView: React.FC = () => {
  const { savedPaperIds, toggleSavePaper, isPaperSaved } = useApp();

  const [papers, setPapers] = useState<ResearchPaper[]>([]);
  const [viewLayout, setViewLayout] = useState<'grid' | 'list'>('grid');
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
      
      {/* FIGMA NODE 102:265 - Unified Research Papers Header & Filter Hero Card */}
      <div className="bg-white rounded-3xl border border-[#EAECF0] shadow-sm relative z-10 mb-6 overflow-hidden">
        {/* Top White Section matching Figma Node 102:266 */}
        <div className="p-6 sm:p-7 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <h1 className="text-xl sm:text-2xl lg:text-[26px] font-semibold text-[#101828] tracking-tight">
              Global Research Papers &amp; AI Assistant Hub
            </h1>
            <p className="text-xs sm:text-sm text-[#475467] font-normal">
              Search papers across major disciplines, download full-text PDFs, export citations, and query our AI Assistant to break down complex papers.
            </p>
          </div>

          <div className="flex flex-col items-end justify-center gap-2.5 shrink-0">
            {/* Grid / List View Toggle */}
            <div className="flex items-center p-1 bg-white border border-[#D0D5DD] rounded-full shadow-2xs">
              <button
                type="button"
                onClick={() => setViewLayout('grid')}
                className={`p-1.5 rounded-full transition-all cursor-pointer ${
                  viewLayout === 'grid' 
                    ? 'bg-[#F4F3FE] text-[#7150E7]' 
                    : 'text-[#98A2B3] hover:text-[#475467]'
                }`}
                title="Grid View"
              >
                <LayoutGrid className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => setViewLayout('list')}
                className={`p-1.5 rounded-full transition-all cursor-pointer ${
                  viewLayout === 'list' 
                    ? 'bg-[#F4F3FE] text-[#7150E7]' 
                    : 'text-[#98A2B3] hover:text-[#475467]'
                }`}
                title="List View"
              >
                <List className="w-4 h-4" />
              </button>
            </div>

            {/* Live Indicator matching Figma */}
            <div className="flex items-center gap-1.5 text-xs font-semibold text-[#027A48]">
              <span className="w-2 h-2 rounded-full bg-[#12B76A] animate-pulse" />
              <span>Curated Papers &amp; AI Bot</span>
            </div>
          </div>
        </div>

        {/* Bottom Lavender Filter Section matching Figma Node 102:292 */}
        <div className="bg-[#EDE9FC] px-5 sm:px-7 py-3.5 sm:py-4 border-t border-[#E4DEF7] rounded-b-3xl">
          <div className="flex flex-wrap items-center justify-between gap-3">
            
            {/* Left Controls: Integrated Search + Category Filter Pills */}
            <div className="flex flex-wrap items-center gap-2 sm:gap-2.5">
              
              {/* Integrated Left Composite Search Input: Joined ALL Button + Search Box */}
              <div className="inline-flex items-center">
                {/* ALL Button as mutually exclusive tab matching Figma Node 102:510 */}
                <button
                  type="button"
                  onClick={() => {
                    setSelectedDiscipline('ALL');
                    setActiveTab('all');
                  }}
                  className={`h-9 px-3.5 rounded-l-full text-xs transition-all cursor-pointer shrink-0 flex items-center justify-center border ${
                    selectedDiscipline === 'ALL' && activeTab === 'all'
                      ? 'bg-[#6941C6] text-white border-[#6941C6] font-semibold'
                      : 'bg-white text-[#344054] hover:bg-slate-50 border-[#D0D5DD] font-medium'
                  }`}
                >
                  ALL
                </button>

                {/* Input connected with rounded right */}
                <div className="relative flex items-center">
                  <Search className="w-3.5 h-3.5 text-[#98A2B3] absolute left-3 pointer-events-none" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        handleLiveSearch();
                      }
                    }}
                    placeholder="Search /Select papers by title, author..."
                    className="h-9 bg-white border border-[#D0D5DD] border-l-0 focus:border-[#7150E7] focus:ring-1 focus:ring-[#7150E7] text-[#101828] text-xs rounded-r-full pl-8 pr-7 placeholder:text-[#98A2B3] placeholder:italic focus:outline-hidden transition-all w-48 sm:w-64"
                  />
                  {searchQuery ? (
                    <button
                      type="button"
                      onClick={() => setSearchQuery('')}
                      className="absolute right-2.5 text-[#98A2B3] hover:text-[#344054] cursor-pointer"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  ) : (
                    <ChevronDown className="w-3.5 h-3.5 text-[#98A2B3] absolute right-2.5 pointer-events-none" />
                  )}
                </div>
              </div>

              {/* Category Pills matching image */}
              <button
                type="button"
                onClick={() => setSelectedDiscipline(selectedDiscipline === 'UX' ? 'ALL' : 'UX')}
                className={`h-9 px-3.5 rounded-full text-xs font-medium transition-all cursor-pointer inline-flex items-center gap-1.5 shadow-2xs ${
                  selectedDiscipline === 'UX'
                    ? 'bg-[#6941C6] text-white font-semibold shadow-xs ring-2 ring-purple-300'
                    : 'bg-white text-[#344054] hover:bg-slate-50 border border-transparent'
                }`}
              >
                <span>🎨 UX &amp; HCI</span>
              </button>

              <button
                type="button"
                onClick={() => setSelectedDiscipline(selectedDiscipline === 'AI' ? 'ALL' : 'AI')}
                className={`h-9 px-3.5 rounded-full text-xs font-medium transition-all cursor-pointer inline-flex items-center gap-1.5 shadow-2xs ${
                  selectedDiscipline === 'AI'
                    ? 'bg-[#6941C6] text-white font-semibold shadow-xs ring-2 ring-purple-300'
                    : 'bg-white text-[#344054] hover:bg-slate-50 border border-transparent'
                }`}
              >
                <span>🤖 AI &amp; ML</span>
              </button>

              <button
                type="button"
                onClick={() => setSelectedDiscipline(selectedDiscipline === 'Biotech' ? 'ALL' : 'Biotech')}
                className={`h-9 px-3.5 rounded-full text-xs font-medium transition-all cursor-pointer inline-flex items-center gap-1.5 shadow-2xs ${
                  selectedDiscipline === 'Biotech'
                    ? 'bg-[#6941C6] text-white font-semibold shadow-xs ring-2 ring-purple-300'
                    : 'bg-white text-[#344054] hover:bg-slate-50 border border-transparent'
                }`}
              >
                <span>🧬 Biotech</span>
              </button>

              <button
                type="button"
                onClick={() => setSelectedDiscipline(selectedDiscipline === 'Robotics' ? 'ALL' : 'Robotics')}
                className={`h-9 px-3.5 rounded-full text-xs font-medium transition-all cursor-pointer inline-flex items-center gap-1.5 shadow-2xs ${
                  selectedDiscipline === 'Robotics'
                    ? 'bg-[#6941C6] text-white font-semibold shadow-xs ring-2 ring-purple-300'
                    : 'bg-white text-[#344054] hover:bg-slate-50 border border-transparent'
                }`}
              >
                <span>⚡ Robotics</span>
              </button>

              <button
                type="button"
                onClick={() => setSelectedDiscipline(selectedDiscipline === 'Economics' ? 'ALL' : 'Economics')}
                className={`h-9 px-3.5 rounded-full text-xs font-medium transition-all cursor-pointer inline-flex items-center gap-1.5 shadow-2xs ${
                  selectedDiscipline === 'Economics'
                    ? 'bg-[#6941C6] text-white font-semibold shadow-xs ring-2 ring-purple-300'
                    : 'bg-white text-[#344054] hover:bg-slate-50 border border-transparent'
                }`}
              >
                <span>📈 Economics</span>
              </button>

            </div>

            {/* Right Controls: Divider + Saved Library Pill */}
            <div className="flex items-center gap-2 sm:gap-3 shrink-0">
              <div className="h-6 w-px bg-[#D0D5DD] hidden sm:block" />

              {/* Saved Library Pill matching screenshot */}
              <button
                type="button"
                onClick={() => setActiveTab(activeTab === 'saved' ? 'all' : 'saved')}
                className={`h-9 px-3.5 rounded-full text-xs font-medium transition-all cursor-pointer inline-flex items-center gap-2 shadow-2xs ${
                  activeTab === 'saved'
                    ? 'bg-[#6941C6] text-white font-semibold shadow-xs ring-2 ring-purple-300'
                    : 'bg-white text-[#344054] hover:bg-slate-50 border border-transparent'
                }`}
              >
                <span className={`w-3.5 h-3.5 rounded-xs border flex items-center justify-center transition-colors ${
                  activeTab === 'saved' ? 'border-white bg-white/20' : 'border-[#98A2B3]'
                }`}>
                  {activeTab === 'saved' && <Check className="w-2.5 h-2.5 text-white stroke-[3]" />}
                </span>
                <span>Saved Library ({savedPaperIds.length})</span>
              </button>
            </div>

          </div>

          {liveSearchError && (
            <div className="text-xs bg-rose-50 text-rose-700 border border-rose-200 rounded-xl px-4 py-2 mt-2">
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
          <h3 className="text-base font-semibold text-slate-900">No research papers matched your search</h3>
          <p className="text-xs text-slate-500 max-w-md mx-auto">
            {activeTab === 'saved'
              ? 'You have not saved any research papers to your library yet. Click the bookmark icon on any paper to save it.'
              : 'Try resetting your keywords or click "Search Live DB" to query OpenAlex & Semantic Scholar.'}
          </p>
          <button
            onClick={resetFilters}
            className="px-4 py-2 rounded-xl bg-[#7150E7] text-white text-xs font-semibold shadow-xs hover:bg-[#5e3cd4] transition-all cursor-pointer inline-flex items-center gap-2"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset All Filters</span>
          </button>
        </div>
      ) : viewLayout === 'grid' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {filteredPapers.map((paper) => {
            const isSaved = isPaperSaved(paper.id);
            const isExpanded = Boolean(expandedAbstracts[paper.id]);

            return (
              <div
                key={paper.id}
                className="bg-white rounded-2xl border border-[#EAECF0] hover:border-[#7150E7]/40 transition-all shadow-xs hover:shadow-md p-4 sm:p-5 flex flex-col justify-between group space-y-3.5"
              >
                <div className="space-y-3">
                  {/* Venue in secondary text color, Italic (Not a chip) & Open Access Badge */}
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs italic text-[#667085] font-normal truncate max-w-[70%]">
                      {paper.venue} ({paper.year})
                    </span>
                    {paper.isOpenAccess && (
                      <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200 flex items-center gap-1 shrink-0">
                        <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                        <span>Open Access PDF</span>
                      </span>
                    )}
                  </div>

                  {/* Section 1: Title matching Figma 102:625 */}
                  <h3 className="text-sm sm:text-[15px] font-semibold text-[#101828] group-hover:text-[#7150E7] transition-colors leading-snug">
                    {paper.title}
                  </h3>

                  {/* Abstract Snippet with Expand matching Figma 102:714 */}
                  <div className="text-xs sm:text-sm text-[#475467] leading-relaxed">
                    <p className={isExpanded ? '' : 'line-clamp-3'}>
                      {paper.abstract}
                    </p>
                    {paper.abstract.length > 140 && (
                      <button
                        type="button"
                        onClick={() => toggleAbstractExpand(paper.id)}
                        className="text-[11px] font-semibold text-[#7150E7] hover:underline mt-1 inline-flex items-center gap-1 cursor-pointer"
                      >
                        <span>{isExpanded ? 'Show less' : 'Read full abstract'}</span>
                        {isExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                      </button>
                    )}
                  </div>

                  {/* Section 2: Authors matching Figma 102:698 */}
                  <div className="text-xs text-[#475467] flex flex-wrap items-center gap-x-2 gap-y-1 pt-0.5">
                    <span className="font-semibold text-[#98A2B3]">Authors:</span>
                    {paper.authors.map((author, aIdx) => (
                      <React.Fragment key={aIdx}>
                        <a
                          href={author.googleScholarUrl || `https://scholar.google.com/scholar?q=${encodeURIComponent(author.name)}`}
                          target="_blank"
                          rel="noreferrer"
                          className="hover:text-[#7150E7] hover:underline font-medium text-[#101828] transition-colors"
                        >
                          {author.name}
                        </a>
                        {aIdx < paper.authors.length - 1 && <span className="text-[#CBD5E1]">•</span>}
                      </React.Fragment>
                    ))}
                  </div>
                </div>

                <div className="space-y-3.5 pt-1">
                  {/* Section 3: Divider Line 1 matching Figma 102:643 */}
                  <hr className="border-t border-[#F2F4F7]" />

                  {/* Section 4: Tags & Citations Row matching Figma 102:718 */}
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    {/* Left Chips matching Figma 102:644 */}
                    <div className="flex flex-wrap items-center gap-1.5">
                      {paper.fieldsOfStudy.slice(0, 3).map((f, fIdx) => (
                        <span
                          key={fIdx}
                          className="px-2.5 py-1 rounded-full text-[11px] font-medium bg-[#F2F4F7] text-[#344054]"
                        >
                          #{f}
                        </span>
                      ))}
                    </div>

                    {/* Right Citations Badge matching Figma 102:715 */}
                    <span className="text-[11px] font-semibold text-[#B54708] bg-[#FFFBEB] px-2.5 py-1 rounded-xl border border-[#FDE047]/60 shrink-0">
                      📊 {paper.citationCount.toLocaleString()} Citations
                    </span>
                  </div>

                  {/* Section 5: Divider Line 2 matching Figma 102:658 */}
                  <hr className="border-t border-[#F2F4F7]" />

                  {/* Section 6: Footer Action Buttons: [Bookmark] [Ask AI Bot] | [Google Scholar (50%)] [Download PDF (50%)] */}
                  <div className="flex items-center justify-between gap-2.5">
                    {/* Left Quick Tools: Bookmark + Ask AI Bot + Divider */}
                    <div className="flex items-center gap-2 shrink-0">
                      {/* Bookmark Button */}
                      <button
                        type="button"
                        onClick={() => toggleSavePaper(paper.id)}
                        className={`w-8 h-8 rounded-full flex items-center justify-center transition-all cursor-pointer ${
                          isSaved
                            ? 'bg-[#7150E7] text-white shadow-2xs'
                            : 'bg-[#F2F4F7] text-[#667085] hover:text-[#7150E7] hover:bg-[#EDE9FC]'
                        }`}
                        title={isSaved ? 'Remove from Saved Library' : 'Save Paper to Library'}
                      >
                        {isSaved ? <BookmarkCheck className="w-4 h-4" /> : <Bookmark className="w-4 h-4" />}
                      </button>

                      {/* Ask AI Bot Button */}
                      <button
                        type="button"
                        onClick={() => handleOpenBot(paper)}
                        className="h-8 px-3 rounded-full bg-[#EDE9FC] hover:bg-[#7150E7] text-[#7150E7] hover:text-white font-semibold text-xs inline-flex items-center justify-center gap-1.5 transition-all cursor-pointer border border-[#DDD7FA]"
                        title="Ask AI Assistant about this paper"
                      >
                        <Bot className="w-3.5 h-3.5" />
                        <span>Ask AI Bot</span>
                      </button>

                      {/* Separator Divider */}
                      <div className="h-4 w-px bg-[#EAECF0] ml-0.5" />
                    </div>

                    {/* Right Group: Google Scholar & Download PDF equally divided across remaining full width */}
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                      {/* Google Scholar Button (flex-1) */}
                      <a
                        href={paper.googleScholarUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="flex-1 h-8 px-2 sm:px-3 rounded-full border border-[#7150E7] bg-white hover:bg-[#F9F8FE] text-[#7150E7] font-semibold text-xs inline-flex items-center justify-center gap-1.5 transition-all shadow-2xs cursor-pointer truncate"
                        title="View citations on Google Scholar"
                      >
                        <Globe2 className="w-3.5 h-3.5 text-[#7150E7] shrink-0" />
                        <span className="truncate">Google Scholar</span>
                      </a>

                      {/* Download PDF Button (flex-1) */}
                      {paper.pdfUrl ? (
                        <a
                          href={paper.pdfUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="flex-1 h-8 px-2 sm:px-3 rounded-full bg-[#7150E7] hover:bg-[#5e3cd4] text-white font-semibold text-xs shadow-xs inline-flex items-center justify-center gap-1.5 transition-all cursor-pointer truncate"
                        >
                          <Download className="w-3.5 h-3.5 shrink-0" />
                          <span className="truncate">Download PDF</span>
                        </a>
                      ) : (
                        <a
                          href={paper.googleScholarUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="flex-1 h-8 px-2 sm:px-3 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium text-xs inline-flex items-center justify-center gap-1.5 transition-all truncate"
                        >
                          <ExternalLink className="w-3.5 h-3.5 shrink-0" />
                          <span className="truncate">Find PDF</span>
                        </a>
                      )}
                    </div>
                  </div>
                </div>

              </div>
            );
          })}
        </div>
      ) : (
        <div className="bg-white border border-[#EAECF0] rounded-2xl overflow-hidden divide-y divide-[#F2F4F7] shadow-xs">
          {filteredPapers.map((paper) => {
            const isSaved = isPaperSaved(paper.id);
            return (
              <div
                key={paper.id}
                className="p-4 sm:p-5 hover:bg-slate-50/70 transition-colors flex flex-col md:flex-row md:items-center justify-between gap-4 group"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2 mb-1.5">
                    <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-[#EDE9FC] text-[#7150E7]">
                      {paper.venue} ({paper.year})
                    </span>
                    {paper.isOpenAccess && (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                        <span>Open Access</span>
                      </span>
                    )}
                    <span className="text-[11px] font-medium text-amber-700 bg-amber-50 px-2 py-0.5 rounded-md">
                      📊 {paper.citationCount.toLocaleString()} Citations
                    </span>
                  </div>

                  <h3 className="text-sm sm:text-base font-semibold text-slate-900 group-hover:text-[#7150E7] transition-colors leading-snug">
                    {paper.title}
                  </h3>

                  <div className="text-xs text-slate-500 mt-1 flex flex-wrap items-center gap-x-2 gap-y-1">
                    <span className="font-medium text-slate-400">Authors:</span>
                    {paper.authors.map((author, aIdx) => (
                      <span key={aIdx} className="text-slate-700">
                        {author.name}
                        {aIdx < paper.authors.length - 1 && <span className="text-slate-300 ml-1.5">•</span>}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  {paper.pdfUrl ? (
                    <a
                      href={paper.pdfUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="h-8 px-3 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs shadow-2xs inline-flex items-center gap-1.5 transition-all cursor-pointer"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>PDF</span>
                    </a>
                  ) : (
                    <a
                      href={paper.googleScholarUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="h-8 px-2.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium text-xs inline-flex items-center gap-1 transition-all"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                      <span>Find PDF</span>
                    </a>
                  )}

                  <button
                    onClick={() => handleOpenBot(paper)}
                    className="h-8 px-3 rounded-lg bg-[#EDE9FC] hover:bg-[#7150E7] text-[#7150E7] hover:text-white font-semibold text-xs inline-flex items-center gap-1.5 transition-all cursor-pointer border border-[#DDD7FA]"
                  >
                    <Bot className="w-3.5 h-3.5" />
                    <span>Ask AI Bot</span>
                  </button>

                  <button
                    onClick={() => toggleSavePaper(paper.id)}
                    className={`p-2 rounded-lg transition-all cursor-pointer ${
                      isSaved
                        ? 'bg-[#7150E7] text-white shadow-2xs'
                        : 'bg-slate-100 text-slate-400 hover:text-[#7150E7] hover:bg-[#EDE9FC]'
                    }`}
                    title={isSaved ? 'Remove from Saved' : 'Save Paper'}
                  >
                    {isSaved ? <BookmarkCheck className="w-4 h-4" /> : <Bookmark className="w-4 h-4" />}
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
