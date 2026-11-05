# Brief: AI parser for opportunity posts (country, institution, subject, deadline)

Written 2026-11-05. Not started. Needs the owner's approval of the points under "Decisions needed" before any code.

## Goal
Fill what keyword rules cannot read from a free-text PhD/RA post: **country, institution, subject tags, deadline** (and degree level when the rule missed it). Use a small Claude model, strict JSON, **only values the post states**.

## Why (numbers from production `npm run data:stats`, 2026-10-28, 778 posts; the feed has grown since)
| Missing | Share | Why rules fail |
|---|---|---|
| country | 42% (328) | many posts name no country; ROR already fills the rest |
| institution | 55% (425) | "We're recruiting!", name only in a handle or link |
| subject tag | 73% (565) | subject word is deep in the text, or outside the 21 subjects |
| deadline | 88% (687) | dates written in many ways |
A test on the local DB showed that more keyword rules would fill only about 7% of the missing subject tags, with some wrong ones. That is why this needs a model that reads the post.

## What exists (read these only)
- `src/lib/ingest/mastodon.ts`: `postToOpportunity()`, `countryFor`, `institutionFor`, `rorFor`, `deadlineFor`, `fieldsFor`; `src/lib/ingest/bluesky.ts` converts Bluesky posts into the same shape.
- `src/lib/ingest/ror.ts` (ROR matcher, runs first and stays first) and `prisma/import/backfill-ror.ts` (a good template: `--dry-run`, `--undo`, only fills empty fields).
- `src/data/subjectCatalog.ts` (the 21 `SUBJECTS`), `src/data/countries.ts` (`WORLD_COUNTRIES`, exact `value` strings), `src/lib/opportunityDetails.ts` (`INSTITUTION_NOT_STATED`, `LOCATION_NOT_STATED`).
- `src/app/api/cron/opportunities/route.ts` (daily 06:00 UTC), `saveOpportunities` in `src/lib/opportunities.ts`.
- Opportunity columns: `country`, `countrySource` ("post" | "ror"), `institution`, `rorId`, `subjectTags`, `fieldTags`, `deadline`, `degreeLevels`.
- There is **no AI SDK in `package.json` and no API key anywhere yet.**

## Design
1. **Order of trust:** rules and ROR first; the model only for posts that still have a missing field. A value found by rules or ROR is never overwritten.
2. **Module** `src/lib/ingest/aiParse.ts`: `parsePost(text, postedAt) -> { country?, institution?, subjects[], deadline?, degreeLevels[], evidence }`.
   - One call per post, Claude Haiku (`claude-haiku-5-5`), JSON output, temperature 0, text truncated to about 1,500 characters.
   - Prompt rules: "use only what the post says; if unsure return null; never guess a country from a language or an institution you only recognise by name; copy a short quote of the evidence for each field".
3. **Validation after the model (hard rules, in code, not in the prompt):**
   - `country` must be a `WORLD_COUNTRIES.value`; map aliases (UK, USA, Deutschland) through one table, else drop.
   - `subjects` only from the 21; drop others (do not invent new tags).
   - `deadline` must be a real future date inside the next 18 months, ISO; relative dates ("end of month") resolved from `postedAt` or dropped.
   - `institution` free text, at most 120 characters, must appear in the evidence quote.
   - The evidence quote must be a substring of the post text, else the whole field is dropped.
4. **Provenance:** `countrySource = "ai"` for AI countries; a new nullable `aiParsedAt DateTime?` column (and `aiModel String?`) so every AI-filled row can be listed and undone. (Schema change: needs a production `npx prisma db push`, which the owner runs.)
5. **Cost control:** hash of the text -> cached result (file cache for the backfill, a column or skip-if-`aiParsedAt` for the cron); one try, no retry loop; stop the run if the estimated spend passes a set cap; log tokens used.
6. **Where it runs:** (a) the daily opportunities cron, new posts only (about 20 to 60 a day); (b) a one-time `prisma/import/backfill-ai.ts` with `--dry-run`, `--undo`, `--limit`.

## Steps (one session each, owner approves each)
| Step | Model | Work | Tokens (weekly) |
|---|---|---|---|
| P1 | Opus | `aiParse.ts` with an injected client, prompt, validation, tests with a mocked client and a hand-written golden set of 40 real posts (stored under `tests/fixtures`) | ~3% |
| P2 | Sonnet | `backfill-ai.ts` dry-run on 100 production posts; the owner hand-checks 30 results; target at least 95% of filled fields correct and **no wrong country** | ~1.5% |
| P3 | Sonnet | schema columns, cron integration (new posts), live backfill with `--undo`, before/after `data:stats` | ~2% |
Total about 6 to 7% of a weekly limit, plus the API cost below.

## Decisions needed from the owner
1. **Anthropic API key** (new). The owner creates it, adds `ANTHROPIC_API_KEY` to Vercel (Production) and `.env.local`. Never paste it in chat or a file.
2. **Spend:** how much per month is acceptable? A first dry-run on 100 posts will measure the real cost per post; the cap and the cron stay off until that number is known. (Do not guess prices: read them from the dry run's token counts and the current price page.)
3. **Schema change** (`aiParsedAt`, `aiModel`) and a production `db push` before the cron is switched on.
4. **Quality bar:** wrong values are worse than blanks. Agreed target: at least 95% correct, zero wrong countries in the 30-post check.
5. Should the AI also set `degreeLevels` and `funding` text, or only the four fields above (recommended: only the four).

## Not in scope
Professors and scholarships (already source-checked by hand), changing the ROR matcher, new subjects, translating posts.

## Done when
`data:stats` on production shows country missing below 30%, subject tag missing below 40%, deadline missing below 70% (from the posts' own words), no wrong country in a hand-check of 30 AI-filled rows, spend per month within the agreed cap, and an `--undo` that restores the old values.
