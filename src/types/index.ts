export type DegreeLevel = 'Bachelors' | 'Masters' | 'PhD';

export type FundingType = 'FULL' | 'PARTIAL' | 'TUITION_WAIVER' | 'RESEARCH_ASSISTANTSHIP';

export type ApplicationStatus = 
  | 'Wishlist' 
  | 'Preparing' 
  | 'Submitted' 
  | 'Under Review' 
  | 'Decided';

export type DecisionResult = 'Pending' | 'Accepted' | 'Waitlisted' | 'Rejected';

export interface TestScores {
  ielts?: number;
  toefl?: number;
  gre?: number;
  gmat?: number;
}

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  degreeLevel: DegreeLevel;
  specializations: string[];
  targetCountries: string[];
  cgpa: number;
  testScores: TestScores;
  onboardingCompleted: boolean;
  avatar?: string;
  /** Profile page fields without a column of their own (saved in UserProfile.details) */
  details?: ProfileDetails;
}

export interface ProfileDetails {
  bio?: string;
  field?: string;
  gradYear?: string;
  intake?: string;
  /** Email notification choices on My Profile → Account (default: both on) */
  notifications?: { deadlines: boolean; digest: boolean };
}

export interface Scholarship {
  id: string;
  title: string;
  provider: string;
  deadline: string; // ISO date string
  fundingAmount: string;
  fundingType: FundingType;
  degreeLevels: DegreeLevel[];
  countries: string[];
  specializations: string[];
  requirements: {
    minCgpa?: number;
    minIelts?: number;
    minToefl?: number;
    minGre?: number;
    minWorkYears?: number;
    notes?: string;
  };
  /** One-line admission bar shown on cards, e.g. "CGPA 3.2+, GRE Recommended, No Gap Time Restrictions" */
  admissionSummary?: string;
  /** Monthly cost of living at the study location, e.g. "Affordable Urban Living ($1,000/mo)" */
  livingCost?: string;
  /** Short provider name, e.g. "DAAD" */
  providerShort?: string;
  fieldOfStudy?: string;
  /** Rows for the details page Funding section */
  fundingBreakdown?: { label: string; value: string }[];
  applySteps?: string[];
  /** ISO date the listing was added (database rows only) */
  createdAt?: string;
  officialUrl: string;
  description: string;
  featured?: boolean;
  tags: string[];
}

export interface Professor {
  id: string;
  name: string;
  title: string;
  university: string;
  department: string;
  country: string;
  labName?: string;
  researchTags: string[];
  openPositions: boolean;
  recentGrants?: string;
  email?: string;
  linkedInUrl?: string;
  googleScholar?: string;
  labWebsite?: string;
  avatarUrl: string;
  acceptingTerms: string[];
  bio?: string;
  // Lab funding (Prisma: ResearchLab)
  fundingSummary?: string;
  fundingType?: 'FULL' | 'PARTIAL';
  fundingSource?: string;
  degreeLevels?: DegreeLevel[];
  // Details page (Figma 258:3503)
  /** School or faculty inside the university, e.g. "School of EECS" */
  school?: string;
  city?: string;
  phdStudents?: number;
  postdocs?: number;
  publicationCount?: number;
  hIndex?: number;
  openPositionCount?: number;
  recentGrant?: ProfessorGrant;
  lookingFor?: LookingFor;
  contactSteps?: string[];
  recentPapers?: ProfessorPaper[];
  /** ISO date the profile was last updated (database rows only) */
  updatedAt?: string;
}

export interface ProfessorGrant {
  /** "SEK 4.2M" */
  amount: string;
  title: string;
  year?: number;
}

/** "What They Look For" checklist on the Faculty details page (a type alias so it fits Prisma's Json column) */
export type LookingFor = {
  /** "Master's in HCI, CS or Design" */
  degree: string;
  minCgpa?: number;
  minIelts?: number;
  minToefl?: number;
  /** "Prior user studies" */
  experience?: string;
  publications: 'none' | 'preferred' | 'required';
};

export interface ProfessorPaper {
  id: string;
  title: string;
  venue?: string;
  year?: number;
}

export interface ApplicationTask {
  id: string;
  title: string;
  isCompleted: boolean;
  dueDate?: string;
}

export interface Application {
  id: string;
  scholarshipId: string;
  scholarship: Scholarship;
  status: ApplicationStatus;
  decision: DecisionResult;
  notes: string;
  deadline: string;
  tasks: ApplicationTask[];
  updatedAt: string;
}

export type OutreachStatus = 
  | 'Prospect' 
  | 'Drafting' 
  | 'Email Sent' 
  | 'Follow-up Due' 
  | 'Interview' 
  | 'Funded Offer';

export interface HiringOpportunity {
  id: string;
  authorName: string;
  authorTitle: string;
  authorAvatar?: string;
  institution: string;
  labName?: string;
  source: 'linkedin' | 'twitter' | 'lab_website' | 'web' | 'reddit';
  sourceUrl: string;
  postedAgo: string;
  postedDate: string;
  title: string;
  content: string;
  funding: string;
  degrees: DegreeLevel[];
  fieldTags: string[];
  matchType?: 'exact' | 'similar' | 'broad';
  isBookmarked?: boolean;
  contactEmail?: string;
  recentPaperTopic?: string;
  country: string;
  minCgpa?: number;
  officialUrl?: string;
}

export type OpportunitySource = HiringOpportunity['source'];

/** One Opportunity Feed listing: a funded position posted by a professor or lab. */
export interface Opportunity {
  id: string;
  title: string;
  authorName: string;
  authorTitle: string;
  authorAvatar?: string;
  institution: string;
  labName?: string;
  /** Same values as the Country filter, e.g. "United Kingdom" */
  country: string;
  city?: string;
  source: OpportunitySource;
  sourceUrl: string;
  postedAt: string; // ISO date
  content: string;
  funding: string;
  fundingTags: string[];
  degreeLevels: DegreeLevel[];
  fieldTags: string[];
  subjectTags: string[];
  minCgpa?: number;
  minIelts?: number;
  publications: 'none' | 'preferred' | 'required';
  admission: string;
  livingCost: string;
  rankRange: string;
  acceptanceRate: number;
  positionType: string;
  startDate: string;
  deadline: string; // ISO date
  positionDetails: { label: string; value: string }[];
  aboutLab: string;
  applySteps: string[];
  contactEmail?: string;
  officialUrl?: string;
}

export interface OutreachRecord {
  id: string;
  opportunityId?: string;
  professorId?: string;
  professorName: string;
  labName?: string;
  institution: string;
  status: OutreachStatus;
  notes: string;
  lastContactDate?: string;
  nextFollowUpDate?: string;
  coldEmailDraft?: string;
  emailSubject?: string;
  updatedAt: string;
  country?: string;
  sourceUrl?: string;
}

export interface ResearchPaperAuthor {
  name: string;
  institution?: string;
  googleScholarUrl?: string;
  /** Set when the author is a Professor in our database (links to /professors/<id>) */
  professorId?: string;
}

/** One row of a paper's Key Findings; `met: false` marks a caveat or risk */
export interface PaperFinding {
  label: string;
  text: string;
  value: string;
  met: boolean;
}

export interface ResearchPaper {
  id: string;
  title: string;
  authors: ResearchPaperAuthor[];
  abstract: string;
  publicationDate: string;
  year: number;
  venue: string;
  citationCount: number;
  fieldsOfStudy: string[];
  tags: string[];
  doi?: string;
  pdfUrl?: string;
  googleScholarUrl: string;
  semanticScholarUrl?: string;
  isOpenAccess: boolean;
  isSaved?: boolean;
  /** Details modal fields; missing means unknown and the row is hidden */
  venueShort?: string;
  paperType?: string;
  peerReviewed?: boolean;
  institution?: string;
  funding?: string;
  keyFindings?: PaperFinding[];
}


