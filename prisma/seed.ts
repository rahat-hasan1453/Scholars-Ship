// Seeds the mock research papers into the database. Safe to re-run: papers are matched by DOI.
// Run: npm run db:seed
import { PrismaClient } from '@prisma/client';
import { initialResearchPapers } from '../src/data/researchPapers';
import { mockScholarships } from '../src/data/mockData';
import { degreeToDb } from '../src/lib/scholarships';
import { semanticScholarIdFromUrl } from '../src/lib/researchPapers';

const prisma = new PrismaClient();

async function seedResearchPapers() {
  const professors = await prisma.professor.findMany({ select: { id: true, name: true } });
  const professorIdByName = new Map(professors.map((p) => [p.name.toLowerCase(), p.id]));
  let linked = 0;

  for (const paper of initialResearchPapers) {
    const data = {
      title: paper.title,
      abstract: paper.abstract,
      year: paper.year,
      publishedAt: paper.publicationDate ? new Date(paper.publicationDate) : null,
      venue: paper.venue,
      citationCount: paper.citationCount,
      semanticScholarId: semanticScholarIdFromUrl(paper.semanticScholarUrl),
      pdfUrl: paper.pdfUrl ?? null,
      googleScholarUrl: paper.googleScholarUrl,
      fieldsOfStudy: paper.fieldsOfStudy,
      tags: paper.tags,
      isOpenAccess: paper.isOpenAccess,
    };
    const authors = paper.authors.map((a, position) => {
      const professorId = professorIdByName.get(a.name.toLowerCase()) ?? null;
      if (professorId) linked++;
      return { position, name: a.name, institution: a.institution ?? null, professorId };
    });

    await prisma.$transaction(async (tx) => {
      const row = paper.doi
        ? await tx.researchPaper.upsert({
            where: { doi: paper.doi },
            create: { id: paper.id, doi: paper.doi, ...data },
            update: data,
          })
        : await tx.researchPaper.upsert({ where: { id: paper.id }, create: { id: paper.id, ...data }, update: data });
      await tx.paperAuthor.deleteMany({ where: { paperId: row.id } });
      await tx.paperAuthor.createMany({ data: authors.map((a) => ({ ...a, paperId: row.id })) });
    });
  }

  console.log(`Seeded ${initialResearchPapers.length} research papers (${linked} authors linked to professors).`);
}

// Upserts the mock scholarships by id, so the details page URLs stay the same as the list's.
async function seedScholarships() {
  for (const s of mockScholarships) {
    const data = {
      title: s.title,
      provider: s.provider,
      deadline: new Date(s.deadline),
      fundingAmount: s.fundingAmount,
      fundingType: s.fundingType,
      degreeLevels: s.degreeLevels.map(degreeToDb),
      countries: s.countries,
      specializations: s.specializations,
      requirementsJson: s.requirements,
      admissionSummary: s.admissionSummary ?? null,
      livingCost: s.livingCost ?? null,
      providerShort: s.providerShort ?? null,
      fieldOfStudy: s.fieldOfStudy ?? null,
      fundingBreakdown: s.fundingBreakdown ?? [],
      applySteps: s.applySteps ?? [],
      tags: s.tags,
      officialUrl: s.officialUrl,
      description: s.description,
      featured: s.featured ?? false,
    };
    await prisma.scholarship.upsert({ where: { id: s.id }, create: { id: s.id, ...data }, update: data });
  }
  console.log(`Seeded ${mockScholarships.length} scholarships.`);
}

seedResearchPapers()
  .then(seedScholarships)
  .catch((e) => {
    console.error(e);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
