import { describe, expect, it } from 'vitest';
import { rankBySubject, selectionTier, subjectTagsFor, subjectTier, SUBJECTS } from '@/data/subjectCatalog';
import { SUBJECT_KEYWORDS } from '@/data/subjectKeywords';

const HCI = 'Human-Computer Interaction (HCI)';
const UX = 'UX & Product Design';

describe('subject keyword mapping', () => {
  it('has words for every subject, and every subject has core words', () => {
    for (const s of SUBJECTS) {
      expect(SUBJECT_KEYWORDS[s], s).toBeDefined();
      expect(SUBJECT_KEYWORDS[s].core.length, s).toBeGreaterThan(0);
    }
    expect(Object.keys(SUBJECT_KEYWORDS).sort()).toEqual([...SUBJECTS].sort());
  });

  it('keeps words that many fields use out of "core"', () => {
    for (const s of SUBJECTS) {
      for (const loose of ['cognitive', 'visualization', 'visuali*']) expect(SUBJECT_KEYWORDS[s].core, s).not.toContain(loose);
    }
  });

  it('ranks UX words as core and its neighbours (UI, HCI, interaction, cognitive) as related', () => {
    expect(subjectTier(UX, ['usability study'])).toBe(2);
    expect(subjectTier(UX, ['UX research'])).toBe(2);
    for (const related of ['UI design', 'HCI', 'human-computer interaction', 'interaction', 'cognitive load']) {
      expect(subjectTier(UX, [related]), related).toBe(1);
    }
    expect(subjectTier(UX, ['Robotics'])).toBe(0);
  });

  it('matches whole words only, and treats hyphen and space alike', () => {
    expect(subjectTier('Artificial Intelligence', ['please maintain order'])).toBe(0);
    expect(subjectTier('Artificial Intelligence', ['AI agents'])).toBe(2);
    expect(subjectTier(HCI, ['human computer interaction'])).toBe(2);
    expect(subjectTier(HCI, ['Human-Computer Interaction'])).toBe(2);
    expect(subjectTier('Robotics & Autonomous Systems', ['Soft Robotics'])).toBe(2);
    expect(subjectTier('Neuroscience & Neurotechnology', ['Brain-computer interfaces'])).toBe(2);
  });

  it('counts the bare "Computer Science" label as related only, but its own words as core', () => {
    expect(subjectTier('Computer Science', ['Computer Science'])).toBe(1);
    expect(subjectTier('Computer Science', ['Computer Science', 'algorithms'])).toBe(2);
    expect(subjectTier(HCI, ['Human-Computer Interaction (HCI)'])).toBe(2);
  });

  it('takes the best tier across the selected subjects; no selection means everything', () => {
    expect(selectionTier([UX, 'Cybersecurity'], ['network security'])).toBe(2);
    expect(selectionTier([UX, 'Cybersecurity'], ['UI design'])).toBe(1);
    expect(selectionTier([], ['anything'])).toBe(2);
    expect(selectionTier([UX], ['All Fields'])).toBe(1);
  });

  it('tags a text with the subjects it is about (core words or the exact name)', () => {
    expect(subjectTagsFor(['UX Design', 'Human-Computer Interaction (HCI)', 'Robotics'])).toEqual([HCI, UX, 'Robotics & Autonomous Systems']);
    expect(subjectTagsFor(['Economics'])).toEqual(['Economics & Quantitative Finance']);
    expect(subjectTagsFor(['UI design'])).toEqual([]);
    expect(subjectTagsFor(['Medieval poetry'])).toEqual([]);
  });
});

describe('rankBySubject', () => {
  type Item = { id: string; tags: string[] };
  const items: Item[] = [
    { id: 'unrelated', tags: ['Medieval poetry'] },
    { id: 'related-1', tags: ['UI design'] },
    { id: 'core-1', tags: ['usability'] },
    { id: 'related-2', tags: ['cognitive load'] },
    { id: 'core-2', tags: ['UX'] },
    { id: 'no-tags', tags: [] },
  ];

  it('drops unrelated items and puts core first, each group in its original order', () => {
    expect(rankBySubject(items, [UX], (i) => i.tags).map((i) => i.id)).toEqual(['core-1', 'core-2', 'related-1', 'related-2']);
  });

  it('keeps items without any text at the end when asked to', () => {
    expect(rankBySubject(items, [UX], (i) => i.tags, true).map((i) => i.id)).toEqual(['core-1', 'core-2', 'related-1', 'related-2', 'no-tags']);
  });

  it('keeps every item untouched when no subject is selected', () => {
    expect(rankBySubject(items, [], (i) => i.tags)).toBe(items);
  });
});
