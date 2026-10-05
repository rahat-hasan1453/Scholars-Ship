import { expect, installFakeBackend, signedInUser, test, TEST_EMAIL, VALID_CODE } from './fixtures';
import type { Page } from '@playwright/test';

async function requestCode(page: Page, email = TEST_EMAIL) {
  await page.goto('/login');
  await page.waitForLoadState('networkidle'); // let React hydrate before typing (Firefox + dev server is slow)
  await page.getByLabel('Email').fill(email);
  await page.getByRole('button', { name: 'Continue with email' }).click();
  await expect(page.getByRole('heading', { name: 'Verify your email' })).toBeVisible();
}
const typeCode = (page: Page, code: string) => page.getByLabel('Sign-in code').pressSequentially(code);

test.describe('Passwordless sign-in', () => {
  test('new user: email -> code -> onboarding', async ({ page, consoleErrors }) => {
    const backend = await installFakeBackend(page);
    await requestCode(page, '  QA.Student@Example.TEST ');
    expect(backend.sendCodeCalls).toEqual([TEST_EMAIL]);
    await expect(page.getByText(`We sent a 5-digit code to ${TEST_EMAIL}`)).toBeVisible();
    await typeCode(page, VALID_CODE);
    await page.getByRole('button', { name: 'Continue', exact: true }).click();
    await expect(page).toHaveURL(/\/onboarding$/);
    expect(consoleErrors, consoleErrors.join('\n')).toEqual([]);
  });

  test('returning onboarded user goes straight home', async ({ page }) => {
    await installFakeBackend(page, { existing: { onboardingCompleted: true, name: 'QA Student' } });
    await requestCode(page);
    await typeCode(page, VALID_CODE);
    await page.getByRole('button', { name: 'Continue', exact: true }).click();
    await expect(page).toHaveURL(/\/$/);
  });

  test('wrong code shows an error and clears the input', async ({ page }) => {
    await installFakeBackend(page);
    await requestCode(page);
    await typeCode(page, '99999');
    await page.getByRole('button', { name: 'Continue', exact: true }).click();
    await expect(page.getByText('Incorrect code. Please check your email and try again.')).toBeVisible();
    await expect(page.getByLabel('Sign-in code')).toHaveValue('');
    await expect(page).toHaveURL(/\/login/);
  });

  test('Continue stays disabled until 5 digits; letters are ignored', async ({ page }) => {
    await installFakeBackend(page);
    await requestCode(page);
    const cont = page.getByRole('button', { name: 'Continue', exact: true });
    await typeCode(page, '12ab3');
    await expect(page.getByLabel('Sign-in code')).toHaveValue('123');
    await expect(cont).toBeDisabled();
  });

  test('resend is locked for 60s, then sends a new code', async ({ page, browserName }) => {
    test.skip(browserName === 'firefox', 'page.clock does not take over the countdown timer in Firefox; covered in Chromium/WebKit');
    await page.clock.install();
    const backend = await installFakeBackend(page);
    await requestCode(page);
    const resend = page.getByRole('button', { name: /Resend/ });
    await expect(resend).toBeDisabled();
    await expect(resend).toHaveText(/Resend in \d+s/);
    await page.clock.runFor(61_000);
    await expect(resend).toHaveText('Resend code');
    await expect(resend).toBeEnabled();
    // fake backend uses real Date.now(); clear its cooldown before resending
    await page.unrouteAll({ behavior: 'ignoreErrors' });
    const b2 = await installFakeBackend(page);
    await resend.click();
    await expect(page.getByText('A new code has been sent.')).toBeVisible();
    expect(backend.sendCodeCalls.length + b2.sendCodeCalls.length).toBe(2);
  });

  test('server cooldown (429) is shown on the email step', async ({ page }) => {
    await installFakeBackend(page);
    await requestCode(page);
    await page.getByRole('button', { name: '← Change email' }).click();
    await page.getByRole('button', { name: 'Continue with email' }).click();
    await expect(page.getByText(/Please wait \d+s before requesting a new code/)).toBeVisible();
  });

  test('change email goes back to the email step and keeps the address', async ({ page }) => {
    await installFakeBackend(page);
    await requestCode(page);
    await page.getByRole('button', { name: '← Change email' }).click();
    await expect(page.getByRole('heading', { name: 'Welcome!' })).toBeVisible();
    await expect(page.getByLabel('Email')).toHaveValue(TEST_EMAIL);
  });

  test('server-side email validation error is displayed', async ({ page }) => {
    const backend = await installFakeBackend(page);
    await page.goto('/login');
    await page.waitForLoadState('networkidle');
    await page.getByLabel('Email').fill('a@b');
    await page.getByRole('button', { name: 'Continue with email' }).click();
    await expect(page.getByText('Please enter a valid email address.')).toBeVisible();
    expect(backend.sendCodeCalls).toEqual([]);
  });

  test('Google error codes from the callback are shown as friendly text', async ({ page }) => {
    await installFakeBackend(page);
    await page.goto('/login?error=access_denied');
    await expect(page.getByText('Google sign-in was cancelled.')).toBeVisible();
    await page.goto('/login?error=<img src=x onerror=alert(1)>');
    await expect(page.getByText('Google sign-in failed. Please try again or use your email.')).toBeVisible();
  });

  // The Terms checkbox was removed; buttons work right away and the legal pages are linked instead.
  test('no Terms checkbox; Terms and Privacy links open their pages', async ({ page }) => {
    await installFakeBackend(page);
    await page.goto('/login');
    await page.waitForLoadState('networkidle');
    await expect(page.getByRole('checkbox')).toHaveCount(0);
    await expect(page.getByRole('button', { name: 'Continue with email' })).toBeEnabled();
    await expect(page.getByRole('button', { name: /Google/ })).toBeEnabled();
    const legal = page.getByRole('navigation', { name: 'Legal' });
    await legal.getByRole('link', { name: 'Terms of Service' }).click();
    await expect(page).toHaveURL(/\/terms$/);
    await expect(page.getByRole('heading', { name: 'Terms of Service' })).toBeVisible();
    await page.goto('/login');
    await page.getByRole('navigation', { name: 'Legal' }).getByRole('link', { name: 'Privacy Policy' }).click();
    await expect(page).toHaveURL(/\/privacy$/);
    await expect(page.getByRole('heading', { name: 'Privacy Policy' })).toBeVisible();
  });
});

test.describe('Route protection', () => {
  test('signed-out visitor to / and /onboarding is sent to /login', async ({ page }) => {
    await installFakeBackend(page);
    await page.goto('/');
    await expect(page).toHaveURL(/\/login$/);
    await page.goto('/onboarding');
    await expect(page).toHaveURL(/\/login$/);
  });
  test('signed-in user who has not onboarded is sent from / to /onboarding', async ({ page }) => {
    await installFakeBackend(page, { user: signedInUser({ onboardingCompleted: false }) });
    await page.goto('/');
    await expect(page).toHaveURL(/\/onboarding$/);
  });
  test('onboarded user visiting /onboarding is sent home', async ({ page }) => {
    await installFakeBackend(page, { user: signedInUser() });
    await page.goto('/onboarding');
    await expect(page).toHaveURL(/\/$/);
  });
});
