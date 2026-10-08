// Turns public Mastodon posts tagged #PhDPosition, #PhDJobs, … into Opportunity Feed listings.
// Used by prisma/import/import-opportunities.ts (snapshot for the seed) and /api/cron/opportunities (live refresh).
//
// Only what the post says is kept. Anything the post doesn't state (rank, acceptance rate, living cost,
// deadline, …) stays undefined so the UI hides it instead of showing a guess.
import type { DegreeLevel, Opportunity } from '@/types';
import { INSTITUTION_NOT_STATED, LOCATION_NOT_STATED, fundingTagsFor, subjectTagsFor } from '@/lib/opportunityDetails';

export { INSTITUTION_NOT_STATED, LOCATION_NOT_STATED };

const INSTANCES = ['mastodon.social', 'fediscience.org', 'sigmoid.social', 'mstdn.science'];
const TAGS = ['PhDPosition', 'PhDPositions', 'PhDJobs', 'AcademicJobs', 'PhDStudentship', 'FundedPhD'];
const PAGES_PER_TAG = 2;
/** Posts older than this are dropped: most positions are filled within a few months */
export const MAX_AGE_DAYS = 150;

type MastodonPost = {
  id: string;
  uri: string;
  url: string | null;
  created_at: string;
  content: string;
  language: string | null;
  account: { display_name: string; username: string; acct: string; avatar: string; url: string; note?: string };
  tags: { name: string }[];
};

export function htmlToText(html: string): string {
  return html
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/p>\s*<p>/gi, '\n\n')
    .replace(/<[^>]+>/g, '')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, ' ')
    .replace(/[ \t]+/g, ' ')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

// Keyword → Country filter value. Order matters: specific places before generic words.
const PLACES: [RegExp, string][] = [
  [/\b(germany|german|deutschland|berlin|munich|münchen|hamburg|heidelberg|göttingen|gottingen|tübingen|tubingen|freiburg|bonn|dresden|aachen|karlsruhe|stuttgart|leipzig|mainz|cologne|köln|frankfurt|jena|potsdam|darmstadt|max planck|helmholtz|fraunhofer|tu munich|\btum\b|lmu|rwth|kit\b)/i, 'Germany'],
  [/\b(netherlands|dutch|amsterdam|delft|utrecht|leiden|groningen|eindhoven|rotterdam|nijmegen|twente|wageningen|tilburg|maastricht)\b/i, 'Netherlands'],
  [/\b(united kingdom|\buk\b|england|scotland|wales|london|oxford|cambridge|edinburgh|manchester|glasgow|bristol|leeds|sheffield|birmingham|nottingham|southampton|warwick|imperial college|ucl\b|king's college)\b/i, 'United Kingdom'],
  [/\b(switzerland|swiss|zurich|zürich|geneva|lausanne|epfl|eth\b|basel|bern)\b/i, 'Switzerland'],
  [/\b(austria|vienna|wien|graz|innsbruck|linz|ista\b)\b/i, 'Austria'],
  [/\b(france|french|paris|lyon|grenoble|toulouse|marseille|inria|cnrs|sorbonne|bordeaux|strasbourg)\b/i, 'France'],
  [/\b(sweden|swedish|stockholm|uppsala|lund|gothenburg|göteborg|chalmers|kth\b|linköping|umeå)\b/i, 'Sweden'],
  [/\b(denmark|danish|copenhagen|aarhus|dtu\b|odense|aalborg)\b/i, 'Denmark'],
  [/\b(norway|norwegian|oslo|bergen|trondheim|ntnu|tromsø)\b/i, 'Norway'],
  [/\b(finland|finnish|helsinki|aalto|tampere|oulu|turku)\b/i, 'Finland'],
  [/\b(belgium|belgian|leuven|ghent|gent|brussels|antwerp|liège)\b/i, 'Belgium'],
  [/\b(ireland|irish|dublin|galway|cork)\b/i, 'Ireland'],
  [/\b(spain|spanish|madrid|barcelona|valencia|seville|granada|bilbao)\b/i, 'Spain'],
  [/\b(italy|italian|rome|milan|milano|turin|torino|bologna|padova|padua|pisa|naples|trento|florence)\b/i, 'Italy'],
  [/\b(portugal|lisbon|lisboa|porto|coimbra)\b/i, 'Portugal'],
  [/\b(poland|warsaw|kraków|krakow|wrocław|gdańsk)\b/i, 'Poland'],
  [/\b(czech|prague|brno)\b/i, 'Czech Republic'],
  [/\b(canada|canadian|toronto|montreal|montréal|vancouver|waterloo|ottawa|calgary|mcgill|ubc\b|alberta)\b/i, 'Canada'],
  [/\b(australia|australian|sydney|melbourne|brisbane|canberra|adelaide|perth|monash)\b/i, 'Australia'],
  [/\b(new zealand|auckland|wellington|otago)\b/i, 'New Zealand'],
  [/\b(singapore|nus\b|ntu\b)\b/i, 'Singapore'],
  [/\b(japan|tokyo|kyoto|osaka|riken)\b/i, 'Japan'],
  [/\b(korea|seoul|kaist|daejeon)\b/i, 'South Korea'],
  [/\b(usa|united states|u\.s\.|california|stanford|berkeley|mit\b|harvard|new york|boston|seattle|chicago|texas|michigan)\b/i, 'USA'],
];

export function countryFor(text: string): string | undefined {
  return PLACES.find(([re]) => re.test(text))?.[1];
}

const INSTITUTION =
  /((?:\p{Lu}[\p{L}'’&-]+\s+){0,5}(?:University|Universität|Universiteit|Université|Universitat|Institute|Institut|College|Graduate School|Research School|Centre|Center|Laboratory|Max Planck Institute)(?:\s+(?:of|for|in|de|du|für)(?:\s+(?:the\s+)?\p{Lu}[\p{L}'’&-]+){1,4})?)/u;


// Well-known names the generic pattern misses
const SHORT_NAMES = /\b(TU\s+\p{Lu}\p{L}+|ETH Zurich|EPFL|KTH Royal Institute of Technology|KTH|Nikhef|Inria|CNRS|MRC Laboratory of Molecular Biology|EMBL)\b/u;

export function institutionFor(text: string): string | undefined {
  const short = text.match(SHORT_NAMES)?.[1];
  if (short) return short;
  const m = text.match(INSTITUTION)?.[1]?.trim();
  if (!m || m.length < 6 || m.length > 80) return undefined;
  // A lone generic word ("Institute", "the University") isn't a name
  if (!/\s/.test(m) || /^(the|our|a|an|my|this|at)\s/i.test(m)) return undefined;
  return m;
}

const MONTHS = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec'];

/** "Deadline: 15 October 2026", "apply by Oct 15, 2026", "until 30.10.2026" → ISO date */
export function deadlineFor(text: string, postedAt: Date): string | undefined {
  const cue = /(deadline|apply by|apply before|applications? (?:close|due|until|by)|closing date|until|no later than|bis zum)[^\n]{0,40}/gi;
  for (const m of text.matchAll(cue)) {
    const s = m[0];
    let d: Date | null = null;
    const dmy = s.match(/(\d{1,2})(?:st|nd|rd|th)?\.?\s+(jan\w*|feb\w*|mar\w*|apr\w*|may|jun\w*|jul\w*|aug\w*|sep\w*|oct\w*|nov\w*|dec\w*)\.?,?\s+(\d{4})/i);
    const mdy = s.match(/(jan\w*|feb\w*|mar\w*|apr\w*|may|jun\w*|jul\w*|aug\w*|sep\w*|oct\w*|nov\w*|dec\w*)\.?\s+(\d{1,2})(?:st|nd|rd|th)?,?\s+(\d{4})/i);
    const num = s.match(/\b(\d{1,2})[./](\d{1,2})[./](\d{4})\b/);
    const iso = s.match(/\b(\d{4})-(\d{2})-(\d{2})\b/);
    if (dmy) d = new Date(Date.UTC(+dmy[3], MONTHS.indexOf(dmy[2].slice(0, 3).toLowerCase()), +dmy[1], 23, 59));
    else if (mdy) d = new Date(Date.UTC(+mdy[3], MONTHS.indexOf(mdy[1].slice(0, 3).toLowerCase()), +mdy[2], 23, 59));
    else if (iso) d = new Date(Date.UTC(+iso[1], +iso[2] - 1, +iso[3], 23, 59));
    // 30.10.2026 is day.month in Europe, where nearly all these posts come from
    else if (num) d = new Date(Date.UTC(+num[3], +num[2] - 1, +num[1], 23, 59));
    // A real deadline is after the post and within ~18 months of it
    if (d && !Number.isNaN(d.getTime()) && d > postedAt && d.getTime() - postedAt.getTime() < 550 * 86_400_000) {
      return d.toISOString();
    }
  }
  return undefined;
}

/** The funding sentence fragment the post actually uses, or undefined */
export function fundingFor(text: string): string | undefined {
  const patterns = [
    /fully[- ]funded[^.\n]{0,60}/i,
    /full(?:y)? funding[^.\n]{0,60}/i,
    /TV-L\s*E\s?13[^.\n]{0,40}/i,
    /(?:salary|stipend|scholarship)[^.\n]{0,70}(?:€|\$|£|CHF|EUR|USD|GBP|SEK|DKK|NOK)\s?[\d.,]+[^.\n]{0,25}/i,
    /(?:€|\$|£|CHF)\s?[\d.,]+\s?(?:k\b)?[^.\n]{0,40}(?:per|\/)\s?(?:year|month|annum)/i,
    /funded (?:PhD|doctoral|position|studentship)[^.\n]{0,50}/i,
    /(?:paid|salaried) (?:PhD|position)[^.\n]{0,40}/i,
  ];
  for (const re of patterns) {
    const m = text.match(re);
    if (m) {
      const t = m[0].trim().replace(/[,;:(]+$/, '');
      return t.length > 100 ? `${t.slice(0, 100).replace(/\s+\S*$/, '')}…` : t;
    }
  }
  return undefined;
}

const AD_CUE = /\b(position|positions|vacanc|opening|hiring|recruit|apply|application|join (?:us|our|my)|looking for|we are seeking|seeking|offer)/i;

function degreesFor(text: string): DegreeLevel[] {
  const out: DegreeLevel[] = [];
  if (/\b(ph\.?d|doctoral|doctorate|studentship)/i.test(text)) out.push('PhD');
  if (/\bmaster'?s?\b|\bmsc\b|\bm\.sc/i.test(text)) out.push('Masters');
  return out;
}

const FIELD_RULES: [string, RegExp][] = [
  ['Human-Computer Interaction', /\bhci\b|human[- ]computer|interaction design|user experience|\bux\b|cscw/i],
  ['Artificial Intelligence', /artificial intelligence|\bai\b|\bllms?\b|large language model/i],
  ['Machine Learning', /machine learning|deep learning|neural network|reinforcement learning/i],
  ['Computer Vision', /computer vision|image analysis/i],
  ['Natural Language Processing', /natural language|\bnlp\b|computational linguistics/i],
  ['Computer Science', /computer science|informatics|software|algorithm|distributed systems/i],
  ['Data Science', /data science|statistics|data analysis/i],
  ['Robotics', /robot/i],
  ['Cybersecurity', /security|cryptograph|privacy/i],
  ['Bioinformatics', /bioinformatic|computational biology|genomic/i],
  ['Neuroscience', /neuroscien|cognitive science|\bbrain\b/i],
  ['Physics', /physics|astrophysic|astronomy|quantum|plasma|solar/i],
  ['Climate & Environment', /climate|ecolog|environment|earth system|ocean/i],
  ['Chemistry', /chemi(stry|cal)/i],
  ['Biology', /\bbiology|molecular|cell biology|microbio/i],
  ['Economics', /economics|econometric/i],
  ['Social Sciences', /sociolog|political science|social science|anthropolog/i],
  ['Mathematics', /mathemati/i],
  ['Engineering', /engineering/i],
];

function fieldsFor(text: string, tags: string[]): string[] {
  const hay = `${text}\n${tags.join(' ')}`;
  return FIELD_RULES.filter(([, re]) => re.test(hay))
    .map(([f]) => f)
    .slice(0, 4);
}

function titleFor(text: string): string {
  // The first line of a job post is almost always its headline
  const first = text.split('\n').map((l) => l.trim()).find((l) => l.replace(/#\w+/g, '').trim().length >= 15) ?? text;
  const clean = first.replace(/^[^\p{L}\p{N}]+/u, '').replace(/\s+/g, ' ').replace(/[.:]+$/, '').trim();
  return clean.length > 110 ? `${clean.slice(0, 107).replace(/\s+\S*$/, '')}…` : clean;
}

/** The post says it's for a student (PhD / master's) position, not a postdoc or faculty job */
const STUDENT_POSITION =
  /\b(ph\.?d\.?|doctoral)\s*(position|student|candidate|researcher|project|programme|program|opportunit|scholarship|fellowship|studentship|vacanc|opening|in\b)|studentships?\b|fully[- ]funded ph\.?d|master'?s?\s*(student|thesis|position)/i;
const NON_STUDENT_HEADLINE = /\b(postdoc|post-doc|postdoctoral|professor|lecturer|faculty|engineer|research assistant|technician|tenure)/i;

/** Links in the post body, minus hashtag and @mention links */
function linksIn(html: string): string[] {
  return [...html.matchAll(/href="([^"]+)"/g)]
    .map((m) => m[1].replace(/&amp;/g, '&'))
    .filter((u) => /^https?:/.test(u) && !/\/tags?\/|\/@|\/users\//.test(u));
}

/** One Mastodon post → listing, or null when it isn't a student position ad */
export function postToOpportunity(post: MastodonPost, now = new Date()): Opportunity | null {
  const text = htmlToText(post.content);
  if (text.length < 80) return null;
  if (!STUDENT_POSITION.test(text) || !AD_CUE.test(text)) return null;
  const headline = titleFor(text);
  if (NON_STUDENT_HEADLINE.test(headline) && !/ph\.?d|doctoral|studentship/i.test(headline)) return null;
  const postedAt = new Date(post.created_at);
  if (now.getTime() - postedAt.getTime() > MAX_AGE_DAYS * 86_400_000) return null;

  const deadline = deadlineFor(text, postedAt);
  if (deadline && new Date(deadline) < now) return null;

  const degreeLevels = degreesFor(text);
  if (degreeLevels.length === 0) return null;

  const tags = post.tags.map((t) => t.name);
  const fieldTags = fieldsFor(text, tags);
  const funding = fundingFor(text);
  const poster = (post.account.display_name || post.account.username).replace(/:\w+:/g, '').trim();
  const institution = institutionFor(text) ?? INSTITUTION_NOT_STATED;
  const email = text.match(/[\w.+-]+@[\w-]+(?:\.[\w-]+)+/)?.[0]?.replace(/[.,;:)]+$/, '');
  const link = linksIn(post.content)[0];

  return {
    id: `mastodon_${Buffer.from(post.uri).toString('base64url').slice(-24)}`,
    title: headline,
    authorName: poster,
    authorTitle: `@${post.account.acct}`,
    authorAvatar: post.account.avatar || undefined,
    institution,
    country: countryFor(text) ?? LOCATION_NOT_STATED,
    source: 'mastodon',
    sourceUrl: post.url ?? post.uri,
    postedAt: postedAt.toISOString(),
    content: text,
    funding: funding ?? 'Funding not stated in the post',
    fundingTags: funding ? fundingTagsFor(funding) : [],
    degreeLevels,
    fieldTags,
    subjectTags: subjectTagsFor(fieldTags),
    publications: 'none',
    deadline,
    positionDetails: [],
    applySteps: [],
    contactEmail: email,
    officialUrl: link,
  };
}

async function fetchTag(instance: string, tag: string): Promise<MastodonPost[]> {
  const out: MastodonPost[] = [];
  let maxId: string | undefined;
  for (let page = 0; page < PAGES_PER_TAG; page++) {
    const url = `https://${instance}/api/v1/timelines/tag/${tag}?limit=40${maxId ? `&max_id=${maxId}` : ''}`;
    try {
      const res = await fetch(url, { headers: { Accept: 'application/json', 'User-Agent': 'ScholarsShip/1.0 (+opportunity feed)' } });
      if (!res.ok) break;
      const posts = (await res.json()) as MastodonPost[];
      if (!Array.isArray(posts) || posts.length === 0) break;
      out.push(...posts);
      maxId = posts[posts.length - 1].id;
    } catch {
      break;
    }
  }
  return out;
}

/** All current student position ads from the tracked tags, newest first, one per original post */
export async function fetchMastodonOpportunities(now = new Date()): Promise<Opportunity[]> {
  const batches = await Promise.all(INSTANCES.flatMap((i) => TAGS.map((t) => fetchTag(i, t))));
  const byUri = new Map<string, MastodonPost>();
  for (const p of batches.flat()) if (p?.uri && !byUri.has(p.uri)) byUri.set(p.uri, p);
  return [...byUri.values()]
    .map((p) => postToOpportunity(p, now))
    .filter((o): o is Opportunity => o !== null)
    .sort((a, b) => b.postedAt.localeCompare(a.postedAt));
}
