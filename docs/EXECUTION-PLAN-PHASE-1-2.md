# কাজের বিস্তারিত পরিকল্পনা: Phase 1 + Phase 2 / Execution Plan

**তারিখ / Date:** 2026-10-09
**অবস্থা / Status:** শুধু পরিকল্পনা। কোনো কোড বদলানো হয়নি। প্রতিটা কাজ শুরুর আগে আলাদা অনুমতি লাগবে।
**যে ডকুমেন্টের সাথে মিলিয়ে লেখা:** [DATA-VISION-5Y.md](DATA-VISION-5Y.md) (৫ স্তর L1–L5, বছর ১-এর লক্ষ্য), [DATA-PIPELINE-PLAN.md](DATA-PIPELINE-PLAN.md) (১৫ ধাপ)
**শুরুর অবস্থা:** `main` = `a9341b0` (PR #49 SearchMiss মার্জ হওয়ার পর)

---

## ০. এক নজরে

| ID | কাজ | Phase | আনুমানিক token | কে করবে |
|---|---|---|---|---|
| **A** | Neon DB পাসওয়ার্ড বদলানো | 1 | 10–20 হাজার | **আপনি** (Claude শুধু গাইড করবে) |
| **B** | Onboarding আবার খুললে subject খালি দেখায় | 1 | 30–50 হাজার | Claude |
| **J** | Playwright e2e ঠিক করা + CI-তে চালানো | 1 | 1.2–1.8 লাখ | Claude |
| **K** ⭐ নতুন | Seed স্ক্রিপ্ট cron-এর Bluesky পোস্ট মুছে দেয় (যাচাই + ঠিক করা) | 1 | 20–40 হাজার | Claude |
| **I-1** | স্কলারশিপ 24 → ~175 (importer + ~150 সরকারি বৃত্তি) | 2 | 10–14 লাখ | Claude + আপনার রিভিউ |
| **G-1** | ROR দিয়ে opportunity-র দেশ/প্রতিষ্ঠান বের করা (AI ছাড়া) | 2 | 2–3 লাখ | Claude |
| **F** | OpenAlex থেকে 2025–26-এর নতুন পেপার, প্রতিদিন cron | 2 | 1.5–2.5 লাখ | Claude |
| | **মোট** | | **Phase 1 ≈ 2–2.8 লাখ, Phase 2 ≈ 14–20 লাখ** | |

> ⭐ **K কেন যোগ করলাম:** পরিকল্পনা লেখার সময় `prisma/seed.ts` পড়ে দেখলাম, `seedOpportunities()` শুধু `source = 'mastodon'` পোস্ট রেখে বাকি যেগুলো `opportunities.json`-এ নেই সেগুলো **মুছে দেয়**। Bluesky cron যে নতুন পোস্ট আনে, সেগুলো JSON-এ থাকে না। তাই প্রতিটা production deploy-এ (যদি `SKIP_DB_SEED` চালু না থাকে) এগুলো মুছে যেতে পারে। F (পেপার cron)-এর ক্ষেত্রেও একই সমস্যা হবে, কারণ `seedResearchPapers()` JSON-এ না থাকা সব পেপার মুছে দেয়। তাই F-এর আগে K করা জরুরি।

---

## ১. সব কাজের সাধারণ নিয়ম

এই নিয়মগুলো প্রতিটা কাজে খাটবে। নিচে আর বারবার লিখছি না।

1. **একটা কাজ = একটা branch = একটা PR।** Branch-এর নাম: `fix/…`, `feat/…`, `test/…`, `docs/…`।
2. **কোড বদলানোর আগে আপনার অনুমতি।** Claude আগে বাংলায় ছোট ব্রিফ দেবে (কী বদলাবে, কোন ফাইল), আপনি "হ্যাঁ" বললে কাজ শুরু।
3. **একবারে একটা session।** দুটো Claude session একসাথে একই repo-তে কাজ করবে না।
4. **Schema বদলালে:** PR merge করার **আগে** production-এ `npx prisma db push` চালাতে হবে (নিচে প্রতিটা কাজে লেখা আছে)। নিয়ম: শুধু নতুন **optional** কলাম বা নতুন টেবিল। কোনো কলাম মুছবে না বা নাম বদলাবে না, তাই data loss হবে না।
   - মনে রাখবেন: `prisma/vercel-build.mjs` production deploy-এ নিজেও `prisma db push` চালায়। তবু আগে নিজে চালালে deploy-এর সময় অবাক হওয়ার কিছু থাকে না।
5. **ডেটার নিয়ম ([DATA-VISION-5Y.md §৪](DATA-VISION-5Y.md)):** robots.txt আর Terms মানা; AcademicTransfer, Varbi, FindAPhD শুধু partnership; সোর্সে যা লেখা শুধু তাই রাখা, অনুমান না; সবসময় মূল লিংক রাখা।
6. **প্রতিটা PR-এর আগে:** `npx tsc --noEmit`, `npm run lint`, `npm test` (এখন 305টা পাস করে)। J শেষ হলে `npm run test:e2e`-ও।
7. **Next.js 16:** কোড লেখার আগে `node_modules/next/dist/docs/`-এর সংশ্লিষ্ট গাইড পড়তে হবে (route handler, cron, caching)।
8. **আগে/পরে সংখ্যা:** ডেটার প্রতিটা কাজে "আগে কত ছিল, পরে কত হলো" PR-এ লিখতে হবে।

### একটা ছোট সাহায্যকারী স্ক্রিপ্ট: `npm run data:stats`

Phase 2-এর সব কাজে আগে/পরের সংখ্যা মাপতে একটা report স্ক্রিপ্ট লাগবে। এটা **K-এর PR-এই** যোগ করা ভালো (ছোট কাজ, ~10 হাজার token)।

- ফাইল: `prisma/report/data-stats.ts` (এখনকার `prisma/report/search-misses.ts`-এর মতো করে)
- `package.json` script: `"data:stats": "tsx --env-file=.env.local prisma/report/data-stats.ts"`
- যা দেখাবে: Opportunity মোট / source অনুযায়ী / দেশ নেই / প্রতিষ্ঠান নেই / deadline নেই / subject নেই; Scholarship মোট / `verifiedAt` 180 দিনের বেশি পুরোনো; ResearchPaper মোট / বছর অনুযায়ী।
- শুধু পড়ে (read-only), কিছু লেখে না।

---

# PHASE 1 (≈ 2–2.8 লাখ token, এই সপ্তাহে)

## A. Neon DB পাসওয়ার্ড বদলানো (Rotate)

### লক্ষ্য ও কেন
পুরোনো পাসওয়ার্ড chat-এ ফাঁস হয়েছে। যার কাছে ওই connection string আছে, সে পুরো ডেটাবেস পড়তে, বদলাতে বা মুছতে পারে। তাই **সবার আগে** এটা। এটা কোডের কাজ না, আপনাকে নিজে করতে হবে, কারণ Claude পাসওয়ার্ড বা গোপন key হাতে নেয় না।

### ফাইল
কোনো কোড ফাইল বদলাবে না। শুধু:
- Neon dashboard (role password)
- Vercel → Environment Variables (`DATABASE_URL`)
- আপনার কম্পিউটারের `.env.local` (git-এ যায় না)

### Schema
নেই।

### ধাপে ধাপে (click-by-click)

**ধাপ ১: Neon-এ নতুন পাসওয়ার্ড**
1. https://console.neon.tech -এ লগইন করুন।
2. Scholars' Ship-এর project খুলুন।
3. বাম মেনু → **Branches** → `main` (production branch) ক্লিক করুন।
4. **Roles & Databases** অংশে যান (কোনো কোনো ভার্সনে বাম মেনুতে আলাদা **Roles** থাকে)।
5. যে role-টা অ্যাপ ব্যবহার করে (সাধারণত `neondb_owner`), তার পাশে **⋯** মেনু → **Reset password**।
6. Confirm করুন। Neon নতুন পাসওয়ার্ড **একবারই** দেখাবে।
7. এরপর project-এর **Dashboard** → **Connect** বাটন চাপুন। "Connection pooling" **চালু** রেখে connection string কপি করুন (hostname-এ `-pooler` থাকবে)।
   - এটা কোথাও chat-এ বা ফাইলে পেস্ট করবেন না। শুধু নিচের দুই জায়গায়।

**ধাপ ২: Vercel-এ বদলানো**
1. https://vercel.com → Scholars' Ship project → **Settings** → **Environment Variables**।
2. `DATABASE_URL` খুঁজুন → **⋯** → **Edit** → নতুন string পেস্ট করুন → Production (আর Preview থাকলে সেটাও) টিক দিয়ে **Save**।
3. যদি দেখেন variable-টা "Managed by Neon integration" লেখা (Marketplace থেকে যুক্ত), তাহলে হাতে edit না-ও করা যেতে পারে। সেক্ষেত্রে Neon reset করার পর এখানে মান নিজে থেকে বদলেছে কিনা দেখুন (মানের শেষ কয়েকটা অক্ষর মিলিয়ে)। না বদলালে Claude-কে জানান।
4. একই নামে অন্য কোনো DB variable থাকলে (যেমন `POSTGRES_URL`, `DATABASE_URL_UNPOOLED`), সেগুলোতেও নতুন পাসওয়ার্ড দিন। (আমাদের `schema.prisma` শুধু `DATABASE_URL` পড়ে।)
5. **Deployments** ট্যাব → সবচেয়ে নতুন production deploy → **⋯** → **Redeploy**। (Env বদলালে redeploy না করা পর্যন্ত পুরোনো মান চলে।)

**ধাপ ৩: নিজের কম্পিউটারে**
1. `.env.local` খুলে production `DATABASE_URL` থাকলে নতুনটা দিন। (লোকাল কাজে `prisma dev` DB ব্যবহার করলে সেটা বদলানোর দরকার নেই।)

**ধাপ ৪: ফাঁস হওয়া string কোথাও রয়ে গেছে কিনা**
- Claude চালাবে (মান না দেখিয়ে শুধু হ্যাঁ/না): `git log -p --all -S "neon.tech" | grep -c "postgres"`। git history-তে থাকলে আলাদা পরিকল্পনা লাগবে।
- GitHub → repo → Settings → Secrets: এখন CI DB ব্যবহার করে না। J শেষ হলেও CI-তে আলাদা টেস্ট DB থাকবে, production string কখনো লাগবে না।

### যাচাই
1. **পুরোনো পাসওয়ার্ড মৃত:** Neon → **SQL Editor** নয়, বরং পুরোনো string দিয়ে কোনো client (যেমন TablePlus) দিয়ে connect করার চেষ্টা করুন → "password authentication failed" আসা উচিত। (পুরোনো string হাতে না থাকলে এই ধাপ বাদ দিন।)
2. **সাইট চালু:** https://scholarsship.vercel.app → Scholarships ট্যাবে 24টা কার্ড, Faculty ট্যাবে প্রফেসর দেখায়।
3. **Cron চালু:** Vercel → project → **Logs** → পরের দিন সকাল 06:00 UTC-এর পর `[cron/opportunities] … new` লাইন আছে কিনা। অথবা Vercel → Settings → **Cron Jobs** → `/api/cron/opportunities` → **Run**।
4. **লগইন চালু:** নিজের অ্যাকাউন্টে লগইন করে প্রোফাইল দেখা যায়।

### ঝুঁকি ও rollback
| ঝুঁকি | প্রতিকার |
|---|---|
| ভুল string পেস্ট → সাইট 500 error দেয় | Vercel-এ সঠিক string দিয়ে আবার Save + Redeploy। Neon-এ আবার reset করা যায়। |
| Preview deploy পুরোনো string-এ চলে | Preview env-ও আপডেট করুন। |
| অ্যাপ fallback-এ mock ডেটা দেখায় (error লুকিয়ে যায়) | যাচাই ধাপ ২-এ আসল ডেটা (24 স্কলারশিপ, 1,520 প্রফেসর) মিলিয়ে দেখুন। |

পুরোনো পাসওয়ার্ডে ফেরা **উচিত না** (ওটা ফাঁস হয়েছে)। সমস্যা হলে নতুন করে আরেকবার reset করুন।

### Token
10–20 হাজার (শুধু গাইড আর যাচাই)।

### আপনাকে যা করতে হবে
উপরের ধাপ ১–৩ পুরোটা। শেষে Claude-কে লিখুন "A শেষ"। পাসওয়ার্ড বা string chat-এ দেবেন না।

### কাজ শেষের সংজ্ঞা (Definition of Done)
- [ ] Neon-এ পাসওয়ার্ড reset হয়েছে
- [ ] Vercel `DATABASE_URL` (Production + Preview) আপডেট, redeploy সফল
- [ ] সাইটে আসল ডেটা দেখা যায়, লগইন কাজ করে
- [ ] পরের cron run সফল
- [ ] git history-তে পুরোনো string নেই (বা থাকলে আলাদা কাজ খোলা হয়েছে)

---

## B. Bug: Onboarding আবার খুললে subject খালি

### লক্ষ্য ও কেন
যে ইউজার আগে onboarding শেষ করেছেন, তিনি আবার খুললে "Field of study" ধাপ খালি দেখায়। ফলে মনে হয় তার তথ্য হারিয়ে গেছে, আর আবার Save করলে খালি/ভুল তথ্য সেভ হতে পারে।

**কারণ:** [OnboardingModal.tsx:250-255](../src/components/OnboardingModal.tsx) এ `useState(saved ? profile.specializations : [])`। `useState`-এর শুরুর মান **শুধু প্রথম render-এ** নেওয়া হয়। তখনো profile লোড হয়নি (`saved = false`), তাই খালি `[]` বসে যায়। পরে profile এলেও state আর বদলায় না।

একই সমস্যা আছে `degreeLevel`, `countries`, `cgpa`, `ielts`, `gre`, `extraSpecs`, `extraCountries`-এও। শুধু subject চোখে পড়ে বেশি। সবগুলো একসাথে ঠিক করা হবে।

### ফাইল
- বদলাবে: `src/components/OnboardingModal.tsx`
- নতুন টেস্ট: `tests/unit/OnboardingModal.prefill.test.tsx` (অথবা এখনকার onboarding unit টেস্ট ফাইল থাকলে সেখানে)
- e2e: `tests/e2e/onboarding.spec.ts`-এ একটা নতুন test

### Schema
নেই।

### ধাপে ধাপে
1. ফাইলে **name/email-এর জন্য যে নিয়ম আগে থেকেই আছে** (লাইন 244–248: `null` = ইউজার এখনো ছোঁয়নি, তাই profile থেকে মান নাও), সেটাই বাকি field-এ ব্যবহার করা। উদাহরণ:
   ```ts
   const [specsInput, setSpecializations] = useState<string[] | null>(null);
   const specializations = specsInput ?? (saved ? normalizeSubjects(profile.specializations) : []);
   ```
   `degreeLevel`, `countries`, `cgpa`, `ielts`, `gre`-এর জন্যও একই।
2. `extraSpecs` / `extraCountries` (catalog-এর বাইরের custom মান): এগুলোও একইভাবে "derived" করা, নাহলে custom subject-এর chip দেখাবে না।
3. কেন এই উপায়, অন্যটা না: বিকল্প ছিল profile লোড হলে `useEffect` দিয়ে state সেট করা, বা `key` দিয়ে পুরো modal আবার mount করা। `useEffect` উপায়ে ইউজার টাইপ শুরু করার পর profile এলে তার লেখা মুছে যেতে পারে। `key` উপায়ে ইউজার যে ধাপে ছিলেন সেটা হারায়। `null` উপায়ে দুটো সমস্যাই নেই, আর ফাইলে আগে থেকেই এটা আছে।
4. `isDemo` চেক (alex.mercer) যেমন আছে থাকবে।

### টেস্ট
- **Unit (Vitest + Testing Library):**
  1. প্রথমে `profile = null` দিয়ে render, তারপর onboarded profile (`specializations: ['HCI']`, `targetCountries: ['Germany']`, `degreeLevel: 'PhD'`) দিয়ে rerender → subject ধাপে HCI selected দেখায়।
  2. ইউজার একটা subject বদলানোর পর profile আবার এলে ইউজারের বাছাই থাকে (মুছে যায় না)।
  3. Demo profile হলে খালি থাকে (আগের আচরণ)।
- **E2E:** fake backend `/api/profile` থেকে onboarded profile দেরিতে (যেমন 300ms) ফেরত দেবে → `/onboarding` খুলে subject ধাপে "HCI" selected আছে।

### যাচাই
1. লোকালি `npm run dev` → নিজের onboarded অ্যাকাউন্টে লগইন → প্রোফাইল মেনু থেকে onboarding আবার খুলুন → subject, degree, country, CGPA আগের মতো ভরা।
2. কিছু না বদলে Save → DB-তে প্রোফাইল একই থাকে।
3. Claude browser pane-এ স্ক্রিনশট দিয়ে প্রমাণ দেবে।

### ঝুঁকি ও rollback
- ঝুঁকি কম (একটা ফাইল)। সমস্যা হলে PR revert করলেই আগের অবস্থা।
- নতুন ইউজারের onboarding যেন না ভাঙে: `walkToLastStep` e2e টেস্ট এটা ধরবে।

### Token
30–50 হাজার।

### আপনাকে যা করতে হবে
অনুমতি দেওয়া, PR রিভিউ করে merge করা, merge-এর পর live সাইটে একবার নিজে খুলে দেখা।

### Definition of Done
- [ ] আগে onboarded ইউজার আবার খুললে সব ধাপ ভরা
- [ ] টাইপ করা মান profile পরে এলেও মুছে যায় না
- [ ] নতুন unit + e2e টেস্ট পাস, পুরোনো সব টেস্ট পাস
- [ ] PR merge

---

## J. Playwright e2e ঠিক করা + CI-তে চালানো

### লক্ষ্য ও কেন
লোকালি ~26টা e2e spec ফেল করে। কারণ PR #46 (real data)-এর আগে টেস্টগুলো demo id ব্যবহার করত, যেমন `/opportunities/opp_bremen_ux_03`, `/professors/prof_baudisch_hpi_06`। এখন এই id-গুলো DB-তে নেই।

আরেকটা গভীর কারণ: detail পেজগুলো (`src/app/opportunities/[id]/page.tsx`, `professors/[id]`, `scholarships/[id]`) **server-এ Prisma দিয়ে** ডেটা পড়ে। `tests/e2e/fixtures.ts`-এর fake backend শুধু **browser-এর** `/api` কল ধরে। তাই server-side ডেটার জন্য একটা **আসল কিন্তু ছোট টেস্ট DB** লাগবে।

e2e ঠিক থাকলে Phase 2-এর বড় কাজগুলোতে কিছু ভাঙলে সাথে সাথে ধরা পড়বে। তাই Phase 2-এর আগে এটা করা।

### ফাইল
| নতুন/বদল | ফাইল | কাজ |
|---|---|---|
| নতুন | `tests/e2e/seed/e2e-data.ts` | ছোট, স্থির ডেটা: 5 স্কলারশিপ, 5 প্রফেসর (+ University), 6 opportunity, 5 পেপার। id-গুলো `e2e_` দিয়ে শুরু। |
| নতুন | `tests/e2e/seed/seed-e2e.ts` | টেস্ট DB খালি করে উপরের ডেটা ঢোকায়। **নিরাপত্তা:** `DATABASE_URL`-এ `neon.tech` থাকলে বা `E2E_DB=1` না থাকলে চালাতেই অস্বীকার করবে। |
| নতুন | `tests/e2e/ids.ts` | `E2E_IDS = { opportunity: 'e2e_opp_hci_berlin', professor: 'e2e_prof_hci', … }`। সব spec এখান থেকে id নেবে, হাতে লেখা id আর থাকবে না। |
| নতুন | `tests/e2e/global-setup.ts` | টেস্ট শুরুর আগে `prisma db push` + `seed-e2e.ts` চালায়। |
| বদল | `playwright.config.ts` | `globalSetup` যোগ; `webServer.env`-এ `DATABASE_URL: process.env.E2E_DATABASE_URL`; `reuseExistingServer: !process.env.CI`। |
| বদল | `tests/e2e/*.spec.ts` (ফেল করা ~26টা) | পুরোনো id → `E2E_IDS`; demo নাম/টেক্সট ("Prof. Baudisch" ইত্যাদি) → seed ডেটার নাম। |
| বদল | `.github/workflows/test.yml` | নতুন `e2e` job (নিচে দেখুন)। |
| বদল | `package.json` | `"test:e2e:db": "…"` (লোকাল টেস্ট DB চালু করার কমান্ড), README/TECH-GUIDE-এ এক লাইন। |
| বদল | `docs/TECH-GUIDE.md`, `docs/QA-REPORT.md` | e2e কীভাবে চালাতে হয়। |

### Schema
Production schema বদলাবে না। টেস্ট DB-তে একই `schema.prisma` push হবে।

### ধাপে ধাপে
1. **আগে তালিকা বানানো (কোড বদলানোর আগে):** `npx playwright test --project=chromium-desktop --reporter=list` চালিয়ে প্রতিটা ফেল করা spec আর কারণ একটা টেবিলে লেখা: (ক) পুরোনো id, (খ) পুরোনো টেক্সট, (গ) server ডেটা নেই, (ঘ) আসল bug। "আসল bug" পেলে আলাদা কাজ হিসেবে জানানো হবে, এই PR-এ ঠিক করা হবে না।
2. **টেস্ট DB:**
   - লোকাল: memory অনুযায়ী `npx prisma dev` লোকাল Postgres আছে। আলাদা database নাম (যেমন `scholarsship_e2e`) ব্যবহার, যাতে dev ডেটা না মোছে। URL `.env.local`-এ `E2E_DATABASE_URL` নামে।
   - CI: GitHub Actions-এর `services: postgres:16` (ফ্রি, প্রতিবার নতুন খালি DB)।
3. **Seed ডেটা লেখা:** `e2e-data.ts`-এ এমন ডেটা যা টেস্টের প্রয়োজন মেটায়: অন্তত একটা HCI PhD (Germany), একটা Masters (Netherlands), একটা deadline ছাড়া, একটা দেশ ছাড়া ("not stated" UI দেখার জন্য), একটা প্রফেসর যার পেপার আছে। ডেটা বানানো হলেও **স্পষ্টভাবে টেস্ট ডেটা** (`example.test` লিংক, নাম "E2E Test Lab")। Production-এ কখনো যাবে না।
4. **`global-setup.ts`:** `E2E_DB=1` সেট করে `prisma db push --skip-generate` তারপর seed।
5. **Spec আপডেট:** ধাপ ১-এর তালিকা ধরে একটা একটা করে। Browser-side mock (`installFakeBackend`) যেমন আছে থাকবে (auth, profile, applications)। শুধু server-rendered অংশ টেস্ট DB থেকে আসবে।
6. **CI job:**
   ```yaml
   e2e:
     runs-on: ubuntu-latest
     timeout-minutes: 20
     services:
       postgres:
         image: postgres:16
         env: { POSTGRES_PASSWORD: postgres, POSTGRES_DB: e2e }
         ports: ['5432:5432']
         options: --health-cmd pg_isready --health-interval 5s --health-retries 10
     env:
       E2E_DATABASE_URL: postgresql://postgres:postgres@localhost:5432/e2e
       CI: 'true'
     steps:
       - checkout, setup-node 22, npm ci
       - npx playwright install --with-deps chromium
       - npx playwright test --project=chromium-desktop --project=chromium-mobile
       - upload-artifact: playwright-report (শুধু ফেল করলে)
   ```
   PR-এ শুধু Chromium (desktop + mobile), যাতে সময় আর GitHub Actions মিনিট কম লাগে। Firefox/WebKit লোকালি বা পরে সপ্তাহে একবার (`schedule`) চালানো যাবে।
7. **Flaky টেস্ট:** `retries: 1` থাকবে। কোনো টেস্ট বারবার flaky হলে `test.fixme` না করে কারণ খুঁজে বের করা।

### ডেটা সোর্স ও আইনি দিক
কোনো বাইরের সোর্স নেই। সব ডেটা টেস্টের জন্য বানানো, `example.test` ডোমেইন।

### টেস্ট
এই কাজটাই টেস্ট। শেষে:
- `npm run test:e2e` লোকালি 4টা project-এ সবুজ (অথবা বাকি ফেলগুলো আলাদা issue-তে লেখা)
- CI-তে `e2e` job সবুজ
- `npm test` (Vitest 305+) আগের মতো সবুজ

### যাচাই
- আগে: ~26 ফেল। পরে: 0 ফেল (Chromium)। PR-এ দুটো সংখ্যাই লেখা থাকবে।
- PR-এর Checks ট্যাবে `Tests / e2e` সবুজ।
- ইচ্ছা করে একটা টেস্ট ভাঙিয়ে (লোকালি) দেখা যে CI সত্যিই লাল হয়, তারপর ফিরিয়ে আনা।

### ঝুঁকি ও rollback
| ঝুঁকি | প্রতিকার |
|---|---|
| ভুল করে production DB-তে e2e seed চলে, আসল ডেটা মুছে যায় | `seed-e2e.ts`-এ দুই স্তরের পাহারা: `E2E_DB=1` লাগবে, আর `neon.tech` host হলে থেমে যাবে। এর জন্য একটা unit টেস্টও থাকবে। |
| CI ধীর হয়ে যায় | শুধু Chromium; `timeout-minutes: 20`; Next build cache। |
| লোকাল dev DB মুছে যায় | আলাদা database নাম (`scholarsship_e2e`)। |
| Rollback | `e2e` job একটা আলাদা job। সমস্যা হলে workflow থেকে job সরিয়ে দিলেই বাকি CI আগের মতো। |

### Token
1.2–1.8 লাখ (26টা spec পড়া আর বদলানো সবচেয়ে বড় অংশ)। খরচ কমাতে: একবারে পুরো ফাইল না পড়ে শুধু ফেল করা লাইনের আশেপাশে পড়া।

### আপনাকে যা করতে হবে
- অনুমতি দেওয়া।
- লোকালি একবার `npx prisma dev` চালু রাখা (Claude বলে দেবে কখন)।
- GitHub-এ কিছু সেট করতে হবে না (টেস্ট DB-র পাসওয়ার্ড গোপন না, শুধু CI-র ভেতরে থাকে)।

### Definition of Done
- [ ] কোনো spec-এ হাতে লেখা পুরোনো demo id নেই (`grep -r "opp_bremen\|prof_baudisch" tests/e2e` খালি)
- [ ] লোকালি Chromium-এ সব e2e পাস
- [ ] CI-তে `e2e` job চালু ও সবুজ
- [ ] Seed স্ক্রিপ্ট production-এ চলতে পারে না (টেস্ট দিয়ে প্রমাণিত)
- [ ] TECH-GUIDE-এ "e2e কীভাবে চালাবেন" লেখা

---

## K. ⭐ Seed স্ক্রিপ্ট cron-এর ডেটা মুছে দেয় (যাচাই + ঠিক করা)

### লক্ষ্য ও কেন
`prisma/seed.ts`-এর `seedOpportunities()`:
```ts
deleteMany({ where: { id: { notIn: opportunities.map(o => o.id) }, source: { not: 'mastodon' } } })
```
মানে: JSON-এ নেই আর source `mastodon` না, এমন সব opportunity মুছে যায়। Bluesky cron-এ আসা নতুন পোস্টের source `bluesky`, আর ওগুলো JSON-এ থাকে না। `prisma/vercel-build.mjs` প্রতিটা **production deploy**-এ seed চালায়, যদি না Vercel-এ `SKIP_DB_SEED=1` থাকে। তাই প্রতিবার merge করলে Bluesky থেকে নতুন আসা পোস্ট মুছে যেতে পারে।

### ধাপে ধাপে
1. **আগে যাচাই (কোড ছাড়া):** Vercel → Settings → Environment Variables-এ `SKIP_DB_SEED` আছে কিনা আপনি দেখে জানাবেন। আর `npm run data:stats` দিয়ে দেখা হবে, DB-তে এমন bluesky পোস্ট আছে কিনা যা JSON-এ নেই।
2. **ঠিক করা:** মুছে ফেলার নিয়ম বদলানো। শুধু **পুরোনো demo source** (`linkedin`, `twitter`, `lab_website`, `web`, `reddit`) মুছবে, cron-এর source (`mastodon`, `bluesky`) কখনো না:
   ```ts
   source: { notIn: ['mastodon', 'bluesky'] }
   ```
   আরও ভালো: `src/lib/ingest/index.ts`-এ একটা `CRON_SOURCES` তালিকা export করা, যাতে নতুন সোর্স (Jobbnorge ইত্যাদি) যোগ হলে seed নিজে থেকেই সেটা রক্ষা করে।
3. `seedResearchPapers()`-এর জন্যও একই নিয়ম লাগবে, কিন্তু সেটা **F**-এর অংশ (নিচে দেখুন)।
4. `data:stats` স্ক্রিপ্ট এই PR-এ যোগ (§১ দেখুন)।

### ফাইল
`prisma/seed.ts`, `src/lib/ingest/index.ts`, নতুন `prisma/report/data-stats.ts`, `package.json`।

### Schema
নেই।

### টেস্ট
Unit টেস্ট: seed-এর delete নিয়ম (`where` অবজেক্ট) একটা ছোট pure function-এ বের করে টেস্ট করা: `bluesky` আর `mastodon` রক্ষা পায়, `linkedin` মোছে।

### যাচাই
Merge-এর পরের production deploy-এর আগে আর পরে `data:stats`: Bluesky-র সংখ্যা কমেনি।

### ঝুঁকি ও rollback
খুব কম। Revert করলে আগের আচরণ।

### Token
20–40 হাজার (data:stats সহ)।

### আপনাকে যা করতে হবে
Vercel-এ `SKIP_DB_SEED` আছে কিনা দেখে জানানো। অনুমতি, রিভিউ।

### Definition of Done
- [ ] Deploy-এর পর cron-এর কোনো পোস্ট মোছে না (আগে/পরে সংখ্যা দিয়ে প্রমাণ)
- [ ] `npm run data:stats` চালু

---

# PHASE 2 (≈ 14–20 লাখ token; সূচি নিচে "Step-by-step সূচি"-তে)

এই তিনটা কাজ [DATA-VISION-5Y.md](DATA-VISION-5Y.md)-এর সাথে এভাবে মেলে:
- **I-1** = L4 (টাকা) স্তর; বছর ১-এর স্কলারশিপ লক্ষ্য 1,500-এর প্রথম ধাপ; পাইপলাইন প্ল্যানের ধাপ 7।
- **G-1** = L1-এর মান বাড়ানো (দেশ ফিল্টার কাজ করবে); পাইপলাইন প্ল্যানের ধাপ 3 (ROR)-এর প্রথম ব্যবহার। পরে AI parser (বছর ১, ধাপ 4) শুধু যেখানে ROR পারে না সেখানে লাগবে, তাই AI খরচ কমবে।
- **F** = L3 (প্রফেসর + সংকেত) স্তর: প্রফেসর এখন কী নিয়ে কাজ করছেন।

প্রতিটা কাজের পর `npm run data:misses` দেখে বোঝা হবে খালি সার্চ কমল কিনা।

---

## I-1. স্কলারশিপ 24 → ~175

### লক্ষ্য ও কেন
এখন মাত্র 24টা স্কলারশিপ, সব হাতে বসানো (`prisma/data/scholarships.ts`)। বেশিরভাগ দেশের স্টুডেন্ট তার নিজের দেশ বা লক্ষ্য দেশের বৃত্তি পাবে না। পৃথিবীর প্রধান **সরকারি** বৃত্তিগুলো (~150) যোগ করলে প্রায় সব দেশের স্টুডেন্টের জন্য কিছু না কিছু থাকবে। এগুলো বছরে একবার বদলায়, তাই হাতে যাচাই করা সম্ভব।

### দুই অংশ
- **I-1a: Importer framework** (একবার, ~1.5–2 লাখ token)
- **I-1b: ব্যাচ** (৪টা ব্যাচ × ~35–40টা, প্রতিটা দুই chunk-এ; প্রতি ব্যাচ ~2–3 লাখ token)

### "Importer framework" মানে কী
সরকারি বৃত্তির কোনো API নেই। তাই "importer" মানে scraper না। মানে হলো **একটা নিয়মবদ্ধ পদ্ধতি**: প্রতিটা বৃত্তি একটা typed ডেটা ফাইলে, স্বয়ংক্রিয় যাচাই (validation), লিংক চেক, আর "কবে শেষবার যাচাই হয়েছে" ট্র্যাক করা।

### ফাইল (I-1a)
| নতুন/বদল | ফাইল | কাজ |
|---|---|---|
| বদল → ফোল্ডার | `prisma/data/scholarships.ts` → `prisma/data/scholarships/index.ts` | সব ব্যাচ একসাথে export করে `SCHOLARSHIPS` দেয় (seed আগের মতোই কাজ করে)। |
| নতুন | `prisma/data/scholarships/_curated.ts` | এখনকার 24টা (কোনো পরিবর্তন ছাড়া সরানো)। |
| নতুন | `prisma/data/scholarships/batch-01-flagship.ts` … `batch-04-*.ts` | প্রতিটা ব্যাচ। |
| নতুন | `prisma/data/scholarships/schema.ts` | `zod` schema: `ScholarshipSeed`-এর প্রতিটা field-এর নিয়ম (id ফরম্যাট `gov-<country>-<slug>`, `officialUrl` আর `sourceUrl` https, `deadline` ISO, `verifiedOn` বাধ্যতামূলক, `fundingAmount`-এ সংখ্যা থাকলে সেটা সোর্সে আছে এমন নোট)। |
| নতুন | `prisma/import/check-scholarships.ts` | (১) zod validation, (২) id ডুপ্লিকেট নেই, (৩) একই `officialUrl` দুবার নেই, (৪) প্রতিটা `officialUrl`/`sourceUrl`-এ HEAD/GET করে 200 আসে কিনা (robots.txt মেনে, 1 req/সেকেন্ড, `ScholarsShip` user-agent), (৫) `verifiedOn` 365 দিনের বেশি পুরোনো হলে সতর্কতা। |
| বদল | `package.json` | `"data:scholarships:check": "tsx prisma/import/check-scholarships.ts"` |
| বদল | `prisma/seed.ts` | `verifiedAt` = `verifiedOn` থেকে। |
| নতুন | `docs/SCHOLARSHIP-VERIFICATION.md` | প্রতিটা বৃত্তি যোগ করার চেকলিস্ট (নিচে)। |
| নতুন | `tests/unit/scholarshipData.test.ts` | সব ফাইল zod পাস করে; id ইউনিক; `countries` আর `specializations` আমাদের catalog-এর মান (`src/data/subjectCatalog.ts`) ব্যবহার করে। |

### Schema (ঐচ্ছিক, I-1a-তে সিদ্ধান্ত)
এখনকার `Scholarship` মডেলে দরকারি প্রায় সব আছে (`officialUrl`, `sourceUrl`, `verifiedAt`, `deadlineEstimated`, `deadlineNote`)। প্রস্তাবিত দুটো **optional** কলাম:
```prisma
/// দেশ যারা বৃত্তি দেয়, e.g. "Japan" (countries = যেখানে পড়া যায়)
providerCountry   String?
/// সোর্সে লেখা থাকলে: কোন দেশের নাগরিকরা আবেদন করতে পারে। খালি = সোর্সে লেখা নেই
eligibleNationalities String[] @default([])
```
কেন: "বাংলাদেশি হিসেবে আমি কোনগুলোতে আবেদন করতে পারি" এটা স্টুডেন্টের প্রথম প্রশ্ন। কিন্তু অনেক সোর্সে লম্বা দেশ-তালিকা থাকে, তাই প্রথম ব্যাচে শুধু যেখানে স্পষ্ট লেখা সেখানেই ভরা হবে।

**Prod db push (schema যোগ করলে):**
1. PR-এ schema বদল রিভিউ।
2. Merge-এর **আগে**, আপনার কম্পিউটারে production URL দিয়ে: `npx prisma db push` (Claude ঠিক কমান্ড দেবে; production URL আপনি নিজে টার্মিনালে দেবেন)। আউটপুটে "data loss" সতর্কতা থাকলে **থামুন**।
3. তারপর merge। Vercel build আবার push করবে (কিছু বদলাবে না), তারপর seed।

### যাচাইয়ের চেকলিস্ট (প্রতিটা বৃত্তি)
1. **শুধু অফিসিয়াল সাইট** (সরকার/দূতাবাস/অফিসিয়াল এজেন্সি)। Scholars4Dev, OpportunityDesk ইত্যাদি শুধু **খুঁজে পাওয়ার** জন্য, তথ্য কপি করা যাবে না।
2. সাইটের robots.txt দেখা। নিষেধ থাকলে Claude পেজ fetch করবে না। তখন আপনি browser-এ খুলে মূল তথ্যগুলো দেবেন, অথবা ওই বৃত্তি পরের জন্য রাখা।
3. যে field সোর্সে নেই, সেটা খালি (`undefined`)। কোনো সংখ্যা (টাকা, GPA, IELTS) অনুমান না।
4. `deadline`: চলতি সাইকেলের তারিখ প্রকাশিত না হলে `deadlineEstimated: true` + `deadlineNote` ("গত বছর ১ নভেম্বর বন্ধ হয়েছিল")।
5. `description` নিজের ভাষায় ছোট সারাংশ (কপি-পেস্ট না, কপিরাইট)।
6. `sourceUrl` = যে পেজ থেকে তথ্য নেওয়া; `verifiedOn` = আজকের তারিখ।
7. ব্যাচ শেষে `npm run data:scholarships:check` সবুজ।

### ব্যাচ পরিকল্পনা (~150টা)
গণনা আনুমানিক। প্রতিটা ব্যাচ শুরুর আগে তালিকা চূড়ান্ত হবে, আর `data:misses` লগে যে দেশ বেশি খোঁজা হয় সেটা আগে আসবে।

| ব্যাচ | Step | থিম | উদাহরণ (প্রধান প্রোগ্রাম, প্রতিটা দেশের ১–৪টা ধরন) | সংখ্যা |
|---|---|---|---|---|
| 01 | 8–9 | **Flagship** (সবচেয়ে বেশি খোঁজা) | Fulbright (Foreign Student), Chevening, Commonwealth (Master's + PhD), DAAD (EPOS, Research Grants, Helmut-Schmidt), MEXT (Research + Master's), CSC (Chinese Government), GKS (Korea, Graduate), Erasmus Mundus (সাধারণ এন্ট্রি; প্রতিটা প্রোগ্রাম পরে L2-তে), Australia Awards, Stipendium Hungaricum, Türkiye Bursları, Eiffel, Swedish Institute (SISGP), Swiss Government Excellence, Holland Scholarship, Manaaki NZ, Vanier/Banting (কানাডা), Gates Cambridge, Rhodes, Clarendon, Marshall | 35–40 |
| 02 | 16–17 | **ইউরোপ বাকি** | Ireland (GOI-IES), Belgium (VLIR-UOS, ARES), Austria (OeAD), Italy (Invest Your Talent / MAECI), Spain (MAEC-AECID যদি চালু), Czech, Slovakia, Poland (NAWA), Finland, Norway (প্রাসঙ্গিক যা আছে), Denmark, Iceland, Estonia, Lithuania, Latvia, Slovenia, Romania, Greece, Portugal, Luxembourg | 35–40 |
| 03 | 18–19 | **এশিয়া + মধ্যপ্রাচ্য + ওশেনিয়া** | Singapore (SINGA, ASEAN), Taiwan (TaiwanICDF, MOE), Thailand (TICA), Malaysia (MIS), Indonesia (KNB), Brunei, India (ICCR), Japan বাকি (JASSO, ADB-JSP), China বাকি (প্রাদেশিক সরকারি), Hong Kong (HKPFS), Saudi (KSU/KAUST নয়, সরকারি), UAE, Qatar, Kuwait, Israel (PBC), Kazakhstan, Australia বাকি (RTP) | 35–40 |
| 04 | 20–21 | **আমেরিকা + আফ্রিকা + আন্তর্জাতিক সংস্থা + বাংলাদেশ** | OAS, Mexico (AMEXCID), Brazil (PEC-PG), Chile, Argentina, South Africa, Egypt, Morocco, Mauritius; World Bank JJ/WBGSP, ADB, IsDB, AKF (Aga Khan), OFID, Mastercard Foundation (সরকারি না, কিন্তু বড়: আলাদা `tags`-এ); বাংলাদেশ: PM Fellowship, NST Fellowship, ICT Division Fellowship (প্রতিটার বর্তমান নাম আর অবস্থা অফিসিয়াল সাইটে যাচাই করে) | 30–40 |

> **নোট:** "Erasmus Mundus" একটা ছাতা প্রোগ্রাম, ২০০+ আলাদা Master's। I-1-এ একটা এন্ট্রি; প্রতিটা প্রোগ্রাম আলাদা করে আনা L2 (প্রোগ্রাম) কাজে, বছর ২-এ।

### ডেটা সোর্স ও আইনি দিক
| ধরন | নিয়ম |
|---|---|
| সরকারি/দূতাবাস সাইট | পাবলিক তথ্য। robots.txt মানা; ধীরে fetch; সারাংশ নিজের ভাষায়; মূল লিংক সবসময় |
| অ্যাগ্রিগেটর (Scholars4Dev, OpportunityDesk, ScholarshipDb) | **শুধু খোঁজার জন্য**; তথ্য কপি না ([DATA-PIPELINE-PLAN.md §৩C](DATA-PIPELINE-PLAN.md)) |
| FindAPhD ইত্যাদি | ব্যবহার না (partnership-only) |

### টেস্ট
- `tests/unit/scholarshipData.test.ts` (zod, ইউনিক id, catalog মান)
- `check-scholarships.ts`-এর link checker-এর জন্য unit টেস্ট (fetch mock করে)
- e2e: J-এর পর, `/?tab=scholarships`-এ ফিল্টার (দেশ, ডিগ্রি) কাজ করে, এমন একটা ছোট টেস্ট (টেস্ট DB-তে)

### যাচাই
- আগে: 24। প্রতিটা ব্যাচের পর: 24 → ~62 → ~100 → ~138 → ~175 (`data:stats`)।
- সাইটে: Scholarships ট্যাবে দেশ = Japan ফিল্টার → MEXT দেখা যায়। একটা কার্ডের "Official site" লিংক কাজ করে।
- `data:misses`-এ স্কলারশিপ-সংক্রান্ত খালি সার্চ কমেছে কিনা।
- ব্যাচ PR-এ ৫টা র‍্যান্ডম এন্ট্রি আপনি নিজে অফিসিয়াল সাইটের সাথে মিলিয়ে দেখবেন (spot check)।

### Production-এ ডেটা যাওয়া
`vercel-build.mjs` production deploy-এ seed চালায়। কিন্তু **যদি Vercel-এ `SKIP_DB_SEED=1` থাকে** (K-এ জানা যাবে), তাহলে merge-এর পর আপনাকে production URL দিয়ে নিজে `npm run db:seed` চালাতে হবে। Claude ঠিক কমান্ড দেবে।

### ঝুঁকি ও rollback
| ঝুঁকি | প্রতিকার |
|---|---|
| ভুল তথ্য (ভুল টাকা/ডেডলাইন) | শুধু অফিসিয়াল সোর্স; `sourceUrl` + `verifiedOn`; আপনার spot check; UI-তে "Official site-এ যাচাই করুন" |
| ডেডলাইন পুরোনো হয়ে যায় | `deadlineEstimated`; `check-scholarships.ts` 365 দিনের পুরোনো `verifiedOn` ধরিয়ে দেয়; বছরে একবার পুনঃযাচাই (DATA-VISION বছর ২) |
| লিংক মরে যায় | link checker; পরে মাসিক cron-এ চালানো যায় |
| কোনো ব্যাচে ভুল | ব্যাচ ফাইল আলাদা। শুধু সেই ফাইল revert করলেই seed সেই এন্ট্রিগুলো মুছে দেবে (seed JSON-এ নেই এমন স্কলারশিপ মোছে) |

### Token
- I-1a framework: 1.5–2 লাখ
- প্রতি ব্যাচ (35–40টা, প্রতিটার জন্য অফিসিয়াল পেজ পড়া): 2–3 লাখ
- **মোট: 10–14 লাখ**
- খরচ কমানোর উপায়: পুরো পেজ না পড়ে শুধু "eligibility / benefits / deadline" অংশ; একই সরকারের একাধিক বৃত্তি এক সাইটে থাকলে একবার পড়া।

### আপনাকে যা করতে হবে
- প্রতিটা ব্যাচের তালিকা অনুমোদন।
- প্রতিটা ব্যাচ PR-এ ৫টা spot check।
- robots.txt নিষেধ করা সাইটের জন্য browser থেকে মূল তথ্য দেওয়া (অথবা বাদ দেওয়ার সিদ্ধান্ত)।
- Schema যোগ হলে merge-এর আগে prod `db push`।

### Definition of Done
- [ ] Framework merge: zod + link checker + টেস্ট + verification doc
- [ ] ৪টা ব্যাচ merge, মোট ~175 (± 10)
- [ ] প্রতিটা এন্ট্রির `officialUrl`, `sourceUrl`, `verifiedAt` আছে
- [ ] `data:scholarships:check` সবুজ
- [ ] Live সাইটে নতুন স্কলারশিপ দেখা যায়, ফিল্টার কাজ করে

---

## G-1. ROR দিয়ে Opportunity-র দেশ/প্রতিষ্ঠান (AI ছাড়া)

### লক্ষ্য ও কেন
288টা opportunity-র **63%-এ দেশ নেই**, **208টায় প্রতিষ্ঠান নেই**। ফলে দেশ ফিল্টার দিলে বেশিরভাগ পোস্ট হারিয়ে যায়। এখন [mastodon.ts:75-95](../src/lib/ingest/mastodon.ts) এ হাতে লেখা ছোট regex তালিকা (`PLACES`, `SHORT_NAMES`) দিয়ে অনুমান হয়।

**ROR** (Research Organization Registry) হলো পৃথিবীর ~1.2 লাখ গবেষণা প্রতিষ্ঠানের ফ্রি তালিকা, প্রতিটার নাম, বিকল্প নাম, সংক্ষিপ্ত নাম আর **দেশ** সহ। পোস্টে "University of Bremen" লেখা থাকলে ROR বলে দেবে এটা Germany। এটা অনুমান না, পোস্টে লেখা নাম থেকে একটা স্বীকৃত ডেটাবেসে মেলানো। তাই "শুধু যা লেখা আছে" নিয়ম মানে।

### ফাইল
| নতুন/বদল | ফাইল | কাজ |
|---|---|---|
| নতুন | `prisma/import/build-ror-index.ts` | ROR dump (Zenodo, JSON) ডাউনলোড করে শুধু দরকারি অংশ রাখে: `type` = education/facility/government/nonprofit (company বাদ), `status = active`; প্রতিটার id, প্রধান নাম, alias, label, acronym, দেশ, শহর। আউটপুট: `prisma/data/ror-index.json` (আনুমানিক কয়েক MB, gzip করা `.json.gz` রাখা যায়)। |
| নতুন | `src/lib/ingest/ror.ts` | `matchInstitution(text) → { rorId, name, country, city } \| undefined`। নিচে নিয়ম। |
| বদল | `src/lib/ingest/mastodon.ts` | `institutionFor`/`countryFor`-এর আগে `matchInstitution` চেষ্টা। না মিললে পুরোনো regex (fallback)। দেশ শুধু তখন ROR থেকে, যখন পোস্টে আলাদা করে দেশ লেখা নেই, বা লেখা দেশ আর ROR দেশ এক। |
| নতুন | `prisma/import/backfill-ror.ts` | এখনকার 288টা (আর DB-র সব) opportunity-তে একবার চালানো। `--dry-run` মোডে শুধু কী বদলাবে তার তালিকা দেখায়। |
| বদল | `package.json` | `"data:ror:build"`, `"data:ror:backfill"` |
| নতুন | `tests/unit/ror.test.ts` | নিচে দেখুন |

### মেলানোর নিয়ম (ভুল কমানোর জন্য কঠোর)
1. Text normalize: ছোট হাতের অক্ষর, accent সরানো (`Universität` → `universitat`), যতিচিহ্ন সরানো।
2. **লম্বা পুরো নাম আগে:** ROR-এর প্রধান নাম আর alias দিয়ে খোঁজা, শব্দের সীমানা মেনে (`\b`)। সবচেয়ে লম্বা মিলটা নেওয়া ("Technical University of Munich" জিতবে "University of Munich"-এর বিরুদ্ধে)।
3. **Acronym (MIT, KTH, EPFL):** শুধু তখন, যখন (ক) পোস্টে বড় হাতের অক্ষরে লেখা, (খ) ROR-এ ওই acronym **একটাই** প্রতিষ্ঠানের, আর (গ) acronym অন্তত 3 অক্ষর। "UCL", "UT" এর মতো অস্পষ্ট acronym (একাধিক প্রতিষ্ঠান) বাদ।
4. **একাধিক আলাদা প্রতিষ্ঠান মিললে** (যেমন পোস্টে দুটো ইউনিভার্সিটির যৌথ পদ): প্রথম উল্লেখ নেওয়া, কিন্তু দেশ দুটো আলাদা হলে দেশ খালি রাখা।
5. **কিছু শব্দ কখনো একা মিলবে না:** "Institute", "College", "Center"।
6. মিল না পেলে `undefined`। জোর করে কিছু বসানো না।

### Schema
```prisma
model Opportunity {
  …
  /// ROR id (https://ror.org/…) যখন প্রতিষ্ঠানের নাম ROR-এ মিলেছে
  rorId          String?
  /// দেশ কোথা থেকে এল: "post" (পোস্টে লেখা) | "ror" (প্রতিষ্ঠানের নাম থেকে)
  countrySource  String?
}
```
কেন: পরে যদি কোনো মিল ভুল প্রমাণিত হয়, শুধু `countrySource = 'ror'` গুলো আবার চালানো যাবে। আর পরে `University` টেবিলের সাথে যোগ করার রাস্তা খোলা থাকে।

**Prod db push:** merge-এর আগে `npx prisma db push` (শুধু দুটো optional কলাম যোগ, data loss নেই)। তারপর merge, তারপর production-এ `npm run data:ror:backfill -- --dry-run`, আউটপুট দেখে আপনার অনুমোদন, তারপর আসল backfill।

### ডেটা সোর্স ও আইনি দিক
- ROR data dump: https://zenodo.org/records/18985120 (DATA-PIPELINE-PLAN-এ লিংক দেওয়া)। **লাইসেন্স CC0** (পাবলিক ডোমেইন), বাণিজ্যিক ব্যবহারও চলে।
- Dump একবার ডাউনলোড, API বারবার কল না। শুরু করার আগে Zenodo-তে সর্বশেষ ভার্সন দেখে নেওয়া।
- Runtime-এ বাইরের কোনো কল নেই, তাই rate limit বা robots-এর প্রশ্ন নেই।

### টেস্ট (`tests/unit/ror.test.ts`)
একটা ছোট fixture ROR index (২০টা প্রতিষ্ঠান) দিয়ে:
- "PhD position at the University of Bremen" → Germany
- "Technical University of Munich" → TUM, "University of Munich" (LMU) না
- "ETH Zürich" (accent সহ) → Switzerland
- "MIT" বড় হাতে → USA; "mit" (জার্মান শব্দ "with") → কিছু না
- "UCL" (অস্পষ্ট) → কিছু না
- দুই দেশের দুই ইউনিভার্সিটি → প্রতিষ্ঠান প্রথমটা, দেশ খালি
- পোস্টে "Netherlands" লেখা কিন্তু ROR বলে Belgium → দেশ পোস্ট থেকে (`countrySource = 'post'`)
- আসল ৩০টা পোস্টের একটা "golden set" (`tests/fixtures/opportunityPosts.ts` থেকে), হাতে লেখা সঠিক উত্তরের সাথে মিল ≥ 90%, আর **কোনো ভুল দেশ না** (খালি থাকা ঠিক আছে, ভুল থাকা না)।

### যাচাই
| মাপ | আগে | লক্ষ্য |
|---|---|---|
| দেশ নেই | 63% (~181) | < 30% |
| প্রতিষ্ঠান নেই | 208 | < 100 |
| ভুল দেশ (৩০টা র‍্যান্ডম হাতে চেক) | ? | 0 |

- `data:stats` আগে আর পরে।
- সাইটে: Opportunities ট্যাবে Germany ফিল্টার → আগের চেয়ে বেশি কার্ড; ৫টা খুলে মূল পোস্টের সাথে মেলানো।
- Backfill-এর `--dry-run` তালিকা PR comment-এ।

### ঝুঁকি ও rollback
| ঝুঁকি | প্রতিকার |
|---|---|
| ভুল মিল (যেমন একই নামের দুই শহরের ইউনিভার্সিটি) | কঠোর নিয়ম + golden set + dry-run রিভিউ। সন্দেহ হলে খালি রাখা |
| ROR index বড়, cron function ধীর | শুধু দরকারি field; একবার লোড করে মেমরিতে রাখা; Vercel function সাইজ সীমা (এখন 5 GB) কোনো সমস্যা না। লোড সময় মেপে PR-এ লেখা |
| Backfill ভুল লেখে | Backfill শুধু **খালি** field ভরে, আগে থেকে থাকা মান কখনো বদলায় না। Rollback: `UPDATE … SET country = '', institution = …, rorId = NULL WHERE countrySource = 'ror'` (স্ক্রিপ্টে `--undo` ফ্ল্যাগ) |

### Token
2–3 লাখ।

### আপনাকে যা করতে হবে
অনুমতি; prod `db push`; dry-run তালিকা দেখে অনুমোদন; ১০টা কার্ড নিজে মিলিয়ে দেখা।

### Definition of Done
- [ ] `ror-index.json` তৈরির স্ক্রিপ্ট আর ফাইল (বা gzip) repo-তে, উৎস ভার্সন লেখা
- [ ] নতুন cron পোস্টে ROR মেলানো চালু
- [ ] পুরোনো সব পোস্টে backfill হয়েছে
- [ ] দেশ-নেই < 30%, ভুল দেশ 0 (৩০টা নমুনায়)
- [ ] টেস্ট পাস

---

## F. নতুন পেপার: OpenAlex 2025–26, প্রতিদিন cron

### লক্ষ্য ও কেন
272টা পেপারের 227টা 2024-এর। স্টুডেন্ট প্রফেসরের পেজে গিয়ে দেখে পুরোনো কাজ, অথচ প্রফেসর কী নিয়ে **এখন** কাজ করছেন সেটাই ইমেইল লেখার জন্য দরকার (L3 সংকেত)। এখন [import-papers.ts](../prisma/import/import-papers.ts) `FROM_DATE = '2024-01-01'` দিয়ে একবার চালানো হয়, আর হাতে `papers.json`-এ লেখা হয়।

### ফাইল
| নতুন/বদল | ফাইল | কাজ |
|---|---|---|
| নতুন | `src/lib/papers/openalex.ts` | `import-papers.ts` থেকে fetch + map লজিক (abstract তৈরি, paperType, authorships) একটা শেয়ার করা মডিউলে আনা, যাতে স্ক্রিপ্ট আর cron একই কোড ব্যবহার করে। |
| বদল | `prisma/import/import-papers.ts` | শেয়ার করা মডিউল ব্যবহার; `FROM_DATE = '2025-01-01'`। |
| নতুন | `src/lib/papers/save.ts` | DB-তে upsert (DOI বা OpenAlex id দিয়ে), `PaperAuthor` লিংক। |
| নতুন | `src/app/api/cron/papers/route.ts` | `/api/cron/opportunities`-এর মতো: `CRON_SECRET` চেক, তারপর গত ১০ দিনে প্রকাশিত/আপডেট হওয়া কাজ আনা (`from_publication_date` আর পরে `from_updated_date` ব্যবহার; প্রথম দিন পুরো 2025–26)। |
| বদল | `vercel.json` | `{ "path": "/api/cron/papers", "schedule": "30 6 * * *" }` (opportunities-এর 30 মিনিট পরে) |
| বদল | `prisma/seed.ts` | **জরুরি:** `seedResearchPapers()` এখন JSON-এ না থাকা সব পেপার মুছে দেয়। বদলে শুধু `importedBy = 'seed'` আর JSON-এ নেই এমনগুলো মুছবে; cron-এর পেপার কখনো না (K-এর মতো)। |
| নতুন | `tests/unit/openalexPapers.test.ts`, `tests/api/cronPapers.test.ts` | নিচে দেখুন |

### Schema
```prisma
model ResearchPaper {
  …
  /// OpenAlex work id (W…), ডুপ্লিকেট এড়াতে
  openAlexId   String?  @unique
  /// "seed" | "cron"
  importedBy   String   @default("seed")
}
```
**Prod db push:** merge-এর আগে। `@unique` কলাম নতুন আর খালি, তাই conflict হবে না। তারপর merge।

### ধাপে ধাপে
1. **শুরুর আগে OpenAlex-এর বর্তমান নিয়ম দেখা:** OpenAlex 2025 থেকে API key আর ব্যবহার-ভিত্তিক সীমা চালু করেছে বলে জানা যায়। Docs (https://docs.openalex.org) দেখে ঠিক করা: ফ্রি সীমা কত, key লাগবে কিনা। Key লাগলে আপনি openalex.org-এ ফ্রি key নিয়ে Vercel-এ `OPENALEX_API_KEY` সেট করবেন (Claude key হাতে নেবে না)।
2. শেয়ার করা মডিউল বানানো, পুরোনো স্ক্রিপ্ট তার উপর চালানো, আউটপুট আগের সাথে মেলানো (refactor নিরাপদ কিনা)।
3. Cron route: 1,520 প্রফেসরের মধ্যে যাদের `openAlexId` আছে, ৫০ জন করে ব্যাচ (~31টা request)। প্রতিটার মাঝে ছোট বিরতি। Vercel function সময় সীমা 300s-এর মধ্যে ভালোভাবেই হবে; তবু ২৪০s পার হলে থেমে পরের দিন বাকিটা (cursor DB-তে বা সহজভাবে প্রতিদিন প্রফেসরের একটা অংশ ঘুরিয়ে)।
4. ফিল্টার: `type` = article / proceedings-article / preprint; abstract ≥ 80 অক্ষর (এখনকার নিয়ম); প্রতি প্রফেসর সর্বোচ্চ ১০টা সাম্প্রতিক।
5. **পুরোনো 2024 পেপার মুছবে না** (প্রফেসরের পেজে ইতিহাস থাকুক), শুধু UI-তে নতুনগুলো আগে দেখাবে (`publishedAt desc`)। চাইলে পরে 2023-এর আগের গুলো সরানো যাবে।
6. প্রথম চালানো: production-এ cron হাতে একবার (Vercel → Cron Jobs → Run) চালিয়ে ফলাফল দেখা।

### ডেটা সোর্স ও আইনি দিক
- OpenAlex: মেটাডেটা **CC0**। পাবলিক API; `mailto` প্যারামিটার আগে থেকেই আছে (polite pool)। Key/সীমা ধাপ ১-এ যাচাই।
- Abstract: OpenAlex inverted index থেকে। কিছু প্রকাশকের abstract কপিরাইট হতে পারে; এখনকার নিয়মই থাকবে (OpenAlex যা দেয় তাই, সাথে DOI লিংক)। চাইলে পরে abstract ছোট করে দেখানো।
- কোনো scraping নেই।

### টেস্ট
- Unit: OpenAlex work → `ResearchPaper` map (abstract পুনর্গঠন, paperType, 2025-এর আগের বাদ, abstract ছাড়া বাদ)।
- API: cron route `CRON_SECRET` ছাড়া 401; ঠিক secret দিলে fake OpenAlex (fetch mock) থেকে ৩টা কাজ upsert হয়; দ্বিতীয়বার চালালে ডুপ্লিকেট হয় না (idempotent)।
- Seed: `importedBy = 'cron'` পেপার seed-এর পর থাকে।

### যাচাই
| মাপ | আগে | লক্ষ্য |
|---|---|---|
| মোট পেপার | 272 | 1,000+ (প্রফেসর সংখ্যার উপর নির্ভর) |
| 2025–26-এর পেপার | ≤ 45 (272 − 227) | মোটের বেশিরভাগ |
| প্রতিদিন নতুন | 0 | > 0 (Vercel log-এ `[cron/papers] … new`) |

- সাইটে: Research ট্যাব আর একটা প্রফেসরের পেজে 2025/2026-এর পেপার উপরে।
- পরের production deploy-এর পর পেপার সংখ্যা কমেনি (seed ঠিক আছে)।

### ঝুঁকি ও rollback
| ঝুঁকি | প্রতিকার |
|---|---|
| OpenAlex সীমা/key লাগে | ধাপ ১-এ আগেই যাচাই; key থাকলে env-এ |
| DB বড় হয়ে যায় (Neon ফ্রি সীমা) | প্রতি প্রফেসর ১০টা সীমা; `data:stats`-এ সাইজ দেখা |
| Seed নতুন পেপার মুছে দেয় | `importedBy` নিয়ম + টেস্ট |
| Rollback | `vercel.json` থেকে cron সরানো (cron বন্ধ); `DELETE … WHERE importedBy = 'cron'` দিয়ে আগের অবস্থা |

### Token
1.5–2.5 লাখ।

### আপনাকে যা করতে হবে
অনুমতি; OpenAlex key লাগলে নেওয়া ও Vercel-এ রাখা; prod `db push`; প্রথম cron হাতে চালিয়ে দেখা।

### Definition of Done
- [ ] Cron প্রতিদিন চলে, log-এ সংখ্যা দেখায়
- [ ] 2025–26-এর পেপার সাইটে দেখা যায়
- [ ] Deploy-এর পর cron-এর পেপার মোছে না
- [ ] টেস্ট পাস

---

# ক্রম, নির্ভরতা আর সময়সূচি

## কাজের ক্রম (dependency)

```
A (পাসওয়ার্ড) ──► সবকিছুর আগে, কারণ নিরাপত্তা
   │
   ├─► B (onboarding bug)        ছোট, স্বাধীন
   ├─► K (seed bug + data:stats) ছোট; F-এর আগে বাধ্যতামূলক
   └─► J (e2e + CI)              Phase 2-এর আগে, যাতে ভাঙন ধরা পড়ে
            │
            ▼
   I-1a (স্কলারশিপ framework) ──► I-1b ব্যাচ 01 → 02 → 03 → 04 (প্রতিটা দুই chunk-এ)
   G-1 (ROR)                     স্বাধীন; K-এর data:stats লাগে
   F (পেপার cron)                K লাগবেই (seed যেন মুছে না দেয়)
```

- B, K, J একে অপরের উপর নির্ভর করে না, কিন্তু **একবারে একটা session** নিয়মে পরপর হবে।
- I-1 ব্যাচ, G-1 আর F আলাদা PR। কোন সপ্তাহে কোনটা, নিচের table-এ।

## Step-by-step সূচি: model, token আর weekly limit

### নিয়ম (আপনার শর্ত)
- এই project-এ প্রতি সপ্তাহে **Claude Pro weekly limit-এর সর্বোচ্চ 50%**। আমরা **45%-এ থামব** (5% বাড়তি)।
- বড় কাজ ভেঙে **chunk** করা: প্রতিটা step ≤ ~1.8 লাখ token, এক session-এ আর এক 5-hour window-এ শেষ হয়।
- **এক step = এক নতুন session।** শুরুতে এই ডকুমেন্টের শুধু ওই অংশ পড়া।

### % হিসাব কীভাবে (2026-10-09-এ মাপা)
- আসল usage (app থেকে): Weekly 32% শেষ, reset **2026-10-15 14:59 UTC** (বাংলাদেশ সময় রাত 8:59)।
- এই planning session (~1.5 লাখ token) চলার সময় weekly 31% → 32%। মানে **1 লাখ ≈ ~1%**।
- একটাই মাপ, তাই নিরাপদে থাকতে দ্বিগুণ ধরা হয়েছে: **1 লাখ token ≈ 2% weekly** (Opus ধরে)। Sonnet/Haiku step-এ আসল খরচ এর চেয়ে কম হওয়ার কথা।
- **প্রতিটা step-এর আগে আর পরে আসল % মাপা হবে।** Step 2-এর পর হিসাব মিলিয়ে দরকার হলে এই table নতুন করে করা হবে। Limit কম পড়লে step পরের সপ্তাহে যাবে, কিন্তু ক্রম বদলাবে না।

### কোন model কেন
| Model | কখন |
|---|---|
| **Opus** | নতুন কিছুর নকশা, বা ভুল হলে ডেটা হারাতে পারে এমন কাজ। সবচেয়ে বেশি limit খায় |
| **Sonnet** | পরিষ্কার নির্দেশ আছে বা একই কাজ বারবার। Opus-এর চেয়ে অনেক কম limit খায় |
| **Haiku** | শুধু ছোট, সহজ কাজ। তথ্য সঠিক রাখা জরুরি এমন কাজে না |

(Fable 5.1 এই plan-এর কোনো কাজে লাগবে না।)

### সপ্তাহ ০: 2026-10-09 → 10-15 (শুরু 32%, থামা ~45%)

| Step | কাজ | Model | Token | Weekly % | মোট (সপ্তাহে) |
|---|---|---|---|---|---|
| 1 | **A:** Neon পাসওয়ার্ড বদলানো (আপনি করবেন, Claude গাইড) | Haiku | ~15 হাজার | 0.3% | 32.3% |
| 2 | **B:** Onboarding bug ঠিক + টেস্ট। ⚖️ আগে-পরে আসল % মাপা | Sonnet | ~40 হাজার | 0.8% | 33.1% |
| 3 | **K:** Seed যেন cron-এর ডেটা না মোছে + `data:stats` | Sonnet | ~30 হাজার | 0.6% | 33.7% |
| 4 | **J-1:** ফেল করা e2e-র তালিকা, টেস্ট DB, seed-e2e, production পাহারা, CI নকশা | **Opus** | ~60 হাজার | 1.2% | 34.9% |
| 5 | **J-2:** ফেল করা spec-এর প্রথম অর্ধেক | Sonnet | ~50 হাজার | 1.0% | 35.9% |
| 6 | **J-3:** বাকি অর্ধেক + CI-তে `e2e` job | Sonnet | ~50 হাজার | 1.0% | 36.9% |
| 7 | **I-1a:** স্কলারশিপ framework (ফোল্ডার, zod, link checker, টেস্ট, verification doc) | **Opus** | ~1.8 লাখ | 3.6% | 40.5% |
| 8 | **ব্যাচ 01 (ক):** ~২০টা flagship (Fulbright, Chevening, DAAD, MEXT, CSC…) | Sonnet | ~1.3 লাখ | 2.6% | 43.1% |
| 9 | **ব্যাচ 01 (খ):** আরও ~১৮টা flagship | Sonnet | ~1.2 লাখ | 2.4% | **45.5% 🛑** |

### সপ্তাহ ১: 2026-10-15 → 10-22 (শুরু 0%)

| Step | কাজ | Model | Token | Weekly % | মোট (সপ্তাহে) |
|---|---|---|---|---|---|
| 10 | **G-1a:** ROR index স্ক্রিপ্ট + নাম মেলানোর কোড + টেস্ট | **Opus** | ~1.3 লাখ | 2.6% | 2.6% |
| 11 | **G-1b:** নতুন পোস্টে চালু + schema (২ কলাম) + backfill dry-run | Sonnet | ~1.0 লাখ | 2.0% | 4.6% |
| 12 | **G-1c:** অনুমোদনের পর live backfill + আগে/পরে সংখ্যা | Sonnet | ~30 হাজার | 0.6% | 5.2% |
| 13 | **F-1:** OpenAlex-এর বর্তমান নিয়ম/সীমা দেখা + paper কোড একজায়গায় | Sonnet | ~70 হাজার | 1.4% | 6.6% |
| 14 | **F-2:** Paper cron + schema + seed-এর মোছার নিয়ম + টেস্ট | **Opus** | ~1.2 লাখ | 2.4% | 9.0% |
| 15 | **F-3:** Live-এ প্রথম run, যাচাই | Sonnet | ~20 হাজার | 0.4% | 9.4% |
| 16 | **ব্যাচ 02 (ক):** ইউরোপ ~২০টা | Sonnet | ~1.3 লাখ | 2.6% | 12.0% |
| 17 | **ব্যাচ 02 (খ):** ইউরোপ ~১৮টা | Sonnet | ~1.2 লাখ | 2.4% | 14.4% |
| 18 | **ব্যাচ 03 (ক):** এশিয়া + মধ্যপ্রাচ্য ~২০টা | Sonnet | ~1.3 লাখ | 2.6% | 17.0% |
| 19 | **ব্যাচ 03 (খ):** আরও ~১৮টা | Sonnet | ~1.2 লাখ | 2.4% | 19.4% |
| 20 | **ব্যাচ 04 (ক):** আমেরিকা + আফ্রিকা ~২০টা | Sonnet | ~1.3 লাখ | 2.6% | 22.0% |
| 21 | **ব্যাচ 04 (খ):** আন্তর্জাতিক সংস্থা + বাংলাদেশ ~১৮টা | Sonnet | ~1.2 লাখ | 2.4% | 24.4% |
| 22 | শেষ সংখ্যা (`data:stats`), TECH-GUIDE আপডেট | Haiku | ~30 হাজার | 0.6% | **25.0% ✅** |

**মোট ≈ 19.4 লাখ token।** সপ্তাহ ০-তে ~13.5%, সপ্তাহ ১-এ ~25% (Opus ধরে হিসাব; Sonnet/Haiku step-এ কম হবে)। কোনো সপ্তাহে 50% পার হয় না।

**Opus মাত্র ৪টা step-এ** (4, 7, 10, 14), Haiku ২টায় (1, 22), বাকি ১৬টা Sonnet।

### চলার নিয়ম
1. Step শুরুর আগে app-এর model selector থেকে table-এর model বেছে নেওয়া। Claude প্রতিটা step-এর আগে মনে করিয়ে দেবে।
2. **5-hour limit 80% পার হলে** chunk গুছিয়ে থামা, reset-এর পর বাকিটা।
3. **সপ্তাহে 45% ছুঁলে** থামা, বাকিটা পরের সপ্তাহে।
4. **Opus-এর কাজ, Sonnet-এর রিভিউ:** Step 4, 7, 10, 14-এর PR Sonnet দিয়ে রিভিউ (Opus দিয়ে আবার রিভিউর চেয়ে সস্তা)।

**Token বাঁচানোর নিয়ম:**
- প্রতিটা কাজে শুধু দরকারি ফাইল পড়া (পুরো repo না)।
- স্কলারশিপের অফিসিয়াল পেজ থেকে শুধু দরকারি অংশ।
- বড় আউটপুট (টেস্ট লগ) ফাইলে রেখে শুধু ফেল করা লাইন দেখা।

---

# শেষ চেকলিস্ট

**Phase 1**
- [ ] A: Neon পাসওয়ার্ড reset, Vercel আপডেট + redeploy, সাইট আর cron চালু (আপনি)
- [ ] B: Onboarding আবার খুললে সব ভরা, PR merge
- [ ] K: Vercel-এ `SKIP_DB_SEED` আছে কিনা জানা; seed cron-ডেটা মোছে না; `data:stats` চালু
- [ ] J: e2e টেস্ট DB + seed, সব spec সবুজ, CI-তে `e2e` job

**Phase 2**
- [ ] I-1a: স্কলারশিপ framework (zod, link checker, verification doc)
- [ ] I-1b: ব্যাচ 01 ☐ 02 ☐ 03 ☐ 04 ☐ → মোট ~175
- [ ] G-1: ROR index + ম্যাচার + backfill; দেশ-নেই < 30%
- [ ] F: পেপার cron চালু, 2025–26 পেপার দেখা যায়, seed মোছে না

**প্রতিটা PR-এ**
- [ ] বাংলা ব্রিফ → আপনার অনুমতি → কোড
- [ ] `tsc`, `lint`, `npm test` (আর J-এর পর e2e) সবুজ
- [ ] Schema বদলালে merge-এর আগে prod `db push`
- [ ] আগে/পরে সংখ্যা PR-এ লেখা
- [ ] Merge-এর পর live সাইটে যাচাই
