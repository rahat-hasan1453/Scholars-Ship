import { test as base, type Page, type Route } from '@playwright/test';

/* Browser-level fake backend: every /api call is answered here, so no database, email, Google or OpenAlex is touched. */
export const VALID_CODE = '12345';
export const TEST_EMAIL = 'qa.student@example.test';

type User = { id: string; email: string; name: string; onboardingCompleted: boolean };
export type FakeBackend = {
  user: User | null;
  /** user that verify-code signs in (null = new account) */
  existing: Partial<User> | null;
  sendCodeCalls: string[];
  onboardingPayload: Record<string, unknown> | null;
  failCompleteOnboarding: boolean;
};

const json = (route: Route, body: unknown, status = 200) =>
  route.fulfill({ status, contentType: 'application/json', body: JSON.stringify(body) });

const opportunity = {
  id: 'opp-qa-1', authorName: 'Prof. QA Test', authorTitle: 'Professor', institution: 'TU Munich', source: 'web',
  sourceUrl: 'https://example.test/post/1', postedAgo: '1d ago', postedDate: '2026-09-30', title: 'Fully funded PhD in Machine Learning',
  content: 'PhD position in ML at TU Munich.', funding: 'Fully Funded', degrees: ['PhD'], fieldTags: ['Machine Learning'], country: 'Germany',
};

export async function installFakeBackend(page: Page, init: Partial<FakeBackend> = {}): Promise<FakeBackend> {
  const state: FakeBackend = { user: null, existing: null, sendCodeCalls: [], onboardingPayload: null, failCompleteOnboarding: false, ...init };
  let lastSend = 0;

  await page.route('**/api/**', async (route) => {
    const req = route.request();
    const path = new URL(req.url()).pathname;
    const body = req.postDataJSON?.() ?? {};

    switch (path) {
      case '/api/auth/me':
        return json(route, state.user ? { authenticated: true, user: state.user } : { authenticated: false, user: null });
      case '/api/auth/email/send-code': {
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(body.email ?? '')) return json(route, { success: false, error: 'Please enter a valid email address.' }, 400);
        const wait = Math.ceil((lastSend + 60_000 - Date.now()) / 1000);
        if (lastSend && wait > 0) return json(route, { success: false, error: `Please wait ${wait}s before requesting a new code.`, retryAfterSeconds: wait }, 429);
        lastSend = Date.now();
        state.sendCodeCalls.push(body.email);
        return json(route, { success: true });
      }
      case '/api/auth/email/verify-code': {
        if (body.code !== VALID_CODE) return json(route, { success: false, reason: 'invalid', error: 'Incorrect code. Please check your email and try again.' }, 400);
        state.user = { id: 'u-qa', email: body.email, name: body.email.split('@')[0], onboardingCompleted: false, ...state.existing };
        return json(route, { success: true, user: state.user });
      }
      case '/api/auth/complete-onboarding':
        if (state.failCompleteOnboarding) return json(route, { success: false, error: 'Failed to complete onboarding.' }, 500);
        state.onboardingPayload = body;
        if (state.user) state.user = { ...state.user, onboardingCompleted: true };
        return json(route, { success: true, user: state.user });
      case '/api/auth/logout':
        state.user = null;
        return json(route, { success: true });
      case '/api/auth/google':
        return route.fulfill({ status: 302, headers: { location: '/login?error=google_config_missing' } });
      case '/api/opportunities/live':
        return json(route, { success: true, count: 1, sourceCount: 1, data: [opportunity], syncedAt: new Date().toISOString() });
      case '/api/research/search':
        return json(route, { success: true, count: 0, papers: [] });
      case '/api/professors/search':
        return json(route, { success: true, count: 0, professors: [] });
      default:
        return route.continue(); // e.g. /api/scholarships serves bundled mock data
    }
  });
  return state;
}

export const signedInUser = (over: Partial<User> = {}): User => ({ id: 'u-qa', email: TEST_EMAIL, name: 'QA Student', onboardingCompleted: true, ...over });

export const test = base.extend<{ consoleErrors: string[] }>({
  consoleErrors: async ({ page }, use) => {
    const errors: string[] = [];
    page.on('console', (m) => m.type() === 'error' && errors.push(m.text()));
    page.on('pageerror', (e) => errors.push(e.message));
    // eslint-disable-next-line react-hooks/rules-of-hooks -- Playwright fixture "use", not a React hook
    await use(errors);
  },
});
export { expect } from '@playwright/test';
