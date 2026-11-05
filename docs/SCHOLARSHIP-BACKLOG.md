# Scholarship backlog: not yet added

Scholarships we looked at but could not add under the official-source rule (`docs/SCHOLARSHIP-VERIFICATION.md`).
Last reviewed: 2026-11-05 (rounds read in the browser; Rounds 5, 1 and 2 added).

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

## Round 1, Europe (2026-11-05)

| Scholarship | Result |
|---|---|
| Reach Oxford (undergraduate) | **Added** (`gov-gb-reach-oxford`). Bangladesh on the list; deadline 26 Jan 2027 |
| Cambridge Trust International Scholarship (PhD) | **Added** (`gov-gb-cambridge-international`). Open to all but UK and Ireland; the deadline is the course funding deadline (placeholder date) |
| Imperial President's PhD Scholarships | **Added** (`gov-gb-imperial-presidents-phd`). Next deadline 11 Jan 2027 |
| EPFL Master Excellence Fellowships | **Added** (`gov-ch-epfl-excellence`). 15 Dec; the year is not on the page |
| Czech Government Scholarships for Developing Countries | **Added** (`gov-cz-government-developing`). Bangladesh listed; the 2027/28 call closed 30 Sep 2026, next call assumed the same day |
| Aalto Excellence Scholarship | **Added** (`gov-fi-aalto-excellence`). Tuition waiver only; Bangladesh not named |
| Edinburgh Global Research Scholarships | Not added: the funding pages did not show it (only Edinburgh Doctoral College Scholarships and others, with no details). Look for the Doctoral College page |
| Fundación Carolina (Spain) | Not added: the 2026-27 call closed (Jan to Apr 2026) and the page lists no eligible countries |
| NAWA, Poland My First Choice / Banach | Not added: the page text was almost all navigation; read the "Call for proposals" page |
| Russian Government Scholarship | Not added: `education-in-russia.com` showed only a title. Needs a page with the Bangladesh quota |
| MAEC-AECID (Spain) | Not reached |
| Heidelberg, TUM/LMU, KU Leuven, Lund/KTH, UCL, Manchester, ARES, Denmark, Luxembourg, Baltics, Greece, Romania, Slovakia, Slovenia | Not tried yet |

## Round 2, Asia-Pacific (2026-11-05)

| Scholarship | Result |
|---|---|
| ICCR Suborno Jayanti Scheme (India, for Bangladesh nationals) | **Added** (`gov-in-iccr-suborno-jayanti`). 500 slots, UG/PG/PhD; no dates on the page (placeholder) |
| NTU Nanyang President's Graduate Scholarship (PhD) | **Added** (`gov-sg-ntu-npgs`). Window 1 Nov to 31 Dec 2026 |
| KAIST Scholarship (KGPS/KPS) | **Added** (`gov-kr-kaist-scholarship`). Deadline = admission deadline (placeholder) |
| Taiwan Scholarship (MOE) | **Added** (`gov-tw-moe-taiwan-scholarship`). No dates; Bangladesh not named |
| UTokyo Fellowship | **Added** (`gov-jp-utokyo-fellowship`). 200,000 yen a month; no dates |
| NUS Research Scholarship | Not added: both official pages showed no text to the browser or the fetch tool (script-built). Open it in a browser and share the facts |
| Taiwan ICDF | Not added: Bangladesh is not on the page (it lists the countries ICDF works in); 2027 window is 1 Dec 2026 to 15 Mar 2027 |
| Indonesia KNB | Not added: 2026 cycle was 2 Feb to 31 Mar 2026; the page does not name eligible countries, so Bangladesh is unconfirmed |
| Australian Government RTP | Not added: the page timed out, and RTP places are given out by each university (look at one university's RTP international page) |
| Thailand TICA (Thai International Postgraduate Programme) | Not added: the page is from 2022 and describes 2014 courses; Bangladesh was listed but nothing is current |
| NTU Research Scholarship, other Singapore/Korea/Japan university awards, ITEC (India) | Not tried yet |

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
