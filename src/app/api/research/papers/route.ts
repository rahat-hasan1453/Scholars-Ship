import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { toResearchPaper } from '@/lib/researchPapers';
import { initialResearchPapers } from '@/data/researchPapers';

// Papers for the Research Paper tab. Falls back to mock data while the table is empty or the DB is down.
export async function GET() {
  try {
    const rows = await prisma.researchPaper.findMany({
      include: { authors: true },
      orderBy: [{ createdAt: 'asc' }, { id: 'asc' }],
    });
    if (rows.length > 0) {
      const data = rows.map(toResearchPaper);
      return NextResponse.json({ success: true, source: 'database', count: data.length, data });
    }
  } catch (error) {
    console.error('[research/papers] database read failed, serving mock data', error);
  }

  return NextResponse.json({
    success: true,
    source: 'mock',
    count: initialResearchPapers.length,
    data: initialResearchPapers,
  });
}
