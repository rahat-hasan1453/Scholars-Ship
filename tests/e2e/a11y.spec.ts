import AxeBuilder from '@axe-core/playwright';
import { expect, installFakeBackend, signedInUser, test } from './fixtures';

const pages = [
  { name: 'login', path: '/login', user: null },
  { name: 'onboarding', path: '/onboarding', user: signedInUser({ onboardingCompleted: false }) },
  { name: 'home', path: '/', user: signedInUser() },
  { name: 'scholarship details', path: '/scholarships/sch_daad_design_02', user: signedInUser() },
];

for (const p of pages) {
  test(`axe WCAG 2.1 AA: ${p.name} has no serious/critical violations`, async ({ page, browserName }, info) => {
    await installFakeBackend(page, { user: p.user });
    await page.goto(p.path);
    await page.waitForLoadState('networkidle');
    const { violations } = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa']).analyze();
    const summary = violations.map((v) => `${v.impact} ${v.id} (${v.nodes.length}): ${v.help}\n` +
      v.nodes.slice(0, 3).map((n) => `    ${n.target.join(' ')} :: ${(n.failureSummary ?? '').split('\n').slice(1, 2).join('').trim()} :: ${n.html.slice(0, 90)}`).join('\n'));
    await info.attach(`axe-${p.name}.json`, { body: JSON.stringify(violations, null, 2), contentType: 'application/json' });
    console.log(`[axe ${p.name} ${info.project.name}]\n` + (summary.join('\n') || 'no violations'));
    expect(violations.filter((v) => v.impact === 'serious' || v.impact === 'critical').map((v) => v.id)).toEqual([]);
  });
}
