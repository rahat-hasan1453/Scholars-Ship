import { NextResponse } from 'next/server';
import { HiringOpportunity, DegreeLevel } from '@/types';

// Clean HTML into plain text
function cleanHtml(html: string): string {
  return html
    .replace(/<br\s*[\/]?>/gi, '\n')
    .replace(/<\/p>/gi, '\n\n')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, ' ')
    .trim();
}

// Known Countries dictionary for extraction
const COUNTRY_MAP: { [keyword: string]: string } = {
  germany: 'Germany',
  deutschland: 'Germany',
  berlin: 'Germany',
  munich: 'Germany',
  göttingen: 'Germany',
  braunschweig: 'Germany',
  usa: 'USA',
  'united states': 'USA',
  california: 'USA',
  boston: 'USA',
  stanford: 'USA',
  mit: 'USA',
  uk: 'United Kingdom',
  'united kingdom': 'United Kingdom',
  london: 'United Kingdom',
  oxford: 'United Kingdom',
  cambridge: 'United Kingdom',
  canada: 'Canada',
  toronto: 'Canada',
  waterloo: 'Canada',
  montreal: 'Canada',
  vancouver: 'Canada',
  switzerland: 'Switzerland',
  zurich: 'Switzerland',
  lausanne: 'Switzerland',
  eth: 'Switzerland',
  france: 'France',
  paris: 'France',
  sweden: 'Sweden',
  stockholm: 'Sweden',
  netherlands: 'Netherlands',
  amsterdam: 'Netherlands',
  delft: 'Netherlands',
  singapore: 'Singapore',
  australia: 'Australia',
  melbourne: 'Australia',
  sydney: 'Australia',
  bulgaria: 'Bulgaria',
  austria: 'Austria',
  vienna: 'Austria',
  italy: 'Italy',
  denmark: 'Denmark',
  norway: 'Norway',
  finland: 'Finland',
};

// Known Fields mapping from keywords/hashtags
const FIELD_KEYWORDS: { [tag: string]: string[] } = {
  HCI: ['hci', 'ux', 'interaction', 'human-computer', 'design', 'user experience', 'accessibility'],
  'Artificial Intelligence': ['ai', 'artificial intelligence', 'machine learning', 'deep learning', 'nlp', 'llm', 'generative ai', 'computer vision'],
  Robotics: ['robotics', 'robot', 'autonomous', 'control systems', 'automation'],
  Bioinformatics: ['bioinformatics', 'computational biology', 'genomics', 'biomedical', 'health tech'],
  'Computer Science': ['computer science', 'software', 'distributed systems', 'cybersecurity', 'cloud', 'algorithms'],
  Physics: ['physics', 'astronomy', 'astrophysics', 'quantum', 'space', 'plasma', 'cosmology'],
  Neuroscience: ['neuroscience', 'neuro', 'cognitive', 'brain', 'psychology'],
  'Data Science': ['data science', 'statistics', 'data analysis', 'big data'],
};

// NLP Parser for Academic Social Posts
function parseAcademicPost(post: any): HiringOpportunity | null {
  try {
    const rawContent = post.content || '';
    const text = cleanHtml(rawContent);

    if (!text || text.length < 40) return null;

    // Extract PI / Professor name from text if available
    let author = (post.account?.display_name || post.account?.username || 'Academic Faculty').trim();
    const piMatch = text.match(/(?:led by|working with|supervised by|contact|in the group of|with)\s+(?:Dr\.|Prof\.|Professor\s+)?([A-Z]\.?(?:[a-z]+)?\s+[A-Z][a-z]+)/i);
    if (piMatch && piMatch[1] && (author.length < 5 || !author.includes(' '))) {
      author = `Prof. ${piMatch[1].trim()}`;
    }

    const avatar = post.account?.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80';
    const sourceUrl = post.url || 'https://academiccloud.social';
    const postDate = post.created_at ? post.created_at.slice(0, 10) : new Date().toISOString().slice(0, 10);

    // Extract emails
    const emailMatch = text.match(/([a-zA-Z0-9._-]+@[a-zA-Z0-9._-]+\.[a-zA-Z0-9_-]+)/);
    const email = emailMatch ? emailMatch[1] : undefined;

    // Extract hashtags as field tags
    const hashtags = (post.tags || []).map((t: any) => t.name).filter(Boolean);
    const textHashtags = (text.match(/#([a-zA-Z0-9_]+)/g) || []).map((h: string) => h.replace('#', ''));
    const allRawTags = Array.from(new Set([...hashtags, ...textHashtags]));

    // Match specialized disciplines
    const detectedFields = new Set<string>();
    const lowerText = text.toLowerCase();

    for (const [field, keywords] of Object.entries(FIELD_KEYWORDS)) {
      if (keywords.some((k) => lowerText.includes(k) || allRawTags.some((t) => t.toLowerCase() === k))) {
        detectedFields.add(field);
      }
    }

    if (detectedFields.size === 0) {
      detectedFields.add('Interdisciplinary Research');
    }

    // Extract degrees
    const degrees: DegreeLevel[] = [];
    if (/phd|doctoral|ph\.d/i.test(text)) degrees.push('PhD');
    if (/master|masc|msc|graduate assistant|grad student/i.test(text)) degrees.push('Masters');
    if (degrees.length === 0) degrees.push('PhD');

    // Extract Institution
    let institution = 'Academic Research Institution';
    const instPatterns = [
      /(?:at|with|join|at\s+the|at\s+our\s+partner\s+university)\s+([A-Z][A-Za-z\s0-9&-]+(?:University|Institute|School|Academy|College|TU\s+[A-Za-z]+|Center|Centre|Laboratory|Lab))/i,
      /(TU\s+[A-Z][a-z]+|Max\s+Planck\s+Institute(?:\s+for\s+[A-Za-z\s]+)?|IMPRS(?:\s+for\s+[A-Za-z\s]+)?|Bulgarian\s+Academy\s+of\s+Sciences)/i,
      /([A-Z][A-Za-z\s0-9&-]+(?:University|Institute|School|Academy|College|Center|Centre|Laboratory|Lab))/i,
    ];

    for (const pattern of instPatterns) {
      const match = text.match(pattern);
      if (match && match[1].trim().length > 3 && match[1].trim().length < 65) {
        institution = match[1].trim().replace(/^(at|with|join|at\s+the|at\s+our\s+partner\s+university|our\s+partner\s+university|the)\s+/i, '');
        break;
      }
    }

    // Extract Country
    let country = 'International';
    for (const [keyword, cName] of Object.entries(COUNTRY_MAP)) {
      if (lowerText.includes(keyword)) {
        country = cName;
        break;
      }
    }

    // Extract Funding
    let funding = 'Fully Funded / University Fellowship';
    const fundingPatterns = [
      /(TV-L\s*E\d+(?:\s*\d+%)?)/i,
      /((?:\$|€|£)\s*[\d,]+(?:\s*\/\s*(?:year|yr|month|mo))?)/i,
      /(full(?:y)?\s*(?:funded|stipend|tuition|salary|waiver))/i,
      /(fellowship\s*(?:included|guaranteed|award)?)/i,
    ];

    for (const fPattern of fundingPatterns) {
      const fMatch = text.match(fPattern);
      if (fMatch) {
        funding = `${fMatch[1]} (Standard Academic Scale)`;
        break;
      }
    }

    // Clean Title
    let title = '';
    const sentences = text.split(/[.!?]\s+/);
    if (sentences.length > 0 && sentences[0].length >= 20 && sentences[0].length <= 120) {
      title = sentences[0].trim();
    } else {
      title = text.slice(0, 95).trim() + '...';
    }

    // Determine platform source
    let source: 'web' | 'twitter' | 'linkedin' | 'lab_website' = 'web';
    if (sourceUrl.includes('twitter.com') || sourceUrl.includes('x.com') || sourceUrl.includes('bsky')) {
      source = 'twitter';
    } else if (sourceUrl.includes('linkedin.com')) {
      source = 'linkedin';
    }

    return {
      id: `live_${post.id || Math.random().toString(36).substring(2, 9)}`,
      authorName: author,
      authorTitle: 'Faculty Member / Group Leader',
      authorAvatar: avatar,
      institution: institution,
      labName: institution.includes('Lab') ? institution : undefined,
      source: source,
      sourceUrl: sourceUrl,
      postedAgo: 'Recently',
      postedDate: postDate,
      title: title,
      content: text,
      funding: funding,
      degrees: degrees,
      fieldTags: Array.from(detectedFields).slice(0, 5),
      matchType: detectedFields.has('HCI') || detectedFields.has('Artificial Intelligence') ? 'exact' : 'similar',
      country: country,
      contactEmail: email,
      recentPaperTopic: Array.from(detectedFields)[0] ? `Research in ${Array.from(detectedFields)[0]}` : undefined,
    };
  } catch (e) {
    console.error('Error parsing academic post:', e);
    return null;
  }
}

// GET: Aggregates real-time opportunities from live academic fediverse & web feeds
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const tagQuery = searchParams.get('tag') || 'PhDPositions';
  const limitParam = parseInt(searchParams.get('limit') || '25', 10);

  const ACADEMIC_ENDPOINTS = [
    `https://mastodon.social/api/v1/timelines/tag/PhDPositions?limit=20`,
    `https://mstdn.science/api/v1/timelines/tag/PhDPositions?limit=20`,
    `https://mastodon.social/api/v1/timelines/tag/AcademicJobs?limit=15`,
    `https://mstdn.science/api/v1/timelines/tag/AcademicJobs?limit=15`,
    `https://mastodon.social/api/v1/timelines/tag/HiringPhD?limit=10`,
  ];

  try {
    const fetchPromises = ACADEMIC_ENDPOINTS.map(async (url) => {
      try {
        const res = await fetch(url, {
          headers: {
            'User-Agent': 'HighScholar-Academic-Aggregator/1.0',
            Accept: 'application/json',
          },
          next: { revalidate: 300 }, // Cache for 5 minutes
        });
        if (!res.ok) return [];
        return await res.json();
      } catch (err) {
        console.warn(`Failed fetching from ${url}`, err);
        return [];
      }
    });

    const results = await Promise.all(fetchPromises);
    const allPosts = results.flat().filter((p) => p && p.id);

    // Deduplicate by post id
    const uniqueMap = new Map<string, any>();
    for (const post of allPosts) {
      if (!uniqueMap.has(post.id)) {
        uniqueMap.set(post.id, post);
      }
    }

    const parsedOpportunities = Array.from(uniqueMap.values())
      .map(parseAcademicPost)
      .filter((item): item is HiringOpportunity => item !== null);

    return NextResponse.json({
      success: true,
      count: parsedOpportunities.length,
      sourceCount: allPosts.length,
      data: parsedOpportunities.slice(0, limitParam),
      syncedAt: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error('Aggregator error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to aggregate live opportunities' },
      { status: 500 }
    );
  }
}

// POST: Allows importing any social media post / URL directly by parsing text or link
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { rawText, sourceUrl, authorName, institution, degrees, funding, country } = body;

    if (!rawText && !sourceUrl) {
      return NextResponse.json(
        { success: false, error: 'rawText or sourceUrl is required' },
        { status: 400 }
      );
    }

    const pseudoPost = {
      id: `manual_${Date.now()}`,
      content: rawText || '',
      url: sourceUrl || 'https://linkedin.com',
      created_at: new Date().toISOString(),
      account: {
        display_name: authorName || 'Academic Faculty / PI',
        username: (authorName || 'professor').toLowerCase().replace(/\s+/g, '_'),
        avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80',
      },
    };

    const parsed = parseAcademicPost(pseudoPost);
    if (!parsed) {
      return NextResponse.json(
        { success: false, error: 'Could not extract valid opportunity from text' },
        { status: 422 }
      );
    }

    // Override with any explicit user inputs if provided
    if (institution) parsed.institution = institution;
    if (authorName) parsed.authorName = authorName;
    if (degrees && Array.isArray(degrees)) parsed.degrees = degrees;
    if (funding) parsed.funding = funding;
    if (country) parsed.country = country;

    return NextResponse.json({
      success: true,
      data: parsed,
      message: 'Successfully imported post into HighScholar',
    });
  } catch (error: any) {
    console.error('Import error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to import post' },
      { status: 500 }
    );
  }
}
