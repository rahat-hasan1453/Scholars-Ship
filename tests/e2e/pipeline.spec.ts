import { expect, installFakeBackend, signedInUser, test } from './fixtures';
import type { Page } from '@playwright/test';

const column = (page: Page, status: string) => page.locator(`[data-testid="pipeline-column"][data-column="${status}"]`);
const card = (page: Page, id: string) => page.locator(`[data-card-id="${id}"]`);

test.describe('Pipeline (Kanban)', () => {
  test.beforeEach(async ({ page }) => {
    await installFakeBackend(page, { user: signedInUser() });
    await page.goto('/?tab=tracker');
    await expect(page.getByRole('heading', { name: 'Pipeline', level: 1 })).toBeVisible();
  });

  test('shows the five scholarship columns with summary numbers', async ({ page }) => {
    for (const s of ['Wishlist', 'Preparing', 'Submitted', 'Under Review', 'Decided']) {
      await expect(column(page, s).getByRole('heading', { name: s })).toBeVisible();
    }
    await expect(column(page, 'Wishlist').getByTestId('pipeline-card')).toHaveCount(1);
    await expect(page.getByTestId('summary-Active')).toHaveText('4');
    await expect(column(page, 'Decided').getByText('Drop a card here')).toBeVisible();
  });

  test('drags a card to the next column with the keyboard and keeps it after reload', async ({ page }) => {
    const handle = card(page, 'app_02').getByRole('button', { name: /Provider/ });
    await handle.focus();
    await page.keyboard.press('Space');
    await page.waitForTimeout(150);
    await page.keyboard.press('ArrowRight');
    await page.waitForTimeout(250);
    await page.keyboard.press('Space');

    await expect(column(page, 'Preparing').locator('[data-card-id="app_02"]')).toBeVisible();
    await expect(column(page, 'Wishlist').getByTestId('pipeline-card')).toHaveCount(0);

    await page.reload();
    await expect(column(page, 'Preparing').locator('[data-card-id="app_02"]')).toBeVisible();
  });

  test('drags a card with the mouse into another column', async ({ page, isMobile }) => {
    test.skip(isMobile, 'touch drag uses a long-press; covered by the keyboard and menu tests');
    const from = await card(page, 'app_02').boundingBox();
    const to = await column(page, 'Decided').boundingBox();
    if (!from || !to) throw new Error('missing boxes');
    await page.mouse.move(from.x + 40, from.y + 60);
    await page.mouse.down();
    await page.mouse.move(from.x + 60, from.y + 70, { steps: 5 });
    await page.mouse.move(to.x + to.width / 2, to.y + 120, { steps: 15 });
    await expect(column(page, 'Decided')).toHaveClass(/ring-2/); // highlighted drop column
    await page.mouse.up();
    await expect(column(page, 'Decided').locator('[data-card-id="app_02"]')).toBeVisible();
    await expect(column(page, 'Decided').getByText('Awaiting decision')).toBeVisible();
  });

  test('moves a card with the card menu', async ({ page }) => {
    await card(page, 'app_02').hover();
    await card(page, 'app_02').getByRole('button', { name: /^Actions for/ }).click();
    await page.getByRole('menuitemradio', { name: 'Submitted' }).click();
    await expect(column(page, 'Submitted').locator('[data-card-id="app_02"]')).toBeVisible();
  });

  test('adds an application from the dialog into the chosen column', async ({ page }) => {
    await column(page, 'Decided').getByRole('button', { name: 'Add new to Decided' }).click();
    const dialog = page.getByRole('dialog', { name: 'Add application' });
    await expect(dialog).toBeVisible();
    await dialog.getByRole('combobox').fill('Fulbright');
    await dialog.getByRole('option').first().click();
    await expect(dialog).toBeHidden();
    await expect(column(page, 'Decided').getByTestId('pipeline-card')).toHaveCount(1);
    await expect(column(page, 'Decided').getByText(/Fulbright/)).toBeVisible();
  });

  test('switches to Professor Outreach', async ({ page }) => {
    await page.getByRole('button', { name: /Professor Outreach/ }).click();
    await expect(page.getByRole('button', { name: /Professor Outreach/ })).toHaveAttribute('aria-pressed', 'true');
    await expect(column(page, 'Prospect').getByRole('heading', { name: 'Prospect' })).toBeVisible();
    await expect(column(page, 'Funded Offer')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Add professor' })).toBeVisible();
  });

  test('collapses and expands a column from its menu', async ({ page }) => {
    await page.getByRole('button', { name: 'Submitted column options' }).click();
    await page.getByRole('menuitem', { name: 'Collapse column' }).click();
    await page.getByRole('button', { name: 'Expand Submitted column' }).click();
    await expect(page.getByRole('button', { name: 'Submitted column options' })).toBeVisible();
  });

  test('filters by deadline window', async ({ page }) => {
    await page.getByRole('button', { name: 'Filter' }).click();
    await page.getByLabel('Deadline').selectOption('7');
    await page.keyboard.press('Escape');
    await expect(page.getByRole('button', { name: /Filter/ })).toContainText('1');
  });
});
