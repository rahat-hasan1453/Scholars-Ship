import { expect, installFakeBackend, signedInUser, test } from './fixtures';

test.describe('Scholarship details', () => {
  test('opens from a Scholarship Radar card and goes back with the list state kept', async ({ page, consoleErrors }) => {
    await installFakeBackend(page, { user: signedInUser() });
    await page.goto('/?tab=scholarships');
    await page.waitForLoadState('networkidle');

    // Change the list state so we can check it survives the round trip
    await page.getByRole('button', { name: 'List view' }).click();
    await expect(page.getByRole('button', { name: 'List view' })).toHaveAttribute('aria-pressed', 'true');

    // List view is a table: open the first row with its Explore link
    const row = page.getByRole('table').getByRole('row').filter({ has: page.getByRole('link', { name: /^Explore / }) }).first();
    const title = (await row.getAttribute('aria-label'))!.trim();
    await row.getByRole('link', { name: /^Explore / }).click();

    await expect(page).toHaveURL(/\/scholarships\/[^/?]+$/);
    await expect(page.getByRole('heading', { level: 1 })).toHaveText(title);
    await expect(page.getByRole('link', { name: 'Official Link' })).toHaveAttribute('target', '_blank');
    await expect(page.getByRole('heading', { name: 'Eligibility' })).toBeVisible();

    await page.getByRole('link', { name: /Back to Scholarship Radar/ }).click();
    await expect(page).toHaveURL(/tab=scholarships/);
    await expect(page.getByRole('table')).toBeVisible();
    await expect(page.getByRole('button', { name: 'List view' })).toHaveAttribute('aria-pressed', 'true');
    expect(consoleErrors, consoleErrors.join('\n')).toEqual([]);
  });

  test('unknown id shows the not-found page', async ({ page }) => {
    await installFakeBackend(page, { user: signedInUser() });
    const res = await page.goto('/scholarships/does-not-exist');
    expect(res?.status()).toBe(404);
  });
});
