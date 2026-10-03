// Seeds the mock research papers, scholarships and opportunity listings. Safe to re-run: rows are upserted.
// Run: npm run db:seed
import { PrismaClient } from '@prisma/client';
import { initialResearchPapers } from '../src/data/researchPapers';
import { mockScholarships } from '../src/data/mockData';
import { degreeToDb } from '../src/lib/scholarships';
import { semanticScholarIdFromUrl } from '../src/lib/researchPapers';
import { OPPORTUNITY_LISTINGS } from '../src/data/opportunityPosts';

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

// Upserts the Opportunity Feed listings by id, so list and details URLs match.
// Authors are linked to Professor rows by exact name when one exists.
async function seedOpportunities() {
  const professors = await prisma.professor.findMany({ select: { id: true, name: true } });
  const professorIdByName = new Map(professors.map((p) => [p.name.toLowerCase(), p.id]));
  let linked = 0;

  for (const o of OPPORTUNITY_LISTINGS) {
    const professorId = professorIdByName.get(o.authorName.toLowerCase()) ?? null;
    if (professorId) linked++;
    const data = {
      title: o.title,
      authorName: o.authorName,
      authorTitle: o.authorTitle,
      authorAvatar: o.authorAvatar ?? null,
      professorId,
      institution: o.institution,
      labName: o.labName ?? null,
      country: o.country,
      city: o.city ?? null,
      source: o.source,
      sourceUrl: o.sourceUrl,
      postedAt: new Date(o.postedAt),
      content: o.content,
      funding: o.funding,
      fundingTags: o.fundingTags,
      degreeLevels: o.degreeLevels.map(degreeToDb),
      fieldTags: o.fieldTags,
      subjectTags: o.subjectTags,
      minCgpa: o.minCgpa ?? null,
      minIelts: o.minIelts ?? null,
      publications: o.publications,
      admission: o.admission,
      livingCost: o.livingCost,
      rankRange: o.rankRange,
      acceptanceRate: o.acceptanceRate,
      positionType: o.positionType,
      startDate: o.startDate,
      deadline: new Date(o.deadline),
      positionDetails: o.positionDetails,
      aboutLab: o.aboutLab,
      applySteps: o.applySteps,
      contactEmail: o.contactEmail ?? null,
      officialUrl: o.officialUrl ?? null,
    };
    await prisma.opportunity.upsert({ where: { id: o.id }, create: { id: o.id, ...data }, update: data });
  }
  console.log(`Seeded ${OPPORTUNITY_LISTINGS.length} opportunities (${linked} linked to professors).`);
}

seedResearchPapers()
  .then(seedScholarships)
  .then(seedOpportunities)
  .catch((e) => {
    console.error(e);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
