// Seeds the mock faculty, research papers, scholarships and opportunity listings. Safe to re-run: rows are upserted.
// Run: npm run db:seed
import { PrismaClient } from '@prisma/client';
import { initialResearchPapers } from '../src/data/researchPapers';
import { mockProfessors, mockScholarships } from '../src/data/mockData';
import { withFacultyDefaults } from '../src/lib/professorDetails';
import { degreeToDb } from '../src/lib/scholarships';
import { semanticScholarIdFromUrl } from '../src/lib/researchPapers';
import { OPPORTUNITY_LISTINGS } from '../src/data/opportunityPosts';

const prisma = new PrismaClient();

// Upserts University → ResearchLab → Professor (+ latest Grant) from the mock faculty list.
// Professor ids match the list cards, so /professors/<id> works for both DB and mock data.
// Runs first so papers and opportunities can link their authors to these rows.
async function seedFaculty() {
  for (const mock of mockProfessors) {
    const p = withFacultyDefaults(mock);
    const university = await prisma.university.upsert({
      where: { name_country: { name: p.university, country: p.country } },
      create: { name: p.university, country: p.country, city: p.city ?? null },
      update: { city: p.city ?? null },
    });

    const labData = {
      department: p.department,
      website: p.labWebsite ?? null,
      researchTags: p.researchTags,
      openPositions: p.openPositions,
      fundingSummary: p.fundingSummary ?? null,
      fundingType: p.fundingType ?? 'FULL',
      fundingSource: p.fundingSource ?? null,
      degreeLevels: (p.degreeLevels ?? []).map(degreeToDb),
      acceptingTerms: p.acceptingTerms,
    };
    const lab = p.labName
      ? await prisma.researchLab.upsert({
          where: { universityId_name: { universityId: university.id, name: p.labName } },
          create: { name: p.labName, universityId: university.id, ...labData },
          update: labData,
        })
      : null;

    const data = {
      name: p.name,
      title: p.title,
      university: p.university,
      department: p.department,
      country: p.country,
      universityId: university.id,
      labId: lab?.id ?? null,
      labName: p.labName ?? null,
      researchTags: p.researchTags,
      openPositions: p.openPositions,
      recentGrants: p.recentGrants ?? null,
      email: p.email ?? null,
      linkedInUrl: p.linkedInUrl ?? null,
      googleScholar: p.googleScholar ?? null,
      labWebsite: p.labWebsite ?? null,
      avatarUrl: p.avatarUrl,
      acceptingTerms: p.acceptingTerms,
      school: p.school ?? null,
      bio: p.bio ?? null,
      lookingFor: p.lookingFor,
      contactSteps: p.contactSteps ?? [],
    };
    await prisma.professor.upsert({ where: { id: p.id }, create: { id: p.id, ...data }, update: data });

    if (p.recentGrant) {
      const grant = {
        title: p.recentGrant.title,
        amount: p.recentGrant.amount,
        year: p.recentGrant.year ?? null,
        labId: lab?.id ?? null,
        professorId: p.id,
      };
      await prisma.grant.upsert({ where: { id: `grant_${p.id}` }, create: { id: `grant_${p.id}`, ...grant }, update: grant });
    }
  }
  console.log(`Seeded ${mockProfessors.length} professors with their universities, labs and grants.`);
}

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

seedFaculty()
  .then(seedResearchPapers)
  .then(seedScholarships)
  .then(seedOpportunities)
  .catch((e) => {
    console.error(e);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
