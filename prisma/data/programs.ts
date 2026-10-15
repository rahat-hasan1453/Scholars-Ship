// HCI / UX / human-factors study programmes (Master's and PhD), shown in the Opportunity Feed as "Programme listing".
// Source: the user's Master's shortlist (Oct 2026), re-checked against the official or DAAD pages on 2026-10-09.
//
// Rules for this file:
// - Only facts a page stated. When sources disagree or the 2027 intake isn't published, say so in words; never copy a number that
//   could not be confirmed (several figures in the shortlist differed from the official pages and were left out).
// - `tier: 'checked'` programmes have details read on an official page. `tier: 'basic'` ones only have identity facts
//   (name, place, degree, official link); their cards say fees and deadlines are on the official page.
// - `deadline` is set only when an official page gives a date.
import type { DegreeLevel, Opportunity } from '../../src/types';
import { subjectTagsFor } from '../../src/lib/opportunityDetails';

const CHECKED_ON = '2026-10-09T00:00:00Z';
const BASIC_NOTE = 'Fees, deadlines and entry requirements are on the official programme page.';

type Program = {
  slug: string;
  tier: 'checked' | 'basic';
  title: string;
  institution: string;
  country: string;
  city?: string;
  degree: DegreeLevel;
  fields: string[];
  url: string;
  funding: string;
  summary: string;
  admission?: string;
  minIelts?: number;
  minCgpa?: number;
  deadline?: string;
  details?: { label: string; value: string }[];
};

const PROGRAMS: Program[] = [
  {
    slug: 'siegen_hci', tier: 'checked', title: 'Human-Computer Interaction MSc', institution: 'University of Siegen', country: 'Germany', city: 'Siegen',
    degree: 'Masters', fields: ['Human-Computer Interaction', 'Computer Science'],
    url: 'https://www2.daad.de/deutschland/studienangebote/international-programmes/en/detail/4686',
    funding: 'No tuition fee; a semester fee applies',
    summary: 'Four-semester, English-taught master’s programme in human-computer interaction. No German certificate is needed.',
    admission: 'Bachelor’s in a related field such as computer science, business information systems, design, psychology or sociology.',
    minIelts: 6.5,
    details: [
      { label: 'Duration', value: '4 semesters, taught in English' },
      { label: 'English', value: 'CEFR B2 (IELTS 6.5 or TOEFL iBT 94, per DAAD and listings)' },
      { label: 'Application', value: 'DAAD lists winter semester 1 May – 1 June and summer semester 1 Nov – 15 Jan. Other sources give different dates, so confirm with the university.' },
      { label: 'Fees', value: 'No tuition; semester fee of about €321 (listing)' },
    ],
  },
  {
    slug: 'trento_hci', tier: 'checked', title: 'Human-Computer Interaction MSc', institution: 'University of Trento', country: 'Italy',
    degree: 'Masters', fields: ['Human-Computer Interaction', 'Cognitive Science'],
    url: 'https://corsi.unitn.it/en/node/161',
    funding: 'Tuition depends on selection score (full waiver for 90–100); limited scholarships for top non-EU applicants',
    summary: 'Master’s in HCI. For non-EU applicants living abroad, tuition is set by the selection score and the best scores get a full waiver.',
    admission: 'Bachelor’s degree, English at B2, and preparation in information science and/or psychology shown by bachelor’s exams.',
    details: [
      { label: 'Tuition (non-EU, living abroad)', value: '€1,000 – €6,500 a year by selection score; full waiver for scores 90–100' },
      { label: 'Scholarships', value: 'A limited number for top-scored non-EU applicants abroad (2 in 2024/25)' },
      { label: 'Application', value: 'The 2026/27 call closed on 29 May. The 2027/28 call was not published yet; check corsi.unitn.it.' },
    ],
  },
  {
    slug: 'uppsala_hci', tier: 'checked', title: 'Human–Computer Interaction MSc', institution: 'Uppsala University', country: 'Sweden', city: 'Uppsala',
    degree: 'Masters', fields: ['Human-Computer Interaction', 'Computer Science'],
    url: 'https://www.uu.se/en/admissions/bachelor/programme/?pKod=SMD2M',
    funding: 'Tuition fee applies to non-EU/EEA students; Uppsala scholarships are a separate round',
    summary: 'Two-year, English-taught master’s in human–computer interaction, applied for through the national portal universityadmissions.se.',
    admission: 'Bachelor’s degree plus at least 30 credits in IT-related subjects (recent versions also accept design, psychology or sociology).',
    details: [
      { label: 'Application', value: 'Opens mid-October 2026 and closes mid-January 2027 on universityadmissions.se' },
      { label: 'Application fee', value: 'SEK 900 for non-EU/EEA applicants (listing)' },
      { label: 'Tuition', value: 'The 2027 fee is not confirmed; see uu.se' },
      { label: 'Scholarships', value: 'Uppsala’s scholarship round opens in early 2027 and covers tuition only (per listings)' },
    ],
  },
  {
    slug: 'chalmers_idt', tier: 'checked', title: 'Interaction Design and Technologies MSc', institution: 'Chalmers University of Technology', country: 'Sweden', city: 'Gothenburg',
    degree: 'Masters', fields: ['Interaction Design', 'Human-Computer Interaction', 'Computer Science'],
    url: 'https://www.chalmers.se/en/education/find-masters-programme/interaction-design-and-technologies-msc/',
    funding: 'Tuition fee applies to non-EU/EEA students; the amount differs between sources',
    summary: 'Two-year, 120-credit master’s programme taught in English at Lindholmen, Gothenburg.',
    details: [
      { label: 'Duration', value: '2 years (120 credits)' },
      { label: 'Application', value: 'Mid-October to mid-January' },
      { label: 'Tuition', value: 'Charged to non-EU/EEA students; confirm the current amount on chalmers.se' },
    ],
  },
  {
    slug: 'malmo_interaction_design', tier: 'checked', title: 'Interaction Design (one-year) MSc', institution: 'Malmö University', country: 'Sweden', city: 'Malmö',
    degree: 'Masters', fields: ['Interaction Design', 'UX Design'],
    url: 'https://mau.se/en/study-education/programme/taine',
    funding: 'Programme fee for international students; EU/EEA students generally pay none',
    summary: 'One-year, 60-credit master’s in interaction design in Malmö. A separate two-year version also exists.',
    admission: 'Bachelor’s in a relevant subject and approved supporting documents including work samples (two-year syllabus).',
    details: [
      { label: 'Programme fee', value: 'SEK 195,000 for international students on the current mau.se page (it has changed before; check the 2027 intake)' },
      { label: 'Application', value: 'Swedish master’s applications usually close in mid-January; confirm on mau.se or antagning.se' },
    ],
  },
  {
    slug: 'umea_hcixd', tier: 'checked', title: 'Human–Computer Interaction and User Experience MSc', institution: 'Umeå University', country: 'Sweden', city: 'Umeå',
    degree: 'Masters', fields: ['Human-Computer Interaction', 'UX Design', 'Informatics'],
    url: 'https://www.umu.se/en/education/master/masters-programme-in-human-computer-interaction-and-user-experience',
    funding: 'Tuition fee applies to non-EU/EEA students',
    summary: 'Two-year, 120-credit, English-taught master’s on designing and evaluating digital products and services around user experience.',
    admission: 'Bachelor’s of at least 180 ECTS including 90 ECTS in informatics, computer science, information systems, cognitive science or equivalent; English B/6.',
    details: [
      { label: 'Application', value: 'Last round: opened 16 Oct 2025, closed 15 Jan 2026. The 2027 round was not published yet.' },
      { label: 'Application fee', value: 'SEK 900 for non-EU/EEA applicants' },
      { label: 'Tuition', value: 'SEK 304,600 in total was listed for the 2025 round; check the current figure' },
    ],
  },
  {
    slug: 'carleton_mhci', tier: 'checked', title: 'Master of Human-Computer Interaction', institution: 'Carleton University', country: 'Canada', city: 'Ottawa',
    degree: 'Masters', fields: ['Human-Computer Interaction', 'Cognitive Science', 'Design'],
    url: 'https://graduate.carleton.ca/program/human-computer-interaction-masters/',
    funding: 'Not stated on the programme page',
    summary: 'Master’s in HCI open to many backgrounds, not only computer science.',
    admission: 'Honours degree (or equivalent) with at least a B+ average in a related field: arts, social sciences, cognitive science, business, computer science, IT, engineering, architecture or design.',
    details: [
      { label: 'Application', value: 'No deadline was found on the programme page; confirm with Carleton graduate admissions' },
      { label: 'Requirements', value: 'Transcripts, letters of reference and a statement of interest (2024–25 calendar)' },
    ],
  },
  {
    slug: 'iowa_state_hci', tier: 'checked', title: 'MS Human Computer Interaction (thesis)', institution: 'Iowa State University', country: 'USA', city: 'Ames',
    degree: 'Masters', fields: ['Human-Computer Interaction'],
    url: 'https://www.hci.iastate.edu/hci/masters',
    funding: 'Thesis route: a supervising faculty member typically funds a half-time research assistantship',
    summary: 'Master’s in HCI with a thesis route (a professor must agree to supervise you first) and a non-thesis route.',
    admission: 'Accredited bachelor’s degree, GPA 3.0 or equivalent; statement of purpose, CV and three recommendation letters; GRE optional.',
    minCgpa: 3.0, deadline: '2027-01-15T23:59:00Z',
    details: [
      { label: 'Deadlines', value: '15 January for fall admission, 1 September for spring' },
      { label: 'Funding', value: 'Assistantships are arranged with a faculty supervisor; contact faculty before applying' },
    ],
  },
  { slug: 'tallinn_hci', tier: 'basic', title: 'Human-Computer Interaction MSc', institution: 'Tallinn University', country: 'Estonia', city: 'Tallinn', degree: 'Masters', fields: ['Human-Computer Interaction'], url: 'https://estonia.dreamapply.com/courses/course/51', funding: 'See the official page', summary: 'Master’s programme in human-computer interaction.' },
  { slug: 'eka_interaction_design', tier: 'basic', title: 'Interaction Design MA', institution: 'Estonian Academy of Arts', country: 'Estonia', city: 'Tallinn', degree: 'Masters', fields: ['Interaction Design'], url: 'https://www.artun.ee/en', funding: 'See the official page', summary: 'Master’s programme in interaction design.' },
  { slug: 'rheinwaal_usability', tier: 'basic', title: 'Usability Engineering MSc', institution: 'Rhine-Waal University of Applied Sciences', country: 'Germany', city: 'Kamp-Lintfort', degree: 'Masters', fields: ['Usability', 'Human-Computer Interaction'], url: 'https://www.hochschule-rhein-waal.de/en/academics/prospective-students/current-application-period/masters-programmes', funding: 'See the official page', summary: 'Master’s programme in usability engineering.' },
  { slug: 'weimar_hci', tier: 'basic', title: 'Human-Computer Interaction MSc', institution: 'Bauhaus-Universität Weimar', country: 'Germany', city: 'Weimar', degree: 'Masters', fields: ['Human-Computer Interaction'], url: 'https://www.uni-weimar.de/en/media/studies/human-computer-interaction-msc/faqs/', funding: 'See the official page', summary: 'Master’s programme in human-computer interaction.' },
  { slug: 'michigantech_acshf', tier: 'basic', title: 'Applied Cognitive Science & Human Factors MS', institution: 'Michigan Technological University', country: 'USA', city: 'Houghton', degree: 'Masters', fields: ['Human Factors', 'Cognitive Science'], url: 'https://www.mtu.edu/psychology/graduate/', funding: 'See the official page', summary: 'Master’s programme in applied cognitive science and human factors.' },
  { slug: 'ttu_human_factors', tier: 'basic', title: 'Human Factors PhD', institution: 'Texas Tech University', country: 'USA', city: 'Lubbock', degree: 'PhD', fields: ['Human Factors', 'Psychology'], url: 'https://www.depts.ttu.edu/psy/humanfactors/program.php', funding: 'See the official page', summary: 'Doctoral programme in human factors psychology.' },
  { slug: 'odu_human_factors', tier: 'basic', title: 'Human Factors Psychology PhD', institution: 'Old Dominion University', country: 'USA', city: 'Norfolk', degree: 'PhD', fields: ['Human Factors', 'Psychology'], url: 'https://odu.edu/node/762671', funding: 'See the official page', summary: 'Doctoral programme in human factors psychology.' },
  { slug: 'clemson_hcc', tier: 'basic', title: 'Human-Centered Computing PhD', institution: 'Clemson University', country: 'USA', city: 'Clemson', degree: 'PhD', fields: ['Human-Computer Interaction', 'Computer Science'], url: 'https://www.clemson.edu/cecas/departments/computing/academics/graduates/faq.html', funding: 'See the official page', summary: 'Doctoral programme in human-centered computing.' },
  { slug: 'wichita_human_factors', tier: 'basic', title: 'Human Factors PhD', institution: 'Wichita State University', country: 'USA', city: 'Wichita', degree: 'PhD', fields: ['Human Factors', 'Psychology'], url: 'https://wichita.edu/academics/fairmount_las/psychology/graduate/humanfactors/humanfactorsphd.php', funding: 'See the official page', summary: 'Doctoral programme in human factors psychology.' },
  { slug: 'sdsi_erasmus_mundus', tier: 'basic', title: 'Service Design Strategies & Innovations (Erasmus Mundus MA)', institution: 'Art Academy of Latvia, University of Lapland, Estonian Academy of Arts', country: 'Latvia', degree: 'Masters', fields: ['Service Design', 'UX Design'], url: 'https://apply.sdsi.ma', funding: 'Erasmus Mundus scholarships are available; see the official page', summary: 'Joint master’s in service design taught across Latvia, Finland and Estonia.' },
];

export function programToOpportunity(p: Program): Opportunity {
  const content = [p.summary, p.admission, p.tier === 'basic' ? BASIC_NOTE : undefined].filter(Boolean).join('\n\n');
  return {
    id: `prog_${p.slug}`,
    title: `${p.title} at ${p.institution}`,
    authorName: p.institution,
    authorTitle: p.degree === 'PhD' ? 'PhD programme' : 'Master’s programme',
    institution: p.institution,
    country: p.country,
    city: p.city,
    source: 'university',
    sourceUrl: p.url,
    postedAt: CHECKED_ON,
    content,
    funding: p.funding,
    fundingTags: [], // never derived from free text: it would mislabel e.g. "scholarships are a separate round" as full funding
    degreeLevels: [p.degree],
    fieldTags: p.fields,
    subjectTags: subjectTagsFor(p.fields),
    minCgpa: p.minCgpa,
    minIelts: p.minIelts,
    publications: 'none',
    admission: p.admission,
    positionType: p.degree === 'PhD' ? 'PhD programme' : 'Master’s programme',
    deadline: p.deadline,
    positionDetails: p.details ?? [],
    applySteps: ['Open the official programme page', 'Check the current intake, deadline and entry requirements', 'Apply through the university’s application portal'],
    officialUrl: p.url,
  };
}

export const PROGRAM_OPPORTUNITIES: Opportunity[] = PROGRAMS.map(programToOpportunity);
