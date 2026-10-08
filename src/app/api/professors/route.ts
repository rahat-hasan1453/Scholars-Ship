import { NextResponse } from 'next/server';
import { getProfessors } from '@/lib/professors';
import { initialsAvatar } from '@/lib/initialsAvatar';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const tag = searchParams.get('tag');
  const university = searchParams.get('university');
  const query = searchParams.get('q');

  let results = await getProfessors();

  if (tag) {
    results = results.filter((p) => p.researchTags.some((t) => t.toLowerCase().includes(tag.toLowerCase())));
  }

  if (university) {
    results = results.filter((p) => p.university.toLowerCase().includes(university.toLowerCase()));
  }

  if (query) {
    const q = query.toLowerCase();
    results = results.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        p.university.toLowerCase().includes(q) ||
        p.department.toLowerCase().includes(q) ||
        p.researchTags.some((t) => t.toLowerCase().includes(q))
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

  if (!apiKey || !apiKey.startsWith('highscholar_')) {
    return NextResponse.json(
      { success: false, error: 'Unauthorized: Invalid or missing X-API-Key' },
      { status: 401 }
    );
  }

  try {
    const body = await request.json();

    if (!body.name || !body.university) {
      return NextResponse.json(
        { success: false, error: 'Validation Error: name and university are required' },
        { status: 400 }
      );
    }

    const newProfessor = {
      id: body.id || `prof_api_${Date.now()}`,
      name: body.name,
      title: body.title || 'Principal Investigator / Professor',
      university: body.university,
      department: body.department || 'Department of Engineering & Science',
      country: body.country || 'Global',
      labName: body.labName || 'Research Group',
      researchTags: body.researchTags || ['Machine Learning'],
      openPositions: body.openPositions !== undefined ? body.openPositions : true,
      recentGrants: body.recentGrants || 'Active Research Grant',
      email: body.email || null,
      linkedInUrl: body.linkedInUrl || null,
      googleScholar: body.googleScholar || null,
      labWebsite: body.labWebsite || null,
      avatarUrl: body.avatarUrl || initialsAvatar(body.name),
      acceptingTerms: body.acceptingTerms || ['Fall 2026'],
      bio: body.bio || 'Ingested via HighScholar Chrome Extension Scraper',
      createdAt: new Date().toISOString(),
    };

    return NextResponse.json({
      success: true,
      message: 'Professor ingested successfully',
      data: newProfessor,
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
