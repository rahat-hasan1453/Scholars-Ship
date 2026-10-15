// Seeds the real catalogue: scholarships, faculty (+ universities and NSF grants), research papers and
// Opportunity Feed posts. Source files live in prisma/data (see prisma/import/* for how they're built).
// Safe to re-run: rows are upserted, and rows that are no longer in the data (old demo rows) are removed.
// Run: npm run db:seed
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { Prisma, PrismaClient } from '@prisma/client';
import type { Opportunity } from '../src/types';
import { degreeToDb } from '../src/lib/scholarships';
import { staleDemoOpportunitiesWhere, toOpportunityData } from '../src/lib/opportunities';
import { SCHOLARSHIPS } from './data/scholarships';

const prisma = new PrismaClient();
const DATA = path.join(__dirname, 'data');
const VERIFIED_AT = new Date('2026-10-09T00:00:00Z');

const readJson = async <T>(file: string): Promise<T> => JSON.parse(await readFile(path.join(DATA, file), 'utf8')) as T;

type ProfessorSeed = {
  id: string;
  name: string;
  university: string;
  universityWebsite: string | null;
  country: string;
  department: string;
  researchTags: string[];
  homepage: string | null;
  googleScholar: string | null;
  orcid: string | null;
  openAlexId: string | null;
  hIndex: number | null;
  publicationCount: number | null;
  email: string | null;
  grant: { title: string; amount: string; year: number; funder: string; url: string } | null;
};

type PaperSeed = {
  id: string;
  title: string;
  abstract: string;
  year: number | null;
  publishedAt: string | null;
  venue: string | null;
  citationCount: number;
  doi: string | null;
  pdfUrl: string | null;
  isOpenAccess: boolean;
  paperType: string | null;
  fieldsOfStudy: string[];
  tags: string[];
  funding: string | null;
  institution: string | null;
  authors: { position: number; name: string; institution: string | null; professorId: string | null }[];
};

async function seedScholarships() {
  for (const s of SCHOLARSHIPS) {
    const data = {
      title: s.title,
      provider: s.provider,
      providerShort: s.providerShort ?? null,
      deadline: new Date(s.deadline),
      deadlineEstimated: s.deadlineEstimated,
      deadlineNote: s.deadlineNote ?? null,
      fundingAmount: s.fundingAmount,
      fundingType: s.fundingType,
      degreeLevels: s.degreeLevels.map(degreeToDb),
      countries: s.countries,
      specializations: s.specializations,
      requirementsJson: s.requirements,
      admissionSummary: s.admissionSummary ?? null,
      livingCost: null,
      fieldOfStudy: null,
      fundingBreakdown: Prisma.DbNull,
      applySteps: s.applySteps ?? [],
      tags: s.tags,
      officialUrl: s.officialUrl,
      sourceUrl: s.sourceUrl,
      verifiedAt: VERIFIED_AT,
      description: s.description,
      featured: s.featured ?? false,
    };
    await prisma.scholarship.upsert({ where: { id: s.id }, create: { id: s.id, ...data }, update: data });
  }
  const removed = await prisma.scholarship.deleteMany({ where: { id: { notIn: SCHOLARSHIPS.map((s) => s.id) } } });
  console.log(`Seeded ${SCHOLARSHIPS.length} scholarships (removed ${removed.count} old rows).`);
}

async function seedFaculty() {
  const { professors } = await readJson<{ professors: ProfessorSeed[] }>('professors.json');

  // Universities first, one row per (name, country)
  const uniIds = new Map<string, string>();
  for (const p of professors) {
    const key = `${p.university}|${p.country}`;
    if (uniIds.has(key)) continue;
    const u = await prisma.university.upsert({
      where: { name_country: { name: p.university, country: p.country } },
      create: { name: p.university, country: p.country, website: p.universityWebsite },
      update: { website: p.universityWebsite },
    });
    uniIds.set(key, u.id);
  }

  let grants = 0;
  for (const p of professors) {
    const recentGrants = p.grant ? `${p.grant.amount} NSF award (${p.grant.year}): ${p.grant.title}` : null;
    const data = {
      name: p.name,
      title: `Faculty · ${p.department}`,
      university: p.university,
      department: p.department,
      country: p.country,
      universityId: uniIds.get(`${p.university}|${p.country}`)!,
      labId: null,
      labName: null,
      researchTags: p.researchTags,
      // No source says whether they are hiring; the "Recently Funded" signal comes from the grant instead
      openPositions: false,
      recentGrants,
      email: p.email,
      googleScholar: p.googleScholar,
      orcid: p.orcid,
      openAlexId: p.openAlexId,
      dataSource: ['CSRankings', p.openAlexId && 'OpenAlex', (p.grant || p.email) && 'NSF'].filter(Boolean).join(' + '),
      labWebsite: p.homepage,
      avatarUrl: null,
      acceptingTerms: [],
      hIndex: p.hIndex,
      publicationCount: p.publicationCount,
    };
    await prisma.professor.upsert({ where: { id: p.id }, create: { id: p.id, ...data }, update: data });
    if (p.grant) {
      const id = `nsf_${p.grant.url.split('AWD_ID=').pop()}_${p.id}`.slice(0, 120);
      const grant = { title: p.grant.title, funder: p.grant.funder, amount: p.grant.amount, year: p.grant.year, url: p.grant.url, professorId: p.id };
      await prisma.grant.upsert({ where: { id }, create: { id, ...grant }, update: grant });
      grants++;
    }
  }

  const keep = professors.map((p) => p.id);
  const removedProfs = await prisma.professor.deleteMany({ where: { id: { notIn: keep } } });
  // Demo labs and grants had no real source
  const removedGrants = await prisma.grant.deleteMany({ where: { OR: [{ professorId: null }, { url: null }] } });
  const removedLabs = await prisma.researchLab.deleteMany({});
  const removedUnis = await prisma.university.deleteMany({ where: { professors: { none: {} } } });
  console.log(
    `Seeded ${professors.length} faculty at ${uniIds.size} universities, ${grants} NSF grants ` +
      `(removed ${removedProfs.count} old faculty, ${removedLabs.count} labs, ${removedGrants.count} grants, ${removedUnis.count} universities).`,
  );
}

async function seedResearchPapers() {
  const { papers } = await readJson<{ papers: PaperSeed[] }>('papers.json');
  const known = new Set((await prisma.professor.findMany({ select: { id: true } })).map((p) => p.id));
  for (const p of papers) {
    const data = {
      title: p.title,
      abstract: p.abstract,
      year: p.year,
      publishedAt: p.publishedAt ? new Date(`${p.publishedAt}T00:00:00Z`) : null,
      venue: p.venue,
      citationCount: p.citationCount,
      doi: p.doi,
      semanticScholarId: null,
      pdfUrl: p.pdfUrl,
      googleScholarUrl: null,
      fieldsOfStudy: p.fieldsOfStudy,
      tags: p.tags,
      isOpenAccess: p.isOpenAccess,
      venueShort: null,
      paperType: p.paperType,
      peerReviewed: p.paperType === 'Preprint' ? false : null,
      institution: p.institution,
      funding: p.funding,
      keyFindings: Prisma.DbNull,
    };
    // A DOI can only belong to one row: drop it from any old row first
    if (p.doi) await prisma.researchPaper.updateMany({ where: { doi: p.doi, id: { not: p.id } }, data: { doi: null } });
    await prisma.$transaction(async (tx) => {
      await tx.researchPaper.upsert({ where: { id: p.id }, create: { id: p.id, ...data }, update: data });
      await tx.paperAuthor.deleteMany({ where: { paperId: p.id } });
      await tx.paperAuthor.createMany({
        data: p.authors.map((a) => ({
          paperId: p.id,
          position: a.position,
          name: a.name,
          institution: a.institution,
          professorId: a.professorId && known.has(a.professorId) ? a.professorId : null,
        })),
      });
    });
  }
  const removed = await prisma.researchPaper.deleteMany({ where: { id: { notIn: papers.map((p) => p.id) } } });
  console.log(`Seeded ${papers.length} research papers (removed ${removed.count} old rows).`);
}

async function seedOpportunities() {
  const { opportunities } = await readJson<{ opportunities: Opportunity[] }>('opportunities.json');
  for (const o of opportunities) {
    const data = toOpportunityData(o);
    await prisma.opportunity.upsert({ where: { id: o.id }, create: { id: o.id, ...data }, update: data });
  }
  // Only the old demo sources are removed; live posts from the cron (mastodon, bluesky, …) are kept
  const removed = await prisma.opportunity.deleteMany({ where: staleDemoOpportunitiesWhere(opportunities.map((o) => o.id)) });
  console.log(`Seeded ${opportunities.length} opportunities (removed ${removed.count} old rows).`);
}

seedScholarships()
  .then(seedFaculty)
  .then(seedResearchPapers)
  .then(seedOpportunities)
  .catch((e) => {
    console.error(e);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
