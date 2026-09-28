import React, { createContext, useContext, useState, useEffect } from 'react';
import { UserProfile, Scholarship, Professor, Application, ApplicationStatus, DecisionResult, HiringOpportunity, OutreachRecord, OutreachStatus } from '@/types';
import { initialUserProfile, mockScholarships, mockProfessors, initialApplications } from '@/data/mockData';
import { mockOpportunities, initialOutreachRecords } from '@/data/mockOpportunities';
import confetti from 'canvas-confetti';

interface AppContextType {
  profile: UserProfile;
  setProfile: React.Dispatch<React.SetStateAction<UserProfile>>;
  updateProfile: (updates: Partial<UserProfile>) => void;
  scholarships: Scholarship[];
  professors: Professor[];
  applications: Application[];
  opportunities: HiringOpportunity[];
  outreachRecords: OutreachRecord[];
  isOnboardingOpen: boolean;
  setIsOnboardingOpen: (open: boolean) => void;
  saveScholarshipToTracker: (scholarship: Scholarship, initialStatus?: ApplicationStatus) => void;
  updateApplicationStatus: (appId: string, status: ApplicationStatus, decision?: DecisionResult) => void;
  toggleTaskCompletion: (appId: string, taskId: string) => void;
  addTaskToApplication: (appId: string, title: string) => void;
  updateApplicationNotes: (appId: string, notes: string) => void;
  removeApplication: (appId: string) => void;
  saveOpportunityToOutreach: (opp: HiringOpportunity, status?: OutreachStatus) => void;
  updateOutreachStatus: (recordId: string, status: OutreachStatus) => void;
  updateOutreachNotes: (recordId: string, notes: string) => void;
  removeOutreachRecord: (recordId: string) => void;
  addScholarship: (scholarship: Scholarship) => void;
  addProfessor: (professor: Professor) => void;
  selectedScholarship: Scholarship | null;
  setSelectedScholarship: (sch: Scholarship | null) => void;
  selectedOpportunityForEmail: HiringOpportunity | null;
  setSelectedOpportunityForEmail: (opp: HiringOpportunity | null) => void;
  isColdEmailModalOpen: boolean;
  setIsColdEmailModalOpen: (open: boolean) => void;
  openColdEmailModal: (opp: HiringOpportunity) => void;
  theme: 'dark' | 'light';
  toggleTheme: () => void;
  setTheme: (t: 'dark' | 'light') => void;
  isMounted: boolean;
  isSyncingOpportunities: boolean;
  lastSyncedAt: string | null;
  syncLiveOpportunities: (tag?: string) => Promise<{ count: number; newFound: number }>;
  importOpportunityManual: (data: any) => Promise<HiringOpportunity>;
  savedPaperIds: string[];
  toggleSavePaper: (paperId: string) => void;
  isPaperSaved: (paperId: string) => boolean;
  globalSearchQuery: string;
  setGlobalSearchQuery: (q: string) => void;
  activeNavTab: 'opportunities' | 'scholarships' | 'professors' | 'research' | 'tracker' | 'profile';
  setActiveNavTab: (tab: 'opportunities' | 'scholarships' | 'professors' | 'research' | 'tracker' | 'profile') => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

const STORAGE_KEYS = {
  PROFILE: 'highscholar_profile_v2',
  SCHOLARSHIPS: 'highscholar_scholarships_v5',
  PROFESSORS: 'highscholar_professors_v4',
  APPLICATIONS: 'highscholar_applications_v2',
  OUTREACH: 'highscholar_outreach_v2',
  OPPORTUNITIES: 'highscholar_opportunities_v4',
  THEME: 'highscholar_theme_v2',
  RESEARCH_PAPERS: 'highscholar_saved_papers_v1',
};

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [profile, setProfile] = useState<UserProfile>(initialUserProfile);
  const [scholarships, setScholarships] = useState<Scholarship[]>(mockScholarships);
  const [professors, setProfessors] = useState<Professor[]>(mockProfessors);
  const [applications, setApplications] = useState<Application[]>(initialApplications);
  const [opportunities, setOpportunities] = useState<HiringOpportunity[]>(mockOpportunities);
  const [outreachRecords, setOutreachRecords] = useState<OutreachRecord[]>(initialOutreachRecords);
  const [savedPaperIds, setSavedPaperIds] = useState<string[]>([]);
  const [isOnboardingOpen, setIsOnboardingOpen] = useState(false);
  const [selectedScholarship, setSelectedScholarship] = useState<Scholarship | null>(null);
  const [selectedOpportunityForEmail, setSelectedOpportunityForEmail] = useState<HiringOpportunity | null>(null);
  const [isColdEmailModalOpen, setIsColdEmailModalOpen] = useState(false);
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');
  const [isMounted, setIsMounted] = useState(false);
  const [isSyncingOpportunities, setIsSyncingOpportunities] = useState(false);
  const [lastSyncedAt, setLastSyncedAt] = useState<string | null>(null);
  const [globalSearchQuery, setGlobalSearchQuery] = useState('');
  const [activeNavTab, setActiveNavTab] = useState<'opportunities' | 'scholarships' | 'professors' | 'research' | 'tracker' | 'profile'>('opportunities');

  // Hydrate from localStorage on client mount with automatic schema migration
  useEffect(() => {
    try {
      const savedProfile = localStorage.getItem(STORAGE_KEYS.PROFILE);
      if (savedProfile) {
        const parsed = JSON.parse(savedProfile);
        if (parsed.specializations && !parsed.specializations.includes('UX Design')) {
          setProfile(initialUserProfile);
        } else {
          setProfile(parsed);
        }
      }

      const savedScholarships = localStorage.getItem(STORAGE_KEYS.SCHOLARSHIPS);
      if (savedScholarships) {
        const parsed = JSON.parse(savedScholarships);
        if (!Array.isArray(parsed) || parsed.length < 15 || !parsed.some((s: any) => s.id === 'sch_chevening_uk_01')) {
          setScholarships(mockScholarships);
        } else {
          setScholarships(parsed);
        }
      } else {
        setScholarships(mockScholarships);
      }

      const savedProfessors = localStorage.getItem(STORAGE_KEYS.PROFESSORS);
      if (savedProfessors) {
        const parsed = JSON.parse(savedProfessors);
        if (!Array.isArray(parsed) || parsed.length < 20 || !parsed.some((p: any) => p.id === 'prof_rosalind_picard_13')) {
          setProfessors(mockProfessors);
        } else {
          setProfessors(parsed);
        }
      } else {
        setProfessors(mockProfessors);
      }

      const savedApplications = localStorage.getItem(STORAGE_KEYS.APPLICATIONS);
      if (savedApplications) {
        const parsed = JSON.parse(savedApplications);
        if (!Array.isArray(parsed) || parsed.length === 0 || !parsed.some((a: any) => a.id === 'app_01')) {
          setApplications(initialApplications);
        } else {
          setApplications(parsed);
        }
      } else {
        setApplications(initialApplications);
      }

      const savedOutreach = localStorage.getItem(STORAGE_KEYS.OUTREACH);
      if (savedOutreach) {
        const parsed = JSON.parse(savedOutreach);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setOutreachRecords(parsed);
        } else {
          setOutreachRecords(initialOutreachRecords);
        }
      } else {
        setOutreachRecords(initialOutreachRecords);
      }

      const savedOpportunities = localStorage.getItem(STORAGE_KEYS.OPPORTUNITIES);
      if (savedOpportunities) {
        const parsed = JSON.parse(savedOpportunities);
        if (Array.isArray(parsed) && parsed.length >= 25 && parsed.some((o: any) => o.id === 'opp_mit_affective_13')) {
          setOpportunities(parsed);
        } else {
          setOpportunities(mockOpportunities);
        }
      } else {
        setOpportunities(mockOpportunities);
      }

      const savedTheme = localStorage.getItem(STORAGE_KEYS.THEME) as 'dark' | 'light' | null;
      if (savedTheme === 'light' || savedTheme === 'dark') {
        setTheme(savedTheme);
        document.documentElement.setAttribute('data-theme', savedTheme);
        document.documentElement.className = savedTheme;
      } else {
        document.documentElement.setAttribute('data-theme', 'dark');
        document.documentElement.className = 'dark';
      }
    } catch (e) {
      console.error('Failed reading from localStorage, loading defaults', e);
      setScholarships(mockScholarships);
      setProfessors(mockProfessors);
      setApplications(initialApplications);
      setOutreachRecords(initialOutreachRecords);
    } finally {
      setIsMounted(true);
    }
  }, []);

  const toggleTheme = () => {
    setTheme((prev) => {
      const next = prev === 'dark' ? 'light' : 'dark';
      try {
        localStorage.setItem(STORAGE_KEYS.THEME, next);
        document.documentElement.setAttribute('data-theme', next);
        document.documentElement.className = next;
      } catch (e) {
        console.error(e);
      }
      return next;
    });
  };

  // Save changes
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.PROFILE, JSON.stringify(profile));
    } catch (e) {
      console.error(e);
    }
  }, [profile]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.APPLICATIONS, JSON.stringify(applications));
    } catch (e) {
      console.error(e);
    }
  }, [applications]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.SCHOLARSHIPS, JSON.stringify(scholarships));
    } catch (e) {
      console.error(e);
    }
  }, [scholarships]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.PROFESSORS, JSON.stringify(professors));
    } catch (e) {
      console.error(e);
    }
  }, [professors]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.OUTREACH, JSON.stringify(outreachRecords));
    } catch (e) {
      console.error(e);
    }
  }, [outreachRecords]);

  const updateProfile = (updates: Partial<UserProfile>) => {
    setProfile((prev) => ({ ...prev, ...updates }));
  };

  const saveScholarshipToTracker = (scholarship: Scholarship, initialStatus: ApplicationStatus = 'Wishlist') => {
    // Check if already in applications
    const exists = applications.find((a) => a.scholarshipId === scholarship.id);
    if (exists) {
      return;
    }

    const newApp: Application = {
      id: `app_${Date.now()}`,
      scholarshipId: scholarship.id,
      scholarship,
      status: initialStatus,
      decision: 'Pending',
      notes: `Targeting deadline: ${new Date(scholarship.deadline).toLocaleDateString()}`,
      deadline: scholarship.deadline,
      updatedAt: new Date().toISOString(),
      tasks: [
        { id: `t_${Date.now()}_1`, title: 'Review eligibility & prerequisites', isCompleted: true },
        { id: `t_${Date.now()}_2`, title: 'Draft Statement of Purpose / Essay', isCompleted: false },
        { id: `t_${Date.now()}_3`, title: 'Request Academic Letters of Recommendation', isCompleted: false },
        { id: `t_${Date.now()}_4`, title: 'Prepare Transcripts & Test Scores', isCompleted: false },
      ],
    };

    setApplications((prev) => [newApp, ...prev]);
  };

  const updateApplicationStatus = (appId: string, status: ApplicationStatus, decision?: DecisionResult) => {
    if (status === 'Decided' && decision === 'Accepted') {
      // Fire celebration confetti!
      try {
        confetti({
          particleCount: 120,
          spread: 80,
          origin: { y: 0.6 },
          colors: ['#059669', '#10B981', '#1e3a8a', '#d97706'],
        });
      } catch (err) {
        console.error(err);
      }
    }

    setApplications((prev) =>
      prev.map((app) => {
        if (app.id === appId) {
          return {
            ...app,
            status,
            decision: decision || app.decision,
            updatedAt: new Date().toISOString(),
          };
        }
        return app;
      })
    );
  };

  const toggleTaskCompletion = (appId: string, taskId: string) => {
    setApplications((prev) =>
      prev.map((app) => {
        if (app.id === appId) {
          return {
            ...app,
            tasks: app.tasks.map((t) => (t.id === taskId ? { ...t, isCompleted: !t.isCompleted } : t)),
            updatedAt: new Date().toISOString(),
          };
        }
        return app;
      })
    );
  };

  const addTaskToApplication = (appId: string, title: string) => {
    if (!title.trim()) return;
    setApplications((prev) =>
      prev.map((app) => {
        if (app.id === appId) {
          return {
            ...app,
            tasks: [...app.tasks, { id: `task_${Date.now()}`, title: title.trim(), isCompleted: false }],
            updatedAt: new Date().toISOString(),
          };
        }
        return app;
      })
    );
  };

  const updateApplicationNotes = (appId: string, notes: string) => {
    setApplications((prev) =>
      prev.map((app) => {
        if (app.id === appId) {
          return { ...app, notes, updatedAt: new Date().toISOString() };
        }
        return app;
      })
    );
  };

  const removeApplication = (appId: string) => {
    setApplications((prev) => prev.filter((a) => a.id !== appId));
  };

  const openColdEmailModal = (opp: HiringOpportunity) => {
    setSelectedOpportunityForEmail(opp);
    setIsColdEmailModalOpen(true);
  };

  const saveOpportunityToOutreach = (opp: HiringOpportunity, status: OutreachStatus = 'Prospect') => {
    setOutreachRecords((prev) => {
      const exists = prev.find((r) => r.opportunityId === opp.id);
      if (exists) return prev;
      return [
        {
          id: `outreach_${Date.now()}`,
          opportunityId: opp.id,
          professorName: opp.authorName,
          labName: opp.labName,
          institution: opp.institution,
          status,
          notes: `Target: ${opp.title}`,
          coldEmailDraft: '',
          emailSubject: `Inquiry: Research Assistantship in ${opp.fieldTags[0] || 'HCI'}`,
          updatedAt: new Date().toISOString(),
          country: opp.country,
          sourceUrl: opp.sourceUrl,
        },
        ...prev,
      ];
    });
    confetti({
      particleCount: 35,
      spread: 60,
      origin: { y: 0.8 },
      colors: ['#5e6ad2', '#27a672', '#4ea8de'],
    });
  };

  const updateOutreachStatus = (recordId: string, status: OutreachStatus) => {
    setOutreachRecords((prev) =>
      prev.map((r) => (r.id === recordId ? { ...r, status, updatedAt: new Date().toISOString() } : r))
    );
    if (status === 'Funded Offer' || status === 'Interview') {
      confetti({
        particleCount: 65,
        spread: 80,
        origin: { y: 0.6 },
        colors: ['#27a672', '#5e6ad2', '#f2994a'],
      });
    }
  };

  const updateOutreachNotes = (recordId: string, notes: string) => {
    setOutreachRecords((prev) =>
      prev.map((r) => (r.id === recordId ? { ...r, notes, updatedAt: new Date().toISOString() } : r))
    );
  };

  const removeOutreachRecord = (recordId: string) => {
    setOutreachRecords((prev) => prev.filter((r) => r.id !== recordId));
  };

  const addScholarship = (newSch: Scholarship) => {
    setScholarships((prev) => [newSch, ...prev]);
  };

  const addProfessor = (newProf: Professor) => {
    setProfessors((prev) => [newProf, ...prev]);
  };

  const syncLiveOpportunities = async (tag?: string) => {
    setIsSyncingOpportunities(true);
    try {
      const url = tag ? `/api/opportunities/live?tag=${encodeURIComponent(tag)}&limit=50` : `/api/opportunities/live?limit=50`;
      const res = await fetch(url);
      const json = await res.json();
      if (json.success && Array.isArray(json.data)) {
        let newFound = 0;
        setOpportunities((prev) => {
          const existingIds = new Set(prev.map((o) => o.id));
          const newItems = json.data.filter((item: HiringOpportunity) => !existingIds.has(item.id));
          newFound = newItems.length;
          const merged = [...newItems, ...prev];
          localStorage.setItem(STORAGE_KEYS.OPPORTUNITIES, JSON.stringify(merged));
          return merged;
        });
        setLastSyncedAt(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
        if (newFound > 0) {
          confetti({
            particleCount: 45,
            spread: 60,
            origin: { y: 0.8 },
          });
        }
        return { count: json.count || json.data.length, newFound };
      }
      return { count: 0, newFound: 0 };
    } catch (err) {
      console.error('Error syncing live opportunities:', err);
      return { count: 0, newFound: 0 };
    } finally {
      setIsSyncingOpportunities(false);
    }
  };

  const importOpportunityManual = async (payload: any) => {
    const res = await fetch('/api/opportunities/live', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    const json = await res.json();
    if (json.success && json.data) {
      setOpportunities((prev) => {
        const updated = [json.data, ...prev.filter((o) => o.id !== json.data.id)];
        localStorage.setItem(STORAGE_KEYS.OPPORTUNITIES, JSON.stringify(updated));
        return updated;
      });
      confetti({
        particleCount: 50,
        spread: 70,
        origin: { y: 0.7 },
      });
      return json.data;
    }
    throw new Error(json.error || 'Failed to import opportunity');
  };

  const toggleSavePaper = (paperId: string) => {
    setSavedPaperIds((prev) => {
      const next = prev.includes(paperId) ? prev.filter((id) => id !== paperId) : [...prev, paperId];
      try {
        localStorage.setItem(STORAGE_KEYS.RESEARCH_PAPERS, JSON.stringify(next));
      } catch (e) {
        console.error(e);
      }
      return next;
    });
  };

  const isPaperSaved = (paperId: string) => savedPaperIds.includes(paperId);

  return (
    <AppContext.Provider
      value={{
        profile,
        setProfile,
        updateProfile,
        scholarships,
        professors,
        applications,
        opportunities,
        outreachRecords,
        savedPaperIds,
        toggleSavePaper,
        isPaperSaved,
        isOnboardingOpen,
        setIsOnboardingOpen,
        saveScholarshipToTracker,
        updateApplicationStatus,
        toggleTaskCompletion,
        addTaskToApplication,
        updateApplicationNotes,
        removeApplication,
        saveOpportunityToOutreach,
        updateOutreachStatus,
        updateOutreachNotes,
        removeOutreachRecord,
        addScholarship,
        addProfessor,
        selectedScholarship,
        setSelectedScholarship,
        selectedOpportunityForEmail,
        setSelectedOpportunityForEmail,
        isColdEmailModalOpen,
        setIsColdEmailModalOpen,
        openColdEmailModal,
        theme,
        toggleTheme,
        setTheme,
        isMounted,
        isSyncingOpportunities,
        lastSyncedAt,
        syncLiveOpportunities,
        importOpportunityManual,
        globalSearchQuery,
        setGlobalSearchQuery,
        activeNavTab,
        setActiveNavTab,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
