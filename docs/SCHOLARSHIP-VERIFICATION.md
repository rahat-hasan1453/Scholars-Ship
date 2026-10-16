# Scholarship verification checklist

Every scholarship in `prisma/data/scholarships/` goes through this list. The plan behind it is in
[EXECUTION-PLAN-PHASE-1-2.md › I-1](EXECUTION-PLAN-PHASE-1-2.md).

## Where things go

| File | What's in it |
|---|---|
| `_curated.ts` | The first 24 (ids `sch_…`). Don't change their ids: bookmarks and applications point at them. |
| `batch-NN-<theme>.ts` | One batch per PR, e.g. `batch-01-flagship.ts`. |
| `index.ts` | Puts every file together as `SCHOLARSHIPS`. A new batch file needs one line in `BATCHES`. |
| `schema.ts` | The zod rules (the checker and the tests use them). |

## Before you start a batch

- The batch list is approved by the user.
- Skip anything already in `_curated.ts` or an earlier batch. `npm run data:scholarships:check` fails on a repeated `officialUrl`.
- Every country you need is in `src/data/countries.ts`. If not, add it there first (same `value` everywhere).

## For each scholarship

1. **Official site only**: the government, embassy or official agency page. Scholars4Dev, OpportunityDesk and
   other aggregators are only for *finding* scholarships; never copy facts from them.
2. **robots.txt first.** If it disallows the page, don't fetch it. Ask the user to open it in a browser and give
   the key facts, or leave the scholarship for later.
3. **Only what the source says.** A field the source doesn't state stays out (`undefined`). Never guess an amount,
   GPA, IELTS or deadline. Unknown amounts are described in words ("monthly stipend").
4. **Deadline**: the next closing date a student can still aim for, as ISO (`2026-11-01T23:59:00Z`). If this
   cycle's date isn't published: `deadlineEstimated: true` + `deadlineNote` saying where the date comes from
   ("Closed 1 Nov last year").
5. **`description` in your own words**: a short summary, never copied text.
6. **`sourceUrl`** = the page you read the facts on. **`verifiedOn`** = today (`YYYY-MM-DD`).
7. **`providerCountry`**: the country that funds it (catalog value). Leave out for international bodies.
8. **`eligibleNationalities`**: only when the source lists them. Don't copy very long lists; leave it out and
   describe it in `requirements.notes` instead.

## Field rules (checked by `schema.ts`)

| Field | Rule |
|---|---|
| `id` | `gov-<country code>-<slug>`, lowercase, e.g. `gov-jp-mext-research`. Code from `src/data/countries.ts`; `int` for international bodies (`gov-int-world-bank-jj`). |
| `officialUrl`, `sourceUrl` | `https://` links. |
| `deadline` | ISO date-time. |
| `verifiedOn` | `YYYY-MM-DD`, not in the future. Warned when over a year old. |
| `countries`, `providerCountry` | Values from `src/data/countries.ts`. |
| `specializations` | Values from `src/data/subjectCatalog.ts` or `ALL_FIELDS`. Other words still match the Subject filter, so they're a warning only. |
| `degreeLevels` | `Bachelors`, `Masters`, `PhD` (at least one). |
| `requirements` | `minCgpa` ≤ 10, `minIelts` 0–9, `minToefl` 0–120, `minWorkYears`, `notes`. |

## At the end of a batch

```bash
npm run data:scholarships:check
```

- No ❌ errors. ⚠️ warnings are fine when explained in the PR (e.g. a site that refuses bots: open it in a browser).
- `npm test` passes, and `npm run data:stats` shows the new total after a local `npm run db:seed`.
- In the PR, list 5 random entries for the user to spot-check against the official site.
