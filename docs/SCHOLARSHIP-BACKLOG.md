# Scholarship backlog: not yet added

Scholarships we looked at but could not add under the official-source rule (`docs/SCHOLARSHIP-VERIFICATION.md`).
Last reviewed: 2026-11-05 (rounds read in the browser; Round 5 added).

## Read in a browser on 2026-10-29 (Option 1)

| Scholarship | Result |
|---|---|
| GREAT Scholarships (UK) | **Added** (`gov-gb-great`): Bangladesh is on the 18-country list |
| Ontario Graduate Scholarship | **Added** (`gov-ca-ogs`); the page does not say if international students may apply |
| Vanier Canada Graduate Scholarships | **Not added: archived.** "No longer accepting applications"; replaced by CGRS D, which **is added** (`gov-ca-cgrs-d`) |
| Rhodes Scholarship | Applications closed; next round opens 2027 (entry 2028). Bangladesh eligibility not found; look for the constituencies page |
| Manaaki New Zealand | Not added: Bangladesh is not on the eligible-countries page |
| Rotary Peace Fellowships | **Added** (master's only, `gov-int-rotary-peace`). The professional certificate programme is not listed |
| Marshall Scholarship | Not tried |
| OeAD (Austria) | Not opened: `robots.txt` disallows all pages |

## Round 5 (2026-11-05): international bodies and Bangladeshi funders

The schema now has "Any country" (`ANY_COUNTRY` in `src/data/countries.ts`), so the two scholarships that were blocked by it are added.

| Scholarship | Result |
|---|---|
| Joint Japan/World Bank (JJ/WBGSP) | **Added** (`gov-int-world-bank-jj`). Bangladesh is on the 2027 list. Window 1 closes 26 Feb 2027; Window 2 dates not read. Amounts are not in the guidelines (PDF), so funding type FULL is a classification, not a quoted figure |
| Aga Khan Foundation ISP | **Added** (`gov-int-aga-khan-isp`). Half grant, half loan; next cycle early 2027, closing date unknown (placeholder) |
| ADB-Japan Scholarship Program | **Added** (`gov-int-adb-japan`). Bangladesh eligible; 2 years' work, age 35 or under; no deadline on the page. Only Japan (17 of 27 institutions) is listed as a study country |
| IsDB scholarship programmes | Not added: the page only introduces four programmes (MSP PhD, MSc, undergraduate ones) with no eligibility, coverage or dates. Open each programme's own page |
| OPEC Fund scholarship | Not added: the URL tried returned 404. Find the current page |
| NST Fellowship, STFT fellowships, Bangabandhu fellowship (MoST, Bangladesh) | Not added: the official pages are empty or built with scripts (`most.gov.bd` shows no text, `grant.most.gov.bd` shows only "MOST"). **You open them in a browser and share the facts** |
| ICT Division fellowship, Prime Minister's fellowship | Not tried (budget) |
| UNESCO fellowships | Not tried; mostly short training |

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
