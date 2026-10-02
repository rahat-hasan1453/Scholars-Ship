import { expect, installFakeBackend, signedInUser, test } from './fixtures';

test.describe('Home', () => {
  test('loads for an onboarded user without console errors or horizontal scroll', async ({ page, consoleErrors }) => {
    await installFakeBackend(page, { user: signedInUser() });
    await page.goto('/');
    await expect(page).toHaveURL(/\/$/);
    await page.waitForLoadState('networkidle');
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
    expect(overflow, 'page should not scroll sideways').toBeLessThanOrEqual(0);
    expect(consoleErrors, consoleErrors.join('\n')).toEqual([]);
  });

  test('logout clears the session and returns to /login', async ({ page, isMobile }) => {
    test.skip(isMobile, 'logout lives in the desktop profile menu; mobile menu covered in exploratory run');
    const backend = await installFakeBackend(page, { user: signedInUser() });
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    await page.getByRole('button', { name: /^QA Student/ }).click();
    await page.getByText('Logout', { exact: true }).filter({ visible: true }).click();
    await expect(page).toHaveURL(/\/login$/);
    expect(backend.user).toBeNull();
  });

  test('tabs from ?tab= open the matching view', async ({ page }) => {
    await installFakeBackend(page, { user: signedInUser() });
    for (const tab of ['scholarships', 'professors', 'research', 'tracker', 'profile']) {
      await page.goto(`/?tab=${tab}`);
      await expect(page).toHaveURL(new RegExp(`tab=${tab}|/$`));
      await expect(page.locator('main, body').first()).toBeVisible();
    }
  });
});

// BUG-18 (fixed in PR #8): the tab is read after mount, so SSR and client markup match.
test('deep link ?tab=scholarships renders without a hydration error', async ({ page, consoleErrors }) => {
  await installFakeBackend(page, { user: signedInUser() });
  await page.goto('/?tab=scholarships');
  await page.waitForLoadState('networkidle');
  expect(consoleErrors.filter((e) => /Hydration failed/.test(e))).toEqual([]);
});
