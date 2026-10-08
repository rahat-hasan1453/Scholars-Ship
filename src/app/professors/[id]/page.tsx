import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getProfessor, getSimilarCandidates } from '@/lib/professors';
import { ProfessorDetailsView } from '@/components/professor-details/ProfessorDetailsView';

type Params = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { id } = await params;
  const p = await getProfessor(id);
  return { title: p ? `${p.name} | Scholars’ ship` : 'Faculty not found | Scholars’ ship' };
}

// Details page for one Faculty & Research Labs card: /professors/<id>
export default async function ProfessorDetailsPage({ params }: Params) {
  const { id } = await params;
  const professor = await getProfessor(id);
  if (!professor) notFound();
  const others = await getSimilarCandidates(professor);
  return <ProfessorDetailsView professor={professor} others={others} />;
}
