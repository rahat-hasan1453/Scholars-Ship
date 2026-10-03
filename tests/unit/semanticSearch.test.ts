import { describe, expect, it } from 'vitest';
import { matchItemSemantically, parseNaturalLanguageQuery } from '@/lib/semanticSearch';

describe('parseNaturalLanguageQuery', () => {
  it('detects country, funding, degree and category', () => {
    const r = parseNaturalLanguageQuery('Fully funded PhD scholarships in Germany');
    expect(r).toMatchObject({ detectedCountry: 'Germany', detectedFunding: 'FULL', detectedDegree: 'PhD', detectedCategory: 'scholarships' });
  });
  it('uses word boundaries for short country synonyms', () => {
    expect(parseNaturalLanguageQuery('masters in the us').detectedCountry).toBe('USA');
    expect(parseNaturalLanguageQuery('focus on austria').detectedCountry).toBe('Austria');
    expect(parseNaturalLanguageQuery('uk scholarships').detectedCountry).toBe('United Kingdom');
  });
  it('completes a partially typed country name', () => {
    expect(parseNaturalLanguageQuery('switz').detectedCountry).toBe('Switzerland');
  });
  it('drops stop words from tokens', () => {
    expect(parseNaturalLanguageQuery('find me a lab').tokens).toEqual(['lab']);
  });
  // BUG-05: /ms/ has no word boundary, so "programs", "systems", "algorithms" are read as Masters.
  it.fails('does not read "systems" as a Masters degree', () => {
    expect(parseNaturalLanguageQuery('distributed systems research').detectedDegree).toBeUndefined();
  });
  // BUG-05b: /pi/ and /lab/ match inside words ("topic", "available"), forcing the professors category.
  it.fails('does not read "topic" as a professors search', () => {
    expect(parseNaturalLanguageQuery('climate topic papers').detectedCategory).toBe('research');
  });
});

describe('matchItemSemantically', () => {
  it('matches everything for an empty query', () => {
    expect(matchItemSemantically('anything', 'Japan', parseNaturalLanguageQuery(''))).toEqual({ matches: true, score: 0 });
  });
  it('rejects items from a different country', () => {
    expect(matchItemSemantically('DAAD scholarship', 'Japan', parseNaturalLanguageQuery('scholarship germany')).matches).toBe(false);
  });
  it('keeps global items when a country is requested', () => {
    expect(matchItemSemantically('scholarship for all', ['Global'], parseNaturalLanguageQuery('scholarship germany')).matches).toBe(true);
  });
  it('matches the requested country', () => {
    const r = matchItemSemantically('DAAD scholarship', 'Germany', parseNaturalLanguageQuery('scholarship germany'));
    expect(r.matches).toBe(true);
    expect(r.score).toBeGreaterThanOrEqual(40);
  });
  it('does not treat Australia, Austria, Russia, Belarus or Cyprus as a USA match', () => {
    for (const c of ['Australia', 'Austria', 'Russia', 'Belarus', 'Cyprus']) {
      expect(matchItemSemantically('PhD position', c, parseNaturalLanguageQuery('phd position usa')).matches).toBe(false);
    }
  });
  it('still matches USA aliases', () => {
    for (const c of ['USA', 'US', 'United States', 'United States of America']) {
      expect(matchItemSemantically('PhD position', c, parseNaturalLanguageQuery('phd position usa')).matches).toBe(true);
    }
  });
});
