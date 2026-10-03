import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getProfessor, getProfessors } from '@/lib/professors';
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
  const [professor, all] = await Promise.all([getProfessor(id), getProfessors()]);
  if (!professor) notFound();
  return <ProfessorDetailsView professor={professor} others={all} />;
}
