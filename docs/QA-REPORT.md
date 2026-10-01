# QA Report / কিউএ রিপোর্ট

| | |
|---|---|
| **কোড / Code under test** | `main` @ `5730706` (PR #1 passwordless auth, #2 onboarding, #3 lucide icons, #4 docs, #5 auth rate limits, #9 Terms consent) merged into the QA branch |
| **QA branch** | `claude/optimistic-blackburn-1aeb1b` (main + tests) |
| **তারিখ / Date** | 2026-10-01 (run #1), 2026-10-02 (runs #2–#4) |
| **রান / Run** | #4: re-tested after PR #5 and #9. BUG-02, BUG-03 and BUG-16 are **fixed**; their tests are now normal tests, plus new rate-limit tests. #3 (2026-10-02): E2E + axe accessibility in Chromium, Firefox, WebKit (desktop 1728) and Chromium mobile (375). #2: same checks re-run after merging `main`. `src/lib`, `src/app/api` and `prisma` are identical to run #1, so every auth/API finding still applies. E2E, visual, accessibility, performance: next runs |

## সারসংক্ষেপ / Summary

| Test type | Passed | Failed | Known bug (`it.fails`) | Skipped / Not run |
|---|---|---|---|---|
| TypeScript (`tsc --noEmit`) | ✅ | 0 | – | – |
| Lint (`npm run lint`) | – | ❌ 62 errors, 165 warnings (run #1: 63 / 177) | – | – |
| Build (`npm run build`) | ✅ in a path without `'` (all routes incl. `/onboarding`) | ❌ in the project folder (BUG-01) | – | – |
| `npm audit` | ✅ prod: 0 | – | dev: 3 high (deepmerge-ts via prisma) | – |
| Unit (Vitest), `tests/unit` | 38 | 0 | 5 | `AppContext` not yet covered |
| API (Vitest), `tests/api` | 43 | 0 | 4 | `research/chat`, `professors` GET/POST not yet covered |
| E2E (Playwright), `tests/e2e`: 4 projects | 70 | 0 | 7 (BUG-17, 18) | 3 (Firefox: clock-based resend test, hydration check; mobile: logout) |
| Accessibility (axe, WCAG 2.1 AA) in E2E | 1 (Firefox home) | – | 11 (BUG-19) | – |
| Visual (Figma) / Lighthouse | – | – | – | Not run yet |

**`it.fails` কী? / What is `it.fails`?** প্রতিটা জানা bug-এর জন্য একটা test আছে, যেটা bug থাকা পর্যন্ত "expected fail" দেখায়। তাই `npm test` এখন সবুজ। Bug ঠিক হলে test-টা লাল হবে, তখন `it.fails` বদলে `it` করতে হবে।
Each known bug has a test that is expected to fail while the bug exists, so `npm test` stays green. When a bug is fixed, that test turns red: change `it.fails` to `it`.

চালানোর নিয়ম / How to run: `npm test` (unit + API), `npm run test:e2e` (browser; starts `next dev` on port 3100). E2E-তে সব `/api` call browser-এই নকল করা (`tests/e2e/fixtures.ts`), তাই database/email/Google লাগে না। / In E2E every `/api` call is faked in the browser, so no DB, email or Google is needed. Test code `12345` exists only in that fake. আসল email, Google, OpenAlex বা database কিছুই ব্যবহার হয় না, সব mock (নকল)। / No real email, Google, OpenAlex or database: all mocked.

## যা ঠিকমতো কাজ করছে / Verified working
- Session cookie HMAC দিয়ে sign করা থাকে। এডিট করা, পুরনো unsigned base64, অন্য secret দিয়ে sign করা বা মেয়াদোত্তীর্ণ (৩০ দিনের বেশি) cookie বাতিল হয়। `httpOnly`, `sameSite=lax` চালু, production-এ `secure`। Production-এ দুর্বল `SESSION_SECRET` থাকলে app চলবে না। *(Earlier "unsigned base64 session cookie": **fixed**, re-verified on `dbc599c`.)*
  Session cookie is HMAC-signed. Tampered, legacy unsigned base64, wrong-secret and expired (30+ days) cookies are rejected. `httpOnly` and `sameSite=lax` are set, plus `secure` in production. The app refuses a weak `SESSION_SECRET` in production.
- Login code: ৫ অঙ্কের, শুধু SHA-256 hash সংরক্ষিত, ১০ মিনিটে মেয়াদ শেষ, একবারই ব্যবহার করা যায়, ৬০ সেকেন্ড resend cooldown, প্রতি code-এ ৫ বার ভুল দিলে lock। একসাথে অনেক অনুমান পাঠালেও সংখ্যা ঠিকমতো গোনা হয় (atomic)। এক email-এর code দিয়ে অন্য email-এ ঢোকা যায় না। Response-এ code ফেরত আসে না। *(Earlier "plaintext passwords" and "in-memory user/OTP store on serverless": **fixed**, re-verified on `dbc599c`. Passwords and forgot/reset-password are removed; users and codes live in Prisma/PostgreSQL.)*
  Login code: 5 digits, only the SHA-256 hash is stored, expires in 10 minutes, single use, 60s resend cooldown, locked after 5 wrong tries per code. Parallel guesses are counted atomically. A code for one email cannot sign in another email. The code is never returned in the response.
- Google OAuth: CSRF-এর জন্য `state` cookie মিলিয়ে দেখা হয়। Google-এ email verified না থাকলে ঢুকতে দেয় না। সব redirect app-এর নিজের origin-এই যায়, open redirect নেই।
  Google OAuth: the CSRF `state` cookie is checked. Unverified Google emails are rejected. Every redirect stays on the app origin, so there is no open redirect.
- `complete-onboarding`: email সবসময় session থেকে নেওয়া হয়, body থেকে নয়। Body-তে পাঠানো `email` বা `onboardingCompleted` উপেক্ষা করা হয়।
  `complete-onboarding`: the email always comes from the session, never the body. `email` and `onboardingCompleted` sent in the body are ignored.
- কোথাও `dangerouslySetInnerHTML` নেই, তাই feed-এর data দিয়ে XSS-এর ঝুঁকি কম। Secret-যুক্ত কোনো file commit করা নেই।
  No `dangerouslySetInnerHTML` anywhere, so XSS risk from feed data is low. No files with secrets are committed.

## আগের সমস্যার পুনর্যাচাই / Earlier issues re-checked (run #2)

| Earlier issue | Status | Evidence |
|---|---|---|
| Unsigned base64 session cookie | ✅ Fixed | `tests/unit/auth-session.test.ts` (forged/legacy cookie rejected), `tests/api/auth-routes.test.ts` (`/me` with forged cookie) |
| Plaintext passwords | ✅ Fixed (removed) | No password fields or routes; sign-in is Google or email code only |
| In-memory user/OTP store on serverless | ✅ Fixed | `src/lib/users.ts`, `src/lib/loginCodes.ts` use Prisma (`User`, `LoginCode` tables) |

## Bugs / বাগ

| ID | Severity | Title | Fix owner |
|---|---|---|---|
| BUG-02 | ~~High~~ ✅ **Fixed (PR #5)** | Login code brute force across re-issued codes | Signup |
| BUG-01 | Medium | Local `npm run build` fails because of `'` in folder path | GenOps |
| BUG-03 | ~~Medium~~ ✅ **Fixed (PR #5)** | No per-IP rate limit on send-code (email bombing) | Signup |
| BUG-04 | Medium | Search "USA" matches Australia/Austria/Russia | GenOps (Home) |
| BUG-13 | Medium | Professor search invents data (open positions, PI title, random photo) | GenOps (Home) |
| BUG-05 | Low | Degree/category keyword false positives ("systems" = Masters) | GenOps (Home) |
| BUG-09 | Low | `complete-onboarding` stores any JSON with no validation/size limit | Signup / Onboarding |
| BUG-10 | Low | Ingest API "key" check accepts any `highscholar_*` string | GenOps |
| BUG-06 | Low | `ignoreBuildErrors: true` hides type errors in builds | GenOps |
| BUG-14 | Low | 62 lint errors (incl. 9 setState-in-effect) | GenOps / owners |
| BUG-07 | Low | Countdown shows "NaNd NaNh left" for a bad date | GenOps (Home) |
| BUG-08 | Low | Empty specialization gets the +10 match bonus | GenOps (Home) |
| BUG-11 | Low | Research search reports OpenAlex outage as success, 0 papers | GenOps (Home) |
| BUG-12 | Low | `?limit=abc` returns no opportunities; `?tag=` ignored | GenOps (Home) |
| BUG-15 | Low | Sessions can't be revoked server-side; send-code email links use Host header when `NEXT_PUBLIC_APP_URL` unset | Signup |
| BUG-17 | **Medium** | Onboarding save failure is ignored: user sent home, then bounced back, answers lost | Onboarding |
| BUG-18 | Medium | `/?tab=...` deep link causes a React hydration error (whole page re-rendered) | GenOps (Home) |
| BUG-19 | Medium | Accessibility: low-contrast grey text everywhere, unnamed controls (WCAG 2.1 AA) | GenOps + Design |
| BUG-16 | ~~Low~~ ✅ **Fixed (PR #9)** | Terms checkbox can be unticked and sign-in still continues | Signup |
| BUG-20 | Low | Route protection is client-side only (home renders, then redirects) | Signup / GenOps |

### BUG-02 · ✅ Fixed in PR #5 (was High) · Login code brute force / লগইন কোড অনুমান করে ঢোকা
- **Verified (run #4):** 10 wrong guesses per email per hour across all codes, then `locked` (even for the right code); unlocks after the hour; a successful sign-in resets the counter; at most 5 codes per email per hour. Tests: `tests/unit/loginCodes.test.ts`, `tests/api/auth-routes.test.ts` ("429 locked after 10 wrong guesses"). Remaining risk is about 10 guesses/hour ≈ 240/day ≈ 0.24%/day per account; a 6-digit code would cut it 10×.
- **File:** `src/lib/loginCodes.ts:21-22` (5-digit code; every new code resets `attempts: 0`)
- **বাংলা:** প্রতিটা code-এ ৫ বার ভুল করার সীমা আছে। কিন্তু ৬০ সেকেন্ড পরপর নতুন code চাইলে সেই সীমা আবার শূন্য থেকে শুরু হয়। ফলে কেউ অন্যের email দিয়ে দিনে প্রায় ৭,২০০ বার অনুমান করতে পারে। মোট সম্ভাব্য code ১,০০,০০০টা, তাই প্রতিদিন প্রায় ৭% সম্ভাবনা যে সে অন্যের account-এ ঢুকে যাবে।
- **English:** The 5-attempt limit is per code, and a new code every 60s resets it. An attacker can make about 7,200 guesses a day against one email in a 100,000-code space, which is roughly a 7% chance per day of taking over that account.
- **Repro:** `tests/unit/loginCodes.test.ts` → "limits total wrong guesses per email across re-issued codes" (3 rounds give 15 guesses).
- **Expected:** A per-email limit across codes (e.g. 10 wrong attempts per hour, then lock), plus per-IP limits. A 6-digit code would also help.
- **Actual:** 5 guesses per minute, with no upper bound.

### BUG-01 · Medium · Build fails in this folder / এই folder-এ build ব্যর্থ
- **বাংলা:** Folder-এর নাম "Scholars**'** Ship"। Next.js file-এর path একটা `'...'` string-এর ভেতরে বসায়, তাই webpack-এর `favicon.ico` loader ভেঙে যায় (`Module parse failed: Unexpected token`)। একই কোড এমন path-এ build করলে, যার নামে `'` নেই, build সফল হয় আর ২০টা route তৈরি হয়। Vercel-এ সমস্যা হওয়ার কথা নয়।
- **English:** The folder name contains an apostrophe. Next.js puts the file path inside a `'...'` string, which breaks the webpack `favicon.ico` metadata loader. The same code builds fine (20 routes) in a path without `'`. Vercel should be unaffected.
- **Fix:** Rename the folder, e.g. `Scholars-Ship`, or report it upstream to Next.js.

### BUG-03 · ✅ Fixed in PR #5 (was Medium) · No per-IP rate limit on send-code
- **Verified (run #4):** 10 sends per IP per hour (11th → 429 with `Retry-After` and `rateLimited: true`), and other IPs are not affected; verify is limited to 30 per IP per hour. Note: the IP comes from `x-forwarded-for`, which is trustworthy on Vercel but spoofable if the app is ever hosted behind another proxy.
- **File:** `src/app/api/auth/email/send-code/route.ts:16`. The cooldown is per email only.
- **বাংলা:** একজন একই কম্পিউটার থেকে হাজার হাজার আলাদা email-এ code পাঠাতে পারে। এতে মানুষ spam পায়, SMTP বা Resend-এর quota শেষ হয়, আর sender-এর reputation নষ্ট হয়।
- **English:** One client can trigger codes to unlimited different addresses. That spams people, burns the SMTP/Resend quota and hurts sender reputation.
- **Repro:** `tests/api/auth-routes.test.ts` → "rate-limits one client sending codes to many addresses" (30 different emails, all return 200).
- **Expected:** Per-IP and global limits (e.g. Vercel KV/Upstash, or the Vercel Firewall rate limit), and a CAPTCHA after N requests.

### BUG-04 · Medium · "USA" search matches Australia etc.
- **File:** `src/lib/semanticSearch.ts:157`. `c.includes('us')` is true for Australia, Austria, Russia, Belarus and Cyprus.
- **Repro:** `matchItemSemantically('PhD position', 'Australia', parse('phd position usa'))` → `matches: true`.
- **Expected:** Exact or alias match (`usa`, `united states`, `us`).

### BUG-13 · Medium · Professor search shows invented data / ভুয়া তথ্য
- **File:** `src/app/api/professors/search/route.ts:70-85`
- **বাংলা:** OpenAlex-এর যেকোনো লেখক (৫টার বেশি paper থাকলেই) দেখানো হয়:
  - "Principal Investigator & Research Faculty" পদবি দিয়ে
  - `openPositions: true` (সবার lab-এ নাকি জায়গা খালি আছে) দিয়ে
  - "Fall 2026, Spring 2027"-এ ভর্তি নেওয়ার কথা বলে
  - এলোমেলো একটা Unsplash ছবি দিয়ে, যেটা সেই মানুষের নয়

  ছাত্রছাত্রীরা ভুল তথ্য দেখে email পাঠাতে পারে।
- **English:** Every OpenAlex author with more than 5 works is shown as a "Principal Investigator" with `openPositions: true`, "Fall 2026, Spring 2027" intake, and a computed Unsplash photo that is not that person. Students may act on false information.
- **Expected:** Show only real data. Mark unknown fields as unknown, use initials avatars.

### BUG-05 · Low · Keyword false positives
- **File:** `src/lib/semanticSearch.ts:117` (`/ms/` matches "systems", "programs", "algorithms") and `:122` (`/pi|lab/` matches "topic", "available").
- **Expected:** Word boundaries, e.g. `\bms\b`, `\bpi\b`.

### BUG-09 · Low · Onboarding payload not validated
- **File:** `src/app/api/auth/complete-onboarding/route.ts:13`. Any keys of any size are saved to `profileData`, and `name` has no length limit.
- **Repro:** `tests/api/auth-routes.test.ts` → "rejects an oversized / unexpected profile payload" (600 KB is accepted).
- **Expected:** A whitelist of fields (zod schema) and a size limit.

### BUG-10 · Low · Fake API key check
- **File:** `src/app/api/scholarships/route.ts:41`, `src/app/api/professors/route.ts:41`. Any `highscholar_<anything>` is accepted. Low for now because nothing is saved; it becomes **High** once these routes write to the database.

### BUG-06 · Low · `ignoreBuildErrors: true`
- **File:** `next.config.ts:6`. Type errors no longer block a deploy. `tsc` passes today, so turning this off is safe.

### BUG-14 · Low · Lint errors
- 37 × `no-explicit-any`, 16 × `react/no-unescaped-entities`, 9 × React Compiler `set-state-in-effect` (`src/components/UnifiedHubView.tsx:91,207,267`, `src/context/AppContext.tsx:97`, `src/components/AdvancedFilterModal.tsx:47`, `src/components/ResearchBotModal.tsx:43`, `src/app/page.tsx:105`, `src/app/login/page.tsx:48`). In auth files: `src/app/login/page.tsx:48`, `src/lib/email.ts:130`.

### BUG-07, 08, 11, 12 · Low
- **BUG-07:** `src/lib/utils.ts:21`. An invalid date gives `NaN`, and the card shows "NaNd NaNh left".
- **BUG-08:** `src/lib/utils.ts:71`. `''` matches every specialization (+10).
- **BUG-11:** `src/app/api/research/search/route.ts:26`. Upstream failure returns `200 { success: true, count: 0 }`; `professors/search` returns 502.
- **BUG-12:** `src/app/api/opportunities/live/route.ts:217,264`. `limit=abc` gives `slice(0, NaN)`, which is `[]`. `tag` (line 216) is read but never used.

### BUG-15 · Low · Session and email notes
- Logout only deletes the cookie. A stolen cookie stays valid for up to 30 days, because there is no server-side session list or version check.
- `send-code/route.ts:28`: if `NEXT_PUBLIC_APP_URL` is not set, the email logo URL comes from the request's Host header. Make sure `NEXT_PUBLIC_APP_URL` is set on Vercel.
- Dev-only: the sign-in code is printed to the server console when `NODE_ENV !== 'production'` (fine locally, and Vercel previews run as production).

### BUG-17 · Medium · Onboarding save failure ignored / প্রোফাইল সেভ ব্যর্থ হলেও এগিয়ে যায়
- **File:** `src/components/OnboardingModal.tsx:320-334`. The `fetch('/api/auth/complete-onboarding')` result is never checked, and the code always calls `router.push('/?welcome=true')`.
- **বাংলা:** Server-এ প্রোফাইল সেভ না হলেও (যেমন 500 error বা session শেষ হয়ে গেলে) কোনো error দেখায় না, সরাসরি Home-এ পাঠিয়ে দেয়। Home তখন দেখে onboarding শেষ হয়নি, তাই আবার `/onboarding`-এ ফেরত পাঠায়। ফলে ব্যবহারকারীর সব উত্তর হারিয়ে যায়।
- **English:** If the server save fails (500, expired session), no error is shown and the user is sent home. Home sees `onboardingCompleted=false` and bounces back to `/onboarding`, so the answers are lost.
- **Repro:** `tests/e2e/onboarding.spec.ts` → "shows an error and stays when saving the profile fails".
- **Expected:** Check `res.ok`, show an error, stay on step 5, offer a retry.

### BUG-18 · Medium · Hydration error on `/?tab=`
- **File:** `src/app/page.tsx:87-96`. `useState(() => window.location...)` picks the tab on the client, but the server rendered the default tab. React logs "Hydration failed…" and re-renders the whole tree, which is slower and can flash.
- **Repro:** open `/?tab=scholarships` while signed in (Chromium/WebKit console). Test: `tests/e2e/home.spec.ts` → "deep link ?tab=scholarships renders without a hydration error".
- **Expected:** Read the tab with `useSearchParams()`, or set it in an effect after mount.

### BUG-19 · Medium · Accessibility (WCAG 2.1 AA, axe)
| Page | Violations (serious/critical) |
|---|---|
| `/login` | `color-contrast` ×3: `text-text-secondary` **#919EAB on white = 2.73:1** (needs 4.5:1), `#98A2B3` 10px = 2.57:1. `aria-prohibited-attr`: `aria-label` on a plain `<div>` (logo) |
| `/onboarding` | `aria-progressbar-name`: progress dots have no label. `color-contrast` ×2 (#919EAB subtitle; placeholder #C0C7D0 = 1.7:1). `aria-prohibited-attr` (logo div) |
| `/` home | `color-contrast` ×81 (#919EAB, #90A1B9 = 2.63:1, #009966 = 3.65:1, brand #7150E7 on #EDE9FE 10px = 4.41:1). Mobile: **critical** `button-name`: the `lg:hidden` icon button has no label |
- **বাংলা:** হালকা ধূসর লেখা (#919EAB) সাদা background-এর ওপর পড়তে কষ্ট হয়, বিশেষ করে যাঁদের চোখে সমস্যা আছে। রঙটা Figma token থেকে এসেছে, তাই Design-এর সাথে কথা বলে গাঢ় করতে হবে (যেমন #637381 ≈ 4.6:1)। Icon button-এ `aria-label`, আর progressbar-এ `aria-label="Step 1 of 5"` লাগবে।
- **English:** The grey secondary text token fails contrast. It comes from Figma, so Design must darken it (e.g. #637381 ≈ 4.6:1). Add `aria-label` to the icon button and the progressbar, and `role="img"` (or remove `aria-label`) on the logo div.
- **Repro:** `tests/e2e/a11y.spec.ts` (full JSON attached in the Playwright HTML report).

### BUG-16 · ✅ Fixed in PR #9 (was Low) · Terms checkbox not enforced
- **Verified (run #4, all 4 browser projects):** Terms start unticked; "Continue with email" and Google stay disabled and Enter sends nothing until ticked.
- **File:** `src/app/login/page.tsx:38` (`agreeTerms` is set but never checked before `sendCode`). Untick Terms, then Continue: the code is still sent. Test: `tests/e2e/auth.spec.ts` → "cannot continue without accepting the Terms".

### BUG-20 · Low · Client-only route protection
- There is no `proxy.ts`/middleware. `/` and `/onboarding` render for signed-out visitors, then `useEffect` calls `/api/auth/me` and redirects. The data APIs are public anyway, so the risk is low, but the page flashes and a no-JS visitor sees the app shell.

### E2E: যা পাস করেছে / What passed (all 4 browser projects)
- New user: email → 5-digit code → `/onboarding`. Returning onboarded user → `/`. Email is normalized (trim, lowercase).
- Wrong code: error shown, input cleared. Letters are ignored, and Continue stays disabled until 5 digits.
- Resend: locked for 60s, then sends a new code. A server 429 cooldown message is shown. Change email keeps the address.
- Google `?error=` codes are shown as friendly text, and an HTML injection in `?error=` is not rendered (no XSS).
- Route guards: signed-out → `/login`; not onboarded → `/onboarding`; onboarded visiting `/onboarding` → `/`.
- Onboarding: step validation (name, ≥1 field, ≥1 country), Back/Next, and the payload sent to the API matches the inputs.
- Home: no console errors, **no horizontal scroll at 375px and 1728px**, `?tab=` views open, logout clears the session → `/login`.

### টেস্ট পরিবেশের নোট / Test environment notes
- E2E runs on `next dev` because `npm run build` fails in this folder (BUG-01). The dev server compiles pages on first visit, which occasionally races in Firefox, so the config allows 1 retry and reports such tests as "flaky".

## পরের ধাপ / Next runs
1. Figma visual comparison (needs the Figma connector authorized), Lighthouse (mobile + desktop).
2. `AppContext` unit tests; E2E for bookmarks/track, Kanban, feed filters and search.
3. Exploratory pass with the browser pane (console + network errors).
