import { expect, installFakeBackend, signedInUser, test, TEST_EMAIL } from './fixtures';
import type { Page } from '@playwright/test';

const next = (page: Page) => page.getByRole('button', { name: 'Next' }).click();

async function walkToLastStep(page: Page) {
  await page.goto('/onboarding');
  await expect(page.getByRole('heading', { name: /scholar profile/ })).toBeVisible();
  await expect(page.getByLabel('Email')).toHaveValue(TEST_EMAIL);
  await page.getByLabel('Full name').fill('QA Student');
  await next(page);
  await page.getByRole('radio', { name: /PhD/ }).click();
  await next(page);
  await next(page);
  await expect(page.getByText('Select at least one field of study.')).toBeVisible();
  await page.getByRole('button', { name: /^Computer Science\b/ }).click();
  await next(page);
  await next(page);
  await expect(page.getByText('Select at least one country.')).toBeVisible();
  await page.getByRole('checkbox', { name: /Germany/ }).click();
  await next(page);
  await expect(page.getByRole('heading', { name: 'Academic Background & Test Scores' })).toBeVisible();
}

test.describe('Onboarding (5 steps)', () => {
  test('step 1 requires a name', async ({ page }) => {
    await installFakeBackend(page, { user: signedInUser({ onboardingCompleted: false, name: '' }) });
    await page.goto('/onboarding');
    await expect(page.getByLabel('Email')).toHaveValue(TEST_EMAIL); // account loaded from /api/auth/me
    await page.getByLabel('Full name').fill('x');
    await page.getByLabel('Full name').fill('');
    await next(page);
    await expect(page.getByText('Enter your full name and a valid email to continue.')).toBeVisible();
    await expect(page.getByRole('progressbar')).toHaveAttribute('aria-valuenow', '1');
  });

  test('completes all steps, saves the profile and lands on home', async ({ page, consoleErrors }) => {
    const backend = await installFakeBackend(page, { user: signedInUser({ onboardingCompleted: false }) });
    await walkToLastStep(page);
    await page.getByRole('button', { name: 'Back' }).click();
    await expect(page.getByRole('progressbar')).toHaveAttribute('aria-valuenow', '4');
    await next(page);
    await page.getByPlaceholder('3.79').fill('3.6');
    await page.getByPlaceholder('7.5').fill('7.5');
    await page.getByRole('button', { name: 'Complete Profile & Reveal Matches' }).click();
    await expect(page).toHaveURL(/\/\?welcome=true$|\/$/);
    expect(backend.onboardingPayload).toMatchObject({
      name: 'QA Student', degreeLevel: 'PhD', specializations: ['Computer Science'], targetCountries: ['Germany'], cgpa: 3.6,
    });
    expect(consoleErrors, consoleErrors.join('\n')).toEqual([]);
  });

  // BUG-17: if saving fails, the error is swallowed and the user is sent home anyway;
  // home then sees onboardingCompleted=false and bounces back to /onboarding (answers lost).
  test('shows an error and stays when saving the profile fails', async ({ page }) => {
    test.fail();
    await installFakeBackend(page, { user: signedInUser({ onboardingCompleted: false }), failCompleteOnboarding: true });
    await walkToLastStep(page);
    await page.getByRole('button', { name: 'Complete Profile & Reveal Matches' }).click();
    await page.waitForTimeout(1500);
    await expect(page.getByRole('heading', { name: 'Academic Background & Test Scores' })).toBeVisible();
    await expect(page.getByText(/could not|failed|try again/i)).toBeVisible();
  });
});
