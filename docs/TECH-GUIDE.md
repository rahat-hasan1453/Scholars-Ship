# Tech Guide / টেক গাইড

**Project / প্রজেক্ট:** HighScholar (Scholars' Ship)

এই ফাইলে আমাদের ব্যবহৃত সব টেকনোলজির বেসিক ধারণা আছে। নতুন টেকনোলজি যোগ হলে এখানে যোগ করা হবে।
This file explains the basics of every technology we use. It is updated whenever a new technology is added.

---

## 1. Next.js (v16)

| | |
|---|---|
| **বাংলা** | React-এর ওপর ভিত্তি করে ওয়েবসাইট বানানোর ফ্রেমওয়ার্ক। রাউটিং, সার্ভার ও বিল্ড সবই দেয়। |
| **English** | A framework built on React for making websites. It handles routing, server code and builds. |
| **উপমা / Analogy** | React হলো উপকরণ, Next.js হলো পুরো রান্নাঘর। / React is the ingredients, Next.js is the whole kitchen. |
| **প্রজেক্টে / In project** | `app/` ফোল্ডারে পেজ ও রুট থাকে (App Router)। / Pages and routes live in `app/`. |

⚠️ এই Next.js ভার্সনে অনেক breaking change আছে। কাজের আগে `node_modules/next/dist/docs/` দেখতে হবে।
⚠️ This Next.js version has breaking changes. Check `node_modules/next/dist/docs/` before coding.

## 2. React (v19)

| | |
|---|---|
| **বাংলা** | UI-কে ছোট ছোট **component** (ব্লক) আকারে ভাগ করে বানানোর লাইব্রেরি। |
| **English** | A library for building UI out of small reusable **components**. |
| **উপমা / Analogy** | লেগো ব্লক: Button, Card, Form জুড়ে একটা পেজ হয়। / Lego blocks: Button, Card, Form combine into a page. |
| **মূল ধারণা / Key ideas** | `props` = ব্লকে ডেটা পাঠানো (passing data in); `state` = ব্লকের ভেতরের বদলানো ডেটা (changing data inside). |

## 3. TypeScript

| | |
|---|---|
| **বাংলা** | JavaScript-এর সাথে "টাইপ" (ডেটার ধরন) যোগ করা ভাষা। কোড চালানোর আগেই ভুল ধরা পড়ে। |
| **English** | JavaScript plus "types". Mistakes are caught before the code runs. |
| **উপমা / Analogy** | ফোন নম্বরের ঘরে নাম লিখলে সাথে সাথে সতর্কতা। / A warning when you type a name in a phone-number field. |
| **ফাইল / Files** | `.ts`, `.tsx` |

## 4. Tailwind CSS (v4)

| | |
|---|---|
| **বাংলা** | আলাদা CSS না লিখে HTML-এ তৈরি ক্লাস বসিয়ে ডিজাইন করা (`p-4`, `text-lg`, `bg-blue-500`)। Figma-র মাপ, রঙ সহজে মেলানো যায়। |
| **English** | Style by adding ready-made classes in HTML instead of writing CSS. Makes matching Figma sizes and colors easy. |
| **সহায়ক / Helpers** | `tailwind-merge` (ক্লাসের দ্বন্দ্ব মেটায় / resolves class conflicts), `clsx` (শর্ত দিয়ে ক্লাস চালু-বন্ধ / conditional classes) |

## 5. Icons: lucide-react

| | |
|---|---|
| **বাংলা** | তৈরি আইকন সেট। component হিসেবে import করে ব্যবহার করা যায় (যেমন `import { SearchIcon } from 'lucide-react'`)। shadcn/ui-র ডিফল্ট আইকন সেটও এটাই। Figma-তেও Lucide আইকন ব্যবহার হয়, তাই কোড ও ডিজাইন মেলে। আগে Hugeicons ছিল, সেটা বাদ (২০২৬-১০-০১)। |
| **English** | A ready-made icon set, imported and used as components (e.g. `import { SearchIcon } from 'lucide-react'`). It is also shadcn/ui's default icon set. Figma uses Lucide icons too, so code and design match. Hugeicons was used earlier and has been removed (2026-10-01). |
| **নিয়ম / Rule** | আইকনের সাইজ `size={16}` প্রপ দিয়ে, রঙ `className="text-..."` দিয়ে (Figma টোকেন)। / Set size with `size={16}` and color with `className="text-..."` (Figma tokens). |

## 6. canvas-confetti

| | |
|---|---|
| **বাংলা** | সাফল্যের সময় (যেমন সাইনআপ শেষে) কনফেটি অ্যানিমেশন দেখানোর লাইব্রেরি। |
| **English** | A library that shows a confetti animation on success, e.g. after signup. |

## 7. Nodemailer (+ SMTP)

| | |
|---|---|
| **বাংলা** | কোড থেকে ইমেইল পাঠানোর লাইব্রেরি। লগইনের ৫ অঙ্কের কোড ইমেইলে পাঠাতে ব্যবহার করি (ইমেইলে Scholars'ship লোগো থাকে, `public/email/logo.png`)। **SMTP** হলো ইমেইল পাঠানোর প্রোটোকল/সার্ভার (Gmail বা Resend)। |
| **English** | A library for sending email from code. We use it to email the 5-digit sign-in code (branded with the Scholars'ship logo, `public/email/logo.png`). **SMTP** is the email-sending protocol/server (Gmail or Resend). |

⚠️ ইমেইল পাসওয়ার্ড/কী থাকে `.env` ফাইলে। কখনো GitHub-এ পুশ করা যাবে না।
⚠️ Email passwords/keys live in `.env`. Never push them to GitHub.

## 8. Prisma

| | |
|---|---|
| **বাংলা** | ডেটাবেসের সাথে কথা বলার টুল (ORM)। SQL না লিখেও ডেটা সেভ ও পড়া যায়। |
| **English** | A tool (ORM) for talking to the database. Save and read data without writing SQL. |
| **উপমা / Analogy** | ডেটাবেসের জন্য একজন অনুবাদক। / A translator for the database. |
| **প্রজেক্টে / In project** | এখন **বাধ্যতামূলক**: ইউজার (`User`) ও লগইন কোড (`LoginCode`, কোড hash করে রাখা) PostgreSQL-এ থাকে (Neon)। স্কিমা বদলালে ডেটাবেসে প্রয়োগ করতে `npx prisma db push`। / Now **required**: users (`User`) and sign-in codes (`LoginCode`, stored hashed) live in PostgreSQL (Neon). Apply schema changes with `npx prisma db push`. |

## 9. ESLint

| | |
|---|---|
| **বাংলা** | কোডের ভুল ও খারাপ স্টাইল ধরে দেয়। কমান্ড: `npm run lint` |
| **English** | Finds mistakes and bad style in code. Command: `npm run lint` |

## 10. Vercel

| | |
|---|---|
| **বাংলা** | ওয়েবসাইট অনলাইনে (live) দেওয়ার হোস্টিং প্ল্যাটফর্ম। GitHub-এ পুশ করলে অটো ডিপ্লয় হয়। SMTP পাসওয়ার্ডের মতো গোপন তথ্য Vercel ড্যাশবোর্ডে env variable হিসেবে রাখতে হয়। |
| **English** | A hosting platform that puts the site online. Pushing to GitHub auto-deploys. Secrets like SMTP passwords are stored as env variables in the Vercel dashboard. |
| **দরকারি env / Required env** | `DATABASE_URL`, `SESSION_SECRET` (৩২+ অক্ষর, কুকি সাইন করতে / 32+ chars, signs the session cookie), SMTP বা Resend, ঐচ্ছিক / optional `GOOGLE_CLIENT_ID` + `GOOGLE_CLIENT_SECRET` |

## 11. Git & GitHub

| | |
|---|---|
| **বাংলা** | **Git** = কোডের ভার্সন ইতিহাস; **commit** = একটা সেভ পয়েন্ট। **GitHub** = Git-এর অনলাইন ঘর (ব্যাকআপ ও টিমওয়ার্ক)। |
| **English** | **Git** = version history of code; a **commit** is a save point. **GitHub** = Git's online home (backup and teamwork). |
| **কমান্ড / Commands** | `git status` (কী বদলেছে / what changed), `git log` (ইতিহাস / history) |

### Git Workflow: Branch → PR → Merge / গিট ওয়ার্কফ্লো

| শব্দ / Term | বাংলা | English |
|---|---|---|
| **Repository** | প্রজেক্টের ফোল্ডার ও ইতিহাস | The project folder and its history |
| **Commit** | একটা সেভ পয়েন্ট | A save point |
| **Branch** | মূল কোডের আলাদা কপি, যেখানে নিরাপদে কাজ করা যায় | A separate copy of the code to work on safely |
| **Push** | commit-গুলো GitHub-এ পাঠানো | Send commits to GitHub |
| **Pull Request (PR)** | "আমার branch মূল কোডে মেশাও" অনুরোধ, মেশানোর আগে দেখে নেওয়া যায় | A request to merge my branch into main, reviewable first |
| **Merge** | PR অনুমোদন করে `main`-এ মেশানো | Approve the PR and combine it into `main` |
| **`main`** | আসল চালু কোড (Vercel এখান থেকে লাইভ হয়) | The real, live code (Vercel deploys from here) |

**ধাপ / Steps:**
1. **কাজ ও commit:** আলাদা branch-এ / work and commit on a separate branch
2. **যাচাই:** কত লাইন বদলেছে, `npm run lint`, `npm run build`, Figma-র সাথে মিল, গোপন তথ্য (`.env`) ঢোকেনি তো / check the diff size, lint, build, Figma match, no secrets
3. **Push → Create PR:** branch GitHub-এ যায়, PR খোলে / branch goes to GitHub, PR opens
4. **PR দেখে Merge:** GitHub-এর *Files changed* ট্যাবে দেখে *Merge pull request* / review in *Files changed*, then merge
5. **Vercel অটো ডিপ্লয়:** `main` বদলালে সাইট নিজে আপডেট হয় / the site updates automatically when `main` changes

**কেন এভাবে / Why:** ভুল হলে লাইভ সাইট ভাঙে না, একাধিক সেশনের কাজ আলাদা থাকে, আর বদলগুলো দেখে নেওয়া যায়।
Mistakes never break the live site, parallel sessions stay separate, and changes can be reviewed.

⚠️ `main`-এ সরাসরি push করবেন না। না বুঝে `git push --force` বা `git reset --hard` চালাবেন না।
⚠️ Never push directly to `main`. Don't run `git push --force` or `git reset --hard` unless you understand them.

## 12. Figma + Figma MCP

| | |
|---|---|
| **বাংলা** | **Figma** = ডিজাইন টুল; আমাদের UI-র মূল উৎস। **MCP** = Claude-কে Figma-র সাথে যুক্ত করে, যাতে সঠিক মাপ, রঙ, স্পেসিং পড়ে ১০০% pixel-perfect কোড বানানো যায়। |
| **English** | **Figma** = the design tool and our UI source of truth. **MCP** connects Claude to Figma so it can read exact sizes, colors and spacing and build 100% pixel-perfect code. |

## 13. Graphify

| | |
|---|---|
| **বাংলা** | প্রজেক্টের কোডকে একটা "মানচিত্র" (knowledge graph) বানিয়ে দেয়। কোন ফাইল কোনটার সাথে যুক্ত, তা সহজে দেখা যায়। এতে AI-কে প্রতিবার সব ফাইল পড়তে হয় না, তাই টোকেন বাঁচে। কোডের বিশ্লেষণ পুরোপুরি কম্পিউটারে হয়, বাইরের AI লাগে না। |
| **English** | Turns the project's code into a "map" (knowledge graph) showing how files connect. The AI doesn't have to read every file each time, which saves tokens. Code analysis runs fully locally, no external AI needed. |
| **উপমা / Analogy** | শহরের মানচিত্র: ফাইল = বাড়ি, সম্পর্ক = রাস্তা। / A city map: files are buildings, connections are roads. |
| **কমান্ড / Commands** | `~/.local/bin/graphify update .` (গ্রাফ বানানো/হালনাগাদ / build or refresh the graph) |
| **আউটপুট / Output** | `graphify-out/` ফোল্ডার: `GRAPH_REPORT.md` (সারাংশ / summary), `graph.html` (ম্যাপ / visual map), `graph.json` (কোয়েরি / queries) |

⚠️ কোড বদলালে `graphify update .` চালিয়ে গ্রাফ হালনাগাদ করতে হয়। `graphify-out/` ফোল্ডার `.gitignore`-এ আছে, GitHub-এ যায় না।
⚠️ Re-run `graphify update .` after code changes. `graphify-out/` is in `.gitignore` and is not pushed to GitHub.

## 14. shadcn/ui (Component Library / কম্পোনেন্ট লাইব্রেরি)

| | |
|---|---|
| **বাংলা** | তৈরি UI কম্পোনেন্টের সংগ্রহ (Button, Input, Checkbox, OTP ইনপুট ইত্যাদি)। এটা **CDN নয়**। কমান্ড চালালে কম্পোনেন্টের কোড আপনার প্রজেক্টে (`src/components/shadcn/`) কপি হয়ে বসে, তারপর সেগুলো আপনার নিজের কোড। ভেতরে Radix UI ও Tailwind ব্যবহার হয়। |
| **English** | A collection of ready-made UI components (Button, Input, Checkbox, OTP input, etc.). It is **not a CDN**: a command copies the component source into your project (`src/components/shadcn/`), and from then on it is your own code. Built on Radix UI and Tailwind. |
| **উপমা / Analogy** | রেডিমেড আসবাবের নকশা: আপনি নকশাটা নিয়ে নিজের ঘরে নিজের রঙে বানিয়ে নেন। / Furniture blueprints: you take the design and build it in your own colors. |
| **আমাদের নিয়ম / Our rule** | কম্পোনেন্ট shadcn/ui থেকে, কিন্তু **রঙ ও টোকেন Figma থেকে** (Brand Primary `#7150E7`), shadcn-এর ডিফল্ট রঙ নয়। / Components from shadcn/ui, but **colors and tokens from Figma**, not shadcn defaults. |
| **কমান্ড / Commands** | `npx shadcn@latest init` (একবার / once), `npx shadcn@latest add button` (কম্পোনেন্ট যোগ / add a component) |
| **থিম / Theme** | `src/app/globals.css`-এর CSS variables (`--primary`, `--background` ইত্যাদি), Figma টোকেন দিয়ে ভরা / CSS variables filled from Figma tokens |
| **অবস্থা / Status** | ইনস্টল হয়েছে, `main`-এ আছে (PR #1, ২০২৬-১০-০১)। ফোল্ডার `src/components/shadcn/`। `src/components/ui/`-এ অ্যাপের নিজের পুরোনো button/input আছে, সেগুলো shadcn না। Untitled UI পুরো সরানো হয়েছে। / Installed and on `main` (PR #1, 2026-10-01) in `src/components/shadcn/`. `src/components/ui/` holds the app's own older button/input, not shadcn. Untitled UI fully removed. |
| **Figma রঙ / Figma colors** | `src/app/globals.css`: primary `#7150E7`, border `#E5E5E5`, placeholder `#737373` |
| **Claude skill** | অফিশিয়াল shadcn skill গ্লোবালি ইনস্টল করা আছে (`~/.claude/skills/shadcn`), তাই সব সেশনে Claude shadcn-এর নিয়ম জেনে কাজ করে। প্রজেক্টে `components.json` থাকলে এটা সক্রিয় হয়। / The official shadcn skill is installed globally (`~/.claude/skills/shadcn`), so Claude follows shadcn conventions in every session. It activates when the project has a `components.json`. |
| **Skill কমান্ড / Skill command** | `npx skills add shadcn/ui -g -a claude-code -s shadcn -y` (ইনস্টল / install), `npx skills update` (আপডেট / update), `npx skills remove shadcn` (সরানো / remove) |

---

## 15. cmdk (shadcn Command + Popover)

| | |
|---|---|
| **বাংলা** | search করা যায় এমন তালিকা (command menu) বানানোর library। shadcn-এর `Command` কম্পোনেন্ট এর ওপর তৈরি, আর `Popover` দিয়ে সেটা একটা ছোট dropdown হিসেবে খোলে। |
| **English** | A library for searchable lists (command menus). shadcn's `Command` component is built on it, and `Popover` opens it as a small dropdown. |
| **উপমা / Analogy** | ফোনের contact list-এর search: লিখতে থাকলেই তালিকা ছোট হয়ে আসে। / Like searching your phone's contacts: the list narrows as you type. |
| **কোথায় / Where** | Onboarding ধাপ ৪-এ "Other" চাপলে বাকি দেশের dropdown (`src/components/OnboardingModal.tsx`)। ফাইল: `src/components/shadcn/command.tsx`, `popover.tsx`, `dialog.tsx`। / The "Other" country dropdown in onboarding step 4. |
| **কমান্ড / Command** | `npx shadcn@latest add popover command` |
| **অবস্থা / Status** | যোগ হয়েছে ২০২৬-১০-০১। / Added 2026-10-01. |

## 16. Vitest + Testing Library (Automated Tests / স্বয়ংক্রিয় টেস্ট)

| | |
|---|---|
| **বাংলা** | কোড ঠিকমতো কাজ করছে কিনা তা কোড দিয়েই স্বয়ংক্রিয়ভাবে পরীক্ষা করার টুল। **Unit test** একটা ছোট function আলাদা করে পরীক্ষা করে; **API test** একটা route (যেমন `/api/auth/email/verify-code`) পরীক্ষা করে। `jsdom` ব্রাউজারের নকল পরিবেশ দেয়; `@testing-library/react` component পরীক্ষার জন্য। |
| **English** | Tools that automatically check the code works, using code. A **unit test** checks one small function; an **API test** checks a route handler. `jsdom` fakes a browser; `@testing-library/react` is for testing components. |
| **উপমা / Analogy** | গাড়ি বিক্রির আগে প্রতিটা যন্ত্রাংশ আলাদা করে টেস্ট বেঞ্চে চালিয়ে দেখা। / Testing every car part on a bench before the car is sold. |
| **প্রজেক্টে / In project** | `tests/unit/` (lib function), `tests/api/` (route), `tests/helpers/` (নকল database ও cookie / fake DB and cookies). কনফিগ: `vitest.config.mts`। আসল email, Google বা database ব্যবহার হয় না, সব mock (নকল)। / No real email, Google or database: everything is mocked. |
| **`it.fails`** | জানা bug-এর টেস্ট। bug থাকা পর্যন্ত এটা "expected fail" দেখায়; bug ঠিক হলে টেস্টটা লাল হবে, তখন `it.fails` বদলে `it` করতে হবে। বিস্তারিত `docs/QA-REPORT.md`-এ। / A test for a known bug: it shows "expected fail" until fixed, then turns red so you switch it to `it`. See `docs/QA-REPORT.md`. |
| **ভার্সন / Version** | Vitest 4 (Vitest 5-এর জন্য `@types/node` 22+ লাগে, প্রজেক্টে 20 আছে)। / Vitest 4 (v5 needs `@types/node` 22+; the project uses 20). |

## 17. Playwright + axe (Browser / E2E Tests / ব্রাউজার টেস্ট)

| | |
|---|---|
| **বাংলা** | আসল browser (Chromium, Firefox, WebKit/Safari) খুলে মানুষের মতো ক্লিক ও টাইপ করে পুরো flow পরীক্ষা করে: যেমন login → code → onboarding → home। একে **E2E (end-to-end) test** বলে। `@axe-core/playwright` প্রতিটা পেজে accessibility (WCAG 2.1 AA) নিয়ম, যেমন লেখার রঙের contrast বা বাটনের নাম, পরীক্ষা করে। |
| **English** | Opens real browsers and clicks/types like a person to test whole flows (E2E tests). `@axe-core/playwright` checks each page against accessibility rules (WCAG 2.1 AA), such as text contrast and button names. |
| **উপমা / Analogy** | Unit test হলো যন্ত্রাংশ আলাদা করে পরীক্ষা; E2E হলো পুরো গাড়ি রাস্তায় চালিয়ে দেখা। / Unit tests check parts on a bench; E2E drives the whole car on the road. |
| **প্রজেক্টে / In project** | `tests/e2e/` (spec), `tests/e2e/fixtures.ts` (নকল backend: সব `/api` call browser-এই উত্তর পায় / fake backend), কনফিগ `playwright.config.ts` (Desktop 1728px: Chromium, Firefox, WebKit; Mobile 375px: Chromium)। টেস্ট নিজেই `next dev` (port 3100) চালু করে। |
| **কমান্ড / Commands** | `npm run test:e2e` (সব / all), `npx playwright test --project=chromium-desktop` (একটা browser / one browser), `npx playwright show-report` (রিপোর্ট দেখা / open the HTML report), `npx playwright install` (browser নামানো, একবার / download browsers once) |
| **`test.fail()`** | জানা bug-এর E2E টেস্ট (Vitest-এর `it.fails`-এর মতো) / Known-bug E2E test, like `it.fails` in Vitest |
| **টেস্ট DB / Test database** | Detail পেজ server-এ Prisma দিয়ে ডেটা পড়ে, তাই e2e-র জন্য আলাদা একটা ছোট আসল DB লাগে। প্রতিবার শুরুর আগে `tests/e2e/global-setup.ts` এতে schema push করে, সব খালি করে, তারপর `tests/e2e/seed/e2e-data.ts`-এর বানানো ডেটা (id `e2e_…`, লিংক `example.test`) ঢোকায়। Spec-এ id হাতে লেখা যাবে না, `tests/e2e/ids.ts` থেকে নিতে হবে। / Server-rendered pages need a real but tiny database, re-seeded before every run. |
| **পাহারা / Safety guard** | `tests/e2e/seed/seed-guard.ts`: `E2E_DB=1` না থাকলে, host `localhost` না হলে (Neon তো নয়ই), `VERCEL`/production হলে, বা URL আপনার dev `DATABASE_URL`-এর সমান হলে seed চলবেই না। Unit টেস্ট: `tests/unit/e2e-seed-guard.test.ts`। / The seed refuses anything but a local, non-dev test database. |
| **e2e কীভাবে চালাবেন / How to run e2e** | ১) একবার: `npm run test:e2e:db` (আলাদা লোকাল DB `scholarsship_e2e`; আপনার dev DB `scholarsship` ছোঁয় না)। ২) `npx prisma dev ls` থেকে `scholarsship_e2e`-এর `postgres://…` URL নিয়ে `.env.local`-এ লিখুন: `E2E_DATABASE_URL="postgres://postgres:postgres@localhost:<port>/template1?sslmode=disable&connection_limit=1&pgbouncer=true"`। ৩) `npm run test:e2e`। URL না থাকলে টেস্ট শুরুই হবে না, পরিষ্কার মেসেজ দেবে। Port 3100-এ পুরোনো কোনো server চললে বন্ধ করুন, কারণ লোকালে চালু server আবার ব্যবহার হয়। / Start the test DB once, put its URL in `.env.local` as `E2E_DATABASE_URL`, then `npm run test:e2e`. |

## 18. GitHub Actions (CI / স্বয়ংক্রিয় চেক)

| | |
|---|---|
| **বাংলা** | GitHub-এর নিজস্ব রোবট। প্রতিটা PR খোলা বা আপডেট হলে এবং `main`-এ push হলে এটা নিজে থেকে কোড নামিয়ে type check (`tsc`) ও `npm test` চালায়। কিছু ভাঙলে PR-এ লাল ✗ দেখায়, তাই merge-এর আগেই ধরা পড়ে। একে **CI (Continuous Integration)** বলে। |
| **English** | GitHub's built-in robot. On every PR and every push to `main` it installs the project and runs the type check and `npm test`. A red ✗ on the PR means something broke, before it is merged. This is **CI (Continuous Integration)**. |
| **উপমা / Analogy** | কারখানার গেটে মান-পরীক্ষক: প্রতিটা নতুন জিনিস ঢোকার আগে চেক হয়। / A quality inspector at the factory gate. |
| **প্রজেক্টে / In project** | `.github/workflows/test.yml` (Node 22, `npm ci` → `tsc --noEmit` → `npm test`)। কোনো secret লাগে না, সব mock। আলাদা `e2e` job-এ Playwright (Chromium desktop + mobile, Postgres 16 service, secret লাগে না)। / A separate `e2e` job runs Playwright on Chromium, with a throwaway Postgres; no secrets. |
| **দেখার জায়গা / Where to see** | PR পেজের নিচে "Checks", বা repo-র **Actions** ট্যাব / The PR's "Checks" section or the repo's **Actions** tab |

## 19. Opportunity ingest: Mastodon + Bluesky (cron)

| | |
|---|---|
| **বাংলা** | PhD/RA/ফান্ডিং-এর পোস্ট প্রতিদিন নিজে থেকে বাইরের সোশ্যাল সাইট থেকে এনে ডেটাবেসে রাখা হয়। সাইট ব্রাউজারে কখনো সরাসরি ওই API ডাকে না, ডেটাবেস থেকে দেখায়। |
| **English** | Every day the server pulls PhD/RA/funding posts from public social APIs and stores them in the database. The browser never calls those APIs; it reads from our DB. |
| **প্রজেক্টে / In project** | `src/lib/ingest/{mastodon,bluesky,index}.ts`। Mastodon (hci.social সহ) ও Bluesky পাবলিক সার্চ (`api.bsky.app`, প্রায় ৫০টা "PhD <topic>" কুয়েরি, একটা একটা করে, ১ সেকেন্ড ফাঁকে)। `fetchAllOpportunities()` দুটো মিলিয়ে cross-post বাদ দেয়। / Both sources are merged and cross-posts are de-duplicated. |
| **Cron** | `vercel.json`: `/api/cron/opportunities` প্রতিদিন 06:00 UTC, `CRON_SECRET` দিয়ে সুরক্ষিত। / Daily 06:00 UTC, protected by `CRON_SECRET`. |
| **Programme listing** | `source = "university"`: হাতে লেখা ১৮টা প্রোগ্রাম, `prisma/data/programs.ts`। API নয়; "checked" তারিখ থাকে, নিজে আপডেট হয় না, তাই মাঝে মাঝে আবার চেক করতে হয়। / Hand-written, not from an API; recheck periodically. |
| **Seed-এর নিয়ম / Seed rule** | `prisma/seed.ts` শুধু `LEGACY_DEMO_SOURCES` (`linkedin`, `twitter`, `lab_website`, `web`, `reddit`) মোছে। না হলে প্রতি deploy-এ Bluesky পোস্ট মুছে যেত। / The seed deletes only the legacy demo sources. |

## 20. Research papers: OpenAlex (cron)

| | |
|---|---|
| **বাংলা** | গবেষণা পেপার OpenAlex (ফ্রি একাডেমিক ডেটা API) থেকে প্রতিদিন আসে। |
| **English** | Papers come daily from OpenAlex, a free academic-data API. |
| **প্রজেক্টে / In project** | `src/lib/papers/openalex.ts` (`fetchWorks`, `workToPaper`, `abstractText`)। API key ঐচ্ছিক; key ছাড়া দিনে প্রায় ১,০০০ লিস্ট কল, 429 এলে একবার আবার চেষ্টা। `/api/cron/papers` প্রতিদিন 06:30 UTC। / Key optional; one retry on 429. |

## 21. Subject system (বিষয়ের তালিকা ও কীওয়ার্ড ম্যাপিং)

| | |
|---|---|
| **বাংলা** | পুরো সিস্টেমে একটাই ২১টা বিষয়ের তালিকা। ফিল্টার শুরুতেই অনবোর্ডিংয়ের উত্তর থেকে বসে। কোনো বিষয় বাছলে ওই বিষয়ের **core** শব্দ থাকা আইটেম আগে, **related** শব্দ থাকা পরে, বাকিগুলো বাদ। |
| **English** | One list of 21 subjects everywhere. Filters start from the onboarding profile. A subject match ranks items with a **core** word first, **related** words next, and drops the rest. |
| **প্রজেক্টে / In project** | `src/data/subjectCatalog.ts` (`SUBJECTS`, `normalizeSubjects`, `subjectTagsFor`, `subjectTier`, `rankBySubject`) ও `src/data/subjectKeywords.ts` (প্রতি বিষয়ের core/related শব্দ; `*` = যেকোনো শেষ; পুরো শব্দ মেলে; হাইফেন = স্পেস)। উদাহরণ: UX বাছলে "UI", "HCI", "interaction", "cognitive" ও related হিসেবে ধরা হয়। `src/hooks/useProfileFilterDefaults.ts` প্রোফাইল থেকে ডিফল্ট ফিল্টার বসায়। / Example: choosing UX also catches UI, HCI, interaction and cognitive as related. |

## 22. SearchMiss (খালি সার্চের লগ)

| | |
|---|---|
| **বাংলা** | ফিডে সার্চ/ফিল্টারে কিছু না পেলে নাম-পরিচয় ছাড়া (anonymous) লগ রাখা হয়, যাতে বুঝি কোন ডেটা আমাদের নেই। |
| **English** | When a feed search returns nothing, an anonymous record is saved so we learn which data is missing. |
| **প্রজেক্টে / In project** | `SearchMiss` মডেল (`page`, `query`, `subjects`, `degrees`, `countries`, `funding`, `matchMode`)। `src/app/api/search-miss/route.ts` (প্রতি IP-তে ঘণ্টায় ৬০), হুক `useSearchMissLog`। রিপোর্ট: `npm run data:misses`। / Report: `npm run data:misses`. |

## 23. Scholarship data framework

| | |
|---|---|
| **বাংলা** | স্কলারশিপ হাতে লেখা ডেটা, কিন্তু কড়া নিয়মে: শুধু অফিশিয়াল সাইট, রোবট নিয়ম মানা, অনুমান নয়, নিজের ভাষায় সারাংশ, `sourceUrl` ও `verifiedOn` বাধ্যতামূলক। |
| **English** | Hand-written data under strict rules: official sources only, honour robots.txt, no guessing, own-words summary, `sourceUrl` and `verifiedOn` required. |
| **প্রজেক্টে / In project** | `prisma/data/scholarships/` (`_curated.ts` পুরোনো ২৪টা, `batch-*.ts` নতুন, `schema.ts` zod নিয়ম, `index.ts` সব জোড়া)। নতুন id `gov-<country>-<slug>`; পুরোনো `sch_…` id কখনো বদলায় না (বুকমার্ক ভাঙবে)। চেকার: `npm run data:scholarships:check` (zod, ডুপ্লিকেট id/`officialUrl`, লিংক চেক, ৩৬৫ দিনের বেশি পুরোনো হলে সতর্কতা)। নিয়ম: `docs/SCHOLARSHIP-VERIFICATION.md`। যেগুলো যোগ করা যায়নি: `docs/SCHOLARSHIP-BACKLOG.md`। / Not-yet-added list: `docs/SCHOLARSHIP-BACKLOG.md`. |

## 24. Data reports (রিপোর্ট)

| | |
|---|---|
| **বাংলা** | ডেটাবেসে কোন ধরনের কতটা ডেটা আছে তার সংখ্যা। |
| **English** | Counts of what data is in the database. |
| **প্রজেক্টে / In project** | `npm run data:stats` (`prisma/report/data-stats.ts`): opportunity, paper, scholarship, professor সংখ্যা। / Counts per data type. |

## 25. Data কোথা থেকে আসে (সারাংশ)

| ডেটা / Data | উৎস / Source | কীভাবে / How |
|---|---|---|
| Opportunities | Mastodon + Bluesky API | cron, প্রতিদিন / daily |
| Research papers | OpenAlex API | cron, প্রতিদিন / daily |
| Scholarships | অফিশিয়াল সাইট দেখে হাতে লেখা / hand-written | seed file + deploy |
| Programme listings | হাতে লেখা / hand-written | `prisma/data/programs.ts` |
| Professors / Labs | seed file (`professors.json`), এখনো real API নয় / not yet a real source | seed |

## 26. Professors, grants and daily refresh

| | |
|---|---|
| **বাংলা** | প্রফেসর/গবেষক তালিকা দুই ফাইল থেকে: CSRankings (শুধু CS, `professors.json`) আর OpenAlex (CS-এর বাইরে, `professors-openalex.json`, title "Researcher · <subject>", কখনো "Professor" নয়)। "Recently funded" সংকেত NSF (CS), NIH (USA, `grants-nih.json`) আর UKRI (UK, `grants-ukri.json`) থেকে। প্রতিদিন একটা cron h-index আর paper সংখ্যা নতুন করে (সপ্তাহে একবার প্রতিজন)। |
| **English** | Faculty come from two files: CSRankings (CS only) and OpenAlex researchers (other subjects). "Recently funded" comes from NSF, NIH and UKRI awards, matched only when last name, first-name start and institution all agree. A daily cron refreshes h-index and paper counts (each person once a week). |
| **Commands** | `npm run data:researchers:build` (OpenAlex researchers), `npm run data:grants:nih` (NIH awards; ~25 min) and `npm run data:grants:ukri` (UK awards; ~25 min); both 1 request/second, cached in `.data-cache/`. Seed loads all files; it removes only faculty in none of them. |
| **Cron** | `/api/cron/professors` daily 07:00 UTC (`CRON_SECRET`). Never creates or deletes, only updates metrics. |

---

## npm Commands / npm কমান্ড

| Command | বাংলা | English |
|---|---|---|
| `npm run dev` | লোকালে সাইট চালু (ডেভেলপমেন্ট) | Run the site locally (development) |
| `npm run build` | প্রোডাকশন বিল্ড বানানো | Create a production build |
| `npm run start` | বিল্ড করা ভার্সন চালানো | Run the built version |
| `npm run lint` | কোড চেক করা | Check the code |
| `npm test` | সব unit ও API টেস্ট একবার চালানো | Run all unit and API tests once |
| `npm run test:watch` | ফাইল বদলালেই টেস্ট আবার চালানো | Re-run tests whenever a file changes |
| `npm run test:e2e` | ব্রাউজারে E2E ও accessibility টেস্ট চালানো | Run browser E2E and accessibility tests |
| `npm run test:e2e:db` | e2e-র আলাদা লোকাল টেস্ট DB চালু করা (একবার) | Start the local e2e test database (once) |
| `npm run db:seed` | লোকাল ডেটাবেসে seed ডেটা বসানো | Seed the local database |
| `npm run data:stats` | ডেটাবেসে কোন ডেটা কতটা আছে | Count data per type |
| `npm run data:misses` | ফিডে যা খুঁজে পাওয়া যায়নি তার রিপোর্ট | Report of empty feed searches |
| `npm run data:scholarships:check` | স্কলারশিপ ডেটা ও লিংক চেক | Validate scholarship data and links |

## Glossary / শব্দকোষ

| Term | বাংলা | English |
|---|---|---|
| Component | UI-র একটা পুনর্ব্যবহারযোগ্য অংশ | A reusable piece of UI |
| Route | URL-এর পথ (যেমন `/signup`) | A URL path, e.g. `/signup` |
| API | ফ্রন্টএন্ড ↔ ব্যাকএন্ডের কথা বলার দরজা | The door frontend and backend talk through |
| Env variable (`.env`) | গোপন সেটিং বা পাসওয়ার্ড | Secret settings or passwords |
| Deploy | কোড লাইভ করা | Putting code live |
| Dependency | প্রজেক্টে ব্যবহৃত বাইরের প্যাকেজ (`node_modules`) | An outside package the project uses |
