import { describe, it, expect } from 'vitest';
import { decodeEntities, fundStart, formatGbp, idOf, latestProject, linksOf, namedLike, sameInstitution, toGrant, type GtrPerson, type GtrProject } from '../../prisma/import/ukriMatch';

const person = (firstName: string, surname: string): GtrPerson => ({ id: 'P1', firstName, surname });
const project = (id: string, startYear: number, over: Partial<GtrProject> = {}): GtrProject => ({
  id,
  title: `Project ${id}`,
  leadFunder: 'EPSRC',
  identifiers: { identifier: [{ value: 'EP/X011364/1', type: 'RCUK' }] },
  links: { link: [{ rel: 'FUND', href: `https://gtr.ukri.org/gtr/api/funds/${id}`, start: Date.UTC(startYear, 5, 1), end: Date.UTC(startYear + 3, 5, 1) }] },
  ...over,
});

describe('who is the same person', () => {
  const prof = { name: 'Stefanos Zafeiriou', university: 'Imperial College London' };
  it('matches last name and the start of the first name, ignoring accents and case', () => {
    expect(namedLike(prof, [person('Stefanos', 'Zafeiriou'), person('STEFANOS', 'ZAFEIRIOU')])).toHaveLength(2);
    expect(namedLike({ name: 'José Álvarez' }, [person('Jose', 'Alvarez')])).toHaveLength(1);
  });
  it('drops other people the free-text search returned', () => {
    expect(namedLike(prof, [person('Stefan', 'Zafeiriou-Smith'), person('Maria', 'Zafeiriou'), person('Stefanos', 'Zafeiridis')])).toHaveLength(0);
  });
  it('needs the employer to be the same university', () => {
    expect(sameInstitution(prof, 'IMPERIAL COLLEGE LONDON')).toBe(true);
    expect(sameInstitution(prof, 'UNIVERSITY COLLEGE LONDON')).toBe(false);
    expect(sameInstitution({ university: 'University of Edinburgh' }, 'UNIVERSITY OF EDINBURGH')).toBe(true);
    expect(sameInstitution({ university: 'University of Manchester' }, 'MANCHESTER METROPOLITAN UNIVERSITY')).toBe(false);
    expect(sameInstitution(prof, undefined)).toBe(false);
  });
});

describe('links', () => {
  it('reads ids and links by relation', () => {
    expect(idOf('http://gtr.ukri.org/gtr/api/organisations/ABC-1/')).toBe('ABC-1');
    expect(linksOf({ links: { link: [{ rel: 'PI_PER', href: 'a' }, { rel: 'COI_PER', href: 'b' }, { rel: 'PI_PER', href: 'c' }] } }, 'PI_PER')).toEqual(['a', 'c']);
  });
});

describe('latest project and the grant row', () => {
  it('takes the newest project that started in the window', () => {
    const projects = [project('old', 2018), project('mid', 2023), project('new', 2025)];
    expect(latestProject(projects, 2022)?.id).toBe('new');
    expect(latestProject([project('old', 2018)], 2022)).toBeUndefined();
    expect(fundStart(project('x', 2024))).toBe(Date.UTC(2024, 5, 1));
  });
  it('formats pounds and builds a public page link', () => {
    expect(formatGbp(399334)).toBe('£399K');
    expect(formatGbp(1250000)).toBe('£1.3M');
    expect(toGrant('prof_x', project('abcdef12-0000', 2024, { title: 'Vision &amp; Graphics' }), 1_100_000)).toMatchObject({
      id: 'ukri_abcdef12_prof_x',
      funder: 'UKRI',
      amount: '£1.1M',
      year: 2024,
      title: 'Vision & Graphics',
      url: 'https://gtr.ukri.org/projects?ref=EP%2FX011364%2F1',
    });
    expect(decodeEntities('A &lt;b&gt; &amp; &quot;c&quot; &#39;d&#39;')).toBe('A <b> & "c" \'d\'');
  });
});
