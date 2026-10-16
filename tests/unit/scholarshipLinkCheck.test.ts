import { describe, expect, it, vi } from 'vitest';
import { checkLinks, parseRobots, robotsAllows, USER_AGENT } from '../../prisma/import/scholarshipCheck';

type Route = { status: number; body?: string } | Error;

/** A fake fetch that answers from a url → response table and records every call */
function fakeFetch(routes: Record<string, Route | Record<'HEAD' | 'GET', Route>>) {
  const calls: { url: string; method: string; agent: string }[] = [];
  const fn = vi.fn(async (url: string | URL | Request, init?: RequestInit) => {
    const key = String(url);
    const method = init?.method ?? 'GET';
    calls.push({ url: key, method, agent: (init?.headers as Record<string, string>)['User-Agent'] });
    const route = routes[key];
    const r = route && !(route instanceof Error) && 'HEAD' in route ? route[method as 'HEAD' | 'GET'] : route;
    if (!r) return new Response('', { status: 404 });
    if (r instanceof Error) throw r;
    return new Response(r.body ?? '', { status: r.status });
  });
  return { fetch: fn as unknown as typeof fetch, calls };
}

const one = (id: string, officialUrl: string, sourceUrl = officialUrl) => ({ id, officialUrl, sourceUrl });

describe('robots.txt rules', () => {
  const rules = parseRobots(`
    User-agent: Googlebot
    Disallow: /

    User-agent: *
    Disallow: /private/
    Disallow: /*.pdf$
    Allow: /private/scholarships
  `);

  it('use the * group when there is none for us, longest rule wins', () => {
    expect(robotsAllows(rules, '/scholarships')).toBe(true);
    expect(robotsAllows(rules, '/private/staff')).toBe(false);
    expect(robotsAllows(rules, '/private/scholarships/2027')).toBe(true);
    expect(robotsAllows(rules, '/files/call.pdf')).toBe(false);
    expect(robotsAllows(rules, '/files/call.pdf?x=1')).toBe(true);
  });

  it('prefer a group written for ScholarsShip', () => {
    const ours = parseRobots('User-agent: *\nDisallow: /\n\nUser-agent: ScholarsShip\nDisallow: /admin');
    expect(robotsAllows(ours, '/scholarships')).toBe(true);
    expect(robotsAllows(ours, '/admin')).toBe(false);
  });
});

describe('link check', () => {
  const sleep = vi.fn(async () => {});

  it('checks each url once, robots.txt first, with our user agent and 1 s between requests', async () => {
    sleep.mockClear();
    const { fetch, calls } = fakeFetch({
      'https://a.gov/robots.txt': { status: 200, body: 'User-agent: *\nDisallow:' },
      'https://a.gov/one': { status: 200 },
      'https://a.gov/two': { status: 200 },
    });
    const problems = await checkLinks([one('x', 'https://a.gov/one'), one('y', 'https://a.gov/two', 'https://a.gov/one')], { fetch, sleep });
    expect(problems).toEqual([]);
    expect(calls.map((c) => `${c.method} ${c.url}`)).toEqual(['GET https://a.gov/robots.txt', 'HEAD https://a.gov/one', 'HEAD https://a.gov/two']);
    expect(calls.every((c) => c.agent === USER_AGENT)).toBe(true);
    expect(sleep).toHaveBeenCalledTimes(2);
    expect(sleep).toHaveBeenCalledWith(1000);
  });

  it('does not open a page robots.txt disallows', async () => {
    const { fetch, calls } = fakeFetch({ 'https://b.gov/robots.txt': { status: 200, body: 'User-agent: *\nDisallow: /' } });
    const problems = await checkLinks([one('x', 'https://b.gov/page')], { fetch, sleep });
    expect(calls.map((c) => c.url)).toEqual(['https://b.gov/robots.txt']);
    expect(problems).toMatchObject([{ level: 'warning', where: 'x' }]);
  });

  it('falls back to GET when HEAD fails, and treats a missing robots.txt as allowed', async () => {
    const { fetch, calls } = fakeFetch({ 'https://c.gov/page': { HEAD: { status: 405 }, GET: { status: 200 } } });
    expect(await checkLinks([one('x', 'https://c.gov/page')], { fetch, sleep })).toEqual([]);
    expect(calls.map((c) => c.method)).toEqual(['GET', 'HEAD', 'GET']);
  });

  it('reports broken links as errors and bot-blocking sites as warnings', async () => {
    const { fetch } = fakeFetch({
      'https://d.gov/gone': { status: 404 },
      'https://d.gov/blocked': { status: 403 },
      'https://e.gov/down': new Error('getaddrinfo ENOTFOUND e.gov'),
    });
    const problems = await checkLinks(
      [one('gone', 'https://d.gov/gone'), one('blocked', 'https://d.gov/blocked'), one('down', 'https://e.gov/down')],
      { fetch, sleep },
    );
    expect(problems.map((p) => [p.where, p.level])).toEqual([
      ['gone', 'error'],
      ['blocked', 'warning'],
      ['down', 'error'],
    ]);
  });
});
