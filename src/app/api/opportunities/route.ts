import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { toOpportunity } from '@/lib/opportunities';
import { OPPORTUNITY_LISTINGS } from '@/data/opportunityPosts';

// Listings for the Opportunity Feed. Falls back to mock data while the table is empty or the DB is down.
export async function GET() {
  try {
    const rows = await prisma.opportunity.findMany({ orderBy: [{ postedAt: 'desc' }, { id: 'asc' }] });
    if (rows.length > 0) {
      const data = rows.map(toOpportunity);
      return NextResponse.json({ success: true, source: 'database', count: data.length, data });
    }
  } catch (error) {
    console.error('[opportunities] database read failed, serving mock data', error);
  }

  return NextResponse.json({
    success: true,
    source: 'mock',
    count: OPPORTUNITY_LISTINGS.length,
    data: OPPORTUNITY_LISTINGS,
  });
}
