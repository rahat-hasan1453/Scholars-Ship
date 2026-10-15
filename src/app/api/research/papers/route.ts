import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { toResearchPaper } from '@/lib/researchPapers';

// Papers for the Research Paper tab, from the database (newest year first, then most cited).
export async function GET() {
  try {
    const rows = await prisma.researchPaper.findMany({
      include: { authors: { orderBy: { position: 'asc' } } },
      orderBy: [{ year: { sort: 'desc', nulls: 'last' } }, { citationCount: 'desc' }, { id: 'asc' }],
    });
    const data = rows.map(toResearchPaper);
    return NextResponse.json({ success: true, source: 'database', count: data.length, data });
  } catch (error) {
    console.error('[research/papers] database read failed', error);
    return NextResponse.json({ success: false, error: 'Papers are unavailable right now', data: [] }, { status: 503 });
  }
}
