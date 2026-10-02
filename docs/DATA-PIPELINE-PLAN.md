# Data Pipeline Plan / ডেটা পাইপলাইন পরিকল্পনা

**Project:** HighScholar (Scholars' Ship)
**তারিখ / Date:** 2026-10-03
**অবস্থা / Status:** পরিকল্পনা। ফ্রন্টএন্ডের কাজ শেষ হলে বাস্তবায়ন শুরু হবে। / Planned, starts after frontend work.

লক্ষ্য: স্কলারশিপ, PhD/ল্যাব পজিশন, প্রফেসর আর প্রোগ্রামের আসল ডেটা অটোমেটিক সিস্টেমে আনা, যাতে কোনো স্টুডেন্ট কিছু খুঁজতে এসে খালি হাতে না ফেরে।

---

## ১. বর্তমান অবস্থা (Current State)

| Section | Source | Real / Mock |
|---|---|---|
| Scholarships | `src/data/mockData.ts` | ❌ Mock |
| Professors / Labs (default) | `src/data/mockData.ts` | ❌ Mock |
| Professor search | `src/app/api/professors/search/route.ts` → OpenAlex | ✅ Real (শুধু সার্চ করলে, ছবি random) |
| Research papers | `src/app/api/research/search/route.ts` → OpenAlex, fallback `researchPapers.ts` | ✅ Real + mock fallback |
| Opportunity feed | `mockOpportunities.ts` + `src/app/api/opportunities/live/route.ts` → Mastodon | Mix |
| University programs | `src/data/universityPrograms.ts` | ❌ Mock |

**সমস্যা:**
- কোনো automatic update নেই, কোনো cron বা scraper নেই।
- Mastodon sync শুধু "Sync" বাটন চাপলে চলে (5 মিনিট cache)।
- নতুন পোস্ট শুধু ওই ইউজারের **localStorage**-এ থাকে, ডেটাবেসে যায় না।
- Country/degree বের করা হয় keyword অনুমান দিয়ে, তাই প্রায়ই ভুল হয়।
- Prisma-তে `Scholarship` আর `Professor` টেবিল আছে, কিন্তু কোনো কোড এগুলো ব্যবহার করে না।

---

## ২. পাইপলাইনের গঠন (Architecture)

```
Source (API / RSS / ওয়েবসাইট)
   ↓  Vercel Cron → শুধু কাজের তালিকা queue-তে দেয়
Queue (Vercel Queues / Workflow) → worker ছোট ব্যাচে কাজ করে
   ↓  Fetch
   ↓  Change check: page hash আগের মতো হলে থামো (AI খরচ বাঁচে)
   ↓  Duplicate check: URL / content hash
   ↓  AI parse: Claude (Haiku) → JSON
   ↓  Validate: deadline পার হলে বা জরুরি field না থাকলে reject
Postgres (Prisma)
   ↓  API routes
UI: সব ইউজার একই ডেটা দেখে
```

**AI parse যে field বের করবে:** title, university, country, degree (Masters/PhD/Postdoc), subject, funding amount, deadline, requirements (IELTS, GPA), apply link, source URL।

**নতুন পোস্ট এলে:** পোস্ট প্রকাশ হয় → পরের cron run → fetch → নতুন কিনা চেক → parse → DB → ইউজার রিফ্রেশ করলে দেখে। সর্বোচ্চ দেরি = cron interval।

---

## ৩. ডেটা সোর্স (Data Sources)

### A. অফিসিয়াল ফ্রি API বা ডেটাসেট (সবার আগে)

| Source | কী দেয় | ব্যবহার |
|---|---|---|
| ROR | ~1,22,774 প্রতিষ্ঠান, CC0 dump | ১০,০০০ বিশ্ববিদ্যালয়ের মূল তালিকা |
| OpenAlex | Institutions, authors, works | Bulk প্রফেসর আর পেপার |
| CSRankings (GitHub) | CS faculty, homepage, Google Scholar ID | CS প্রফেসর + Scholar লিংক |
| ORCID public API | বর্তমান employment | প্রফেসরের affiliation যাচাই |
| Semantic Scholar | পেপার, সাইটেশন | OpenAlex-এর ব্যাকআপ |
| NSF, NIH RePORTER, UKRI GtR, CORDIS | নতুন grant | ⭐ Grant signal (নিচে দেখুন) |
| College Scorecard | US প্রোগ্রাম (free data.gov key) | প্রোগ্রাম লিস্ট |
| Mastodon, Bluesky | #PhDPositions পোস্ট, লগইন ছাড়া | তাৎক্ষণিক পোস্ট |
| University RSS feeds, AcademicTransfer | চাকরি, studentship | সহজ আর বৈধ |

### B. অফিসিয়াল সাইট, API নেই (AI দিয়ে পেজ থেকে তথ্য বের করা)
- EURAXESS (অফিসিয়াল API বা RSS নেই)
- DAAD Scholarship Database + International Programmes (1,500+ প্রোগ্রাম)
- Erasmus Mundus Catalogue (200+ প্রোগ্রাম)
- সরকারি স্কলারশিপ: Chevening, Commonwealth, Fulbright, MEXT, GKS, CSC, Stipendium Hungaricum, Türkiye Bursları, Australia Awards, Swedish Institute, Swiss Excellence, Holland, Eiffel, Manaaki
- বাংলাদেশি ফেলোশিপ (যেমন PM Fellowship): ম্যানুয়ালি যোগ করতে হবে

### C. অ্যাগ্রিগেটর (শুধু খোঁজার কাজে, কপি করা যাবে না)
ScholarshipDb, FindAPhD, AcademicPositions, Nature Careers, HigherEdJobs, THE Jobs, Scholars4Dev, OpportunityDesk।
নিয়ম: এখান থেকে সুযোগ খুঁজে বের করো → তারপর **মূল বিশ্ববিদ্যালয়ের পেজ** থেকে তথ্য আনো।

### D. বিশ্ববিদ্যালয়ের নিজস্ব পেজ (৫,০০০-১০,০০০)
1. ROR আর OpenAlex থেকে বিশ্ববিদ্যালয়ের তালিকা আর ওয়েবসাইট নেওয়া।
2. `sitemap.xml` পড়ে scholarship, funding, vacancies, PhD positions পেজ খুঁজে বের করা।
3. ⭐ **ATS adapter:** Workday, Interfolio, PeopleAdmin, jobs.ac.uk ধরনের সিস্টেমের জন্য একটা করে adapter বানালে শত শত বিশ্ববিদ্যালয় একসাথে কভার হয়।
4. বাকি পেজগুলো থেকে AI দিয়ে তথ্য বের করা।

### E. কমিউনিটি
- Chrome extension (পরে, LinkedIn অংশ দেখুন)
- স্টুডেন্ট বা প্রফেসরের সাবমিশন, অ্যাডমিন অনুমোদন দেবে
- প্রফেসর claim আর নিজে পোস্ট দেওয়ার পোর্টাল

---

## ৪. ⭐ Grant Signal: "টাকা পেলেই নিয়োগ"

কোনো প্রফেসর নতুন grant পেলে সাধারণত পরের কয়েক মাসের মধ্যে PhD স্টুডেন্ট নেন। NSF, NIH, UKRI আর CORDIS থেকে এই তথ্য ফ্রিতে পাওয়া যায়।
- Grant-কে প্রফেসরের সাথে যুক্ত করা হবে (নাম + প্রতিষ্ঠান → OpenAlex author)।
- UI-তে দেখাবে: *"এই ল্যাব ২ মাস আগে ফান্ড পেয়েছে, এখন ইমেইল করার ভালো সময়"*।
- কোনো পোস্ট না থাকলেও স্টুডেন্ট কাজের একটা পথ পাবে।

---

## ৫. Google Scholar ✅ (করা হবে)

Google Scholar-এর অফিসিয়াল API নেই। নিজে scraping করা যাবে না (ব্লক হয়, terms ভাঙে)।

| স্তর | কী | খরচ |
|---|---|---|
| ১ | OpenAlex + Semantic Scholar থেকে সাইটেশন, h-index, পেপার | ফ্রি |
| ১ | CSRankings থেকে Scholar ID → "View on Google Scholar" লিংক | ফ্রি |
| ২ | **SerpApi** Google Scholar Author API (বৈধ পেইড সার্ভিস) | Developer $50/মাস = 5,000 সার্চ; Production $130/মাস = 15,000 |
| ৩ | প্রফেসর নিজের Scholar লিংক দিয়ে claim করলে "Verified ✓" | ফ্রি |

**SerpApi খরচ কম রাখার নিয়ম:**
- শুধু স্টুডেন্ট কোনো প্রফেসরের পেজ খুললে তখন কল করা হবে (on-demand)।
- ফলাফল DB-তে 30 দিন cache থাকবে।
- OpenAlex-এ ডেটা যথেষ্ট থাকলে SerpApi কল হবে না।

---

## ৬. LinkedIn ⏸️ (পরে, যখন আসল ইউজার আসবে)

**সিদ্ধান্ত (2026-10-03):** এখন কোনো আসল ইউজার নেই, আর LinkedIn-এর কাজটা ঝামেলার। তাই আপাতত বাদ।

**যা কখনো করা যাবে না:** ভুয়া অ্যাকাউন্ট, প্রক্সি, CAPTCHA বাইপাস বা bulk scraping। উদাহরণ: LinkedIn জানুয়ারি 2025-এ Proxycurl-এর বিরুদ্ধে মামলা করে, আর জুলাই 2025-এ কোম্পানিটা বন্ধ হয়ে যায়। আদালত তাদের সব ডেটা মুছে ফেলার নির্দেশ দেয়।

**পরে যে বৈধ উপায়গুলো আছে:**
1. **Chrome extension "Save to Scholars' Ship":** স্টুডেন্ট নিজের অ্যাকাউন্টে যে পোস্ট দেখছে, এক ক্লিকে শুধু সেই পোস্টটা পাঠাবে। কোডে `ChromeExtensionDrawer` আগে থেকেই আছে।
2. **Share বা Paste:** `ImportPostModal` আপগ্রেড করা। পরে PWA বানালে ফোনের Share মেনুতে অপশন দেখাবে।
3. প্রফেসর আর বিশ্ববিদ্যালয় নিজেরা এখানে পোস্ট দেবে।
4. প্রোফাইল লিংক, প্রফেসর claim করলে যাচাই হবে।

---

## ৭. খালি পেজ দেখানো যাবে না (No Dead Ends)

| পরিস্থিতি | যা দেখাবে |
|---|---|
| ০টা রেজাল্ট | কাছাকাছি বিকল্প আর অন্য দেশের অপশন ("Germany-তে নেই, Netherlands-এ ১২টা আছে") |
| এখন কোনো পোস্ট নেই | "আমাকে জানিও" Alert, নতুন কিছু এলে ইমেইল যাবে (Nodemailer আগে থেকেই আছে) |
| খুব নির্দিষ্ট খোঁজ | ওই বিষয়ের প্রফেসর লিস্ট আর grant signal |
| ডেডলাইন পার হয়ে গেছে | পরের সাইকেল কবে খোলে, আর রিমাইন্ডার |
| কিছুই মেলেনি | AI সহকারী, প্রোফাইল দেখে পরামর্শ দেবে |

সার্চ উন্নত করার উপায়:
- Semantic search (`src/lib/semanticSearch.ts` + pgvector)
- বানান ভুল আর প্রতিশব্দ ধরা ("CS" = Computer Science)
- প্রোফাইল match score আর কারণ দেখানো

**"খুঁজে পায়নি" লগ:** কেউ কিছু খুঁজে না পেলে সেটা লগ হবে। এই লগ দেখে ঠিক করা হবে কোন সোর্স যোগ করতে হবে।

---

## ৮. স্কেলের নিয়ম (১০,০০০ বিশ্ববিদ্যালয়ের জন্য)

| Source ধরন | কতক্ষণ পরপর |
|---|---|
| Mastodon, Bluesky, RSS | প্রতি ঘণ্টায় |
| সরকারি স্কলারশিপ, অ্যাগ্রিগেটর | প্রতিদিন |
| বিশ্ববিদ্যালয়ের পেজ | সপ্তাহে একবার |
| প্রোগ্রাম লিস্ট, ROR, OpenAlex bulk | মাসে একবার |

- ফাংশনের সর্বোচ্চ সময় 300s, তাই cron শুধু queue-তে কাজ দেবে আর worker-রা ব্যাচে প্রসেস করবে।
- Page hash আগের মতো থাকলে AI চালানো হবে না।
- robots.txt মেনে চলা, প্রতিটা সাইটে rate limit, User-Agent-এ যোগাযোগের ঠিকানা।
- কোনো Source ভেঙে গেলে বা ০টা রেজাল্ট দিলে অ্যাডমিন অ্যালার্ট পাবে।
- AI খরচের আসল হিসাব ১০০ বিশ্ববিদ্যালয়ের পাইলট চালিয়ে বের করা হবে।

---

## ৯. বাস্তবায়নের ক্রম (প্রতিটা আলাদা ছোট PR)

| # | কাজ | নির্ভর করে |
|---|---|---|
| 1 | DB schema: `University`, `Professor`, `Opportunity`, `Scholarship`, `Source`, `Grant`, `SearchMiss` | – |
| 2 | Mock ডেটা DB-তে seed, UI DB থেকে পড়বে (localStorage বাদ) | 1 |
| 3 | ROR + OpenAlex → ১০,০০০ বিশ্ববিদ্যালয় + প্রফেসর bulk import | 1 |
| 4 | CSRankings Scholar ID + OpenAlex সাইটেশন | 3 |
| 5 | Cron + Queue + Claude parser, Mastodon/Bluesky DB-তে | 1 |
| 6 | Import/Paste আপগ্রেড (DB-তে সেভ, সবাই দেখবে) | 5 |
| 7 | সরকারি স্কলারশিপ, Erasmus, DAAD, RSS, EURAXESS | 5 |
| 8 | ⭐ Grant signal (NSF, NIH, UKRI, CORDIS) | 3 |
| 9 | Google Scholar via SerpApi (on-demand + 30 দিন cache) | 4 |
| 10 | No-dead-end UI + "আমাকে জানিও" Alert + search miss log | 2 |
| 11 | Semantic search + profile matching | 2 |
| 12 | বিশ্ববিদ্যালয়ের পেজ crawl: পাইলট ১০০ → ১,০০০ → ১০,০০০ | 5 |
| 13 | অ্যাডমিন পেজ: সোর্স ম্যানেজ, ভুল এন্ট্রি ঠিক করা | 5 |
| 14 | প্রফেসর claim আর পোস্ট দেওয়ার পোর্টাল | 3 |
| 15 | ⏸️ LinkedIn: Chrome extension (আসল ইউজার এলে) | 5 |

---

## ১০. যা লাগবে (Requirements)

- **Anthropic API key:** Claude Haiku দিয়ে parse
- **Vercel deploy:** Cron আর Queues
- **Postgres + pgvector:** semantic search
- **data.gov API key:** College Scorecard (ফ্রি)
- **SerpApi অ্যাকাউন্ট:** ধাপ 9-এ
- **Chrome Web Store ডেভেলপার অ্যাকাউন্ট:** $5 একবার, শুধু ধাপ 15-এ

---

## ১১. রেফারেন্স (References)

- ROR data dump: https://zenodo.org/records/18985120
- CSRankings: https://github.com/emeryberger/CSRankings
- NSF Award API: https://catalog.data.gov/dataset/nsf-award-search-web-api
- NIH RePORTER: https://api.reporter.nih.gov
- UKRI Gateway to Research: https://www.ukri.org/publications/gateway-to-research-guide/a-guide-to-gateway-to-research/
- CORDIS: https://cordis.europa.eu/projects/en
- College Scorecard API: https://collegescorecard.ed.gov/data/api-documentation/
- Erasmus Mundus Catalogue: https://www.eacea.ec.europa.eu/scholarships/erasmus-mundus-catalogue_en
- DAAD Scholarship Database: https://www2.daad.de/deutschland/stipendium/datenbank/en/21148-scholarship-database
- jobs.ac.uk PhD: https://jobs.ac.uk/categories/phd-scholarships/1
- AcademicTransfer: https://www.academictransfer.com
- Semantic Scholar API: https://api.semanticscholar.org
- SerpApi plans: https://serpapi.com/blog/breakdown-of-serpapis-subscriptions/
- Proxycurl shutdown: https://nubela.co/blog/goodbye-proxycurl/
