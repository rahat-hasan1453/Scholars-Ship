# Scholarship backlog: not yet added

Scholarships we looked at but could not add under the official-source rule (`docs/SCHOLARSHIP-VERIFICATION.md`).
Last reviewed: 2026-10-27 (Step 8 PR #64, Step 9 PR #69, Step 16 batch 02a).

## Blocked: bot-block, needs the user to open the page in a browser and share the facts

| Scholarship | Country | Reason |
|---|---|---|
| Vanier Canada Graduate Scholarships | Canada | Official page could not be fetched (skipped in #64) |
| Ontario Graduate Scholarship (OGS) | Canada | Same |
| GREAT Scholarships | UK | Same |
| Rhodes Scholarship | UK | Same |
| Marshall Scholarship | UK | Same |
| Manaaki New Zealand | New Zealand | Same |
| Rotary Peace Fellowships | International | Same |

## Blocked: schema gap

| Scholarship | Reason | Fix |
|---|---|---|
| Joint Japan/World Bank Graduate Scholarship | Bangladesh eligible, but the source gives no study-country list and the schema has no "any country" value | Add an "any country" value to the schema, then add the entry |
| Aga Khan Foundation International Scholarship Programme | Same | Same |

## Blocked: could not verify

| Scholarship | Reason | Retry when |
|---|---|---|
| Taiwan ICDF | Bangladesh eligibility not confirmed (application window 1 Dec 2026 to 15 Mar 2027) | Window opens |
| Norway (government/Quota) | No official page found, Bangladesh eligibility unconfirmed | Look for the official page |
| Denmark (government) | Same | Same |
| SINGA (Singapore) | Official page not reachable | Retry later |
| Orange Knowledge (Netherlands) | Could not verify | Check whether the programme still runs |

## Step 16 (Europe, batch 02a): tried 2026-10-27, nothing verified

| Scholarship | Country | Reason | Retry when |
|---|---|---|---|
| VLIR-UOS ICP Connect | Belgium | Bangladesh is not on the 25-country eligible list | Ruled out unless the list changes |
| OeAD | Austria | `robots.txt` disallows all pages | User opens it in a browser and shares the facts |
| NAWA (Banach, Poland My First Choice) | Poland | Index page has no eligibility, nationality or deadline; needs each programme's own call page | Programme call page found |
| National Scholarship Programme (SAIA) | Slovakia | Page does not say whether Bangladesh can apply (mobility programme; deadline 31 Oct 2026 seen) | Terms page found |
| Romanian Government scholarships | Romania | roburse.ro page covers Romanians studying abroad, not incoming students | Find the incoming-student page |
| Slovenian Government (Ad Futura) | Slovenia | URL tried returned 404 | Find the right page |
| IKY / Greek state scholarships | Greece | Home page has no foreign-student scholarship details | Find the right page |
| MAEC-AECID | Spain | URL tried returned 404 | Find the right page |
| ARES | Belgium | Not fetched | Try |
| Iceland, Estonia, Lithuania, Latvia, Czech Republic, Portugal, Luxembourg, Norway, Denmark | Various | Not tried (stopped to save tokens) | Next session |

## Ruled out
- Finland: no government scholarship for degree students.

## Already handled in `_curated.ts`, no need to re-add
Chevening, Commonwealth (Master's/PhD), Gates Cambridge, Clarendon, Fulbright (Bangladesh), and others. See `prisma/data/scholarships/_curated.ts`.

## Notes
- Re-check the three `sch_commonwealth_*` entries: `cscuk.fcdo.gov.uk` returns HTTP 307 and shows as ❌ in `npm run data:scholarships:check`.
- Hong Kong PhD Fellowship (HKPFS) and Lester B. Pearson are added in PR #69 (not part of this backlog).
