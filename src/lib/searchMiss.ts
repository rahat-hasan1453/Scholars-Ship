import { z } from 'zod';

export const SEARCH_MISS_PAGES = ['opportunities', 'scholarships', 'faculty', 'research'] as const;
export type SearchMissPage = (typeof SEARCH_MISS_PAGES)[number];

const list = z.array(z.string().trim().min(1).max(100)).max(60);

export const searchMissSchema = z.object({
  page: z.enum(SEARCH_MISS_PAGES),
  query: z.string().trim().max(200).default(''),
  subjects: list.default([]),
  degrees: list.default([]),
  countries: list.default([]),
  funding: list.default([]),
  matchMode: z.enum(['all', 'eligible']).default('all'),
});

export type SearchMissInput = z.input<typeof searchMissSchema>;
