// Keys of the old browser-only storage (before user data moved to the database). Used by the one-time import.
// No dependencies, so the browser bundle can import it cheaply.

/** The demo cards every browser used to start with (now tests/fixtures/mockData.ts and tests/fixtures/mockOpportunities.ts) */
export const DEMO_RECORD_IDS = new Set(['app_01', 'app_02', 'app_03', 'app_04', 'outreach_01', 'outreach_02']);

/** localStorage keys of the old client-only storage; cleared after the import */
export const LEGACY_STORAGE_KEYS = {
  applications: 'highscholar_applications_v2',
  outreach: 'highscholar_outreach_v2',
  opportunities: 'highscholar_bookmarked_programs',
  professors: 'highscholar_bookmarked_professors',
  papers: 'highscholar_saved_papers_v1',
} as const;
/** The old profile copy (the profile now loads from the server); removed together with the keys above */
export const LEGACY_EXTRA_KEYS = ['highscholar_profile_v2'];
export const IMPORT_DONE_KEY = 'highscholar_db_import_v1';
