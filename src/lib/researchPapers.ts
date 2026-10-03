import type { PaperAuthor, ResearchPaper as ResearchPaperRow } from '@prisma/client';
import type { ResearchPaper } from '@/types';

export type ResearchPaperWithAuthors = ResearchPaperRow & { authors: PaperAuthor[] };

// Semantic Scholar paper ids are 40-char hex hashes; anything else is not a real id
const SEMANTIC_SCHOLAR_ID = /^[0-9a-f]{40}$/;

export function semanticScholarIdFromUrl(url?: string): string | null {
  const last = url?.split('/').pop();
  return last && SEMANTIC_SCHOLAR_ID.test(last) ? last : null;
}

// DB row -> the shape ResearchPaperCard renders
export function toResearchPaper(row: ResearchPaperWithAuthors): ResearchPaper {
  const published = row.publishedAt ?? (row.year ? new Date(Date.UTC(row.year, 0, 1)) : null);
  return {
    id: row.id,
    title: row.title,
    authors: [...row.authors]
      .sort((a, b) => a.position - b.position)
      .map((a) => ({ name: a.name, institution: a.institution ?? undefined })),
    abstract: row.abstract,
    publicationDate: published ? published.toISOString().slice(0, 10) : '',
    year: row.year ?? published?.getUTCFullYear() ?? 0,
    venue: row.venue ?? '',
    citationCount: row.citationCount,
    fieldsOfStudy: row.fieldsOfStudy,
    tags: row.tags,
    doi: row.doi ?? undefined,
    pdfUrl: row.pdfUrl ?? undefined,
    googleScholarUrl:
      row.googleScholarUrl || `https://scholar.google.com/scholar?q=${encodeURIComponent(row.title)}`,
    semanticScholarUrl: row.semanticScholarId
      ? `https://www.semanticscholar.org/paper/${row.semanticScholarId}`
      : undefined,
    isOpenAccess: row.isOpenAccess,
  };
}
