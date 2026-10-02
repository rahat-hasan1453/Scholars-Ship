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
    notes?: string;
  };
  /** One-line admission bar shown on cards, e.g. "CGPA 3.2+, GRE Recommended, No Gap Time Restrictions" */
  admissionSummary?: string;
  /** Monthly cost of living at the study location, e.g. "Affordable Urban Living ($1,000/mo)" */
  livingCost?: string;
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
}


