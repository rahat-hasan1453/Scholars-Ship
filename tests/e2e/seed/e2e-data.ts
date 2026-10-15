// Small, fixed data for the e2e test database. Made up for tests: every link is on example.test,
// every name says "E2E" or "Test". It never goes near production (see seed-guard.ts).
// Subjects, degrees and countries are chosen to match the default e2e profile (tests/fixtures/mockData.ts:
// Masters, CGPA 3.82, IELTS 8, subjects UX/HCI/CS/AI/Data Science, countries incl. Germany/Switzerland/UK),
// because every feed starts filtered by the profile. Rows outside those filters are there on purpose too.
// Dates are relative to `now`, so deadlines stay in the future however old this file gets.
import type { Prisma } from '@prisma/client';
import { E2E_IDS, E2E_NAMES } from '../ids';

const DAY = 86_400_000;
const link = (path: string) => `https://example.test/${path}`;

export function e2eData(now = new Date()) {
  const inDays = (n: number) => new Date(now.getTime() + n * DAY);

  const scholarship = (s: Partial<Prisma.ScholarshipCreateManyInput> & Pick<Prisma.ScholarshipCreateManyInput, 'id' | 'title' | 'provider'>): Prisma.ScholarshipCreateManyInput => ({
    deadline: inDays(60),
    fundingAmount: 'Full tuition + €1,300/month',
    fundingType: 'FULL',
    degreeLevels: ['MASTERS', 'PHD'],
    countries: ['Germany'],
    specializations: ['Human-Computer Interaction'],
    requirementsJson: { minCgpa: 3.0, minIelts: 6.5 },
    admissionSummary: 'CGPA 3.0+, IELTS 6.5',
    officialUrl: link(`scholarships/${s.id}`),
    sourceUrl: link(`scholarships/${s.id}/source`),
    verifiedAt: inDays(-7),
    description: 'Test scholarship for the e2e suite.',
    applySteps: ['Check eligibility', 'Prepare documents', 'Apply online'],
    ...s,
  });

  const scholarships = [
    scholarship({ id: E2E_IDS.scholarship, title: 'E2E DAAD HCI Scholarship', provider: 'E2E Academic Exchange Service', providerShort: 'E2E-DAAD', featured: true, fieldOfStudy: 'HCI', fundingBreakdown: [{ label: 'Monthly stipend', value: '€1,300' }] }),
    scholarship({ id: E2E_IDS.scholarshipMasters, title: 'E2E Netherlands Masters Grant', provider: 'E2E Dutch Foundation', degreeLevels: ['MASTERS'], countries: ['Netherlands'], fundingType: 'PARTIAL', fundingAmount: '€10,000 once' }),
    scholarship({ id: 'e2e_sch_uk_phd', title: 'E2E UK Doctoral Award', provider: 'E2E Research Council', degreeLevels: ['PHD'], countries: ['United Kingdom'], specializations: ['Computer Science'] }),
    scholarship({ id: 'e2e_sch_expected', title: 'E2E Expected Deadline Fellowship', provider: 'E2E Fellowship Trust', deadlineEstimated: true, deadlineNote: 'Date follows last year’s call' }),
    scholarship({ id: 'e2e_sch_bachelors', title: 'E2E Bachelors Starter Award', provider: 'E2E Starter Fund', degreeLevels: ['BACHELORS'], countries: ['Canada'], requirementsJson: {} }),
  ];

  const universities: Prisma.UniversityCreateManyInput[] = [
    { id: E2E_IDS.university, name: 'E2E Technical University Berlin', country: 'Germany', city: 'Berlin', website: link('tu-berlin') },
    { id: 'e2e_uni_zurich', name: 'E2E University of Zurich', country: 'Switzerland', city: 'Zurich', website: link('zurich') },
  ];

  const labs: Prisma.ResearchLabCreateManyInput[] = [
    {
      id: 'e2e_lab_hci', name: E2E_NAMES.lab, universityId: E2E_IDS.university, department: 'Computer Science', website: link('lab'),
      researchTags: ['HCI', 'Generative AI'], fundingSummary: 'Fully funded PhD positions', fundingSource: 'E2E Research Fund',
      degreeLevels: ['MASTERS', 'PHD'], acceptingTerms: ['Fall 2027'], phdStudents: 8, postdocs: 2, openPositionCount: 2,
    },
    { id: 'e2e_lab_vis', name: 'E2E Visualization Group', universityId: 'e2e_uni_zurich', researchTags: ['Data Visualization'], degreeLevels: ['MASTERS', 'PHD'], acceptingTerms: ['Spring 2027'] },
  ];

  const professor = (p: Partial<Prisma.ProfessorCreateManyInput> & Pick<Prisma.ProfessorCreateManyInput, 'id' | 'name'>): Prisma.ProfessorCreateManyInput => ({
    title: 'Professor',
    university: universities[0].name,
    universityId: E2E_IDS.university,
    department: 'Computer Science',
    country: 'Germany',
    labId: 'e2e_lab_hci',
    labName: E2E_NAMES.lab,
    researchTags: ['HCI', 'Generative AI'],
    acceptingTerms: ['Fall 2027'],
    email: `${p.id}@example.test`,
    labWebsite: link('lab'),
    dataSource: 'E2E test data',
    ...p,
  });

  const professors = [
    professor({
      id: E2E_IDS.professor, name: E2E_NAMES.professor, school: 'School of EECS', bio: 'Studies how people design with AI tools.',
      publicationCount: 42, hIndex: 12, recentGrants: 'E2E Research Fund 2026',
      lookingFor: { degree: "Master's in HCI or CS", minCgpa: 3.3, minIelts: 7, experience: 'Prior user studies', publications: 'preferred' },
      contactSteps: ['Read a recent paper', 'Email a short research pitch'],
    }),
    professor({ id: E2E_IDS.professorSimilar, name: 'Dr. Ben Testmore', title: 'Associate Professor' }),
    professor({ id: 'e2e_prof_vis', name: 'Dr. Cleo Mockley', university: universities[1].name, universityId: 'e2e_uni_zurich', country: 'Switzerland', labId: 'e2e_lab_vis', labName: 'E2E Visualization Group', researchTags: ['Data Visualization'], acceptingTerms: ['Spring 2027'] }),
    // Visible in the feed, but asks for a CGPA above the e2e student's 3.82, so "Eligible Now" drops it
    professor({ id: 'e2e_prof_closed', name: 'Dr. Dan Fixture', openPositions: false, researchTags: ['HCI', 'Accessibility'], lookingFor: { degree: "Master's in HCI", minCgpa: 3.95, publications: 'none' } }),
    professor({ id: 'e2e_prof_uk', name: 'Dr. Eve Stubbs', university: 'E2E London College', universityId: null, labId: null, labName: null, country: 'United Kingdom', researchTags: ['Machine Learning'] }),
  ];

  const grants: Prisma.GrantCreateManyInput[] = [
    { id: 'e2e_grant_1', title: 'E2E grant for AI design tools', funder: 'E2E Research Fund', amount: '€1.2M', year: 2026, labId: 'e2e_lab_hci', professorId: E2E_IDS.professor, url: link('grant') },
  ];

  const opportunity = (o: Partial<Prisma.OpportunityCreateManyInput> & Pick<Prisma.OpportunityCreateManyInput, 'id' | 'title'>): Prisma.OpportunityCreateManyInput => ({
    authorName: E2E_NAMES.professor,
    authorTitle: 'Professor',
    professorId: E2E_IDS.professor,
    institution: universities[0].name,
    labName: E2E_NAMES.lab,
    country: 'Germany',
    city: 'Berlin',
    source: 'lab_website',
    sourceUrl: link(`posts/${o.id}`),
    postedAt: inDays(-3),
    content: 'We are hiring! A fully funded position in our test lab. Apply via the link.',
    funding: 'Full Funding',
    fundingTags: ['Full Funding'],
    degreeLevels: ['MASTERS', 'PHD'],
    fieldTags: ['HCI'],
    subjectTags: ['Human-Computer Interaction (HCI)'],
    minCgpa: 3.0,
    publications: 'preferred',
    positionType: 'PhD position',
    startDate: 'Fall 2027',
    deadline: inDays(45),
    positionDetails: [{ label: 'Duration', value: '4 years' }],
    aboutLab: 'The E2E Test Lab builds tools for designers.',
    applySteps: ['Send CV', 'Send a research statement'],
    contactEmail: `${E2E_IDS.professor}@example.test`,
    officialUrl: link(`jobs/${o.id}`),
    ...o,
  });

  const opportunities = [
    opportunity({ id: E2E_IDS.opportunity, title: 'E2E PhD in Human-Computer Interaction' }),
    opportunity({ id: E2E_IDS.opportunityMasters, title: 'E2E Funded Masters in Data Visualization', authorName: 'Dr. Cleo Mockley', professorId: 'e2e_prof_vis', institution: universities[1].name, labName: 'E2E Visualization Group', country: 'Switzerland', city: 'Zurich', degreeLevels: ['MASTERS'], fieldTags: ['Visualization'], subjectTags: ['Data Science & Analytics'], positionType: 'Masters scholarship' }),
    opportunity({ id: E2E_IDS.opportunityNoDeadline, title: 'E2E Rolling Research Call', subjectTags: ['Computer Science'], deadline: null, startDate: null, postedAt: inDays(-10) }),
    // No country: the default country filter hides it, so specs that want it clear the filter first
    opportunity({ id: E2E_IDS.opportunityNoCountry, title: 'E2E Remote Research Assistant', country: '', city: null, professorId: null, authorName: 'E2E Recruiter', source: 'web', minCgpa: null, publications: 'none' }),
    // Visible in the feed, but asks for a CGPA above the e2e student's 3.82, so "Eligible Now" drops it
    opportunity({ id: E2E_IDS.opportunityDemanding, title: 'E2E Demanding Masters in Machine Learning', authorName: 'Dr. Eve Stubbs', professorId: 'e2e_prof_uk', institution: 'E2E London College', labName: null, country: 'United Kingdom', city: 'London', fieldTags: ['Machine Learning'], subjectTags: ['Artificial Intelligence'], minCgpa: 3.95, publications: 'required' }),
    opportunity({ id: 'e2e_opp_partial', title: 'E2E Partially Funded Masters', subjectTags: ['Computer Science'], degreeLevels: ['MASTERS'], funding: 'Partial Funding', fundingTags: ['Partial Funding'], postedAt: inDays(-20) }),
  ];

  const paper = (p: Partial<Prisma.ResearchPaperCreateManyInput> & Pick<Prisma.ResearchPaperCreateManyInput, 'id' | 'title'>): Prisma.ResearchPaperCreateManyInput => ({
    abstract: 'A made-up abstract for the e2e test suite. It describes a study that never happened.',
    year: 2026,
    publishedAt: inDays(-30),
    venue: 'E2E Conference on Test Systems',
    venueShort: 'E2E 2026',
    paperType: 'Conference paper',
    peerReviewed: true,
    citationCount: 10,
    pdfUrl: link(`papers/${p.id}.pdf`),
    googleScholarUrl: link(`scholar/${p.id}`),
    fieldsOfStudy: ['Computer Science'],
    tags: ['HCI'],
    isOpenAccess: true,
    institution: universities[0].name,
    ...p,
  });

  const papers = [
    paper({ id: E2E_IDS.paper, title: E2E_NAMES.paperTitle, citationCount: 120, tags: ['HCI', 'Generative AI'], keyFindings: [{ label: 'Speed', text: 'Designers worked faster', value: '2x', met: true }] }),
    paper({ id: 'e2e_paper_vis', title: 'E2E Visualization Study', tags: ['Data Visualization'], institution: universities[1].name, year: 2025 }),
    paper({ id: 'e2e_paper_access', title: 'E2E Accessibility Audit Methods', tags: ['Accessibility'], citationCount: 4 }),
    paper({ id: 'e2e_paper_ml', title: 'E2E Small Models for Test Data', tags: ['Machine Learning'], paperType: 'Preprint', peerReviewed: false, isOpenAccess: false, pdfUrl: null }),
    paper({ id: 'e2e_paper_old', title: 'E2E Older Interaction Paper', year: 2024, publishedAt: inDays(-700), citationCount: 55 }),
  ];

  const paperAuthors: Prisma.PaperAuthorCreateManyInput[] = [
    { paperId: E2E_IDS.paper, position: 0, name: E2E_NAMES.professor, institution: universities[0].name, professorId: E2E_IDS.professor },
    { paperId: E2E_IDS.paper, position: 1, name: 'Dr. Ben Testmore', institution: universities[0].name, professorId: E2E_IDS.professorSimilar },
    { paperId: 'e2e_paper_vis', position: 0, name: 'Dr. Cleo Mockley', institution: universities[1].name, professorId: 'e2e_prof_vis' },
    { paperId: 'e2e_paper_access', position: 0, name: 'Dr. Dan Fixture', professorId: 'e2e_prof_closed' },
    { paperId: 'e2e_paper_ml', position: 0, name: 'Dr. Eve Stubbs', professorId: 'e2e_prof_uk' },
    { paperId: 'e2e_paper_old', position: 0, name: E2E_NAMES.professor, professorId: E2E_IDS.professor },
  ];

  return { scholarships, universities, labs, professors, grants, opportunities, papers, paperAuthors };
}
