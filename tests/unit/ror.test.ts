import { describe, expect, it } from 'vitest';
import { createRorMatcher, resolveCountry, type RorRecord } from '@/lib/ingest/ror';
import goldenIndex from '../fixtures/ror-golden-index.json';
import { ROR_GOLDEN_POSTS } from '../fixtures/rorGolden';

const rec = (id: string, name: string, country: string, city: string, aliases: string[] = [], acronyms: string[] = []): RorRecord => ({
  id: `https://ror.org/${id}`, name, country, city, aliases, acronyms,
});

// Small hand-made index (real names, made-up ids) so the tests don't depend on the latest ROR release
const FIXTURE: RorRecord[] = [
  rec('bremen', 'University of Bremen', 'Germany', 'Bremen', ['Universität Bremen']),
  rec('tum', 'Technical University of Munich', 'Germany', 'Munich', ['Technische Universität München'], ['TUM']),
  rec('lmu', 'Ludwig-Maximilians-Universität München', 'Germany', 'Munich', ['University of Munich', 'LMU Munich'], ['LMU']),
  rec('eth', 'ETH Zurich', 'Switzerland', 'Zurich', ['Swiss Federal Institute of Technology in Zurich']),
  rec('mit', 'Massachusetts Institute of Technology', 'USA', 'Cambridge', [], ['MIT']),
  rec('ucl-uk', 'University College London', 'United Kingdom', 'London', [], ['UCL']),
  rec('ucl-be', 'Université Catholique de Louvain', 'Belgium', 'Louvain-la-Neuve', [], ['UCL', 'UCLouvain']),
  rec('kul', 'KU Leuven', 'Belgium', 'Leuven', ['Katholieke Universiteit Leuven']),
  rec('delft', 'Delft University of Technology', 'Netherlands', 'Delft', ['TU Delft']),
  rec('oxford', 'University of Oxford', 'United Kingdom', 'Oxford'),
  rec('kth', 'KTH Royal Institute of Technology', 'Sweden', 'Stockholm', [], ['KTH']),
  rec('epfl', 'École Polytechnique Fédérale de Lausanne', 'Switzerland', 'Lausanne', [], ['EPFL']),
  rec('stanford', 'Stanford University', 'USA', 'Stanford'),
  rec('sail', 'Steel Authority of India', 'India', 'New Delhi', [], ['SAIL']),
  rec('melb', 'The University of Melbourne', 'Australia', 'Melbourne'),
  rec('generic1', 'Research Institute', 'USA', 'Austin'),
  rec('generic2', 'Graduate School', 'Japan', 'Tokyo', ['Institute', 'College', 'Center']),
  rec('focus', 'Focus', 'Spain', 'Madrid'),
  rec('phd', 'Philosophical Hermeneutics Department', 'Italy', 'Rome', [], ['PHD']),
  rec('nus', 'National University of Singapore', 'Singapore', 'Singapore', [], ['NUS']),
  // Acronym owners that gave wrong countries in the prod dry-run (real ROR records)
  rec('dtp', 'Department of Transport and Planning', 'Australia', 'Melbourne', [], ['DTP']),
  rec('lcbc', 'Lake Chad Basin Commission', 'Chad', "N'Djamena", [], ['LCBC']),
  rec('differ', 'Dutch Institute for Fundamental Energy Research', 'Netherlands', 'Eindhoven', [], ['DIFFER']),
  rec('zmb', 'Center for Microscopy and Image Analysis', 'Switzerland', 'Zurich', [], ['ZMB']),
  rec('ibd', 'Freies Institut für Bauforschung und Dokumentation e.V.', 'Germany', 'Marburg', [], ['IBD']),
  rec('anr', 'University of California Division of Agriculture and Natural Resources', 'USA', 'Oakland', [], ['ANR']),
  rec('sdu', 'University of Southern Denmark', 'Denmark', 'Odense', ['Syddansk Universitet']),
];
const match = createRorMatcher(FIXTURE);

describe('matchInstitution (ROR)', () => {
  it('finds the country from a full university name', () => {
    expect(match('PhD position at the University of Bremen, apply now')).toEqual({
      rorId: 'https://ror.org/bremen', name: 'University of Bremen', country: 'Germany', city: 'Bremen',
    });
  });

  it('prefers the longest name: TUM, not LMU ("University of Munich")', () => {
    expect(match('Join us at the Technical University of Munich')?.rorId).toBe('https://ror.org/tum');
    expect(match('Postdoc at the University of Munich')?.rorId).toBe('https://ror.org/lmu');
  });

  it('ignores accents and case of letters inside words', () => {
    expect(match('Doktorand:in an der Universität Bremen')?.country).toBe('Germany');
    expect(match('PhD in robotics at ETH Zürich')?.country).toBe('Switzerland');
  });

  it('uses acronyms only when written in capitals and owned by one institution', () => {
    expect(match('Fully funded PhD at MIT')?.country).toBe('USA');
    expect(match('Wir arbeiten mit Partnern in ganz Europa')).toBeUndefined(); // German "mit" = "with"
    expect(match('Two postdoc positions at UCL')).toBeUndefined(); // London or Louvain?
    expect(match('PhD in vision at KTH')?.country).toBe('Sweden');
  });

  it('skips shouted words and degree names that look like acronyms', () => {
    expect(match('FULLY FUNDED PHD POSITIONS AVAILABLE')).toBeUndefined();
    expect(match('Open PHD call')).toBeUndefined();
  });

  it('ignores a lone acronym unless the post names its city or country', () => {
    expect(match('Fully funded PhD in hydrology with the NERC E5 DTP')).toBeUndefined();
    expect(match('PhD studentships, South Coast DTP, apply by January')).toBeUndefined();
    expect(match('MRC DTP studentship in neuroscience')).toBeUndefined();
    expect(match('Postdoc in brain ageing at LCBC, Oslo')).toBeUndefined();
    expect(match('PhD on the DIFFER project at our lab in Alicante')).toBeUndefined();
    expect(match('PhD on IBD and the gut microbiome')).toBeUndefined();
    expect(match('Thèse financée par l\'ANR à Lyon')).toBeUndefined();
    expect(match('PhD in fusion at DIFFER in Eindhoven')?.country).toBe('Netherlands');
  });

  it('ignores hashtags and handles that look like acronyms', () => {
    expect(match('#ZMB member is recruiting PhD students in Munich')).toBeUndefined();
    expect(match('#ZMB member is recruiting PhD students in Zurich')).toBeUndefined();
    expect(match('Congrats @DIFFER on the new grant, Eindhoven')).toBeUndefined();
  });

  it('a full name wins over a stray acronym from another country', () => {
    const m = match('PhD on IBD at Syddansk Universitet');
    expect(m?.rorId).toBe('https://ror.org/sdu');
    expect(m?.country).toBe('Denmark');
  });

  it('trusts a full name over a clashing acronym', () => {
    const m = match('Stanford University, Stanford AI Lab (SAIL) is hiring');
    expect(m?.rorId).toBe('https://ror.org/stanford');
    expect(m?.country).toBe('USA');
  });

  it('keeps the first institution but drops the country when two countries are named', () => {
    const m = match('Joint PhD between the University of Oxford and ETH Zurich');
    expect(m?.rorId).toBe('https://ror.org/oxford');
    expect(m?.country).toBeUndefined();
  });

  it('keeps the country when both institutions are in the same country', () => {
    expect(match('Co-supervised by KU Leuven and Université catholique de Louvain')?.country).toBe('Belgium');
  });

  it('never matches generic words, one-word names or lowercase phrases', () => {
    expect(match('Our Institute is hiring; the College and the Center welcome you')).toBeUndefined();
    expect(match('Research Institute for advanced study')).toBeUndefined();
    expect(match('Focus on machine learning')).toBeUndefined();
    expect(match('a degree from a stanford university-like program')).toBeUndefined();
  });

  it('matches names with or without a leading "The"', () => {
    expect(match('PhD at University of Melbourne')?.country).toBe('Australia');
  });

  it('returns undefined when nothing matches', () => {
    expect(match('Great opportunity, apply by Friday!')).toBeUndefined();
    expect(match('')).toBeUndefined();
  });
});

describe('precision fixes from the prod dry-run', () => {
  const PRECISION: RorRecord[] = [
    ...FIXTURE,
    rec('dhrc', 'Digital Health Research Center', 'Peru', 'Lima', ['Digital Health']),
    rec('dlab', 'Digital Innovation Lab', 'Spain', 'Bilbao'),
    rec('imagine', 'Initial MAnagement and prevention of acute orGan failures IN critically ill patiEnts', 'France', 'Paris', [], ['IMAGINE']),
    { ...rec('aei', 'Agencia Estatal de Investigación', 'Spain', 'Madrid', ['State Research Agency of Spain'], ['AEI']), nonHost: true },
    { ...rec('irl', 'Government of Ireland', 'Ireland', 'Dublin'), nonHost: true },
  ];
  // "digital" and "health" each appear in 2 names here; with the threshold at 1 that makes the pair an everyday phrase
  const precise = createRorMatcher(PRECISION, { commonWordRecords: 1 });

  it('ignores an everyday two-word alias ("Digital Health") without its city or country', () => {
    expect(precise('UCL is hiring a Digital Health and Trial Senior Researcher')).toBeUndefined();
    expect(precise('PhD Position in Developing a Digital Health Passport for patients')).toBeUndefined();
    expect(precise('PhD at Digital Health, our lab in Lima')?.country).toBe('Peru');
  });

  it('never takes a project backronym or its acronym as an institution', () => {
    expect(precise('Our international PPU-IMAGINE PhD call is open! Initial MAnagement and prevention of acute orGan failures IN critically ill patiEnts, Paris')).toBeUndefined();
  });

  it('uses a funder or government body for the country only', () => {
    expect(precise('PhD funded by the Agencia Estatal de Investigación')).toEqual({ country: 'Spain', city: '' });
    expect(precise('Government of Ireland International Education Scholarship for PhD study')).toEqual({ country: 'Ireland', city: '' });
  });

  it('prefers the host institution over its funder', () => {
    expect(precise('PhD at the University of Bremen, funded by the Agencia Estatal de Investigación')).toMatchObject({
      name: 'University of Bremen', country: 'Germany',
    });
  });

  it('keeps the earlier correct matches', () => {
    expect(precise('PhD in fusion at DIFFER in Eindhoven')?.country).toBe('Netherlands');
    expect(precise('Open PhD position at KTH in robotics')?.name).toBe('KTH Royal Institute of Technology');
    expect(precise('PhD position at the University of Bremen')?.country).toBe('Germany');
  });
});

describe('resolveCountry', () => {
  const leuven = match('PhD at KU Leuven');

  it('keeps the country the post states, even if ROR disagrees', () => {
    expect(resolveCountry('Netherlands', leuven)).toEqual({ country: 'Netherlands', countrySource: 'post' });
  });

  it('fills the gap from ROR when the post states no country', () => {
    expect(resolveCountry(undefined, leuven)).toEqual({ country: 'Belgium', countrySource: 'ror' });
  });

  it('leaves it empty when neither has one', () => {
    expect(resolveCountry(undefined, undefined)).toEqual({});
    expect(resolveCountry(undefined, match('Joint PhD, University of Oxford and ETH Zurich'))).toEqual({});
  });
});

describe('ROR golden set (30 posts, real ROR records)', () => {
  const golden = createRorMatcher(goldenIndex as RorRecord[]);
  const results = ROR_GOLDEN_POSTS.map((p) => ({ ...p, got: golden(p.text)?.country }));

  it('has 30 posts', () => {
    expect(results).toHaveLength(30);
  });

  it('never gives a wrong country', () => {
    expect(results.filter((r) => r.got && r.got !== r.country).map((r) => `${r.id}: ${r.got}`)).toEqual([]);
  });

  it('finds the right country for at least 90%', () => {
    const right = results.filter((r) => r.got === r.country).length;
    expect(right / results.length).toBeGreaterThanOrEqual(0.9);
  });
});
