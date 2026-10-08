import { expect, installFakeBackend, signedInUser, test } from './fixtures';

test.describe('Faculty details', () => {
  test('opens from a Faculty & Research Labs card and goes back with the list state kept', async ({ page, consoleErrors }) => {
    await installFakeBackend(page, { user: signedInUser() });
    await page.goto('/?tab=professors');
    await page.waitForLoadState('networkidle');

    // Change the list state so we can check it survives the round trip
    await page.getByRole('button', { name: 'List view' }).click();
    await expect(page.getByRole('button', { name: 'List view' })).toHaveAttribute('aria-pressed', 'true');

    // List view is a table: open the first row with its Explore link
    const row = page.getByRole('table').getByRole('row').filter({ has: page.getByRole('link', { name: /^Explore / }) }).first();
    const name = (await row.getAttribute('aria-label'))!.trim();
    await row.getByRole('link', { name: /^Explore / }).click();

    await expect(page).toHaveURL(/\/professors\/[^/?]+$/);
    await expect(page.getByRole('heading', { level: 1 })).toContainText(name);
    for (const section of ['Research Areas', 'Lab at a Glance', 'What They Look For', 'Recent Papers', 'How to Contact']) {
      await expect(page.getByRole('heading', { name: section })).toBeVisible();
    }
    await expect(page.getByText('● Accepting Students')).toBeVisible();
    await expect(page.getByRole('link', { name: 'Email Professor' })).toHaveAttribute('href', /^mailto:/);

    await page.getByRole('link', { name: /Back to Faculty & Research Labs/ }).click();
    await expect(page).toHaveURL(/tab=professors/);
    await expect(page.getByRole('table')).toBeVisible();
    await expect(page.getByRole('button', { name: 'List view' })).toHaveAttribute('aria-pressed', 'true');
    expect(consoleErrors, consoleErrors.join('\n')).toEqual([]);
  });

  test('Save on the details page bookmarks the professor', async ({ page }) => {
    await installFakeBackend(page, { user: signedInUser() });
    await page.goto('/professors/prof_baudisch_hpi_06');
    await page.getByRole('button', { name: '🔖 Save' }).click();
    await expect(page.getByRole('button', { name: '🔖 Saved' })).toHaveAttribute('aria-pressed', 'true');
    // The top-bar Save shares the same bookmark
    await expect(page.getByRole('button', { name: 'Saved', exact: true })).toHaveAttribute('aria-pressed', 'true');
  });

  test('Similar faculty links to another details page', async ({ page }) => {
    await installFakeBackend(page, { user: signedInUser() });
    await page.goto('/professors/prof_baudisch_hpi_06');
    const similar = page.locator('section', { has: page.getByRole('heading', { name: 'Similar faculty' }) }).getByRole('link').first();
    const href = await similar.getAttribute('href');
    expect(href).toMatch(/^\/professors\/(?!prof_baudisch_hpi_06)/);
    await similar.click();
    await expect(page).toHaveURL(new RegExp(`${href}$`));
  });

  test('unknown id shows the not-found page', async ({ page }) => {
    await installFakeBackend(page, { user: signedInUser() });
    const res = await page.goto('/professors/does-not-exist');
    expect(res?.status()).toBe(404);
  });
});
