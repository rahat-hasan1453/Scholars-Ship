import { expect, installFakeBackend, signedInUser, test } from './fixtures';

test.describe('Sidebar', () => {
  test('collapses to icons, stays collapsed after reload, and opens Pipeline and Saved Feed', async ({ page, isMobile }) => {
    test.skip(isMobile, 'the desktop sidebar collapses; phones use the drawer');
    await installFakeBackend(page, { user: signedInUser() });
    await page.goto('/?tab=opportunities');
    await page.getByRole('button', { name: 'Collapse sidebar' }).click();
    await expect(page.getByRole('button', { name: 'Expand sidebar' })).toBeVisible();
    await expect(page.getByText('Opportunity Feed', { exact: true })).toBeHidden(); // labels hide; buttons keep aria-labels

    await page.reload();
    await expect(page.getByRole('button', { name: 'Expand sidebar' })).toBeVisible();

    const nav = page.getByRole('navigation', { name: 'Main' });
    await nav.getByRole('button', { name: 'Saved Feed' }).click();
    await expect(page.getByRole('heading', { name: /Saved Feed/ })).toBeVisible();
    await nav.getByRole('button', { name: 'Pipeline' }).click();
    await expect(nav.getByRole('button', { name: 'Pipeline' })).toHaveAttribute('aria-current', 'page');

    await page.getByRole('button', { name: 'Expand sidebar' }).click();
    await expect(page.getByText('Others')).toBeVisible();
  });
});
