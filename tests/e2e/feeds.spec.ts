import type { Page } from '@playwright/test';
import { expect, installFakeBackend, signedInUser, test } from './fixtures';

const FEEDS = [
  { tab: 'opportunities', card: 'article' },
  { tab: 'scholarships', card: 'article' },
  { tab: 'professors', card: 'article' },
  { tab: 'research', card: 'article' },
] as const;

// Waits until the first card has rendered, so the count in the list bar is the real one (not the 0 shown while loading)
const openFeed = async (page: Page, tab: string) => {
  await page.goto(`/?tab=${tab}`);
  await page.waitForLoadState('networkidle');
  // Grid shows cards, list view shows a table (the view mode is remembered per session)
  await expect(page.locator('article, table').first()).toBeVisible();
};

const count = async (page: Page) => {
  const text = await page.getByText(/^\/ \d+ Items$/).innerText();
  return Number(text.match(/\d+/)![0]);
};

test.describe('Feed header toggle', () => {
  for (const feed of FEEDS) {
    test(`${feed.tab}: "Eligible Now" filters the list and the count follows`, async ({ page, consoleErrors }) => {
      await installFakeBackend(page, { user: signedInUser() });
      await openFeed(page, feed.tab);

      const all = page.getByRole('button', { name: 'All', exact: true });
      const eligible = page.getByRole('button', { name: 'Eligible Now' });
      await expect(all).toHaveAttribute('aria-pressed', 'true');
      await expect(page.getByText('Resume Customised')).toHaveCount(0);

      const before = await count(page);
      await eligible.click();
      await expect(eligible).toHaveAttribute('aria-pressed', 'true');
      await expect(all).toHaveAttribute('aria-pressed', 'false');
      const after = await count(page);
      expect(after).toBeLessThanOrEqual(before);
      // The count in the list bar matches the cards on screen
      if (after > 0) await expect(page.locator(feed.card)).toHaveCount(after);

      await all.click();
      expect(await count(page)).toBe(before);
      expect(consoleErrors, consoleErrors.join('\n')).toEqual([]);
    });
  }

  test('"Eligible Now" only keeps listings the profile qualifies for (Opportunity Feed)', async ({ page }) => {
    await installFakeBackend(page, { user: signedInUser() });
    await openFeed(page, 'opportunities');
    const all = await count(page);
    await page.getByRole('button', { name: 'Eligible Now' }).click();
    // The e2e student has CGPA 3.82; the seeded "Demanding Masters" post asks for 3.95, so it drops out
    await expect.poll(() => count(page)).toBeLessThan(all);
    await expect(page.getByText('E2E Demanding Masters in Machine Learning')).toHaveCount(0);
  });

  test('"Eligible Now" survives list → details → back', async ({ page }) => {
    await installFakeBackend(page, { user: signedInUser() });
    await openFeed(page, 'opportunities');
    await page.getByRole('button', { name: 'Eligible Now' }).click();
    await page.locator('article').first().getByRole('link', { name: 'Explore More' }).click();
    await expect(page).toHaveURL(/\/opportunities\//);
    await page.getByRole('link', { name: /Back to Opportunity Feed/ }).click();
    await expect(page.locator('article').first()).toBeVisible();
    await expect(page.getByRole('button', { name: 'Eligible Now' })).toHaveAttribute('aria-pressed', 'true');
  });
});

test.describe('Natural scroll', () => {
  test('desktop: the cards scroll while the header and list bar stay put', async ({ page, isMobile }) => {
    test.skip(isMobile, 'on phones the whole page scrolls');
    await page.setViewportSize({ width: 1728, height: 900 });
    await installFakeBackend(page, { user: signedInUser() });
    await openFeed(page, 'opportunities');

    const scroll = page.locator('[data-feed-scroll]');
    const header = page.locator('header').first();
    const bar = page.getByRole('heading', { name: 'Opportunity List' });
    const before = { header: await header.boundingBox(), bar: await bar.boundingBox() };

    // Every card is in the page: there is no 6-per-page limit
    const total = await page.getByText(/^\/ \d+ Items$/).innerText();
    await expect(page.locator('article')).toHaveCount(Number(total.match(/\d+/)![0]));

    await scroll.evaluate((el) => el.scrollTo({ top: el.scrollHeight }));
    await expect.poll(() => scroll.evaluate((el) => el.scrollTop)).toBeGreaterThan(0);
    const after = { header: await header.boundingBox(), bar: await bar.boundingBox() };
    expect(after.header!.y).toBe(before.header!.y);
    expect(after.bar!.y).toBe(before.bar!.y);
  });

  test('changing a filter scrolls the cards back to the top', async ({ page, isMobile }) => {
    test.skip(isMobile, 'on phones the whole page scrolls');
    await page.setViewportSize({ width: 1728, height: 900 });
    await installFakeBackend(page, { user: signedInUser() });
    await openFeed(page, 'opportunities');
    const scroll = page.locator('[data-feed-scroll]');
    await scroll.evaluate((el) => el.scrollTo({ top: 300 }));
    await expect.poll(() => scroll.evaluate((el) => el.scrollTop)).toBeGreaterThan(0);
    await page.getByRole('button', { name: 'Eligible Now' }).click();
    await expect.poll(() => scroll.evaluate((el) => el.scrollTop)).toBe(0);
  });

  test('list view is a sortable table on every feed; a row opens its details', async ({ page }) => {
    await installFakeBackend(page, { user: signedInUser() });
    for (const { tab } of FEEDS) {
      await openFeed(page, tab);
      await page.getByRole('button', { name: 'List view' }).click();
      const table = page.getByRole('table');
      await expect(table).toBeVisible();
      const header = table.getByRole('columnheader', { name: /Match/ });
      await header.getByRole('button').click();
      await expect(header).toHaveAttribute('aria-sort', /ascending|descending/);
    }
    // Clicking a row (not a button inside it) opens the details page
    await openFeed(page, 'scholarships');
    await page.getByRole('button', { name: 'List view' }).click();
    const row = page.getByRole('table').getByRole('row').filter({ has: page.getByRole('link', { name: /^Explore / }) }).first();
    await row.getByRole('cell').first().click();
    await expect(page).toHaveURL(/\/scholarships\/[^/?]+$/);
  });
});
