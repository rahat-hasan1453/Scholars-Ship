import { NextResponse } from 'next/server';
import { Professor } from '@/types';
import { initialsAvatar } from '@/lib/initialsAvatar';

// Map country code to readable name
const countryMap: Record<string, string> = {
  US: 'USA',
  CA: 'Canada',
  GB: 'United Kingdom',
  DE: 'Germany',
  CH: 'Switzerland',
  AU: 'Australia',
  SE: 'Sweden',
  NL: 'Netherlands',
  SG: 'Singapore',
  JP: 'Japan',
  KR: 'South Korea',
  FR: 'France',
  IT: 'Italy',
  DK: 'Denmark',
  FI: 'Finland',
};

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('query') || '';
    const field = searchParams.get('field') || '';

    const searchTerm = [query, field].filter(Boolean).join(' ').trim() || 'Human Computer Interaction UX Design';

    // Query OpenAlex API
    const response = await fetch(
      `https://api.openalex.org/authors?search=${encodeURIComponent(searchTerm)}&per_page=12`,
      {
        headers: {
          'Accept': 'application/json',
          'User-Agent': 'HighScholar/1.0 (academic-scholarship-portal; contact: info@highscholar.edu)',
        },
        next: { revalidate: 3600 }, // Cache 1 hour
      }
    );

    if (!response.ok) {
      return NextResponse.json({ success: false, error: 'OpenAlex service unavailable' }, { status: 502 });
    }

    const data = await response.json();
    const results = data.results || [];

    // Map OpenAlex authors to HighScholar Professor interface
    const mappedProfessors: Professor[] = results
      .filter((author: any) => author.display_name && author.works_count > 5)
      .map((author: any, index: number) => {
        const institutionName = author.last_known_institution?.display_name || 'Global Research Institute';
        const countryCode = author.last_known_institution?.country_code || 'US';
        const country = countryMap[countryCode] || author.last_known_institution?.country_code || 'USA';

        // Extract topics as research tags
        const topics = (author.topics || [])
          .slice(0, 4)
          .map((t: any) => t.display_name)
          .filter(Boolean);

        const primaryTopic = topics[0] || '';

        return {
          id: `openalex_${author.id?.split('/').pop() || index}`,
          name: author.display_name,
          title: 'Researcher',
          university: institutionName,
          department: primaryTopic,
          country: country,
          researchTags: topics,
          // OpenAlex says nothing about hiring or intakes, so these stay empty instead of guessed
          openPositions: false,
          googleScholar: `https://scholar.google.com/scholar?q=${encodeURIComponent(author.display_name)}`,
          linkedInUrl: `https://www.linkedin.com/search/results/all/?keywords=${encodeURIComponent(author.display_name + ' ' + institutionName)}`,
          labWebsite: author.id || `https://openalex.org/${author.id?.split('/').pop()}`,
          avatarUrl: initialsAvatar(author.display_name),
          acceptingTerms: [],
          publicationCount: author.works_count ?? undefined,
          hIndex: author.summary_stats?.h_index ?? undefined,
        };
      });

    return NextResponse.json({
      success: true,
      count: mappedProfessors.length,
      professors: mappedProfessors,
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message || 'Failed to search professors' },
      { status: 500 }
    );
  }
}
