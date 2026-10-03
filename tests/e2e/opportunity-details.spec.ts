import { expect, installFakeBackend, signedInUser, test } from './fixtures';

test.describe('Opportunity details', () => {
  test('opens from an Opportunity Feed card and goes back with the list state kept', async ({ page, consoleErrors }) => {
    await installFakeBackend(page, { user: signedInUser() });
    await page.goto('/?tab=opportunities');
    await page.waitForLoadState('networkidle');

    // Change the list state so we can check it survives the round trip
    await page.getByRole('button', { name: 'List view' }).click();
    await expect(page.getByRole('button', { name: 'List view' })).toHaveAttribute('aria-pressed', 'true');

    const card = page.locator('article').first();
    const institution = (await card.locator('h3').innerText()).trim();
    await card.getByRole('link', { name: 'Explore More' }).click();

    await expect(page).toHaveURL(/\/opportunities\/[^/?]+$/);
    await expect(page.getByText(`· ${institution}`, { exact: false }).first()).toBeVisible();
    await expect(page.getByRole('heading', { level: 1 })).not.toBeEmpty();
    for (const section of ['Keywords', 'Original Post', 'Position Details', 'Eligibility', 'About the Lab', 'How to Apply']) {
      await expect(page.getByRole('heading', { name: section })).toBeVisible();
    }
    await expect(page.getByRole('link', { name: /View original post on/ })).toHaveAttribute('target', '_blank');
    await expect(page.getByRole('link', { name: 'Contact Professor' })).toBeVisible();

    await page.getByRole('link', { name: /Back to Opportunity Feed/ }).click();
    await expect(page).toHaveURL(/tab=opportunities/);
    await expect(page.locator('article').first()).toBeVisible();
    await expect(page.getByRole('button', { name: 'List view' })).toHaveAttribute('aria-pressed', 'true');
    expect(consoleErrors, consoleErrors.join('\n')).toEqual([]);
  });

  test('Save on the details page bookmarks the listing', async ({ page }) => {
    await installFakeBackend(page, { user: signedInUser() });
    await page.goto('/opportunities/opp_bremen_ux_03');
    const save = page.getByRole('button', { name: '🔖 Save' });
    await save.click();
    await expect(page.getByRole('button', { name: '🔖 Saved' })).toHaveAttribute('aria-pressed', 'true');
  });

  test('unknown id shows the not-found page', async ({ page }) => {
    await installFakeBackend(page, { user: signedInUser() });
    const res = await page.goto('/opportunities/does-not-exist');
    expect(res?.status()).toBe(404);
  });
});
