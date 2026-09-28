import { NextResponse } from 'next/server';
import { ResearchPaper } from '@/types';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('query') || 'Computer Science Artificial Intelligence UI UX';
    const field = searchParams.get('field') || '';

    const searchTerm = [query, field].filter(Boolean).join(' ').trim() || 'Human-Computer Interaction';

    // 1. Fetch from OpenAlex API
    const openAlexRes = await fetch(
      `https://api.openalex.org/works?search=${encodeURIComponent(searchTerm)}&per_page=30`,
      {
        headers: {
          'Accept': 'application/json',
          'User-Agent': 'HighScholar/1.0 (scholarship-research-portal; contact: dev@highscholar.org)',
        },
        next: { revalidate: 3600 },
      }
    );

    let papers: ResearchPaper[] = [];

    if (openAlexRes.ok) {
      const alexData = await openAlexRes.json();
      const results = alexData.results || [];

      papers = results
        .filter((work: any) => work.title && work.publication_year)
        .map((work: any, idx: number) => {
          // Authors mapping
          const authors = (work.authorships || []).slice(0, 4).map((a: any) => ({
            name: a.author?.display_name || 'Academic Researcher',
            institution: a.institutions?.[0]?.display_name || 'Global Research University',
            googleScholarUrl: `https://scholar.google.com/scholar?q=${encodeURIComponent(a.author?.display_name || '')}`,
          }));

          if (authors.length === 0) {
            authors.push({
              name: 'Graduate Research Group',
              institution: 'International Faculty',
              googleScholarUrl: `https://scholar.google.com/scholar?q=${encodeURIComponent(work.title)}`,
            });
          }

          // Concepts / Topics
          const concepts = (work.concepts || [])
            .slice(0, 4)
            .map((c: any) => c.display_name);

          // PDF URL extraction
          const pdfUrl = work.open_access?.oa_url || work.primary_location?.pdf_url || null;
          const isOpenAccess = Boolean(work.open_access?.is_oa || pdfUrl);

          // Abstract reconstruction from inverted index if present
          let abstractText = 'No abstract summary available directly from publisher preview.';
          if (work.abstract_inverted_index) {
            try {
              const indexMap = work.abstract_inverted_index;
              const wordPositions: { word: string; pos: number }[] = [];
              Object.keys(indexMap).forEach((word) => {
                indexMap[word].forEach((pos: number) => {
                  wordPositions.push({ word, pos });
                });
              });
              wordPositions.sort((a, b) => a.pos - b.pos);
              abstractText = wordPositions.slice(0, 100).map((item) => item.word).join(' ') + '...';
            } catch {
              // fallback
            }
          }

          const venueName = work.primary_location?.source?.display_name || 'Peer-Reviewed Scholarly Outlet';
          const titleClean = work.title.replace(/^["']|["']$/g, '');

          return {
            id: `openalex-paper-${work.id?.split('/').pop() || idx}`,
            title: titleClean,
            authors,
            abstract: abstractText,
            publicationDate: work.publication_date || `${work.publication_year}-01-01`,
            year: work.publication_year,
            venue: venueName,
            citationCount: work.cited_by_count || 0,
            fieldsOfStudy: concepts.length > 0 ? concepts : ['Computer Science', 'Academic Research'],
            tags: concepts.slice(0, 3),
            doi: work.doi ? work.doi.replace('https://doi.org/', '') : undefined,
            pdfUrl: pdfUrl || undefined,
            googleScholarUrl: `https://scholar.google.com/scholar?q=${encodeURIComponent(titleClean)}`,
            semanticScholarUrl: `https://www.semanticscholar.org/search?q=${encodeURIComponent(titleClean)}`,
            isOpenAccess,
          };
        });
    }

    return NextResponse.json({
      success: true,
      count: papers.length,
      papers,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to search research papers' },
      { status: 500 }
    );
  }
}
