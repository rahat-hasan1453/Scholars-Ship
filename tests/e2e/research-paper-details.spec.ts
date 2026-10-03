import { expect, installFakeBackend, signedInUser, test } from './fixtures';

const DEEP_LINK = '/?tab=research&paper=paper-ux-01';

test.describe('Research Paper details modal', () => {
  test('opens from a card, closes with Esc and keeps the list state', async ({ page, consoleErrors }) => {
    await installFakeBackend(page, { user: signedInUser() });
    await page.goto('/?tab=research');
    await page.waitForLoadState('networkidle');

    // Change the list state so we can check it survives opening and closing the modal
    await page.getByRole('button', { name: 'List view' }).click();
    await expect(page.getByRole('button', { name: 'List view' })).toHaveAttribute('aria-pressed', 'true');

    const card = page.locator('article').first();
    const title = (await card.locator('h3').innerText()).trim();
    await card.getByRole('button', { name: 'Read full abstract' }).click();

    const dialog = page.getByRole('dialog', { name: title });
    await expect(dialog).toBeVisible();
    await expect(page).toHaveURL(/[?&]paper=[^&]+/);
    for (const section of ['Topics', 'Abstract', 'Authors']) {
      await expect(dialog.getByRole('heading', { name: section })).toBeVisible();
    }
    await expect(dialog.getByRole('link', { name: /Google Scholar/ })).toBeVisible();
    await expect(dialog.getByRole('link', { name: /Download PDF/ })).toBeVisible();

    await page.keyboard.press('Escape');
    await expect(dialog).toBeHidden();
    await expect(page).not.toHaveURL(/paper=/);
    await expect(page).toHaveURL(/tab=research/);
    await expect(page.getByRole('button', { name: 'List view' })).toHaveAttribute('aria-pressed', 'true');
    expect(consoleErrors, consoleErrors.join('\n')).toEqual([]);
  });

  test('deep link opens the paper; Close drops it from the URL', async ({ page, consoleErrors }) => {
    await installFakeBackend(page, { user: signedInUser() });
    await page.goto(DEEP_LINK);

    const dialog = page.getByRole('dialog', { name: /Generative AI as a Design Partner/ });
    await expect(dialog).toBeVisible();
    await expect(dialog.getByText('📄 Conference paper · Published November 2025')).toBeVisible();
    await expect(dialog.getByRole('heading', { name: 'Key Findings' })).toBeVisible();
    await expect(dialog.getByText('−43%')).toBeVisible();
    await expect(dialog.getByRole('link', { name: '10.1145/3613904.3642100' })).toHaveAttribute('href', 'https://doi.org/10.1145/3613904.3642100');

    await dialog.getByRole('button', { name: 'Close' }).click();
    await expect(dialog).toBeHidden();
    await expect(page).toHaveURL(/\/\?tab=research$/);
    await expect(page.locator('article').first()).toBeVisible();
    expect(consoleErrors, consoleErrors.join('\n')).toEqual([]);
  });

  test('keeps keyboard focus inside the modal', async ({ page, browserName }) => {
    test.skip(browserName === 'webkit', 'Safari only tabs to links with Option+Tab');
    await installFakeBackend(page, { user: signedInUser() });
    await page.goto(DEEP_LINK);
    const dialog = page.getByRole('dialog');
    await expect(dialog).toBeVisible();

    for (let i = 0; i < 25; i++) {
      await page.keyboard.press('Tab');
      expect(await dialog.evaluate((d) => d.contains(document.activeElement))).toBe(true);
    }
    for (let i = 0; i < 5; i++) {
      await page.keyboard.press('Shift+Tab');
      expect(await dialog.evaluate((d) => d.contains(document.activeElement))).toBe(true);
    }
  });

  test('browser Back closes a modal opened from a card', async ({ page }) => {
    await installFakeBackend(page, { user: signedInUser() });
    await page.goto('/?tab=research');
    await page.waitForLoadState('networkidle');
    await page.locator('article').first().locator('h3').getByRole('button').click();
    await expect(page.getByRole('dialog')).toBeVisible();

    await page.goBack();
    await expect(page.getByRole('dialog')).toBeHidden();
    await expect(page).toHaveURL(/tab=research/);
    await expect(page).not.toHaveURL(/paper=/);
  });

  test('Save in the modal bookmarks the paper', async ({ page }) => {
    await installFakeBackend(page, { user: signedInUser() });
    await page.goto(DEEP_LINK);
    const dialog = page.getByRole('dialog');
    await dialog.getByRole('button', { name: 'Save', exact: true }).click();
    await expect(dialog.getByRole('button', { name: 'Saved', exact: true })).toHaveAttribute('aria-pressed', 'true');
  });

  test('unknown paper id is dropped from the URL without opening a modal', async ({ page }) => {
    await installFakeBackend(page, { user: signedInUser() });
    await page.goto('/?tab=research&paper=does-not-exist');
    await expect(page.locator('article').first()).toBeVisible();
    await expect(page).not.toHaveURL(/paper=/);
    await expect(page.getByRole('dialog')).toHaveCount(0);
  });

  test('screenshot at 1728px for the Figma comparison', async ({ page }, info) => {
    test.skip(info.project.name !== 'chromium-desktop', 'one reference screenshot is enough');
    await page.setViewportSize({ width: 1728, height: 1283 });
    await installFakeBackend(page, { user: signedInUser() });
    await page.goto(DEEP_LINK);
    await expect(page.getByRole('dialog')).toBeVisible();
    await page.waitForTimeout(400); // let the open animation finish
    await page.screenshot({ path: info.outputPath('research-paper-modal-1728.png') });
  });
});
