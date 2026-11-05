# Scholarships: plan for Steps 17–21 (written 2026-10-29)

> **STATUS: COMPLETE (closed 2026-11-05).** 71 scholarships live in production (from 24). All five rounds were done, plus four extra Europe rounds. "Done when" below is met: 60+ scholarships, every dropped candidate is in `SCHOLARSHIP-BACKLOG.md` with a reason, link checker has no ❌. Further rounds are optional (UvA faculty pages, Luxembourg, Baltics, Greece, ARES, UZH, Stockholm, NUS, NST/Bangabandhu). The text below is the original plan, kept for history.

**Where we are:** 39 scholarships in production (target in the old plan: ~175). Steps 1–16 and 22 of
`EXECUTION-PLAN-PHASE-1-2.md` are done. Steps 17–21 (batch 02 খ, 03, 04) are what is left of that plan.
The old way (a script fetches official pages) fails for most sites: they refuse bots, disallow robots.txt, are
archived, or are not for Bangladeshi students. **New way: read the official page in the built-in browser** (like a
person), one candidate at a time. Details for the agent doing it: `HANDOFF-SCHOLARSHIP-17-21.md`.

## What we learned (so the plan is realistic)
| Try | Candidates | Added | Why the rest were dropped |
|---|---|---|---|
| Step 9, script | ~20 | 2 | pages not fetchable, or eligibility not stated |
| Step 16, script (Europe) | 9 | 0 | robots.txt, 404, Bangladesh not eligible |
| Browser round 1 (GREAT, OGS, Vanier, Rhodes, Manaaki, OeAD) | 6 | 2 | Vanier archived, Rhodes closed + country unknown, Manaaki: Bangladesh not listed, OeAD robots.txt |
| Browser round 2 (CGRS D, Rotary) | 2 | 2 | none |

**Expect about 1 in 3 candidates to become an entry.** The rest are closed, archived, or not open to Bangladesh.
Dropping them is a good result: the student is not shown a scholarship that cannot be applied for.

## Re-scoped plan: 5 rounds, one per old step
Each round: pick ~8–10 candidates from the list below (the user approves the list first), read each in the browser,
write the entries, one PR, user spot-checks 5. About **1.2–2% of weekly tokens per round** (≈ 4–6k tokens per
candidate). Expected: **+4 to +8 entries per round, 60–70 in total** instead of 175. That is the honest target.

| Round | Old step | File | Theme |
|---|---|---|---|
| 1 | 17 | `batch-02-europe.ts` | Europe: university-funded flagships open to all nationalities, then the remaining governments |
| 2 | 18 | `batch-03-asia-me.ts` | Asia-Pacific |
| 3 | 19 | `batch-03-asia-me.ts` | Middle East + the rest of Asia |
| 4 | 20 | `batch-04-americas-africa-intl.ts` | Americas, Africa |
| 5 | 21 | `batch-04-americas-africa-intl.ts` | International bodies + **Bangladesh-based** funders (most useful for our users) |

Start with round 5 and round 1: both are likelier to say "Bangladesh eligible" than Africa or Latin America.

## Candidate lists (ideas, **not facts**; every one must be checked on its official page)
**Round 1, Europe.** University flagships (usually open to everyone, official pages often fetchable): Reach Oxford,
Cambridge Trust, Imperial President's PhD, Edinburgh Global Research, Manchester, UCL Graduate Research, EPFL
excellence fellowships, TUM / LMU / Heidelberg programmes, KU Leuven, Aalto, Helsinki, Lund/KTH. Governments not yet
tried: ARES (Belgium), Denmark, Finland, Czech Republic (developing-country programme), Poland (NAWA Banach,
"Poland My First Choice": needs each call page), Spain (MAEC-AECID, Fundación Carolina), Portugal, Luxembourg (FNR AFR),
Baltics, Greece (IKY), Romania (incoming students), Slovakia (NSP: terms page), Slovenia (Ad futura / government),
Russia (Government scholarship for foreign citizens; Bangladesh has a quota). Already ruled out: VLIR-UOS (Bangladesh not
on the list), Finland (no government scholarship for degree students), OeAD (robots.txt).

**Rounds 2–3, Asia and Middle East.** Singapore (SINGA, NUS/NTU/A*STAR awards), Taiwan (MOE Taiwan Scholarship, MOFA
Taiwan Fellowship, ICDF: window 1 Dec 2026–15 Mar 2027), Korea (NIIED/KGSP other tracks; university GKS-style),
Japan (ADB-Japan programme sits in round 5), Thailand, Indonesia (KNB), India (ICCR, ITEC), Australia (Research
Training Program, Destination Australia), Saudi / UAE / Qatar (MBZUAI, Khalifa, HBKU, KFUPM). Already in: MEXT (3), GKS (2),
CSC, MIS (Malaysia), HKPFS, JDS, Schwarzman, Yenching, KAUST, Türkiye Bursları.

**Round 4, Americas and Africa.** Mexico (AMEXCID), Brazil, Chile, Argentina; Mastercard Foundation Scholars,
Mandela Rhodes (most are Africa-only: check first, expect many drops). US: Humphrey (check Bangladesh), university
fellowships. Already in: Fulbright (Bangladesh), Knight-Hennessy, Pearson, OGS, CGRS D, Rotary.

**Round 5, international and Bangladeshi funders.** ADB-Japan Scholarship Program, Islamic Development Bank
Merit Scholarship (Bangladesh is a member), OPEC Fund, UNESCO fellowships, Commonwealth Shared (in), Bangladesh
government and agency fellowships (ICT Division fellowship, Bangabandhu Fellowship on Science & ICT, NST fellowship,
UGC-linked schemes: check these exist and are current). **Blocked by the schema:** World Bank Joint Japan scholarship,
Aga Khan Foundation: they accept study in many countries and the schema has no "any country" value (see below).

## One schema decision (needs the user's approval before code)
Entries need `countries` (where you study). World Bank JJ/WBGSP and Aga Khan have no fixed list.
Proposal (small): add a catalog value **"Any country"** (`src/data/countries.ts`) that the Country filter treats as a
match for every country, plus a short line in the checker. No database change (the column is a plain list). About 1% of
tokens including tests. Without it, those two stay out (they are listed in `SCHOLARSHIP-BACKLOG.md`).

## Order of work and rules
1. Round 5 first (Bangladesh-relevant), then 1, 2, 3, 4. After each round: PR → user merges → next round.
2. Rule per candidate: **archived or closed? Bangladesh allowed? robots.txt?** in that order, before reading details.
3. Never guess: no amount, deadline or eligibility the page does not state. Unknown deadline → `deadlineEstimated: true`
   with a note. Needs work experience → `requirements.minWorkYears`.
4. Add every dropped candidate and the reason to `SCHOLARSHIP-BACKLOG.md` so nobody checks it twice.
5. Stop a round when the weekly limit is tight; say so in the PR.

## Done when
60+ scholarships in production, the backlog lists every dropped candidate with a reason, and
`npm run data:scholarships:check` shows no ❌ (the three Commonwealth `HTTP 307` links are a checker issue to fix first:
it should follow redirects).
