import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { normalizeSubjects } from '@/data/subjectCatalog';
import { UserProfile, Scholarship, Professor, Application, ApplicationStatus, DecisionResult, HiringOpportunity, OutreachRecord, OutreachStatus } from '@/types';
import { GUEST_PROFILE } from '@/lib/guestProfile';
import { apiFetch, ApiError, newId } from '@/lib/apiClient';
import { DEMO_RECORD_IDS, IMPORT_DONE_KEY, LEGACY_EXTRA_KEYS, LEGACY_STORAGE_KEYS } from '@/lib/legacyStorage';
import confetti from 'canvas-confetti';

export type BookmarkKind = 'opportunities' | 'professors' | 'papers';

interface AppContextType {
  profile: UserProfile;
  setProfile: React.Dispatch<React.SetStateAction<UserProfile>>;
  /** Changes the profile in memory only (sign-in flows copy server data in with this) */
  updateProfile: (updates: Partial<UserProfile>) => void;
  /** Changes the profile and saves it to the server; rolls back (and resolves false) when the save fails */
  saveProfile: (updates: Partial<UserProfile>) => Promise<boolean>;
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
  removeTaskFromApplication: (appId: string, taskId: string) => void;
  updateApplicationNotes: (appId: string, notes: string) => void;
  removeApplication: (appId: string) => void;
  saveOpportunityToOutreach: (opp: HiringOpportunity, status?: OutreachStatus) => void;
  saveProfessorToOutreach: (prof: Professor, status?: OutreachStatus) => void;
  updateOutreachStatus: (recordId: string, status: OutreachStatus) => void;
  updateOutreachNotes: (recordId: string, notes: string) => void;
  removeOutreachRecord: (recordId: string) => void;
  /** Pipeline drag & drop: put applications / outreach records in this order (unknown ids keep their place at the end) */
  reorderApplications: (orderedIds: string[]) => void;
  reorderOutreachRecords: (orderedIds: string[]) => void;
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
  /** True once the signed-in user's saved data has loaded from the server */
  isUserDataLoaded: boolean;
  /** Re-reads the signed-in user's data (after a sign-in without a page reload) */
  reloadUserData: () => Promise<void>;
  isSyncingOpportunities: boolean;
  lastSyncedAt: string | null;
  syncLiveOpportunities: (tag?: string) => Promise<{ count: number; newFound: number }>;
  importOpportunityManual: (data: any) => Promise<HiringOpportunity>;
  savedPaperIds: string[];
  toggleSavePaper: (paperId: string) => void;
  isPaperSaved: (paperId: string) => boolean;
  /** Opportunity Feed / Faculty bookmarks (read through useOpportunityBookmarks / useProfessorBookmarks) */
  savedOpportunityIds: string[];
  savedProfessorIds: string[];
  setBookmark: (kind: BookmarkKind, id: string, saved: boolean) => void;
  globalSearchQuery: string;
  setGlobalSearchQuery: (q: string) => void;
  activeNavTab: 'opportunities' | 'scholarships' | 'professors' | 'research' | 'tracker' | 'saved' | 'profile';
  setActiveNavTab: (tab: 'opportunities' | 'scholarships' | 'professors' | 'research' | 'tracker' | 'saved' | 'profile') => void;
}

function reorderById<T extends { id: string }>(list: T[], orderedIds: string[]): T[] {
  const rank = new Map(orderedIds.map((id, i) => [id, i]));
  const key = (item: T, i: number) => rank.get(item.id) ?? orderedIds.length + i;
  return list
    .map((item, i) => ({ item, k: key(item, i) }))
    .sort((a, b) => a.k - b.k)
    .map((x) => x.item);
}

const AppContext = createContext<AppContextType | undefined>(undefined);

// Browser-only settings. Pipeline, bookmarks and the profile live in the database (see /api/applications etc.).
const STORAGE_KEYS = {
  SCHOLARSHIPS: 'highscholar_scholarships_v5',
  PROFESSORS: 'highscholar_professors_v5',
  OPPORTUNITIES: 'highscholar_opportunities_v4',
  THEME: 'highscholar_theme_v2',
};

type Updater<T> = (prev: T) => T;
type ListKey = 'applications' | 'outreach' | 'opportunities' | 'professors' | 'papers';
type Bookmarks = { opportunities: string[]; professors: string[]; papers: string[] };

const now = () => new Date().toISOString();
const replaceById = <T extends { id: string }>(id: string, fn: (item: T) => T): Updater<T[]> => (prev) => prev.map((x) => (x.id === id ? fn(x) : x));
const setMembership = (id: string, saved: boolean): Updater<string[]> => (prev) =>
  saved ? (prev.includes(id) ? prev : [...prev, id]) : prev.filter((x) => x !== id);

function readLegacyList(key: string): unknown[] {
  try {
    const parsed: unknown = JSON.parse(localStorage.getItem(key) ?? '[]');
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

/** Old localStorage data worth importing (the old demo cards are left out here and on the server) */
function readLegacyData() {
  const notDemo = (x: unknown) => !(x && typeof x === 'object' && DEMO_RECORD_IDS.has(String((x as { id?: unknown }).id)));
  // Old cards carry the full scholarship object; the server only needs the id
  const applications = readLegacyList(LEGACY_STORAGE_KEYS.applications)
    .filter(notDemo)
    .map((a) => {
      if (!a || typeof a !== 'object') return a;
      const { scholarship: _s, updatedAt: _u, ...rest } = a as Record<string, unknown>;
      void _s;
      void _u;
      return rest;
    });
  return {
    applications,
    outreach: readLegacyList(LEGACY_STORAGE_KEYS.outreach).filter(notDemo),
    opportunities: readLegacyList(LEGACY_STORAGE_KEYS.opportunities),
    professors: readLegacyList(LEGACY_STORAGE_KEYS.professors),
    papers: readLegacyList(LEGACY_STORAGE_KEYS.papers),
  };
}

function clearLegacyData() {
  try {
    for (const key of [...Object.values(LEGACY_STORAGE_KEYS), ...LEGACY_EXTRA_KEYS]) localStorage.removeItem(key);
    localStorage.setItem(IMPORT_DONE_KEY, new Date().toISOString());
  } catch {}
}

const errorMessage = (err: unknown, fallback: string) =>
  err instanceof ApiError && err.status === 401
    ? 'Your session has expired. Please sign in again.'
    : err instanceof ApiError && err.status === 404
      ? 'This item can’t be saved yet.'
      : fallback;

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [profile, setProfile] = useState<UserProfile>(GUEST_PROFILE);
  const [scholarships, setScholarships] = useState<Scholarship[]>([]);
  const [professors, setProfessors] = useState<Professor[]>([]);
  // Signed-in users' Pipeline and bookmarks come from the server; everyone starts empty (no demo cards)
  const [applications, setApplications] = useState<Application[]>([]);
  const [opportunities, setOpportunities] = useState<HiringOpportunity[]>([]);
  const [outreachRecords, setOutreachRecords] = useState<OutreachRecord[]>([]);
  const [savedPaperIds, setSavedPaperIds] = useState<string[]>([]);
  const [savedOpportunityIds, setSavedOpportunityIds] = useState<string[]>([]);
  const [savedProfessorIds, setSavedProfessorIds] = useState<string[]>([]);
  const [isOnboardingOpen, setIsOnboardingOpen] = useState(false);
  const [selectedScholarship, setSelectedScholarship] = useState<Scholarship | null>(null);
  const [selectedProfessor, setSelectedProfessor] = useState<Professor | null>(null);
  const [selectedOpportunityForEmail, setSelectedOpportunityForEmail] = useState<HiringOpportunity | null>(null);
  const [isColdEmailModalOpen, setIsColdEmailModalOpen] = useState(false);
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');
  const [isMounted, setIsMounted] = useState(false);
  const [isUserDataLoaded, setIsUserDataLoaded] = useState(false);
  const [isSyncingOpportunities, setIsSyncingOpportunities] = useState(false);
  const [lastSyncedAt, setLastSyncedAt] = useState<string | null>(null);
  const [globalSearchQuery, setGlobalSearchQuery] = useState('');
  const [activeNavTab, setActiveNavTab] = useState<'opportunities' | 'scholarships' | 'professors' | 'research' | 'tracker' | 'saved' | 'profile'>('opportunities');
  const [syncError, setSyncError] = useState<string | null>(null);

  // ---------------------------------------------------------------------------
  // Server sync plumbing

  /** Latest state for building rollbacks inside event handlers */
  const latest = useRef({ applications, outreachRecords, profile, savedPaperIds, savedOpportunityIds, savedProfessorIds });
  useEffect(() => {
    latest.current = { applications, outreachRecords, profile, savedPaperIds, savedOpportunityIds, savedProfessorIds };
  }, [applications, outreachRecords, profile, savedPaperIds, savedOpportunityIds, savedProfessorIds]);

  const signedIn = useRef(false);
  /** While the first load is in flight, local changes are recorded and re-applied on top of the loaded data */
  const loading = useRef(false);
  const pending = useRef<Record<ListKey, Updater<unknown[]>[]>>({ applications: [], outreach: [], opportunities: [], professors: [], papers: [] });
  /** Requests for the same item run one after another, so a quick move + move arrive in order */
  const chains = useRef(new Map<string, Promise<unknown>>());
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const setters: Record<ListKey, (fn: Updater<unknown[]>) => void> = {
    applications: (fn) => setApplications(fn as unknown as Updater<Application[]>),
    outreach: (fn) => setOutreachRecords(fn as unknown as Updater<OutreachRecord[]>),
    opportunities: (fn) => setSavedOpportunityIds(fn as unknown as Updater<string[]>),
    professors: (fn) => setSavedProfessorIds(fn as unknown as Updater<string[]>),
    papers: (fn) => setSavedPaperIds(fn as unknown as Updater<string[]>),
  };

  const showError = useCallback((message: string) => {
    setSyncError(message);
    if (toastTimer.current) clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setSyncError(null), 4000);
  }, []);

  /** Optimistic local change. Every updater is idempotent, so re-applying it after the load is safe. */
  const local = <T,>(key: ListKey, fn: Updater<T[]>) => {
    setters[key](fn as unknown as Updater<unknown[]>);
    if (loading.current) pending.current[key].push(fn as unknown as Updater<unknown[]>);
  };

  /** Sends a change for signed-in users; on failure undoes it and shows a short message */
  const sync = (chainKey: string, request: () => Promise<unknown>, rollback: () => void, failMessage: string) => {
    if (!signedIn.current) return;
    const prev = chains.current.get(chainKey) ?? Promise.resolve();
    const next = prev
      .catch(() => {})
      .then(request)
      .catch((err) => {
        rollback();
        showError(errorMessage(err, failMessage));
      });
    chains.current.set(chainKey, next);
    void next.finally(() => {
      if (chains.current.get(chainKey) === next) chains.current.delete(chainKey);
    });
  };

  const applyLoaded = (data: { applications: Application[]; outreach: OutreachRecord[]; bookmarks: Bookmarks }) => {
    const replay = <T,>(key: ListKey, value: T[]) => pending.current[key].reduce<unknown[]>((acc, fn) => fn(acc), value) as T[];
    setApplications(replay('applications', data.applications));
    setOutreachRecords(replay('outreach', data.outreach));
    setSavedOpportunityIds(replay('opportunities', data.bookmarks.opportunities));
    setSavedProfessorIds(replay('professors', data.bookmarks.professors));
    setSavedPaperIds(replay('papers', data.bookmarks.papers));
  };

  const fetchUserData = useCallback(async () => {
    signedIn.current = true;
    loading.current = true;
    pending.current = { applications: [], outreach: [], opportunities: [], professors: [], papers: [] };
    try {
      const [p, a, o, b] = await Promise.all([
        apiFetch<{ profile: UserProfile }>('/api/profile'),
        apiFetch<{ data: Application[] }>('/api/applications'),
        apiFetch<{ data: OutreachRecord[] }>('/api/outreach'),
        apiFetch<{ data: Bookmarks }>('/api/bookmarks'),
      ]);
      setProfile((prev) => ({ ...prev, ...p.profile, specializations: normalizeSubjects(p.profile.specializations) }));
      let data = { applications: a.data, outreach: o.data, bookmarks: b.data };

      // One-time move of the old browser-only data into the account
      let alreadyImported = false;
      try {
        alreadyImported = !!localStorage.getItem(IMPORT_DONE_KEY);
      } catch {}
      if (!alreadyImported) {
        const serverEmpty =
          data.applications.length === 0 &&
          data.outreach.length === 0 &&
          data.bookmarks.opportunities.length + data.bookmarks.professors.length + data.bookmarks.papers.length === 0;
        const legacy = readLegacyData();
        const hasLegacy = Object.values(legacy).some((list) => list.length > 0);
        if (serverEmpty && hasLegacy) {
          try {
            const res = await apiFetch<{ data: typeof data }>('/api/import', 'POST', legacy);
            data = res.data;
            clearLegacyData();
          } catch (err) {
            // Kept for the next load; the board just shows what the server has
            console.error('[user-data] import failed', err);
          }
        } else {
          clearLegacyData();
        }
      }

      applyLoaded(data);
      setIsUserDataLoaded(true);
    } catch (err) {
      console.error('[user-data] load failed', err);
      showError('We couldn’t load your saved items. Please refresh the page.');
    } finally {
      loading.current = false;
      pending.current = { applications: [], outreach: [], opportunities: [], professors: [], papers: [] };
    }
  }, [showError]);

  /** One load at a time (React dev mounts effects twice; two loads would import the old data twice) */
  const inFlight = useRef<Promise<void> | null>(null);
  const loadUserData = useCallback(() => {
    inFlight.current ??= fetchUserData().finally(() => {
      inFlight.current = null;
    });
    return inFlight.current;
  }, [fetchUserData]);

  /** Scholarships and faculty from the database (no bundled fallback: an outage shows the empty state) */
  const loadCatalogue = useCallback(async () => {
    const get = async <T,>(url: string): Promise<T[] | null> => {
      try {
        const res = await fetch(url);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const body = (await res.json()) as { data?: T[] };
        return Array.isArray(body.data) ? body.data : null;
      } catch (err) {
        console.error(`[catalogue] ${url} failed`, err);
        return null;
      }
    };
    const [sch, prof] = await Promise.all([get<Scholarship>('/api/scholarships'), get<Professor>('/api/professors')]);
    if (sch) setScholarships(sch);
    if (prof) setProfessors(prof);
  }, []);

  // Mount: theme + catalogue caches from localStorage, then the session and the user's data from the server
  useEffect(() => {
    try {
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

          const targetEmail = googleEmail || '';
          const isUserOnboarded = localStorage.getItem(`highscholar_onboarded_${targetEmail}`) === 'true';

          setProfile((prev) => ({
            ...prev,
            ...(googleName ? { name: googleName } : {}),
            ...(googleEmail ? { email: googleEmail } : {}),
            ...(googleAvatar ? { avatar: googleAvatar } : {}),
            onboardingCompleted: isUserOnboarded,
          }));

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

        // Session from the backend cookie, then the user's own data (profile, Pipeline, bookmarks)
        fetch('/api/auth/me')
          .then((res) => (res.ok ? res.json() : null))
          .then((data) => {
            if (data?.authenticated && data?.user) {
              const uEmail = data.user.email;
              const isAlreadyOnboarded =
                data.user.onboardingCompleted === true ||
                localStorage.getItem(`highscholar_onboarded_${uEmail}`) === 'true';

              setProfile((prev) => ({
                ...prev,
                name: data.user.name || prev.name,
                email: data.user.email || prev.email,
                avatar: data.user.avatar || prev.avatar,
                onboardingCompleted: isAlreadyOnboarded,
              }));
              if (isAlreadyOnboarded) {
                localStorage.setItem(`highscholar_onboarded_${uEmail}`, 'true');
              }

              if (!isAlreadyOnboarded && uEmail) {
                setIsOnboardingOpen(true);
              }
              void loadUserData();
            }
          })
          .catch(() => {});
      }

      // Catalogue (scholarships, faculty) always comes from the database; old localStorage copies held demo data
      localStorage.removeItem(STORAGE_KEYS.SCHOLARSHIPS);
      localStorage.removeItem(STORAGE_KEYS.PROFESSORS);
      localStorage.removeItem(STORAGE_KEYS.OPPORTUNITIES);
      void loadCatalogue();

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
    } finally {
      setIsMounted(true);
    }
  }, [loadUserData, loadCatalogue]);

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

  // ---------------------------------------------------------------------------
  // Profile

  const updateProfile = (updates: Partial<UserProfile>) => {
    setProfile((prev) => ({ ...prev, ...updates }));
  };

  const saveProfile = async (updates: Partial<UserProfile>): Promise<boolean> => {
    const before = latest.current.profile;
    setProfile((prev) => ({ ...prev, ...updates }));
    if (!signedIn.current) return true;
    const body: Record<string, unknown> = {};
    for (const key of ['name', 'degreeLevel', 'specializations', 'targetCountries', 'cgpa', 'testScores', 'avatar', 'details'] as const) {
      if (updates[key] !== undefined) body[key] = updates[key];
    }
    if (Object.keys(body).length === 0) return true;
    try {
      const res = await apiFetch<{ profile: UserProfile }>('/api/profile', 'PATCH', body);
      setProfile((prev) => ({ ...prev, ...res.profile }));
      return true;
    } catch (err) {
      const restore = Object.fromEntries(Object.keys(updates).map((k) => [k, before[k as keyof UserProfile]]));
      setProfile((prev) => ({ ...prev, ...restore }));
      showError(err instanceof ApiError && err.status === 400 ? 'Some profile values are out of range. Please check and try again.' : errorMessage(err, 'We couldn’t save your profile. Please try again.'));
      return false;
    }
  };

  // ---------------------------------------------------------------------------
  // Pipeline: scholarship applications

  /** Rollback helper: put a card back exactly as it was (or drop it if it didn't exist) */
  const restoreApplication = (id: string) => {
    const snapshot = latest.current.applications.find((a) => a.id === id);
    const index = latest.current.applications.findIndex((a) => a.id === id);
    return () =>
      setApplications((prev) => {
        if (!snapshot) return prev.filter((a) => a.id !== id);
        if (prev.some((a) => a.id === id)) return prev.map((a) => (a.id === id ? snapshot : a));
        const next = [...prev];
        next.splice(Math.min(index, next.length), 0, snapshot);
        return next;
      });
  };

  const saveScholarshipToTracker = (scholarship: Scholarship, initialStatus: ApplicationStatus = 'Wishlist') => {
    if (latest.current.applications.some((a) => a.scholarshipId === scholarship.id)) return;

    const newApp: Application = {
      id: newId(),
      scholarshipId: scholarship.id,
      scholarship,
      status: initialStatus,
      decision: 'Pending',
      notes: `Targeting deadline: ${new Date(scholarship.deadline).toLocaleDateString()}`,
      deadline: scholarship.deadline,
      updatedAt: now(),
      tasks: [
        { id: newId(), title: 'Review eligibility & prerequisites', isCompleted: true },
        { id: newId(), title: 'Draft Statement of Purpose / Essay', isCompleted: false },
        { id: newId(), title: 'Request Academic Letters of Recommendation', isCompleted: false },
        { id: newId(), title: 'Prepare Transcripts & Test Scores', isCompleted: false },
      ],
    };
    const rollback = restoreApplication(newApp.id);
    local<Application>('applications', (prev) => (prev.some((a) => a.scholarshipId === scholarship.id) ? prev : [newApp, ...prev]));
    sync(
      `app:${newApp.id}`,
      async () => {
        const res = await apiFetch<{ data: Application }>('/api/applications', 'POST', {
          id: newApp.id,
          scholarshipId: scholarship.id,
          status: newApp.status,
          notes: newApp.notes,
          deadline: newApp.deadline,
          tasks: newApp.tasks.map((t) => ({ id: t.id, title: t.title, isCompleted: t.isCompleted })),
        });
        // Already tracked on another device: show the server's card instead of the new one
        if (res.data.id !== newApp.id) setApplications((prev) => prev.map((a) => (a.id === newApp.id ? res.data : a)));
      },
      rollback,
      'We couldn’t save this scholarship. Please try again.',
    );
  };

  const patchApplication = (appId: string, fn: (app: Application) => Application, body: Record<string, unknown>, failMessage: string) => {
    const rollback = restoreApplication(appId);
    local<Application>('applications', replaceById<Application>(appId, fn));
    sync(`app:${appId}`, () => apiFetch(`/api/applications/${encodeURIComponent(appId)}`, 'PATCH', body), rollback, failMessage);
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
    const updatedAt = now();
    patchApplication(
      appId,
      (app) => ({ ...app, status, decision: decision || app.decision, updatedAt }),
      { status, ...(decision ? { decision } : {}) },
      'We couldn’t move this card. Please try again.',
    );
  };

  const toggleTaskCompletion = (appId: string, taskId: string) => {
    const task = latest.current.applications.find((a) => a.id === appId)?.tasks.find((t) => t.id === taskId);
    if (!task) return;
    const isCompleted = !task.isCompleted;
    const updatedAt = now();
    const rollback = restoreApplication(appId);
    local<Application>(
      'applications',
      replaceById<Application>(appId, (app) => ({ ...app, tasks: app.tasks.map((t) => (t.id === taskId ? { ...t, isCompleted } : t)), updatedAt })),
    );
    sync(
      `app:${appId}`,
      () => apiFetch(`/api/applications/${encodeURIComponent(appId)}/tasks/${encodeURIComponent(taskId)}`, 'PATCH', { isCompleted }),
      rollback,
      'We couldn’t update this task. Please try again.',
    );
  };

  const addTaskToApplication = (appId: string, title: string) => {
    if (!title.trim()) return;
    const task = { id: newId(), title: title.trim(), isCompleted: false };
    const updatedAt = now();
    const rollback = restoreApplication(appId);
    local<Application>(
      'applications',
      replaceById<Application>(appId, (app) => (app.tasks.some((t) => t.id === task.id) ? app : { ...app, tasks: [...app.tasks, task], updatedAt })),
    );
    sync(`app:${appId}`, () => apiFetch(`/api/applications/${encodeURIComponent(appId)}/tasks`, 'POST', task), rollback, 'We couldn’t add this task. Please try again.');
  };

  const removeTaskFromApplication = (appId: string, taskId: string) => {
    const updatedAt = now();
    const rollback = restoreApplication(appId);
    local<Application>('applications', replaceById<Application>(appId, (app) => ({ ...app, tasks: app.tasks.filter((t) => t.id !== taskId), updatedAt })));
    sync(
      `app:${appId}`,
      () => apiFetch(`/api/applications/${encodeURIComponent(appId)}/tasks/${encodeURIComponent(taskId)}`, 'DELETE'),
      rollback,
      'We couldn’t remove this task. Please try again.',
    );
  };

  const updateApplicationNotes = (appId: string, notes: string) => {
    const updatedAt = now();
    patchApplication(appId, (app) => ({ ...app, notes, updatedAt }), { notes }, 'We couldn’t save your notes. Please try again.');
  };

  const removeApplication = (appId: string) => {
    const rollback = restoreApplication(appId);
    local<Application>('applications', (prev) => prev.filter((a) => a.id !== appId));
    sync(`app:${appId}`, () => apiFetch(`/api/applications/${encodeURIComponent(appId)}`, 'DELETE'), rollback, 'We couldn’t remove this card. Please try again.');
  };

  const reorderApplications = (orderedIds: string[]) => {
    const before = latest.current.applications.map((a) => a.id);
    const after = reorderById(latest.current.applications, orderedIds).map((a) => a.id);
    local<Application>('applications', (prev) => reorderById(prev, orderedIds));
    sync('order:applications', () => apiFetch('/api/applications/order', 'PUT', { ids: after }), () => setApplications((prev) => reorderById(prev, before)), 'We couldn’t save the new order. Please try again.');
  };

  // ---------------------------------------------------------------------------
  // Pipeline: professor outreach

  const restoreOutreach = (id: string) => {
    const snapshot = latest.current.outreachRecords.find((r) => r.id === id);
    const index = latest.current.outreachRecords.findIndex((r) => r.id === id);
    return () =>
      setOutreachRecords((prev) => {
        if (!snapshot) return prev.filter((r) => r.id !== id);
        if (prev.some((r) => r.id === id)) return prev.map((r) => (r.id === id ? snapshot : r));
        const next = [...prev];
        next.splice(Math.min(index, next.length), 0, snapshot);
        return next;
      });
  };

  const createOutreach = (record: OutreachRecord, isDuplicate: (r: OutreachRecord) => boolean) => {
    if (latest.current.outreachRecords.some(isDuplicate)) return false;
    const rollback = restoreOutreach(record.id);
    local<OutreachRecord>('outreach', (prev) => (prev.some(isDuplicate) ? prev : [record, ...prev]));
    sync(
      `outreach:${record.id}`,
      async () => {
        const res = await apiFetch<{ data: OutreachRecord }>('/api/outreach', 'POST', {
          id: record.id,
          ...(record.professorId ? { professorId: record.professorId } : {}),
          ...(record.opportunityId ? { opportunityId: record.opportunityId } : {}),
          professorName: record.professorName,
          ...(record.labName ? { labName: record.labName } : {}),
          institution: record.institution,
          ...(record.country ? { country: record.country } : {}),
          ...(record.sourceUrl ? { sourceUrl: record.sourceUrl } : {}),
          status: record.status,
          notes: record.notes,
          ...(record.emailSubject ? { emailSubject: record.emailSubject } : {}),
        });
        if (res.data.id !== record.id) setOutreachRecords((prev) => prev.map((r) => (r.id === record.id ? res.data : r)));
      },
      rollback,
      'We couldn’t add this to Professor Outreach. Please try again.',
    );
    return true;
  };

  const openColdEmailModal = (opp: HiringOpportunity) => {
    setSelectedOpportunityForEmail(opp);
    setIsColdEmailModalOpen(true);
  };

  const saveOpportunityToOutreach = (opp: HiringOpportunity, status: OutreachStatus = 'Prospect') => {
    createOutreach(
      {
        id: newId(),
        opportunityId: opp.id,
        professorName: opp.authorName,
        labName: opp.labName,
        institution: opp.institution,
        status,
        notes: `Target: ${opp.title}`,
        coldEmailDraft: '',
        emailSubject: `Inquiry: Research Assistantship in ${opp.fieldTags[0] || 'HCI'}`,
        updatedAt: now(),
        country: opp.country,
        sourceUrl: opp.sourceUrl,
      },
      (r) => r.opportunityId === opp.id,
    );
    confetti({
      particleCount: 35,
      spread: 60,
      origin: { y: 0.8 },
      colors: ['#5e6ad2', '#27a672', '#4ea8de'],
    });
  };

  const saveProfessorToOutreach = (prof: Professor, status: OutreachStatus = 'Prospect') => {
    createOutreach(
      {
        id: newId(),
        professorId: prof.id,
        professorName: prof.name,
        labName: prof.labName,
        institution: prof.university,
        status,
        notes: `Target: ${prof.labName ?? prof.department}`,
        coldEmailDraft: '',
        emailSubject: `Prospective student: ${prof.researchTags[0] || 'research'} in your lab`,
        updatedAt: now(),
        country: prof.country,
        sourceUrl: prof.labWebsite,
      },
      (r) => r.professorId === prof.id,
    );
  };

  const patchOutreach = (recordId: string, fn: (r: OutreachRecord) => OutreachRecord, body: Record<string, unknown>, failMessage: string) => {
    const rollback = restoreOutreach(recordId);
    local<OutreachRecord>('outreach', replaceById<OutreachRecord>(recordId, fn));
    sync(`outreach:${recordId}`, () => apiFetch(`/api/outreach/${encodeURIComponent(recordId)}`, 'PATCH', body), rollback, failMessage);
  };

  const updateOutreachStatus = (recordId: string, status: OutreachStatus) => {
    const updatedAt = now();
    patchOutreach(recordId, (r) => ({ ...r, status, updatedAt }), { status }, 'We couldn’t move this card. Please try again.');
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
    const updatedAt = now();
    patchOutreach(recordId, (r) => ({ ...r, notes, updatedAt }), { notes }, 'We couldn’t save your notes. Please try again.');
  };

  const removeOutreachRecord = (recordId: string) => {
    const rollback = restoreOutreach(recordId);
    local<OutreachRecord>('outreach', (prev) => prev.filter((r) => r.id !== recordId));
    sync(`outreach:${recordId}`, () => apiFetch(`/api/outreach/${encodeURIComponent(recordId)}`, 'DELETE'), rollback, 'We couldn’t remove this card. Please try again.');
  };

  const reorderOutreachRecords = (orderedIds: string[]) => {
    const before = latest.current.outreachRecords.map((r) => r.id);
    const after = reorderById(latest.current.outreachRecords, orderedIds).map((r) => r.id);
    local<OutreachRecord>('outreach', (prev) => reorderById(prev, orderedIds));
    sync('order:outreach', () => apiFetch('/api/outreach/order', 'PUT', { ids: after }), () => setOutreachRecords((prev) => reorderById(prev, before)), 'We couldn’t save the new order. Please try again.');
  };

  // ---------------------------------------------------------------------------
  // Bookmarks (opportunities, professors, papers; scholarships are saved by tracking them)

  const setBookmark = (kind: BookmarkKind, id: string, saved: boolean) => {
    local<string>(kind, setMembership(id, saved));
    sync(
      `bookmark:${kind}:${id}`,
      () => apiFetch(`/api/bookmarks/${kind}/${encodeURIComponent(id)}`, saved ? 'PUT' : 'DELETE'),
      () => setters[kind](setMembership(id, !saved) as unknown as Updater<unknown[]>),
      saved ? 'We couldn’t save this item. Please try again.' : 'We couldn’t remove this bookmark. Please try again.',
    );
  };

  const toggleSavePaper = (paperId: string) => setBookmark('papers', paperId, !latest.current.savedPaperIds.includes(paperId));

  const isPaperSaved = (paperId: string) => savedPaperIds.includes(paperId);

  // ---------------------------------------------------------------------------
  // Catalogue (not user data)

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

  return (
    <AppContext.Provider
      value={{
        profile,
        setProfile,
        updateProfile,
        saveProfile,
        scholarships,
        professors,
        applications,
        opportunities,
        outreachRecords,
        savedPaperIds,
        toggleSavePaper,
        isPaperSaved,
        savedOpportunityIds,
        savedProfessorIds,
        setBookmark,
        isOnboardingOpen,
        setIsOnboardingOpen,
        saveScholarshipToTracker,
        updateApplicationStatus,
        toggleTaskCompletion,
        addTaskToApplication,
        removeTaskFromApplication,
        updateApplicationNotes,
        removeApplication,
        saveOpportunityToOutreach,
        saveProfessorToOutreach,
        updateOutreachStatus,
        updateOutreachNotes,
        removeOutreachRecord,
        reorderApplications,
        reorderOutreachRecords,
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
        isUserDataLoaded,
        reloadUserData: loadUserData,
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
      {syncError && (
        <div
          role="status"
          aria-live="polite"
          data-testid="sync-error"
          className="fixed bottom-6 left-1/2 z-[1000] max-w-[calc(100vw-32px)] -translate-x-1/2 rounded-[10px] bg-[#101828] px-4 py-3 text-[14px] leading-5 font-medium text-white shadow-lg"
        >
          {syncError}
        </div>
      )}
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
