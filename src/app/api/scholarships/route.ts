import { NextResponse } from 'next/server';
import { getScholarships } from '@/lib/scholarships';
import { ANY_COUNTRY } from '@/data/countries';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const degree = searchParams.get('degree');
  const country = searchParams.get('country');
  const query = searchParams.get('q');

  let results = await getScholarships();

  if (degree) {
    results = results.filter((s) => s.degreeLevels.some((d) => d.toLowerCase() === degree.toLowerCase()));
  }

  if (country) {
    results = results.filter((s) => s.countries.some((c) => c === ANY_COUNTRY || c.toLowerCase() === country.toLowerCase()));
  }

  if (query) {
    const q = query.toLowerCase();
    results = results.filter(
      (s) =>
        s.title.toLowerCase().includes(q) ||
        s.provider.toLowerCase().includes(q) ||
        s.specializations.some((spec) => spec.toLowerCase().includes(q))
    );
  }

  return NextResponse.json({
    success: true,
    count: results.length,
    data: results,
  });
}

export async function POST(request: Request) {
  const apiKey = request.headers.get('x-api-key') || request.headers.get('X-API-Key');

  // Verify API Key (for Chrome Extension)
  if (!apiKey || !apiKey.startsWith('highscholar_')) {
    return NextResponse.json(
      { success: false, error: 'Unauthorized: Invalid or missing X-API-Key' },
      { status: 401 }
    );
  }

  try {
    const body = await request.json();

    if (!body.title || !body.provider) {
      return NextResponse.json(
        { success: false, error: 'Validation Error: title and provider are required' },
        { status: 400 }
      );
    }

    const newScholarship = {
      id: body.id || `sch_api_${Date.now()}`,
      title: body.title,
      provider: body.provider,
      deadline: body.deadline || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      fundingAmount: body.fundingAmount || 'Full Tuition + Stipend',
      fundingType: body.fundingType || 'FULL',
      degreeLevels: body.degreeLevels || ['Masters', 'PhD'],
      countries: body.countries || ['Global'],
      specializations: body.specializations || ['General'],
      requirements: body.requirements || {},
      admissionSummary: body.admissionSummary,
      livingCost: body.livingCost,
      officialUrl: body.officialUrl || 'https://highscholar.io',
      description: body.description || 'Ingested via HighScholar Chrome Extension API',
      featured: Boolean(body.featured),
      tags: body.tags || ['Extension Scraped'],
      createdAt: new Date().toISOString(),
    };

    return NextResponse.json({
      success: true,
      message: 'Scholarship ingested successfully',
      data: newScholarship,
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
