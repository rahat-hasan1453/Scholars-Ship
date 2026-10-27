// Which seed files hold faculty, and which faculty rows the seed removes. Kept apart from seed.ts so tests can import it.

/** CSRankings (professors.json) and OpenAlex researchers (professors-openalex.json) */
export const FACULTY_FILES = ['professors.json', 'professors-openalex.json'] as const;

/** Faculty rows in neither file; `keep` is the ids from both */
export const staleFacultyWhere = (keep: string[]) => ({ id: { notIn: keep } });
