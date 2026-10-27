// Golden set for the ROR matcher: 30 fixture posts with their hand-written country.
// Text = the post's institution line + title + body, the way an ingested post reads.
import { OPPORTUNITY_LISTINGS } from './opportunityPosts';

export const ROR_GOLDEN_POSTS = [...OPPORTUNITY_LISTINGS]
  .sort((a, b) => a.id.localeCompare(b.id))
  .slice(0, 30)
  .map((o) => ({ id: o.id, text: `${o.institution}\n${o.title}\n${o.content}`, country: o.country }));
