import { describe, it, expect } from 'vitest';
import { institutionOverlap, isSamePerson, latestAward, formatUsd, titleCase, toGrant, type NihProject } from '../../prisma/import/nihMatch';

const project = (over: Partial<NihProject> & { org?: string; pi?: [string, string] } = {}): NihProject => ({
  fiscal_year: 2025,
  project_num: '1R01LM013772-01A1',
  project_title: 'TARGETED SUMMARIZATION OF RECORDS',
  award_amount: 304000,
  project_detail_url: 'https://reporter.nih.gov/project-details/1',
  organization: { org_name: over.org ?? 'NORTHEASTERN UNIVERSITY' },
  principal_investigators: [{ first_name: over.pi?.[0] ?? 'Byron', last_name: over.pi?.[1] ?? 'Wallace', is_contact_pi: true }],
  ...over,
});
const wallace = { name: 'Byron C. Wallace', university: 'Northeastern University' };

describe('institution overlap', () => {
  it('abbreviated NIH names still match', () => {
    expect(institutionOverlap('University of North Carolina at Chapel Hill', 'UNIV OF NORTH CAROLINA CHAPEL HILL')).toBe(1);
    expect(institutionOverlap('University of California San Diego (UCSD)', 'UNIVERSITY OF CALIFORNIA, SAN DIEGO')).toBe(1);
  });
  it('similar but different institutions stay apart', () => {
    expect(institutionOverlap('Georgia Institute of Technology', 'GEORGIA STATE UNIVERSITY')).toBeLessThan(0.6);
    expect(institutionOverlap('Massachusetts Institute of Technology', 'UNIVERSITY OF MASSACHUSETTS AMHERST')).toBeLessThan(0.6);
    expect(institutionOverlap('The University of Texas at Austin', 'UNIVERSITY OF TEXAS DALLAS')).toBeLessThan(0.6);
  });
});

describe('isSamePerson', () => {
  it('matches last name, start of first name and institution', () => {
    expect(isSamePerson(wallace, project())).toBe(true);
    expect(isSamePerson({ name: 'Byron Wallace', university: 'Northeastern University' }, project({ pi: ['Byron', 'WALLACE'] }))).toBe(true);
  });
  it('a different institution is a different person', () => {
    expect(isSamePerson(wallace, project({ org: 'UNIVERSITY OF UTAH' }))).toBe(false);
  });
  it('a different first name is a different person', () => {
    expect(isSamePerson(wallace, project({ pi: ['Alan', 'Wallace'] }))).toBe(false);
  });
  it('a last name that only contains ours is not a match (NIH searches loosely)', () => {
    expect(isSamePerson({ name: 'Ann Hammer', university: 'Northeastern University' }, project({ pi: ['Ann', 'Niethammer'] }))).toBe(false);
  });
  it('a co-PI counts', () => {
    const p = project();
    p.principal_investigators = [{ first_name: 'Sam', last_name: 'Lee' }, { first_name: 'Byron', last_name: 'Wallace' }];
    expect(isSamePerson(wallace, p)).toBe(true);
  });
});

describe('latestAward and the grant row', () => {
  it('takes the newest year, then the biggest amount', () => {
    const a = project({ fiscal_year: 2024, award_amount: 900000 });
    const b = project({ fiscal_year: 2025, award_amount: 100000, project_num: '1R21XX000001-01' });
    expect(latestAward(wallace, [a, b])).toBe(b);
  });
  it('is undefined when nobody matches', () => {
    expect(latestAward(wallace, [project({ org: 'UNIVERSITY OF UTAH' })])).toBeUndefined();
  });
  it('formats like the NSF amounts and turns the CAPS title readable', () => {
    expect(formatUsd(1398633)).toBe('$1.4M');
    expect(formatUsd(327748)).toBe('$328K');
    expect(titleCase('DEVELOPMENT OF A "SMART AVIARY" TO PROBE NEURAL DYNAMICS')).toBe('Development of a "Smart Aviary" to Probe Neural Dynamics');
    expect(titleCase('AN AI PLATFORM FOR EHR DISPLAY')).toBe('An AI Platform for EHR Display');
    expect(toGrant('prof_x', project())).toMatchObject({ funder: 'NIH', amount: '$304K', year: 2025, id: 'nih_R01LM013772_prof_x', title: 'Targeted Summarization of Records' });
  });
});
