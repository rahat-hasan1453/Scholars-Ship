import { expect, installFakeBackend, signedInUser, test, TEST_EMAIL } from './fixtures';
import type { Page } from '@playwright/test';

const next = (page: Page) => page.getByRole('button', { name: 'Next' }).click();

async function walkToLastStep(page: Page) {
  await page.goto('/onboarding');
  await expect(page.getByRole('heading', { name: /scholar profile/ })).toBeVisible();
  await expect(page.getByLabel('Email')).toContainText(TEST_EMAIL);
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
    await expect(page.getByLabel('Email')).toContainText(TEST_EMAIL); // account loaded from /api/auth/me
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
    await page.getByLabel('CGPA (4.0 scale)').fill('3.6');
    await page.getByLabel('English Band (IELTS / TOEFL)').fill('7.5');
    await page.getByRole('button', { name: 'Complete Profile & Reveal Matches' }).click();
    await expect(page).toHaveURL(/\/\?welcome=true$|\/$/);
    expect(backend.onboardingPayload).toMatchObject({
      name: 'QA Student', degreeLevel: 'PhD', specializations: ['Computer Science'], targetCountries: ['Germany'], cgpa: 3.6,
    });
    expect(consoleErrors, consoleErrors.join('\n')).toEqual([]);
  });

  // BUG-17 (fixed in PR #7): a failed save shows an error and keeps the user on step 5.
  test('shows an error and stays when saving the profile fails', async ({ page }) => {
    await installFakeBackend(page, { user: signedInUser({ onboardingCompleted: false }), failCompleteOnboarding: true });
    await walkToLastStep(page);
    await page.getByRole('button', { name: 'Complete Profile & Reveal Matches' }).click();
    await expect(page.getByRole('alert').filter({ hasText: /couldn’t save your profile/ })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Academic Background & Test Scores' })).toBeVisible();
    await expect(page).toHaveURL(/\/onboarding$/);
  });
});
