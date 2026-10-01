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

## Glossary / শব্দকোষ

| Term | বাংলা | English |
|---|---|---|
| Component | UI-র একটা পুনর্ব্যবহারযোগ্য অংশ | A reusable piece of UI |
| Route | URL-এর পথ (যেমন `/signup`) | A URL path, e.g. `/signup` |
| API | ফ্রন্টএন্ড ↔ ব্যাকএন্ডের কথা বলার দরজা | The door frontend and backend talk through |
| Env variable (`.env`) | গোপন সেটিং বা পাসওয়ার্ড | Secret settings or passwords |
| Deploy | কোড লাইভ করা | Putting code live |
| Dependency | প্রজেক্টে ব্যবহৃত বাইরের প্যাকেজ (`node_modules`) | An outside package the project uses |
