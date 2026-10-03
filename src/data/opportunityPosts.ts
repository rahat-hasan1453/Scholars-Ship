// Opportunity Feed listings: the mock hiring posts plus the fields the card (Figma 212:6186) and the
// details page (Figma 258:3269) need. Example data — ranks, acceptance rates and living costs are rough
// estimates for layout, not verified figures. Seeded into the Opportunity table by `npm run db:seed`.
import type { HiringOpportunity, Opportunity } from '@/types';
import { mockOpportunities } from '@/data/mockOpportunities';
import {
  aboutLabFor,
  admissionLine,
  defaultApplySteps,
  fundingTagsFor,
  normalizeCountry,
  positionTypeFor,
  primaryDegree,
  subjectTagsFor,
} from '@/lib/opportunityDetails';

type Extra = {
  city: string;
  rankRange: string;
  acceptanceRate: number;
  livingCost: string;
  startDate: string;
  deadline: string;
  duration: string;
  pay: string;
  teaching: string;
  benefits: string;
  minIelts: number;
  minCgpa: number;
  publications: Opportunity['publications'];
};

const EXTRAS: Record<string, Extra> = {
  opp_arkansas_ux_01: { city: 'Jonesboro', rankRange: '1000+', acceptanceRate: 75, livingCost: 'Very Affordable ($800/mo)', startDate: 'January 2027', deadline: '2026-11-15', duration: '2 years', pay: '$1,400 / month', teaching: 'Up to 20 hrs / week', benefits: 'Tuition waiver, health insurance', minIelts: 6.0, minCgpa: 2.65, publications: 'none' },
  opp_lamar_ux_02: { city: 'Beaumont', rankRange: '1000+', acceptanceRate: 70, livingCost: 'Affordable ($900/mo)', startDate: 'January 2027', deadline: '2026-11-01', duration: '2 years', pay: '$1,400 / month', teaching: 'Up to 20 hrs / week', benefits: 'Tuition waiver', minIelts: 6.0, minCgpa: 3.0, publications: 'none' },
  opp_bremen_ux_03: { city: 'Bremen', rankRange: '500 – 600', acceptanceRate: 55, livingCost: 'Affordable City (€950/mo)', startDate: 'April 2027', deadline: '2026-12-15', duration: '2 years', pay: '$1,400 / month', teaching: 'Up to 10 hrs / week', benefits: 'No tuition, semester ticket', minIelts: 6.5, minCgpa: 3.0, publications: 'none' },
  opp_cmu_hcii_ux_01: { city: 'Pittsburgh', rankRange: '50 – 100', acceptanceRate: 10, livingCost: 'Moderate Cost ($1,500/mo)', startDate: 'August 2027', deadline: '2026-12-01', duration: '5 years', pay: '$46,000 / year', teaching: 'Up to 2 semesters', benefits: 'Health insurance, conference travel', minIelts: 7.0, minCgpa: 3.5, publications: 'preferred' },
  opp_ucsd_designlab_02: { city: 'San Diego', rankRange: '50 – 100', acceptanceRate: 15, livingCost: 'High Cost City ($2,000/mo)', startDate: 'September 2027', deadline: '2026-12-10', duration: '5 years', pay: '$44,500 / year', teaching: 'TA quarters as assigned', benefits: 'Health insurance, summer support', minIelts: 7.0, minCgpa: 3.4, publications: 'preferred' },
  opp_ucl_uclic_ux_03: { city: 'London', rankRange: '1 – 10', acceptanceRate: 12, livingCost: 'High Cost City (£1,600/mo)', startDate: 'October 2027', deadline: '2027-01-15', duration: '4 years', pay: '£22,278 / year', teaching: 'Optional, paid separately', benefits: 'Tax-free stipend, London weighting', minIelts: 7.0, minCgpa: 3.5, publications: 'preferred' },
  opp_hpi_baudisch_ux_04: { city: 'Potsdam', rankRange: '300 – 500', acceptanceRate: 20, livingCost: 'Moderate Cost (€1,100/mo)', startDate: 'March 2027', deadline: '2026-12-31', duration: '4 years', pay: '€54,000 / year', teaching: 'Up to 2 hrs / week', benefits: 'Pension, health care', minIelts: 7.0, minCgpa: 3.3, publications: 'preferred' },
  opp_stanford_ai_01: { city: 'Stanford', rankRange: '1 – 10', acceptanceRate: 5, livingCost: 'High Cost City ($2,400/mo)', startDate: 'September 2027', deadline: '2026-12-01', duration: '5 years', pay: '$54,000 / year', teaching: '1–2 quarters', benefits: 'Health insurance, housing priority', minIelts: 7.5, minCgpa: 3.7, publications: 'required' },
  opp_harvard_wyss_02: { city: 'Boston', rankRange: '1 – 10', acceptanceRate: 6, livingCost: 'High Cost City ($2,200/mo)', startDate: 'September 2027', deadline: '2026-12-01', duration: '5 years', pay: '$48,500 / year', teaching: 'Up to 2 semesters', benefits: 'Health insurance', minIelts: 7.0, minCgpa: 3.6, publications: 'required' },
  opp_eth_energy_03: { city: 'Zurich', rankRange: '1 – 10', acceptanceRate: 20, livingCost: 'High Cost City (CHF 2,000/mo)', startDate: 'February 2027', deadline: '2026-11-30', duration: '4 years', pay: 'CHF 56,000 / year', teaching: 'Up to 20%', benefits: 'Pension, accident insurance', minIelts: 7.0, minCgpa: 3.5, publications: 'preferred' },
  opp_cambridge_quantum_04: { city: 'Cambridge', rankRange: '1 – 10', acceptanceRate: 10, livingCost: 'Moderate Cost (£1,300/mo)', startDate: 'October 2027', deadline: '2027-01-05', duration: '3.5 years', pay: '£22,000 / year', teaching: 'Optional supervisions', benefits: 'Tax-free stipend, college membership', minIelts: 7.5, minCgpa: 3.7, publications: 'preferred' },
  opp_oxford_econ_05: { city: 'Oxford', rankRange: '1 – 10', acceptanceRate: 8, livingCost: 'Moderate Cost (£1,350/mo)', startDate: 'October 2027', deadline: '2027-01-10', duration: '4 years', pay: '£19,500 / year', teaching: 'Optional tutorials', benefits: 'College membership', minIelts: 7.5, minCgpa: 3.7, publications: 'preferred' },
  opp_berkeley_autolab_06: { city: 'Berkeley', rankRange: '10 – 50', acceptanceRate: 7, livingCost: 'High Cost City ($2,200/mo)', startDate: 'August 2027', deadline: '2026-12-08', duration: '5 years', pay: '$3,900 / month', teaching: '1 semester as GSI', benefits: 'Health insurance', minIelts: 7.0, minCgpa: 3.6, publications: 'required' },
  opp_jhu_biomed_07: { city: 'Baltimore', rankRange: '20 – 50', acceptanceRate: 12, livingCost: 'Moderate Cost ($1,600/mo)', startDate: 'August 2027', deadline: '2026-12-01', duration: '5 years', pay: '$45,000 / year', teaching: '1 semester', benefits: 'Health insurance', minIelts: 7.0, minCgpa: 3.5, publications: 'preferred' },
  opp_carai_08: { city: 'Toronto', rankRange: '800 – 1000', acceptanceRate: 45, livingCost: 'High Cost City (CAD 1,700/mo)', startDate: 'January 2027', deadline: '2026-11-20', duration: '2–4 years', pay: 'CAD 28,000 / year', teaching: 'Up to 10 hrs / week', benefits: 'NSERC-funded stipend', minIelts: 6.5, minCgpa: 3.0, publications: 'none' },
  opp_mit_affective_13: { city: 'Cambridge, MA', rankRange: '1 – 10', acceptanceRate: 4, livingCost: 'High Cost City ($2,300/mo)', startDate: 'September 2027', deadline: '2026-12-15', duration: '5 years', pay: '$47,000 / year', teaching: 'Not required', benefits: 'Health insurance', minIelts: 7.5, minCgpa: 3.8, publications: 'required' },
  opp_uw_ubicomp_14: { city: 'Seattle', rankRange: '50 – 100', acceptanceRate: 15, livingCost: 'High Cost City ($1,800/mo)', startDate: 'September 2027', deadline: '2026-12-15', duration: '5 years', pay: '$42,000 / year', teaching: '1–2 quarters', benefits: 'Health insurance', minIelts: 7.0, minCgpa: 3.5, publications: 'preferred' },
  opp_tudelft_connected_15: { city: 'Delft', rankRange: '40 – 60', acceptanceRate: 20, livingCost: 'Moderate Cost (€1,200/mo)', startDate: 'February 2027', deadline: '2026-12-01', duration: '4 years', pay: '€2,872 – €3,670 / month', teaching: 'Up to 10%', benefits: 'Pension, holiday allowance', minIelts: 6.5, minCgpa: 3.2, publications: 'preferred' },
  opp_kaist_kixlab_16: { city: 'Daejeon', rankRange: '50 – 60', acceptanceRate: 30, livingCost: 'Affordable City (₩900,000/mo)', startDate: 'March 2027', deadline: '2026-11-30', duration: '2–5 years', pay: '₩1.8M / month', teaching: 'TA as assigned', benefits: 'Dormitory, research incentives', minIelts: 6.5, minCgpa: 3.2, publications: 'preferred' },
  opp_edinburgh_agents_17: { city: 'Edinburgh', rankRange: '20 – 40', acceptanceRate: 18, livingCost: 'Moderate Cost (£1,100/mo)', startDate: 'September 2027', deadline: '2027-01-20', duration: '3.5 years', pay: '£20,500 / year', teaching: 'Optional, paid separately', benefits: 'Tax-free stipend', minIelts: 6.5, minCgpa: 3.4, publications: 'preferred' },
  opp_nus_spatial_18: { city: 'Singapore', rankRange: '5 – 10', acceptanceRate: 15, livingCost: 'High Cost City (S$1,500/mo)', startDate: 'January 2027', deadline: '2026-11-15', duration: '4 years', pay: 'S$2,800 – S$3,500 / month', teaching: 'Up to 6 hrs / week', benefits: 'Research scholarship, medical cover', minIelts: 6.5, minCgpa: 3.4, publications: 'preferred' },
  opp_berkeley_autolab_19: { city: 'Berkeley', rankRange: '10 – 50', acceptanceRate: 7, livingCost: 'High Cost City ($2,200/mo)', startDate: 'August 2027', deadline: '2026-12-08', duration: '5 years', pay: '$45,000 / year', teaching: '1 semester as GSI', benefits: 'Health insurance', minIelts: 7.0, minCgpa: 3.6, publications: 'required' },
  opp_tum_mirmi_20: { city: 'Munich', rankRange: '20 – 40', acceptanceRate: 18, livingCost: 'High Cost City (€1,200/mo)', startDate: 'April 2027', deadline: '2026-12-31', duration: '3–4 years', pay: '€52,000 / year', teaching: 'Up to 4 hrs / week', benefits: 'Pension, health care', minIelts: 6.5, minCgpa: 3.3, publications: 'preferred' },
  opp_ubc_haptics_21: { city: 'Vancouver', rankRange: '30 – 40', acceptanceRate: 25, livingCost: 'High Cost City (CAD 1,900/mo)', startDate: 'September 2027', deadline: '2026-12-15', duration: '2–5 years', pay: 'CAD 30,000 / year', teaching: 'TA as assigned', benefits: 'Health & dental cover', minIelts: 6.5, minCgpa: 3.3, publications: 'preferred' },
  opp_gatech_health_22: { city: 'Atlanta', rankRange: '100 – 200', acceptanceRate: 20, livingCost: 'Moderate Cost ($1,200/mo)', startDate: 'August 2027', deadline: '2026-12-15', duration: '5 years', pay: '$36,000 / year', teaching: '1–2 semesters', benefits: 'Health insurance', minIelts: 7.0, minCgpa: 3.3, publications: 'preferred' },
  opp_ethz_cleanenergy_23: { city: 'Zurich', rankRange: '1 – 10', acceptanceRate: 20, livingCost: 'High Cost City (CHF 2,000/mo)', startDate: 'March 2027', deadline: '2026-12-31', duration: '4 years', pay: 'CHF 54,000 – 60,000 / year', teaching: 'Up to 20%', benefits: 'Pension, accident insurance', minIelts: 7.0, minCgpa: 3.5, publications: 'preferred' },
  opp_michigan_social_24: { city: 'Ann Arbor', rankRange: '40 – 60', acceptanceRate: 18, livingCost: 'Moderate Cost ($1,300/mo)', startDate: 'September 2027', deadline: '2026-12-01', duration: '5 years', pay: '$38,500 / year', teaching: '2 semesters as GSI', benefits: 'Health insurance', minIelts: 7.0, minCgpa: 3.4, publications: 'preferred' },
  opp_cambridge_quantum_25: { city: 'Cambridge', rankRange: '1 – 10', acceptanceRate: 10, livingCost: 'Moderate Cost (£1,300/mo)', startDate: 'October 2027', deadline: '2027-01-05', duration: '3.5 years', pay: '£19,237 / year', teaching: 'Optional supervisions', benefits: 'Tax-free stipend', minIelts: 7.5, minCgpa: 3.7, publications: 'preferred' },
  opp_oxford_trade_26: { city: 'Oxford', rankRange: '1 – 10', acceptanceRate: 8, livingCost: 'Moderate Cost (£1,350/mo)', startDate: 'October 2027', deadline: '2027-01-10', duration: '4 years', pay: '£18,622 / year', teaching: 'Optional tutorials', benefits: 'College membership', minIelts: 7.5, minCgpa: 3.7, publications: 'preferred' },
  opp_melbourne_cyber_27: { city: 'Melbourne', rankRange: '10 – 20', acceptanceRate: 25, livingCost: 'High Cost City (AUD 2,000/mo)', startDate: 'March 2027', deadline: '2026-12-01', duration: '3.5 years', pay: 'AUD 37,000 / year', teaching: 'Optional tutoring', benefits: 'Overseas health cover', minIelts: 6.5, minCgpa: 3.2, publications: 'preferred' },
};

export function toOpportunityListing(post: HiringOpportunity, x: Extra): Opportunity {
  const country = normalizeCountry(post.country);
  const base = {
    id: post.id,
    title: post.title,
    authorName: post.authorName,
    authorTitle: post.authorTitle,
    authorAvatar: post.authorAvatar,
    institution: post.institution,
    labName: post.labName,
    country,
    city: x.city,
    source: post.source,
    sourceUrl: post.sourceUrl,
    postedAt: new Date(`${post.postedDate}T00:00:00Z`).toISOString(),
    content: post.content,
    funding: post.funding,
    fundingTags: fundingTagsFor(post.funding, x.acceptanceRate),
    degreeLevels: post.degrees,
    fieldTags: post.fieldTags,
    subjectTags: subjectTagsFor(post.fieldTags),
    minCgpa: post.minCgpa ?? x.minCgpa,
    minIelts: x.minIelts,
    publications: x.publications,
    livingCost: x.livingCost,
    rankRange: x.rankRange,
    acceptanceRate: x.acceptanceRate,
    positionType: positionTypeFor(post.degrees, x.duration),
    startDate: x.startDate,
    deadline: new Date(`${x.deadline}T00:00:00Z`).toISOString(),
    positionDetails: [
      { label: primaryDegree(post.degrees) === 'PhD' ? 'Salary / stipend' : 'Stipend', value: x.pay },
      { label: 'Duration', value: x.duration },
      { label: 'Teaching duty', value: x.teaching },
      { label: 'Benefits', value: x.benefits },
    ],
    aboutLab: aboutLabFor(post),
    contactEmail: post.contactEmail,
    officialUrl: post.officialUrl,
  };
  return { ...base, admission: admissionLine(base), applySteps: defaultApplySteps(base) };
}

/** Every mock post that has card/details data, newest first */
export const OPPORTUNITY_LISTINGS: Opportunity[] = mockOpportunities
  .filter((p) => EXTRAS[p.id])
  .map((p) => toOpportunityListing(p, EXTRAS[p.id]))
  .sort((a, b) => b.postedAt.localeCompare(a.postedAt) || a.id.localeCompare(b.id));
