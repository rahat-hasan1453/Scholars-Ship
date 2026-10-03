import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getOpportunities, getOpportunity } from '@/lib/opportunities';
import { OpportunityDetailsView } from '@/components/opportunity-details/OpportunityDetailsView';

type Params = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { id } = await params;
  const o = await getOpportunity(id);
  return { title: o ? `${o.title} | Scholars’ ship` : 'Opportunity not found | Scholars’ ship' };
}

// Details page for one Opportunity Feed listing: /opportunities/<id>
export default async function OpportunityDetailsPage({ params }: Params) {
  const { id } = await params;
  const [opportunity, all] = await Promise.all([getOpportunity(id), getOpportunities()]);
  if (!opportunity) notFound();
  return <OpportunityDetailsView opportunity={opportunity} others={all} />;
}
