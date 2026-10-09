import { NextResponse } from 'next/server';
import { getOpportunities } from '@/lib/opportunities';

// Open listings for the Opportunity Feed, from the database.
export async function GET() {
  const data = await getOpportunities();
  return NextResponse.json({ success: true, source: 'database', count: data.length, data });
}
