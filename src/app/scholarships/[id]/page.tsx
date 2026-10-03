import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getScholarship, getScholarships } from '@/lib/scholarships';
import { ScholarshipDetailsView } from '@/components/scholarship-details/ScholarshipDetailsView';

type Params = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { id } = await params;
  const s = await getScholarship(id);
  return { title: s ? `${s.title} | Scholars’ ship` : 'Scholarship not found | Scholars’ ship' };
}

// Details page for one Scholarship Radar listing: /scholarships/<id>
export default async function ScholarshipDetailsPage({ params }: Params) {
  const { id } = await params;
  const [scholarship, all] = await Promise.all([getScholarship(id), getScholarships()]);
  if (!scholarship) notFound();
  return <ScholarshipDetailsView scholarship={scholarship} others={all} />;
}
