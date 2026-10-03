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
  saveProfessorToOutreach: (prof: Professor, status?: OutreachStatus) => void;
  updateOutreachStatus: (recordId: string, status: OutreachStatus) => void;
  updateOutreachNotes: (recordId: string, notes: string) => void;
  removeOutreachRecord: (recordId: string) => void;
  addScholarship: (scholarship: Scholarship) => void;
  addProfessor: (professor: Professor) => void;
  selectedScholarship: Scholarship | null;
  setSelectedScholarship: (sch: Scholarship | null) => void;
  selectedProfessor: Professor | null;
  setSelectedProfessor: (prof: Professor | null) => void;
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
  PROFESSORS: 'highscholar_professors_v5',
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
  const [selectedProfessor, setSelectedProfessor] = useState<Professor | null>(null);
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
      let currentProfile = initialUserProfile;
      const savedProfile = localStorage.getItem(STORAGE_KEYS.PROFILE);
      if (savedProfile) {
        const parsed = JSON.parse(savedProfile);
        if (parsed.specializations && !parsed.specializations.includes('UX Design')) {
          setProfile(initialUserProfile);
          currentProfile = initialUserProfile;
        } else {
          setProfile(parsed);
          currentProfile = parsed;
        }
      }

      // Check URL parameters if redirected from Google OAuth callback or signup
      if (typeof window !== 'undefined') {
        const urlParams = new URLSearchParams(window.location.search);
        const authProvider = urlParams.get('auth_provider');
        const shouldTriggerOnboarding = urlParams.get('onboarding') === 'true';

        if (authProvider === 'google') {
          const rawName = urlParams.get('user_name');
          const rawEmail = urlParams.get('user_email');
          const rawAvatar = urlParams.get('user_avatar');

          const googleName = rawName ? decodeURIComponent(rawName) : undefined;
          const googleEmail = rawEmail ? decodeURIComponent(rawEmail) : undefined;
          const googleAvatar = rawAvatar ? decodeURIComponent(rawAvatar) : undefined;

          const targetEmail = googleEmail || currentProfile.email;
          const isUserOnboarded = localStorage.getItem(`highscholar_onboarded_${targetEmail}`) === 'true';

          const updatedProfile = {
            ...currentProfile,
            ...(googleName ? { name: googleName } : {}),
            ...(googleEmail ? { email: googleEmail } : {}),
            ...(googleAvatar ? { avatar: googleAvatar } : {}),
            onboardingCompleted: isUserOnboarded,
          };

          setProfile(updatedProfile);
          localStorage.setItem(STORAGE_KEYS.PROFILE, JSON.stringify(updatedProfile));

          // First time Google sign in or explicitly triggered -> open onboarding modal
          if (!isUserOnboarded || shouldTriggerOnboarding) {
            setIsOnboardingOpen(true);
          }

          // Clean URL without reloading page
          const cleanUrl = window.location.pathname;
          window.history.replaceState({}, document.title, cleanUrl);
        } else if (shouldTriggerOnboarding) {
          setIsOnboardingOpen(true);
          const cleanUrl = window.location.pathname;
          window.history.replaceState({}, document.title, cleanUrl);
        }

        // Also sync from backend session cookie
        fetch('/api/auth/me')
          .then((res) => (res.ok ? res.json() : null))
          .then((data) => {
            if (data?.authenticated && data?.user) {
              const uEmail = data.user.email;
              const isAlreadyOnboarded =
                data.user.onboardingCompleted === true ||
                localStorage.getItem(`highscholar_onboarded_${uEmail}`) === 'true';

              const profileData = data.user.profileData || {};

              setProfile((prev) => {
                const synced = {
                  ...prev,
                  name: data.user.name || prev.name,
                  email: data.user.email || prev.email,
                  avatar: data.user.avatar || prev.avatar,
                  degreeLevel: profileData.degreeLevel || prev.degreeLevel,
                  specializations: profileData.specializations || prev.specializations,
                  targetCountries: profileData.targetCountries || prev.targetCountries,
                  cgpa: profileData.cgpa || prev.cgpa,
                  testScores: profileData.testScores || prev.testScores,
                  onboardingCompleted: isAlreadyOnboarded,
                };
                localStorage.setItem(STORAGE_KEYS.PROFILE, JSON.stringify(synced));
                if (isAlreadyOnboarded) {
                  localStorage.setItem(`highscholar_onboarded_${uEmail}`, 'true');
                }
                return synced;
              });

              if (!isAlreadyOnboarded && uEmail && !uEmail.includes('alex.mercer')) {
                setIsOnboardingOpen(true);
              }
            }
          })
          .catch(() => {});
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

  const saveProfessorToOutreach = (prof: Professor, status: OutreachStatus = 'Prospect') => {
    setOutreachRecords((prev) => {
      if (prev.some((r) => r.professorId === prof.id)) return prev;
      return [
        {
          id: `outreach_${Date.now()}`,
          professorId: prof.id,
          professorName: prof.name,
          labName: prof.labName,
          institution: prof.university,
          status,
          notes: `Target: ${prof.labName ?? prof.department}`,
          coldEmailDraft: '',
          emailSubject: `Prospective student: ${prof.researchTags[0] || 'research'} in your lab`,
          updatedAt: new Date().toISOString(),
          country: prof.country,
          sourceUrl: prof.labWebsite,
        },
        ...prev,
      ];
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
        saveProfessorToOutreach,
        updateOutreachStatus,
        updateOutreachNotes,
        removeOutreachRecord,
        addScholarship,
        addProfessor,
        selectedScholarship,
        setSelectedScholarship,
        selectedProfessor,
        setSelectedProfessor,
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
